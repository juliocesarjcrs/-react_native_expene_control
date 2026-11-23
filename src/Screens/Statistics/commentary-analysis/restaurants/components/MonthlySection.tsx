import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Components
import MyButton from '~/components/MyButton';
import { InfoBox } from '../../products/components/shared/InfoBox';
import { MonthCard } from './MonthCard';

// Types
import { MonthlySummary } from '~/utils/commentaryParser/restaurantAnalysis';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

/** Meses que se muestran antes de pedir "Ver todos" */
const RECENT_MONTHS = 12;

interface MonthlySectionProps {
  /** Del más antiguo al más reciente (como lo entrega buildRestaurantAnalysis) */
  months: MonthlySummary[];
}

/**
 * Resumen por mes. Es secundario frente a "Por restaurante": arranca colapsado y se
 * despliega con un toque.
 */
export function MonthlySection({ months }: MonthlySectionProps): React.JSX.Element | null {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Más reciente primero
  const newestFirst = useMemo(() => [...months].reverse(), [months]);

  if (months.length === 0) return null;

  const visible = showAll ? newestFirst : newestFirst.slice(0, RECENT_MONTHS);

  return (
    <View>
      <TouchableOpacity
        style={[styles.header, { borderColor: colors.BORDER }]}
        activeOpacity={0.7}
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Mostrar u ocultar el resumen por mes"
      >
        <Icon
          type="material-community"
          name="calendar-month"
          size={20}
          color={colors.TEXT_SECONDARY}
        />
        <Text style={[styles.headerText, { color: colors.TEXT_SECONDARY }]}>
          Resumen por mes ({months.length})
        </Text>
        <Icon
          type="material-community"
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.TEXT_SECONDARY}
        />
      </TouchableOpacity>

      {expanded && (
        <View>
          <InfoBox
            icon="information"
            text="Cuenta todos los registros del rango, con o sin nombre de restaurante. Un día cuenta una vez aunque tenga varios registros. Los meses parciales no se comparan."
            compact
          />
          {visible.map((month) => (
            <MonthCard key={month.month} month={month} />
          ))}
          {newestFirst.length > RECENT_MONTHS && (
            <MyButton
              title={showAll ? 'Ver menos' : `Ver todos (${newestFirst.length})`}
              variant="ghost"
              size="small"
              onPress={() => setShowAll((prev) => !prev)}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12
  },
  headerText: { flex: 1, fontSize: SMALL + 1 }
});
