// ~/components/investment-comparison/ProfileSelector.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import {
  RiskProfile,
  TimeHorizon,
  UserPriority,
  UserProfile
} from '~/shared/types/services/Investment-comparison.types';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface Props {
  userProfile: UserProfile;
  onUpdateProfile: (field: keyof UserProfile, value: any) => void;
  onTogglePriority: (priority: UserPriority) => void;
  colors: any;
}

export const ProfileSelector: React.FC<Props> = ({
  userProfile,
  onUpdateProfile,
  onTogglePriority,
  colors
}) => {
  const riskProfiles = [
    { value: RiskProfile.CONSERVATIVE, label: 'Conservador', icon: 'shield-check' },
    { value: RiskProfile.MODERATE, label: 'Moderado', icon: 'scale-balance' },
    { value: RiskProfile.AGGRESSIVE, label: 'Agresivo', icon: 'trending-up' }
  ];

  const timeHorizons = [
    { value: TimeHorizon.SHORT, label: 'Corto plazo', subtitle: '< 1 año' },
    { value: TimeHorizon.MEDIUM, label: 'Mediano plazo', subtitle: '1-5 años' },
    { value: TimeHorizon.LONG, label: 'Largo plazo', subtitle: '> 5 años' }
  ];

  const priorities = [
    { value: UserPriority.PROFITABILITY, label: 'Rentabilidad', icon: 'chart-line-variant' },
    { value: UserPriority.LIQUIDITY, label: 'Liquidez', icon: 'water' },
    { value: UserPriority.SECURITY, label: 'Seguridad', icon: 'lock' },
    { value: UserPriority.CASH_FLOW, label: 'Flujo de caja', icon: 'cash-multiple' }
  ];

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
        Tu Perfil Financiero
      </Text>

      {/* Perfil de riesgo */}
      <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Perfil de riesgo</Text>
      <View style={styles.optionsRow}>
        {riskProfiles.map((profile) => (
          <TouchableOpacity
            key={profile.value}
            style={[
              styles.optionChip,
              {
                backgroundColor:
                  userProfile.riskProfile === profile.value
                    ? colors.PRIMARY + '20'
                    : colors.BACKGROUND,
                borderColor:
                  userProfile.riskProfile === profile.value ? colors.PRIMARY : colors.BORDER
              }
            ]}
            onPress={() => onUpdateProfile('riskProfile', profile.value)}
            activeOpacity={0.7}
          >
            <Icon
              type="material-community"
              name={profile.icon}
              size={16}
              color={
                userProfile.riskProfile === profile.value ? colors.PRIMARY : colors.TEXT_SECONDARY
              }
            />
            <Text
              style={[
                styles.optionChipText,
                {
                  color:
                    userProfile.riskProfile === profile.value
                      ? colors.PRIMARY
                      : colors.TEXT_SECONDARY
                }
              ]}
            >
              {profile.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Horizonte de tiempo */}
      <Text style={[styles.label, { color: colors.TEXT_PRIMARY, marginTop: 16 }]}>
        Horizonte de inversión
      </Text>
      <View style={styles.optionsColumn}>
        {timeHorizons.map((horizon) => (
          <TouchableOpacity
            key={horizon.value}
            style={[
              styles.optionCard,
              {
                backgroundColor:
                  userProfile.timeHorizon === horizon.value
                    ? colors.PRIMARY + '15'
                    : colors.BACKGROUND,
                borderColor:
                  userProfile.timeHorizon === horizon.value ? colors.PRIMARY : colors.BORDER
              }
            ]}
            onPress={() => onUpdateProfile('timeHorizon', horizon.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionCardTitle,
                {
                  color:
                    userProfile.timeHorizon === horizon.value ? colors.PRIMARY : colors.TEXT_PRIMARY
                }
              ]}
            >
              {horizon.label}
            </Text>
            <Text style={[styles.optionCardSubtitle, { color: colors.TEXT_SECONDARY }]}>
              {horizon.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Prioridades */}
      <Text style={[styles.label, { color: colors.TEXT_PRIMARY, marginTop: 16 }]}>
        Prioridades (selecciona hasta 4)
      </Text>
      <View style={styles.prioritiesGrid}>
        {priorities.map((priority) => {
          const isSelected = userProfile.priorities.includes(priority.value);
          const priorityIndex = userProfile.priorities.indexOf(priority.value);

          return (
            <TouchableOpacity
              key={priority.value}
              style={[
                styles.priorityChip,
                {
                  backgroundColor: isSelected ? colors.PRIMARY + '20' : colors.BACKGROUND,
                  borderColor: isSelected ? colors.PRIMARY : colors.BORDER
                }
              ]}
              onPress={() => onTogglePriority(priority.value)}
              activeOpacity={0.7}
            >
              <Icon
                type="material-community"
                name={priority.icon}
                size={20}
                color={isSelected ? colors.PRIMARY : colors.TEXT_SECONDARY}
              />
              <Text
                style={[
                  styles.priorityChipText,
                  { color: isSelected ? colors.PRIMARY : colors.TEXT_SECONDARY }
                ]}
              >
                {priority.label}
              </Text>
              {isSelected && (
                <View style={[styles.priorityBadge, { backgroundColor: colors.PRIMARY }]}>
                  <Text style={[styles.priorityBadgeText, { color: colors.WHITE }]}>
                    {priorityIndex + 1}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginBottom: 12
  },
  label: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    marginBottom: 8
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  optionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6
  },
  optionChipText: {
    fontSize: SMALL,
    fontWeight: '500'
  },
  optionsColumn: {
    gap: 8
  },
  optionCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1
  },
  optionCardTitle: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  optionCardSubtitle: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
  prioritiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    minWidth: '48%'
  },
  priorityChipText: {
    fontSize: SMALL,
    fontWeight: '500',
    flex: 1
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  priorityBadgeText: {
    fontSize: SMALL - 2,
    fontWeight: 'bold'
  }
});
