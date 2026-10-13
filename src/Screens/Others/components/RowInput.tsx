import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, Input } from 'react-native-elements';
import { NumberFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import type { Product } from '../CalculeProductsScreen';

interface RowInputProps {
  prod: Product;
  sendRemoveRow: (id: string) => void;
  updateTotal: (product: Product) => void;
}

// Precio con descuento aplicado (0 si no hay precio válido)
const calculateRealValue = (price: string, discount: string): number => {
  const priceNum = Number.parseFloat(price) || 0;
  const discountNum = Number.parseFloat(discount) || 0;

  if (priceNum <= 0) return 0;
  if (discountNum > 0) return priceNum - (priceNum * discountNum) / 100;
  return priceNum;
};

export default function RowInput({ prod, sendRemoveRow, updateTotal }: RowInputProps) {
  const colors = useThemeColors();
  const [price, setPrice] = useState<string>(prod.price);
  const [discount, setDiscount] = useState<string>(prod.discount);
  const [prevParentDiscount, setPrevParentDiscount] = useState<string>(prod.discount);

  // Si el padre cambia el descuento, se refleja aquí (durante el render, sin efecto)
  if (prod.discount !== prevParentDiscount) {
    setPrevParentDiscount(prod.discount);
    setDiscount(prod.discount);
  }

  const realVal = calculateRealValue(price, discount);

  // Avisa al padre solo cuando lo que tiene difiere de lo que se muestra aquí
  useEffect(() => {
    if (prod.price !== price || prod.discount !== discount || prod.realVal !== realVal) {
      updateTotal({ ...prod, price, discount, realVal });
    }
  }, [prod, price, discount, realVal, updateTotal]);

  const inputTextStyle = { color: colors.TEXT_PRIMARY };

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Input
            value={price}
            placeholder="Ej: 20000"
            onChangeText={setPrice}
            keyboardType="numeric"
            inputStyle={inputTextStyle}
            containerStyle={styles.input}
          />
        </View>

        <View style={styles.inputDiscount}>
          <Input
            value={discount}
            placeholder="Ej: 5"
            onChangeText={setDiscount}
            keyboardType="numeric"
            inputStyle={inputTextStyle}
            containerStyle={styles.input}
          />
        </View>

        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: colors.TEXT_PRIMARY }]}>
            {NumberFormat(realVal)}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <Icon
            type="material-community"
            name="trash-can-outline"
            size={25}
            color={colors.ERROR}
            onPress={() => sendRemoveRow(prod.id)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    paddingVertical: 4
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputContainer: {
    flex: 1,
    maxWidth: 120
  },
  inputDiscount: {
    width: 80
  },
  input: {
    paddingHorizontal: 0
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600'
  },
  actionContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
