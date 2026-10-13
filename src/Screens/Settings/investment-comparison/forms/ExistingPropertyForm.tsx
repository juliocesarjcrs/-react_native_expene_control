import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { CheckBox } from 'react-native-elements';
import * as Crypto from 'expo-crypto';

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

// Theme & Styles
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

type CalculationInput = Parameters<typeof calculateExistingProperty>[0];
type ExistingPropertyFormData = CalculationInput & { id: string; name: string };
type Preview = ReturnType<typeof calculateExistingProperty>;

type RowTone = 'default' | 'highlight' | 'error' | 'success';

interface Props {
  navigation: { goBack: () => void };
  existingData?: Partial<ExistingPropertyFormData>;
}

const buildDefaults = (
  existing: Partial<ExistingPropertyFormData> | undefined,
  id: string
): ExistingPropertyFormData => ({
  id: existing?.id ?? id,
  name: existing?.name ?? 'Mi Propiedad Actual',

  // Datos de la inversión
  initialInvestment: existing?.initialInvestment ?? 5000000,
  yearsOwned: existing?.yearsOwned ?? 4,
  currentValue: existing?.currentValue ?? 10000000,
  ownershipPercent: existing?.ownershipPercent ?? EXISTING_PROPERTY_DEFAULTS.OWNERSHIP_PERCENT,

  // Ingresos
  monthlyRent: existing?.monthlyRent ?? 150000,
  monthsRentedPerYear:
    existing?.monthsRentedPerYear ?? EXISTING_PROPERTY_DEFAULTS.MONTHS_RENTED_PER_YEAR,

  // Gastos anuales
  annualAdministration: existing?.annualAdministration ?? 562000,
  administrationAnnualIncrease:
    existing?.administrationAnnualIncrease ?? EXISTING_PROPERTY_DEFAULTS.ADMINISTRATION_INCREASE,
  annualPropertyTax: existing?.annualPropertyTax ?? 63750,
  annualMaintenance: existing?.annualMaintenance ?? 145620,
  annualExtraExpenses: existing?.annualExtraExpenses ?? 103652,

  // Proyección
  propertyAppreciation:
    existing?.propertyAppreciation ?? EXISTING_PROPERTY_DEFAULTS.PROPERTY_APPRECIATION,
  horizonYears: existing?.horizonYears ?? EXISTING_PROPERTY_DEFAULTS.HORIZON_YEARS,
  inflation: existing?.inflation ?? 5.5,

  // Comparación con venta
  compareWithSale: existing?.compareWithSale ?? true,
  cdtTermDays: existing?.cdtTermDays ?? EXISTING_PROPERTY_DEFAULTS.CDT_TERM_DAYS,
  cdtRate: existing?.cdtRate ?? EXISTING_PROPERTY_DEFAULTS.CDT_RATE,
  apply4x1000: existing?.apply4x1000 ?? false
});

// Calcula la vista previa en tiempo real (null si faltan datos o el cálculo falla)
const buildPreview = (values: Partial<ExistingPropertyFormData>): Preview | null => {
  if (!values.currentValue || !values.monthlyRent || !values.horizonYears) return null;

  try {
    return calculateExistingProperty({
      initialInvestment: values.initialInvestment ?? 0,
      yearsOwned: values.yearsOwned ?? 0,
      currentValue: values.currentValue,
      ownershipPercent: values.ownershipPercent ?? 50,
      monthlyRent: values.monthlyRent,
      monthsRentedPerYear: values.monthsRentedPerYear ?? 10,
      annualAdministration: values.annualAdministration ?? 0,
      administrationAnnualIncrease: values.administrationAnnualIncrease ?? 5,
      annualPropertyTax: values.annualPropertyTax ?? 0,
      annualMaintenance: values.annualMaintenance ?? 0,
      annualExtraExpenses: values.annualExtraExpenses ?? 0,
      propertyAppreciation: values.propertyAppreciation ?? 5,
      horizonYears: values.horizonYears,
      inflation: values.inflation ?? 5.5,
      compareWithSale: values.compareWithSale ?? false,
      cdtTermDays: values.cdtTermDays ?? 270,
      cdtRate: values.cdtRate ?? 9.4,
      apply4x1000: values.apply4x1000 ?? false
    });
  } catch {
    return null;
  }
};

