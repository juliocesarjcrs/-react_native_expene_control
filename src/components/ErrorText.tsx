import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { MEDIUM } from '../styles/fonts';
import { useThemeColors } from '~/customHooks/useThemeColors';

type ErrorTextProps = {
  msg: string;
};

const ErrorText: React.FC<ErrorTextProps> = ({ msg }) => {
  const colors = useThemeColors();
  return <Text style={[styles.errorText, { color: colors.ERROR }]}>{msg}</Text>;
};

const styles = StyleSheet.create({
  errorText: {
    fontSize: MEDIUM,
    paddingTop: 3
  }
});

export default ErrorText;
