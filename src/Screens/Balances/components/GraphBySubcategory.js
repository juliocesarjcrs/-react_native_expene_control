import React, {useState} from "react";
import { Dimensions } from "react-native";
import { View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import SelectJoinCategory from '~/components/dropDown/SelectJoinCategory';
import {getExpensesLastMonthsFromSubcategory} from '../../../services/expenses';
import {Errors} from '../../../utils/Errors';
import {NumberFormat} from '../../../utils/Helpers';

export default function GraphBySubcategory() {

  const [dataExpenses, setDataExpenses] = useState([0]);
  const [labels, setLabels] = useState([""]);
  const [title, setTitle] = useState([""]);
  const [loading, setLoading] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    decimalPlaces: 0,
    // color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
     color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // optional
  };

  const fetchExpenses = async (foundSubcategory) => {
    try {
      setTitle(foundSubcategory.label)
      setLoading(true);
      const { data } = await getExpensesLastMonthsFromSubcategory(foundSubcategory.value);
      setLoading(false);
      setLabels(data.labels);
      const len = data.graph.length;
      if (len > 0) {
        setDataExpenses(data.graph);
      }else{
        setDataExpenses([0]);
      }
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  return (
    <View>
      <SelectJoinCategory fetchExpenses={fetchExpenses}/>
      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: dataExpenses,
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
              strokeWidth: 2, // optional
            },
          ],
          legend: [title], // optional
        }}
        width={screenWidth}
        height={256}
        verticalLabelRotation={30}
        chartConfig={chartConfig}
        formatYLabel={(val) => `${NumberFormat(val)}`}
        bezier
      />
    </View>
  );
}
