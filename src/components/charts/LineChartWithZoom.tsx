import React from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

interface LineChartWithZoomProps {
  data: number[];
  labels: string[];
  title?: string;
}

const LineChartWithZoom: React.FC<LineChartWithZoomProps> = ({ data, labels, title }) => {
  const chartData = data.map((y, i) => ({
    x: labels[i] || i + 1,
    y
  }));

  return (
    <View style={{ width: 350, height: 300 }}>
      {title && (
        <Text style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>{title}</Text>
      )}
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['y']}
        domainPadding={{ left: 30, right: 30 }}
      >
        {({ points }) => {
          // No tooltip flotante, solo la línea
          return (
            <Line
              points={points.y}
              color="#8641f4"
              strokeWidth={2}
              animate={{ type: 'timing', duration: 300 }}
            />
          );
        }}
      </CartesianChart>
    </View>
  );
};

export default LineChartWithZoom;
