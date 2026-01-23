// ~/components/investment-comparison/forms/ExistingPropertyForm.tsx

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { Input, CheckBox } from 'react-native-elements';
import MyButton from '~/components/MyButton';
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';
import {
  ScenarioType,
  EXISTING_PROPERTY_DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';
import { MEDIUM, SMALL } from '~/styles/fonts';
import { calculateExistingProperty } from '~/utils/existingPropertyCalculations';

interface Props {
  colors: any;
  navigation: any;
  existingData?: any;
}

// Helper para obtener mensaje de error
const getErrorMessage = (error: any): string | undefined => {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error.message) return error.message as string;
  return undefined;
};

export const ExistingPropertyForm: React.FC<Props> = ({ colors, navigation, existingData }) => {
  const { saveScenario } = useInvestmentComparison();

  const {
    handleSubmit,
    control,
    formState: { errors },
    watch
  } = useForm<any>({
    defaultValues: {
      id: existingData?.id || Date.now().toString(),
      name: existingData?.name || 'Mi Propiedad Actual',

      // Datos de la inversión
      initialInvestment: existingData?.initialInvestment || 5000000,
      yearsOwned: existingData?.yearsOwned || 4,
      currentValue: existingData?.currentValue || 10000000,
      ownershipPercent:
        existingData?.ownershipPercent || EXISTING_PROPERTY_DEFAULTS.OWNERSHIP_PERCENT,

      // Ingresos
      monthlyRent: existingData?.monthlyRent || 150000,
      monthsRentedPerYear:
        existingData?.monthsRentedPerYear || EXISTING_PROPERTY_DEFAULTS.MONTHS_RENTED_PER_YEAR,

      // Gastos anuales (basados en tus datos 2025)
      annualAdministration: existingData?.annualAdministration || 562000, // ~$46.8k × 12
      administrationAnnualIncrease:
        existingData?.administrationAnnualIncrease ||
        EXISTING_PROPERTY_DEFAULTS.ADMINISTRATION_INCREASE,
      annualPropertyTax: existingData?.annualPropertyTax || 63750,
      annualMaintenance: existingData?.annualMaintenance || 145620,
      annualExtraExpenses: existingData?.annualExtraExpenses || 103652, // Comisiones y otros

      // Proyección
      propertyAppreciation:
        existingData?.propertyAppreciation || EXISTING_PROPERTY_DEFAULTS.PROPERTY_APPRECIATION,
      horizonYears: existingData?.horizonYears || EXISTING_PROPERTY_DEFAULTS.HORIZON_YEARS,
      inflation: existingData?.inflation || 5.5,

      // Comparación con venta
      compareWithSale:
        existingData?.compareWithSale !== undefined ? existingData.compareWithSale : true,
      cdtTermDays: existingData?.cdtTermDays || EXISTING_PROPERTY_DEFAULTS.CDT_TERM_DAYS,
      cdtRate: existingData?.cdtRate || EXISTING_PROPERTY_DEFAULTS.CDT_RATE,
      apply4x1000: existingData?.apply4x1000 !== undefined ? existingData.apply4x1000 : false
    }
  });

  const watchedValues = useWatch({ control });

  // Calcular preview en tiempo real
  const calculationPreview = useMemo(() => {
    const values = watchedValues;

    if (!values.currentValue || !values.monthlyRent || !values.horizonYears) {
      return null;
    }

    try {
      return calculateExistingProperty({
        initialInvestment: values.initialInvestment || 0,
        yearsOwned: values.yearsOwned || 0,
        currentValue: values.currentValue || 0,
        ownershipPercent: values.ownershipPercent || 50,
        monthlyRent: values.monthlyRent || 0,
        monthsRentedPerYear: values.monthsRentedPerYear || 10,
        annualAdministration: values.annualAdministration || 0,
        administrationAnnualIncrease: values.administrationAnnualIncrease || 5,
        annualPropertyTax: values.annualPropertyTax || 0,
        annualMaintenance: values.annualMaintenance || 0,
        annualExtraExpenses: values.annualExtraExpenses || 0,
        propertyAppreciation: values.propertyAppreciation || 5,
        horizonYears: values.horizonYears || 5,
        inflation: values.inflation || 5.5,
        compareWithSale: values.compareWithSale || false,
        cdtTermDays: values.cdtTermDays || 270,
        cdtRate: values.cdtRate || 9.4,
        apply4x1000: values.apply4x1000 || false
      });
    } catch (error) {
      console.error('Error en preview:', error);
      return null;
    }
  }, [watchedValues]);

  const onSubmit = (data: any) => {
    saveScenario(ScenarioType.EXISTING_PROPERTY, data);
    ShowToast('Propiedad existente configurada');
    navigation.goBack();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {/* DATOS BÁSICOS */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            📊 Datos de tu Propiedad
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
                errorMessage={getErrorMessage(errors?.name)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="initialInvestment"
            control={control}
            rules={{ required: true, min: { value: 1, message: 'Debe ser mayor a 0' } }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Inversión inicial (lo que pagaste originalmente)"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={getErrorMessage(errors?.initialInvestment)}
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
            name="yearsOwned"
            control={control}
            rules={{ required: true, min: 0 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Años que llevas con la propiedad"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={getErrorMessage(errors?.yearsOwned)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
              />
            )}
          />

          <Controller
            name="currentValue"
            control={control}
            rules={{ required: true, min: { value: 1, message: 'Debe ser mayor a 0' } }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Valor actual de tu parte (para vender)"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={getErrorMessage(errors?.currentValue)}
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
            name="ownershipPercent"
            control={control}
            rules={{ required: true, min: 1, max: 100 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="% de propiedad que tienes"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={getErrorMessage(errors?.ownershipPercent)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>{value}%</Text>
                }
              />
            )}
          />
        </View>

        {/* INGRESOS */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            💰 Ingresos por Renta
          </Text>

          <Controller
            name="monthlyRent"
            control={control}
            rules={{ required: true, min: { value: 1, message: 'Debe ser mayor a 0' } }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Renta mensual que RECIBES"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={getErrorMessage(errors?.monthlyRent)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}/mes
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="monthsRentedPerYear"
            control={control}
            rules={{ required: true, min: 0, max: 12 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Meses arrendado al año (promedio)"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                errorMessage={getErrorMessage(errors?.monthsRentedPerYear)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {12 - (value || 0)} meses vacío
                  </Text>
                }
              />
            )}
          />

          <Text style={[styles.helperText, { color: colors.INFO }]}>
            💡 En 2025 tuviste {12 - (watchedValues.monthsRentedPerYear || 10)} meses de vacancia
          </Text>
        </View>

        {/* GASTOS */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            📉 Gastos Anuales
          </Text>

          <Controller
            name="annualAdministration"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Administración anual"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}/año
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="administrationAnnualIncrease"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Incremento anual de administración (%)"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>{value}%</Text>
                }
              />
            )}
          />

          <Controller
            name="annualPropertyTax"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Impuesto predial anual"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}/año
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="annualMaintenance"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Mantenimiento anual (promedio)"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}/año
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="annualExtraExpenses"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Otros gastos anuales (comisiones, etc.)"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {NumberFormat(value || 0)}/año
                  </Text>
                }
              />
            )}
          />

          <Text style={[styles.helperText, { color: colors.WARNING }]}>
            ⚠️ Total gastos 2025: $
            {(
              (watchedValues.annualAdministration || 0) +
              (watchedValues.annualPropertyTax || 0) +
              (watchedValues.annualMaintenance || 0) +
              (watchedValues.annualExtraExpenses || 0)
            ).toLocaleString()}
          </Text>
        </View>

        {/* PROYECCIÓN */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            🔮 Proyección a Futuro
          </Text>

          <Controller
            name="propertyAppreciation"
            control={control}
            rules={{ min: -50, max: 50 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Valorización anual esperada (%)"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {value}% anual
                  </Text>
                }
              />
            )}
          />

          <Controller
            name="horizonYears"
            control={control}
            rules={{ required: true, min: 1, max: 30 }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Años a proyectar"
                value={value?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                errorMessage={getErrorMessage(errors?.horizonYears)}
                inputStyle={{ color: colors.TEXT_PRIMARY }}
                labelStyle={{ color: colors.TEXT_PRIMARY }}
                rightIcon={
                  <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                    {value} años
                  </Text>
                }
              />
            )}
          />
        </View>

        {/* COMPARACIÓN CON VENTA */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            🔄 Comparar con Vender y CDT
          </Text>

          <Controller
            name="compareWithSale"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CheckBox
                title="Comparar con vender y poner en CDT"
                checked={value}
                onPress={() => onChange(!value)}
                containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
                textStyle={{ color: colors.TEXT_PRIMARY, fontWeight: 'normal' }}
                checkedColor={colors.PRIMARY}
              />
            )}
          />

          {watchedValues.compareWithSale && (
            <>
              <Controller
                name="cdtTermDays"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Plazo CDT (días)"
                    value={value?.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => onChange(parseInt(text) || 0)}
                    inputStyle={{ color: colors.TEXT_PRIMARY }}
                    labelStyle={{ color: colors.TEXT_PRIMARY }}
                    rightIcon={
                      <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                        {value} días
                      </Text>
                    }
                  />
                )}
              />

              <Controller
                name="cdtRate"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Tasa CDT (% E.A.)"
                    value={value?.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                    inputStyle={{ color: colors.TEXT_PRIMARY }}
                    labelStyle={{ color: colors.TEXT_PRIMARY }}
                    rightIcon={
                      <Text style={{ color: colors.TEXT_SECONDARY, fontSize: SMALL }}>
                        {value}% E.A.
                      </Text>
                    }
                  />
                )}
              />

              <Controller
                name="apply4x1000"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CheckBox
                    title="Aplicar 4x1000 al vender"
                    checked={value}
                    onPress={() => onChange(!value)}
                    containerStyle={{
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                      padding: 0,
                      marginTop: 10
                    }}
                    textStyle={{ color: colors.TEXT_PRIMARY, fontWeight: 'normal' }}
                    checkedColor={colors.PRIMARY}
                  />
                )}
              />
            </>
          )}
        </View>

        {/* PREVIEW */}
        {calculationPreview && (
          <PreviewSection
            preview={calculationPreview}
            colors={colors}
            horizonYears={watchedValues.horizonYears}
          />
        )}

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

