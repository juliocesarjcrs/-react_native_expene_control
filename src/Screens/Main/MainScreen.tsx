import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import Constants from 'expo-constants';
import { StackNavigationProp } from '@react-navigation/stack';

// Redux
import { setIsAuth } from '~/features/auth/authSlice';

// Services
import { getUser } from '~/services/users';
import { getUrlSignedAws } from '~/services/files';
import { getAllExpensesByMonth } from '~/services/categories';

// Components
import CardLastExpenses, { CardLastExpensesNavigationProp } from './components/CardLastExpenses';
import MyMonthPicker from '~/components/datePicker/MyMonthPicker';
import MyLoading from '~/components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import OptionsGrid from './components/OptionsGrid';
import MyDonutChart from '~/components/charts/MyDonutChart';
import { ScreenHeader } from '~/components/ScreenHeader';
import { ChatScreen } from '~/Screens/common/ChatScreen';

// Types
import { ExpenseStackParamList, UserModel } from '~/shared/types';
import { RootState } from '~/shared/types/reducers';
import { AppDispatch } from '~/shared/types/reducers/root-state.type';

// Utils
import { AsignColor, compareValues } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Hooks
import { useFeatureFlag } from '~/customHooks/useFeatureFlag';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type MainScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'main'>;

interface MainScreenProps {
  navigation: MainScreenNavigationProp;
}

type CategoryDataFormat = {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
};

export default function MainScreen({ navigation }: MainScreenProps) {
  const config = screenConfigs.main;
  const colors = useThemeColors();
  const month = useSelector((state: RootState) => state.date.month);
  const dispatch: AppDispatch = useDispatch();

  const [categories, setCategories] = useState<CategoryDataFormat[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [userLoggued, setUserLoggued] = useState<UserModel | null>(null);
  const [userImgSigned, setUserImgSigned] = useState<string | null>(null);

  const { isEnabled } = useFeatureFlag('chatbot');
  const version = Constants.expoConfig?.version || 'Desconocida';

  useEffect(() => {
    fetchData();
    fetchDataUserLogued();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
      fetchDataUserLogued();
    });

    return unsubscribe;
  }, [navigation, month]);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data } = await getAllExpensesByMonth(month);
      setTotal(data.total);

      const dataFormat = data.data.map((e, idx) => ({
        name: cutName(e.name),
        population: e.total,
        color: AsignColor(idx),
        legendFontColor: colors.TEXT_SECONDARY,
        legendFontSize: 15
      }));

      dataFormat.sort(compareValues('population', 'desc'));
      setCategories(dataFormat);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const cutName = (name: string): string => {
    return name.length < 12 ? name : name.slice(0, 10) + '...';
  };

  const fetchDataUserLogued = async (): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;

      if (user?.id) {
        const { data } = await getUser(user.id);
        setUserLoggued(data);

        if (data.image) {
          await getUrlAws(data.image);
        }
      }
    } catch (error) {
      showError(error);
    }
  };

  const getUrlAws = async (keyImg: string): Promise<void> => {
    try {
      if (keyImg) {
        const query = { file: keyImg };
        const { data } = await getUrlSignedAws(query);
        setUserImgSigned(data);
      }
    } catch (error) {
      showError(error);
    }
  };

  const sendcreateExpenseScreen = (): void => {
    navigation.navigate('createExpense');
  };

  const sendScanInvoiceExpenseScreen = (): void => {
    navigation.navigate('scanInvoiceExpense');
  };

  const sendDetailsExpenseScreen = (): void => {
    navigation.navigate('sumary');
  };

  const LogOut = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      dispatch(setIsAuth(false));
    } catch (error) {
      showError(error);
    }
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* USER HEADER */}
        <View style={[styles.header, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <View style={[styles.avatarContainer, { borderColor: colors.PRIMARY }]}>
            {userLoggued?.image && userImgSigned ? (
              <Image source={{ uri: userImgSigned }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.PRIMARY + '20' }]}>
                <Icon type="material-community" name="account" size={32} color={colors.PRIMARY} />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: colors.TEXT_PRIMARY }]}>
              {userLoggued?.name ?? 'Usuario'}
            </Text>
          </View>
        </View>

        {/* MONTH PICKER */}
        <View style={styles.section}>
          <MyMonthPicker />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <View style={[styles.actionCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <OptionsGrid
              actions={[
                { title: 'Ingresar gasto', onPress: sendcreateExpenseScreen },
                { title: 'Scanear factura', onPress: sendScanInvoiceExpenseScreen }
              ]}
            />
          </View>
        </View>

        {/* TOTAL CARD */}
        {/* {total > 0 && (
          <View style={[styles.totalCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <View style={styles.totalHeader}>
              <Icon
                type="material-community"
                name="wallet"
                size={24}
                color={colors.WARNING}
                containerStyle={{ marginRight: 8 }}
              />
              <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>Total gastado este mes</Text>
            </View>
            <Text style={[styles.total, { color: colors.WARNING }]}>{NumberFormat(total)}</Text>
          </View>
        )} */}

        {/* CHART SECTION */}
        <View style={styles.section}>
          {loading ? (
            <MyLoading />
          ) : total > 0 ? (
            <MyDonutChart data={categories} total={total} />
          ) : (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="chart-pie"
                size={48}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No se registran gastos en este mes
              </Text>
            </View>
          )}
        </View>

        {/* DETAIL BUTTON */}
        <MyButton onPress={sendDetailsExpenseScreen} title="Detallar gastos" variant="primary" />

        {/* LAST EXPENSES */}
        <View style={styles.section}>
          <CardLastExpenses navigation={navigation as CardLastExpensesNavigationProp} />
        </View>

        {/* LOGOUT BUTTON */}
        <MyButton onPress={LogOut} title="Cerrar sesión" variant="cancel" />

        {/* VERSION */}
        <Text style={[styles.versionText, { color: colors.TEXT_SECONDARY }]}>
          Versión: {version}
        </Text>
      </ScrollView>

      {isEnabled && <ChatScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  avatarContainer: {
    borderWidth: 2,
    borderRadius: 36,
    marginRight: 12
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  userInfo: {
    flex: 1
  },
  name: {
    fontSize: MEDIUM + 2,
    fontWeight: '600',
    marginBottom: 4
  },
  section: {
    marginBottom: 16
  },
  actionCard: {
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  totalCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  totalLabel: {
    fontSize: SMALL + 1,
    fontWeight: '500'
  },
  total: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: SMALL + 1,
    marginTop: 12,
    textAlign: 'center'
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    fontSize: SMALL
  }
});
