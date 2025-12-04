import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckBox, Icon } from 'react-native-elements';
import Popover from 'react-native-popover-view';

// Components
import MyLoading from '~/components/loading/MyLoading';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import { TransactionItem } from './TransactionItem';

export interface Transaction {
  id: number;
  createdAt: string;
  cost: number;
  commentary: string | null;
  date: string;
  dateFormat: string;
  category?: string;
  iconCategory: string | null;
  subcategory?: string;
}

interface LastTransactionsCardProps<T extends Transaction> {
  title: string;
  type: 'expense' | 'income';
  navigation: any;
  navigationScreen: string;
  fetchFunction: (params: { take: number; orderBy?: string }) => Promise<{ data: { data: T[] } }>;
}

export default function LastTransactionsCard<T extends Transaction>({
  title,
  type,
  navigation,
  navigationScreen,
  fetchFunction
}: LastTransactionsCardProps<T>) {
  const colors = useThemeColors();

  const [transactions, setTransactions] = useState<T[]>([]);
  const [take, setTake] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkboxes, setCheckboxes] = useState([
    { id: 1, title: 'Últimas 5 transacciones', checked: true, take: 5 },
    { id: 2, title: 'Últimas 10 transacciones', checked: false, take: 10 },
    { id: 3, title: 'Últimas 15 transacciones', checked: false, take: 15 }
  ]);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [take, navigation]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const params = { take, ...(type === 'expense' && { orderBy: 'id' }) };
      const { data } = await fetchFunction(params);
      setLoading(false);
      setTransactions(data.data);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const toggleCheckbox = (id: number, index: number): void => {
    const checkboxData = checkboxes.map((cb, idx) => ({
      ...cb,
      checked: idx === index
    }));
    setCheckboxes(checkboxData);
    setTake(checkboxData[index].take);
  };

  const navigateToFullScreen = (): void => {
    navigation.navigate(navigationScreen);
  };

  const typeColor = type === 'expense' ? colors.WARNING : colors.SUCCESS;

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: typeColor + '20' }]}>
            <Icon
              type="material-community"
              name={type === 'expense' ? 'cash-minus' : 'cash-plus'}
              size={18}
              color={typeColor}
            />
          </View>
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>{title}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={navigateToFullScreen} style={styles.iconButton}>
            <Icon
              type="material-community"
              name="arrow-expand"
              size={20}
              color={colors.TEXT_SECONDARY}
            />
          </TouchableOpacity>

          <Popover
            from={
              <TouchableOpacity style={styles.iconButton}>
                <Icon
                  type="material-community"
                  name="dots-vertical"
                  size={20}
                  color={colors.TEXT_SECONDARY}
                />
              </TouchableOpacity>
            }
            popoverStyle={{ backgroundColor: colors.CARD_BACKGROUND }}
          >
            <View style={[styles.popoverContent, { backgroundColor: colors.CARD_BACKGROUND }]}>
              {checkboxes.map((cb, index) => (
                <CheckBox
                  key={cb.id}
                  title={cb.title}
                  checked={cb.checked}
                  onPress={() => toggleCheckbox(cb.id, index)}
                  containerStyle={[
                    styles.checkboxContainer,
                    { backgroundColor: colors.CARD_BACKGROUND }
                  ]}
                  textStyle={{ color: colors.TEXT_PRIMARY, fontSize: SMALL + 1 }}
                  checkedColor={colors.PRIMARY}
                  uncheckedColor={colors.TEXT_SECONDARY}
                />
              ))}
            </View>
          </Popover>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <MyLoading />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            type="material-community"
            name={type === 'expense' ? 'receipt-text-outline' : 'cash-check'}
            size={40}
            color={colors.TEXT_SECONDARY}
          />
          <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
            No hay {type === 'expense' ? 'gastos' : 'ingresos'} registrados
          </Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {transactions.map((item) => (
            <TransactionItem key={item.id} item={item} type={type} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    padding: 4,
    marginLeft: 4
  },
  popoverContent: {
    minWidth: 220,
    paddingVertical: 8
  },
  checkboxContainer: {
    marginVertical: 0,
    paddingVertical: 8,
    borderBottomWidth: 0
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30
  },
  emptyText: {
    fontSize: SMALL + 1,
    marginTop: 8
  },
  transactionsList: {
    marginTop: 4
  }
});
