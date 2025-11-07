import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { useChat } from '~/features/chat/ChatContext';
import { ConversationsList } from './ConversationsList';
import { ModelStatusIndicator } from './ModelStatusIndicator';
import { ChatMessage } from './ChatMessage';

export function ChatWindow({ onClose }: { onClose: () => void }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const { messages, isLoading, error, sendMessage, selectConversation, startNewConversation } = useChat();
  const [inputText, setInputText] = React.useState('');
  const [showConversations, setShowConversations] = React.useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSelectConversation = async (conversationId: number) => {
    await selectConversation(conversationId);
    setShowConversations(false);
  };

  const handleSend = async () => {
    if (inputText.trim()) {
      await sendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ModelStatusIndicator />
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowConversations(!showConversations)}>
          <MaterialIcons name="menu" size={24} color={colors.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Assistant</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={colors.WHITE} />
        </TouchableOpacity>
      </View>

      {showConversations ? (
        <View style={styles.conversationsContainer}>
          <TouchableOpacity
            style={styles.newConversationButton}
            onPress={async () => {
              await startNewConversation();
              setShowConversations(false);
            }}
          >
            <MaterialIcons name="add" size={24} color={colors.WHITE} />
            <Text style={styles.newConversationText}>Nueva conversación</Text>
          </TouchableOpacity>
          <ConversationsList onSelect={handleSelectConversation} />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatMessage content={item.content} role={item.role} />}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escriba su mensaje..."
              placeholderTextColor={colors.TEXT_SECONDARY}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={isLoading || !inputText.trim()}>
              {isLoading ? (
                <ActivityIndicator color={colors.WHITE} />
              ) : (
                <MaterialIcons name="send" size={24} color={colors.WHITE} />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

export function ChatButton({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  
  return (
    <TouchableOpacity style={styles.floatingButton} onPress={onPress}>
      <MaterialIcons name="chat" size={30} color={colors.WHITE} />
    </TouchableOpacity>
  );
}

// Función para crear estilos dinámicos basados en el tema
const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.WHITE,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.PRIMARY,
    },
    headerTitle: {
      color: colors.WHITE,
      fontSize: 18,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 4,
    },
    menuButton: {
      padding: 4,
    },
    messagesList: {
      padding: 16,
    },
    messageContainer: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      marginVertical: 4,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: colors.PRIMARY,
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      backgroundColor: colors.SECONDARY,
    },
    messageText: {
      color: colors.WHITE,
      fontSize: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.LIGHT_GRAY,
    },
    input: {
      flex: 1,
      marginRight: 8,
      padding: 12,
      borderRadius: 20,
      backgroundColor: colors.LIGHT_GRAY,
      maxHeight: 100,
      color: colors.TEXT_PRIMARY,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.PRIMARY,
      justifyContent: 'center',
      alignItems: 'center',
    },
    floatingButton: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.PRIMARY,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    errorContainer: {
      padding: 8,
      backgroundColor: '#ffebee',
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
    },
    errorText: {
      color: '#c62828',
      fontSize: 14,
    },
    conversationsContainer: {
      flex: 1,
      backgroundColor: colors.WHITE,
    },
    conversationItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.LIGHT_GRAY,
    },
    selectedConversation: {
      backgroundColor: colors.LIGHT_GRAY,
    },
    conversationText: {
      fontSize: 16,
      color: colors.PRIMARY,
    },
    messageCount: {
      fontSize: 12,
      color: colors.SECONDARY,
      marginTop: 4,
    },
    newConversationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.PRIMARY,
    },
    newConversationText: {
      color: colors.WHITE,
      marginLeft: 8,
      fontSize: 16,
    },
  });

// Estilos para el Markdown (si los necesitas)
export const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  list_item: {
    flexDirection: 'row',
  },
});