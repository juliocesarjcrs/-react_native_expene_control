import React from "react";
import {StyleSheet, Text} from 'react-native';
import { BIG } from "~/styles/fonts";
const Title = ({ data }) => {
  return (
    <Text style={styles.text}>{data}</Text>
  );
};
const styles = StyleSheet.create({
  text: {
    fontSize: BIG
  },
});
export default Title;