import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import Routes from './stackRoutes'

function AuthStackNavigator() {
  const AuthStack = createStackNavigator();

  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="login" component={Routes.LoginScreen} />
    </AuthStack.Navigator>
  );
}
export default AuthStackNavigator;
