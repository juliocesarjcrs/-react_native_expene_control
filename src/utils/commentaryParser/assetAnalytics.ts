/**
 * Analítica de bienes: costo, deuda, rentabilidad y recuperación.
 * Ubicación: src/utils/commentaryParser/assetAnalytics.ts
 *
 * Función pura (sin UI ni backend): recibe los gastos e ingresos del bien y devuelve
 * las métricas. La pantalla (Fase 2) solo la llama y dibuja.
 *
 * Reglas:
 *  - El concepto del comentario manda sobre `nature`; `nature` solo se usa cuando el
 *    comentario no se entiende (comentarios viejos) o el concepto "hereda" (4x1000).
 *  - Abono capital NO suma al costo (la compra ya lo incluye) → reduce deuda.
 *  - Depósito en garantía NO es ingreso.
 *  - Ventana de rentabilidad: hasta 12 meses completos, empezando en el primer mes con
 *    arriendo; si son menos de 12 se anualiza (y se avisa). Si el primer arriendo es del
 *    mes en curso (aún no hay ningún mes completo) se usa ese mes como cifra provisional.
 */
import { AssetData } from '~/shared/types/utils/commentaryParser/asset-analysis.types';
import {
  AssetMetrics,
  AssetMonthItem,
  AssetMonthRow,
  AssetRecord,
  AssetWarning,
  ComputeAssetMetricsInput,
  OpexBucket
} from '~/shared/types/utils/commentaryParser/asset-metrics.types';
import { ASSET_CONCEPTS, normalizeAlias, normalizeConceptKey } from './assetConcepts';
import { parseAssetCommentary } from './assetParser';

const OPEX_BUCKETS: OpexBucket[] = [
  'admin',
  'taxes',
  'insurance',
  'repairs',
  'commissions',
  'utilities',
  'other'
];

const emptyBuckets = (): Record<OpexBucket, number> => ({
  admin: 0,
  taxes: 0,
  insurance: 0,
  repairs: 0,
  commissions: 0,
  utilities: 0,
  other: 0
});

// ── Fechas (solo año/mes; sin zona horaria) ──────────────────────────────

const monthIndex = (iso: string): number | null => {
  const m = iso?.match(/^(\d{4})-(\d{2})/);
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null;
};

