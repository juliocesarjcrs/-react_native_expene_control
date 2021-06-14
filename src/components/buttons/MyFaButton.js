import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon, Tooltip } from "react-native-elements";
import {ICON, PRIMARY, SECUNDARY} from '../../styles/colors';

interface Props {
  title: String
}
const MyFaButton = ({title}) =>{

  return(
    <TouchableOpacity style={styles.fab}
    onPress={()=>{console.log('on pores')}}
    onFocus={()=>{console.log('on focus')}}
    onBlur={()=>{console.log('on onBlur')}}
    >
      <View  style={styles.fabText}>
      {/* <Tooltip popover={<Text>{title}</Text>}> */}
         <Icon
              type="material-community"
              name={"plus"}
              size={30}
              color="white"
            />
      {/* </Tooltip> */}

      </View>

    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  // fabLocation
  fab: {
    backgroundColor: '#C671E9',
    width:60,
    height:60,
    borderRadius: 100,
    justifyContent: 'center',
    position: 'absolute',
    bottom:5,
    right: 10
    // bo
  },
  fabText: {
    color: 'white',
    alignSelf: 'center'

  }
});

export default MyFaButton;
