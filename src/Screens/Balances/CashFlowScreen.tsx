import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';
import { useQuery } from '@apollo/client/react';
import { StackNavigationProp } from '@react-navigation/stack';

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

// Types
import { FinancialRecord } from '../../shared/types/services';
import { RootState } from '../../shared/types/reducers';
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

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ExportExpenseScreenNavigationProp = StackNavigationProp<BalanceStackParamList, 'cashFlow'>;

interface CashFlowScreenProps {
  navigation: ExportExpenseScreenNavigationProp;
}

export default function CashFlowScreen({ navigation }: CashFlowScreenProps) {
  const config = screenConfigs.cashFlow;
  const colors = useThemeColors();
  const month = useSelector((state: RootState) => state.date.month);

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [dataExpenses, setDataExpenses] = useState([0]);
  const [dataIncomes, setDataIncomes] = useState([0]);
  const [dataSavings, setDataSavings] = useState([0]);
  const [averageExpenses, setAverageExpenses] = useState(0);
  const [previousAverageExpenses, setPreviousAverageExpenses] = useState(0);
  const [averageIncomes, setAverageIncomes] = useState(0);
  const [previousAverageIncomes, setPreviousAverageIncomes] = useState(0);
  const [sumPreviousSavings, setSumPreviousSavings] = useState(0);
  const [numMonthsGraph, setNumMonthsGraph] = useState(4);
  const [numMonthsQuery, setNumMonthsQuery] = useState(4);
  const [totalSavingsHistory, setTotalSavingsHistory] = useState(0);
  const [totalSavingsWithLoansHistory, setTotalSavingsWithLoansHistory] = useState(0);

  const [labels, setLabels] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<string[][]>([]);

  // Estado para mostrar/ocultar información sensible
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  const { loading: loadingGraphql, error, data } = useQuery<GetLoanResult>(GET_LOANS);

  useEffect(() => {
    if (!loadingGraphql && !error && data) {
      fetchSavingsByUser();
    }
  }, [loadingGraphql, error, data]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const fetchSavingsByUser = async () => {
    try {
      setLoading(true);
      const query = {
        numMonths: numMonthsQuery
      };
      const { data } = await getSavingsByUser(query);
      setLoading(false);

      const allDataSavings = filterLimitDataForGraph<FinancialRecord>(data.data, numMonthsQuery);
      const sumPercentSaving = allDataSavings.reduce((acu, val) => {
        return acu + (val.income > 0 ? (val.saving * 100) / val.income : 0);
      }, 0);
      const meanSavingsByNumMonths =
        allDataSavings.length > 0 ? Math.round(sumPercentSaving / allDataSavings.length) : 0;
      const dataTable = allDataSavings.map((e) => {
        const meanSaaving = e.income > 0 ? Math.round((e.saving * 100) / e.income) : 0;
        return [
          `${DateFormat(e.date, 'MMMM YYYY')}`,
          `${meanSaaving} %`,
          `${NumberFormat(e.saving)}`
        ];
      });

      const sumSaving = allDataSavings.reduce((acu, val) => {
        return acu + val.saving;
      }, 0);
      const meanSavingsValByNumMonths =
        allDataSavings.length > 0 ? sumSaving / allDataSavings.length : 0;

      dataTable.push([
        'Promedio',
        `${meanSavingsByNumMonths} %`,
        `${NumberFormat(meanSavingsValByNumMonths)}`
      ]);
      setTableData(dataTable);

      const filterLabels = filterLimitDataForGraph<string>(data.graph.labels, numMonthsQuery);
      const filterExpenses = filterLimitDataForGraph<number>(data.graph.expenses, numMonthsQuery);
      const filterIncomes = filterLimitDataForGraph<number>(data.graph.incomes, numMonthsQuery);
      const filterSavings = filterLimitDataForGraph<number>(data.graph.savings, numMonthsQuery);
      const previosExpenses = filterExpenses.slice(0);
      previosExpenses.pop();
      const previosIncomes = filterIncomes.slice(0);
      previosIncomes.pop();
      const previosSavings = filterSavings.slice(0);
      previosSavings.pop();

      setLabels(filterLabels);
      setSearchTotalInMonth(data.data);

      setDataExpenses(filterExpenses);
      setAverageExpenses(calculateAverage(filterExpenses));
      setPreviousAverageExpenses(calculateAverage(previosExpenses));

      setDataIncomes(filterIncomes);
      setAverageIncomes(calculateAverage(filterIncomes));
      setPreviousAverageIncomes(calculateAverage(previosIncomes));

      const acuPreviosSavings = previosSavings.reduce((acu, val) => {
        return acu + val;
      }, 0);
      setDataSavings(filterSavings);
      setSumPreviousSavings(acuPreviosSavings);

      historySaving(data.graph.savings);
    } catch (e) {
      setLoading(false);
      showError(e);
    }
  };

  useEffect(() => {
    fetchSavingsByUser();
    return navigation.addListener('focus', () => {
      fetchSavingsByUser();
    });
  }, [month, numMonthsQuery]);

  const historySaving = async (history: number[]) => {
    let totalHistory = 0;
    const acuHistorySavings = history.reduce((acu, val) => {
      return acu + val;
    }, 0);
    totalHistory = acuHistorySavings;
    if (data) {
      const filter = data.loans.find((e) => e.type === 1);
      if (filter) {
        totalHistory += filter.amount;
      }
      const filterLoans = data.loans.filter((e) => e.type !== 1);
      const acuLoans = filterLoans.reduce((acu, val) => {
        return acu + val.amount;
      }, 0);
      setTotalSavingsWithLoansHistory(totalHistory);
      totalHistory -= acuLoans;
      setTotalSavingsHistory(totalHistory);
    }
  };

  const updateAllSavingsByUser = async () => {
    try {
      setLoading(true);
      const query = {
        numMonths: numMonthsQuery
      };
      const { data } = await getUpdateAllSavingsByUser(query);
      setLoading(false);
      if (data.result) {
        fetchSavingsByUser();
      }
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const setSearchTotalInMonth = (allData: FinancialRecord[]) => {
    const startMonthFormat = getDateStartOfMonth(month);
    const objData = allData.filter((e) => e.date === startMonthFormat);
    let totalExpenseByMonth = 0;
    let totalIncomeByMonth = 0;
    let totalSavingByMonth = 0;
    if (objData.length > 0) {
      totalExpenseByMonth = objData[0].expense;
      totalIncomeByMonth = objData[0].income;
      totalSavingByMonth = objData[0].saving;
    }
    setTotalExpenses(totalExpenseByMonth);
    setTotalIncomes(totalIncomeByMonth);
    setTotalSavings(totalSavingByMonth);
  };

  const updateNum = (val: number) => {
    setNumMonthsQuery(val);
    setNumMonthsGraph(val);
  };

  const tableHead = ['Mes', '% Ahorro', 'Valor'];
  const sendGraphBalancesScreen = () => {
    navigation.navigate('graphBalances');
  };

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
            {/* Cards minimalistas sin iconos */}
            <View style={styles.cardsGrid}>
              <View style={[styles.miniCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
                <Text style={[styles.miniCardLabel, { color: colors.TEXT_SECONDARY }]}>
                  Ingresos
                </Text>
                <Text
                  style={[styles.miniCardValue, { color: colors.SUCCESS }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {NumberFormat(totalIncomes)}
                </Text>
              </View>

              <View style={[styles.miniCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
                <Text style={[styles.miniCardLabel, { color: colors.TEXT_SECONDARY }]}>Gastos</Text>
                <Text
                  style={[styles.miniCardValue, { color: colors.ERROR }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {NumberFormat(totalExpenses)}
                </Text>
              </View>

              <View style={[styles.miniCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
                <Text style={[styles.miniCardLabel, { color: colors.TEXT_SECONDARY }]}>
                  Balance
                </Text>
                <Text
                  style={[styles.miniCardValue, { color: colors.INFO }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {NumberFormat(totalSavings)}
                </Text>
              </View>
            </View>

            {/* Balance destacado */}
            {/* <View style={[
              styles.balanceCard,
              { backgroundColor: colors.CARD_BACKGROUND }
            ]}>
              <Text style={[styles.balanceLabel, { color: colors.TEXT_SECONDARY }]}>Balance</Text>
              <Text style={[
                styles.balanceValue,
                { color: isPositiveBalance ? colors.SUCCESS : colors.ERROR }
              ]} numberOfLines={1} adjustsFontSizeToFit>
                {isPositiveBalance ? '+' : ''}{NumberFormat(monthBalance)}
              </Text>
            </View> */}

            {/* Botón para info sensible */}
            <TouchableOpacity
              style={[styles.toggleButton, { backgroundColor: colors.CARD_BACKGROUND }]}
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
              <View style={[styles.sensitiveSection, { backgroundColor: colors.CARD_BACKGROUND }]}>
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
                      {NumberFormat(averageIncomes)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Anterior
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(previousAverageIncomes)}
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
                      {NumberFormat(averageExpenses)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Anterior
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(previousAverageExpenses)}
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
                      {NumberFormat(sumPreviousSavings)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Histórico real
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(totalSavingsHistory)}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: colors.TEXT_SECONDARY }]}>
                      Con préstamos
                    </Text>
                    <Text style={[styles.historyValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(totalSavingsWithLoansHistory)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actualizar */}
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.CARD_BACKGROUND }]}
              onPress={() => updateAllSavingsByUser()}
              activeOpacity={0.7}
            >
              <Text style={[styles.refreshText, { color: colors.TEXT_SECONDARY }]}>
                Actualizar datos
              </Text>
              <Icon type="material-community" name="refresh" size={18} color={colors.PRIMARY} />
            </TouchableOpacity>
          </View>
        )}

        {/* Header del gráfico */}
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: colors.TEXT_PRIMARY }]}>Evolución</Text>
            <Text style={[styles.chartSubtitle, { color: colors.TEXT_SECONDARY }]}>
              {numMonthsGraph} meses
            </Text>
          </View>
          <CheckBoxOptions navigation={navigation} updateNum={updateNum} />
        </View>

        {/* Gráfico */}
        <CashFlowLineChart
          labels={labels}
          dataExpenses={dataExpenses}
          dataIncomes={dataIncomes}
          dataSavings={dataSavings}
        />

        {/* Tabla */}
        <ModernTable
          tableHead={tableHead}
          tableData={tableData}
          columnWidths={[90, 90, 130]}
          columnAlignments={['left', 'center', 'right']}
          highlightedRows={[tableData.length - 1]}
        />

        {/* Botón */}
        {!loading && (
          <View style={styles.buttonContainer}>
            <MyButton title="Más gráficas" onPress={sendGraphBalancesScreen} variant="primary" />
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
  cardsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
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
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '900'
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
