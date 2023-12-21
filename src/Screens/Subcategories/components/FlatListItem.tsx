import React from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-elements";

// Services
import { deleteSubategory } from "../../../services/subcategories";

// Types
import { SubcategoriesWithExpenses } from "../../../shared/types/services/subcategories-services.type";

// Utils
import { Errors } from "../../../utils/Errors";

// Styles
import { ICON, PRIMARY } from "../../../styles/colors";
import { MEDIUM } from "../../../styles/fonts";


interface FlatListItemProps {
  data: [] | SubcategoriesWithExpenses[];
  updateList: () => void;
  navigation: {
    navigate: (screen: string, params: Record<string, any>) => void;
  };
}
const FlatListItem: React.FC<FlatListItemProps> = ({ data, updateList, navigation }) => {
  const listItem = ({ item }: { item: SubcategoriesWithExpenses }) => {
    const deleteItem = async (idExpense: number) => {
      try {
        await deleteSubategory(idExpense);
        updateList();
      } catch (e) {
        Errors(e);
      }
    };
    const sendEditSubcategoryScreen = (subcategoryObject: SubcategoriesWithExpenses) => {
      navigation.navigate("editSubcategory", { subcategoryObject });
    };

    const createTwoButtonAlert = (id: number) =>
      Alert.alert("Eliminar", "¿Desea eliminar esta Subcategoria?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        { text: "OK", onPress: () => deleteItem(id) },
      ]);
    return (
      <View style={styles.header}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={{ display: "flex", flexDirection: "row" }}>
          <View style={{ paddingRight: 15 }}>
            <Icon
              type="material-community"
              name="trash-can"
              size={20}
              color={ICON}
              onPress={() => createTwoButtonAlert(item.id)}
            />
          </View>
          <Icon
            type="material-community"
            style={{ paddingRight: 55, color: "white" }}
            name={"pencil-outline"}
            size={20}
            color={ICON}
            onPress={() => sendEditSubcategoryScreen(item)}
          />
        </View>
      </View>
    );
  };
  const styles = StyleSheet.create({
    header: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      width: 300,
      backgroundColor: PRIMARY,
      padding: 5,
    },
    title: {
      fontSize: MEDIUM,
      color: "white",
      padding: 2,
    },
    item: {
      padding: 10,
      fontSize: MEDIUM,
      height: 44,
    },
  });

  return (
    <FlatList
      keyExtractor={(item) => item.id.toString()}
      data={data}
      renderItem={listItem}
    />
  );
};
export default FlatListItem;
