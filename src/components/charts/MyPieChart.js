import React from "react";

import { Dimensions } from 'react-native';
import { PieChart } from "react-native-chart-kit";

const MyPieChart = ({data}) => {

  return (
    <>
      <PieChart
        data={data}
        width={Dimensions.get('window').width - 16}
        height={220}
        chartConfig={{
          backgroundColor: '#1cc910',
          backgroundGradientFrom: '#eff3ff',
          backgroundGradientTo: '#efefef',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        // absolute //for the absolute number remove if you want percentage
      />
    </>
  );
};

export default MyPieChart;