import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { useChat } from '~/features/chat/ChatContext';
import { Colors } from '~/styles';

type ConversationsListProps = {
  onSelect: (id: number) => void;
};

export function ConversationsList({ onSelect }: ConversationsListProps) {
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
            } catch (error) {
              console.error('Error al eliminar la conversación:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.conversationContainer}>
            <TouchableOpacity
              style={[
                styles.conversationItem,
                currentConversationId === item.id && styles.selectedConversation
              ]}
              onPress={() => onSelect(item.id)}
            >
              <Text style={styles.conversationText} numberOfLines={1}>
                {item.lastMessage || 'Nueva conversación'}
              </Text>
              <Text style={styles.messageCount}>{item.messageCount} mensajes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuPress(item.id)}>
              <Text style={styles.menuButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>
        )}
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
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Text style={styles.menuItemTextDelete}>Eliminar conversación</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  conversationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY
  },
  conversationItem: {
    flex: 1,
    padding: 16
  },
  selectedConversation: {
    backgroundColor: Colors.LIGHT_GRAY
  },
  conversationText: {
    fontSize: 16,
    color: Colors.PRIMARY
  },
  messageCount: {
    fontSize: 12,
    color: Colors.CHAT_SECONDARY,
    marginTop: 4
  },
  menuButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuButtonText: {
    fontSize: 24,
    color: Colors.PRIMARY,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  menuItem: {
    padding: 12,
    borderRadius: 4
  },
  menuItemTextDelete: {
    color: Colors.DANGER,
    fontSize: 16,
    textAlign: 'center'
  }
});
