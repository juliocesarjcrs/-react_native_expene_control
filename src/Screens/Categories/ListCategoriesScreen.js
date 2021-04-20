
import { StatusBar } from 'expo-status-bar';
import  React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import {getCategories} from '~/services/categories';
import { Colors, Inputs} from '~/styles';

export default function ListCategories() {
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  // const categories = []

  useEffect(()=>{
    fetchData()
  },[])

  const fetchData = async () => {
    try {
      const {data} = await getCategories()
      console.log('listar categorias', data);
      setCategories(data)

    } catch (e) {
      console.error(e)
    }
  }


  return (

      <View style={styles.container}>
        <Text>Hello julio!</Text>
        <StatusBar style="auto" />
        <Button
          onPress={() =>  console.log('agragar gasto')}
          title="Crear"
          color={Colors.primaryColor}
          accessibilityLabel="Learn more about this purple button"
        />
        <TextInput
          style={styles.input}
          placeholder="Ej: Aseo, Hogar"
          maxLength={40}
          onChangeText={text => setCategory(text)}
          defaultValue={category}
        />
        <FlatList
        keyExtractor={item => item.id.toString()}
        data={categories}
        renderItem={({item}) => <Text style={styles.item}>{item.name}</Text>}
        />
      </View>

  );
}

const onPressAddExpense = () =>{
  console.log('agragar gasto');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input:{
    ...Inputs.base
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
});
