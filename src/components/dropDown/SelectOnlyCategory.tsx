import React, { useEffect, useState, forwardRef, useImperativeHandle, Ref } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

// Utils
import { showError } from '~/utils/showError';
import ErrorText from '../ErrorText';

// Services
import { getCategories } from '../../services/categories';

// Components
import MyLoading from '../loading/MyLoading';

// TYpes
import { CateroryFormat, DropDownSelectFormat } from '../../shared/types/components';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEGA_BIG } from '~/styles/fonts';
interface SelectOnlyCategoryProps {
  handleCategoryChange: (data: DropDownSelectFormat) => void;
  searchType: number;
  selectedCategoryId?: number | null;
}
const SelectOnlyCategory = forwardRef(
  (
    { handleCategoryChange, searchType, selectedCategoryId }: SelectOnlyCategoryProps,
    ref: Ref<any>
  ) => {
    const colors = useThemeColors();
    const [categoriesFormat, setCategoriesFormat] = useState<CateroryFormat[]>([]);
    const [loading, setLoading] = useState(false);
    const ITEM_HEIGHT = 42;
    const [open, setOpen] = useState(false);
    const [idCategory, setIdCategory] = useState<null | number>(null);

    useImperativeHandle(ref, () => ({}));

    useEffect(() => {
      fetchCategories();
    }, [searchType]);
    useEffect(() => {
      sendFromDropDownPickerCategory(idCategory);
    }, [idCategory]);

    const sendFromDropDownPickerCategory = (index: null | number) => {
      const indexArray = categoriesFormat.findIndex((e) => {
        return e.value === index;
      });
      if (index && indexArray >= 0) {
        const newData: DropDownSelectFormat = {
          id: index,
          label: categoriesFormat[indexArray].label,
          iconName: categoriesFormat[indexArray].iconName
        };
        handleCategoryChange(newData);
      }
    };

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const params = {
          type: searchType
        };
        const { data } = await getCategories(params);
        setLoading(false);
        const dataFormat: CateroryFormat[] = data.map((e) => {
          return {
            label: e.name,
            value: e.id,
            iconName: e.icon,
            //bsubcategories: e.subcategories,
            icon: () => (
              <Icon
                type="font-awesome"
                name={e.icon ? e.icon : 'home'}
                size={35}
                color={colors.PRIMARY}
              />
            )
          };
        });
        setCategoriesFormat(dataFormat);
        defaultIdCategory(dataFormat);
      } catch (error) {
        setLoading(false);
        showError(error);
      }
    };

    const defaultIdCategory = (categoriesFormat: CateroryFormat[]) => {
      if (categoriesFormat.length > 0) {
        if (selectedCategoryId !== undefined && selectedCategoryId !== null) {
          setIdCategory(selectedCategoryId);
        } else {
          setIdCategory(categoriesFormat[0].value);
        }
      }
    };

    return (
      <View style={styles.container}>
        <Text>Categoría</Text>
        <DropDownPicker
          open={open}
          value={idCategory}
          items={categoriesFormat}
          setOpen={setOpen}
          setValue={setIdCategory}
          setItems={setCategoriesFormat}
          maxHeight={ITEM_HEIGHT * categoriesFormat.length}
          placeholder="Selecione una categoría"
          placeholderStyle={[styles.placeholder, { color: colors.GRAY }]}
          zIndex={2000}
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
        {!idCategory ? <ErrorText msg="Necesita seleccionar una  Categoria" /> : null}
      </View>
    );
  }
);
SelectOnlyCategory.displayName = 'SelectOnlyCategory';
const styles = StyleSheet.create({
  container: {
    flex: 0,
    marginBottom: 0,
    paddingBottom: 0,
    zIndex: 3000, // Asegura que el contenedor esté por encima de otros elementos
    padding: 0
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

export default SelectOnlyCategory;
