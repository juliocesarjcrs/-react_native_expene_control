import React, { forwardRef, useEffect, useMemo, useRef, useState, SetStateAction } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Icon } from 'react-native-elements';

// Utils
import { showError } from '~/utils/showError';
import ErrorText from '../ErrorText';

// Services
import { getCategories } from '../../services/categories';

// Components
import MyLoading from '../loading/MyLoading';

// Types
import { CateroryFormat, DropDownSelectFormat } from '../../shared/types/components';

// Theme & Styles
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEGA_BIG } from '~/styles/fonts';

interface SelectOnlyCategoryProps {
  handleCategoryChange: (data: DropDownSelectFormat) => void;
  searchType: number;
  selectedCategoryId?: number | null;
}

// El componente no expone métodos por ref; se mantiene el tipo por compatibilidad
export type SelectOnlyCategoryHandle = Record<string, never>;

type RawCategory = Awaited<ReturnType<typeof getCategories>>['data'][number];

const ITEM_HEIGHT = 42;

// DropDownPicker llama a setValue con un valor o con una función (prev) => valor
const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === 'function' ? (next as (prevState: T) => T)(prev) : next;

// Definido fuera del componente para que sea una referencia estable
const LoadingIndicator = () => <MyLoading />;

const SelectOnlyCategory = forwardRef<SelectOnlyCategoryHandle, SelectOnlyCategoryProps>(
  ({ handleCategoryChange, searchType, selectedCategoryId }, _ref) => {
    const colors = useThemeColors();

    const [rawCategories, setRawCategories] = useState<RawCategory[]>([]);
    const [idCategory, setIdCategory] = useState<null | number>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [prevSelectedId, setPrevSelectedId] = useState(selectedCategoryId);

    // Siempre apunta al callback más reciente del padre, sin re-disparar la carga
    const onChangeRef = useRef(handleCategoryChange);
    useEffect(() => {
      onChangeRef.current = handleCategoryChange;
    }, [handleCategoryChange]);

    // Si el padre cambia la categoría seleccionada, se refleja aquí (durante el render)
    if (selectedCategoryId !== prevSelectedId) {
      setPrevSelectedId(selectedCategoryId);
      if (selectedCategoryId !== undefined && selectedCategoryId !== null) {
        setIdCategory(selectedCategoryId);
      }
    }

    // Carga de categorías (al montar y cuando cambia el tipo)
    useEffect(() => {
      let isMounted = true;

      const fetchCategories = async () => {
        try {
          const { data } = await getCategories({ type: searchType });
          if (!isMounted) return;

          setRawCategories(data);

          // Categoría por defecto: la indicada por el padre o la primera
          const defaultCategory = data.find((c) => c.id === selectedCategoryId) ?? data[0] ?? null;

          setIdCategory(defaultCategory ? defaultCategory.id : null);
          if (defaultCategory) {
            onChangeRef.current({
              id: defaultCategory.id,
              label: defaultCategory.name,
              iconName: defaultCategory.icon
            });
          }
        } catch (error) {
          if (isMounted) showError(error);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchCategories();

      return () => {
        isMounted = false;
      };
      // selectedCategoryId solo define el valor inicial; los cambios posteriores
      // se sincronizan durante el render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchType]);

    // Items del picker (dependen del tema por el color del ícono)
    const categoriesFormat = useMemo<CateroryFormat[]>(
      () =>
        rawCategories.map((e) => ({
          label: e.name,
          value: e.id,
          iconName: e.icon,
          icon: () => (
            <Icon
              type="font-awesome"
              name={e.icon ? e.icon : 'home'}
              size={35}
              color={colors.PRIMARY}
            />
          )
        })),
      [rawCategories, colors.PRIMARY]
    );

    const handleChange = (next: number | null) => {
      setIdCategory(next);

      const found = rawCategories.find((c) => c.id === next);
      if (next !== null && found) {
        handleCategoryChange({ id: next, label: found.name, iconName: found.icon });
      }
    };

    return (
      <View style={styles.container}>
        <Text style={{ color: colors.TEXT_PRIMARY }}>Categoría</Text>
        <DropDownPicker
          open={open}
          value={idCategory}
          items={categoriesFormat}
          setOpen={setOpen}
          setValue={(next) => handleChange(resolve(next, idCategory))}
          maxHeight={ITEM_HEIGHT * categoriesFormat.length}
          placeholder="Selecione una categoría"
          placeholderStyle={[styles.placeholder, { color: colors.GRAY }]}
          zIndex={2000}
          zIndexInverse={1000}
          loading={loading}
          ActivityIndicatorComponent={LoadingIndicator}
          activityIndicatorColor="red"
          activityIndicatorSize={30}
          style={[
            styles.dropdown,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
          listMode="MODAL"
          modalProps={{ animationType: 'fade' }}
          modalContentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.CARD_BACKGROUND }
          ]}
          itemSeparator
          itemSeparatorStyle={[styles.separator, { backgroundColor: colors.BORDER }]}
          selectedItemContainerStyle={[
            styles.selectedItemContainer,
            { backgroundColor: colors.PRIMARY }
          ]}
          selectedItemLabelStyle={[styles.selectedItemLabel, { color: colors.WHITE }]}
          textStyle={[styles.dropdownText, { color: colors.TEXT_PRIMARY }]}
          labelStyle={[styles.label, { color: colors.TEXT_PRIMARY }]}
        />
        {idCategory === null ? <ErrorText msg="Necesita seleccionar una  Categoria" /> : null}
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
    zIndex: 3000,
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
