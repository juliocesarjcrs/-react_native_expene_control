import React from 'react';import {StyleSheet, Text} from 'react-native';
import {RED} from '../styles/colors';
import {SMALL} from '../styles/fonts';

const ErrorText =({msg}) =>{
  return(<Text style={styles.errorText}>{msg}</Text>)
}

const styles = StyleSheet.create({
  errorText:{
    // flex: 1,
    // width: 312,
    color: RED,
    fontSize: SMALL,
  }
})

export default ErrorText;