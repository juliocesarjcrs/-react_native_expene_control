// ~/components/investment-comparison/forms/ImmediateRentForm.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from 'react-native-elements';
import MyButton from '~/components/MyButton';
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';
import {
  ImmediateRentScenario,
  ScenarioType,
  DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface Props {
  colors: any;
  navigation: any;
  existingData?: ImmediateRentScenario;
}

export const ImmediateRentForm: React.FC<Props> = ({ colors, navigation, existingData }) => {
  const { saveScenario } = useInvestmentComparison();

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<ImmediateRentScenario>({
    defaultValues: {
      id: existingData?.id || Date.now().toString(),
      name: existingData?.name || 'Compra Inmediata para Renta',
      availableCapital: existingData?.availableCapital || DEFAULTS.DEFAULT_CAPITAL,
      propertyPrice: existingData?.propertyPrice || 300000000,
      downPaymentPercent: existingData?.downPaymentPercent || DEFAULTS.VIS_DOWN_PAYMENT,
      mortgageTerm: existingData?.mortgageTerm || 0, // 0 = cash completo
      mortgageRate: existingData?.mortgageRate || 12,
      notaryFees: existingData?.notaryFees || DEFAULTS.VIS_NOTARY_FEES,
      registrationFees: existingData?.registrationFees || DEFAULTS.VIS_REGISTRATION,
      beneficiaryTax: existingData?.beneficiaryTax || DEFAULTS.VIS_BENEFICIARY_TAX,
      ivaPercent: existingData?.ivaPercent || 0,
      refurbishmentCost: existingData?.refurbishmentCost || DEFAULTS.VIS_REFURBISHMENT,
      refurbishmentMonths: existingData?.refurbishmentMonths || DEFAULTS.VIS_REFURBISHMENT_MONTHS,
      monthlyRent: existingData?.monthlyRent || DEFAULTS.DEFAULT_RENT,
      vacancyMonthsPerYear: existingData?.vacancyMonthsPerYear || DEFAULTS.VACANCY_MONTHS,
      monthlyAdministration: existingData?.monthlyAdministration || DEFAULTS.DEFAULT_ADMINISTRATION,
      administrationAnnualIncrease:
        existingData?.administrationAnnualIncrease || DEFAULTS.ADMINISTRATION_INCREASE,
      maintenancePercent: existingData?.maintenancePercent || DEFAULTS.MAINTENANCE_PERCENT,
      propertyTaxPercent: existingData?.propertyTaxPercent || DEFAULTS.PROPERTY_TAX,
      rentalIncomeTax: existingData?.rentalIncomeTax || DEFAULTS.RENTAL_INCOME_TAX,
      propertyAppreciation: existingData?.propertyAppreciation || DEFAULTS.PROPERTY_APPRECIATION,
      horizonMonths: existingData?.horizonMonths || 60
    }
  });

  const onSubmit = (data: ImmediateRentScenario) => {
    saveScenario(ScenarioType.IMMEDIATE_RENT, data);
    ShowToast('Escenario de compra inmediata configurado');
    navigation.goBack();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {/* INVERSIÓN INICIAL */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            💵 Inversión Inicial
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
            name="availableCapital"
            control={control}
            rules={{ required: true, min: 1000000 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Capital disponible (COP)"
                value={value?.toString()}
                placeholder="100000000"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={errors?.availableCapital?.message}
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
            name="propertyPrice"
            control={control}
            rules={{ required: true, min: 10000000 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Precio del inmueble (COP)"
                value={value?.toString()}
                placeholder="300000000"
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
            rules={{ required: true, min: 0, max: 100 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Cuota inicial (%)"
                value={value?.toString()}
                placeholder="30"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={errors?.downPaymentPercent?.message}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="mortgageTerm"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Plazo hipoteca (meses, 0 = cash completo)"
                value={value?.toString()}
                placeholder="0"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {value && value > 0 ? `${Math.floor(value / 12)} años` : 'Sin crédito'}
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="mortgageRate"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Tasa hipoteca E.A. (%)"
                value={value?.toString()}
                placeholder="12"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

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

          <Text style={[styles.helperText, { color: colors.INFO }]}>
            💡 Gastos de escrituración: ≈ 2.21% del valor (incluido automáticamente)
          </Text>
        </View>

        {/* GENERACIÓN DE RENTA */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            💰 Generación de Renta
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
            name="maintenancePercent"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Mantenimiento anual (% del valor inmueble)"
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
            name="propertyTaxPercent"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Predial anual (% del valor inmueble)"
                value={value?.toString()}
                placeholder="0.5"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="rentalIncomeTax"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Impuesto sobre renta (% del arriendo)"
                value={value?.toString()}
                placeholder="15"
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="propertyAppreciation"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Apreciación anual (%)"
                value={value?.toString()}
                placeholder="5"
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
                label="Horizonte de inversión (meses)"
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
