import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useSelector } from 'react-redux';

// Services
import { getAllSubcategoriesExpensesByMonth } from '../../services/categories';

// Utils
import ErrorText from '../ErrorText';

// Components
import MyLoading from '../loading/MyLoading';

// Types
import { RootState } from '../../shared/types/reducers';
import { CategoryFormat, SubcategoryFormat } from '../../shared/types/components/dropDown/SelectJoinCategory.type';
import {
  DropDownSelectJoinCategoryFormat,
  DropDownSelectJoinCategoryFormat2
} from '../../shared/types/components/dropDown/SelectOnlyCategory.type';

// Styles
import { COLOR_SEPARATOR_DROPDOWN, COLOR_TEXT_DROPDOWN, ICON_DROPDOWN } from '~/styles/colors';
import { MEGA_BIG } from '~/styles/fonts';
import { Icon } from 'react-native-elements';
import { showError } from '~/utils/showError';

interface SelectJoinCategoryProps {
  fetchExpensesSubcategory: (data: DropDownSelectJoinCategoryFormat) => void;
  fetchExpensesOnlyCategory: (data: DropDownSelectJoinCategoryFormat2) => void;
  containerStyle?: StyleProp<ViewStyle>;
}
type SubcategoryFormatInt = {
  label: string;
  value: number;
};

const SelectJoinCategory = forwardRef(
  ({ fetchExpensesSubcategory, fetchExpensesOnlyCategory, containerStyle }: SelectJoinCategoryProps, ref) => {
    const month = useSelector((state: RootState) => state.date.month);
    const [categories, setCategories] = useState<CategoryFormat[]>([]);
    const [subcategories, setSubcategories] = useState<DropDownSelectJoinCategoryFormat[]>([]);
    const [subcategoryId, setSubcategoryId] = useState<null | number>(null);
    const [loading, setLoading] = useState(false);
    const ITEM_HEIGHT = 42;
    const [open, setOpen] = useState(false);
    const [open2, setOpen2] = useState(false);
    const [idCategory, setIdCategory] = useState<null | number>(null);
    useImperativeHandle(ref, () => ({
      resetSubcategory() {
        setSubcategoryId(null);
      }
    }));

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
          return {
            label: e.name,
            value: e.id,
            subcategories: e.subcategories,
            icon: () => <Icon name={e.icon ? e.icon : 'question'} type="font-awesome" size={35} color={ICON_DROPDOWN} />
          };
        });
        setCategories(dataFormat);
        defaultIdCategory(dataFormat);
      } catch (error) {
        setLoading(false);
        showError(error);
      }
    };
    const defaultIdCategory = (categoriesFormat: CategoryFormat[]) => {
      if (categoriesFormat.length > 0) {
        setIdCategory(categoriesFormat[0].value);
      }
    };

    const sendDataSubcategory = (index: null | number) => {
      if (index) {
        const foundSubcategory = subcategories.find((e) => e.value === index);
        if (foundSubcategory) {
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
      setSubcategoryId(null);
      const indexArray = categories.findIndex((e) => {
        return e.value === index;
      });
      if (indexArray >= 0) {
        const dataFormat = formatOptionsSubcategories(categories[indexArray].subcategories);
        setSubcategories(dataFormat);
        const newData = {
          id: index,
          label: categories[indexArray].label
        };
        fetchExpensesOnlyCategory(newData);
      }
    };
    const formatOptionsSubcategories = (data: SubcategoryFormat[]): SubcategoryFormatInt[] => {
      return data.map((e) => {
        return { label: e.name, value: e.id };
      });
    };
    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.subtitle}>Categoría</Text>
        <DropDownPicker
          open={open}
          value={idCategory}
          items={categories}
          setOpen={setOpen}
          setValue={setIdCategory}
          setItems={setCategories}
          maxHeight={ITEM_HEIGHT * categories.length}
          placeholder="Selecione una categoría"
          placeholderStyle={styles.placeholder}
          zIndex={3000}
          zIndexInverse={1000}
          loading={loading}
          ActivityIndicatorComponent={() => <MyLoading />}
          activityIndicatorColor="red"
          activityIndicatorSize={30}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          listMode="MODAL"
          modalProps={{
            animationType: 'fade'
          }}
          modalContentContainerStyle={styles.modalContainer}
          itemSeparator={true}
          itemSeparatorStyle={styles.separator}
          selectedItemContainerStyle={styles.selectedItemContainer}
          selectedItemLabelStyle={styles.selectedItemLabel}
          textStyle={styles.dropdownText}
          labelStyle={styles.label}
        />
        {!idCategory && <ErrorText msg="Necesita seleccionar una Categoria" />}

        <Text style={styles.subtitle}>Subcategoría</Text>
        <DropDownPicker
          open={open2}
          value={subcategoryId}
          items={subcategories}
          setOpen={setOpen2}
          setValue={setSubcategoryId}
          setItems={setSubcategories}
          maxHeight={ITEM_HEIGHT * subcategories.length}
          placeholder="Selecione una subcategoría"
          placeholderStyle={styles.placeholder}
          zIndex={2000}
          zIndexInverse={2000}
          loading={loading}
          style={[styles.dropdown, { marginBottom: 0 }]}
          dropDownContainerStyle={styles.dropdownContainer}
          listMode="MODAL"
          modalProps={{
            animationType: 'fade'
          }}
          modalContentContainerStyle={styles.modalContainer}
          itemSeparator={true}
          itemSeparatorStyle={styles.separator}
          selectedItemContainerStyle={styles.selectedItemContainer}
          selectedItemLabelStyle={styles.selectedItemLabel}
          textStyle={styles.dropdownText}
          labelStyle={styles.label}
        />
        {!subcategoryId && <ErrorText msg="Necesita seleccionar una subcategoria" />}
      </View>
    );
  }
);

SelectJoinCategory.displayName = 'SelectJoinCategory';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 0,
    paddingBottom: 0,
    zIndex: 3000, // Asegura que el contenedor esté por encima de otros elementos
    // backgroundColor: 'gray',
    padding: 0
  },
  subtitle: {
    fontWeight: '600',
    color: '#333'
  },
  dropdown: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50,
    margin: 0,
    padding: 0
  },
  dropdownContainer: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    // marginTop: 5,
    margin: 0,
    padding: 0
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    marginHorizontal: 2
  },
  separator: {
    backgroundColor: COLOR_SEPARATOR_DROPDOWN,
    paddingVertical: 5
  },
  selectedItemContainer: {
    backgroundColor: '#F0AEBB'
  },
  selectedItemLabel: {
    fontWeight: 'bold',
    color: '#333'
  },
  dropdownText: {
    fontSize: MEGA_BIG,
    color: COLOR_TEXT_DROPDOWN
  },
  label: {
    fontSize: MEGA_BIG,
    color: COLOR_TEXT_DROPDOWN
  },
  placeholder: {
    color: 'grey',
    fontSize: 16
  }
});
export default SelectJoinCategory;
