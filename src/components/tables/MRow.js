import React from "react";
import {StyleSheet, Text, View} from 'react-native';

const MRow = ({data}) => {
  return (
      <View style={styles.container}>
          {data.map((e, idx) => {
              return <Text style={styles.intoRow} key={idx}> { e }</Text>;
          })}
      </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex:1,
    flexDirection:'row',
    justifyContent: 'flex-start',
    borderBottomColor: '#BFD9EC',
    borderBottomWidth: 2,
    height:30,
    alignItems: 'center',
  },
  intoRow: {
    width: 120
  }
});

export default MRow;
