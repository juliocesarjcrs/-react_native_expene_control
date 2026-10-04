/**
 * Puente entre el backend y la analítica de bienes (lógica pura, sin React).
 * Ubicación: src/utils/commentaryParser/assetData.utils.ts
 *
 * El hook useAssetData solo hace las llamadas de red y delega aquí, así lo que
 * decide qué se cuenta y qué se marca "sin formato" queda cubierto por tests.
 */
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';
import {
  AssetMetrics,
  AssetRecord
} from '~/shared/types/utils/commentaryParser/asset-metrics.types';
import { computeAssetMetrics } from './assetAnalytics';

/** Gasto o ingreso tal como llega del backend. */
export interface RawRecord {
  id: number;
  cost: number;
  commentary?: string | null;
  nature?: string | null;
  date: string;
}

/**
 * Ingreso tal como lo devuelve findIncomesByCategoryId. El monto puede llamarse
 * `cost` o `amount` según el modelo, y en columnas decimales el backend a veces lo
 * manda como texto: se acepta cualquiera y se valida.
 */
export interface IncomeLike {
  id: number;
  commentary?: string | null;
  date: string | Date;
  cost?: number | string | null;
  amount?: number | string | null;
}

/** Convierte un ingreso del backend a RawRecord. Lanza si no trae un monto numérico. */
export const toRawIncome = (i: IncomeLike): RawRecord => {
  const raw = i.cost ?? i.amount;
  // Number(null) y Number('') dan 0: un monto ausente NO debe convertirse en $0
  const missing =
    raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '');
  const cost = missing ? NaN : Number(raw);
  if (!Number.isFinite(cost)) {
    throw new Error(`El ingreso ${i.id} no trae un monto válido (se esperaba "cost" o "amount")`);
  }
  return {
    id: i.id,
    cost,
    commentary: i.commentary ?? '',
    nature: null,
    date: typeof i.date === 'string' ? i.date : i.date.toISOString()
  };
};

export const toAssetRecord = (r: RawRecord): AssetRecord => ({
  id: r.id,
  cost: r.cost,
  commentary: r.commentary ?? '',
  // Solo 'investment' cuenta como capital; cualquier otro valor se trata como operativo
  nature: r.nature === 'investment' ? 'investment' : 'operational',
  date: r.date
});

export interface AnalyzeAssetInput {
  expenses: RawRecord[];
  incomes: RawRecord[];
  /** "YYYY-MM-DD" de hoy */
  asOf: string;
  /** Nombres del bien en [Bien: ...] para filtrar los ingresos de una categoría compartida */
  propertyAliases?: string[];
}

export interface AnalyzeAssetResult {
  metrics: AssetMetrics;
  /** Gastos cuyo comentario no se entiende — para el botón "Editar" */
  unrecognized: ExpenseToEdit[];
}

export const analyzeAsset = ({
  expenses,
  incomes,
  asOf,
  propertyAliases
}: AnalyzeAssetInput): AnalyzeAssetResult => {
  const metrics = computeAssetMetrics({
    expenses: expenses.map(toAssetRecord),
    incomes: incomes.map(toAssetRecord),
    asOf,
    propertyAliases
  });

  // Solo avisos de GASTOS: los ids de ingresos pueden coincidir con los de gastos
  const unparsedIds = new Set(
    metrics.warnings.filter((w) => w.code === 'unparsed' && w.source === 'expense').map((w) => w.id)
  );
  const unrecognized: ExpenseToEdit[] = expenses
    .filter((e) => unparsedIds.has(e.id))
    .map((e) => ({ id: e.id, commentary: e.commentary ?? '', cost: e.cost, date: e.date }));

  return { metrics, unrecognized };
};

/** Fecha local como "YYYY-MM-DD" (sin pasar por UTC). */
export const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
