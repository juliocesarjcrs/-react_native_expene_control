/**
 * CopagoSeriesCard — Citas y sesiones numeradas por paciente + especialidad
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/components/CopagoSeriesCard.tsx
 *
 * Responde "¿cuántas citas llevo por especialidad?" y "¿cómo va cada terapia?".
 * Terapias con total: barra de progreso. Citas de especialidad: conteo por acto.
 * Avisa los números que faltan (ej. "falta #12") y separa los ciclos.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import {
  CopagoAct,
  CopagoSeriesStats
} from '~/shared/types/utils/commentaryParser/copago-analysis.types';

// Utils
import { NumberFormat, DateFormat } from '~/utils/Helpers';
import {
  ACT_LABELS,
  ACT_LABELS_PLURAL,
  DEFAULT_PATIENT,
  getCopagoGroupIcon
} from '~/utils/commentaryParser';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

// El cuerpo de cada item se sangra lo mismo que ocupa el icono + su separación,
// para que quede alineado con el título y no con el borde de la tarjeta.
const ICON_SIZE = 16;
const ICON_GAP = 8;
const CONTENT_INDENT = ICON_SIZE + ICON_GAP;

interface CopagoSeriesCardProps {
  series: CopagoSeriesStats[];
}

const describeActs = (acts: CopagoSeriesStats['acts']): string =>
  Object.entries(acts)
    .map(([act, count]) => {
      const key = act as CopagoAct;
      const label = (count === 1 ? ACT_LABELS[key] : ACT_LABELS_PLURAL[key]).toLowerCase();
      return `${count} ${label}`;
    })
    .join(', ');

export default function CopagoSeriesCard({ series }: CopagoSeriesCardProps) {
  const colors = useThemeColors();

  if (series.length === 0) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <Icon type="material-community" name="counter" size={20} color={colors.INFO} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          Citas y sesiones por especialidad
        </Text>
      </View>

      {series.map((s) => {
        const isSession = s.sequenceKind === 'session';
        const subtitleParts = [
          s.patient !== DEFAULT_PATIENT ? s.patient : null,
          s.totalEpisodes > 1 ? `Ciclo ${s.episode}/${s.totalEpisodes}` : null,
          s.institution ?? null
        ].filter(Boolean);

        return (
          <View
            key={`${s.patient}-${s.specialtyKey}-${s.episode}`}
            style={[styles.item, { borderTopColor: colors.BORDER }]}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <Icon
                  type="material-community"
                  name={getCopagoGroupIcon(s.specialtyKey)}
                  size={ICON_SIZE}
                  color={colors.INFO}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.TEXT_PRIMARY }]}>
                    {s.specialtyLabel}
                  </Text>
                  {subtitleParts.length > 0 && (
                    <Text style={[styles.itemSubtitle, { color: colors.TEXT_SECONDARY }]}>
                      {subtitleParts.join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[styles.itemCost, { color: colors.TEXT_PRIMARY }]}>
                {NumberFormat(s.totalCost)}
              </Text>
            </View>

            <View style={styles.itemBody}>
            {/* Progreso (terapia con total) o conteo (citas) */}
            {isSession && s.totalSessions ? (
              <>
                <View style={[styles.barTrack, { backgroundColor: colors.BORDER }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${s.progressPercent ?? 0}%`,
                        backgroundColor: s.isClosed ? colors.SUCCESS : colors.INFO
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.itemDetail, { color: colors.TEXT_SECONDARY }]}>
                  Sesión {s.lastNumber}/{s.totalSessions} · {s.progressPercent}%
                  {s.isClosed ? ' · completada' : ''} · prom {NumberFormat(s.avgCost)}
                </Text>
              </>
            ) : (
              <Text style={[styles.itemDetail, { color: colors.TEXT_SECONDARY }]}>
                {isSession ? `Sesión ${s.lastNumber}` : `Cita #${s.lastNumber}`} ·{' '}
                {describeActs(s.acts)} · prom {NumberFormat(s.avgCost)}
              </Text>
            )}

            <Text style={[styles.itemDetail, { color: colors.TEXT_SECONDARY }]}>
              {DateFormat(s.firstDate, 'DD MMM YYYY')} → {DateFormat(s.lastDate, 'DD MMM YYYY')}
            </Text>

            {s.missingNumbers.length > 0 && (
              <View style={styles.missingRow}>
                <Icon
                  type="material-community"
                  name="alert-circle-outline"
                  size={14}
                  color={colors.WARNING}
                />
                <Text style={[styles.itemDetail, { color: colors.WARNING }]}>
                  Sin registrar: {s.missingNumbers.map((n) => `#${n}`).join(', ')}
                </Text>
              </View>
            )}
            </View>
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
    marginBottom: 16
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
  item: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    gap: 4
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ICON_GAP,
    flex: 1
  },
  itemBody: {
    marginLeft: CONTENT_INDENT,
    gap: 4
  },
  itemTitle: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  itemSubtitle: {
    fontSize: SMALL - 1
  },
  itemCost: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  itemDetail: {
    fontSize: SMALL - 1
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4
  },
  barFill: {
    height: 6,
    borderRadius: 3
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  }
});