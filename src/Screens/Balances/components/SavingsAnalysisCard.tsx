import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Types
import { BalanceStackParamList } from '~/shared/types';

// Hooks
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

type NavigationProp = StackNavigationProp<BalanceStackParamList>;

export const SavingsAnalysisCard: React.FC = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NavigationProp>();

  const handleNavigate = () => {
    navigation.navigate('savingsAnalysis');
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND }]}
      onPress={handleNavigate}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
        <Icon
          type="material-community"
          name="chart-timeline-variant"
          size={28}
          color={colors.PRIMARY}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Análisis de Ahorros</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          Consulta estadísticas detalladas de tu ahorro por período
        </Text>
      </View>

      <Icon
        type="material-community"
        name="chevron-right"
        size={24}
        color={colors.TEXT_SECONDARY}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginVertical: 8
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  content: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  subtitle: {
    fontSize: SMALL,
    lineHeight: 18
  }
});
