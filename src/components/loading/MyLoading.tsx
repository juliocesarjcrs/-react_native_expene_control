import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';

const MyLoading: React.FC<{ testID?: string }> = ({ testID }) => {
   const colors = useThemeColors();
  return <ActivityIndicator testID={testID} size="large" color={colors.PRIMARY} />;
};

export default MyLoading;
