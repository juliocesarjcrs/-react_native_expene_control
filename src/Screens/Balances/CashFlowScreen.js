import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { DateFormat, NumberFormat } from "../../utils/Helpers";
import { BIG } from "~/styles/fonts";
import { Errors } from "../../utils/Errors";
import { useSelector } from "react-redux";
import {
  getCategoryTypeIncome,
  getCategoryWithSubcategories,
} from "../../services/categories";
import MyLoading from "~/components/loading/MyLoading";
import {BarChart} from 'react-native-chart-kit';

export default function CashFlowScreen({ navigation }) {
  const month = useSelector((state) => state.date.month);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDataExpenses();
    fetchDataIncomes();
    // const unsubscribe = navigation.addListener("focus", () => {
    //   fetchDataExpenses();
    // });
  }, [month]);

  const fetchDataExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories(month);
      setLoading(false);
      setTotalExpenses(data.total);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };

  const fetchDataIncomes = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryTypeIncome(month);
      setLoading(false);
      setTotalIncomes(data.total);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const data = {
    labels: ["February", "March", "April", "May"],
    datasets: [
      {
        data: [1000000, 2000000, 3000000, 4000000]
      }
    ]
  };
  const chartConfig = {
    backgroundGradientFrom: '#Ffffff',
    backgroundGradientTo: '#ffffff',
    barPercentage: 1.3,
    decimalPlaces: 0, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(1, 122, 205, 1)`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, 1)`,
  
    style: {
      borderRadius: 16,
      fontFamily: 'Bogle-Regular',
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#efefef',
      strokeDasharray: '0',
    },
    propsForLabels: {
      fontFamily: 'Bogle-Regular',
    },
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
      {/* <BarChart
          style={styles.graphStyle}
          data={data}
          width={Dimensions.get('window').width}
          height={220}
          yAxisLabel="$"
          chartConfig={chartConfig}
          verticalLabelRotation={30}
        /> */}
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
    fontFamily: 'Bogle-Regular',
    fontSize: 16,
  },
});
