import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { AsignColor, compareValues, NumberFormat } from '../../utils/Helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';

import Constants from 'expo-constants';

import { URL_BASE } from '@env';
import { StackNavigationProp } from '@react-navigation/stack';
import { setIsAuth } from '../../features/auth/authSlice';

// Services
import { getUser } from '../../services/users';
import { getUrlSignedAws } from '../../services/files';
import { getAllExpensesByMonth } from '../../services/categories';

// Types
import { ExpenseStackParamList, UserModel } from '../../shared/types';
import { RootState } from '../../shared/types/reducers';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';

// Components
import CardLastExpenses, { CardLastExpensesNavigationProp } from './components/CardLastExpenses';
import MyMonthPicker from '../../components/datePicker/MyMonthPicker';
import MyLoading from '../../components/loading/MyLoading';
import MyButton from '../../components/MyButton';
import OptionsGrid from './components/OptionsGrid';
import MyDonutChart from '~/components/charts/MyDonutChart';

// Screens
import { ChatScreen } from '../../Screens/common/ChatScreen';
import { useFeatureFlag } from '~/customHooks/useFeatureFlag';
import { ScreenHeader } from '~/components/ScreenHeader';
import { screenConfigs } from '~/config/screenConfigs';
import { showError } from '~/utils/showError';

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
  const month = useSelector((state: RootState) => state.date.month);
  const dispatch: AppDispatch = useDispatch();
  const [categories, setCategories] = useState<CategoryDataFormat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userLoggued, setUserLoggued] = useState<null | UserModel>();
  const [userImgSigned, setUserImgSigned] = useState(null);
  const { isEnabled } = useFeatureFlag('chatbot');

  useEffect(() => {
    fetchData();
    return navigation.addListener('focus', () => {
      fetchData();
    });
  }, [month]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getAllExpensesByMonth(month);
      setLoading(false);
      setTotal(data.total);
      const dataFormat = data.data.map((e, idx) => {
        return {
          name: cutName(e.name),
          population: e.total,
          color: AsignColor(idx),
          legendFontColor: '#7F7F7F',
          legendFontSize: 15
        };
      });
      dataFormat.sort(compareValues('population', 'desc'));
      setCategories(dataFormat);
    } catch (e) {
      setLoading(false);
      showError(e);
    }
  };
  const cutName = (name: string) => {
    return name.length < 12 ? name : name.slice(0, 10) + '...';
  };
  const sendcreateExpenseScreen = () => {
    navigation.navigate('createExpense');
  };
  const sendScanInvoiceExpenseScreen = () => {
    navigation.navigate('scanInvoiceExpense');
  };
  const sendDetailsExpenseScreen = () => {
    navigation.navigate('sumary');
  };
  const LogOut = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      dispatch(setIsAuth(false));
    } catch (error) {
      showError(error);
    }
  };

  // load image
  useEffect(() => {
    fetchDataUserLogued();
    return navigation.addListener('focus', () => {
      fetchDataUserLogued();
    });
  }, []);

  const fetchDataUserLogued = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      const { data } = await getUser(user.id);
      setUserLoggued(data);
      if (data.image) {
        getUrlAws(data.image);
      }
    } catch (error) {
      showError(error);
    }
  };
  // get url signed AWS
  const getUrlAws = async (keyImg: string) => {
    try {
      if (keyImg) {
        setLoading(true);
        const query = {
          file: keyImg
        };
        const { data } = await getUrlSignedAws(query);
        setLoading(false);
        setUserImgSigned(data);
      }
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  // Obtener versión de forma segura
  const version = Constants.expoConfig?.version || 'Desconocida';

  return (
    <View style={styles.container}>
        <ScreenHeader 
        title={config.title} 
        subtitle={config.subtitle} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          {userLoggued?.image && userImgSigned && <Image source={{ uri: userImgSigned }} style={styles.avatar} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{userLoggued?.name ?? 'Usuario'}</Text>
            <Text style={styles.env}>{URL_BASE}</Text>
          </View>
        </View>

        {/* MES */}
        <View style={styles.section}>
          <MyMonthPicker />
        </View>

        {/* ACCIONES */}
        <View style={styles.section}>
          <View style={styles.actionCard}>
            <OptionsGrid
              actions={[
                { title: 'Ingresar gasto', onPress: sendcreateExpenseScreen },
                { title: 'Scanear factura', onPress: sendScanInvoiceExpenseScreen }
              ]}
            />
          </View>
        </View>

        {/* TOTAL */}
        {/* <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total gastado este mes</Text>
          <Text style={styles.total}>{NumberFormat(total)}</Text>
        </View> */}

        {/* CHART */}
        <View style={styles.section}>
          {loading ? (
            <MyLoading />
          ) : total > 0 ? (
            <MyDonutChart data={categories} total={total} />
          ) : (
            <Text style={styles.textMuted}>No se registran gastos en este mes</Text>
          )}
        </View>

        <MyButton onPress={sendDetailsExpenseScreen} title="Detallar gastos" />

        {/* ÚLTIMOS GASTOS */}
        <View style={styles.section}>
          <CardLastExpenses navigation={navigation as CardLastExpensesNavigationProp} />
        </View>
        <MyButton onPress={LogOut} title="Cerrar sesión" variant="cancel" />
        {/* VERSION */}
        <Text style={styles.versionText}>Versión: {version}</Text>
      </ScrollView>

      {isEnabled && <ChatScreen />}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { padding: 2 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 12
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222'
  },
  env: {
    fontSize: 12,
    color: '#888'
  },

  section: { marginTop: 4 },

  totalBox: {
    marginTop: 10,
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 14,
    color: '#666'
  },
  total: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
    color: '#111'
  },

  textMuted: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16
  },

  versionText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    color: '#888',
    fontSize: 13
  },
  actionCard: {
    backgroundColor: '#FAFAFA',
    padding: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE'
  }
});
