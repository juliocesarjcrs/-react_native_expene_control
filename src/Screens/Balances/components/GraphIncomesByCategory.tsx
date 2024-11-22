import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { findLastIncomesMonthsFromOnlyCategory } from '../../../services/incomes';
import { Errors } from '../../../utils/Errors';
import { NumberFormat } from '../../../utils/Helpers';
import { Rect, Text as TextSVG, Svg } from 'react-native-svg';
import { BIG } from '../../../styles/fonts';

import { StackNavigationProp } from '@react-navigation/stack';

// Components
import SelectOnlyCategory from '../../../components/dropDown/SelectOnlyCategory';
import CheckBoxOptions from '../../../components/checbox/CheckBoxOptions';
import MyLoading from '../../../components/loading/MyLoading';

// Types
import { DropDownSelectFormat } from '../../../shared/types/components';
import { BalanceStackParamList } from '../../../shared/types';

type GraphIncomesByCategoryNavigationProp = StackNavigationProp<BalanceStackParamList, 'cashFlow'>;

interface GraphIncomesByCategoryProps {
  navigation: GraphIncomesByCategoryNavigationProp;
}

export default function GraphIncomesByCategory({ navigation }: GraphIncomesByCategoryProps) {
  const selectOnlyCategoryRef = useRef();
  const [dataIncomes, setDataIncomes] = useState<number[]>([0]);
  const [labels, setLabels] = useState<string[]>(['']);
  const [title, setTitle] = useState(['']);
  const [loading, setLoading] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: 0
  });
  const [dataCategory, setDataCategory] = useState<DropDownSelectFormat>();

  const [numMonths, setNumMonths] = useState(3);

  const chartConfig = {
    backgroundGradientFrom: '#1E2923',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#08130D',
    backgroundGradientToOpacity: 0.5,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false // optional
  };

  useEffect(() => {
    if (dataCategory) {
      fetchCategory();
    }
  }, [dataCategory, numMonths]);

  const fetchIncomesOnlyCategory = async (foundCategory: DropDownSelectFormat) => {
    setDataCategory(foundCategory);
  };

  const fetchCategory = async () => {
    try {
      if (dataCategory) {
        setTooltipPos({ x: 0, y: 0, visible: false, value: 0 });
        setLoading(true);
        const params = {
          numMonths
        };
        const { data } = await findLastIncomesMonthsFromOnlyCategory(dataCategory.id, params);
        setLoading(false);
        setLabels(data.labels);
        // setTitle(
        //     `
        //     ${cutText(dataCategory.label, 18)}
        //     PROM Actu: ${NumberFormat(data.average)}
        //     Prev: ${NumberFormat(data.previosAverage)}
        //     SUM: ${NumberFormat(data.sum)}`
        // );
        const averageFormat = NumberFormat(data.average);
        const previosAverageFormat = NumberFormat(data.previosAverage);
        const sumFormat = NumberFormat(data.sum);
        setTitle([`PROM Actu: ${averageFormat} Prev: ${previosAverageFormat} SUM: ${sumFormat}`]);
        const len = data.graph.length;
        if (len > 0) {
          setDataIncomes(data.graph);
        } else {
          setDataIncomes([0]);
        }
      }
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };

  const updateNum = (val: number) => {
    setNumMonths(val);
  };
  return (
    <View>
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
          Evolución de los ingresos por categorías
        </Text>
        <CheckBoxOptions navigation={navigation} updateNum={updateNum}></CheckBoxOptions>
      </View>
      <SelectOnlyCategory searchType={1} handleCategoryChange={fetchIncomesOnlyCategory} ref={selectOnlyCategoryRef} />
      {loading ? (
        <MyLoading />
      ) : (
        <LineChart
          data={{
            labels: labels,
            datasets: [
              {
                data: dataIncomes,
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                strokeWidth: 2
              }
            ],
            legend: title
          }}
          width={screenWidth}
          height={300}
          verticalLabelRotation={40}
          chartConfig={chartConfig}
          formatYLabel={(val) => `${NumberFormat(val)}`}
          yLabelsOffset={2}
          bezier
          decorator={() => {
            return tooltipPos.visible ? (
              <View>
                <Svg>
                  <Rect x={tooltipPos.x - 15} y={tooltipPos.y + 10} width="80" height="30" fill="black" />
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
