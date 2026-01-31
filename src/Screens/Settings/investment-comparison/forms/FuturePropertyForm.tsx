// ~/components/investment-comparison/forms/FuturePropertyForm.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';

// Components
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';

// Context
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';

// Types
import {
  FuturePropertyScenario,
  ScenarioType,
  DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface Props {
  colors: any;
  navigation: any;
  existingData?: FuturePropertyScenario;
}

export const FuturePropertyForm: React.FC<Props> = ({ colors, navigation, existingData }) => {
  const { saveScenario } = useInvestmentComparison();

  const { handleSubmit, control, watch } = useForm<FuturePropertyScenario>({
    mode: 'onTouched',
    defaultValues: {
      id: existingData?.id || Date.now().toString(),
      name: existingData?.name || 'Vivienda VIS a Futuro',
      propertyPrice: existingData?.propertyPrice || DEFAULTS.VIS_MAX_VALUE,
      downPaymentPercent: existingData?.downPaymentPercent || DEFAULTS.VIS_DOWN_PAYMENT,
      savingMonths: existingData?.savingMonths || 24,
      monthlyContribution: existingData?.monthlyContribution || 3_030_000,
      savingsRate: existingData?.savingsRate || DEFAULTS.NUBANK_CAJITAS_RATE,
      notaryFees: existingData?.notaryFees || DEFAULTS.VIS_NOTARY_FEES,
      registrationFees: existingData?.registrationFees || DEFAULTS.VIS_REGISTRATION,
      beneficiaryTax: existingData?.beneficiaryTax || DEFAULTS.VIS_BENEFICIARY_TAX,
      ivaPercent: existingData?.ivaPercent || DEFAULTS.VIS_IVA,
      refurbishmentCost: existingData?.refurbishmentCost || DEFAULTS.VIS_REFURBISHMENT,
      refurbishmentMonths: existingData?.refurbishmentMonths || DEFAULTS.VIS_REFURBISHMENT_MONTHS,
      monthlyRent: existingData?.monthlyRent || DEFAULTS.DEFAULT_RENT,
      vacancyMonthsPerYear: existingData?.vacancyMonthsPerYear || DEFAULTS.VACANCY_MONTHS,
      monthlyAdministration: existingData?.monthlyAdministration || DEFAULTS.DEFAULT_ADMINISTRATION,
      administrationAnnualIncrease:
        existingData?.administrationAnnualIncrease || DEFAULTS.ADMINISTRATION_INCREASE,
      maintenancePercent: existingData?.maintenancePercent || DEFAULTS.MAINTENANCE_PERCENT,
      propertyTaxPercent: existingData?.propertyTaxPercent || DEFAULTS.PROPERTY_TAX,
      rentalIncomeTax: existingData?.rentalIncomeTax || 0,
      propertyAppreciation: existingData?.propertyAppreciation || DEFAULTS.PROPERTY_APPRECIATION,
      horizonMonths: existingData?.horizonMonths || 60
    }
  });

  // Watch values for helper text
  const propertyPrice = watch('propertyPrice');
  const savingMonths = watch('savingMonths');
  const monthlyContribution = watch('monthlyContribution');
  const refurbishmentCost = watch('refurbishmentCost');
  const monthlyRent = watch('monthlyRent');
  const monthlyAdministration = watch('monthlyAdministration');
  const horizonMonths = watch('horizonMonths');

  const onSubmit = (data: FuturePropertyScenario) => {
    saveScenario(ScenarioType.FUTURE_PROPERTY, data);
    ShowToast('Escenario de vivienda configurado');
    navigation.goBack();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {/* FASE 1: AHORRO */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            💵 Fase 1: Ahorro de Cuota Inicial
          </Text>

          <MyInput
            name="name"
            control={control}
            label="Nombre del escenario"
            placeholder="Vivienda VIS a Futuro"
            rules={{ required: 'El nombre es obligatorio' }}
            leftIcon="home-city"
            autoFocus
          />

          <MyInput
            name="propertyPrice"
            type="currency"
            control={control}
            label="Precio del inmueble"
            placeholder="0"
            rules={{
              required: 'El precio es obligatorio',
              max: {
                value: DEFAULTS.VIS_MAX_VALUE,
                message: `Máximo VIS: ${NumberFormat(DEFAULTS.VIS_MAX_VALUE)}`
              }
            }}
            leftIcon="home"
            helperText={NumberFormat(propertyPrice || 0)}
          />

          <MyInput
            name="downPaymentPercent"
            type="number"
            control={control}
            label="Cuota inicial (%)"
            placeholder="30"
            rules={{
              min: { value: 0, message: 'Mínimo 0%' },
              max: { value: 100, message: 'Máximo 100%' }
            }}
            leftIcon="percent"
          />

          <MyInput
            name="savingMonths"
            type="number"
            control={control}
            label="Tiempo de ahorro (meses)"
            placeholder="24"
            rules={{
              required: 'El tiempo es obligatorio',
              min: { value: 1, message: 'Mínimo 1 mes' }
            }}
            leftIcon="calendar-clock"
            helperText={`${Math.floor((savingMonths || 0) / 12)} años`}
          />

          <MyInput
            name="monthlyContribution"
            type="currency"
            control={control}
            label="Aporte mensual"
            placeholder="0"
            rules={{
              required: 'El aporte es obligatorio',
              min: { value: 100000, message: 'Mínimo $100.000' }
            }}
            leftIcon="cash-multiple"
            helperText={NumberFormat(monthlyContribution || 0)}
          />

          <MyInput
            name="savingsRate"
            type="number"
            control={control}
            label="Tasa de rendimiento mientras ahorras (%)"
            placeholder="8.25"
            rules={{
              required: 'La tasa es obligatoria',
              min: { value: 0.1, message: 'Mínimo 0.1%' },
              max: { value: 30, message: 'Máximo 30%' }
            }}
            leftIcon="chart-line"
          />
        </View>

        {/* FASE 2: COMPRA */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            🏠 Fase 2: Compra y Adecuación
          </Text>

          <MyInput
            name="refurbishmentCost"
            type="currency"
            control={control}
            label="Costo de adecuación"
            placeholder="0"
            leftIcon="tools"
            helperText={NumberFormat(refurbishmentCost || 0)}
          />

          <MyInput
            name="refurbishmentMonths"
            type="number"
            control={control}
            label="Tiempo de adecuación (meses)"
            placeholder="2"
            leftIcon="clock-outline"
          />

          <Text style={[styles.helperText, { color: colors.INFO }]}>
            💡 Gastos de escrituración VIS: ≈ 2.21% del valor (incluido automáticamente)
          </Text>
        </View>

        {/* FASE 3: RENTA */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            💰 Fase 3: Generación de Renta
          </Text>

          <MyInput
            name="monthlyRent"
            type="currency"
            control={control}
            label="Canon de arriendo mensual"
            placeholder="0"
            rules={{
              required: 'El canon es obligatorio',
              min: { value: 100000, message: 'Mínimo $100.000' }
            }}
            leftIcon="cash"
            helperText={NumberFormat(monthlyRent || 0)}
          />

          <MyInput
            name="monthlyAdministration"
            type="currency"
            control={control}
            label="Administración mensual"
            placeholder="0"
            leftIcon="office-building"
            helperText={NumberFormat(monthlyAdministration || 0)}
          />

          <MyInput
            name="vacancyMonthsPerYear"
            type="number"
            control={control}
            label="Meses de vacancia al año"
            placeholder="1"
            rules={{
              min: { value: 0, message: 'Mínimo 0 meses' },
              max: { value: 12, message: 'Máximo 12 meses' }
            }}
            leftIcon="calendar-remove"
          />

          <MyInput
            name="horizonMonths"
            type="number"
            control={control}
            label="Horizonte de renta (meses después de comprar)"
            placeholder="60"
            rules={{
              required: 'El horizonte es obligatorio',
              min: { value: 1, message: 'Mínimo 1 mes' }
            }}
            leftIcon="calendar-range"
            helperText={`${Math.floor((horizonMonths || 0) / 12)} años`}
          />
        </View>

        <View style={{ marginTop: 16, gap: 8 }}>
          <MyButton
            title="Guardar Configuración"
            variant="primary"
            onPress={handleSubmit(onSubmit)}
          />
          <MyButton title="Cancelar" variant="cancel" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginBottom: 12
  },
  helperText: {
    fontSize: SMALL - 1,
    lineHeight: 16,
    marginTop: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 123, 255, 0.1)'
  }
});
