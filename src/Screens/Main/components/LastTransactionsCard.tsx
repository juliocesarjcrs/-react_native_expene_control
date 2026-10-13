import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Icon } from 'react-native-elements';
import Popover from 'react-native-popover-view';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

// Components
import MyLoading from '~/components/loading/MyLoading';
import { TransactionItem } from './TransactionItem';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

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

interface FetchParams {
  take: number;
  orderBy?: string;
}

interface LastTransactionsCardProps<T extends Transaction> {
  title: string;
  type: 'expense' | 'income';
  navigation: NavigationProp<ParamListBase>;
  navigationScreen: string;
  fetchFunction: (params: FetchParams) => Promise<{ data: { data: T[] } }>;
}

interface TakeOption {
  id: number;
  title: string;
  take: number;
}

const DEFAULT_TAKE = 5;
const BADGE_OPACITY_HEX = '20';

const TAKE_OPTIONS: TakeOption[] = [
  { id: 1, title: 'Últimas 5 transacciones', take: 5 },
  { id: 2, title: 'Últimas 10 transacciones', take: 10 },
  { id: 3, title: 'Últimas 15 transacciones', take: 15 }
];

export default function LastTransactionsCard<T extends Transaction>({
  title,
  type,
  navigation,
  navigationScreen,
  fetchFunction
}: LastTransactionsCardProps<T>) {
  const colors = useThemeColors();

  const [take, setTake] = useState<number>(DEFAULT_TAKE);
  // Guardamos el resultado junto con el `take` con el que se pidió.
  // Así `loading` se deriva y no hay que llamar setState de forma síncrona en el efecto.
  const [result, setResult] = useState<{ take: number; data: T[] } | null>(null);

  const transactions = result?.data ?? [];
  const loading = result?.take !== take;

  const isExpense = type === 'expense';
  const typeColor = isExpense ? colors.WARNING : colors.SUCCESS;

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: { backgroundColor: colors.CARD_BACKGROUND },
        iconBadge: { backgroundColor: `${typeColor}${BADGE_OPACITY_HEX}` },
        title: { color: colors.TEXT_PRIMARY },
        popover: { backgroundColor: colors.CARD_BACKGROUND },
        popoverContent: { backgroundColor: colors.CARD_BACKGROUND },
        checkboxContainer: { backgroundColor: colors.CARD_BACKGROUND },
        checkboxText: { color: colors.TEXT_PRIMARY, fontSize: SMALL + 1 },
        emptyText: { color: colors.TEXT_SECONDARY }
      }),
    [colors, typeColor]
  );

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async (): Promise<void> => {
      try {
        const params: FetchParams = { take, ...(isExpense && { orderBy: 'id' }) };
        const { data } = await fetchFunction(params);
        if (!cancelled) {
          setResult({ take, data: data.data });
        }
      } catch (error) {
        if (!cancelled) {
          setResult((prev) => ({ take, data: prev?.data ?? [] }));
          showError(error);
        }
      }
    };

    void loadTransactions();
    const unsubscribe = navigation.addListener('focus', () => {
      void loadTransactions();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [take, isExpense, fetchFunction, navigation]);

  const selectTake = (option: TakeOption): void => {
    setTake(option.take);
  };

  const navigateToFullScreen = (): void => {
    navigation.navigate(navigationScreen);
  };

  const renderContent = (): React.ReactNode => {
    if (loading) {
      return <MyLoading />;
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon
            type="material-community"
            name={isExpense ? 'receipt-text-outline' : 'cash-check'}
            size={40}
            color={colors.TEXT_SECONDARY}
          />
          <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
            No hay {isExpense ? 'gastos' : 'ingresos'} registrados
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.transactionsList}>
        {transactions.map((item) => (
          <TransactionItem key={item.id} item={item} type={type} colors={colors} />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, dynamicStyles.iconBadge]}>
            <Icon
              type="material-community"
              name={isExpense ? 'cash-minus' : 'cash-plus'}
              size={18}
              color={typeColor}
            />
          </View>
          <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
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
            popoverStyle={dynamicStyles.popover}
          >
            <View style={[styles.popoverContent, dynamicStyles.popoverContent]}>
              {TAKE_OPTIONS.map((option) => (
                <CheckBox
                  key={option.id}
                  title={option.title}
                  checked={take === option.take}
                  onPress={() => selectTake(option)}
                  containerStyle={[styles.checkboxContainer, dynamicStyles.checkboxContainer]}
                  textStyle={dynamicStyles.checkboxText}
                  checkedColor={colors.PRIMARY}
                  uncheckedColor={colors.TEXT_SECONDARY}
                />
              ))}
            </View>
          </Popover>
        </View>
      </View>

      {/* Content */}
      {renderContent()}
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
