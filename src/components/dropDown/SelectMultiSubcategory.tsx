import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  SetStateAction
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';

// Services
import { getAllSubcategoriesExpensesByMonth } from '~/services/categories';

// Components
import MyLoading from '../loading/MyLoading';
import ErrorText from '../ErrorText';

// Types
import { RootState } from '~/shared/types/reducers';
import { CategoryFormat } from '~/shared/types/components/dropDown/SelectJoinCategory.type';

// Theme & Styles
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEGA_BIG, SMALL } from '~/styles/fonts';
import { showError } from '~/utils/showError';

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface MultiSubcategoryItem {
  value: number;
  label: string;
}

export interface MultiSubcategorySelection {
  categoryId: number;
  categoryName: string;
  subcategories: MultiSubcategoryItem[];
}

interface SelectMultiSubcategoryProps {
  onSelectionChange: (data: MultiSubcategorySelection | null) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export interface SelectMultiSubcategoryHandle {
  reset: () => void;
}

// ─── Tipos internos y constantes ──────────────────────────────────────────────

type RawCategory = Awaited<
  ReturnType<typeof getAllSubcategoriesExpensesByMonth>
>['data']['data'][number];

const ITEM_HEIGHT = 42;

// DropDownPicker llama a setValue con un valor o con una función (prev) => valor
const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === 'function' ? (next as (prevState: T) => T)(prev) : next;

// ─── Componente ───────────────────────────────────────────────────────────────

const SelectMultiSubcategory = forwardRef<
  SelectMultiSubcategoryHandle,
  SelectMultiSubcategoryProps
>(({ onSelectionChange, containerStyle }, ref) => {
  const colors = useThemeColors();
  const month = useSelector((state: RootState) => state.date.month);

  const [openCategory, setOpenCategory] = useState(false);
  const [rawCategories, setRawCategories] = useState<RawCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Siempre apunta al callback más reciente del padre, sin re-disparar la carga
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        setSelectedCategoryId(null);
        setSelectedIds(new Set());
        onSelectionChange(null);
      }
    }),
    [onSelectionChange]
  );

  // Carga de categorías (al montar y cuando cambia el mes)
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const { data } = await getAllSubcategoriesExpensesByMonth(month);
        if (!isMounted) return;

        const withSubcategories = data.data.filter((f) => f.subcategories.length > 0);
        setRawCategories(withSubcategories);

        // Primera categoría por defecto, con la selección reiniciada
        setSelectedCategoryId(withSubcategories[0]?.id ?? null);
        setSelectedIds(new Set());
        onSelectionChangeRef.current(null);
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

  // Items del picker (dependen del tema por el color del ícono)
  const categories = useMemo<CategoryFormat[]>(
    () =>
      rawCategories.map((e) => ({
        label: e.name,
        value: e.id,
        subcategories: e.subcategories,
        icon: () => (
          <Icon name={e.icon ?? 'question'} type="font-awesome" size={35} color={colors.PRIMARY} />
        )
      })),
    [rawCategories, colors.PRIMARY]
  );

  // Todo lo siguiente se deriva de la categoría seleccionada
  const selectedCategory = rawCategories.find((c) => c.id === selectedCategoryId) ?? null;

  const availableSubcategories = useMemo<MultiSubcategoryItem[]>(
    () =>
      selectedCategory
        ? selectedCategory.subcategories.map((e) => ({ label: e.name, value: e.id }))
        : [],
    [selectedCategory]
  );

  const handleCategoryChange = (next: number | null) => {
    setSelectedCategoryId(next);
    setSelectedIds(new Set());
    onSelectionChange(null);
  };

  const toggleSubcategory = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);

    if (next.size === 0 || !selectedCategory) {
      onSelectionChange(null);
      return;
    }

    onSelectionChange({
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      subcategories: availableSubcategories.filter((s) => next.has(s.value))
    });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* ── Categoría ─────────────────────────────────────────────── */}
      <Text style={[styles.subtitle, { color: colors.TEXT_PRIMARY }]}>Categoría</Text>
      {loading ? (
        <MyLoading />
      ) : (
        <DropDownPicker
          open={openCategory}
          value={selectedCategoryId}
          items={categories}
          setOpen={setOpenCategory}
          setValue={(next) => handleCategoryChange(resolve(next, selectedCategoryId))}
          maxHeight={ITEM_HEIGHT * categories.length}
          placeholder="Seleccione una categoría"
          placeholderStyle={[styles.placeholder, { color: colors.GRAY }]}
          zIndex={3000}
          zIndexInverse={1000}
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
      )}

      {!selectedCategoryId && <ErrorText msg="Necesita seleccionar una categoría" />}

      {/* ── Subcategorías (lista con checkboxes) ──────────────────── */}
      <Text style={[styles.subtitle, { color: colors.TEXT_PRIMARY }]}>
        Subcategorías{' '}
        <Text style={[styles.hint, { color: colors.GRAY }]}>(seleccione una o más)</Text>
      </Text>

      {availableSubcategories.length === 0 && !loading && (
        <Text style={[styles.emptyText, { color: colors.GRAY }]}>
          No hay subcategorías disponibles
        </Text>
      )}

      <ScrollView
        style={styles.checkList}
        scrollEnabled={availableSubcategories.length > 5}
        nestedScrollEnabled
      >
        {availableSubcategories.map((sub) => {
          const checked = selectedIds.has(sub.value);
          return (
            <TouchableOpacity
              key={sub.value}
              style={[
                styles.checkRow,
                {
                  backgroundColor: checked ? colors.PRIMARY + '18' : colors.CARD_BACKGROUND,
                  borderColor: checked ? colors.PRIMARY : colors.BORDER
                }
              ]}
              onPress={() => toggleSubcategory(sub.value)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: checked ? colors.PRIMARY : colors.GRAY,
                    backgroundColor: checked ? colors.PRIMARY : 'transparent'
                  }
                ]}
              >
                {checked && (
                  <Icon name="check" type="font-awesome" size={10} color={colors.WHITE} />
                )}
              </View>
              <Text
                style={[
                  styles.checkLabel,
                  {
                    color: checked ? colors.PRIMARY : colors.TEXT_PRIMARY,
                    fontWeight: checked ? '600' : '400'
                  }
                ]}
              >
                {sub.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Resumen de selección */}
      {selectedIds.size > 0 && (
        <Text style={[styles.selectionSummary, { color: colors.PRIMARY }]}>
          {selectedIds.size === 1
            ? '1 subcategoría seleccionada'
            : `${selectedIds.size} subcategorías seleccionadas`}
        </Text>
      )}

      <View style={styles.errorContainer}>
        {selectedIds.size === 0 && availableSubcategories.length > 0 && (
          <ErrorText msg="Seleccione al menos una subcategoría" />
        )}
      </View>
    </View>
  );
});

SelectMultiSubcategory.displayName = 'SelectMultiSubcategory';

export default SelectMultiSubcategory;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 0,
    zIndex: 3000
  },
  errorContainer: {
    minHeight: 24,
    justifyContent: 'center'
  },
  subtitle: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    fontSize: SMALL + 2
  },
  hint: {
    fontWeight: '400',
    fontSize: SMALL
  },
  emptyText: {
    fontSize: SMALL,
    fontStyle: 'italic',
    marginBottom: 8
  },
  // DropDownPicker
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 8
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
  },
  // Lista de checkboxes
  checkList: {
    maxHeight: 260
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkLabel: {
    fontSize: MEGA_BIG,
    flex: 1
  },
  selectionSummary: {
    fontSize: SMALL,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'right'
  }
});
