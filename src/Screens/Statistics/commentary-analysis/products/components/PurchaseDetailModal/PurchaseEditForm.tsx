import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';
import { useForm, useWatch } from 'react-hook-form';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';
import MyInput from '~/components/inputs/MyInput';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface PurchaseEditFormProps {
  purchase: ProductPrice;
  onSave: (updated: ProductPrice) => Promise<void>;
  onCancel: () => void;
}

type Unit = 'kg' | 'un';

type PurchaseFormData = {
  product: string;
  quantity: string;
  unit: Unit;
  pricePerKg: string;
  store: string;
};

const UNITS: Unit[] = ['kg', 'un'];

export const PurchaseEditForm: React.FC<PurchaseEditFormProps> = ({
  purchase,
  onSave,
  onCancel
}) => {
  const colors = useThemeColors();
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, setValue } = useForm<PurchaseFormData>({
    defaultValues: {
      product: purchase.product.startsWith('(sin nombre)') ? '' : purchase.product,
      quantity: purchase.quantity.toString().replace('.', ','),
      unit: purchase.unit || 'kg',
      pricePerKg: '',
      store: purchase.store || ''
    }
  });

  const selectedUnit = useWatch({ control, name: 'unit' });

  const onSubmit = async (data: PurchaseFormData) => {
    // Parsear cantidad (coma a punto) y precio (sin separadores)
    const quantity = Number.parseFloat(data.quantity.replace(',', '.'));
    const pricePerKg = Number.parseInt(data.pricePerKg.replace(/[.,]/g, ''), 10);

    if (Number.isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0');
      return;
    }

    if (Number.isNaN(pricePerKg) || pricePerKg <= 0) {
      Alert.alert('Error', 'El precio debe ser un número mayor a 0');
      return;
    }

    const updated: ProductPrice = {
      ...purchase,
      product: data.product.trim(),
      quantity,
      unit: data.unit,
      pricePerKg,
      store: data.store.trim() || undefined,
      isIncomplete: false,
      isWeighed: data.unit === 'kg'
    };

    try {
      setSaving(true);
      await onSave(updated);
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hint informativo */}
      <View style={[styles.hintBox, { backgroundColor: colors.INFO + '15' }]}>
        <Icon type="material-community" name="lightbulb-outline" size={16} color={colors.INFO} />
        <Text style={[styles.hintText, { color: colors.INFO }]}>
          Completa los datos faltantes para incluir esta compra en el análisis de precios.
        </Text>
      </View>

      {/* Formulario */}
      <MyInput
        name="product"
        control={control}
        label="Nombre del producto"
        placeholder="Ej: Tomate Chonto"
        rules={{ required: 'El nombre es obligatorio' }}
        leftIcon="tag"
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <MyInput
            name="quantity"
            control={control}
            label="Cantidad"
            placeholder="0,625"
            keyboardType="decimal-pad"
            rules={{ required: 'La cantidad es obligatoria' }}
          />
        </View>

        <View style={styles.halfWidth}>
          <Text style={[styles.inputLabel, { color: colors.TEXT_PRIMARY }]}>Unidad</Text>
          <View style={styles.unitSelector}>
            {UNITS.map((unit) => {
              const selected = selectedUnit === unit;

              return (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    { borderColor: colors.BORDER },
                    selected && { backgroundColor: colors.PRIMARY }
                  ]}
                  onPress={() => setValue('unit', unit)}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      { color: selected ? colors.WHITE : colors.TEXT_PRIMARY }
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <MyInput
        name="pricePerKg"
        control={control}
        label={`Precio por ${selectedUnit}`}
        placeholder="7.168"
        keyboardType="numeric"
        rules={{ required: 'El precio es obligatorio' }}
        leftIcon="currency-usd"
      />

      <MyInput
        name="store"
        control={control}
        label="Tienda (opcional)"
        placeholder="Carulla"
        leftIcon="store"
      />

      {/* Formato estándar sugerido */}
      <View style={[styles.exampleBox, { backgroundColor: colors.BACKGROUND }]}>
        <Text style={[styles.exampleLabel, { color: colors.TEXT_SECONDARY }]}>
          Formato estándar colombiano:
        </Text>
        <Text style={[styles.exampleText, { color: colors.TEXT_PRIMARY }]}>
          &quot;{purchase.product} — 0,625 kg @ $7.168/kg [Carulla]&quot;
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: colors.BORDER }]}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={[styles.buttonText, { color: colors.TEXT_PRIMARY }]}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.PRIMARY }]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.WHITE} />
          ) : (
            <>
              <Icon type="material-community" name="check" size={18} color={colors.WHITE} />
              <Text style={[styles.buttonText, { color: colors.WHITE }]}>Guardar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    gap: 16
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8
  },
  hintText: {
    flex: 1,
    fontSize: SMALL - 1,
    lineHeight: 18
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  halfWidth: {
    flex: 1
  },
  inputLabel: {
    fontSize: SMALL,
    fontWeight: '600',
    marginBottom: 8
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  unitButtonText: {
    fontSize: SMALL,
    fontWeight: '700'
  },
  exampleBox: {
    padding: 12,
    borderRadius: 8,
    gap: 6
  },
  exampleLabel: {
    fontSize: SMALL - 2,
    fontWeight: '600'
  },
  exampleText: {
    fontSize: SMALL - 1,
    fontStyle: 'italic',
    lineHeight: 18
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 8
  },
  cancelButton: {
    borderWidth: 1
  },
  buttonText: {
    fontSize: SMALL,
    fontWeight: '700'
  }
});
