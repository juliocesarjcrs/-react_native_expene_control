import React, {useEffect, useState,forwardRef, useImperativeHandle} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import DropDownPicker from "react-native-dropdown-picker";
import {getAllSubcategoriesExpensesByMonth} from '../../services/categories';
import { useSelector } from "react-redux";

// Utils
import {Errors} from '../../utils/Errors';
import ErrorText from '../ErrorText';

// Components
import MyLoading from '../loading/MyLoading';

// Types
import { RootState } from '../../shared/types/reducers';
import { CategoryFormat, SubcategoryFormat } from '../../shared/types/components/dropDown/SelectJoinCategory.type';
import { DropDownSelectJoinCategoryFormat, DropDownSelectJoinCategoryFormat2 } from '../../shared/types/components/dropDown/SelectOnlyCategory.type';

interface SelectJoinCategoryProps {
  fetchExpensesSubcategory: (data: DropDownSelectJoinCategoryFormat) => void;
  fetchExpensesOnlyCategory: (data: DropDownSelectJoinCategoryFormat2) => void
}
type SubcategoryFormatInt = {
  label: string;
  value: number;
}

const SelectJoinCategory = forwardRef(({fetchExpensesSubcategory,fetchExpensesOnlyCategory}:SelectJoinCategoryProps, ref) => {
  const month  = useSelector((state: RootState) => state.date.month);
  const [categories, setCategories] = useState<CategoryFormat[]>([]);
  const [subcategories, setSubcategories] = useState<DropDownSelectJoinCategoryFormat[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<null | number>(null);
  // const [sumCost, setSumCost] = useState(0);
  // const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const ITEM_HEIGHT = 42
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [idCategory, setIdCategory] = useState<null | number>(null);
  useImperativeHandle(ref, () => ({
    resetSubcategory() {
      setSubcategoryId(null);
    },
  }))

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await getAllSubcategoriesExpensesByMonth(month);
      setLoading(false);
      const filter = data.data.filter((f) => f.subcategories.length > 0);
      const dataFormat = filter.map((e) => {
        return { label: e.name, value: e.id, subcategories: e.subcategories };
      });
      setCategories(dataFormat);
      defaultIdCategory(dataFormat);
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const defaultIdCategory = (categoriesFormat :CategoryFormat[]) =>{
    if(categoriesFormat.length > 0){
      setIdCategory(categoriesFormat[0].value)
    }
  }

  const sendDataSubcategory = (index: null | number) => {
    if (index) {
      const foundSubcategory = subcategories.find(e=> e.value === index);
      if(foundSubcategory){
        fetchExpensesSubcategory(foundSubcategory);
      }
    }
  };

  useEffect(() => {
    sendFromDropDownPickerCategory(idCategory);
  }, [idCategory]);
  useEffect(() => {
    sendDataSubcategory(subcategoryId);
  }, [subcategoryId]);

  const sendFromDropDownPickerCategory = (index: number | null) => {
    // setExpenses([]);
    setSubcategoryId(null);
    // setSumCost(0);
    const indexArray = categories.findIndex((e) => {
      return e.value === index;
    });
    if (indexArray >= 0) {
      const dataFormat = formatOptionsSubcategories(
        categories[indexArray].subcategories
        );
        setSubcategories(dataFormat);
        const newData = {
          id: index,
          label: categories[indexArray].label
        }
        fetchExpensesOnlyCategory(newData);
    }
  };
  const formatOptionsSubcategories = (data: SubcategoryFormat[]) : SubcategoryFormatInt[]=> {
    return data.map((e) => {
      return { label: e.name, value: e.id };
    });
  };
  return(
    <View style={styles.container}>
       <Text>Categoría</Text>
      <DropDownPicker
        // containerStyle={{ height: 40, marginBottom: 10 }}
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
        ActivityIndicatorComponent={() => (
          <MyLoading />
          // <ActivityIndicator color={color} size={size} />
        )}
        activityIndicatorColor="red"
        activityIndicatorSize={30}
        dropDownContainerStyle={{
          backgroundColor: "#dfdfdf"
        }}
        listMode="MODAL"
        // flatListProps={{
        //   initialNumToRender: 10
        // }}
        // listItemContainer={{
        //   height: 150,
        //   backgroundColor: '#F4C75B'
        // }}
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

      <Text>Subcategoría</Text>
      <DropDownPicker
        // containerStyle={{ height: 40, marginBottom: 10 }}
        open={open2}
        value={subcategoryId}
        items={subcategories}
        setOpen={setOpen2}
        setValue={setSubcategoryId}
        setItems={setSubcategories}
        maxHeight={ITEM_HEIGHT * subcategories.length}
        placeholder="Selecione una subcategoría"
        zIndex={1000}
        zIndexInverse={2000}
        loading={loading}
        listMode="MODAL"
        dropDownContainerStyle={{
          backgroundColor: "#dfdfdf"
        }}
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
      {!subcategoryId ? <ErrorText msg="Necesita seleccionar una subcategoria" /> : null}
    </View>
  )

      });

SelectJoinCategory.displayName = 'SelectJoinCategory';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  }
});

export default SelectJoinCategory;