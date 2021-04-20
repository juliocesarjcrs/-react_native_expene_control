
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import Routes from './stackRoutes'

function MainStackNavigator() {
  const MainStack = createStackNavigator();

  return (
    <MainStack.Navigator>
      <MainStack.Screen name="categoriesList" component={Routes.ListCategories} />
    </MainStack.Navigator>
  );
}
export default MainStackNavigator;
