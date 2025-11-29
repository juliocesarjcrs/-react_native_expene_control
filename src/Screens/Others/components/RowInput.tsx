import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Icon, Input } from "react-native-elements";
import { NumberFormat } from "~/utils/Helpers";
import { useThemeColors } from "~/customHooks/useThemeColors";
import type { Product } from "../CalculeProductsScreen";

interface RowInputProps {
  prod: Product;
  sendRemoveRow: (id: string) => void;
  updateTotal: (product: Product) => void;
}

export default function RowInput({ prod, sendRemoveRow, updateTotal }: RowInputProps) {
  const colors = useThemeColors();
  const [price, setPrice] = useState<string>(prod.price);
  const [discount, setDiscount] = useState<string>(prod.discount);
  const [realVal, setRealVal] = useState<number>(prod.realVal);

  // Actualizar discount cuando cambie desde el padre
  useEffect(() => {
    setDiscount(prod.discount);
  }, [prod.discount]);

  useEffect(() => {
    calculateRealValue();
  }, [price, discount]);

  const removeRow = (): void => {
    sendRemoveRow(prod.id);
  };

  const handlePriceChange = (val: string): void => {
    setPrice(val);
  };

  const handleDiscountChange = (val: string): void => {
    setDiscount(val);
  };

  const calculateRealValue = (): void => {
    const priceNum = parseFloat(price) || 0;
    const discountNum = parseFloat(discount) || 0;

    if (discountNum > 0 && priceNum > 0) {
      const productDiscount = (priceNum * discountNum) / 100;
      const result = priceNum - productDiscount;
      setRealVal(result);
      updateTotal({ ...prod, price, realVal: result, discount });
    } else if (priceNum > 0) {
      setRealVal(priceNum);
      updateTotal({ ...prod, price, realVal: priceNum, discount });
    } else {
      setRealVal(0);
      updateTotal({ ...prod, price, realVal: 0, discount });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Input
            value={price}
            placeholder="Ej: 20000"
            onChangeText={handlePriceChange}
            keyboardType="numeric"
            inputStyle={{ color: colors.TEXT_PRIMARY }}
            containerStyle={styles.input}
          />
        </View>

        <View style={styles.inputDiscount}>
          <Input
            value={discount}
            placeholder="Ej: 5"
            onChangeText={handleDiscountChange}
            keyboardType="numeric"
            inputStyle={{ color: colors.TEXT_PRIMARY }}
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
            onPress={removeRow}
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
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    maxWidth: 120,
  },
  inputDiscount: {
    width: 80,
  },
  input: {
    paddingHorizontal: 0,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  resultText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});