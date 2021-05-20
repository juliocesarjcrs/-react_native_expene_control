import React from 'react';
import { StyleSheet } from 'react-native';
import {Icon} from 'react-native-elements';

import {ICON} from '../styles/colors';

export default function MyIcon({name, onPress}){
  return (
    <Icon
    type="material-community"
    style={{ paddingRight: 15 }}
    name={name}
    size={20}
    color={ICON}
    onPress={onPress}
  />
  )
}

const styles = StyleSheet.create({
  container:{
    padding: 5,
    marginHorizontal: 5,
    marginVertical: 30
  }
})