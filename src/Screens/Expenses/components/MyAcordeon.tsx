import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Icon, Divider } from 'react-native-elements';

// Utils
import { NumberFormat, cutText } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Components
import ListSubcategory from '~/components/card/ListSubcategory';
import MyProgressBar from '~/components/progressBar/MyProgressBar';

// Types
import { Category } from '~/shared/types/services';

// Styles
import { SMALL, MEDIUM } from '~/styles/fonts';

interface MyAcordeonProps {
  data: Category & { data: Category['subcategories'] };
  editCategory: (id: number) => void;
  createSubcategory: (id: number) => void;
}

export default function MyAcordeon({ data, editCategory, createSubcategory }: MyAcordeonProps) {
  const colors = useThemeColors();
  const { id, icon, name, budget } = data;
  const [expanded, setExpanded] = useState<boolean>(false);

  const sendEditCategoryScreen = (categoryId: number): void => {
    editCategory(categoryId);
  };

  const sendCreateSubcategoryScreen = (categoryId: number): void => {
    createSubcategory(categoryId);
  };

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  const calculatePercentage = (actualExpense: number, budgetAmount: number): number => {
    if (budgetAmount <= 0) return 0;
    return (actualExpense * 100) / budgetAmount;
  };

  const getCurrentDayPercentage = (): number => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return (currentDay / daysInMonth) * 100;
  };

  const percentUsed = calculatePercentage(data.total, budget);
  const percentDay = getCurrentDayPercentage();
  const isOverBudget = data.total > budget;
  const isOverDayBudget = percentUsed > percentDay;

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
        {/* Header con título e iconos */}
        <View style={styles.headerRow}>
          <View style={styles.titleSection}>
            <Icon
              type="font-awesome"
              name={icon || 'home'}
              size={22}
              color={expanded ? colors.PRIMARY : colors.TEXT_SECONDARY}
            />
            <Text
              style={[
                styles.categoryName,
                {
                  color: expanded ? colors.PRIMARY : colors.TEXT_PRIMARY,
                  fontWeight: expanded ? 'bold' : 'normal'
                }
              ]}
            >
              {cutText(name, 16)}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.PRIMARY + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.PRIMARY }]}>{data.data.length}</Text>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Icon
              type="material-community"
              name="pencil-outline"
              size={20}
              color={colors.TEXT_SECONDARY}
              onPress={() => sendEditCategoryScreen(id)}
              containerStyle={styles.iconButton}
            />
            <Icon
              type="material-community"
              name="plus-circle"
              size={24}
              color={colors.PRIMARY}
              onPress={() => sendCreateSubcategoryScreen(id)}
              containerStyle={styles.iconButton}
            />
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              type="font-awesome"
              size={20}
              color={colors.TEXT_SECONDARY}
              onPress={toggleExpanded}
              containerStyle={styles.iconButton}
            />
          </View>
        </View>

        {/* Información de presupuesto */}
        {budget > 0 ? (
          <View style={styles.budgetSection}>
            <View style={styles.amountsRow}>
              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>Gastado</Text>
                <Text style={[styles.amountValue, { color: isOverBudget ? colors.ERROR : colors.TEXT_PRIMARY }]}>
                  {NumberFormat(data.total)}
                </Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>Presupuesto</Text>
                <Text style={[styles.amountValue, { color: colors.TEXT_PRIMARY }]}>{NumberFormat(budget)}</Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>Disponible</Text>
                <Text style={[styles.amountValue, { color: budget - data.total >= 0 ? colors.SUCCESS : colors.ERROR }]}>
                  {NumberFormat(budget - data.total)}
                </Text>
              </View>
            </View>

            {/* Barra de progreso con indicador de día */}
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <MyProgressBar height={20} percentage={`${percentUsed.toFixed(1)}%`} />

                {/* Indicador de día actual */}
                <View
                  style={[
                    styles.dayIndicator,
                    {
                      left: `${percentDay}%`,
                      borderColor: isOverDayBudget ? colors.WARNING : colors.SUCCESS
                    }
                  ]}
                >
                  <View
                    style={[
                      styles.dayIndicatorDot,
                      { backgroundColor: isOverDayBudget ? colors.WARNING : colors.SUCCESS }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: colors.TEXT_SECONDARY }]}>
                  {percentUsed.toFixed(1)}% usado
                </Text>
                <Text style={[styles.progressLabel, { color: isOverDayBudget ? colors.WARNING : colors.SUCCESS }]}>
                  📍 Día {new Date().getDate()} ({percentDay.toFixed(0)}%)
                </Text>
              </View>
            </View>

            {/* Badge de alerta si excede presupuesto */}
            {isOverBudget && (
              <View style={[styles.alertBadge, { backgroundColor: colors.ERROR + '15' }]}>
                <Icon
                  type="material-community"
                  name="alert-circle"
                  size={16}
                  color={colors.ERROR}
                  containerStyle={{ marginRight: 4 }}
                />
                <Text style={[styles.alertText, { color: colors.ERROR }]}>
                  Presupuesto excedido por {NumberFormat(data.total - budget)}
                </Text>
              </View>
            )}

            {/* Badge de advertencia si va por encima del día */}
            {!isOverBudget && isOverDayBudget && (
              <View style={[styles.alertBadge, { backgroundColor: colors.WARNING + '15' }]}>
                <Icon
                  type="material-community"
                  name="alert"
                  size={16}
                  color={colors.WARNING}
                  containerStyle={{ marginRight: 4 }}
                />
                <Text style={[styles.alertText, { color: colors.WARNING }]}>
                  Gastando más rápido que el promedio del mes
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noBudgetSection}>
            <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>Total gastado:</Text>
            <Text style={[styles.amountValue, { color: colors.TEXT_PRIMARY }]}>{NumberFormat(data.total)}</Text>
          </View>
        )}

        <Divider
          style={{
            backgroundColor: colors.BORDER,
            marginTop: 8
          }}
        />
      </View>

      {/* Lista de subcategorías expandible */}
      <View>{expanded && data.data.map((item, idx) => <ListSubcategory key={item.id || idx} item={item} />)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  categoryName: {
    fontSize: MEDIUM,
    marginLeft: 10,
    marginRight: 6
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  badgeText: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    marginLeft: 8
  },
  budgetSection: {
    marginTop: 4
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  amountItem: {
    flex: 1,
    alignItems: 'center'
  },
  amountLabel: {
    fontSize: SMALL,
    marginBottom: 4
  },
  amountValue: {
    fontSize: MEDIUM,
    fontWeight: 'bold'
  },
  separator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8
  },
  progressSection: {
    marginTop: 4
  },
  progressBarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  dayIndicator: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginLeft: -1
  },
  dayIndicatorDot: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  progressLabel: {
    fontSize: SMALL
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8
  },
  alertText: {
    fontSize: SMALL,
    fontWeight: '600',
    flex: 1
  },
  noBudgetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8
  }
});
