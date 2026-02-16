import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { UtilityConsumption } from '~/shared/types/screens/Statistics/commentary-analysis.types';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface Props {
  item: UtilityConsumption;
}

/**
 * Componente para mostrar badges y notas de consumo de servicios públicos
 *
 * BADGES (siempre visibles):
 * - 👤 Margot (persona adicional)
 * - 👥 4 personas (visitas)
 * - 🏠 6 días deshabitado
 *
 * FRANJA GRIS (solo notas aclaratorias):
 * - Fechas de persona si llegó a mitad: "Margot: 10 Abr - 17 Abr"
 * - Descripción de visitas: "Familia suiza 16 días"
 * - Razón de deshabitado: "Semana Santa"
 * - Separados por " • "
 */
export const UtilitySituationDisplay: React.FC<Props> = ({ item }) => {
  const colors = useThemeColors();

  // ========================================================================
  // BADGES
  // ========================================================================
  const badges: Array<{
    text: string;
    icon: string;
    color: string;
    type: 'extraPerson' | 'visits' | 'uninhabited';
  }> = [];

  // 1. Badge de persona adicional: "👤 Margot"
  if (item.hasExtraPerson && item.extraPersonName) {
    badges.push({
      text: item.extraPersonName,
      icon: 'account-plus',
      color: colors.WARNING, // Amarillo/Naranja
      type: 'extraPerson'
    });
  }

  // 2. Badge de visitas: "👥 4 personas" o "👥 1 persona"
  if (item.hasVisits && item.visitsCount) {
    const personasText = item.visitsCount === 1 ? '1 persona' : `${item.visitsCount} personas`;
    badges.push({
      text: personasText,
      icon: 'account-group',
      color: colors.INFO, // Azul
      type: 'visits'
    });
  }

  // 3. Badge de deshabitado: "🏠 6 días deshabitado"
  if (item.uninhabitedDays) {
    const diasText =
      item.uninhabitedDays === 1 ? '1 día deshabitado' : `${item.uninhabitedDays} días deshabitado`;
    badges.push({
      text: diasText,
      icon: 'home-off',
      color: colors.ERROR, // Naranja/Rojo
      type: 'uninhabited'
    });
  }

  // Si no hay badges ni notas, no renderizar nada
  if (badges.length === 0 && !item.notesForDisplay) return null;

  // ========================================================================
  // RENDERIZAR
  // ========================================================================
  return (
    <View style={styles.container}>
      {/* BADGES */}
      {badges.length > 0 && (
        <View style={styles.badgesContainer}>
          {badges.map((badge, index) => (
            <View
              key={index}
              style={[
                styles.badge,
                {
                  backgroundColor: badge.color + '20',
                  borderColor: badge.color + '40'
                }
              ]}
            >
              <Icon type="material-community" name={badge.icon} size={12} color={badge.color} />
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* FRANJA GRIS - Solo notas aclaratorias */}
      {item.notesForDisplay && (
        <View style={[styles.notesContainer, { backgroundColor: colors.BACKGROUND }]}>
          <Text style={[styles.notesText, { color: colors.TEXT_SECONDARY }]}>
            {item.notesForDisplay}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 6
  },

  // BADGES
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4
  },
  badgeText: {
    fontSize: SMALL - 2,
    fontWeight: '600'
  },

  // FRANJA GRIS
  notesContainer: {
    padding: 10,
    borderRadius: 6
  },
  notesText: {
    fontSize: SMALL,
    lineHeight: 18
  }
});
