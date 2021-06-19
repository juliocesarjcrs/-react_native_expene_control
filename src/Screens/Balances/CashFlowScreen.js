import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { DateFormat, GetNumberMonth, NumberFormat } from "../../utils/Helpers";
import { BIG } from "~/styles/fonts";
import { Errors } from "../../utils/Errors";
import { useSelector } from "react-redux";
import MyLoading from "~/components/loading/MyLoading";
import { LineChart } from "react-native-chart-kit";
import { getLastExpenses } from "../../services/expenses";
import { getLastIncomes } from "../../services/incomes";

export default function CashFlowScreen({ navigation }) {
  const month = useSelector((state) => state.date.month);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [dataExpenses, setDataExpenses] = useState([0]);
  const [dataIncomes, setDataIncomes] = useState([0]);

  const [labels, setLabels] = useState([""]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetchLastExpenses();
    const unsuscribe = navigation.addListener("focus", () => {
      fetchLastExpenses();
    });
    return unsuscribe;
  }, [month]);

  useEffect(() => {
    // fetchLastIncomes();
    const unsuscribe = navigation.addListener("focus", () => {
      fetchLastIncomes();
    });
    return unsuscribe;

  }, [month]);

  const fetchLastExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await getLastExpenses();
      setLoading(false);
      setLabels(data.labels);
      const len = data.graph.length;
      if (len > 0) {
        const total = searchTotalInMonth(data.data);
        setTotalExpenses(total);
        setDataExpenses(data.graph);
      }else{
        setDataExpenses([0]);
        setTotalExpenses(0);
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

  const fetchLastIncomes = async () => {
    try {
      setLoading(true);
      const { data } = await getLastIncomes();
      setLoading(false);
      const len = data.incomes.length;
      if (len > 0) {
        setDataIncomes(data.incomes);
        const totalCalculate = searchTotalInMonth(data.data);
        setTotalIncomes(totalCalculate);
      }else{
        setDataIncomes([0]);
        setTotalIncomes(0);
      }
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.title}>Ingresos</Text>
            <Text style={{ color: "green" }}>{NumberFormat(totalIncomes)}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.title}>Gastos</Text>
            <Text style={{ color: "red" }}>{NumberFormat(totalExpenses)}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.title}>Saldo</Text>
            <Text style={{ color: "blue" }}>
              {NumberFormat(totalIncomes - totalExpenses)}
            </Text>
          </View>
        </View>
      )}
      <Text style={styles.chartTitle}>Últimos meses</Text>
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
          ],
          legend: ["Gastos", "Ingresos"],
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
      />
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
});
