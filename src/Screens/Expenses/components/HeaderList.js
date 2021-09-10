import React from 'react';
import {View} from 'react-native';
import {Text} from 'react-native';
import {NumberFormat} from '../../../utils/Helpers';
import {Icon} from 'react-native-elements';
import {ICON} from '../../../styles/colors';

 const HeaderList = ({data, navigation})=>{
   const sendEditCategoryScreen = (id) => {
    navigation.navigate("editCategory", { idCategory: id });
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