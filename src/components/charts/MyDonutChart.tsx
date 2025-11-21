import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

type CategoryData = {
  name: string;
  population: number;
  color: string;
};

interface MyDonutChartProps {
  data: CategoryData[];
  total: number;
}

const MyDonutChart: React.FC<MyDonutChartProps> = ({ data, total }) => {
  console.log("MyDonutChart data:", data[0]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.errorText}>No hay datos para mostrar</Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => b.population - a.population);
  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const othersTotal = rest.reduce((acc, x) => acc + x.population, 0);

  const donutData =
    rest.length > 0
      ? [...top5, { name: "Otros", population: othersTotal, color: "#DDD" }]
      : top5;

  // Calcular segmentos del donut
  const radius = 100;
  const strokeWidth = 40;
  const center = 130;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90; // Empezar desde arriba

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

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString("es-CO")}`;
  };

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

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
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          <Text style={{ fontSize: 16, color: "#999", marginTop: 4 }}>
            {isExpanded ? "▲" : "▼"}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.tapHint}>
        {isExpanded ? "Toca para ocultar" : "Toca para ver detalles"}
      </Text>

      {/* INSIGHTS COMPACTOS */}
      {!isExpanded && (
        <View style={styles.insightsBox}>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>🔥 Mayor gasto:</Text>
            <Text style={styles.insightValue}>{sorted[0].name}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>💰 Monto:</Text>
            <Text style={styles.insightValue}>{formatCurrency(sorted[0].population)}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>📊 Categorías:</Text>
            <Text style={styles.insightValue}>{sorted.length}</Text>
          </View>
        </View>
      )}

      {/* LISTA EXPANDIBLE */}
      {isExpanded && (
        <View style={styles.rankingBox}>
          <Text style={styles.rankingTitle}>
            Todas las categorías ({sorted.length})
          </Text>

          {sorted.map((cat, idx) => {
            const percent = ((cat.population / total) * 100).toFixed(1);
            const isSelected = selectedCategory === cat.name;

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.rankRow, isSelected && styles.rankRowSelected]}
                onPress={() =>
                  setSelectedCategory(isSelected ? null : cat.name)
                }
                activeOpacity={0.7}
              >
                <View style={styles.rankHeader}>
                  <View
                    style={[styles.colorDot, { backgroundColor: cat.color }]}
                  />
                  <Text style={styles.rankName} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={styles.rankPercent}>{percent}%</Text>
                </View>

                <View style={styles.barBackground}>
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
                  <Text style={styles.rankAmount}>
                    {formatCurrency(cat.population)}
                  </Text>
                  <Text style={styles.rankPosition}>#{idx + 1}</Text>
                </View>

                {/* DETALLES EXPANDIBLES */}
                {isSelected && (
                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Porcentaje:</Text>
                      <Text style={styles.detailValue}>{percent}%</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>vs Promedio:</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          cat.population > total / sorted.length
                            ? styles.textGreen
                            : styles.textRed,
                        ]}
                      >
                        {cat.population > total / sorted.length
                          ? "+"
                          : ""}
                        {formatCurrency(
                          Math.round(cat.population - total / sorted.length)
                        )}
                      </Text>
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
};

export default MyDonutChart;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
    fontSize: 12,
    color: "#777",
  },
  totalValue: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    color: "#111",
  },
  tapHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
    fontStyle: "italic",
  },
  insightsBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
  },
  insightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 13,
    color: "#666",
  },
  insightValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  rankingBox: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  rankingTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },
  rankRow: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  rankRowSelected: {
    backgroundColor: "#FFF",
    borderColor: "#007AFF",
    borderWidth: 2,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  rankPercent: {
    fontSize: 13,
    color: "#007AFF",
    marginLeft: 8,
    fontWeight: "700",
  },
  barBackground: {
    height: 8,
    backgroundColor: "#E5E5E5",
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
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  rankPosition: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },
  detailsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: "#888",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  textGreen: {
    color: "#4CAF50",
  },
  textRed: {
    color: "#F44336",
  },
  errorText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 20,
  },
});