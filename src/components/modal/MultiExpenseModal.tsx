import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Services
import { getCategoryWithSubcategories } from '~/services/categories';

// Components
import ExpenseItem from './components/ExpenseItem';
import ProductsHeader from './components/ProductsHeader';

// Types
import { CategoryExpense } from '~/shared/types/services';
import { CreateExpensePayload } from '~/shared/types/services/expense-service.type';
import {
  CategoryDropdown,
  ExpenseModal,
  MultiExpenseModalProps
} from '~/shared/types/components/modal/MultiExpenseModal.type';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

const CACHE_KEY = 'expense_categories_cache';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas
const OVERLAY_COLOR = 'rgba(0,0,0,0.5)';
const NO_EXPENSES: ExpenseModal[] = [];

// ── Funciones puras (a nivel de módulo) ──────────────────────────

const createNewExpense = (): ExpenseModal => ({
  cost: 0,
  description: '',
  categoryId: null,
  subcategoryId: null,
  date: new Date(),
  idempotencyKey: Crypto.randomUUID()
});

const buildInitialExpenses = (initial: ExpenseModal[]): ExpenseModal[] =>
  initial.length > 0
    ? initial.map((exp) => ({
        ...exp,
        idempotencyKey: exp.idempotencyKey ?? Crypto.randomUUID()
      }))
    : [createNewExpense()];

const transformCategories = (
  apiCategories: CategoryExpense[],
  iconColor: string
): CategoryDropdown[] =>
  apiCategories.map((category) => ({
    label: category.name,
    value: category.id,
    icon: () =>
      category.icon ? (
        <Icon name={category.icon} type="font-awesome" size={20} color={iconColor} />
      ) : (
        <></>
      ),
    subcategories: category.subcategories?.map((sub) => ({
      label: sub.name,
      value: sub.id,
      icon: () => <></>
    }))
  }));

const transformToCreatePayload = (expenses: ExpenseModal[]): CreateExpensePayload[] =>
  expenses.map((expense) => ({
    cost: expense.cost,
    date: DateFormat(new Date(), 'YYYY-MM-DD'),
    subcategoryId: expense.subcategoryId || 0,
    commentary: expense.description || '',
    idempotencyKey: expense.idempotencyKey,
    nature: 'operational'
  }));

// Lee las categorías desde la caché local o, si expiró, desde el servidor
const fetchCategoryTree = async (): Promise<CategoryExpense[]> => {
  const [cachedData, cachedTime] = await Promise.all([
    AsyncStorage.getItem(CACHE_KEY),
    AsyncStorage.getItem(`${CACHE_KEY}_time`)
  ]);

  if (cachedData && cachedTime && Date.now() - Number(cachedTime) < CACHE_EXPIRATION) {
    return JSON.parse(cachedData) as CategoryExpense[];
  }

  const { data } = await getCategoryWithSubcategories();
  const tree = data.data ?? [];

  await AsyncStorage.multiSet([
    [CACHE_KEY, JSON.stringify(tree)],
    [`${CACHE_KEY}_time`, Date.now().toString()]
  ]);

  return tree;
};

// ── Contenido (solo existe mientras el modal está abierto) ───────

const MultiExpenseModalContent: React.FC<MultiExpenseModalProps> = ({
  imageUri,
  sourceType,
  onSave,
  onClose,
  initialExpenses = NO_EXPENSES
}) => {
  const colors = useThemeColors();

  const [expenses, setExpenses] = useState<ExpenseModal[]>(() =>
    buildInitialExpenses(initialExpenses)
  );
  const [rawCategories, setRawCategories] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const tree = await fetchCategoryTree();
        if (isMounted) setRawCategories(tree);
      } catch {
        if (isMounted) Alert.alert('Error', 'No se pudieron cargar las categorías');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => transformCategories(rawCategories, colors.TEXT_PRIMARY),
    [rawCategories, colors.TEXT_PRIMARY]
  );

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + (expense.cost || 0), 0),
    [expenses]
  );

  const isValid = useMemo(
    () =>
      expenses.every(
        (exp) => exp.cost > 0 && exp.categoryId !== null && exp.subcategoryId !== null
      ),
    [expenses]
  );

  const handleBack = useCallback(() => {
    onClose(expenses); // Pasa los productos editados al cerrar
  }, [expenses, onClose]);

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

  const handleSave = useCallback(() => {
    if (!isValid) {
      Alert.alert('Validación', 'Complete todos los campos requeridos');
      return;
    }

    onSave(transformToCreatePayload(expenses));
  }, [expenses, isValid, onSave]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={handleBack}>
      {/* Cierra el teclado al tocar fuera de los inputs */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          {/* Evita que el tap en el contenido propague al dismiss */}
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.CARD_BACKGROUND }]}>
              <ProductsHeader
                title="Registrar Gastos"
                count={expenses.length}
                onClose={handleBack}
                imageUri={imageUri}
                sourceType={sourceType}
              />
              <Text style={[styles.total, { color: colors.SUCCESS }]}>
                Total: {NumberFormat(totalAmount)}
              </Text>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.PRIMARY} />
                  <Text style={{ color: colors.TEXT_PRIMARY }}>Cargando categorías...</Text>
                </View>
              ) : (
                <>
                  <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {expenses.length > 0 ? (
                      expenses.map((expense, index) => (
                        <ExpenseItem
                          key={expense.idempotencyKey ?? `expense-${index}`}
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
                      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                        No hay gastos para mostrar
                      </Text>
                    )}
                  </ScrollView>

                  <View style={styles.footer}>
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: colors.SUCCESS }]}
                      onPress={handleAddExpense}
                    >
                      <Icon name="add" color={colors.WHITE} size={18} />
                      <Text style={[styles.addButtonText, { color: colors.WHITE }]}>Agregar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { backgroundColor: isValid ? colors.PRIMARY : colors.GRAY }
                      ]}
                      onPress={handleSave}
                      disabled={!isValid}
                    >
                      <Text style={[styles.saveButtonText, { color: colors.WHITE }]}>
                        Guardar ({expenses.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ── Componente público ───────────────────────────────────────────

const MultiExpenseModal: React.FC<MultiExpenseModalProps> = (props) => {
  // Mientras está cerrado no se monta nada; al abrirse, el estado arranca limpio
  if (!props.visible) return null;
  return <MultiExpenseModalContent {...props} />;
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 10,
    padding: 5
  },
  scrollContainer: {
    flexGrow: 1,
    maxHeight: '60%'
  },
  scrollContent: {
    paddingBottom: 20
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  addButton: {
    padding: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 5
  },
  addButtonText: {
    marginLeft: 5
  },
  saveButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5
  },
  saveButtonText: {
    fontWeight: 'bold'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    textAlign: 'center',
    padding: 20
  },
  total: {
    paddingHorizontal: 10,
    paddingBottom: 2,
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default React.memo(MultiExpenseModal);
