import React from "react";
import {StyleSheet, Text} from 'react-native';
import { MEDIUM } from "~/styles/fonts";
const MyLabel = ({ data }) => {
  return (
    <Text style={styles.text}>{data}</Text>
  );
};
const styles = StyleSheet.create({
  text: {
    marginTop:20,
    fontSize: MEDIUM,
    // backgroundColor:"green"
  },
});
export default MyLabel;