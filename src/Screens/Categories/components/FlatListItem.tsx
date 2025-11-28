import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View, ListRenderItem } from 'react-native';
import { Icon } from 'react-native-elements';
import { deleteCategory } from '~/services/categories';
import { showError } from '~/utils/showError';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM } from '~/styles/fonts';
import { PRIMARY, ICON } from '~/styles/colors';
import { CategoryModel } from '~/shared/types';

interface FlatListItemProps {
  data: CategoryModel[];
  updateList: () => void;
}

export default function FlatListItem({ data, updateList }: FlatListItemProps) {
  const colors = useThemeColors();

  const deleteItem = async (idCategory: number): Promise<void> => {
    try {
      await deleteCategory(idCategory);
      updateList();
    } catch (error) {
      showError(error);
    }
  };

  const createTwoButtonAlert = (id: number): void => {
    Alert.alert('Eliminar', '¿Desea eliminar esta categoría?', [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: 'Eliminar',
        onPress: () => deleteItem(id),
        style: 'destructive'
      }
    ]);
  };

  const renderItem: ListRenderItem<CategoryModel> = ({ item }) => {
    return (
      <View style={styles.header}>
        <Icon type="font-awesome" style={{ paddingRight: 15 }} name={item.icon || 'home'} size={20} color={ICON} />
        <Text style={styles.title}>{item.name}</Text>
        <Icon
          type="material-community"
          style={{ paddingRight: 15 }}
          name="trash-can"
          size={20}
          color={ICON}
          onPress={() => createTwoButtonAlert(item.id)}
        />
      </View>
    );
  };

  return <FlatList keyExtractor={(item) => item.id.toString()} data={data} renderItem={renderItem} />;
}

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 340,
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    padding: 4
  },
  title: {
    fontSize: MEDIUM,
    color: 'white',
    padding: 2
  }
});
