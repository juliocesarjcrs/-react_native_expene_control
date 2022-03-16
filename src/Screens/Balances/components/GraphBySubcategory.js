import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import SelectJoinCategory from "~/components/dropDown/SelectJoinCategory";
import {
    findLastMonthsFromOnlyCategory,
    getExpensesLastMonthsFromSubcategory,
} from "../../../services/expenses";
import { Errors } from "../../../utils/Errors";
import { NumberFormat } from "../../../utils/Helpers";
import { Rect, Text as TextSVG, Svg } from "react-native-svg";
import { BIG } from "../../../styles/fonts";
import { ICON } from "../../../styles/colors";

import MyLoading from "~/components/loading/MyLoading";
import { CheckBox, Icon } from "react-native-elements";
import Popover from "react-native-popover-view";

export default function GraphBySubcategory() {
    const selectJoinCategoryRef = useRef()
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
    const [dataCategory, setDataCategory] = useState();

    const [numMonths, setNumMonths] = useState(3);

    const [checkboxes, setCheckboxes] = useState([
        {
            id: 1,
            title: "Últimos 3 meses",
            checked: true,
            numMonths: 3,
        },
        {
            id: 2,
            title: "Últimos 6 meses",
            checked: false,
            numMonths: 6,
        },
        {
            id: 3,
            title: "Últimos 12 meses",
            checked: false,
            numMonths: 12,
        },
    ]);
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
            const params = {
              numMonths,
          };
            const { data } = await getExpensesLastMonthsFromSubcategory(
                foundSubcategory.value,
                params
            );
            setLoading(false);
            setLabels(data.labels);
            setTitle(
                `${foundSubcategory.label} PROM: ${NumberFormat(data.average)}`
            );
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

    // only category

    useEffect(() => {
        if (dataCategory) {
            fetchCategory();
        }
        // const unsubscribe = navigation.addListener("focus", () => {
        //   fetchCategory();
        // });
        // return unsubscribe;
    }, [dataCategory, numMonths]);

    const fetchExpensesOnlyCategory = async (foundCategory) => {
        setDataCategory(foundCategory);
    };

    const fetchCategory = async () => {
        try {
            setTooltipPos({ x: 0, y: 0, visible: false, value: 0 });
            setLoading(true);
            const params = {
                numMonths,
            };
            const { data } = await findLastMonthsFromOnlyCategory(
                dataCategory.id,
                params
            );
            setLoading(false);
            setLabels(data.labels);
            setTitle(
                `${dataCategory.label} PROM: ${NumberFormat(data.average)}`
                );
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

    const toggleCheckbox = (id, index) => {
        let checkboxData = [...checkboxes];
        const oldValue = checkboxData[index].checked;
        checkboxData = checkboxData.map((e) => {
            return { ...e, checked: false };
        });
        checkboxData[index].checked = true;
        setCheckboxes(checkboxData);
        if (!oldValue) {
            selectJoinCategoryRef.current.resetSubcategory();
            const newNumMonths = checkboxData[index].numMonths;
            setNumMonths(newNumMonths);
        }
    };
    return (
        <View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: 'center'
                }}
            >
                <Text
                    style={{
                        fontSize: BIG,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginVertical: 15
                    }}
                >
                    Evolución de los gastos por categorías
                </Text>
                <View>
                    <Popover
                        from={
                            <TouchableOpacity>
                                <Icon
                                    type="font-awesome"
                                    style={styles.iconHeader}
                                    name={"ellipsis-v"}
                                    size={20}
                                    color={ICON}
                                />
                            </TouchableOpacity>
                        }
                    >
                        <View>
                            {checkboxes.map((cb, index) => {
                                return (
                                    <CheckBox
                                        center
                                        key={cb.id}
                                        title={cb.title}
                                        iconType="material"
                                        checkedIcon="check-box"
                                        uncheckedIcon="check-box-outline-blank"
                                        checked={cb.checked}
                                        onPress={() =>
                                            toggleCheckbox(cb.id, index)
                                        }
                                    />
                                );
                            })}
                        </View>
                    </Popover>
                </View>
            </View>
            <SelectJoinCategory
                fetchExpensesSubcategory={fetchExpensesSubcategory}
                fetchExpensesOnlyCategory={fetchExpensesOnlyCategory}
                ref={selectJoinCategoryRef}
            />
            {loading ? (
                <MyLoading />
            ) : (
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [
                            {
                                data: dataExpenses,
                                color: (opacity = 1) =>
                                    `rgba(134, 65, 244, ${opacity})`, // optional
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
const styles = StyleSheet.create({
    iconHeader: {
        paddingHorizontal: 10,
    },
});
const MyComponent = React.forwardRef(({pro1}, ref) => {
    return (
        <View ref={ref}>
            <Text>hijo</Text>
        </View>
    )
})
