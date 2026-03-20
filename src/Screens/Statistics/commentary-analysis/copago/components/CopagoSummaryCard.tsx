/**
 * CopagoSummaryCard — Total por tipo de servicio con drill-down expandible
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/components/CopagoSummaryCard.tsx
 *
 * Al tocar una fila se expanden los comentarios del grupo para ver
 * por qué quedaron clasificados allí (útil para depurar el grupo "Otro").
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { CopagoServiceSummary } from '../hooks/useCopagoData';

// Utils
import { NumberFormat, DateFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface CopagoSummaryCardProps {
  summaries: CopagoServiceSummary[];
  totalCost: number;
}

const SERVICE_ICONS: Record<string, string> = {
  terapia_fisica: 'run',
  terapia_ocupacional: 'hand-heart',
  consulta: 'doctor',
  control: 'clipboard-check',
  psicologia: 'head-heart',
  psiquiatra: 'brain',
  fisiatria: 'human-handsup',
  neurocirugia: 'medical-bag',
  medico_domicilio: 'home-heart',
  otro: 'help-circle-outline'
};

export default function CopagoSummaryCard({ summaries, totalCost }: CopagoSummaryCardProps) {
  const colors = useThemeColors();
  const [expandedType, setExpandedType] = useState<string | null>(null);

  if (summaries.length === 0) return null;

  const toggleExpand = (serviceType: string) => {
    setExpandedType((prev) => (prev === serviceType ? null : serviceType));
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Icon type="material-community" name="chart-pie" size={20} color={colors.INFO} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          Total por tipo de servicio
        </Text>
      </View>

      {/* Total general */}
      <View style={[styles.totalRow, { borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>Total período</Text>
        <Text style={[styles.totalValue, { color: colors.TEXT_PRIMARY }]}>
          {NumberFormat(totalCost)}
        </Text>
      </View>

      {/* Filas por servicio */}
      {summaries.map((summary) => {
        const percent = totalCost > 0 ? Math.round((summary.totalCost / totalCost) * 100) : 0;
        const iconName = SERVICE_ICONS[summary.serviceType] ?? 'hospital-box';
        const isExpanded = expandedType === summary.serviceType;

        return (
          <View key={summary.serviceType}>
            {/* Fila del grupo — toca para expandir */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => toggleExpand(summary.serviceType)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.INFO + '15' }]}>
                  <Icon type="material-community" name={iconName} size={16} color={colors.INFO} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.serviceName, { color: colors.TEXT_PRIMARY }]}>
                    {summary.displayName}
                  </Text>
                  <Text style={[styles.serviceDetail, { color: colors.TEXT_SECONDARY }]}>
                    {summary.count} {summary.count === 1 ? 'cita' : 'citas'} · prom{' '}
                    {NumberFormat(summary.avgCost)}
                  </Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                <Text style={[styles.serviceCost, { color: colors.TEXT_PRIMARY }]}>
                  {NumberFormat(summary.totalCost)}
                </Text>
                <View style={styles.rowRightBottom}>
                  <Text style={[styles.servicePercent, { color: colors.TEXT_SECONDARY }]}>
                    {percent}%
                  </Text>
                  <Icon
                    type="material-community"
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.TEXT_SECONDARY}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* Drill-down: comentarios del grupo */}
            {isExpanded && (
              <View
                style={[
                  styles.drillDown,
                  { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }
                ]}
              >
                <Text style={[styles.drillDownTitle, { color: colors.TEXT_SECONDARY }]}>
                  Comentarios en este grupo:
                </Text>
                {summary.items.map((item, idx) => (
                  <View
                    key={idx}
                    style={[styles.drillDownItem, { borderBottomColor: colors.BORDER }]}
                  >
                    <Text style={[styles.drillDownService, { color: colors.TEXT_PRIMARY }]}>
                      {item.service}
                    </Text>
                    <Text style={[styles.drillDownMeta, { color: colors.TEXT_SECONDARY }]}>
                      {DateFormat(item.date, 'DD MMM YYYY')} · {NumberFormat(item.cost)}
                      {item.hasSessions
                        ? ` · Sesión ${item.sessionNumber}${item.totalSessions ? `/${item.totalSessions}` : ''}`
                        : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1
  },
  totalLabel: {
    fontSize: SMALL
  },
  totalValue: {
    fontSize: MEDIUM,
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowText: {
    flex: 1
  },
  serviceName: {
    fontSize: SMALL + 1,
    fontWeight: '500'
  },
  serviceDetail: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 2
  },
  rowRightBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  serviceCost: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  servicePercent: {
    fontSize: SMALL - 1
  },
  drillDown: {
    marginBottom: 8,
    marginLeft: 42,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 8
  },
  drillDownTitle: {
    fontSize: SMALL - 1,
    fontWeight: '600',
    marginBottom: 4
  },
  drillDownItem: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 2
  },
  drillDownService: {
    fontSize: SMALL,
    fontWeight: '500'
  },
  drillDownMeta: {
    fontSize: SMALL - 1
  }
});
