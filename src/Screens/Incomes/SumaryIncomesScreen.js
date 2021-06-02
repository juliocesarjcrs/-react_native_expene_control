import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import MyAcordeonIncome from './components/MyAcordeonIncome';
import { useSelector } from "react-redux";
import {getCategoryTypeIncome} from '../../services/categories';
import {DateFormat, NumberFormat} from '../../utils/Helpers';
import {BIG} from '../../styles/fonts';
import {FAB} from 'react-native-elements';
import MyTabs from '../../components/tabs/MyTabs';

export default function SumaryIncomesScreen({ navigation }){

  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const month = useSelector((state) => state.date.month);

  useEffect(()=>{
    fetchData()
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
  },[])
  const fetchData  = async() =>{
     const {data} =  await getCategoryTypeIncome(month)
     setTotal(data.total);
     setCategories(data.data);
  }
  const sendEditCategoryScreen = (id) => {
    navigation.navigate("editCategory", { idCategory: id });
  };
  const sendAddIncomeScrenn = ( ) =>{
    navigation.navigate("createIncome");
  };
  const sendCreteCategoryScrenn = ( ) =>{
    navigation.navigate("createCategory");
  };
  const updateList = () =>{
    fetchData();
  };

  return(
    <View style={styles.container}>
      {/* <MyTabs navigation={navigation} /> */}
        <FAB title="Agregar ingreso" onPress={sendAddIncomeScrenn} />
      <Text style={{ fontSize: BIG, fontWeight: "bold", textAlign: "center", marginVertical:5}}>
        Total Ingresos mes {DateFormat(month, "MMMM")}: {NumberFormat(total)}
      </Text>
      <ScrollView style={{ marginTop:20}}>
        {categories.map((e, idx) => (
          <MyAcordeonIncome
          key={e.id}
          data={e}
          editCategory={sendEditCategoryScreen}
          updateList={updateList}
          />
          ))}
      </ScrollView>
      <FAB title="Nueva caegoría" onPress={sendCreteCategoryScrenn} />
    </View>
  )

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    // marginTop: ,
    paddingBottom: 15
  }
});