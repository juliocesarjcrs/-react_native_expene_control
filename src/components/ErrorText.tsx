import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { RED } from '../styles/colors';
import { MEDIUM } from '../styles/fonts';
type ErrorTextProps = {
  msg: string;
};

const ErrorText: React.FC<ErrorTextProps> = ({ msg }) => {
  return <Text style={styles.errorText}>{msg}</Text>;
};
const styles = StyleSheet.create({
  errorText: {
    color: RED,
    fontSize: MEDIUM,
    paddingTop: 10
  }
});

export default ErrorText;
