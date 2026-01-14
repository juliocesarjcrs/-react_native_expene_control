// ~/components/investment-comparison/forms/FuturePropertyForm.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';
import MyButton from '~/components/MyButton';
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';
import {
  FuturePropertyScenario,
  ScenarioType,
  DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface Props {
  colors: any;
  navigation: any;
  existingData?: FuturePropertyScenario;
}

export const FuturePropertyForm: React.FC<Props> = ({ colors, navigation, existingData }) => {
  const { saveScenario } = useInvestmentComparison();

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<FuturePropertyScenario>({
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
      rentalIncomeTax: existingData?.rentalIncomeTax || 0, // 0% para VIS
      propertyAppreciation: existingData?.propertyAppreciation || DEFAULTS.PROPERTY_APPRECIATION,
      horizonMonths: existingData?.horizonMonths || 60
    }
  });

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

          <Controller
            name="name"
            control={control}
            rules={{ required: { value: true, message: 'Obligatorio' } }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nombre del escenario"
                value={value}
                onChangeText={onChange}
                errorMessage={errors?.name?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="propertyPrice"
            control={control}
            rules={{
              required: true,
              max: {
                value: DEFAULTS.VIS_MAX_VALUE,
                message: `Máximo VIS: ${NumberFormat(DEFAULTS.VIS_MAX_VALUE)}`
              }
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Precio del inmueble (COP)"
                value={value?.toString()}
                placeholder="175500000"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={errors?.propertyPrice?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="downPaymentPercent"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Cuota inicial (%)"
                value={value?.toString()}
                placeholder="30"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="savingMonths"
            control={control}
            rules={{ required: true, min: 1 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Tiempo de ahorro (meses)"
                value={value?.toString()}
                placeholder="24"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                errorMessage={errors?.savingMonths?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {Math.floor((value || 0) / 12)} años
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="monthlyContribution"
            control={control}
            rules={{ required: true, min: 100000 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Aporte mensual (COP)"
                value={value?.toString()}
                placeholder="2000000"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={errors?.monthlyContribution?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="savingsRate"
            control={control}
            rules={{ required: true, min: 0.1, max: 30 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Tasa de rendimiento mientras ahorras (%)"
                value={value?.toString()}
                placeholder="8.25"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={errors?.savingsRate?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
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

          <Controller
            name="refurbishmentCost"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Costo de adecuación (COP)"
                value={value?.toString()}
                placeholder="30000000"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="refurbishmentMonths"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Tiempo de adecuación (meses)"
                value={value?.toString()}
                placeholder="2"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
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

          <Controller
            name="monthlyRent"
            control={control}
            rules={{ required: true, min: 100000 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Canon de arriendo mensual (COP)"
                value={value?.toString()}
                placeholder="1300000"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={errors?.monthlyRent?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="monthlyAdministration"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Administración mensual (COP)"
                value={value?.toString()}
                placeholder="300000"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="vacancyMonthsPerYear"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Meses de vacancia al año"
                value={value?.toString()}
                placeholder="1"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="horizonMonths"
            control={control}
            rules={{ required: true, min: 1 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Horizonte de renta (meses después de comprar)"
                value={value?.toString()}
                placeholder="60"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                errorMessage={errors?.horizonMonths?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {Math.floor((value || 0) / 12)} años
                  </Text>
                }
              />
            )}
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
  section: { marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  sectionTitle: { fontSize: MEDIUM, fontWeight: 'bold', marginBottom: 12 },
  helperText: { fontSize: SMALL - 1, lineHeight: 16, marginTop: 4 }
});
