import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Icon } from "react-native-elements";

// Theme
import { useThemeColors } from "~/customHooks/useThemeColors";

// Utils
import { NumberFormat } from "~/utils/Helpers";

// Styles
import { MEDIUM, SMALL } from "~/styles/fonts";

type CategoryData = {
  name: string;
  population: number;
  color: string;
};

interface MyDonutChartProps {
  data: CategoryData[];
  total: number;
}

export default function MyDonutChart({ data, total }: MyDonutChartProps) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon
          type="material-community"
          name="chart-donut"
          size={48}
          color={colors.TEXT_SECONDARY}
        />
        <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
          No hay datos para mostrar
        </Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => b.population - a.population);
  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const othersTotal = rest.reduce((acc, x) => acc + x.population, 0);

  const donutData =
    rest.length > 0
      ? [...top5, { name: "Otros", population: othersTotal, color: colors.GRAY }]
      : top5;

  // Calcular segmentos del donut
  const radius = 100;
  const strokeWidth = 40;
  const center = 130;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90;

  const segments = donutData.map((item) => {
    const percentage = (item.population / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      angle,
    };
  });

  return (
    <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
      {/* DONUT SVG */}
      <TouchableOpacity
        style={styles.donutWrapper}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <Svg width={260} height={260} viewBox="0 0 260 260">
          <G>
            {segments.map((segment, index) => (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${(segment.percentage / 100) * circumference} ${circumference}`}
                strokeDashoffset={-((segment.startAngle + 90) / 360) * circumference}
                rotation={0}
                origin={`${center}, ${center}`}
              />
            ))}
          </G>
        </Svg>

        <View style={styles.centerLabel}>
          <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { color: colors.TEXT_PRIMARY }]}>
            {NumberFormat(total)}
          </Text>
          <Icon
            type="material-community"
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.TEXT_SECONDARY}
            containerStyle={{ marginTop: 4 }}
          />
        </View>
      </TouchableOpacity>

      <Text style={[styles.tapHint, { color: colors.TEXT_SECONDARY }]}>
        {isExpanded ? "Toca para ocultar" : "Toca para ver detalles"}
      </Text>

      {/* INSIGHTS COMPACTOS */}
      {!isExpanded && (
        <View style={[styles.insightsBox, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <View style={styles.insightRow}>
            <View style={styles.insightLeft}>
              <Icon
                type="material-community"
                name="fire"
                size={16}
                color={colors.ERROR}
                containerStyle={{ marginRight: 6 }}
              />
              <Text style={[styles.insightLabel, { color: colors.TEXT_SECONDARY }]}>
                Mayor gasto:
              </Text>
            </View>
            <Text style={[styles.insightValue, { color: colors.TEXT_PRIMARY }]}>
              {sorted[0].name}
            </Text>
          </View>

          <View style={styles.insightRow}>
            <View style={styles.insightLeft}>
              <Icon
                type="material-community"
                name="currency-usd"
                size={16}
                color={colors.SUCCESS}
                containerStyle={{ marginRight: 6 }}
              />
              <Text style={[styles.insightLabel, { color: colors.TEXT_SECONDARY }]}>
                Monto:
              </Text>
            </View>
            <Text style={[styles.insightValue, { color: colors.TEXT_PRIMARY }]}>
              {NumberFormat(sorted[0].population)}
            </Text>
          </View>

          <View style={styles.insightRow}>
            <View style={styles.insightLeft}>
              <Icon
                type="material-community"
                name="chart-bar"
                size={16}
                color={colors.INFO}
                containerStyle={{ marginRight: 6 }}
              />
              <Text style={[styles.insightLabel, { color: colors.TEXT_SECONDARY }]}>
                Categorías:
              </Text>
            </View>
            <Text style={[styles.insightValue, { color: colors.TEXT_PRIMARY }]}>
              {sorted.length}
            </Text>
          </View>
        </View>
      )}

      {/* LISTA EXPANDIBLE */}
      {isExpanded && (
        <View style={styles.rankingBox}>
          <Text style={[styles.rankingTitle, { color: colors.TEXT_PRIMARY }]}>
            Todas las categorías ({sorted.length})
          </Text>

          {sorted.map((cat, idx) => {
            const percent = ((cat.population / total) * 100).toFixed(1);
            const isSelected = selectedCategory === cat.name;
            const avgAmount = total / sorted.length;
            const diffAmount = cat.population - avgAmount;
            const isAboveAvg = diffAmount > 0;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.rankRow,
                  {
                    backgroundColor: colors.CARD_BACKGROUND,
                    borderColor: isSelected ? colors.PRIMARY : colors.BORDER,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() =>
                  setSelectedCategory(isSelected ? null : cat.name)
                }
                activeOpacity={0.7}
              >
                <View style={styles.rankHeader}>
                  <View
                    style={[styles.colorDot, { backgroundColor: cat.color }]}
                  />
                  <Text 
                    style={[styles.rankName, { color: colors.TEXT_PRIMARY }]} 
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                  <Text style={[styles.rankPercent, { color: colors.PRIMARY }]}>
                    {percent}%
                  </Text>
                </View>

                <View style={[styles.barBackground, { backgroundColor: colors.BORDER }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${percent}%` as any,
                        backgroundColor: cat.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.rankFooter}>
                  <Text style={[styles.rankAmount, { color: colors.TEXT_SECONDARY }]}>
                    {NumberFormat(cat.population)}
                  </Text>
                  <View style={[styles.positionBadge, { backgroundColor: colors.INFO + '20' }]}>
                    <Text style={[styles.rankPosition, { color: colors.INFO }]}>
                      #{idx + 1}
                    </Text>
                  </View>
                </View>

                {/* DETALLES EXPANDIBLES */}
                {isSelected && (
                  <View style={[styles.detailsBox, { borderTopColor: colors.BORDER }]}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.TEXT_SECONDARY }]}>
                        Porcentaje del total:
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.TEXT_PRIMARY }]}>
                        {percent}%
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.TEXT_SECONDARY }]}>
                        vs Promedio:
                      </Text>
                      <View style={styles.detailRight}>
                        <Icon
                          type="material-community"
                          name={isAboveAvg ? "arrow-up" : "arrow-down"}
                          size={14}
                          color={isAboveAvg ? colors.ERROR : colors.SUCCESS}
                          containerStyle={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.detailValue,
                            { color: isAboveAvg ? colors.ERROR : colors.SUCCESS },
                          ]}
                        >
                          {isAboveAvg ? "+" : ""}
                          {NumberFormat(Math.abs(Math.round(diffAmount)))}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: SMALL + 1,
    marginTop: 12,
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  totalLabel: {
    fontSize: SMALL,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: MEDIUM + 3,
    fontWeight: "700",
    textAlign: "center",
  },
  tapHint: {
    textAlign: "center",
    fontSize: SMALL,
    marginBottom: 12,
    fontStyle: "italic",
  },
  insightsBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  insightLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  insightLabel: {
    fontSize: SMALL + 1,
  },
  insightValue: {
    fontSize: SMALL + 1,
    fontWeight: "600",
  },
  rankingBox: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  rankingTitle: {
    fontSize: MEDIUM,
    fontWeight: "700",
    marginBottom: 12,
  },
  rankRow: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  rankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  rankName: {
    flex: 1,
    fontSize: SMALL + 2,
    fontWeight: "600",
  },
  rankPercent: {
    fontSize: SMALL + 1,
    marginLeft: 8,
    fontWeight: "700",
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  rankFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rankAmount: {
    fontSize: SMALL + 1,
    fontWeight: "600",
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rankPosition: {
    fontSize: SMALL,
    fontWeight: "600",
  },
  detailsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: SMALL,
  },
  detailRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailValue: {
    fontSize: SMALL,
    fontWeight: "600",
  },
});