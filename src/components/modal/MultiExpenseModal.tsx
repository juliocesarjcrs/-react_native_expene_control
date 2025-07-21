import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategoryWithSubcategories } from '~/services/categories';
import { Category } from '~/shared/types/services';
import ExpenseItem from './components/ExpenseItem';
import { CreateExpensePayload } from '~/shared/types/services/expense-service.type';
import {
  CategoryDropdown,
  ExpenseModal,
  MultiExpenseModalProps
} from '~/shared/types/components/modal/MultiExpenseModal.type';
import ProductsHeader from './components/ProductsHeader';
import { DateFormat, NumberFormat } from '~/utils/Helpers';

const CACHE_KEY = 'expense_categories_cache';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas

const MultiExpenseModal: React.FC<MultiExpenseModalProps> = ({
  imageUri,
  visible,
  onSave,
  onClose,
  initialExpenses = []
}) => {
  const [expenses, setExpenses] = useState<ExpenseModal[]>(initialExpenses);
  const [categories, setCategories] = useState<CategoryDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<number | null>(null);

  const handleBack = useCallback(() => {
    onClose(expenses); // Pasa los productos editados al cerrar
  }, [expenses, onClose]);
  // Calcula el total usando useMemo para optimización
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + (expense.cost || 0), 0);
  }, [expenses]);

  const transformCategories = useCallback((apiCategories: Category[]): CategoryDropdown[] => {
    return apiCategories.map((category) => ({
      label: category.name,
      value: category.id,
      icon: () => (category.icon ? <Icon name={category.icon} type="font-awesome" size={20} /> : <></>),
      subcategories: category.subcategories?.map((sub) => ({
        label: sub.name,
        value: sub.id,
        icon: () => <></>
      }))
    }));
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const [cachedData, cachedTime] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(`${CACHE_KEY}_time`)
      ]);

      if (cachedData && cachedTime && Date.now() - parseInt(cachedTime) < CACHE_EXPIRATION) {
        setCategories(transformCategories(JSON.parse(cachedData)));
        return;
      }

      const { data } = await getCategoryWithSubcategories();
      const transformed = transformCategories(data.data || []);

      setCategories(transformed);
      await AsyncStorage.multiSet([
        [CACHE_KEY, JSON.stringify(data.data)],
        [`${CACHE_KEY}_time`, Date.now().toString()]
      ]);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  }, [transformCategories]);

  useEffect(() => {
    if (visible) {
      setExpenses(initialExpenses.length > 0 ? [...initialExpenses] : [createNewExpense()]);
      loadCategories();
    }
  }, [visible, initialExpenses, loadCategories]);

  const createNewExpense = (): ExpenseModal => ({
    cost: 0,
    description: '',
    categoryId: null,
    subcategoryId: null,
    date: new Date()
  });

  const handleAddExpense = useCallback(() => {
    setExpenses((prev) => [...prev, createNewExpense()]);
  }, []);

  const handleRemoveExpense = useCallback((index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateExpenseField = useCallback(
    <K extends keyof ExpenseModal>(index: number, field: K, value: ExpenseModal[K]) => {
      setExpenses((prev) => prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)));
    },
    []
  );

  const validateExpenses = useCallback(() => {
    return expenses.every((exp) => exp.cost > 0 && exp.categoryId !== null && exp.subcategoryId !== null);
  }, [expenses]);

  const handleSave = useCallback(() => {
    if (!validateExpenses()) {
      Alert.alert('Validación', 'Complete todos los campos requeridos');
      return;
    }

    // Validación adicional para subcategoryId
    const isValid = expenses.every((exp) => exp.subcategoryId !== null);
    if (!isValid) {
      Alert.alert('Error', 'Todas las subcategorías deben estar seleccionadas');
      return;
    }

    onSave(transformToCreatePayload(expenses));
  }, [expenses, validateExpenses, onSave]);
  const transformToCreatePayload = (expenses: ExpenseModal[]): CreateExpensePayload[] => {
    return expenses.map((expense) => ({
      cost: expense.cost,
      date: DateFormat(new Date(), 'YYYY-MM-DD'),
      subcategoryId: expense.subcategoryId || 0,
      commentary: expense.description || ''
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ProductsHeader title="Registrar Gastos" count={expenses.length} onClose={handleBack} imageUri={imageUri} />
            <Text style={styles.total}>Total:{NumberFormat(totalAmount)}</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text>Cargando categorías...</Text>
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                  nestedScrollEnabled={true} // Importante para scroll anidado
                >
                  {expenses.length > 0 ? (
                    expenses.map((expense, index) => (
                      <ExpenseItem
                        key={`expense-${index}`}
                        item={expense}
                        index={index}
                        categories={categories}
                        onRemove={handleRemoveExpense}
                        onUpdate={updateExpenseField}
                        isDropdownOpen={isDropdownOpen}
                        setIsDropdownOpen={setIsDropdownOpen}
                      />
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No hay gastos para mostrar</Text>
                  )}
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
                    <Icon name="add" color="#fff" size={18} />
                    <Text style={styles.addButtonText}>Agregar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, !validateExpenses() && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={!validateExpenses()}
                  >
                    <Text style={styles.saveButtonText}>Guardar ({expenses.length})</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '90%',
    borderRadius: 10,
    padding: 5 // Reducir el padding
  },
  scrollContainer: {
    flexGrow: 1,
    maxHeight: '60%' // Limitar altura para dejar espacio a los botones
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row', // Botones en fila
    justifyContent: 'space-between', // Espacio entre botones
    alignItems: 'center'
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 8, // Reducir padding
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Ocupar espacio disponible
    marginRight: 5 // Espacio entre botones
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10, // Reducir padding
    borderRadius: 5,
    alignItems: 'center',
    flex: 1, // Ocupar espacio disponible
    marginLeft: 5 // Espacio entre botones
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  scrollContent: {
    paddingBottom: 20
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#6c757d'
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5
  },
  disabledButton: {
    backgroundColor: '#cccccc'
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  total: {
    paddingHorizontal: 10,
    paddingBottom: 2,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32'
  }
});

export default React.memo(MultiExpenseModal);
