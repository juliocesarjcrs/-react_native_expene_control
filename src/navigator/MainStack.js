
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
// import { createDrawerNavigator } from '@react-navigation/drawer';

import Routes from './stackRoutes'

function MainStackNavigator() {
  const MainStack = createStackNavigator();
  // const MainStack = createDrawerNavigator();

  return (
    <MainStack.Navigator>
      <MainStack.Screen name="main" component={Routes.MainScreen} options={{ title: 'Resumen gastos del mes' }}/>
      <MainStack.Screen name="subcategoriesList" component={Routes.ListSubCategoriesScreen} options={{ title: 'Detalle de  gastos' }} />
      <MainStack.Screen name="createExpense" component={Routes.CreateExpenseScreen} options={{ title: 'Ingresar gasto' }}  />
      <MainStack.Screen name="createSubcategory" component={Routes.CreateSubcategoryScreen} options={{ title: 'Crear Subcategoría' }}/>
      <MainStack.Screen name="createCategory" component={Routes.CreateCategoryScreen} options={{ title: 'Crear Categoría' }} />
      <MainStack.Screen name="editCategory" component={Routes.EditCategoryScreen} options={{ title: 'Editar Categoría' }}/>


    </MainStack.Navigator>
  );
}
export default MainStackNavigator;
