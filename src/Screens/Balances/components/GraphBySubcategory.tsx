import React, { useEffect, useState, useRef } from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { StackNavigationProp } from "@react-navigation/stack";

import {
    findLastMonthsFromOnlyCategory,
    getExpensesLastMonthsFromSubcategory,
} from "../../../services/expenses";
import { cutText, NumberFormat } from "../../../utils/Helpers";
import { Rect, Text as TextSVG, Svg } from "react-native-svg";
import { BIG } from "../../../styles/fonts";

// Utils
import { Errors } from "../../../utils/Errors";


// Components
import SelectJoinCategory from "../../../components/dropDown/SelectJoinCategory";
import CheckBoxOptions from "../../../components/checbox/CheckBoxOptions";
import MyLoading from "../../../components/loading/MyLoading";

// Types
import { BalanceStackParamList } from "../../../shared/types";
import { DropDownSelectJoinCategoryFormat, DropDownSelectJoinCategoryFormat2 } from "../../../shared/types/components/dropDown/SelectOnlyCategory.type";

type GraphBySubcategoryNavigationProp = StackNavigationProp<BalanceStackParamList, 'cashFlow'>;

interface GraphBySubcategoryProps {
  navigation: GraphBySubcategoryNavigationProp;
}

export default function GraphBySubcategory({ navigation }: GraphBySubcategoryProps) {
    const selectJoinCategoryRef = useRef();
    const [dataExpenses, setDataExpenses] = useState<number[]>([0]);
    const [labels, setLabels] = useState([""]);
    const [title, setTitle] = useState([""]);
    const [loading, setLoading] = useState(false);
    const screenWidth = Dimensions.get("window").width;
    const [tooltipPos, setTooltipPos] = useState({
        x: 0,
        y: 0,
        visible: false,
        value: 0,
    });
    const [dataCategory, setDataCategory] = useState<DropDownSelectJoinCategoryFormat2>();

    const [numMonths, setNumMonths] = useState(3);

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

    const fetchExpensesSubcategory = async (foundSubcategory: DropDownSelectJoinCategoryFormat) => {
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
            setTitle([`${foundSubcategory.label} PROM: ${NumberFormat(
                    data.average
                )} SUM: ${NumberFormat(data.sum)}`]
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

    const fetchExpensesOnlyCategory = async (foundCategory: DropDownSelectJoinCategoryFormat2) => {
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
            setTitle([`${cutText(dataCategory?.label, 18)} PROM Actu: ${NumberFormat(
                    data.average
                )} Prev: ${NumberFormat(data.previosAverage)}`]
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

    const updateNum = (val:number) => {
        if(selectJoinCategoryRef.current){
            selectJoinCategoryRef.current.resetSubcategory();
        }
        setNumMonths(val);
    };
    return (
        <View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        fontSize: BIG,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginVertical: 15,
                    }}
                >
                    Evolución de los gastos por categorías
                </Text>
                <CheckBoxOptions
                    navigation={navigation}
                    updateNum={updateNum}
                ></CheckBoxOptions>
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
                        legend: title, // optional
                    }}
                    width={screenWidth}
                    height={280}
                    verticalLabelRotation={40}
                    chartConfig={chartConfig}
                    formatYLabel={(val) => `${NumberFormat(val)}`}
                    yLabelsOffset={4}
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
                />
            )}
        </View>
    );
}
