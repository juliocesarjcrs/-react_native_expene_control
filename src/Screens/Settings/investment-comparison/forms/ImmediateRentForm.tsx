// ~/components/investment-comparison/forms/ImmediateRentForm.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import * as Crypto from 'expo-crypto';

// Components
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';

// Context
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';

// Types
import {
  ImmediateRentScenario,
  ScenarioType,
  DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';

// Theme & Styles
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface Props {
  navigation: { goBack: () => void };
  existingData?: ImmediateRentScenario;
}

const buildDefaults = (
  existing: ImmediateRentScenario | undefined,
  id: string
): ImmediateRentScenario => ({
  id: existing?.id ?? id,
  name: existing?.name ?? 'Compra Inmediata para Renta',
  availableCapital: existing?.availableCapital ?? DEFAULTS.DEFAULT_CAPITAL,
  propertyPrice: existing?.propertyPrice ?? 276_000_000,
  downPaymentPercent: existing?.downPaymentPercent ?? DEFAULTS.VIS_DOWN_PAYMENT,
  mortgageTerm: existing?.mortgageTerm ?? 0, // 0 = cash completo
  mortgageRate: existing?.mortgageRate ?? 12,
  notaryFees: existing?.notaryFees ?? DEFAULTS.VIS_NOTARY_FEES,
  registrationFees: existing?.registrationFees ?? DEFAULTS.VIS_REGISTRATION,
  beneficiaryTax: existing?.beneficiaryTax ?? DEFAULTS.VIS_BENEFICIARY_TAX,
  ivaPercent: existing?.ivaPercent ?? 0,
  refurbishmentCost: existing?.refurbishmentCost ?? DEFAULTS.VIS_REFURBISHMENT,
  refurbishmentMonths: existing?.refurbishmentMonths ?? DEFAULTS.VIS_REFURBISHMENT_MONTHS,
  monthlyRent: existing?.monthlyRent ?? DEFAULTS.DEFAULT_RENT,
  vacancyMonthsPerYear: existing?.vacancyMonthsPerYear ?? DEFAULTS.VACANCY_MONTHS,
  monthlyAdministration: existing?.monthlyAdministration ?? DEFAULTS.DEFAULT_ADMINISTRATION,
  administrationAnnualIncrease:
    existing?.administrationAnnualIncrease ?? DEFAULTS.ADMINISTRATION_INCREASE,
  maintenancePercent: existing?.maintenancePercent ?? DEFAULTS.MAINTENANCE_PERCENT,
  propertyTaxPercent: existing?.propertyTaxPercent ?? DEFAULTS.PROPERTY_TAX,
  rentalIncomeTax: existing?.rentalIncomeTax ?? DEFAULTS.RENTAL_INCOME_TAX,
  propertyAppreciation: existing?.propertyAppreciation ?? DEFAULTS.PROPERTY_APPRECIATION,
  horizonMonths: existing?.horizonMonths ?? 60
});

export const ImmediateRentForm: React.FC<Props> = ({ navigation, existingData }) => {
  const colors = useThemeColors();
  const { saveScenario } = useInvestmentComparison();

  // El id por defecto se genera una sola vez (no en cada render)
  const [defaultId] = useState(() => Crypto.randomUUID());

  const { handleSubmit, control } = useForm<ImmediateRentScenario>({
    mode: 'onTouched',
    defaultValues: buildDefaults(existingData, defaultId)
  });

  // Valores observados para los textos de ayuda
  const values = useWatch({ control });

  const onSubmit = (data: ImmediateRentScenario) => {
    saveScenario(ScenarioType.IMMEDIATE_RENT, { ...data, id: data.id || defaultId });
    ShowToast('Escenario de compra inmediata configurado');
    navigation.goBack();
  };

  const sectionStyle = [
    styles.section,
    {
      backgroundColor: colors.CARD_BACKGROUND,
      borderColor: colors.BORDER,
      shadowColor: colors.BLACK
    }
  ];

  const mortgageTerm = values.mortgageTerm ?? 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* INVERSIÓN INICIAL */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            💵 Inversión Inicial
          </Text>

          <MyInput
            name="name"
            control={control}
            label="Nombre del escenario"
            placeholder="Compra Inmediata para Renta"
            rules={{ required: 'El nombre es obligatorio' }}
            leftIcon="home-city"
            autoFocus
          />

          <MyInput
            name="availableCapital"
            type="currency"
            control={control}
            label="Capital disponible"
            placeholder="0"
            rules={{
              required: 'El capital es obligatorio',
              min: { value: 1000000, message: 'Mínimo $1.000.000' }
            }}
            leftIcon="cash-multiple"
            helperText={NumberFormat(values.availableCapital ?? 0)}
          />

          <MyInput
            name="propertyPrice"
            type="currency"
            control={control}
            label="Precio del inmueble"
            placeholder="0"
            rules={{
              required: 'El precio es obligatorio',
              min: { value: 10000000, message: 'Mínimo $10.000.000' }
            }}
            leftIcon="home"
            helperText={NumberFormat(values.propertyPrice ?? 0)}
          />

          <MyInput
            name="downPaymentPercent"
            type="number"
            control={control}
            label="Cuota inicial (%)"
            placeholder="30"
            rules={{
              required: 'La cuota inicial es obligatoria',
              min: { value: 0, message: 'Mínimo 0%' },
              max: { value: 100, message: 'Máximo 100%' }
            }}
            leftIcon="percent"
          />

          <MyInput
            name="mortgageTerm"
            type="number"
            control={control}
            label="Plazo hipoteca (meses, 0 = cash completo)"
            placeholder="0"
            leftIcon="calendar-clock"
            helperText={mortgageTerm > 0 ? `${Math.floor(mortgageTerm / 12)} años` : 'Sin crédito'}
          />

          <MyInput
            name="mortgageRate"
            type="number"
            control={control}
            label="Tasa hipoteca E.A. (%)"
            placeholder="12"
            leftIcon="percent"
          />

          <MyInput
            name="refurbishmentCost"
            type="currency"
            control={control}
            label="Costo de adecuación"
            placeholder="0"
            leftIcon="tools"
            helperText={NumberFormat(values.refurbishmentCost ?? 0)}
          />

          <Text
            style={[styles.helperText, { color: colors.INFO, backgroundColor: colors.INFO + '15' }]}
          >
            💡 Gastos de escrituración: ≈ 2.21% del valor (incluido automáticamente)
          </Text>
        </View>

        {/* GENERACIÓN DE RENTA */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            💰 Generación de Renta
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
            helperText={NumberFormat(values.monthlyRent ?? 0)}
          />

          <MyInput
            name="monthlyAdministration"
            type="currency"
            control={control}
            label="Administración mensual"
            placeholder="0"
            leftIcon="office-building"
            helperText={NumberFormat(values.monthlyAdministration ?? 0)}
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
            name="maintenancePercent"
            type="number"
            control={control}
            label="Mantenimiento anual (% del valor inmueble)"
            placeholder="1"
            leftIcon="wrench"
          />

          <MyInput
            name="propertyTaxPercent"
            type="number"
            control={control}
            label="Predial anual (% del valor inmueble)"
            placeholder="0.5"
            leftIcon="file-document"
          />

          <MyInput
            name="rentalIncomeTax"
            type="number"
            control={control}
            label="Impuesto sobre renta (% del arriendo)"
            placeholder="15"
            leftIcon="percent"
          />

          <MyInput
            name="propertyAppreciation"
            type="number"
            control={control}
            label="Apreciación anual (%)"
            placeholder="5"
            leftIcon="chart-line"
          />

          <MyInput
            name="horizonMonths"
            type="number"
            control={control}
            label="Horizonte de inversión (meses)"
            placeholder="60"
            rules={{
              required: 'El horizonte es obligatorio',
              min: { value: 1, message: 'Mínimo 1 mes' }
            }}
            leftIcon="calendar-range"
            helperText={`${Math.floor((values.horizonMonths ?? 0) / 12)} años`}
          />
        </View>

        <View style={styles.actions}>
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
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  actions: {
    marginTop: 16,
    gap: 8
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    borderRadius: 8
  }
});
