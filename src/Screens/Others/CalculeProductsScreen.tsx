import React, { useState, useCallback } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View, ListRenderItem } from 'react-native';
import { Icon, Input } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import uuid from 'react-native-uuid';
import { NumberFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { screenConfigs } from '~/config/screenConfigs';
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import RowInput from './components/RowInput';
import { SettingsStackParamList } from '~/shared/types';

export type CalculeProductsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'calculeProducts'
>;

interface CalculeProductsScreenProps {
  navigation: CalculeProductsScreenNavigationProp;
}

export type Product = {
  id: string;
  price: string;
  realVal: number;
  discount: string;
};

export default function CalculeProductsScreen({ navigation }: CalculeProductsScreenProps) {
  const colors = useThemeColors();
  const [generalDiscount, setGeneralDiscount] = useState<string>('15');
  const [products, setProducts] = useState<Product[]>([
    {
      id: uuid.v4() as string,
      price: '',
      realVal: 0,
      discount: '15'
    }
  ]);

  const realTotal = products.reduce((acc, product) => acc + product.realVal, 0);

  const addRow = useCallback((): void => {
    const newProduct: Product = {
      id: uuid.v4() as string,
      price: '',
      realVal: 0,
      discount: generalDiscount
    };
    setProducts((prev) => [...prev, newProduct]);
  }, [generalDiscount]);

  const removeRow = useCallback((id: string): void => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateTotal = useCallback((updatedProduct: Product): void => {
    setProducts((prev) =>
      prev.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
    );
  }, []);

  const handleGeneralDiscountChange = (val: string): void => {
    setGeneralDiscount(val);
  };

  const applyGeneralDiscount = (): void => {
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        discount: generalDiscount
      }))
    );
  };

  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <RowInput prod={item} sendRemoveRow={removeRow} updateTotal={updateTotal} />
  );

  const headerComponent = (): React.ReactElement => {
    return (
      <View>
        <MyButton
          title="Agregar producto"
          onPress={addRow}
          variant="primary"
          icon={<Icon type="font-awesome" name="plus" size={20} color={colors.WHITE} />}
          fullWidth
        />
        <View style={styles.tableHeader}>
          <View style={styles.headerColumn}>
            <Text style={[styles.headerText, { color: colors.TEXT_PRIMARY }]}>Precio</Text>
          </View>
          <View style={styles.headerColumnSmall}>
            <Text style={[styles.headerText, { color: colors.TEXT_PRIMARY }]}>Desc. %</Text>
          </View>
          <View style={styles.headerColumn}>
            <Text style={[styles.headerText, { color: colors.TEXT_PRIMARY }]}>Valor final</Text>
          </View>
          <View style={styles.headerColumnAction} />
        </View>
      </View>
    );
  };

  const footerComponent = (): React.ReactElement => {
    return (
      <View style={[styles.footer, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <Text style={[styles.totalText, { color: colors.TEXT_PRIMARY }]}>
          Total: {NumberFormat(realTotal)}
        </Text>
      </View>
    );
  };

  const screenConfig = screenConfigs.calculeProducts;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={commonStyles.screenContent}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.discountSection}>
            <Input
              label="Descuento general (%)"
              labelStyle={{ color: colors.TEXT_PRIMARY }}
              value={generalDiscount}
              placeholder="Ej: 15"
              onChangeText={handleGeneralDiscountChange}
              keyboardType="numeric"
              containerStyle={styles.discountInput}
            />
            <MyButton
              title="Aplicar a todos"
              onPress={applyGeneralDiscount}
              variant="secondary"
              size="medium"
              style={styles.applyButton}
            />
          </View>

          <FlatList
            data={products}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            extraData={products}
            ListHeaderComponent={headerComponent}
            ListFooterComponent={footerComponent}
            removeClippedSubviews={false}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  discountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 12
  },
  discountInput: {
    flex: 1
  },
  applyButton: {
    marginTop: 20
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 8,
    paddingHorizontal: 12
  },
  headerColumn: {
    flex: 1
  },
  headerColumnSmall: {
    width: 80
  },
  headerColumnAction: {
    width: 50
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  footer: {
    padding: 16,
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 10
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  listContent: {
    paddingBottom: 20
  }
});
