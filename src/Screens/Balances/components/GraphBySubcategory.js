import React, { useState } from "react";
import { Dimensions } from "react-native";
import { View, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";
import SelectJoinCategory from "~/components/dropDown/SelectJoinCategory";
import { findLastMonthsFromOnlyCategory, getExpensesLastMonthsFromSubcategory } from "../../../services/expenses";
import { Errors } from "../../../utils/Errors";
import { NumberFormat } from "../../../utils/Helpers";
import { Rect, Text as TextSVG, Svg } from "react-native-svg";
import { BIG } from "../../../styles/fonts";
import MyLoading from "~/components/loading/MyLoading";

export default function GraphBySubcategory() {
  const [dataExpenses, setDataExpenses] = useState([0]);
  const [labels, setLabels] = useState([""]);
  const [title, setTitle] = useState([""]);
  const [loading, setLoading] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  let [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: 0,
  });
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

  const fetchExpensesSubcategory = async (foundSubcategory) => {
    try {
      setTooltipPos({ x: 0, y: 0, visible: false, value: 0 });
      setLoading(true);
      const { data } = await getExpensesLastMonthsFromSubcategory(
        foundSubcategory.value
        );
        setLoading(false);
        setLabels(data.labels);
        setTitle(`${foundSubcategory.label} PROM: ${NumberFormat(data.average)}`);
      const len = data.graph.length;
      if (len > 0) {
        setDataExpenses(data.graph);
      } else {
        setDataExpenses([0]);
      }

    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const fetchExpensesOnlyCategory = async (foundCategory) => {
    try {
      console.log('foundCategory', foundCategory);
      setTooltipPos({ x: 0, y: 0, visible: false, value: 0 });
      setLoading(true);
      const { data } = await findLastMonthsFromOnlyCategory(
        foundCategory.id
        );
        setLoading(false);
        setLabels(data.labels);
        setTitle(`${foundCategory.label} PROM: ${NumberFormat(data.average)}`);
        const len = data.graph.length;
        if (len > 0) {
          setDataExpenses(data.graph);
        } else {
          setDataExpenses([0]);
        }

    } catch (e){
      setLoading(false);
      Errors(e);
    }
  }
  return (
    <View>
      <Text
        style={{
          fontSize: BIG,
          fontWeight: "bold",
          textAlign: "center",
          marginVertical: 15,
        }}
      >
        Evolución de los gastos por subcategoría
      </Text>
      <SelectJoinCategory fetchExpensesSubcategory={fetchExpensesSubcategory} fetchExpensesOnlyCategory={fetchExpensesOnlyCategory} />
      {loading ? (
        <MyLoading />
      ) : (
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
                    fontSize="16"
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
      )}
    </View>
  );
}
