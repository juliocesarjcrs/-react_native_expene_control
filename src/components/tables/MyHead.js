import React from "react";
import {StyleSheet, Text, View} from 'react-native';

const MyHead = ({data}) => {
  return (
      <View style={styles.container}>
          {data.map((e, idx) => {
              return <Text style={styles.intoHead} key={idx}> { e }</Text>;
          })}
      </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#DCEBF7',
    flex:1,
    flexDirection:'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height:30,
    borderWidth: 2,
    borderColor: '#BFD9EC',
  },
  intoHead: {
    width:120

  }
});

export default MyHead;
