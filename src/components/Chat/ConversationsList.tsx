import React, { useState } from 'react';
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

export function ConversationsList({ onSelect }: ConversationsListProps) {
  const colors = useThemeColors();
  const { conversations, currentConversationId, deleteConversation } = useChat();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuPress = (id: number) => {
    setSelectedConversation(id);
    setShowMenu(true);
  };

  const handleDelete = async () => {
    if (!selectedConversation) return;

    Alert.alert(
      'Eliminar conversación',
      '¿Estás seguro de que deseas eliminar esta conversación?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setShowMenu(false)
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(selectedConversation);
              setShowMenu(false);
              setSelectedConversation(null);
            } catch (error) {
              console.error('Error al eliminar la conversación:', error);
              Alert.alert('Error', 'No se pudo eliminar la conversación');
            }
          }
        }
      ]
    );
  };

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
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isSelected = currentConversationId === item.id;

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
                    <Icon
                      type="material-community"
                      name="message-text"
                      size={16}
                      color={colors.WHITE}
                    />
                  </View>

                  <Text
                    style={[styles.conversationText, { color: colors.TEXT_PRIMARY }]}
                    numberOfLines={1}
                  >
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
                      containerStyle={{ marginRight: 4 }}
                    />
                    <Text style={[styles.messageCount, { color: colors.INFO }]}>
                      {item.messageCount} {item.messageCount === 1 ? 'mensaje' : 'mensajes'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuPress(item.id)}>
                <Icon
                  type="material-community"
                  name="dots-vertical"
                  size={24}
                  color={colors.TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.ERROR + '10' }]}
              onPress={handleDelete}
            >
              <Icon
                type="material-community"
                name="delete-outline"
                size={20}
                color={colors.ERROR}
                containerStyle={{ marginRight: 8 }}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuContainer: {
    borderRadius: 12,
    padding: 8,
    minWidth: 240,
    shadowColor: '#000',
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
  menuItemText: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  }
});
