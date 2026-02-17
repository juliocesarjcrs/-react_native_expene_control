import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import DropDownPicker from 'react-native-dropdown-picker';
import { ExpenseItemProps } from '~/shared/types/components/modal/MultiExpenseModal.type';
import { categorizeExpense } from '~/utils';

const ExpenseItem: React.FC<ExpenseItemProps> = ({
  item,
  index,
  categories,
  onRemove,
  onUpdate
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);
  const [initialDescriptionProcessed, setInitialDescriptionProcessed] = useState(false);

  useEffect(() => {
    if (item.description && !initialDescriptionProcessed && !item.categoryId) {
      const { categoryId, subcategoryId } = categorizeExpense(item.description, categories);

      if (categoryId) {
        onUpdate(index, 'categoryId', categoryId);
      }
      if (subcategoryId) {
        onUpdate(index, 'subcategoryId', subcategoryId);
      }

      setInitialDescriptionProcessed(true);
    }
  }, [item.description, item.categoryId, categories, index, onUpdate, initialDescriptionProcessed]);

  useEffect(() => {
    if (item.categoryId && item.subcategoryId) {
      const currentCategory = categories.find((c) => c.value === item.categoryId);
      const isValidSubcategory = currentCategory?.subcategories?.some(
        (s) => s.value === item.subcategoryId
      );
      if (!isValidSubcategory) {
        onUpdate(index, 'subcategoryId', null);
      }
    }
  }, [item.categoryId, item.subcategoryId, categories, index, onUpdate]);

  const transformedCategories = useMemo(() => {
    return categories.map((cat) => ({
      label: cat.label,
      value: cat.value,
      icon: cat.icon,
      ...(cat.subcategories
        ? {
            subcategories: cat.subcategories.map((sub) => ({
              label: sub.label,
              value: sub.value
            }))
          }
        : {})
    }));
  }, [categories]);

  const subcategories = useMemo(() => {
    if (!item.categoryId) return [];
    const category = categories.find((c) => c.value === item.categoryId);
    return category?.subcategories || [];
  }, [item.categoryId, categories]);

  const handleSubcategoryChange = useCallback(
    (value: number | null) => {
      onUpdate(index, 'subcategoryId', value);
    },
    [index, onUpdate]
  );

  const handleCategoryToggle = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      const open = typeof value === 'function' ? value(isCategoryOpen) : value;
      if (open === isCategoryOpen) return;
      setIsCategoryOpen(open);
      if (open) setIsSubcategoryOpen(false);
    },
    [isCategoryOpen]
  );

  const handleSubcategoryToggle = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      const open = typeof value === 'function' ? value(isSubcategoryOpen) : value;
      if (open === isSubcategoryOpen) return;
      setIsSubcategoryOpen(open);
      if (open) setIsCategoryOpen(false);
    },
    [isSubcategoryOpen]
  );

  const handleDescriptionChange = useCallback(
    (text: string) => {
      onUpdate(index, 'description', text);
    },
    [index, onUpdate]
  );

  return (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseNumber}>Gasto #{index + 1}</Text>
        <TouchableOpacity onPress={() => onRemove(index)}>
          <Icon name="trash" type="font-awesome" color="#d11a2a" />
        </TouchableOpacity>
      </View>

      {/* Campo descripción: multiline para que el texto no quede cortado */}
      <TextInput
        style={styles.descriptionInput}
        placeholder="Descripción *"
        value={item.description || ''}
        onChangeText={handleDescriptionChange}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        scrollEnabled={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Monto *"
        keyboardType="numeric"
        value={item.cost > 0 ? item.cost.toString() : ''}
        onChangeText={(text) => {
          const cost = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
          onUpdate(index, 'cost', cost);
        }}
      />

      <DropDownPicker
        open={isCategoryOpen}
        value={item.categoryId}
        items={transformedCategories}
        setOpen={handleCategoryToggle}
        setValue={(valOrFn) => {
          const value = typeof valOrFn === 'function' ? valOrFn(item.categoryId) : valOrFn;
          onUpdate(index, 'categoryId', value);
        }}
        setItems={() => {}}
        placeholder="Selecciona categoría *"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        zIndex={3000 - index * 2}
        listMode="MODAL"
        modalProps={{
          animationType: 'fade'
        }}
      />

      {item.categoryId && (
        <DropDownPicker
          open={isSubcategoryOpen && item.categoryId !== null}
          value={item.subcategoryId}
          items={subcategories}
          setOpen={handleSubcategoryToggle}
          setValue={(valOrFn) => {
            const value = typeof valOrFn === 'function' ? valOrFn(item.subcategoryId) : valOrFn;
            onUpdate(index, 'subcategoryId', value);
          }}
          onChangeValue={(value) => {
            handleSubcategoryChange(value);
          }}
          setItems={() => {}}
          placeholder="Selecciona subcategoría *"
          disabled={!item.categoryId}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={3000 - index * 2 - 1}
          listMode="MODAL"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  expenseItem: {
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  expenseNumber: {
    fontWeight: '600',
    color: '#555'
  },
  // Input base: para monto y futuros campos de una línea
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  // Input de descripción: más alto, multiline, texto visible completo
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    minHeight: 56, // Mínimo 2 líneas visibles
    maxHeight: 100, // Evita que crezca demasiado en textos muy largos
    textAlignVertical: 'top',
    lineHeight: 20,
    fontSize: 14
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff'
  }
});

export default React.memo(ExpenseItem);
