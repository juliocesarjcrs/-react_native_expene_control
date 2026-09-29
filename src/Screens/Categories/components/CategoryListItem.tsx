import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Components

// Types
import { CategoryModel } from '~/shared/types';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import MyIconButton from '~/components/buttons/MyIconButton';

interface CategoryListItemProps {
  item: CategoryModel;
  onDelete: (id: number, name: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}

export const CategoryListItem = ({ item, onDelete, colors }: CategoryListItemProps) => {
  const isIncome = item.type === 1;
  const typeLabel = isIncome ? 'Ingreso' : 'Gasto';
  const typeColor = isIncome ? colors.SUCCESS : colors.WARNING;

  return (
    <View
      style={[
        itemStyles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderLeftColor: typeColor
        }
      ]}
    >
      {/* Icono de categoría */}
      <View style={[itemStyles.iconContainer, { backgroundColor: typeColor + '15' }]}>
        <Icon type="font-awesome" name={item.icon || 'home'} size={20} color={typeColor} />
      </View>

      {/* Información de la categoría */}
      <View style={itemStyles.infoContainer}>
        <Text style={[itemStyles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={itemStyles.metaInfo}>
          {/* Badge de tipo */}
          <View style={[itemStyles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[itemStyles.typeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>

          {/* Indicador de presupuesto */}
          {item.budget !== null && item.budget > 0 && (
            <View style={itemStyles.budgetIndicator}>
              <Icon
                type="material-community"
                name="wallet-outline"
                size={12}
                color={colors.INFO}
                containerStyle={itemStyles.budgetIcon}
              />
              <Text style={[itemStyles.budgetText, { color: colors.INFO }]}>Con presupuesto</Text>
            </View>
          )}
        </View>
      </View>

      {/* Botón eliminar */}
      <MyIconButton variant="delete" onPress={() => onDelete(item.id, item.name)} />
    </View>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  name: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 4
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  typeText: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  budgetIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  budgetIcon: {
    marginRight: 4
  },
  budgetText: {
    fontSize: SMALL - 1
  }
});