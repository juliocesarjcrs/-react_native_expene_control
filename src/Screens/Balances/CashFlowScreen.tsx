import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Icon } from 'react-native-elements';
import { useQuery } from '@apollo/client/react';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

// Redux
import { selectSelectedMonth } from '~/features/period/periodSelectors';
import { Month } from '~/features/period/periodSlice';

// Services
import { getSavingsByUser, getUpdateAllSavingsByUser } from '../../services/savings';

// Graphql
import { GET_LOANS } from '../../graphql/queries';

// Components
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import CashFlowLineChart from './components/CashFlowLineChart';
import CheckBoxOptions from '../../components/checbox/CheckBoxOptions';
import ModernTable from '~/components/tables/ModernTable';
import { ScreenHeader } from '~/components/ScreenHeader';
import { SavingsAnalysisCard } from './components/SavingsAnalysisCard';

// Types
import { FinancialRecord, GetSavingsByUserResponse } from '../../shared/types/services';
import { BalanceStackParamList } from '../../shared/types';
import { GetLoanResult } from '../../shared/types/graphql';

// Utils
import {
  calculateAverage,
  DateFormat,
  filterLimitDataForGraph,
  getDateStartOfMonth,
  NumberFormat
} from '../../utils/Helpers';
import { showError } from '~/utils/showError';

// Hooks
import { useAppSelector } from '~/store/hooks';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type CashFlowScreenNavigationProp = StackNavigationProp<BalanceStackParamList, 'cashFlow'>;

interface CashFlowScreenProps {
  navigation: CashFlowScreenNavigationProp;
}

type Loans = GetLoanResult['loans'];

// Datos crudos junto con la petición para la que se cargaron
type FetchedData = {
  key: string;
  data: GetSavingsByUserResponse | null;
};

type CashFlowView = {
  totalExpenses: number;
  totalIncomes: number;
  totalSavings: number;
  dataExpenses: number[];
  dataIncomes: number[];
  dataSavings: number[];
  averageExpenses: number;
  previousAverageExpenses: number;
  averageIncomes: number;
  previousAverageIncomes: number;
  sumPreviousSavings: number;
  labels: string[];
  tableData: string[][];
  historySavings: number[];
};

const DEFAULT_NUM_MONTHS = 4;
const LOAN_TYPE_BASE = 1;

const EMPTY_VIEW: CashFlowView = {
  totalExpenses: 0,
  totalIncomes: 0,
  totalSavings: 0,
  dataExpenses: [0],
  dataIncomes: [0],
  dataSavings: [0],
  averageExpenses: 0,
  previousAverageExpenses: 0,
  averageIncomes: 0,
  previousAverageIncomes: 0,
  sumPreviousSavings: 0,
  labels: [''],
  tableData: [],
  historySavings: []
};

const sum = (values: number[]): number => values.reduce((acu, val) => acu + val, 0);

