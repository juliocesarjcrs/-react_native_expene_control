import { StyleSheet, Text } from 'react-native';
import { View } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { UserModel } from '~/shared/types';
import { MEDIUM, SMALL } from '~/styles/fonts';
interface UserListItemProps {
  user: UserModel;
  colors: ReturnType<typeof useThemeColors>;
}

export const UserListItem = ({ user, colors }: UserListItemProps) => {
  const getRoleBadgeColor = (role: number): string => {
    return role === 1 ? colors.PRIMARY : colors.INFO;
  };

  const getRoleText = (role: number): string => {
    return role === 1 ? 'Administrador' : 'Usuario Normal';
  };

  return (
    <View
      style={[
        userItemStyles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER
        }
      ]}
    >
      {/* Avatar inicial */}
      <View style={[userItemStyles.avatar, { backgroundColor: colors.PRIMARY }]}>
        <Text style={userItemStyles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
      </View>

      {/* Información del usuario */}
      <View style={userItemStyles.infoContainer}>
        <Text style={[userItemStyles.name, { color: colors.TEXT_PRIMARY }]}>{user.name}</Text>

        <Text style={[userItemStyles.email, { color: colors.TEXT_SECONDARY }]}>{user.email}</Text>

        {/* Badge de rol */}
        <View
          style={[
            userItemStyles.roleBadge,
            { backgroundColor: getRoleBadgeColor(user.role) + '20' }
          ]}
        >
          <Text style={[userItemStyles.roleText, { color: getRoleBadgeColor(user.role) }]}>
            {getRoleText(user.role)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const userItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  infoContainer: {
    flex: 1
  },
  name: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginBottom: 4
  },
  email: {
    fontSize: SMALL,
    marginBottom: 6
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2
  },
  roleText: {
    fontSize: SMALL,
    fontWeight: '600'
  }
});
