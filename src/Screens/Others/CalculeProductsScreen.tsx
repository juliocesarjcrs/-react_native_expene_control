import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View, ListRenderItem } from 'react-native';
import { Icon } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm } from 'react-hook-form';
import uuid from 'react-native-uuid';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyInput from '~/components/inputs/MyInput';
import RowInput from './components/RowInput';

// Types
import { SettingsStackParamList } from '~/shared/types';

// Utils
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

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

interface DiscountFormData {
  generalDiscount: number;
}

export default function CalculeProductsScreen({ navigation }: CalculeProductsScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.calculeProducts;

  const { control, watch } = useForm<DiscountFormData>({
    defaultValues: {
      generalDiscount: 15
    }
  });

  const generalDiscount = watch('generalDiscount');

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
      discount: String(generalDiscount)
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

  const applyGeneralDiscount = (): void => {
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        discount: String(generalDiscount)
      }))
    );
  };

  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <RowInput prod={item} sendRemoveRow={removeRow} updateTotal={updateTotal} />
  );

  const headerComponent = (): React.ReactElement => {
    return (
      <View style={styles.headerContainer}>
        {/* Sección de descuento general */}
        <View style={[styles.discountCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <View style={styles.discountRow}>
            <View style={styles.discountInputContainer}>
              <MyInput
                name="generalDiscount"
                type="number"
                control={control}
                label="Descuento general (%)"
                placeholder="0"
                rules={{
                  min: { value: 0, message: 'El descuento no puede ser negativo' },
                  max: { value: 100, message: 'El descuento no puede ser mayor a 100%' }
                }}
                leftIcon="percent"
              />
            </View>

            <MyButton
              title="Aplicar a todos"
              onPress={applyGeneralDiscount}
              variant="secondary"
              size="medium"
              icon={
                <Icon type="material-community" name="check-all" size={18} color={colors.WHITE} />
              }
              style={styles.applyButton}
            />
          </View>
        </View>

        {/* Botón agregar producto */}
        <MyButton
          title="Agregar producto"
          onPress={addRow}
          variant="primary"
          icon={<Icon type="material-community" name="plus" size={20} color={colors.WHITE} />}
          fullWidth
        />

        {/* Headers de tabla */}
        <View style={[styles.tableHeader, { borderBottomColor: colors.BORDER }]}>
          <View style={styles.headerColumn}>
            <Text style={[styles.headerText, { color: colors.TEXT_PRIMARY }]}>Precio</Text>
          </View>
          <View style={styles.headerColumnSmall}>
            <Text style={[styles.headerText, { color: colors.TEXT_PRIMARY }]}>Desc %</Text>
          </View>
          <View style={styles.headerColumn}>
            <Text style={[styles.headerText, { color: colors.TEXT_PRIMARY }]}>Total</Text>
          </View>
          <View style={styles.headerColumnAction}>
            <Icon type="material-community" name="delete" size={18} color={colors.TEXT_SECONDARY} />
          </View>
        </View>
      </View>
    );
  };

  const footerComponent = (): React.ReactElement => {
    return (
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.SUCCESS + '15', borderColor: colors.SUCCESS }
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>Total general</Text>
          <Text style={[styles.totalAmount, { color: colors.SUCCESS }]}>
            {NumberFormat(realTotal)}
          </Text>
        </View>
        <Text style={[styles.productsCount, { color: colors.TEXT_SECONDARY }]}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <View style={styles.content}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: 8
  },
  discountCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12
  },
  discountInputContainer: {
    flex: 1
  },
  applyButton: {
    marginBottom: 16
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 2
  },
  headerColumn: {
    flex: 1,
    alignItems: 'center'
  },
  headerColumnSmall: {
    width: 80,
    alignItems: 'center'
  },
  headerColumnAction: {
    width: 50,
    alignItems: 'center'
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: SMALL + 1
  },
  footer: {
    padding: 16,
    marginTop: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  totalLabel: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  totalAmount: {
    fontSize: MEDIUM + 4,
    fontWeight: 'bold'
  },
  productsCount: {
    fontSize: SMALL,
    textAlign: 'right',
    marginTop: 4
  },
  listContent: {
    paddingBottom: 20
  }
});
