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
import { Tooltip } from "react-native-elements";
import { BACKGROUND_TOOLTIP } from "~/styles/colors";
import GraphIncomesByCategory from "./components/GraphIncomesByCategory";
import CheckBoxOptions from "../../components/checbox/CheckBoxOptions";

export default function CashFlowScreen({ navigation }) {
    const month = useSelector((state) => state.date.month);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalIncomes, setTotalIncomes] = useState(0);
    const [dataExpenses, setDataExpenses] = useState([0]);
    const [dataIncomes, setDataIncomes] = useState([0]);
    const [dataSavings, setDataSavings] = useState([0]);
    const [averageExpenses, setAverageExpenses] = useState(0);
    const [previousAverageExpenses, setPreviousAverageExpenses] = useState(0);
    const [averageIncomes, setAverageIncomes] = useState(0);
    const [previousAverageIncomes, setPreviousAverageIncomes] = useState(0);
    const [sumSavings, setSumSavings] = useState(0);
    const [numMonthsGraph, setNumMonthsGraph] = useState(4);
    const [numMonthsQuery, setNumMonthsQuery] = useState(12);

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
        fetchLastExpenses();
        return navigation.addListener("focus", () => {
            fetchLastExpenses();
        });
    }, [month, numMonthsQuery]);

    useEffect(() => {
        fetchLastIncomes();
        return navigation.addListener("focus", () => {
            fetchLastIncomes();
        });
    }, [month, numMonthsQuery]);

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
                numMonths: numMonthsQuery,
            };
            const { data } = await getLastExpenses(query);
            setLoading(false);
            setLabels(filterLimitDataForGraph(data.labels));
            setAverageExpenses(data.average);
            setPreviousAverageExpenses(data.previosAverage);
            const len = data.graph.length;
            if (len > 0) {
                const total = searchTotalInMonth(data.data);
                setTotalExpenses(total);
                setDataExpenses(filterLimitDataForGraph(data.graph));
            } else {
                setDataExpenses([0]);
                setTotalExpenses(0);
                setAverageExpenses(0);
                setPreviousAverageExpenses(0);
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
        return data.slice(len - numMonthsGraph, len);
    };

    const fetchLastIncomes = async () => {
        try {
            setLoading(true);
            const query = {
                numMonths: numMonthsQuery,
            };
            const { data } = await getLastIncomes(query);
            setLoading(false);
            const len = data.incomes.length;
            if (len > 0) {
                setDataIncomes(filterLimitDataForGraph(data.incomes));
                const totalCalculate = searchTotalInMonth(data.data);
                setTotalIncomes(totalCalculate);
                setAverageIncomes(data.average);
                setPreviousAverageIncomes(data.previosAverage);
            } else {
                setDataIncomes([0]);
                setTotalIncomes(0);
                setAverageIncomes(0);
                setPreviousAverageIncomes(0);
            }
        } catch (e) {
            setLoading(false);
            Errors(e);
        }
    };
    const calculateDataSavings = () => {
        let savings = [0];
        if (dataIncomes.length > 0 && dataExpenses.length > 0) {
            dataIncomes.forEach((income, key) => {
                savings[key] =
                    income - (dataExpenses[key] ? dataExpenses[key] : 0);
            });
        }
        const acuSavings = savings.reduce((acu, val) => {
            return acu + val;
        }, 0);
        setSumSavings(acuSavings);
        setDataSavings(savings);
    };

    const LabelPopover = ({
        titleMain,
        average,
        previousAverage,
        total,
        colorValue,
    }) => {
        return (
            <View style={styles.item}>
                <Text style={styles.title}>{titleMain}</Text>
                <Tooltip
                    popover={
                        <View>
                            <Text style={styles.contAverage}>
                                {" "}
                                Promedio:
                                <Text style={styles.average}> {average}</Text>
                            </Text>
                            <Text style={styles.contAverage}>
                                {" "}
                                Prom ant:
                                <Text style={styles.average}>
                                    {" "}
                                    {previousAverage}
                                </Text>
                            </Text>
                        </View>
                    }
                    width={200}
                    backgroundColor={BACKGROUND_TOOLTIP}
                >
                    <Text style={{ color: colorValue }}>{total}</Text>
                </Tooltip>
            </View>
        );
    };
    const updateNum = (val) => {
        setNumMonthsQuery(val);
        setNumMonthsGraph(val);
    };

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
                        <LabelPopover
                            titleMain={"Ingresos"}
                            average={NumberFormat(averageIncomes)}
                            previousAverage={NumberFormat(
                                previousAverageIncomes
                            )}
                            total={NumberFormat(totalIncomes)}
                            colorValue={"green"}
                        />
                        <LabelPopover
                            titleMain={"Gastos:"}
                            average={NumberFormat(averageExpenses)}
                            previousAverage={NumberFormat(
                                previousAverageExpenses
                            )}
                            total={NumberFormat(totalExpenses)}
                            colorValue={"red"}
                        />
                        <View style={styles.item}>
                            <Text style={styles.title}>Saldo</Text>
                            <Tooltip
                                popover={
                                    <View>
                                        <Text style={styles.contAverage}>
                                            Ahorro:
                                            <Text style={styles.average}>
                                                {NumberFormat(sumSavings)}
                                            </Text>
                                        </Text>
                                    </View>
                                }
                                width={200}
                                backgroundColor={BACKGROUND_TOOLTIP}
                            >
                                <Text style={{ color: "#87CEFA" }}>
                                    {NumberFormat(totalIncomes - totalExpenses)}
                                </Text>
                            </Tooltip>
                        </View>

                        <View style={styles.item}>
                            <Text style={styles.text}>
                                El calculo del promedio se realiza de los
                                últimos {numMonthsQuery} meses
                            </Text>
                        </View>
                    </View>
                )}
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
                        Últimos meses ({numMonthsGraph})
                    </Text>
                    <CheckBoxOptions
                        navigation={navigation}
                        updateNum={updateNum}
                    ></CheckBoxOptions>
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
                    width={Dimensions.get("window").width - 10}
                    height={300}
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
                    verticalLabelRotation={30}
                />
                <GraphBySubcategory navigation={navigation} />
                <GraphIncomesByCategory navigation={navigation} />
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
        paddingHorizontal: 10,
        color: "white",
        fontWeight: "300",
    },
    contAverage: {
        fontSize: SMALL,
        paddingHorizontal: 10,
        color: "white",
        fontWeight: "bold",
    },
    text: {
        fontSize: SMALL,
        paddingHorizontal: 10,
        color: "black",
        fontWeight: "300",
    },
});
