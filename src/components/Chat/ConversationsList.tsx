import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { Icon } from 'react-native-elements';

// Context
import { useChat } from '~/features/chat/ChatContext';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

type ConversationsListProps = {
  onSelect: (id: number) => void;
};

type Conversation = ReturnType<typeof useChat>['conversations'][number];

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.5)';

const keyExtractor = (item: Conversation): string => item.id.toString();

// ─────────────────────────────────────────────
// Item de la lista
// ─────────────────────────────────────────────

interface ConversationItemProps {
  item: Conversation;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onMenuPress: (id: number) => void;
}

function ConversationItem({ item, isSelected, onSelect, onMenuPress }: ConversationItemProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.conversationContainer, { borderBottomColor: colors.BORDER }]}>
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isSelected && {
            backgroundColor: colors.PRIMARY + '15',
            borderLeftColor: colors.PRIMARY
          }
        ]}
        onPress={() => onSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isSelected ? colors.PRIMARY : colors.TEXT_SECONDARY }
            ]}
          >
            <Icon type="material-community" name="message-text" size={16} color={colors.WHITE} />
          </View>

          <Text style={[styles.conversationText, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
            {item.lastMessage || 'Nueva conversación'}
          </Text>
        </View>

        <View style={styles.conversationFooter}>
          <View style={[styles.messageBadge, { backgroundColor: colors.INFO + '20' }]}>
            <Icon
              type="material-community"
              name="chat"
              size={12}
              color={colors.INFO}
              containerStyle={styles.badgeIcon}
            />
            <Text style={[styles.messageCount, { color: colors.INFO }]}>
              {item.messageCount} {item.messageCount === 1 ? 'mensaje' : 'mensajes'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton} onPress={() => onMenuPress(item.id)}>
        <Icon
          type="material-community"
          name="dots-vertical"
          size={24}
          color={colors.TEXT_SECONDARY}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Lista
// ─────────────────────────────────────────────

export function ConversationsList({ onSelect }: ConversationsListProps) {
  const colors = useThemeColors();
  const { conversations, currentConversationId, deleteConversation } = useChat();

  // Conversación cuyo menú está abierto (null = menú cerrado)
  const [menuConversationId, setMenuConversationId] = useState<number | null>(null);

  const closeMenu = () => setMenuConversationId(null);

  const handleMenuPress = useCallback((id: number) => {
    setMenuConversationId(id);
  }, []);

  const handleDelete = () => {
    if (menuConversationId === null) return;

    const idToDelete = menuConversationId;
    closeMenu();

    Alert.alert(
      'Eliminar conversación',
      '¿Estás seguro de que deseas eliminar esta conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(idToDelete);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la conversación');
            }
          }
        }
      ]
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationItem
        item={item}
        isSelected={currentConversationId === item.id}
        onSelect={onSelect}
        onMenuPress={handleMenuPress}
      />
    ),
    [currentConversationId, onSelect, handleMenuPress]
  );

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon
          type="material-community"
          name="message-outline"
          size={48}
          color={colors.TEXT_SECONDARY}
        />
        <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
          No hay conversaciones
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.TEXT_SECONDARY }]}>
          Inicia una nueva conversación
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={conversations}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={menuConversationId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeMenu}>
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
            ]}
          >
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.ERROR + '10' }]}
              onPress={handleDelete}
            >
              <Icon
                type="material-community"
                name="delete-outline"
                size={20}
                color={colors.ERROR}
                containerStyle={styles.menuItemIcon}
              />
              <Text style={[styles.menuItemText, { color: colors.ERROR }]}>
                Eliminar conversación
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginTop: 12
  },
  emptySubtext: {
    fontSize: SMALL,
    marginTop: 4
  },
  conversationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1
  },
  conversationItem: {
    flex: 1,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent'
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  conversationText: {
    flex: 1,
    fontSize: SMALL + 2,
    fontWeight: '500'
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  messageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeIcon: {
    marginRight: 4
  },
  messageCount: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  menuButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuContainer: {
    borderRadius: 12,
    padding: 8,
    minWidth: 240,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8
  },
  menuItemIcon: {
    marginRight: 8
  },
  menuItemText: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  }
});
