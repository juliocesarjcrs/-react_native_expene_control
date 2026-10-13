import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  SetStateAction
} from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';

// Services
import { getAllSubcategoriesExpensesByMonth } from '~/services/categories';

// Components
import ErrorText from '../ErrorText';
import MyLoading from '../loading/MyLoading';

// Types
import { RootState } from '~/shared/types/reducers';
import {
  CategoryFormat,
  CategorySelection,
  SubcategorySelection
} from '~/shared/types/components/dropDown/SelectJoinCategory.type';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEGA_BIG } from '~/styles/fonts';

interface SelectJoinCategoryProps {
  fetchExpensesSubcategory: (data: SubcategorySelection) => void;
  fetchExpensesOnlyCategory: (data: CategorySelection) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export type SelectJoinCategoryHandle = {
  resetSubcategory: () => void;
};

type SubcategoryFormatInt = {
  label: string;
  value: number;
};

type RawCategory = Awaited<
  ReturnType<typeof getAllSubcategoriesExpensesByMonth>
>['data']['data'][number];

const ITEM_HEIGHT = 42;

// DropDownPicker llama a setValue con un valor o con una función (prev) => valor
const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === 'function' ? (next as (prevState: T) => T)(prev) : next;

// Definido fuera del componente para que sea una referencia estable
const LoadingIndicator = () => <MyLoading />;

const SelectJoinCategory = forwardRef<SelectJoinCategoryHandle, SelectJoinCategoryProps>(
  ({ fetchExpensesSubcategory, fetchExpensesOnlyCategory, containerStyle }, ref) => {
    const colors = useThemeColors();
    const month = useSelector((state: RootState) => state.date.month);

    const [rawCategories, setRawCategories] = useState<RawCategory[]>([]);
    const [idCategory, setIdCategory] = useState<null | number>(null);
    const [subcategoryId, setSubcategoryId] = useState<null | number>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [open2, setOpen2] = useState(false);

    // Siempre apunta al callback más reciente del padre, sin re-disparar la carga
    const onCategoryRef = useRef(fetchExpensesOnlyCategory);
    useEffect(() => {
      onCategoryRef.current = fetchExpensesOnlyCategory;
    }, [fetchExpensesOnlyCategory]);

    useImperativeHandle(ref, () => ({
      resetSubcategory() {
        setSubcategoryId(null);
      }
    }));

    // Carga de categorías (al montar y cuando cambia el mes)
    useEffect(() => {
      let isMounted = true;

      const fetchCategories = async () => {
        try {
          const { data } = await getAllSubcategoriesExpensesByMonth(month);
          if (!isMounted) return;

          const withSubcategories = data.data.filter((f) => f.subcategories.length > 0);
          setRawCategories(withSubcategories);
          setSubcategoryId(null);

          // Selecciona la primera categoría por defecto y avisa al padre
          const first = withSubcategories[0];
          setIdCategory(first ? first.id : null);
          if (first) onCategoryRef.current({ id: first.id, label: first.name });
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
    }, [month]);

    // Items del picker de categorías (dependen del tema por el color del ícono)
    const categories = useMemo<CategoryFormat[]>(
      () =>
        rawCategories.map((e) => ({
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
        })),
      [rawCategories, colors.PRIMARY]
    );

    // Subcategorías derivadas de la categoría seleccionada
    const subcategories = useMemo<SubcategoryFormatInt[]>(() => {
      const selected = rawCategories.find((c) => c.id === idCategory);
      return selected ? selected.subcategories.map((e) => ({ label: e.name, value: e.id })) : [];
    }, [rawCategories, idCategory]);

    const handleCategoryChange = (next: number | null) => {
      setIdCategory(next);
      setSubcategoryId(null);

      const found = rawCategories.find((c) => c.id === next);
      if (found) {
        fetchExpensesOnlyCategory({ id: next, label: found.name });
      }
    };

    const handleSubcategoryChange = (next: number | null) => {
      setSubcategoryId(next);

      if (next === null || idCategory === null) return;

      const foundSubcategory = subcategories.find((e) => e.value === next);
      const foundCategory = rawCategories.find((c) => c.id === idCategory);

      if (foundSubcategory && foundCategory) {
        fetchExpensesSubcategory({
          label: foundSubcategory.label,
          value: foundSubcategory.value,
          categoryId: idCategory,
          categoryName: foundCategory.name
        });
      }
    };

    // Props de estilo compartidas por ambos pickers
    const sharedPickerProps = {
      placeholderStyle: [styles.placeholder, { color: colors.GRAY }],
      loading,
      style: [
        styles.dropdown,
        { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
      ],
      dropDownContainerStyle: [
        styles.dropdownContainer,
        { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
      ],
      listMode: 'MODAL' as const,
      modalProps: { animationType: 'fade' as const },
      modalContentContainerStyle: [
        styles.modalContainer,
        { backgroundColor: colors.CARD_BACKGROUND }
      ],
      itemSeparator: true,
      itemSeparatorStyle: [styles.separator, { backgroundColor: colors.BORDER }],
      selectedItemContainerStyle: [
        styles.selectedItemContainer,
        { backgroundColor: colors.PRIMARY }
      ],
      selectedItemLabelStyle: [styles.selectedItemLabel, { color: colors.WHITE }],
      textStyle: [styles.dropdownText, { color: colors.TEXT_PRIMARY }],
      labelStyle: [styles.label, { color: colors.TEXT_PRIMARY }]
    };

    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={[styles.subtitle, { color: colors.TEXT_PRIMARY }]}>Categoría</Text>
        <DropDownPicker
          {...sharedPickerProps}
          open={open}
          value={idCategory}
          items={categories}
          setOpen={setOpen}
          setValue={(next) => handleCategoryChange(resolve(next, idCategory))}
          maxHeight={ITEM_HEIGHT * categories.length}
          placeholder="Selecione una categoría"
          zIndex={3000}
          zIndexInverse={1000}
          ActivityIndicatorComponent={LoadingIndicator}
          activityIndicatorColor="red"
          activityIndicatorSize={30}
        />
        {!idCategory && <ErrorText msg="Necesita seleccionar una Categoria" />}

        <Text style={[styles.subtitle, { color: colors.TEXT_PRIMARY }]}>Subcategoría</Text>
        <DropDownPicker
          {...sharedPickerProps}
          style={[
            styles.dropdown,
            styles.dropdownNoMargin,
            { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
          ]}
          open={open2}
          value={subcategoryId}
          items={subcategories}
          setOpen={setOpen2}
          setValue={(next) => handleSubcategoryChange(resolve(next, subcategoryId))}
          maxHeight={ITEM_HEIGHT * subcategories.length}
          placeholder="Selecione una subcategoría"
          zIndex={2000}
          zIndexInverse={2000}
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
  dropdownNoMargin: {
    marginBottom: 0
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
