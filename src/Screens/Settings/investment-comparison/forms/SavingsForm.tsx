import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { Input, CheckBox, Icon } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import MyButton from '~/components/MyButton';
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';
import {
  SavingsScenario,
  ScenarioType,
  DEFAULTS
} from '~/shared/types/services/Investment-comparison.types';
import { ShowToast } from '~/utils/toastUtils';
import { NumberFormat } from '~/utils/Helpers';
import { MEDIUM, SMALL } from '~/styles/fonts';
import { calculateSavings } from '~/utils/investmentCalculations';
import { calculateCDT, CDT_RATES, CDT_TERMS } from '~/utils/cdtCalculations_original';
import { validateSerializable } from '~/utils/serializationHelper';

interface Props {
  colors: any;
  navigation: any;
  existingData?: SavingsScenario;
}

type ProductType = 'cajitas' | 'cdt';

// Helper para convertir errores de react-hook-form a string
const getErrorMessage = (error: any): string | undefined => {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error.message) return error.message as string;
  return undefined;
};

export const SavingsForm: React.FC<Props> = ({ colors, navigation, existingData }) => {
  const { saveScenario } = useInvestmentComparison();

  // Estado local para tipo de producto
  const [productType, setProductType] = useState<ProductType>(
    (existingData as any)?.productType || 'cajitas'
  );

  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue
  } = useForm<any>({
    defaultValues: {
      id: existingData?.id || Date.now().toString(),
      name: existingData?.name || 'Mi Ahorro',
      productType: (existingData as any)?.productType || 'cajitas',

      // Cajitas
      initialCapital: existingData?.initialCapital || 10000000,
      monthlyContribution: existingData?.monthlyContribution || 0,
      annualRate: existingData?.annualRate || DEFAULTS.NUBANK_CAJITAS_RATE,
      horizonMonths: existingData?.horizonMonths || 12,

      // CDT
      cdtCapital: (existingData as any)?.cdtCapital || 1000000,
      cdtTermDays: (existingData as any)?.cdtTermDays || 90,

      // Común
      apply4x1000: existingData?.apply4x1000 !== undefined ? existingData.apply4x1000 : false,
      withholdingTax: existingData?.withholdingTax || (productType === 'cdt' ? 4 : 7),
      inflation: existingData?.inflation || DEFAULTS.INFLATION_COLOMBIA
    }
  });

  const watchedValues = useWatch({ control });

  // Calcular preview según tipo de producto
  const calculationPreview = useMemo(() => {
    if (productType === 'cajitas') {
      const initialCapital = watchedValues.initialCapital || 0;
      const monthlyContribution = watchedValues.monthlyContribution || 0;
      const annualRate = watchedValues.annualRate || 0;
      const horizonMonths = watchedValues.horizonMonths || 0;

      if (initialCapital <= 0 || annualRate <= 0 || horizonMonths <= 0) {
        return null;
      }

      return {
        type: 'cajitas',
        ...calculateSavings({
          initialCapital,
          monthlyContribution,
          annualRate,
          horizonMonths,
          apply4x1000: watchedValues.apply4x1000,
          withholdingTax: 7,
          inflation: watchedValues.inflation
        })
      };
    } else {
      const cdtCapital = watchedValues.cdtCapital || 0;
      const cdtTermDays = watchedValues.cdtTermDays || 90;

      if (cdtCapital <= 0) {
        return null;
      }

      return {
        type: 'cdt',
        ...calculateCDT({
          capitalAmount: cdtCapital,
          termDays: cdtTermDays,
          apply4x1000: watchedValues.apply4x1000,
          withholdingTax: 4,
          inflation: watchedValues.inflation
        })
      };
    }
  }, [watchedValues, productType]);

  const onSubmit = (data: any) => {
    const scenarioData = {
      ...data,
      productType,
      id: data.id || Date.now().toString()
    };

    if (!validateSerializable(scenarioData, 'scenarioData')) {
      ShowToast('Error: Datos inválidos');
      return;
    }

    saveScenario(ScenarioType.SAVINGS, scenarioData);
    ShowToast('Escenario configurado correctamente');
    navigation.goBack();
  };

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    setValue('productType', type);

    // Ajustar retención según tipo
    setValue('withholdingTax', type === 'cdt' ? 4 : 7);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {/* SELECTOR DE TIPO DE PRODUCTO */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            Tipo de Producto
          </Text>

          <View style={styles.productSelector}>
            <TouchableOpacity
              style={[
                styles.productCard,
                {
                  backgroundColor:
                    productType === 'cajitas' ? colors.SUCCESS + '20' : colors.BACKGROUND,
                  borderColor: productType === 'cajitas' ? colors.SUCCESS : colors.BORDER
                }
              ]}
              onPress={() => handleProductTypeChange('cajitas')}
              activeOpacity={0.7}
            >
              <View style={styles.productCardHeader}>
                <Icon
                  type="material-community"
                  name="piggy-bank"
                  size={32}
                  color={productType === 'cajitas' ? colors.SUCCESS : colors.TEXT_SECONDARY}
                />
                {productType === 'cajitas' && (
                  <Icon
                    type="material-community"
                    name="check-circle"
                    size={20}
                    color={colors.SUCCESS}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.productCardTitle,
                  { color: productType === 'cajitas' ? colors.SUCCESS : colors.TEXT_PRIMARY }
                ]}
              >
                Cajitas Nubank
              </Text>
              <Text style={[styles.productCardRate, { color: colors.TEXT_SECONDARY }]}>
                8.25% E.A.
              </Text>
              <Text style={[styles.productCardDescription, { color: colors.TEXT_SECONDARY }]}>
                Liquidez diaria{'\n'}Capitalización diaria
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.productCard,
                {
                  backgroundColor: productType === 'cdt' ? colors.INFO + '20' : colors.BACKGROUND,
                  borderColor: productType === 'cdt' ? colors.INFO : colors.BORDER
                }
              ]}
              onPress={() => handleProductTypeChange('cdt')}
              activeOpacity={0.7}
            >
              <View style={styles.productCardHeader}>
                <Icon
                  type="material-community"
                  name="file-certificate"
                  size={32}
                  color={productType === 'cdt' ? colors.INFO : colors.TEXT_SECONDARY}
                />
                {productType === 'cdt' && (
                  <Icon
                    type="material-community"
                    name="check-circle"
                    size={20}
                    color={colors.INFO}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.productCardTitle,
                  { color: productType === 'cdt' ? colors.INFO : colors.TEXT_PRIMARY }
                ]}
              >
                CDT Nubank
              </Text>
              <Text style={[styles.productCardRate, { color: colors.TEXT_SECONDARY }]}>
                9.00% - 9.70% E.A.
              </Text>
              <Text style={[styles.productCardDescription, { color: colors.TEXT_SECONDARY }]}>
                Plazo fijo{'\n'}Interés al vencimiento
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FORMULARIO SEGÚN TIPO */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            {productType === 'cajitas' ? '💰 Cajitas - Ahorro Líquido' : '📄 CDT - A Plazo Fijo'}
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

          {productType === 'cajitas' ? (
            // FORMULARIO CAJITAS
            <>
              <Controller
                name="initialCapital"
                control={control}
                rules={{ required: true, min: { value: 100000, message: 'Mínimo $100k' } }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Capital inicial (COP)"
                    value={value?.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                    errorMessage={getErrorMessage(errors?.initialCapital)}
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
                name="monthlyContribution"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Aporte mensual (COP) - Opcional"
                    value={value?.toString()}
                    keyboardType="numeric"
                    placeholder="0"
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
                name="horizonMonths"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Horizonte (meses)"
                    value={value?.toString()}
                    keyboardType="numeric"
                    placeholder="12"
                    onChangeText={(text) => onChange(parseInt(text) || 0)}
                    errorMessage={getErrorMessage(errors?.horizonMonths)}
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

              <Text style={[styles.helperText, { color: colors.INFO }]}>
                💡 Tasa: 8.25% E.A. | Retención: 7% | Capitalización diaria
              </Text>
            </>
          ) : (
            // FORMULARIO CDT
            <>
              <Controller
                name="cdtCapital"
                control={control}
                rules={{ required: true, min: { value: 100000, message: 'Mínimo $100k' } }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Monto a invertir (COP)"
                    value={value?.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                    errorMessage={getErrorMessage(errors?.cdtCapital)}
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
                name="cdtTermDays"
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
                      Plazo del CDT
                    </Text>
                    <View
                      style={[
                        styles.pickerContainer,
                        { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }
                      ]}
                    >
                      <Picker
                        selectedValue={value}
                        onValueChange={onChange}
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
                )}
              />

              <Text style={[styles.helperText, { color: colors.INFO }]}>
                💡 Retención: 4% sobre intereses | Pago al vencimiento | Sin aportes mensuales
              </Text>
            </>
          )}

          {/* CHECKBOX 4x1000 */}
          <Controller
            name="apply4x1000"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CheckBox
                title="Aplicar impuesto 4x1000"
                checked={value}
                onPress={() => onChange(!value)}
                containerStyle={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
                textStyle={{ color: colors.TEXT_PRIMARY, fontWeight: 'normal' }}
                checkedColor={colors.PRIMARY}
              />
            )}
          />
          <Text style={[styles.helperText, { color: colors.TEXT_SECONDARY, marginTop: -10 }]}>
            ℹ️ Marca si no tienes cuenta exenta de 4x1000
          </Text>
        </View>

        {/* PREVIEW SEGÚN TIPO */}
        {calculationPreview && calculationPreview.type === 'cajitas' && (
          <CajitasPreview
            preview={calculationPreview}
            colors={colors}
            horizonMonths={watchedValues.horizonMonths}
          />
        )}

        {calculationPreview && calculationPreview.type === 'cdt' && (
          <CDTPreview preview={calculationPreview} colors={colors} />
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

// Componente Preview para Cajitas
const CajitasPreview = ({ preview, colors, horizonMonths }: any) => (
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

    <PreviewRow label="Habrías depositado:" value={preview.totalDeposited} colors={colors} />
    <PreviewRow
      label="Tu dinero habría crecido:"
      value={preview.grossEarnings}
      colors={colors}
      highlight
    />
    <PreviewRow
      label="Total retención en la fuente:"
      value={preview.withholdingAmount}
      colors={colors}
      error
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
          colors={colors}
          warning
          prefix="-"
        />
        <PreviewRow
          label="• Al retirar:"
          value={preview.fourPerThousandExit}
          colors={colors}
          warning
          prefix="-"
        />
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <PreviewRow
          label="Recibirías al retirar (neto):"
          value={preview.finalAmount}
          colors={colors}
          highlight
          bold
        />
      </>
    )}
  </View>
);

// Componente Preview para CDT
const CDTPreview = ({ preview, colors }: any) => (
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

    <PreviewRow label="Capital invertido:" value={preview.capitalAmount} colors={colors} />
    <PreviewRow
      label="Intereses generados:"
      value={preview.grossInterest}
      colors={colors}
      highlight
    />
    <PreviewRow
      label="Retención 4%:"
      value={preview.withholdingAmount}
      colors={colors}
      error
      prefix="-"
    />
    <PreviewRow label="Intereses netos:" value={preview.netInterest} colors={colors} success />

    {preview.fourPerThousandTotal > 0 && (
      <>
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <Text style={[styles.previewSubheader, { color: colors.TEXT_PRIMARY }]}>
          Impuesto 4x1000:
        </Text>
        <PreviewRow
          label="• Al depositar:"
          value={preview.fourPerThousandEntry}
          colors={colors}
          warning
          prefix="-"
        />
        <PreviewRow
          label="• Al retirar:"
          value={preview.fourPerThousandExit}
          colors={colors}
          warning
          prefix="-"
        />
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <PreviewRow
          label="Total a recibir:"
          value={preview.finalAmount}
          colors={colors}
          highlight
          bold
        />
      </>
    )}

    <Text style={[styles.infoText, { color: colors.TEXT_SECONDARY, marginTop: 12 }]}>
      📊 Tasa efectiva post-impuestos: {preview.effectiveAnnualRate.toFixed(2)}% E.A.
    </Text>
  </View>
);

// Componente auxiliar para filas de preview
const PreviewRow = ({
  label,
  value,
  colors,
  highlight,
  error,
  warning,
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
              : warning
                ? colors.WARNING
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
  helperText: { fontSize: SMALL - 1, lineHeight: 16, marginTop: 4 },
  productSelector: { flexDirection: 'row', gap: 12 },
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
  productCardRate: { fontSize: SMALL + 1, fontWeight: '600', marginBottom: 4 },
  productCardDescription: { fontSize: SMALL - 1, textAlign: 'center', lineHeight: 16 },
  label: { fontSize: SMALL + 1, fontWeight: '600', marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  previewSection: { marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 2 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  previewTitle: { fontSize: SMALL + 2, fontWeight: '600' },
  totalBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center'
  },
  totalValue: { fontSize: MEDIUM + 8, fontWeight: 'bold' },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  previewLabel: { fontSize: SMALL, flex: 1 },
  previewValue: { fontSize: SMALL + 1, textAlign: 'right' },
  previewSubheader: { fontSize: SMALL + 1, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  divider: { height: 1, marginVertical: 12 },
  infoText: { fontSize: SMALL - 1, fontStyle: 'italic' }
});
