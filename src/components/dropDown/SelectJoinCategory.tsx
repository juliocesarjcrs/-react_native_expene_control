import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useSelector } from 'react-redux';

// Services
import { getAllSubcategoriesExpensesByMonth } from '~/services/categories';

// Utils
import ErrorText from '../ErrorText';

// Components
import MyLoading from '../loading/MyLoading';

// Types
import { RootState } from '~/shared/types/reducers';
import {
  CategoryFormat,
  CategorySelection,
  SubcategoryFormat,
  SubcategorySelection
} from '~/shared/types/components/dropDown/SelectJoinCategory.type';

// Styles
import { MEGA_BIG } from '~/styles/fonts';
import { Icon } from 'react-native-elements';
import { showError } from '~/utils/showError';
import { useThemeColors } from '~/customHooks/useThemeColors';

interface SelectJoinCategoryProps {
  fetchExpensesSubcategory: (data: SubcategorySelection) => void;
  fetchExpensesOnlyCategory: (data: CategorySelection) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

type SubcategoryFormatInt = {
  label: string;
  value: number;
};

const SelectJoinCategory = forwardRef(
  (
    {
      fetchExpensesSubcategory,
      fetchExpensesOnlyCategory,
      containerStyle
    }: SelectJoinCategoryProps,
    ref
  ) => {
    const colors = useThemeColors();
    const month = useSelector((state: RootState) => state.date.month);
    const [categories, setCategories] = useState<CategoryFormat[]>([]);
    const [subcategories, setSubcategories] = useState<SubcategoryFormatInt[]>([]);
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
            icon: () => (
              <Icon
                name={e.icon ? e.icon : 'question'}
                type="font-awesome"
                size={35}
                color={colors.PRIMARY}
              />
            )
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
      if (index && idCategory) {
        const foundSubcategory = subcategories.find((e) => e.value === index);
        const foundCategory = categories.find((c) => c.value === idCategory);

        if (foundSubcategory && foundCategory) {
          // ✅ CORREGIDO: Enviar objeto completo con categoryId y categoryName
          const dataToSend: SubcategorySelection = {
            label: foundSubcategory.label,
            value: foundSubcategory.value,
            categoryId: idCategory,
            categoryName: foundCategory.label
          };
          fetchExpensesSubcategory(dataToSend);
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
        const newData: CategorySelection = {
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
        <Text style={[styles.subtitle, { color: colors.TEXT_PRIMARY }]}>Categoría</Text>
        <DropDownPicker
          open={open}
          value={idCategory}
          items={categories}
          setOpen={setOpen}
          setValue={setIdCategory}
          setItems={setCategories}
          maxHeight={ITEM_HEIGHT * categories.length}
          placeholder="Selecione una categoría"
          placeholderStyle={[styles.placeholder, { color: colors.GRAY }]}
          zIndex={3000}
          zIndexInverse={1000}
          loading={loading}
          ActivityIndicatorComponent={() => <MyLoading />}
          activityIndicatorColor="red"
          activityIndicatorSize={30}
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          listMode="MODAL"
          modalProps={{
            animationType: 'fade'
          }}
          modalContentContainerStyle={[
            styles.modalContainer,
            {
              backgroundColor: colors.CARD_BACKGROUND
            }
          ]}
          itemSeparator={true}
          itemSeparatorStyle={[styles.separator, { backgroundColor: colors.BORDER }]}
          selectedItemContainerStyle={[
            styles.selectedItemContainer,
            {
              backgroundColor: colors.PRIMARY
            }
          ]}
          selectedItemLabelStyle={[styles.selectedItemLabel, { color: colors.WHITE }]}
          textStyle={[styles.dropdownText, { color: colors.TEXT_PRIMARY }]}
          labelStyle={[styles.label, { color: colors.TEXT_PRIMARY }]}
        />
        {!idCategory && <ErrorText msg="Necesita seleccionar una Categoria" />}

        <Text style={[styles.subtitle, { color: colors.TEXT_PRIMARY }]}>Subcategoría</Text>
        <DropDownPicker
          open={open2}
          value={subcategoryId}
          items={subcategories}
          setOpen={setOpen2}
          setValue={setSubcategoryId}
          setItems={setSubcategories}
          maxHeight={ITEM_HEIGHT * subcategories.length}
          placeholder="Selecione una subcategoría"
          placeholderStyle={[styles.placeholder, { color: colors.GRAY }]}
          zIndex={2000}
          zIndexInverse={2000}
          loading={loading}
          style={[
            styles.dropdown,
            {
              marginBottom: 0,
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          listMode="MODAL"
          modalProps={{
            animationType: 'fade'
          }}
          modalContentContainerStyle={[
            styles.modalContainer,
            {
              backgroundColor: colors.CARD_BACKGROUND
            }
          ]}
          itemSeparator={true}
          itemSeparatorStyle={[styles.separator, { backgroundColor: colors.BORDER }]}
          selectedItemContainerStyle={[
            styles.selectedItemContainer,
            {
              backgroundColor: colors.PRIMARY
            }
          ]}
          selectedItemLabelStyle={[styles.selectedItemLabel, { color: colors.WHITE }]}
          textStyle={[styles.dropdownText, { color: colors.TEXT_PRIMARY }]}
          labelStyle={[styles.label, { color: colors.TEXT_PRIMARY }]}
        />
        <View style={styles.errorContainer}>
          {!subcategoryId && <ErrorText msg="Necesita seleccionar una subcategoria" />}
        </View>
      </View>
    );
  }
);

SelectJoinCategory.displayName = 'SelectJoinCategory';

const styles = StyleSheet.create({
  container: {
    flex: 0,
    marginBottom: 0,
    paddingBottom: 0,
    zIndex: 3000,
    padding: 0
  },
  errorContainer: {
    minHeight: 25,
    justifyContent: 'center'
  },
  subtitle: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50,
    margin: 0,
    padding: 0
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 8,
    margin: 0,
    padding: 0
  },
  modalContainer: {
    borderRadius: 12,
    padding: 2,
    marginHorizontal: 2
  },
  separator: {
    paddingVertical: 5
  },
  selectedItemContainer: {
    borderRadius: 8
  },
  selectedItemLabel: {
    fontWeight: 'bold'
  },
  dropdownText: {
    fontSize: MEGA_BIG
  },
  label: {
    fontSize: MEGA_BIG
  },
  placeholder: {
    fontSize: 16
  }
});

export default SelectJoinCategory;
