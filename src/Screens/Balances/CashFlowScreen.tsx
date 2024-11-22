import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Rect, Text as TextSVG, Svg } from 'react-native-svg';
import {
  calculateAverage,
  DateFormat,
  filterLimitDataForGraph,
  getDateStartOfMonth,
  NumberFormat
} from '../../utils/Helpers';
import { Errors } from '../../utils/Errors';
import { useSelector } from 'react-redux';
import { LineChart } from 'react-native-chart-kit';
import { FAB, Icon } from 'react-native-elements';
import { useQuery } from '@apollo/client';

import CheckBoxOptions from '../../components/checbox/CheckBoxOptions';
import { getSavingsByUser, getUpdateAllSavingsByUser } from '../../services/savings';
import { ICON } from '../../styles/colors';

import { StackNavigationProp } from '@react-navigation/stack';

import { BIG, SMALL } from '../../styles/fonts';
// Types
import { FinancialRecord } from '../../shared/types/services';
import { RootState } from '../../shared/types/reducers';
import { BalanceStackParamList } from '../../shared/types';
import { GetLoanResult } from '../../shared/types/graphql';

// Graphql
import { GET_LOANS } from '../../graphql/queries';

// Components
import MyLoading from '../../components/loading/MyLoading';
import MyTable from '../../components/tables/MyTable';
import LabelPopover from './components/label-popover';
import SimplePopover from './components/simple-popover';

type ExportExpenseScreenNavigationProp = StackNavigationProp<BalanceStackParamList, 'cashFlow'>;

interface CashFlowScreenProps {
  navigation: ExportExpenseScreenNavigationProp;
}