// Calcula tabla, gráficas y totales a partir de los datos crudos
const buildCashFlowView = (
  raw: GetSavingsByUserResponse | null,
  excludeInv: boolean,
  numMonths: number,
  month: Month
): CashFlowView => {
  if (!raw) return EMPTY_VIEW;

  const rows = filterLimitDataForGraph<FinancialRecord>(raw.data, numMonths);
  const getSaving = (e: FinancialRecord) => (excludeInv ? e.operationalSaving : e.saving);

  // Tabla
  const percentOf = (e: FinancialRecord) => (e.income > 0 ? (getSaving(e) * 100) / e.income : 0);
  const meanPercent = rows.length > 0 ? Math.round(sum(rows.map(percentOf)) / rows.length) : 0;
  const meanValue = rows.length > 0 ? sum(rows.map(getSaving)) / rows.length : 0;

  const tableData = rows.map((e) => [
    DateFormat(e.date, 'MMMM YYYY'),
    `${Math.round(percentOf(e))} %`,
    NumberFormat(getSaving(e))
  ]);
  tableData.push(['Promedio', `${meanPercent} %`, NumberFormat(meanValue)]);

  // Gráficas
  const { graph } = raw;
  const expenses = filterLimitDataForGraph<number>(
    excludeInv ? graph.operationalExpenses : graph.expenses,
    numMonths
  );
  const incomes = filterLimitDataForGraph<number>(
    excludeInv ? graph.operationalIncomes : graph.incomes,
    numMonths
  );
  const savings = filterLimitDataForGraph<number>(
    excludeInv ? graph.operationalSavings : graph.savings,
    numMonths
  );

  // Totales del mes seleccionado
  const monthRow = raw.data.find((e) => e.date === getDateStartOfMonth(month));

  return {
    totalExpenses: monthRow ? (excludeInv ? monthRow.operationalExpense : monthRow.expense) : 0,
    totalIncomes: monthRow ? (excludeInv ? monthRow.operationalIncome : monthRow.income) : 0,
    totalSavings: monthRow ? (excludeInv ? monthRow.operationalSaving : monthRow.saving) : 0,
    dataExpenses: expenses,
    dataIncomes: incomes,
    dataSavings: savings,
    averageExpenses: calculateAverage(expenses),
    previousAverageExpenses: calculateAverage(expenses.slice(0, -1)),
    averageIncomes: calculateAverage(incomes),
    previousAverageIncomes: calculateAverage(incomes.slice(0, -1)),
    sumPreviousSavings: sum(savings.slice(0, -1)),
    labels: filterLimitDataForGraph<string>(graph.labels, numMonths),
    tableData,
    historySavings: excludeInv ? graph.operationalSavings : graph.savings
  };
};

// Ahorro histórico real y con préstamos
const buildSavingsHistory = (history: number[], loans: Loans | undefined) => {
  if (!loans) return { real: 0, withLoans: 0 };

  const baseLoan = loans.find((e) => e.type === LOAN_TYPE_BASE);
  const withLoans = sum(history) + (baseLoan ? baseLoan.amount : 0);
  const otherLoans = sum(loans.filter((e) => e.type !== LOAN_TYPE_BASE).map((e) => e.amount));

  return { real: withLoans - otherLoans, withLoans };
};

