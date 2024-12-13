import React from 'react';
import { ActivityIndicator } from 'react-native';
import { LOADING } from '../../styles/colors';

const MyLoading: React.FC = () => {
  return <ActivityIndicator size="large" color={LOADING} />;
};

export default MyLoading;
