import React from 'react';
import {View} from 'react-native';
import {Text} from 'react-native';
import {NumberFormat} from '../../../utils/Helpers';
import {Icon} from 'react-native-elements';
import {ICON} from '../../../styles/colors';

 const HeaderList = ({data, navigation})=>{
  //  console.log(data);
   const sendEditCategoryScreen = (id) => {
     console.log('asadasd');
    navigation.navigate("editCategory", { idCategory: id });
  };
  const sendcreateExpenseScreen = () => {
    navigation.navigate("createExpense");
  };
  return(
    <View>
      <Text>{data.name}</Text>
      <View>
        <Icon
          type="material-community"
          style={{ paddingLeft: 15 }}
          name={"pencil-outline"}
          size={20}
          color={ICON}
          onPress={() => sendEditCategoryScreen(data.id)}
        />
      <Text >{NumberFormat(data.total)}</Text>
    </View>
    </View>
  )
}
export default HeaderList