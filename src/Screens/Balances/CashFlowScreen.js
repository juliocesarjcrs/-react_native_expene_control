
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NumberFormat} from '../../utils/Helpers';
import { BIG } from "~/styles/fonts";
import {Errors} from '../../utils/Errors';
import { useSelector } from "react-redux";
import {getCategoryTypeIncome, getCategoryWithSubcategories} from '../../services/categories';

export default function CashFlowScreen({navigation}){

  const month = useSelector((state) => state.date.month);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);

  useEffect(() => {
     fetchDataExpenses();
     fetchDataIncomes();
    // const unsubscribe = navigation.addListener("focus", () => {
    //   fetchDataExpenses();
    // });
  }, [month]);

  const fetchDataExpenses = async () => {
    try {
      const { data } = await getCategoryWithSubcategories(month);
      setTotalExpenses(data.total)
    } catch (e){
      Errors(e)
    }
  };

  const fetchDataIncomes  = async() =>{
    try {
      const {data} =  await getCategoryTypeIncome(month)
      setTotalIncomes(data.total);
    } catch (e){
      Errors(e)
    }
 }


  return (
    <View style={styles.container} >
      <View style={styles.item} >
        <Text style={styles.title}>Ingresos</Text>
        <Text style={ {color:'green'} }>{NumberFormat(totalIncomes)}</Text>
      </View>
      <View style={styles.item} >
        <Text style={styles.title}>Gastos</Text>
        <Text style={ {color:'red'} }>{NumberFormat(totalExpenses)}</Text>
      </View>
      <View style={styles.item} >
        <Text style={styles.title}>Saldo</Text>
        <Text style={ {color:'blue'} }>{NumberFormat(totalIncomes - totalExpenses)}</Text>
      </View>

    </View>
  )

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    // alignItems: "center",
    // justifyContent: "center",
  },
  title : {
    fontSize: BIG
  },
  item: {
   display: "flex",
   flexDirection: "row",
   justifyContent: 'space-between',
  }
});