export const ExistingPropertyForm: React.FC<Props> = ({ navigation, existingData }) => {
  const colors = useThemeColors();
  const { saveScenario } = useInvestmentComparison();

  // El id por defecto se genera una sola vez (no en cada render)
  const [defaultId] = useState(() => Crypto.randomUUID());

  const { handleSubmit, control, setValue } = useForm<ExistingPropertyFormData>({
    mode: 'onTouched',
    defaultValues: buildDefaults(existingData, defaultId)
  });

  const values = useWatch({ control });
  const preview = buildPreview(values);

  const monthsRented = values.monthsRentedPerYear ?? 0;
  const totalExpenses =
    (values.annualAdministration ?? 0) +
    (values.annualPropertyTax ?? 0) +
    (values.annualMaintenance ?? 0) +
    (values.annualExtraExpenses ?? 0);

  const onSubmit = (data: ExistingPropertyFormData) => {
    saveScenario(ScenarioType.EXISTING_PROPERTY, { ...data, id: data.id || defaultId });
    ShowToast('Propiedad existente configurada');
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

  const helperStyle = (color: string) => [
    styles.helperText,
    { color, backgroundColor: color + '15' }
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* DATOS BÁSICOS */}
        <View style={sectionStyle}>
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
            helperText={NumberFormat(values.initialInvestment ?? 0)}
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
            helperText={NumberFormat(values.currentValue ?? 0)}
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
        <View style={sectionStyle}>
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
            helperText={`${NumberFormat(values.monthlyRent ?? 0)}/mes`}
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
            helperText={`${12 - monthsRented} meses vacío`}
          />

          <Text style={helperStyle(colors.INFO)}>
            💡 En 2025 tuviste {12 - monthsRented} meses de vacancia
          </Text>
        </View>

        {/* GASTOS */}
        <View style={sectionStyle}>
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
            helperText={`${NumberFormat(values.annualAdministration ?? 0)}/año`}
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
            helperText={`${NumberFormat(values.annualPropertyTax ?? 0)}/año`}
          />

          <MyInput
            name="annualMaintenance"
            type="currency"
            control={control}
            label="Mantenimiento anual (promedio)"
            placeholder="0"
            leftIcon="wrench"
            helperText={`${NumberFormat(values.annualMaintenance ?? 0)}/año`}
          />

          <MyInput
            name="annualExtraExpenses"
            type="currency"
            control={control}
            label="Otros gastos anuales (comisiones, etc.)"
            placeholder="0"
            leftIcon="cash-minus"
            helperText={`${NumberFormat(values.annualExtraExpenses ?? 0)}/año`}
          />

          <Text style={helperStyle(colors.WARNING)}>
            {`⚠️ Total gastos 2025: $${totalExpenses.toLocaleString()}`}
          </Text>
        </View>

        {/* PROYECCIÓN */}
        <View style={sectionStyle}>
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
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            🔄 Comparar con Vender y CDT
          </Text>

          <CheckBox
            title="Comparar con vender y poner en CDT"
            checked={Boolean(values.compareWithSale)}
            onPress={() => setValue('compareWithSale', !values.compareWithSale)}
            containerStyle={[styles.checkboxContainer, styles.checkboxCompare]}
            textStyle={[styles.checkboxText, { color: colors.TEXT_PRIMARY }]}
            checkedColor={colors.PRIMARY}
          />

          {values.compareWithSale && (
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
                checked={Boolean(values.apply4x1000)}
                onPress={() => setValue('apply4x1000', !values.apply4x1000)}
                containerStyle={[styles.checkboxContainer, styles.checkbox4x1000]}
                textStyle={[styles.checkboxText, { color: colors.TEXT_PRIMARY }]}
                checkedColor={colors.PRIMARY}
              />
            </>
          )}
        </View>

        {/* PREVIEW */}
        {preview && <PreviewSection preview={preview} horizonYears={values.horizonYears} />}

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

// ─────────────────────────────────────────────
// Preview
// ─────────────────────────────────────────────

interface PreviewSectionProps {
  preview: Preview;
  horizonYears?: number;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({ preview, horizonYears }) => {
  const colors = useThemeColors();
  const { maintain, sell, comparison } = preview;

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
        <PreviewRow label="Renta total:" value={maintain.totalGrossRent} />
        <PreviewRow
          label="Gastos totales:"
          value={maintain.totalExpenses}
          tone="error"
          prefix="-"
        />
        <PreviewRow label="Flujo neto:" value={maintain.totalNetCashFlow} tone="highlight" />
        <PreviewRow label="Valorización:" value={maintain.capitalGain} tone="success" prefix="+" />
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <PreviewRow label="GANANCIA TOTAL:" value={maintain.totalReturn} tone="highlight" bold />
        <Text style={[styles.metricText, { color: colors.TEXT_SECONDARY }]}>
          ROI: {maintain.roi.toFixed(1)}% | Retorno anualizado:{' '}
          {maintain.annualizedReturn.toFixed(1)}%
        </Text>
      </View>

      {/* VENDER */}
      {sell && (
        <>
          <View style={[styles.optionBox, styles.sellBox]}>
            <Text style={[styles.optionTitle, { color: colors.TEXT_PRIMARY }]}>
              💰 VENDER y CDT:
            </Text>
            <PreviewRow label="Monto venta:" value={sell.saleAmount} />
            <PreviewRow label="Intereses CDT:" value={sell.cdtInterest} tone="success" prefix="+" />
            <PreviewRow label="Impuestos:" value={sell.cdtTaxes} tone="error" prefix="-" />
            <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
            <PreviewRow label="GANANCIA TOTAL:" value={sell.totalReturn} tone="highlight" bold />
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
                  backgroundColor:
                    (comparison.maintainBetter ? colors.SUCCESS : colors.INFO) + '20',
                  borderColor: comparison.maintainBetter ? colors.SUCCESS : colors.INFO
                }
              ]}
            >
              <Text
                style={[
                  styles.recommendationText,
                  { color: comparison.maintainBetter ? colors.SUCCESS : colors.INFO }
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

// ─────────────────────────────────────────────
// Fila de preview
// ─────────────────────────────────────────────

interface PreviewRowProps {
  label: string;
  value: number;
  tone?: RowTone;
  bold?: boolean;
  prefix?: string;
}

const PreviewRow: React.FC<PreviewRowProps> = ({
  label,
  value,
  tone = 'default',
  bold = false,
  prefix = ''
}) => {
  const colors = useThemeColors();

  const valueColor: Record<RowTone, string> = {
    default: colors.TEXT_PRIMARY,
    highlight: colors.SUCCESS,
    error: colors.ERROR,
    success: colors.SUCCESS
  };

  return (
    <View style={styles.previewRow}>
      <Text style={[styles.previewLabel, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
      <Text
        style={[
          styles.previewValue,
          { color: valueColor[tone], fontWeight: bold ? 'bold' : '600' }
        ]}
      >
        {prefix}
        {NumberFormat(value)}
      </Text>
    </View>
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
    marginBottom: 8,
    padding: 8,
    borderRadius: 8
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0
  },
  checkboxCompare: {
    marginBottom: 12
  },
  checkbox4x1000: {
    marginTop: 10
  },
  checkboxText: {
    fontWeight: 'normal'
  },
  previewSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2
  },
  previewTitle: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginBottom: 12
  },
  optionBox: {
    marginBottom: 8
  },
  sellBox: {
    marginTop: 12
  },
  optionTitle: {
    fontSize: SMALL + 1,
    fontWeight: 'bold',
    marginBottom: 8
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  previewLabel: {
    fontSize: SMALL,
    flex: 1
  },
  previewValue: {
    fontSize: SMALL + 1,
    textAlign: 'right'
  },
  metricText: {
    fontSize: SMALL - 1,
    marginTop: 4,
    fontStyle: 'italic'
  },
  divider: {
    height: 1,
    marginVertical: 8
  },
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
