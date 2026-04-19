import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
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
import {
  CategoryFormat,
  SubcategoryFormat
} from '~/shared/types/components/dropDown/SelectJoinCategory.type';

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

// ─── Tipo interno (igual al de SelectJoinCategory) ────────────────────────────

type SubcategoryFormatInt = {
  label: string;
  value: number;
};

// ─── Componente ───────────────────────────────────────────────────────────────

const SelectMultiSubcategory = forwardRef<
  SelectMultiSubcategoryHandle,
  SelectMultiSubcategoryProps
>(({ onSelectionChange, containerStyle }, ref) => {
  const colors = useThemeColors();
  const month = useSelector((state: RootState) => state.date.month);

  const ITEM_HEIGHT = 42;

  // Estado del dropdown de categoría
  const [openCategory, setOpenCategory] = useState(false);
  const [categories, setCategories] = useState<CategoryFormat[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Subcategorías de la categoría activa
  const [availableSubcategories, setAvailableSubcategories] = useState<SubcategoryFormatInt[]>([]);

  // Selección múltiple: Set de IDs marcados
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);

  // ── Refs para evitar stale closures en callbacks asincrónicos ───────────────
  // Mantienen siempre el valor más reciente sin causar re-renders extra
  const categoryIdRef = useRef<number | null>(null);
  const categoryNameRef = useRef<string>('');
  const availableSubcategoriesRef = useRef<SubcategoryFormatInt[]>([]);

  // Sincronizar refs con el estado en cada render
  categoryIdRef.current = selectedCategoryId;
  availableSubcategoriesRef.current = availableSubcategories;

  // ── Imperativo ──────────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    reset() {
      setSelectedCategoryId(null);
      categoryNameRef.current = '';
      setAvailableSubcategories([]);
      setSelectedIds(new Set());
      onSelectionChange(null);
    }
  }));

  // ── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    void fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await getAllSubcategoriesExpensesByMonth(month);
      const filtered = data.data.filter((f) => f.subcategories.length > 0);
      const formatted: CategoryFormat[] = filtered.map((e) => ({
        label: e.name,
        value: e.id,
        subcategories: e.subcategories,
        icon: () => (
          <Icon name={e.icon ?? 'question'} type="font-awesome" size={35} color={colors.PRIMARY} />
        )
      }));
      setCategories(formatted);

      // Seleccionar primera categoría por defecto directamente,
      // sin pasar por el useEffect para evitar la doble ejecución
      if (formatted.length > 0) {
        const first = formatted[0];
        const subs = formatSubcategories(first.subcategories);
        categoryNameRef.current = first.label;
        setSelectedCategoryId(first.value);
        setAvailableSubcategories(subs);
        setSelectedIds(new Set());
        onSelectionChange(null);
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const formatSubcategories = (data: SubcategoryFormat[]): SubcategoryFormatInt[] =>
    data.map((e) => ({ label: e.name, value: e.id }));

  // ── Cambio de categoría desde el DropDownPicker ──────────────────────────────
  // Solo se dispara cuando el usuario cambia manualmente la categoría,
  // NO en la carga inicial (categories está vacío en ese momento)
  useEffect(() => {
    if (selectedCategoryId === null || categories.length === 0) return;

    const found = categories.find((c) => c.value === selectedCategoryId);
    if (!found) return;

    const subs = formatSubcategories(found.subcategories);
    categoryNameRef.current = found.label;
    setAvailableSubcategories(subs);
    setSelectedIds(new Set());
    onSelectionChange(null);
  }, [selectedCategoryId]);

  // ── Lógica de selección múltiple ────────────────────────────────────────────
  const toggleSubcategory = (id: number) => {
    // Capturar los refs ANTES de entrar al updater para evitar stale closures.
    // Los refs siempre tienen el valor del render actual.
    const currentCategoryId = categoryIdRef.current;
    const currentCategoryName = categoryNameRef.current;
    const currentSubs = availableSubcategoriesRef.current;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      if (next.size === 0 || currentCategoryId === null) {
        onSelectionChange(null);
      } else {
        const selectedSubs = currentSubs
          .filter((s) => next.has(s.value))
          .map((s) => ({ value: s.value, label: s.label }));

        onSelectionChange({
          categoryId: currentCategoryId,
          categoryName: currentCategoryName,
          subcategories: selectedSubs
        });
      }

      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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
          setValue={setSelectedCategoryId}
          setItems={setCategories}
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
                  backgroundColor: checked
                    ? colors.PRIMARY + '18' // 10 % opacidad
                    : colors.CARD_BACKGROUND,
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
    maxHeight: 260 // ~6 items visibles
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