export default function CashFlowScreen({ navigation }: CashFlowScreenProps) {
  const config = screenConfigs.cashFlow;
  const colors = useThemeColors();
  const month = useAppSelector(selectSelectedMonth);

  const [numMonthsQuery, setNumMonthsQuery] = useState(DEFAULT_NUM_MONTHS);
  const [reloadToken, setReloadToken] = useState(0);
  const [fetched, setFetched] = useState<FetchedData | null>(null);
  const [updating, setUpdating] = useState(false);

  // Estado para mostrar/ocultar información sensible
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  // Toggle de vista operativa
  const [excludeInvestments, setExcludeInvestments] = useState<boolean>(false);

  const { loading: loadingGraphql, error, data: loansData } = useQuery<GetLoanResult>(GET_LOANS);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const requestKey = `${month}|${numMonthsQuery}|${reloadToken}`;

  // Carga al enfocar la pantalla y cuando cambia el mes, el rango o se pide recargar
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async (): Promise<void> => {
        try {
          const { data: response } = await getSavingsByUser({ numMonths: numMonthsQuery });
          if (active) setFetched({ key: requestKey, data: response });
        } catch (e) {
          if (!active) return;
          showError(e);
          // Conserva los datos previos de esta petición; si no hay, termina la carga vacía
          setFetched((prev) => (prev?.key === requestKey ? prev : { key: requestKey, data: null }));
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [requestKey, numMonthsQuery])
  );

  // Hay carga mientras los datos no correspondan a la petición actual
  const loading = updating || fetched?.key !== requestKey;

  const view = useMemo(
    () => buildCashFlowView(fetched?.data ?? null, excludeInvestments, numMonthsQuery, month),
    [fetched, excludeInvestments, numMonthsQuery, month]
  );

  const savingsHistory = useMemo(
    () => buildSavingsHistory(view.historySavings, loansData?.loans),
    [view.historySavings, loansData]
  );

  const updateAllSavingsByUser = async () => {
    try {
      setUpdating(true);
      const { data: result } = await getUpdateAllSavingsByUser({ numMonths: numMonthsQuery });
      if (result.result) {
        setReloadToken((token) => token + 1);
      }
    } catch (e) {
      showError(e);
    } finally {
      setUpdating(false);
    }
  };

  const tableHead = ['Mes', '% Ahorro', 'Valor'];
  const cardShadow = { shadowColor: colors.BLACK };

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header minimalista */}
        <View style={styles.header}>
          <Text style={[styles.headerMonth, { color: colors.TEXT_PRIMARY }]}>
            {DateFormat(month, 'MMMM')}
          </Text>
          <Text style={[styles.headerYear, { color: colors.TEXT_SECONDARY }]}>
            {DateFormat(month, 'YYYY')}
          </Text>
        </View>

        {loading || loadingGraphql ? (
          <MyLoading />
        ) : (
          <View>
            {/* Toggle vista operativa */}
            <View
              style={[styles.natureToggle, cardShadow, { backgroundColor: colors.CARD_BACKGROUND }]}
            >
              <View style={styles.natureToggleInfo}>
                <Text style={[styles.natureToggleLabel, { color: colors.TEXT_PRIMARY }]}>
                  Vista operativa
                </Text>
                <Text style={[styles.natureToggleDescription, { color: colors.TEXT_SECONDARY }]}>
                  Excluye compras marcadas como inversión o atípicas
                </Text>
              </View>
              <Switch
                value={excludeInvestments}
                onValueChange={setExcludeInvestments}
                trackColor={{ false: colors.GRAY, true: colors.SUCCESS + '80' }}
                thumbColor={excludeInvestments ? colors.SUCCESS : colors.WHITE}
              />
            </View>

            {/* Cards minimalistas sin iconos */}
            <View style={styles.cardsGrid}>
              <View
                style={[styles.miniCard, cardShadow, { backgroundColor: colors.CARD_BACKGROUND }]}
              >
                <Text style={[styles.miniCardLabel, { color: colors.TEXT_SECONDARY }]}>
                  Ingresos
                </Text>
                <Text
                  style={[styles.miniCardValue, { color: colors.SUCCESS }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {NumberFormat(view.totalIncomes)}
                </Text>
              </View>

              <View
                style={[styles.miniCard, cardShadow, { backgroundColor: colors.CARD_BACKGROUND }]}
              >
                <Text style={[styles.miniCardLabel, { color: colors.TEXT_SECONDARY }]}>Gastos</Text>
                <Text
                  style={[styles.miniCardValue, { color: colors.ERROR }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {NumberFormat(view.totalExpenses)}
                </Text>
              </View>

              <View
                style={[styles.miniCard, cardShadow, { backgroundColor: colors.CARD_BACKGROUND }]}
              >
                <Text style={[styles.miniCardLabel, { color: colors.TEXT_SECONDARY }]}>
                  Balance
                </Text>
                <Text
                  style={[styles.miniCardValue, { color: colors.INFO }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {NumberFormat(view.totalSavings)}
                </Text>
              </View>
            </View>

            {/* Botón para info sensible */}
            <TouchableOpacity
              style={[styles.toggleButton, cardShadow, { backgroundColor: colors.CARD_BACKGROUND }]}
              onPress={() => setShowSensitiveInfo(!showSensitiveInfo)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, { color: colors.TEXT_PRIMARY }]}>
                {showSensitiveInfo ? 'Ocultar' : 'Ver'} históricos
              </Text>
              <Icon
                type="material-community"
                name={showSensitiveInfo ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.TEXT_SECONDARY}
              />
            </TouchableOpacity>

            {/* Info sensible colapsable */}
            {showSensitiveInfo && (
              <View
                style={[
                  styles.sensitiveSection,
                  cardShadow,
                  { backgroundColor: colors.CARD_BACKGROUND }
                ]}
              >
                {/* Nota informativa */}
                <View
                  style={[
                    styles.infoNote,
                    { backgroundColor: colors.INFO + '10', borderColor: colors.INFO }
                  ]}
                >
                  <Icon
                    type="material-community"
                    name="information"
                    size={14}
                    color={colors.INFO}
                  />
                  <Text style={[styles.infoNoteText, { color: colors.TEXT_SECONDARY }]}>
                    Promedios calculados con los últimos {numMonthsQuery} meses
                  </Text>
                </View>

                {/* Ingresos históricos */}
                <View style={styles.historyItem}>
                  <Text style={[styles.historyTitle, { color: colors.SUCCESS }]}>Ingresos</Text>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Promedio
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(view.averageIncomes)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Anterior
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(view.previousAverageIncomes)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />

                {/* Gastos históricos */}
                <View style={styles.historyItem}>
                  <Text style={[styles.historyTitle, { color: colors.ERROR }]}>Gastos</Text>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Promedio
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(view.averageExpenses)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Anterior
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(view.previousAverageExpenses)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />

                {/* Ahorros históricos */}
                <View style={styles.historyItem}>
                  <Text style={[styles.historyTitle, { color: colors.INFO }]}>Ahorros</Text>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Anterior
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(view.sumPreviousSavings)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Histórico real
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(savingsHistory.real)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Con préstamos
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(savingsHistory.withLoans)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actualizar */}
            <TouchableOpacity
              style={[
                styles.refreshButton,
                cardShadow,
                { backgroundColor: colors.CARD_BACKGROUND }
              ]}
              onPress={updateAllSavingsByUser}
              activeOpacity={0.7}
            >
              <Text style={[styles.refreshText, { color: colors.TEXT_SECONDARY }]}>
                Actualizar datos
              </Text>
              <Icon type="material-community" name="refresh" size={18} color={colors.PRIMARY} />
            </TouchableOpacity>

            {/* Card de análisis de ahorros */}
            <SavingsAnalysisCard />
          </View>
        )}

        {/* Header del gráfico */}
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: colors.TEXT_PRIMARY }]}>Evolución</Text>
            <Text style={[styles.chartSubtitle, { color: colors.TEXT_SECONDARY }]}>
              {numMonthsQuery} meses
            </Text>
          </View>
          <CheckBoxOptions navigation={navigation} updateNum={setNumMonthsQuery} />
        </View>

        {/* Gráfico */}
        <CashFlowLineChart
          labels={view.labels}
          dataExpenses={view.dataExpenses}
          dataIncomes={view.dataIncomes}
          dataSavings={view.dataSavings}
        />

        {/* Tabla */}
        <ModernTable
          tableHead={tableHead}
          tableData={view.tableData}
          columnWidths={[90, 90, 130]}
          columnAlignments={['left', 'center', 'right']}
          highlightedRows={[view.tableData.length - 1]}
        />

        {/* Botón */}
        {!loading && (
          <View style={styles.buttonContainer}>
            <MyButton
              title="Más gráficas"
              onPress={() => navigation.navigate('graphBalances')}
              variant="primary"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8
  },
  headerMonth: {
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  headerYear: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2
  },
  natureToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  natureToggleInfo: {
    flex: 1
  },
  natureToggleLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  natureToggleDescription: {
    fontSize: 11,
    marginTop: 2
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  miniCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  miniCardValue: {
    fontSize: 14,
    fontWeight: '800'
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600'
  },
  sensitiveSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  historyItem: {
    marginVertical: 8
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '500'
  },
  historyValue: {
    fontSize: 12,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    marginVertical: 8
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1
  },
  infoNoteText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '500'
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  chartSubtitle: {
    fontSize: 11,
    marginTop: 2
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 24
  }
});
