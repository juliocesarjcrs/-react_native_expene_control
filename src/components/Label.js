import React from "react";
import {StyleSheet, Text} from 'react-native';
import { MEDIUM } from "~/styles/fonts";
const Label = ({ data }) => {
  return (
    <Text style={styles.text}>{data}</Text>
  );
};
const styles = StyleSheet.create({
  text: {
    fontSize: MEDIUM
  },
});
export default Label;