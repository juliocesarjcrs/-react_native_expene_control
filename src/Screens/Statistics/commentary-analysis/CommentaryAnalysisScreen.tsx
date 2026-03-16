import React from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';

// Types
import { StackNavigationProp } from '@react-navigation/stack';
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'commentaryAnalysis'>;

interface ScreenProps {
  navigation: ScreenNavigationProp;
}

interface AnalysisOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  route: keyof StatisticsStackParamList;
}

export default function CommentaryAnalysisScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.commentaryAnalysis;

  const analysisOptions: AnalysisOption[] = [
    {
      id: 'utilities',
      title: 'Servicios Públicos',
      subtitle: 'Analiza consumo de luz, agua y gas',
      icon: 'flash',
      iconColor: colors.WARNING,
      route: 'utilityAnalysis'
    },
    {
      id: 'products',
      title: 'Precios de Productos',
      subtitle: 'Compara precios entre supermercados',
      icon: 'cart',
      iconColor: colors.SUCCESS,
      route: 'productPrices'
    },
    {
      id: 'retention',
      title: 'Retenciones',
      subtitle: 'Calcula retenciones acumuladas',
      icon: 'trending-down',
      iconColor: colors.ERROR,
      route: 'retentionAnalysis'
    }
  ];

  const handleOptionPress = (route: keyof StatisticsStackParamList) => {
    navigation.navigate(route as any);
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Mensaje informativo */}
          <View style={[styles.infoContainer, { backgroundColor: colors.INFO + '15' }]}>
            <Icon type="material-community" name="information" size={20} color={colors.INFO} />
            <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
              Extrae información valiosa de los comentarios de tus gastos e ingresos
            </Text>
          </View>

          {/* Opciones de análisis */}
          {analysisOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.CARD_BACKGROUND,
                  borderColor: colors.BORDER
                }
              ]}
              activeOpacity={0.7}
              onPress={() => handleOptionPress(option.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.iconColor + '15' }]}>
                <Icon
                  type="material-community"
                  name={option.icon}
                  size={24}
                  color={option.iconColor}
                />
              </View>

              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.TEXT_PRIMARY }]}>
                  {option.title}
                </Text>
                <Text style={[styles.optionSubtitle, { color: colors.TEXT_SECONDARY }]}>
                  {option.subtitle}
                </Text>
              </View>

              <Icon
                type="material-community"
                name="chevron-right"
                size={24}
                color={colors.TEXT_SECONDARY}
              />
            </TouchableOpacity>
          ))}

          {/* Sección de ayuda */}
          <View style={styles.helpSection}>
            <Text style={[styles.helpTitle, { color: colors.TEXT_PRIMARY }]}>
              💡 ¿Cómo funciona?
            </Text>
            <Text style={[styles.helpText, { color: colors.TEXT_SECONDARY }]}>
              El sistema analiza automáticamente los comentarios de tus gastos e ingresos para
              extraer patrones, tendencias y datos valiosos.
            </Text>
            <Text style={[styles.helpText, { color: colors.TEXT_SECONDARY }]}>
              {'\n'}Ejemplos de formatos:
            </Text>
            <View style={styles.exampleContainer}>
              <Text style={[styles.exampleText, { color: colors.TEXT_SECONDARY }]}>
                • Luz: &#39;Consumo 100 Kw 18 Dic - 17 Ene&#39;
              </Text>
              <Text style={[styles.exampleText, { color: colors.TEXT_SECONDARY }]}>
                • Productos: &#39;Pollo — 1.5 kg a $18000/kg&#39;
              </Text>
              <Text style={[styles.exampleText, { color: colors.TEXT_SECONDARY }]}>
                • Ingresos: &#39;Retefu: 335000&#39;
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10
  },
  infoText: {
    flex: 1,
    fontSize: SMALL + 1,
    lineHeight: 20
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 4
  },
  optionSubtitle: {
    fontSize: SMALL,
    lineHeight: 18
  },
  helpSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5'
  },
  helpTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 12
  },
  helpText: {
    fontSize: SMALL,
    lineHeight: 20,
    marginBottom: 8
  },
  exampleContainer: {
    marginTop: 8,
    paddingLeft: 8
  },
  exampleText: {
    fontSize: SMALL - 1,
    lineHeight: 22,
    fontFamily: 'monospace'
  }
});
