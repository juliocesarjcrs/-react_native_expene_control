import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from 'react-native-elements';
import { dayMonth } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { COMPLETE_COLOR_PROGRESS_BAR, MISSING_COLOR_PROGRESS_BAR } from '~/styles/colors';

type MyProgressBarProps = {
  percentage: string;
  height: number;
  backgroundColor?: string;
  completedColor?: string;
};

export default function MyProgressBar({
  percentage,
  height,
  backgroundColor = 'grey',
  completedColor = COMPLETE_COLOR_PROGRESS_BAR
}: MyProgressBarProps) {
  const colors = useThemeColors();

  const progressData = useMemo(() => {
    const tempPercentage = parseFloat(percentage);
    const isOverBudget = tempPercentage > 100;

    return {
      displayPercentage: isOverBudget ? '100%' : percentage,
      originalPercentage: percentage,
      barColor: isOverBudget ? '#FA7E87' : completedColor
    };
  }, [percentage, completedColor]);

  const todayIndicator = dayMonth(12);

  return (
    <View>
      <View style={styles.container}>
        {/* Background bar */}
        <View
          style={{
            width: '100%',
            height: height,
            marginVertical: 10,
            borderRadius: 5,
            borderColor: backgroundColor,
            borderWidth: 1,
            backgroundColor: MISSING_COLOR_PROGRESS_BAR
          }}
        />

        {/* Progress bar */}
        <View
          style={{
            width: `${parseFloat(progressData.displayPercentage)}%` as any,
            height: height,
            marginVertical: 10,
            borderRadius: 5,
            backgroundColor: progressData.barColor,
            position: 'absolute',
            bottom: 15
          }}
        />

        {/* Percentage text */}
        <View
          style={{
            width: `${Math.max(parseFloat(progressData.displayPercentage), 15)}%` as any,
            height: height,
            bottom: 25
          }}
        >
          <Text style={styles.percentageText}>{progressData.originalPercentage}</Text>
        </View>

        {/* Today indicator */}
        <View
          style={{
            width: todayIndicator.percentage as any,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            position: 'absolute',
            bottom: 5,
            left: -18
          }}
        >
          <View style={styles.verticalLine} />
          <Badge value="Hoy" status="success" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center'
  },
  percentageText: {
    textAlign: 'right',
    fontWeight: 'bold',
    color: 'white',
    fontSize: 11,
    paddingRight: 4
  },
  verticalLine: {
    backgroundColor: 'gray',
    width: 1,
    height: 15,
    position: 'relative',
    bottom: 17,
    left: 17,
    opacity: 0.6
  }
});
