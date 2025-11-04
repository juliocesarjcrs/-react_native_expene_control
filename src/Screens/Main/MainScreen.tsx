import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import MyPieChart from '../../components/charts/MyPieChart';
import { AsignColor, compareValues, NumberFormat } from '../../utils/Helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { MUTED, SECUNDARY } from '../../styles/colors';
import { Button } from 'react-native-elements';
import { BIG } from '../../styles/fonts';
import { Errors } from '../../utils/Errors';
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

// Screens
import { ChatScreen } from '../../Screens/common/ChatScreen';

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
  const month = useSelector((state: RootState) => state.date.month);
  const dispatch: AppDispatch = useDispatch();
  const [categories, setCategories] = useState<CategoryDataFormat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userLoggued, setUserLoggued] = useState<null | UserModel>();
  const [userImgSigned, setUserImgSigned] = useState(null);

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
      Errors(e);
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
      Errors(error);
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
      Errors(error);
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
      Errors(error);
    }
  };

  // Obtener versión de forma segura
  const version =
    Constants.expoConfig?.version ||
    'Desconocida';

  return (
    <View style={styles.container}>
      <ScrollView>
        <MyMonthPicker />
        {userLoggued?.image && userImgSigned && (
          <Image
            style={styles.logo}
            source={{
              uri: userImgSigned
            }}
          />
        )}
        <Text style={{ fontWeight: 'bold' }}>{URL_BASE}</Text>
        <Text style={{ fontWeight: 'bold' }}>{userLoggued?.name ? userLoggued.name : '---'}</Text>
        <View style={styles.fixToText}>
          <MyButton onPress={sendcreateExpenseScreen} title="Ingresar gasto" />
          <MyButton onPress={sendScanInvoiceExpenseScreen} title="Scanear" />
          <MyButton onPress={LogOut} title="Cerrar sesión" />
        </View>
        <Button
          title="Detallar gastos"
          buttonStyle={{ backgroundColor: SECUNDARY }}
          onPress={sendDetailsExpenseScreen}
        />
        <Text style={styles.text}>Total: {NumberFormat(total)}</Text>
        {loading ? (
          <MyLoading />
        ) : total > 0 ? (
          <MyPieChart data={categories} />
        ) : (
          <Text style={styles.textMuted}>No se registran gastos en este mes</Text>
        )}
        {/* <CardLastExpenses navigation={navigation} /> */}
        <CardLastExpenses navigation={navigation as CardLastExpensesNavigationProp} />
        <View style={styles.versionBox}>
          <Text style={styles.versionText}>
            Versión: {version}
          </Text>
        </View>
      </ScrollView>
      <ChatScreen />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  fixToText: {
    // backgroundColor: 'pink',
    marginTop: 0,
    paddingTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: BIG,
    marginTop: 5
  },
  textMuted: {
    textAlign: 'center',
    color: MUTED
  },
  logo: {
    marginLeft: 10,
    marginTop: 5,
    width: 66,
    height: 58
  },
  versionBox: {
    marginTop: 24,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginBottom: 16
  },
  versionText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 14
  }
});
