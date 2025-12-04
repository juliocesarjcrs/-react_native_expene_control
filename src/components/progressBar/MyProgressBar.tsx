import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

type MyProgressBarProps = {
  percentage: string;
  height: number;
  backgroundColor?: string;
  completedColor?: string;
};

export default function MyProgressBar({
  percentage,
  height,
  backgroundColor,
  completedColor
}: MyProgressBarProps) {
  const colors = useThemeColors();

  const progressData = useMemo(() => {
    const tempPercentage = parseFloat(percentage);
    const isOverBudget = tempPercentage > 100;

    // Usar colores del theme si no se especifican
    const finalCompletedColor = completedColor || colors.SUCCESS;
    const finalBackgroundColor = backgroundColor || colors.BORDER;

    return {
      displayPercentage: isOverBudget ? 100 : tempPercentage,
      originalPercentage: percentage,
      barColor: isOverBudget ? colors.ERROR : finalCompletedColor,
      bgColor: finalBackgroundColor,
      isOverBudget
    };
  }, [percentage, completedColor, backgroundColor, colors]);

  // Calcular el ancho mínimo para que el texto quepa
  const barWidthPercent = progressData.displayPercentage;
  const showTextInside = barWidthPercent >= 15; // Mostrar texto dentro solo si hay suficiente espacio

  return (
    <View style={styles.container}>
      {/* Background bar */}
      <View
        style={[
          styles.backgroundBar,
          {
            height: height,
            backgroundColor: progressData.bgColor,
            borderColor: colors.BORDER
          }
        ]}
      >
        {/* Progress bar */}
        <View
          style={[
            styles.progressBar,
            {
              width: `${barWidthPercent}%`,
              height: height,
              backgroundColor: progressData.barColor
            }
          ]}
        >
          {/* Percentage text DENTRO de la barra */}
          {showTextInside && (
            <View style={styles.textContainer}>
              <Text style={[styles.percentageText, { color: colors.WHITE }]}>
                {progressData.originalPercentage}
              </Text>
            </View>
          )}
        </View>

        {/* Percentage text FUERA de la barra (cuando es muy pequeña) */}
        {!showTextInside && (
          <View style={[styles.textContainerOutside, { left: `${barWidthPercent}%` }]}>
            <Text style={[styles.percentageTextOutside, { color: colors.TEXT_PRIMARY }]}>
              {progressData.originalPercentage}
            </Text>
          </View>
        )}
      </View>

      {/* Badge de alerta si excede */}
      {progressData.isOverBudget && (
        <View style={styles.warningContainer}>
          <Text style={[styles.warningText, { color: colors.ERROR }]}>¡Presupuesto excedido!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center'
  },
  backgroundBar: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  progressBar: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8
  },
  textContainer: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center'
  },
  percentageText: {
    fontSize: SMALL,
    fontWeight: 'bold'
  },
  textContainerOutside: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    marginLeft: 8
  },
  percentageTextOutside: {
    fontSize: SMALL,
    fontWeight: 'bold'
  },
  warningContainer: {
    marginTop: 4,
    alignItems: 'center'
  },
  warningText: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  }
});