// Componente de Preview
const PreviewSection = ({ preview, colors, horizonYears }: any) => {
  const maintain = preview.maintain;
  const sell = preview.sell;
  const comparison = preview.comparison;

  return (
    <View
      style={[
        styles.previewSection,
        { backgroundColor: colors.SUCCESS + '10', borderColor: colors.SUCCESS }
      ]}
    >
      <Text style={[styles.previewTitle, { color: colors.SUCCESS }]}>
        📊 Proyección a {horizonYears} años
      </Text>

      {/* MANTENER */}
      <View style={styles.optionBox}>
        <Text style={[styles.optionTitle, { color: colors.TEXT_PRIMARY }]}>
          🏠 MANTENER Propiedad:
        </Text>
        <PreviewRow label="Renta total:" value={maintain.totalGrossRent} colors={colors} />
        <PreviewRow
          label="Gastos totales:"
          value={maintain.totalExpenses}
          colors={colors}
          error
          prefix="-"
        />
        <PreviewRow
          label="Flujo neto:"
          value={maintain.totalNetCashFlow}
          colors={colors}
          highlight
        />
        <PreviewRow
          label="Valorización:"
          value={maintain.capitalGain}
          colors={colors}
          success
          prefix="+"
        />
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <PreviewRow
          label="GANANCIA TOTAL:"
          value={maintain.totalReturn}
          colors={colors}
          highlight
          bold
        />
        <Text style={[styles.metricText, { color: colors.TEXT_SECONDARY }]}>
          ROI: {maintain.roi.toFixed(1)}% | Retorno anualizado:{' '}
          {maintain.annualizedReturn.toFixed(1)}%
        </Text>
      </View>

      {/* VENDER */}
      {sell && (
        <>
          <View style={[styles.optionBox, { marginTop: 12 }]}>
            <Text style={[styles.optionTitle, { color: colors.TEXT_PRIMARY }]}>
              💰 VENDER y CDT:
            </Text>
            <PreviewRow label="Monto venta:" value={sell.saleAmount} colors={colors} />
            <PreviewRow
              label="Intereses CDT:"
              value={sell.cdtInterest}
              colors={colors}
              success
              prefix="+"
            />
            <PreviewRow label="Impuestos:" value={sell.cdtTaxes} colors={colors} error prefix="-" />
            <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
            <PreviewRow
              label="GANANCIA TOTAL:"
              value={sell.totalReturn}
              colors={colors}
              highlight
              bold
            />
            <Text style={[styles.metricText, { color: colors.TEXT_SECONDARY }]}>
              ROI: {sell.roi.toFixed(1)}% | Retorno anualizado: {sell.annualizedReturn.toFixed(1)}%
            </Text>
          </View>

          {/* COMPARACIÓN */}
          {comparison && (
            <View
              style={[
                styles.recommendationBox,
                {
                  backgroundColor: comparison.maintainBetter
                    ? colors.SUCCESS + '20'
                    : colors.INFO + '20',
                  borderColor: comparison.maintainBetter ? colors.SUCCESS : colors.INFO
                }
              ]}
            >
              <Text
                style={[
                  styles.recommendationText,
                  {
                    color: comparison.maintainBetter ? colors.SUCCESS : colors.INFO
                  }
                ]}
              >
                {comparison.recommendation}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

// Componente auxiliar para filas
const PreviewRow = ({
  label,
  value,
  colors,
  highlight,
  error,
  success,
  bold,
  prefix = ''
}: any) => (
  <View style={styles.previewRow}>
    <Text style={[styles.previewLabel, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
    <Text
      style={[
        styles.previewValue,
        {
          color: highlight
            ? colors.SUCCESS
            : error
              ? colors.ERROR
              : success
                ? colors.SUCCESS
                : colors.TEXT_PRIMARY,
          fontWeight: bold ? 'bold' : '600'
        }
      ]}
    >
      {prefix}
      {NumberFormat(value)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  sectionTitle: { fontSize: MEDIUM, fontWeight: 'bold', marginBottom: 12 },
  helperText: { fontSize: SMALL - 1, lineHeight: 16, marginTop: 4, marginBottom: 8 },
  previewSection: { marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 2 },
  previewTitle: { fontSize: MEDIUM, fontWeight: 'bold', marginBottom: 12 },
  optionBox: { marginBottom: 8 },
  optionTitle: { fontSize: SMALL + 1, fontWeight: 'bold', marginBottom: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  previewLabel: { fontSize: SMALL, flex: 1 },
  previewValue: { fontSize: SMALL + 1, textAlign: 'right' },
  metricText: { fontSize: SMALL - 1, marginTop: 4, fontStyle: 'italic' },
  divider: { height: 1, marginVertical: 8 },
  recommendationBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2
  },
  recommendationText: {
    fontSize: SMALL,
    lineHeight: 18
  }
});
