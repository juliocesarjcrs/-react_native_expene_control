import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { CheckBox, Icon } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';

// Components
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';

// Context
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';

// Types
import {
  SavingsScenario,
  ScenarioType,
  DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';

// Utils
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';
import { calculateSavings } from '~/utils/investmentCalculations';
import { calculateCDT, CDT_RATES, CDT_TERMS } from '~/utils/cdtCalculations_original';
import { validateSerializable } from '~/utils/serializationHelper';

// Theme & Styles
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

type ProductType = 'cajitas' | 'cdt';

type SavingsFormData = {
  id: string;
  name: string;
  productType: ProductType;
  // Cajitas
  initialCapital: number;
  monthlyContribution: number;
  annualRate: number;
  horizonMonths: number;
  // CDT
  cdtCapital: number;
  cdtTermDays: number;
  // Común
  apply4x1000: boolean;
  withholdingTax: number;
  inflation: number;
};

type ExistingSavings = SavingsScenario &
  Partial<Pick<SavingsFormData, 'productType' | 'cdtCapital' | 'cdtTermDays'>>;

type CajitasPreviewData = { type: 'cajitas' } & ReturnType<typeof calculateSavings>;
type CDTPreviewData = { type: 'cdt' } & ReturnType<typeof calculateCDT>;
type Preview = CajitasPreviewData | CDTPreviewData | null;

type RowTone = 'default' | 'highlight' | 'error' | 'warning' | 'success';

interface Props {
  navigation: { goBack: () => void };
  existingData?: ExistingSavings;
}

const CAJITAS_WITHHOLDING = 7;
const CDT_WITHHOLDING = 4;

const buildDefaults = (existing: ExistingSavings | undefined, id: string): SavingsFormData => {
  const productType = existing?.productType ?? 'cajitas';

  return {
    id: existing?.id ?? id,
    name: existing?.name ?? 'Mi Ahorro',
    productType,

    // Cajitas
    initialCapital: existing?.initialCapital ?? 10000000,
    monthlyContribution: existing?.monthlyContribution ?? 0,
    annualRate: existing?.annualRate ?? DEFAULTS.NUBANK_CAJITAS_RATE,
    horizonMonths: existing?.horizonMonths ?? 12,

    // CDT
    cdtCapital: existing?.cdtCapital ?? 1000000,
    cdtTermDays: existing?.cdtTermDays ?? 90,

    // Común
    apply4x1000: existing?.apply4x1000 ?? false,
    withholdingTax:
      existing?.withholdingTax ?? (productType === 'cdt' ? CDT_WITHHOLDING : CAJITAS_WITHHOLDING),
    inflation: existing?.inflation ?? DEFAULTS.INFLATION_COLOMBIA
  };
};

// Calcula la vista previa según el tipo de producto (null si faltan datos)
const buildPreview = (values: Partial<SavingsFormData>): Preview => {
  if ((values.productType ?? 'cajitas') === 'cajitas') {
    const initialCapital = values.initialCapital ?? 0;
    const annualRate = values.annualRate ?? 0;
    const horizonMonths = values.horizonMonths ?? 0;

    if (initialCapital <= 0 || annualRate <= 0 || horizonMonths <= 0) return null;

    return {
      type: 'cajitas',
      ...calculateSavings({
        initialCapital,
        monthlyContribution: values.monthlyContribution ?? 0,
        annualRate,
        horizonMonths,
        apply4x1000: values.apply4x1000,
        withholdingTax: CAJITAS_WITHHOLDING,
        inflation: values.inflation
      })
    };
  }

  const capitalAmount = values.cdtCapital ?? 0;
  if (capitalAmount <= 0) return null;

  return {
    type: 'cdt',
    ...calculateCDT({
      capitalAmount,
      termDays: values.cdtTermDays ?? 90,
      apply4x1000: values.apply4x1000,
      withholdingTax: CDT_WITHHOLDING,
      inflation: values.inflation
    })
  };
};

export const SavingsForm: React.FC<Props> = ({ navigation, existingData }) => {
  const colors = useThemeColors();
  const { saveScenario } = useInvestmentComparison();

  // El id por defecto se genera una sola vez (no en cada render)
  const [defaultId] = useState(() => Date.now().toString());

  const { handleSubmit, control, setValue } = useForm<SavingsFormData>({
    mode: 'onTouched',
    defaultValues: buildDefaults(existingData, defaultId)
  });

  const values = useWatch({ control });
  const productType: ProductType = values.productType ?? 'cajitas';
  const isCajitas = productType === 'cajitas';
  const preview = buildPreview(values);

  const onSubmit = (data: SavingsFormData) => {
    const scenarioData = { ...data, id: data.id || defaultId };

    if (!validateSerializable(scenarioData, 'scenarioData')) {
      ShowToast('Error: Datos inválidos');
      return;
    }

    saveScenario(ScenarioType.SAVINGS, scenarioData);
    ShowToast('Escenario configurado correctamente');
    navigation.goBack();
  };

  const handleProductTypeChange = (type: ProductType) => {
    setValue('productType', type);
    setValue('withholdingTax', type === 'cdt' ? CDT_WITHHOLDING : CAJITAS_WITHHOLDING);
  };

  const sectionStyle = [
    styles.section,
    {
      backgroundColor: colors.CARD_BACKGROUND,
      borderColor: colors.BORDER,
      shadowColor: colors.BLACK
    }
  ];
  const helperBoxStyle = [
    styles.helperText,
    { color: colors.INFO, backgroundColor: colors.INFO + '15' }
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* SELECTOR DE TIPO DE PRODUCTO */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            Tipo de Producto
          </Text>

          <View style={styles.productSelector}>
            <ProductOption
              selected={isCajitas}
              tint={colors.SUCCESS}
              icon="piggy-bank"
              title="Cajitas Nubank"
              rate="8.25% E.A."
              description={'Liquidez diaria\nCapitalización diaria'}
              onPress={() => handleProductTypeChange('cajitas')}
            />
            <ProductOption
              selected={!isCajitas}
              tint={colors.INFO}
              icon="file-certificate"
              title="CDT Nubank"
              rate="9.00% - 9.70% E.A."
              description={'Plazo fijo\nInterés al vencimiento'}
              onPress={() => handleProductTypeChange('cdt')}
            />
          </View>
        </View>

        {/* FORMULARIO SEGÚN TIPO */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            {isCajitas ? '💰 Cajitas - Ahorro Líquido' : '📄 CDT - A Plazo Fijo'}
          </Text>

          <MyInput
            name="name"
            control={control}
            label="Nombre del escenario"
            placeholder="Mi Ahorro"
            rules={{ required: 'El nombre es obligatorio' }}
            leftIcon="piggy-bank"
            autoFocus
          />

          {isCajitas ? (
            <>
              <MyInput
                name="initialCapital"
                type="currency"
                control={control}
                label="Capital inicial"
                placeholder="0"
                rules={{
                  required: 'El capital inicial es obligatorio',
                  min: { value: 100000, message: 'Mínimo $100.000' }
                }}
                leftIcon="cash-multiple"
                helperText={NumberFormat(values.initialCapital ?? 0)}
              />

              <MyInput
                name="monthlyContribution"
                type="currency"
                control={control}
                label="Aporte mensual (opcional)"
                placeholder="0"
                leftIcon="cash-plus"
                helperText={NumberFormat(values.monthlyContribution ?? 0)}
              />

              <MyInput
                name="horizonMonths"
                type="number"
                control={control}
                label="Horizonte (meses)"
                placeholder="12"
                rules={{
                  required: 'El horizonte es obligatorio',
                  min: { value: 1, message: 'Mínimo 1 mes' }
                }}
                leftIcon="calendar-range"
                helperText={`${Math.floor((values.horizonMonths ?? 0) / 12)} años`}
              />

              <Text style={helperBoxStyle}>
                💡 Tasa: 8.25% E.A. | Retención: 7% | Capitalización diaria
              </Text>
            </>
          ) : (
            <>
              <MyInput
                name="cdtCapital"
                type="currency"
                control={control}
                label="Monto a invertir"
                placeholder="0"
                rules={{
                  required: 'El monto es obligatorio',
                  min: { value: 100000, message: 'Mínimo $100.000' }
                }}
                leftIcon="cash-check"
                helperText={NumberFormat(values.cdtCapital ?? 0)}
              />

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Plazo del CDT *</Text>
                <View
                  style={[
                    styles.pickerContainer,
                    { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }
                  ]}
                >
                  <Picker
                    selectedValue={values.cdtTermDays}
                    onValueChange={(value) => setValue('cdtTermDays', value)}
                    style={{ color: colors.TEXT_PRIMARY }}
                  >
                    {CDT_TERMS.map((days) => (
                      <Picker.Item
                        key={days}
                        label={`${days} días - ${CDT_RATES[days]}% E.A.`}
                        value={days}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <Text style={helperBoxStyle}>
                💡 Retención: 4% sobre intereses | Pago al vencimiento | Sin aportes mensuales
              </Text>
            </>
          )}

          {/* CHECKBOX 4x1000 */}
          <CheckBox
            title="Aplicar impuesto 4x1000"
            checked={Boolean(values.apply4x1000)}
            onPress={() => setValue('apply4x1000', !values.apply4x1000)}
            containerStyle={styles.checkboxContainer}
            textStyle={[styles.checkboxText, { color: colors.TEXT_PRIMARY }]}
            checkedColor={colors.PRIMARY}
          />
          <Text style={[styles.helperText, styles.checkboxHint, { color: colors.TEXT_SECONDARY }]}>
            ℹ️ Marca si no tienes cuenta exenta de 4x1000
          </Text>
        </View>

        {/* PREVIEW SEGÚN TIPO */}
        {preview?.type === 'cajitas' && (
          <CajitasPreview preview={preview} horizonMonths={values.horizonMonths} />
        )}
        {preview?.type === 'cdt' && <CDTPreview preview={preview} />}

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
// Opción de producto (tarjeta seleccionable)
// ─────────────────────────────────────────────

interface ProductOptionProps {
  selected: boolean;
  tint: string;
  icon: string;
  title: string;
  rate: string;
  description: string;
  onPress: () => void;
}

const ProductOption: React.FC<ProductOptionProps> = ({
  selected,
  tint,
  icon,
  title,
  rate,
  description,
  onPress
}) => {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        {
          backgroundColor: selected ? tint + '20' : colors.BACKGROUND,
          borderColor: selected ? tint : colors.BORDER
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.productCardHeader}>
        <Icon
          type="material-community"
          name={icon}
          size={32}
          color={selected ? tint : colors.TEXT_SECONDARY}
        />
        {selected && <Icon type="material-community" name="check-circle" size={20} color={tint} />}
      </View>
      <Text style={[styles.productCardTitle, { color: selected ? tint : colors.TEXT_PRIMARY }]}>
        {title}
      </Text>
      <Text style={[styles.productCardRate, { color: colors.TEXT_SECONDARY }]}>{rate}</Text>
      <Text style={[styles.productCardDescription, { color: colors.TEXT_SECONDARY }]}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Preview Cajitas
// ─────────────────────────────────────────────

interface CajitasPreviewProps {
  preview: CajitasPreviewData;
  horizonMonths?: number;
}

const CajitasPreview: React.FC<CajitasPreviewProps> = ({ preview, horizonMonths }) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.previewSection,
        { backgroundColor: colors.SUCCESS + '10', borderColor: colors.SUCCESS }
      ]}
    >
      <View style={styles.previewHeader}>
        <Icon type="material-community" name="calculator" size={24} color={colors.SUCCESS} />
        <Text style={[styles.previewTitle, { color: colors.SUCCESS }]}>
          En {horizonMonths} meses tendrías
        </Text>
      </View>

      <View
        style={[
          styles.totalBox,
          { backgroundColor: colors.SUCCESS + '20', borderColor: colors.SUCCESS }
        ]}
      >
        <Text style={[styles.totalValue, { color: colors.SUCCESS }]}>
          {NumberFormat(preview.balanceAfterTaxes)}
        </Text>
      </View>

      <PreviewRow label="Habrías depositado:" value={preview.totalDeposited} />
      <PreviewRow
        label="Tu dinero habría crecido:"
        value={preview.grossEarnings}
        tone="highlight"
      />
      <PreviewRow
        label="Total retención en la fuente:"
        value={preview.withholdingAmount}
        tone="error"
      />

      {preview.fourPerThousandTotal > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
          <Text style={[styles.previewSubheader, { color: colors.TEXT_PRIMARY }]}>
            Impuesto 4x1000:
          </Text>
          <PreviewRow
            label="• Al depositar:"
            value={preview.fourPerThousandEntry}
            tone="warning"
            prefix="-"
          />
          <PreviewRow
            label="• Al retirar:"
            value={preview.fourPerThousandExit}
            tone="warning"
            prefix="-"
          />
          <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
          <PreviewRow
            label="Recibirías al retirar (neto):"
            value={preview.finalAmount}
            tone="highlight"
            bold
          />
        </>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// Preview CDT
// ─────────────────────────────────────────────

interface CDTPreviewProps {
  preview: CDTPreviewData;
}

const CDTPreview: React.FC<CDTPreviewProps> = ({ preview }) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.previewSection,
        { backgroundColor: colors.INFO + '10', borderColor: colors.INFO }
      ]}
    >
      <View style={styles.previewHeader}>
        <Icon type="material-community" name="calculator" size={24} color={colors.INFO} />
        <Text style={[styles.previewTitle, { color: colors.INFO }]}>
          En {preview.termDays} días tendrías
        </Text>
      </View>

      <View
        style={[styles.totalBox, { backgroundColor: colors.INFO + '20', borderColor: colors.INFO }]}
      >
        <Text style={[styles.totalValue, { color: colors.INFO }]}>
          {NumberFormat(preview.totalAfterWithholding)}
        </Text>
      </View>

      <PreviewRow label="Capital invertido:" value={preview.capitalAmount} />
      <PreviewRow label="Intereses generados:" value={preview.grossInterest} tone="highlight" />
      <PreviewRow label="Retención 4%:" value={preview.withholdingAmount} tone="error" prefix="-" />
      <PreviewRow label="Intereses netos:" value={preview.netInterest} tone="success" />

      {preview.fourPerThousandTotal > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
          <Text style={[styles.previewSubheader, { color: colors.TEXT_PRIMARY }]}>
            Impuesto 4x1000:
          </Text>
          <PreviewRow
            label="• Al depositar:"
            value={preview.fourPerThousandEntry}
            tone="warning"
            prefix="-"
          />
          <PreviewRow
            label="• Al retirar:"
            value={preview.fourPerThousandExit}
            tone="warning"
            prefix="-"
          />
          <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
          <PreviewRow label="Total a recibir:" value={preview.finalAmount} tone="highlight" bold />
        </>
      )}

      <Text style={[styles.infoText, styles.effectiveRate, { color: colors.TEXT_SECONDARY }]}>
        📊 Tasa efectiva post-impuestos: {preview.effectiveAnnualRate.toFixed(2)}% E.A.
      </Text>
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
    warning: colors.WARNING,
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
    padding: 8,
    borderRadius: 8
  },
  fieldGroup: {
    marginBottom: 16
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginTop: 12
  },
  checkboxText: {
    fontWeight: 'normal'
  },
  checkboxHint: {
    marginTop: -10
  },
  productSelector: {
    flexDirection: 'row',
    gap: 12
  },
  productCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center'
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8
  },
  productCardTitle: {
    fontSize: SMALL + 2,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center'
  },
  productCardRate: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    marginBottom: 4
  },
  productCardDescription: {
    fontSize: SMALL - 1,
    textAlign: 'center',
    lineHeight: 16
  },
  label: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    marginBottom: 8
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden'
  },
  previewSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  previewTitle: {
    fontSize: SMALL + 2,
    fontWeight: '600'
  },
  totalBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center'
  },
  totalValue: {
    fontSize: MEDIUM + 8,
    fontWeight: 'bold'
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  previewLabel: {
    fontSize: SMALL,
    flex: 1
  },
  previewValue: {
    fontSize: SMALL + 1,
    textAlign: 'right'
  },
  previewSubheader: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4
  },
  divider: {
    height: 1,
    marginVertical: 12
  },
  infoText: {
    fontSize: SMALL - 1,
    fontStyle: 'italic'
  },
  effectiveRate: {
    marginTop: 12
  }
});
