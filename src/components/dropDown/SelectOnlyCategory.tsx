import React, { useEffect, useState, forwardRef, useImperativeHandle, Ref } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

// Utils
import { Errors } from '../../utils/Errors';
import ErrorText from '../ErrorText';

// Services
import { getCategories } from '../../services/categories';

// Components
import MyLoading from '../loading/MyLoading';

// TYpes
import { CateroryFormat, DropDownSelectFormat } from '../../shared/types/components';
import { Icon } from 'react-native-elements';
import { COLOR_SEPARATOR_DROPDOWN, COLOR_TEXT_DROPDOWN, ICON_DROPDOWN } from '../../styles/colors';

interface SelectOnlyCategoryProps {
  handleCategoryChange: (data: DropDownSelectFormat) => void;
  searchType: number;
  selectedCategoryId?: number | null;
}
const SelectOnlyCategory = forwardRef(
  ({ handleCategoryChange, searchType, selectedCategoryId }: SelectOnlyCategoryProps, ref: Ref<any>) => {
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
            icon: () => <Icon type="font-awesome" name={e.icon ? e.icon : 'home'} size={35} color={ICON_DROPDOWN} />
          };
        });
        setCategoriesFormat(dataFormat);
        defaultIdCategory(dataFormat);
      } catch (error) {
        setLoading(false);
        Errors(error);
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
          zIndex={2000}
          zIndexInverse={1000}
          loading={loading}
          ActivityIndicatorComponent={({ color, size }) => <MyLoading />}
          activityIndicatorColor="red"
          activityIndicatorSize={30}
          dropDownContainerStyle={{
            backgroundColor: '#dfdfdf'
          }}
          listMode="MODAL"
          // styles modal
          itemSeparator={true}
          itemSeparatorStyle={{
            backgroundColor: COLOR_SEPARATOR_DROPDOWN,
            paddingVertical: 5
          }}
          selectedItemContainerStyle={{
            backgroundColor: '#F0AEBB'
          }}
          selectedItemLabelStyle={{
            fontWeight: 'bold'
          }}
          // como se ve el select
          textStyle={{
            fontSize: 18,
            color: COLOR_TEXT_DROPDOWN
          }}
        />
        {!idCategory ? <ErrorText msg="Necesita seleccionar una  Categoria" /> : null}
      </View>
    );
  }
);
const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // backgroundColor: 'red'
  }
});

export default SelectOnlyCategory;
