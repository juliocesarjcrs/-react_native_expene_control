import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { CheckBox } from 'react-native-elements';

// Components
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';

// Context
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';

// Types
import {
  ScenarioType,
  EXISTING_PROPERTY_DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';
import { calculateExistingProperty } from '~/utils/existingPropertyCalculations';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface Props {
  colors: any;
  navigation: any;
  existingData?: any;
}

export const ExistingPropertyForm: React.FC<Props> = ({ colors, navigation, existingData }) => {
  const { saveScenario } = useInvestmentComparison();

  const { handleSubmit, control, watch } = useForm<any>({
    mode: 'onTouched',
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

      // Gastos anuales
      annualAdministration: existingData?.annualAdministration || 562000,
      administrationAnnualIncrease:
        existingData?.administrationAnnualIncrease ||
        EXISTING_PROPERTY_DEFAULTS.ADMINISTRATION_INCREASE,
      annualPropertyTax: existingData?.annualPropertyTax || 63750,
      annualMaintenance: existingData?.annualMaintenance || 145620,
      annualExtraExpenses: existingData?.annualExtraExpenses || 103652,

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

  // Watch specific values for helper text
  const initialInvestment = watch('initialInvestment');
  const currentValue = watch('currentValue');
  const monthlyRent = watch('monthlyRent');
  const monthsRentedPerYear = watch('monthsRentedPerYear');
  const annualAdministration = watch('annualAdministration');
  const annualPropertyTax = watch('annualPropertyTax');
  const annualMaintenance = watch('annualMaintenance');
  const annualExtraExpenses = watch('annualExtraExpenses');

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

          <MyInput
            name="name"
            control={control}
            label="Nombre del escenario"
            placeholder="Mi Propiedad Actual"
            rules={{ required: 'El nombre es obligatorio' }}
            leftIcon="home-city"
            autoFocus
          />

          <MyInput
            name="initialInvestment"
            type="currency"
            control={control}
            label="Inversión inicial (lo que pagaste originalmente)"
            placeholder="0"
            rules={{
              required: 'La inversión inicial es obligatoria',
              min: { value: 1, message: 'Debe ser mayor a 0' }
            }}
            leftIcon="cash-check"
            helperText={NumberFormat(initialInvestment || 0)}
          />

          <MyInput
            name="yearsOwned"
            type="number"
            control={control}
            label="Años que llevas con la propiedad"
            placeholder="0"
            rules={{
              required: 'Los años son obligatorios',
              min: { value: 0, message: 'No puede ser negativo' }
            }}
            leftIcon="calendar-check"
          />

          <MyInput
            name="currentValue"
            type="currency"
            control={control}
            label="Valor actual de tu parte (para vender)"
            placeholder="0"
            rules={{
              required: 'El valor actual es obligatorio',
              min: { value: 1, message: 'Debe ser mayor a 0' }
            }}
            leftIcon="cash-multiple"
            helperText={NumberFormat(currentValue || 0)}
          />

          <MyInput
            name="ownershipPercent"
            type="number"
            control={control}
            label="% de propiedad que tienes"
            placeholder="50"
            rules={{
              required: 'El porcentaje es obligatorio',
              min: { value: 1, message: 'Mínimo 1%' },
              max: { value: 100, message: 'Máximo 100%' }
            }}
            leftIcon="percent"
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

          <MyInput
            name="monthlyRent"
            type="currency"
            control={control}
            label="Renta mensual que RECIBES"
            placeholder="0"
            rules={{
              required: 'La renta mensual es obligatoria',
              min: { value: 1, message: 'Debe ser mayor a 0' }
            }}
            leftIcon="cash"
            helperText={`${NumberFormat(monthlyRent || 0)}/mes`}
          />

          <MyInput
            name="monthsRentedPerYear"
            type="number"
            control={control}
            label="Meses arrendado al año (promedio)"
            placeholder="10"
            rules={{
              required: 'Los meses son obligatorios',
              min: { value: 0, message: 'Mínimo 0 meses' },
              max: { value: 12, message: 'Máximo 12 meses' }
            }}
            leftIcon="calendar-month"
            helperText={`${12 - (monthsRentedPerYear || 0)} meses vacío`}
          />

          <Text style={[styles.helperText, { color: colors.INFO }]}>
            💡 En 2025 tuviste {12 - (monthsRentedPerYear || 10)} meses de vacancia
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

          <MyInput
            name="annualAdministration"
            type="currency"
            control={control}
            label="Administración anual"
            placeholder="0"
            leftIcon="office-building"
            helperText={`${NumberFormat(annualAdministration || 0)}/año`}
          />

          <MyInput
            name="administrationAnnualIncrease"
            type="number"
            control={control}
            label="Incremento anual de administración (%)"
            placeholder="5"
            leftIcon="trending-up"
          />

          <MyInput
            name="annualPropertyTax"
            type="currency"
            control={control}
            label="Impuesto predial anual"
            placeholder="0"
            leftIcon="file-document"
            helperText={`${NumberFormat(annualPropertyTax || 0)}/año`}
          />

          <MyInput
            name="annualMaintenance"
            type="currency"
            control={control}
            label="Mantenimiento anual (promedio)"
            placeholder="0"
            leftIcon="wrench"
            helperText={`${NumberFormat(annualMaintenance || 0)}/año`}
          />

          <MyInput
            name="annualExtraExpenses"
            type="currency"
            control={control}
            label="Otros gastos anuales (comisiones, etc.)"
            placeholder="0"
            leftIcon="cash-minus"
            helperText={`${NumberFormat(annualExtraExpenses || 0)}/año`}
          />

          <Text style={[styles.helperText, { color: colors.WARNING }]}>
            ⚠️ Total gastos 2025: $
            {(
              (annualAdministration || 0) +
              (annualPropertyTax || 0) +
              (annualMaintenance || 0) +
              (annualExtraExpenses || 0)
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

          <MyInput
            name="propertyAppreciation"
            type="number"
            control={control}
            label="Valorización anual esperada (%)"
            placeholder="5"
            rules={{
              min: { value: -50, message: 'Mínimo -50%' },
              max: { value: 50, message: 'Máximo 50%' }
            }}
            leftIcon="chart-line"
          />

          <MyInput
            name="horizonYears"
            type="number"
            control={control}
            label="Años a proyectar"
            placeholder="5"
            rules={{
              required: 'Los años son obligatorios',
              min: { value: 1, message: 'Mínimo 1 año' },
              max: { value: 30, message: 'Máximo 30 años' }
            }}
            leftIcon="calendar-range"
          />

          <MyInput
            name="inflation"
            type="number"
            control={control}
            label="Inflación esperada (%)"
            placeholder="5.5"
            leftIcon="trending-up"
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

          <CheckBox
            title="Comparar con vender y poner en CDT"
            checked={watchedValues.compareWithSale}
            onPress={() => {
              const currentValue = watchedValues.compareWithSale;
              // Necesitas implementar setValue o usar un Controller
            }}
            containerStyle={{
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
              marginBottom: 12
            }}
            textStyle={{ color: colors.TEXT_PRIMARY, fontWeight: 'normal' }}
            checkedColor={colors.PRIMARY}
          />

          {watchedValues.compareWithSale && (
            <>
              <MyInput
                name="cdtTermDays"
                type="number"
                control={control}
                label="Plazo CDT (días)"
                placeholder="270"
                leftIcon="calendar-clock"
              />

              <MyInput
                name="cdtRate"
                type="number"
                control={control}
                label="Tasa CDT (% E.A.)"
                placeholder="9.4"
                leftIcon="percent"
              />

              <CheckBox
                title="Aplicar 4x1000 al vender"
                checked={watchedValues.apply4x1000}
                onPress={() => {
                  // Implementar toggle
                }}
                containerStyle={{
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  padding: 0,
                  marginTop: 10
                }}
                textStyle={{ color: colors.TEXT_PRIMARY, fontWeight: 'normal' }}
                checkedColor={colors.PRIMARY}
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

// Componente de Preview (sin cambios)
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

// Componente auxiliar para filas (sin cambios)
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
  sectionTitle: { fontSize: MEDIUM, fontWeight: 'bold', marginBottom: 12 },
  helperText: {
    fontSize: SMALL - 1,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8
  },
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
