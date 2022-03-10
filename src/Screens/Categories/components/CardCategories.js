import React, {useState} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import { Icon } from "react-native-elements";
import { PRIMARY, ICON } from "~/styles/colors";
import { MEDIUM, SMALL } from "~/styles/fonts";

 const CardCategories = ({item})=>{
   const [query, setQuery] = useState('');
   console.log('item', item);
   const cutText =(text, n= 12) =>{
    if(text.length >n){
      return text.slice(0, n)+'...';
    }else{
      return text;
    }
   }
   return (
      //  <View style={styles.container}>
           <View style={styles.box}>
               <Icon
                   type="font-awesome"
                   style={{ paddingRight: 15 }}
                   name={item.icon ? item.icon : "home"}
                   size={40}
                   color={ICON}
               />
               <Text style={styles.title}>{cutText(item.label)}</Text>
           </View>
      //  </View>
   );
}
const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: 'pink',
  //   // flexDirection: "row",
  // },
  box: {
    width: 110,
    height: 70,
    backgroundColor: 'steelblue',
    borderWidth: 3,
    margin:2
  },
  // row: {
  //   // flexWrap: "wrap",
  //   width:80,
  //   backgroundColor: 'skyblue'
  // },
  title: {
    color: "black",
    fontSize: MEDIUM,
    padding: 2,
  },
});
export default CardCategories