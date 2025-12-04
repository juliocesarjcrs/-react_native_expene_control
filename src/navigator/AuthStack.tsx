import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import Routes from './stackRoutes';
import { AuthStackParamList } from '../shared/types';

function AuthStackNavigator() {
  const AuthStack = createStackNavigator<AuthStackParamList>();

  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="login" component={Routes.LoginScreen} />
      <AuthStack.Screen
        name="forgotPassword"
        component={Routes.ForgotPasswordScreen}
        options={{ title: 'Recuperar contraseña' }}
      />
      <AuthStack.Screen
        name="checkCodePassword"
        component={Routes.CheckCodePasswordScreen}
        options={{ title: 'Enviar código' }}
      />
      <AuthStack.Screen
        name="resetPassword"
        component={Routes.ResetPasswordScreen}
        options={{ title: 'Restablecer contraseña' }}
      />
    </AuthStack.Navigator>
  );
}
export default AuthStackNavigator;
