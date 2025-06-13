import React from 'react';
import { ActivityIndicator } from 'react-native';
import { LOADING } from '../../styles/colors';

const MyLoading: React.FC<{ testID?: string }> = ({ testID }) => {
  return <ActivityIndicator testID={testID} size="large" color={LOADING} />;
};

export default MyLoading;
