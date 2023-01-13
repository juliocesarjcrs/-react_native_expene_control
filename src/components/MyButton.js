import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native';
import {SECUNDARY} from '../styles/colors';

export default function MyButton({title, onPress}){
  return (
    <View style={styles.container}>
      <Button
        onPress={(value) => onPress(value)}
        title={title}
        color={SECUNDARY}
        accessibilityLabel="Learn more about this purple button"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    // padding: 5,
    marginHorizontal: 5,
    marginVertical: 10
  }
})