const monthLabel = (idx: number): string =>
  `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;

/** [índice de mes, monto] — reparte por período (accrual) o usa la fecha de pago. */
const spread = (
  amount: number,
  parsed: AssetData | null,
  date: string,
  basis: 'accrual' | 'cash'
): [number, number][] => {
  if (basis === 'accrual' && parsed?.period) {
    const { period } = parsed;
    const start = period.startYear * 12 + period.startMonth - 1;
    // Con fechas ("15 Oct - 14 Nov") se reparte por días; si no, en partes iguales
    return Array.from({ length: period.months }, (_, i) => [
      start + i,
      amount * (period.weights ? period.weights[i] : 1 / period.months)
    ]);
  }
  const idx = monthIndex(date);
  return idx === null ? [] : [[idx, amount]];
};

/** Cubeta de un reembolso a partir del texto ("administración Mar 2026" → admin). */
const bucketFromText = (text: string): OpexBucket => {
  const t = normalizeConceptKey(text);
  if (t.includes('administraci')) return 'admin';
  if (t.includes('predial') || t.includes('impuesto')) return 'taxes';
  if (t.includes('seguro')) return 'insurance';
  if (t.includes('mantenimiento') || t.includes('reparacion')) return 'repairs';
  if (t.includes('comision')) return 'commissions';
  if (t.includes('servicio')) return 'utilities';
  return 'other';
};

type Classified =
  | {
      kind: 'cost';
      costKind: 'purchase' | 'acquisitionCosts' | 'improvement' | 'unclassified';
    }
  | { kind: 'debtRepayment' }
  | { kind: 'interest' }
  | { kind: 'opex'; bucket: OpexBucket };

const BUCKET_TO_OPEX: Partial<Record<string, OpexBucket>> = {
  admin: 'admin',
  taxes: 'taxes',
  insurance: 'insurance',
  repairs: 'repairs',
  commissions: 'commissions',
  utilities: 'utilities',
  other: 'other'
};

const classifyExpense = (
  rec: AssetRecord,
  parsed: AssetData | null,
  warnings: AssetWarning[]
): Classified => {
  const byNature = (): Classified =>
    rec.nature === 'investment'
      ? { kind: 'cost', costKind: 'unclassified' }
      : { kind: 'opex', bucket: 'other' };

  if (!parsed) {
    warnings.push({
      code: 'unparsed',
      id: rec.id,
      source: 'expense',
      message: `Comentario sin formato (se clasifica por naturaleza): "${rec.commentary}"`
    });
    return byNature();
  }

  if (parsed.direction === 'income') {
    warnings.push({
      code: 'wrongDirection',
      id: rec.id,
      source: 'expense',
      message: `"${rec.commentary}" es un concepto de ingreso dentro de un gasto`
    });
    return byNature();
  }

  const info = ASSET_CONCEPTS[parsed.concept];

  if (info.expectedNature && info.expectedNature !== rec.nature) {
    warnings.push({
      code: 'natureMismatch',
      id: rec.id,
      source: 'expense',
      message: `"${info.label}" suele ser ${info.expectedNature} pero está guardado como ${rec.nature}`
    });
  }
  if (info.recurring && !parsed.period) {
    warnings.push({
      code: 'missingPeriod',
      id: rec.id,
      source: 'expense',
      message: `"${info.label}" sin período con año — se usa la fecha de pago`
    });
  }

  if (parsed.concept === 'principalPayment') return { kind: 'debtRepayment' };
  if (parsed.concept === 'interest') return { kind: 'interest' };

  if (info.capitalRole === 'cost') {
    const costKind =
      parsed.bucket === 'purchase'
        ? 'purchase'
        : parsed.bucket === 'improvement'
          ? 'improvement'
          : 'acquisitionCosts';
    return { kind: 'cost', costKind };
  }

  // 4x1000 y similares: hereda la nature guardada en el gasto
  if (info.expectedNature === null) {
    return rec.nature === 'investment'
      ? { kind: 'cost', costKind: 'acquisitionCosts' }
      : { kind: 'opex', bucket: 'other' };
  }

  return { kind: 'opex', bucket: BUCKET_TO_OPEX[parsed.bucket] ?? 'other' };
};

type MonthAcc = {
  rent: number;
  opex: Record<OpexBucket, number>;
  interest: number;
  items: AssetMonthItem[];
};

/** "Servicios: Agua 17 Ago - 14 Sep 2026" — texto corto para el detalle del mes */
const itemLabel = (rec: AssetRecord, parsed: AssetData | null): string => {
  const text = (
    parsed ? `${ASSET_CONCEPTS[parsed.concept].label}: ${parsed.detail}` : rec.commentary
  ).trim();
  return text.length > 70 ? `${text.slice(0, 67)}…` : text;
};

export const computeAssetMetrics = (input: ComputeAssetMetricsInput): AssetMetrics => {
  const {
    expenses,
    incomes,
    asOf,
    basis = 'accrual',
    includeCurrentMonth = false,
    propertyAliases
  } = input;
  const warnings: AssetWarning[] = [];

  const months = new Map<number, MonthAcc>();
  const acc = (idx: number): MonthAcc => {
    let m = months.get(idx);
    if (!m) {
      m = { rent: 0, opex: emptyBuckets(), interest: 0, items: [] };
      months.set(idx, m);
    }
    return m;
  };

  // ── Gastos ──────────────────────────────────────────────────────────────
  const cost = {
    purchase: 0,
    acquisitionCosts: 0,
    improvements: 0,
    unclassified: 0
  };
  let interestPaid = 0;
  let principalPaid = 0;
  let hasLoan = false;
  const balances: { date: string; balance: number }[] = [];
  let deed: { date: string; value: number } | null = null;

  for (const rec of expenses) {
    if (monthIndex(rec.date) === null)
      warnings.push({
        code: 'badDate',
        id: rec.id,
        source: 'expense',
        message: `Fecha no reconocida (${rec.date}): cuenta en el costo pero no en los meses`
      });
    const parsed = parseAssetCommentary(rec.commentary, rec.cost, rec.date);
    const c = classifyExpense(rec, parsed, warnings);
    const date = rec.date.slice(0, 10);

    if (parsed?.deedValue !== undefined && (!deed || date >= deed.date))
      deed = { date, value: parsed.deedValue };

    if (parsed?.debtBalance !== undefined && (c.kind === 'interest' || c.kind === 'debtRepayment'))
      balances.push({ date, balance: parsed.debtBalance });

    switch (c.kind) {
      case 'cost':
        if (c.costKind === 'purchase') cost.purchase += rec.cost;
        else if (c.costKind === 'acquisitionCosts') cost.acquisitionCosts += rec.cost;
        else if (c.costKind === 'improvement') cost.improvements += rec.cost;
        else cost.unclassified += rec.cost;
        break;
      case 'debtRepayment':
        hasLoan = true;
        principalPaid += rec.cost;
        break;
      case 'interest':
        hasLoan = true;
        interestPaid += rec.cost;
        for (const [idx, amt] of spread(rec.cost, parsed, rec.date, basis)) {
          acc(idx).interest += amt;
          acc(idx).items.push({
            id: rec.id,
            source: 'expense',
            kind: 'interest',
            label: itemLabel(rec, parsed),
            amount: amt,
            total: rec.cost
          });
        }
        break;
      case 'opex':
        for (const [idx, amt] of spread(rec.cost, parsed, rec.date, basis)) {
          acc(idx).opex[c.bucket] += amt;
          acc(idx).items.push({
            id: rec.id,
            source: 'expense',
            kind: 'opex',
            label: itemLabel(rec, parsed),
            amount: amt,
            total: rec.cost
          });
        }
        break;
    }
  }

  // ── Ingresos ────────────────────────────────────────────────────────────
  let depositsHeld = 0;
  // Categoría compartida ("Arriendos"): solo cuentan los ingresos con [Bien: ...] del bien
  const aliasSet = new Set((propertyAliases ?? []).map(normalizeAlias).filter(Boolean));
  const filterByProperty = aliasSet.size > 0;
  let unassignedIncomes = 0;

  for (const rec of incomes) {
    const parsed = parseAssetCommentary(rec.commentary, rec.cost, rec.date);

    if (filterByProperty) {
      if (!parsed || !parsed.property) {
        unassignedIncomes++; // sin formato o sin [Bien: ...]: no se sabe de cuál bien es
        continue;
      }
      if (!aliasSet.has(normalizeAlias(parsed.property))) continue; // es de otro bien
    }

    if (monthIndex(rec.date) === null)
      warnings.push({
        code: 'badDate',
        id: rec.id,
        source: 'income',
        message: `Fecha no reconocida (${rec.date}): el ingreso no entra a los meses`
      });
    if (!parsed) {
      warnings.push({
        code: 'unparsed',
        id: rec.id,
        source: 'income',
        message: `Ingreso sin formato (no se cuenta): "${rec.commentary}"`
      });
      continue;
    }
    if (parsed.direction === 'expense') {
      warnings.push({
        code: 'wrongDirection',
        id: rec.id,
        source: 'income',
        message: `"${rec.commentary}" es un concepto de gasto dentro de un ingreso (no se cuenta)`
      });
      continue;
    }
    if (ASSET_CONCEPTS[parsed.concept].recurring && !parsed.period) {
      warnings.push({
        code: 'missingPeriod',
        id: rec.id,
        source: 'income',
        message: `"${ASSET_CONCEPTS[parsed.concept].label}" sin período con año — se usa la fecha`
      });
    }

    switch (parsed.concept) {
      case 'rentIncome':
        for (const [idx, amt] of spread(rec.cost, parsed, rec.date, basis)) {
          acc(idx).rent += amt;
          acc(idx).items.push({
            id: rec.id,
            source: 'income',
            kind: 'rent',
            label: itemLabel(rec, parsed),
            amount: amt,
            total: rec.cost
          });
        }
        break;
      case 'reimbursement': {
        const bucket = bucketFromText(parsed.detail);
        for (const [idx, amt] of spread(rec.cost, parsed, rec.date, basis)) {
          acc(idx).opex[bucket] -= amt;
          acc(idx).items.push({
            id: rec.id,
            source: 'income',
            kind: 'reimbursement',
            label: itemLabel(rec, parsed),
            amount: -amt,
            total: rec.cost
          });
        }
        break;
      }
      case 'securityDeposit':
        depositsHeld += rec.cost;
        break;
      default:
        warnings.push({
          code: 'ignored',
          id: rec.id,
          source: 'income',
          message: `"${ASSET_CONCEPTS[parsed.concept].label}" todavía no se incluye en el análisis`
        });
    }
  }

  if (unassignedIncomes > 0) {
    warnings.push({
      code: 'unassignedIncome',
      source: 'income',
      message: `${unassignedIncomes} ingreso(s) de la categoría no indican el bien con [Bien: ...] (o no tienen formato) y no se cuentan en ningún bien`
    });
  }

  // ── Costo y deuda ───────────────────────────────────────────────────────
  const total = cost.purchase + cost.acquisitionCosts + cost.improvements + cost.unclassified;
  const paidTowardPrice = cost.purchase + cost.unclassified;

  let balance: number | null = null;
  let balanceDate: string | null = null;
  if (balances.length > 0) {
    const latest = balances.reduce((a, b) => (b.date > a ? b.date : a), balances[0].date);
    balance = Math.min(...balances.filter((b) => b.date === latest).map((b) => b.balance));
    balanceDate = latest;
  }
  if (hasLoan && balance === null) {
    warnings.push({
      code: 'debtBalanceMissing',
      message: 'Hay pagos del préstamo pero ningún [Saldo $...]: no se puede calcular la deuda'
    });
  }
  const debtKnown = !hasLoan || balance !== null;
  const equity = !debtKnown ? null : Math.max(total - (hasLoan ? (balance as number) : 0), 0);

  // ── Serie mensual (continua hasta el mes de asOf) ───────────────────────
  const asOfIdx = monthIndex(asOf) ?? 0;
  const known = [...months.keys()];
  const firstIdx = known.length ? Math.min(...known) : asOfIdx;
  const lastIdx = Math.max(asOfIdx, ...known.filter((k) => k <= asOfIdx));
  const monthly: AssetMonthRow[] = [];
  for (let idx = firstIdx; idx <= lastIdx; idx++) {
    const m = months.get(idx) ?? {
      rent: 0,
      opex: emptyBuckets(),
      interest: 0,
      items: []
    };
    const opexTotal = OPEX_BUCKETS.reduce((s, b) => s + m.opex[b], 0);
    monthly.push({
      month: monthLabel(idx),
      rent: m.rent,
      opex: m.opex,
      opexTotal,
      interest: m.interest,
      net: m.rent - opexTotal,
      items: [...m.items].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
      netAfterInterest: m.rent - opexTotal - m.interest
    });
  }

  // ── Ventana de rentabilidad ─────────────────────────────────────────────
  const rentIdx = [...months.entries()].filter(([, m]) => m.rent > 0).map(([i]) => i);
  const firstRent = rentIdx.length ? Math.min(...rentIdx) : null;
  // Primer arriendo en el mes en curso: no hay meses completos → se usa el mes en curso
  const provisional = !includeCurrentMonth && firstRent === asOfIdx;
  const windowEnd = includeCurrentMonth || provisional ? asOfIdx : asOfIdx - 1;
  let windowStart = windowEnd - 11;
  if (firstRent !== null) windowStart = Math.max(windowStart, firstRent);
  const windowMonths = Math.max(windowEnd - windowStart + 1, 0);
  const annualized = windowMonths > 0 && windowMonths < 12;
  const factor = windowMonths > 0 ? 12 / windowMonths : 0;

  const inWindow = monthly.filter((r) => {
    const idx = Number(r.month.slice(0, 4)) * 12 + Number(r.month.slice(5)) - 1;
    return idx >= windowStart && idx <= windowEnd;
  });
  const sum = (f: (r: AssetMonthRow) => number) => inWindow.reduce((s, r) => s + f(r), 0) * factor;

  const opexByBucket = emptyBuckets();
  for (const b of OPEX_BUCKETS) opexByBucket[b] = sum((r) => r.opex[b]);
  const rent = sum((r) => r.rent);
  const opex = sum((r) => r.opexTotal);
  const interest = sum((r) => r.interest);
  const net = rent - opex;
  const netAfterInterest = net - interest;

  if (annualized && rentIdx.length > 0) {
    warnings.push({
      code: 'annualized',
      message: provisional
        ? 'Solo hay el mes en curso con arriendo: cifras provisionales, proyectadas a 12 meses'
        : `Solo ${windowMonths} mes(es) con arriendo: las cifras anuales están proyectadas`
    });
  }

  // ── Rentabilidad y recuperación ─────────────────────────────────────────
  const hasRent = rent > 0 && total > 0;
  const yields = {
    gross: hasRent ? rent / total : null,
    net: hasRent ? net / total : null,
    netAfterInterest: hasRent ? netAfterInterest / total : null,
    onEquity: hasRent && equity !== null && equity > 0 ? netAfterInterest / equity : null
  };
  const payback = {
    years: hasRent && net > 0 ? total / net : null,
    equityYears:
      hasRent && equity !== null && equity > 0 && netAfterInterest > 0
        ? equity / netAfterInterest
        : null
  };

  return {
    cost: {
      ...cost,
      total,
      deedValue: deed ? deed.value : null,
      paidTowardPrice,
      purchaseGap: deed ? deed.value - paidTowardPrice : null
    },
    debt: {
      hasLoan,
      balance: hasLoan ? balance : 0,
      asOfDate: balanceDate,
      interestPaid,
      principalPaid
    },
    equity,
    depositsHeld,
    monthly,
    window: {
      start: windowMonths > 0 ? monthLabel(windowStart) : null,
      end: monthLabel(windowEnd),
      months: windowMonths,
      annualized,
      provisional
    },
    annual: {
      rent,
      opex,
      opexByBucket,
      interest,
      net,
      netAfterInterest,
      averageMonthlyNet: net / 12
    },
    yields,
    payback,
    warnings
  };
};
