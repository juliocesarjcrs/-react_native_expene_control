import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Image } from "react-native";
import MyPieChart from "../../components/charts/MyPieChart";
import MyButton from "~/components/MyButton";
import { getCategoryWithSubcategories } from "../../services/categories";
import { AsignColor, compareValues, NumberFormat } from "../../utils/Helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setAuthAction } from "~/actions/authActions";
import MyMonthPicker from "../../components/datePicker/MyMonthPicker";
import { MUTED, SECUNDARY } from "../../styles/colors";
import { Button } from "react-native-elements";
import { BIG } from "../../styles/fonts";
import { Errors } from "../../utils/Errors";
import MyLoading from "~/components/loading/MyLoading";
import MyFaButton from "../../components/buttons/MyFaButton";
import CardLastExpenses from "./components/CardLastExpenses";
import {getUser} from '../../services/users';
import {getUrlSignedAws} from '../../services/files';

export default function MainScreen({ navigation }) {
  const month = useSelector((state) => state.date.month);
  const userAuth = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userLoggued, setUserLoggued] = useState({});
  const [userImgSigned, setUserImgSigned] = useState(null);

  useEffect(() => {

    fetchData();
    return navigation.addListener("focus", () => {
      fetchData();
    });
  }, [month]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories(month);
      setLoading(false);
      setTotal(data.total);
      const dataFormat = data.data.map((e, idx) => {
        return {
          name: cutName(e.name),
          population: e.total,
          color: AsignColor(idx),
          legendFontColor: "#7F7F7F",
          legendFontSize: 15,
        };
      });
      dataFormat.sort(compareValues('population','desc'));
      setCategories(dataFormat);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const cutName = (name) => {
    return name.length < 12 ? name : name.slice(0, 10) + "...";
  };
  const sendcreateExpenseScreen = () => {
    navigation.navigate("createExpense");
  };
  const sendDetailsExpenseScreen = () => {
    navigation.navigate("sumary");
  };
  const LogOut = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("user");
    dispatch(setAuthAction(false));
  };

  // load image
  useEffect(() => {
    fetchDataUserLogued();
    return navigation.addListener("focus", () => {
      fetchDataUserLogued();
    });

  }, []);

  const fetchDataUserLogued = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user')
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      const {data} = await getUser(user.id);
      setUserLoggued(data);
      if (data.image){
        getUrlAws(data.image);
      }
    } catch (error) {
      Errors(error);
    }
  };
  // get url signed AWS
  const getUrlAws = async (keyImg) => {
      try {
          if (keyImg) {
              setLoading(true);
              const query = {
                  file: keyImg,
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
  return (
    <View style={styles.container}>
      <ScrollView>
        <MyMonthPicker />
        {
          userLoggued.image && userImgSigned &&
          <Image
          style={styles.logo}
          source={{
            uri: userImgSigned
          }}
          />
        }
        <Text style={{ fontWeight:'bold'}}>{userLoggued.name? userLoggued.name: '---'}</Text>
        <View style={styles.fixToText}>
          <MyButton onPress={sendcreateExpenseScreen} title="Ingresar gasto" />
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
          <Text style={styles.textMuted}>
            No se registran gastos en este mes
          </Text>
        )}
        <CardLastExpenses navigation={navigation} />

      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  fixToText: {
    // backgroundColor: 'pink',
    marginTop:0,
    paddingTop:0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: BIG,
    marginTop: 5,
  },
  textMuted: {
    textAlign: "center",
    color: MUTED,
  },
  logo: {
    marginLeft:10,
    marginTop:5,
    width: 66,
    height: 58,
  },
});
