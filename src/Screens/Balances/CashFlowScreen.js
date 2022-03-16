import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View, ScrollView } from "react-native";
import { Rect, Text as TextSVG, Svg } from "react-native-svg";
import { DateFormat, GetNumberMonth, NumberFormat } from "../../utils/Helpers";
import { BIG, SMALL } from "~/styles/fonts";
import { Errors } from "../../utils/Errors";
import { useSelector } from "react-redux";
import MyLoading from "~/components/loading/MyLoading";
import { LineChart } from "react-native-chart-kit";
import { getLastExpenses } from "../../services/expenses";
import { getLastIncomes } from "../../services/incomes";
import GraphBySubcategory from "~/Screens/Balances/components/GraphBySubcategory";


export default function CashFlowScreen({ navigation }) {
  const numMonthsQuery = 12;
  const numMonthsGraph = 5;
  const month = useSelector((state) => state.date.month);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [dataExpenses, setDataExpenses] = useState([0]);
  const [dataIncomes, setDataIncomes] = useState([0]);
  const [dataSavings, setDataSavings] = useState([0]);
  const [averageExpenses, setAverageExpenses] = useState(0);
  const [averageIncomes, setAverageIncomes] = useState(0);
  const [sumSavings, setSumSavings] = useState(0);


  const [labels, setLabels] = useState([""]);

  const [loading, setLoading] = useState(false);
  // decorator graph
  let [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: 0,
});

  useEffect(() => {
    return navigation.addListener("focus", () => {
      fetchLastExpenses();
    });
  }, [month]);

  useEffect(() => {
    return navigation.addListener("focus", () => {
      fetchLastIncomes();
    });
  }, [month]);

  useEffect(() => {
    calculateDataSavings();
    return navigation.addListener("focus", () => {
      calculateDataSavings();
    });
  }, [dataExpenses, dataIncomes]);

  const fetchLastExpenses = async () => {
    try {
      setTooltipPos({ x: 0, y: 0, visible: false, value: 0 });
      setLoading(true);
      const query = {
        numMonths: numMonthsQuery
      }
      const { data } = await getLastExpenses(query);
      setLoading(false);
      setLabels(filterLimitDataForGraph(data.labels));
      setAverageExpenses(data.average);
      const len = data.graph.length;
      if (len > 0) {
        const total = searchTotalInMonth(data.data);
        setTotalExpenses(total);
        setDataExpenses(filterLimitDataForGraph(data.graph));
      }else{
        setDataExpenses([0]);
        setTotalExpenses(0);
        setAverageExpenses(0);
      }
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const searchTotalInMonth = (data) => {
    const numMonth = GetNumberMonth(month);
    const objExpense = data.filter((e) => e.month == numMonth);
    if (objExpense.length > 0 && objExpense[0].sum) {
      return objExpense[0].sum;
    }
    return 0;
  };
  const filterLimitDataForGraph = (data) => {
    let len = data.length;
    return data.slice(len- numMonthsGraph, len);
  }

  const fetchLastIncomes = async () => {
    try {
      setLoading(true);
      const query = {
        numMonths: numMonthsQuery
      }
      const { data } = await getLastIncomes(query);
      setLoading(false);
      const len = data.incomes.length;
      if (len > 0) {
        setDataIncomes(filterLimitDataForGraph(data.incomes));
        const totalCalculate = searchTotalInMonth(data.data);
        setTotalIncomes(totalCalculate);
        setAverageIncomes(data.average);
      }else{
        setDataIncomes([0]);
        setTotalIncomes(0);
        setAverageIncomes(0);
      }
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const calculateDataSavings = () => {
    let savings = [0];
    if(dataIncomes.length > 0 && dataExpenses.length > 0){
      dataIncomes.forEach((income, key) => {
        savings[key] = income - (dataExpenses[key] ? dataExpenses[key] : 0)
      });
    }
    const acuSavings = savings.reduce((acu, val) =>{ 
      return acu + val; 
    },0)
    setSumSavings(acuSavings)
    setDataSavings(savings);
  }

  return (
    <View style={styles.container}>
       <ScrollView>
      <Text
        style={{
          fontSize: BIG,
          fontWeight: "bold",
          textAlign: "center",
          marginVertical: 5,
        }}
      >
        Balance del mes {DateFormat(month, "MMMM")}
      </Text>
      {loading ? (
        <MyLoading />
      ) : (
        <View>
          <View style={styles.item}>
            <Text style={styles.title}>Ingresos:
              <Text style={styles.average}>  Prom: {NumberFormat(averageIncomes)}</Text>
            </Text>
            <Text style={{ color: "green" }}>{NumberFormat(totalIncomes)}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.title}>Gastos:
              <Text style={styles.average}>      Prom: {NumberFormat(averageExpenses)}</Text>
            </Text>
            <Text style={{ color: "red" }}>{NumberFormat(totalExpenses)}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.title}>Saldo
              <Text style={styles.average}>           Acu : {NumberFormat(sumSavings)}</Text>
            </Text>
            <Text style={{ color: "#87CEFA" }}>
              {NumberFormat(totalIncomes - totalExpenses)}
            </Text>
          </View>

          <View style={styles.item}>
              <Text style={styles.average}>El calculo del promedio se realiza de los últimos {numMonthsQuery} meses</Text>
          </View>

        </View>
      )}
      <Text style={styles.chartTitle}>Últimos meses ({numMonthsGraph})</Text>
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
              color: (opacity = 1) => `rgba(220, 20, 60)`,
            },
            {
              data: dataIncomes,
              strokeWidth: 2,
              color: (opacity = 1) => `rgba(0, 100, 0)`,
            },
            {
              data: dataSavings,
              strokeWidth: 2,
              color: (opacity = 1) => `rgba(135,206,250)`,
            },
          ],
          legend: ["Gastos", "Ingresos", "Ahorros"],
        }}
        width={Dimensions.get("window").width - 16}
        height={200}
        chartConfig={{
          backgroundColor: "#1cc910",
          backgroundGradientFrom: "#eff3ff",
          backgroundGradientTo: "#efefef",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          // formatYLabel: () => {
          //   console.log(yLabelIterator.next().value);
          //   return yLabelIterator.next().value
          // },
          formatYLabel: () => "sa",
        }}
        style={{
          borderRadius: 16,
        }}
        formatYLabel={(val) => `${NumberFormat(val)}`}
        decorator={() => {
          return tooltipPos.visible ? (
              <View>
                  <Svg>
                      <Rect
                          x={tooltipPos.x - 15}
                          y={tooltipPos.y + 10}
                          width="80"
                          height="30"
                          fill="black"
                      />
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
          let isSamePoint =
              tooltipPos.x === data.x && tooltipPos.y === data.y;

          isSamePoint
              ? setTooltipPos((previousState) => {
                    return {
                        ...previousState,
                        value: data.value,
                        visible: !previousState.visible,
                    };
                })
              : setTooltipPos({
                    x: data.x,
                    value: data.value,
                    y: data.y,
                    visible: true,
                });
      }}
      />
      <GraphBySubcategory/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
  },
  title: {
    fontSize: BIG,
  },
  item: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  graphStyle: {
    flex: 1,
    paddingRight: 25,
  },
  chartTitle: {
    paddingLeft: 20,
    paddingBottom: 20,
    paddingTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  average: {
    fontSize: SMALL,
    paddingHorizontal: 10
  },
});
