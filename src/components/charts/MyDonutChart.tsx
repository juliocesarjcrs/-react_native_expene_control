import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PolarChart, Pie } from "victory-native";
type CategoryData = {
  name: string;
  population: number;
  color: string;
};

interface MyDonutChartProps {
  data: CategoryData[];
  total: number;
}

const MyDonutChart: React.FC<MyDonutChartProps> = ({ data, total }) => {
  return (
    <View style={styles.container}>
      <PolarChart
        data={data}
        labelKey="name"
        valueKey="population"
        colorKey="color"
        // size={240}
      >
        <Pie.Chart innerRadius={70} />
      </PolarChart>

      <View style={styles.centerLabel}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
      </View>
    </View>
  );
}
export default MyDonutChart;
const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  centerLabel: { position: "absolute", alignItems: "center" },
  totalLabel: { fontSize: 14, color: "#777" },
  totalValue: { fontSize: 26, fontWeight: "800", marginTop: 2 },
});
