import React, {useEffect, useState} from "react";
import { Text, View } from "react-native";
import MyPieChart from '../../components/charts/MyPieChart';
import MyButton from "~/components/MyButton";
import {getCategoryWithSubcategories} from '../../services/categories';
import {AsignColor} from '../../utils/Helpers';
export default function MainScreen({ navigation }) {
  const [categories, setCategories] = useState([])
  useEffect(() =>{
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
  },[])
  const fetchData = async () =>{
      const {data} = await  getCategoryWithSubcategories();
      const dataFormat = data.data.map((e,idx) =>{
        return   {
          name: e.name,
          population: e.total,
          color: AsignColor(idx),
          legendFontColor: '#7F7F7F',
          legendFontSize: 15,
        }
      })
      setCategories(dataFormat)
    }
  const sendcreateExpenseScreen = () => {
    navigation.navigate("createExpense");
  };
  const sendDetailsExpenseScreen = () => {
    navigation.navigate("subcategoriesList");
  };
  return (<View>
    <MyButton onPress={sendcreateExpenseScreen} title="Ingresar gasto" />
    <MyPieChart data={categories}/>
    <MyButton onPress={sendDetailsExpenseScreen} title="Detallar gastos" />
    
  </View>)
}
