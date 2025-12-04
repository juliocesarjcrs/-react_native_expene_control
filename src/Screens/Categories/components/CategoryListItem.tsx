import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { CategoryModel } from '~/shared/types';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface CategoryListItemProps {
  item: CategoryModel;
  onDelete: (id: number, name: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}

export const CategoryListItem = ({ item, onDelete, colors }: CategoryListItemProps) => {
  const getTypeLabel = (type: number): string => {
    return type === 1 ? 'Ingreso' : 'Gasto';
  };

  const getTypeBadgeColor = (type: number): string => {
    return type === 1 ? colors.SUCCESS : colors.WARNING;
  };

  return (
    <View
      style={[
        itemStyles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderLeftColor: item.type === 1 ? colors.SUCCESS : colors.WARNING
        }
      ]}
    >
      {/* Icono de categoría */}
      <View
        style={[
          itemStyles.iconContainer,
          { backgroundColor: (item.type === 1 ? colors.SUCCESS : colors.WARNING) + '15' }
        ]}
      >
        <Icon
          type="font-awesome"
          name={item.icon || 'home'}
          size={20}
          color={item.type === 1 ? colors.SUCCESS : colors.WARNING}
        />
      </View>

      {/* Información de la categoría */}
      <View style={itemStyles.infoContainer}>
        <Text style={[itemStyles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={itemStyles.metaInfo}>
          {/* Badge de tipo */}
          <View
            style={[itemStyles.typeBadge, { backgroundColor: getTypeBadgeColor(item.type) + '20' }]}
          >
            <Text style={[itemStyles.typeText, { color: getTypeBadgeColor(item.type) }]}>
              {getTypeLabel(item.type)}
            </Text>
          </View>

          {/* Indicador de presupuesto */}
          {item.budget !== null && item.budget > 0 && (
            <View style={itemStyles.budgetIndicator}>
              <Icon
                type="material-community"
                name="wallet-outline"
                size={12}
                color={colors.INFO}
                containerStyle={{ marginRight: 3 }}
              />
              <Text style={[itemStyles.budgetText, { color: colors.INFO }]}>Con presupuesto</Text>
            </View>
          )}
        </View>
      </View>

      {/* Botón eliminar */}
      <TouchableOpacity
        onPress={() => onDelete(item.id, item.name)}
        style={itemStyles.deleteButton}
      >
        <Icon type="material-community" name="delete-outline" size={22} color={colors.ERROR} />
      </TouchableOpacity>
    </View>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
    flexWrap: 'wrap'
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  typeText: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  budgetIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6
  },
  budgetText: {
    fontSize: SMALL - 1
  },
  deleteButton: {
    padding: 6
  }
});
