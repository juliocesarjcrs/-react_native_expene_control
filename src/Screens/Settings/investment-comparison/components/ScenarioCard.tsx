// ~/components/investment-comparison/ScenarioCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { ScenarioType } from '~/shared/types/services/Investment-comparison.types';
import { SMALL } from '~/styles/fonts';

interface ScenarioOption {
  type: ScenarioType;
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Props {
  scenario: ScenarioOption;
  isSelected: boolean;
  isConfigured: boolean;
  onSelect: () => void;
  onConfigure: () => void;
  colors: any;
}

export const ScenarioCard: React.FC<Props> = ({
  scenario,
  isSelected,
  isConfigured,
  onSelect,
  onConfigure,
  colors
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.scenarioCard,
        {
          backgroundColor: isSelected ? scenario.color + '15' : colors.BACKGROUND,
          borderColor: isSelected ? scenario.color : colors.BORDER,
          borderLeftWidth: isSelected ? 4 : 1,
          borderLeftColor: isSelected ? scenario.color : colors.BORDER
        }
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.scenarioCardContent}>
        <View style={[styles.scenarioIcon, { backgroundColor: scenario.color + '20' }]}>
          <Icon type="material-community" name={scenario.icon} size={24} color={scenario.color} />
        </View>
        <View style={styles.scenarioInfo}>
          <Text style={[styles.scenarioTitle, { color: colors.TEXT_PRIMARY }]}>
            {scenario.title}
          </Text>
          <Text style={[styles.scenarioDescription, { color: colors.TEXT_SECONDARY }]}>
            {scenario.description}
          </Text>
        </View>
        {isSelected && (
          <Icon type="material-community" name="check-circle" size={24} color={scenario.color} />
        )}
      </View>

      {isSelected && (
        <TouchableOpacity
          style={[
            styles.configureButton,
            { backgroundColor: isConfigured ? colors.SUCCESS + '15' : scenario.color + '15' }
          ]}
          onPress={onConfigure}
          activeOpacity={0.7}
        >
          <Icon
            type="material-community"
            name={isConfigured ? 'check' : 'cog'}
            size={16}
            color={isConfigured ? colors.SUCCESS : scenario.color}
          />
          <Text
            style={[
              styles.configureButtonText,
              { color: isConfigured ? colors.SUCCESS : scenario.color }
            ]}
          >
            {isConfigured ? 'Configurado ✓' : 'Configurar'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scenarioCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  scenarioCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  scenarioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scenarioInfo: {
    flex: 1
  },
  scenarioTitle: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    marginBottom: 2
  },
  scenarioDescription: {
    fontSize: SMALL
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6
  },
  configureButtonText: {
    fontSize: SMALL,
    fontWeight: '600'
  }
});
