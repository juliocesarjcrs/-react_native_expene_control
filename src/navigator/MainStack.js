
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from '@react-navigation/drawer';

import Routes from './stackRoutes'

function MainStackNavigator() {
  const MainStack = createStackNavigator();
  // const MainStack = createDrawerNavigator();

  return (
    <MainStack.Navigator>
      <MainStack.Screen name="subcategoriesList" component={Routes.ListSubCategoriesScreen} />
      <MainStack.Screen name="createExpense" component={Routes.CreateExpenseScreen} />
      <MainStack.Screen name="createSubcategory" component={Routes.CreateSubcategoryScreen} />
      <MainStack.Screen name="createCategory" component={Routes.CreateCategoryScreen} />
      <MainStack.Screen name="editCategory" component={Routes.EditCategoryScreen} />


    </MainStack.Navigator>
  );
}
export default MainStackNavigator;
