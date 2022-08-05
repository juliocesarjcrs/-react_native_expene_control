import React, {useState} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import { useDispatch } from "react-redux";
import {setQueryAction} from '../../../actions/SearchActions';

 const BarSearch = ()=>{
   const [query, setQuery] = useState('');
   const dispatch = useDispatch();

  const handleSearch = async text => {
    dispatch(setQueryAction (text));
    setQuery(text);
  }

  return(
    <View
    style={{
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        <TextInput
        style={styles.input}
        onChangeText={handleSearch}
        value={query}
        placeholder="Buscador ..."
      />
  </View>
  )
}
const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 25,
    borderColor: '#333',
    backgroundColor: '#fff'
  },
});
export default BarSearch