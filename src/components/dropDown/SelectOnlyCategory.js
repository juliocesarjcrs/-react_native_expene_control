import React, {useEffect, useState,forwardRef, useImperativeHandle} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import DropDownPicker from "react-native-dropdown-picker";
import MyLoading from "~/components/loading/MyLoading";
import {Errors} from '../../utils/Errors';
import ErrorText from '../ErrorText';
import {getCategories} from "~/services/categories";

const SelectOnlyCategory = forwardRef(({fetchIncomesOnlyCategory}, ref) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const ITEM_HEIGHT = 42
  const [open, setOpen] = useState(false);
  const [idCategory, setIdCategory] = useState(null);

  useImperativeHandle(ref, () => ({

  }))

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    sendFromDropDownPickerCategory(idCategory);
  }, [idCategory]);


  const sendFromDropDownPickerCategory = (index) => {
    const indexArray = categories.findIndex((e) => {
      return e.value === index;
    });
    if (indexArray >= 0) {
        const newData = {
          id: index,
          label: categories[indexArray].label
        }
        fetchIncomesOnlyCategory(newData);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = {
        type: 1,
      };
      const { data } = await getCategories(params);
      setLoading(false);
      const dataFormat = data.map((e) => {
        return { label: e.name, value: e.id };
      });
      setCategories(dataFormat);
      defaultIdCategory(dataFormat);
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };

  const defaultIdCategory = (categoriesFormat) =>{
    if(categoriesFormat.length > 0){
      setIdCategory(categoriesFormat[0].value)
    }
  }

  return(
    <View style={styles.container}>
       <Text>Categoría</Text>
      <DropDownPicker
        open={open}
        value={idCategory}
        items={categories}
        setOpen={setOpen}
        setValue={setIdCategory}
        setItems={setCategories}
        maxHeight={ITEM_HEIGHT * categories.length}
        placeholder="Selecione una categoría"
        zIndex={2000}
        zIndexInverse={1000}
        loading={loading}
        ActivityIndicatorComponent={({color, size}) => (
          <MyLoading />
        )}
        activityIndicatorColor="red"
        activityIndicatorSize={30}
        dropDownContainerStyle={{
          backgroundColor: "#dfdfdf"
        }}
        listMode="MODAL"

        selectedItemContainerStyle={{
          backgroundColor: "#F0AEBB"
        }}
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: "white"
        }}
        selectedItemLabelStyle={{
          fontWeight: "bold"
        }}
      />
      {!idCategory ? (
        <ErrorText msg="Necesita seleccionar una  Categoria" />
      ) : null}
    </View>
  )
});
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  }
});

export default SelectOnlyCategory;