export default function CashFlowScreen({ navigation }: CashFlowScreenProps) {
  const month = useSelector((state: RootState) => state.date.month);
  // const year = parseInt(month.substring(0, 4));
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
  // const [sumSavings, setSumSavings] = useState(0);
  const [sumPreviousSavings, setSumPreviousSavings] = useState(0);
  const [numMonthsGraph, setNumMonthsGraph] = useState(4);
  const [numMonthsQuery, setNumMonthsQuery] = useState(4);
  const [totalSavingsHistory, setTotalSavingsHistory] = useState(0);
  const [totalSavingsWithLoansHistory, setTotalSavingsWithLoansHistory] = useState(0);

  const [labels, setLabels] = useState(['']);
  const [loading, setLoading] = useState(false);
  // decorator graph
  const [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: 0
  });
  const [tableData, setTableData] = useState<string[][]>([]);

  const { loading: loadingGraphql, error, data } = useQuery<GetLoanResult>(GET_LOANS);

  useEffect(() => {
    if (!loadingGraphql && !error && data) {
      fetchSavingsByUser();
    }
  }, [loadingGraphql, error, data]);

  useEffect(() => {
    if (error) {
      Errors(error);
    }
  }, [error]);

  useEffect(() => {
    fetchSavingsByUser();
    return navigation.addListener('focus', () => {
      fetchSavingsByUser();
    });
  }, [month, numMonthsQuery]);

  const fetchSavingsByUser = async () => {
    try {
      setTooltipPos({ x: 0, y: 0, visible: false, value: 0 });
      setLoading(true);
      const query = {
        numMonths: numMonthsQuery
      };
      const { data } = await getSavingsByUser(query);
      setLoading(false);
      // all data
      const allDataSavings = filterLimitDataForGraph<FinancialRecord>(data.data, numMonthsQuery);
      const sumPercentSaving = allDataSavings.reduce((acu, val) => {
        return acu + (val.income > 0 ? (val.saving * 100) / val.income : 0);
      }, 0);
      const meanSavingsByNumMonths = allDataSavings.length > 0 ? Math.round(sumPercentSaving / allDataSavings.length) : 0;
      const dataTable = allDataSavings.map((e) => {
      const meanSaaving = e.income > 0 ? Math.round((e.saving * 100) / e.income) : 0;
        return [`${DateFormat(e.date, 'MMMM YYYY')}`, `${meanSaaving} %`, `${NumberFormat(e.saving)}`];
      });
      // mean saving
      const sumSaving = allDataSavings.reduce((acu, val) => {
        return acu + val.saving;
      }, 0);
      const meanSavingsValByNumMonths = allDataSavings.length > 0 ? sumSaving / allDataSavings.length : 0;

      dataTable.push(['Promedio', `${meanSavingsByNumMonths} %`, `${NumberFormat(meanSavingsValByNumMonths)}`]);
      setTableData(dataTable);
      // data filter
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
      // expenses
      setDataExpenses(filterExpenses);
      setAverageExpenses(calculateAverage(filterExpenses));
      setPreviousAverageExpenses(calculateAverage(previosExpenses));
      // incomes
      setDataIncomes(filterIncomes);
      setAverageIncomes(calculateAverage(filterIncomes));
      setPreviousAverageIncomes(calculateAverage(previosIncomes));
      // savings
      // const acuSavings = filterSavings.reduce((acu, val) => {
      //   return acu + val;
      // }, 0);
      const acuPreviosSavings = previosSavings.reduce((acu, val) => {
        return acu + val;
      }, 0);
      // setSumSavings(acuSavings);
      setDataSavings(filterSavings);
      setSumPreviousSavings(acuPreviosSavings);
      // historico savings
      historySaving(data.graph.savings);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const historySaving = async (history: number[]) => {
    let totalHistory = 0;
    const acuHistorySavings = history.reduce((acu, val) => {
      return acu + val;
    }, 0);
    totalHistory = acuHistorySavings;
    if (data){
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
      Errors(error);
    }
  };
  const setSearchTotalInMonth = (allData: FinancialRecord[]) => {
    const startMonthFormat = getDateStartOfMonth(month);
    const objData = allData.filter((e) => e.date == startMonthFormat);
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
    <View style={styles.container}>
      <ScrollView>
        <Text
          style={{
            fontSize: BIG,
            fontWeight: 'bold',
            textAlign: 'center',
            marginVertical: 5
          }}
        >
          Balance del mes {DateFormat(month, 'MMMM')}
        </Text>
        {loading || loadingGraphql ? (
          <MyLoading />
        ) : (
          <View>
            <LabelPopover
              titleMain={'Ingresos'}
              average={NumberFormat(averageIncomes)}
              previousAverage={NumberFormat(previousAverageIncomes)}
              total={NumberFormat(totalIncomes)}
              colorValue={'green'}
            />
            <LabelPopover
              titleMain={'Gastos:'}
              average={NumberFormat(averageExpenses)}
              previousAverage={NumberFormat(previousAverageExpenses)}
              total={NumberFormat(totalExpenses)}
              colorValue={'red'}
            />
            <SimplePopover
              sumPreviousSavings={NumberFormat(sumPreviousSavings)}
              totalSavingsHistory={NumberFormat(totalSavingsHistory)}
              totalSavings={NumberFormat(totalSavings)}
              totalSavingsWithLoansHistory={NumberFormat(totalSavingsWithLoansHistory)}
            />

            <View style={styles.item}>
              <Text style={styles.text}>El calculo del promedio se realiza de los últimos {numMonthsQuery} meses</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.text}>Precione icono para actualizar el mes</Text>
              <Icon
                type="font-awesome"
                // style={styles.icon}
                name={'refresh'}
                size={20}
                color={ICON}
                onPress={() => updateAllSavingsByUser()}
              />
            </View>
          </View>
        )}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Text
            style={{
              fontSize: BIG,
              fontWeight: 'bold',
              textAlign: 'center',
              marginVertical: 15
            }}
          >
            Últimos meses ({numMonthsGraph})
          </Text>
          <CheckBoxOptions navigation={navigation} updateNum={updateNum}></CheckBoxOptions>
        </View>
        <LineChart
          bezier
          withHorizontalLabels={true}
          withVerticalLabels={true}
          data={{
            labels: labels,
            datasets: [
              {
                data: dataExpenses,
                strokeWidth: 2,
                color: (opacity = 1) => `rgba(220, 20, 60, ${opacity})`
              },
              {
                data: dataIncomes,
                strokeWidth: 2,
                color: (opacity = 1) => `rgba(0, 100, 0, ${opacity})`
              },
              {
                data: dataSavings,
                strokeWidth: 2,
                color: (opacity = 1) => `rgba(135, 206, 250, ${opacity})`
              }
            ],
            legend: ['Gastos', 'Ingresos', 'Ahorros']
          }}
          width={Dimensions.get('window').width - 10}
          height={300}
          chartConfig={{
            backgroundColor: '#1cc910',
            backgroundGradientFrom: '#eff3ff',
            backgroundGradientTo: '#efefef',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            },
            // formatYLabel: () => {
            //   console.log(yLabelIterator.next().value);
            //   return yLabelIterator.next().value
            // },
            formatYLabel: () => 'sa'
          }}
          style={{
            borderRadius: 16
          }}
          formatYLabel={(val) => `${NumberFormat(val)}`}
          yLabelsOffset={2}
          decorator={() => {
            return tooltipPos.visible ? (
              <View>
                <Svg>
                  <Rect x={tooltipPos.x - 15} y={tooltipPos.y + 10} width="80" height="30" fill="black" />
                  <TextSVG
                    x={tooltipPos.x + 25}
                    y={tooltipPos.y + 30}
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {NumberFormat(tooltipPos.value)}
                  </TextSVG>
                </Svg>
              </View>
            ) : null;
          }}
          onDataPointClick={(data) => {
            const isSamePoint = tooltipPos.x === data.x && tooltipPos.y === data.y;
            if (isSamePoint) {
              setTooltipPos((previousState) => ({
                ...previousState,
                value: data.value,
                visible: !previousState.visible
              }));
            } else {
              setTooltipPos({
                x: data.x,
                value: data.value,
                y: data.y,
                visible: true
              });
            }
          }}
          verticalLabelRotation={40}
        />
        <MyTable navigation={navigation} tableHead={tableHead} tableData={tableData} />
        {!loading && <FAB title="Gráficas de balance" onPress={sendGraphBalancesScreen} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10
  },
  title: {
    fontSize: BIG
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  graphStyle: {
    flex: 1,
    paddingRight: 25
  },
  chartTitle: {
    paddingLeft: 20,
    paddingBottom: 20,
    paddingTop: 10,
    fontSize: 16,
    fontWeight: 'bold'
  },
  text: {
    fontSize: SMALL,
    paddingHorizontal: 10,
    color: 'black',
    fontWeight: '300'
  }
});
