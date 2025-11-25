import React, { useRef, useEffect } from 'react';
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

  const { messages, isLoading, error, sendMessage, selectConversation, startNewConversation, clearError, loadConversations } = useChat();
  const [inputText, setInputText] = React.useState('');
  const [showConversations, setShowConversations] = React.useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll cuando llegan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSelectConversation = async (conversationId: number) => {
    await selectConversation(conversationId);
    setShowConversations(false);
  };

  const handleNewConversation = async () => {
    await startNewConversation();
    setShowConversations(false);
  };

  const handleToggleConversations = () => {
    const newState = !showConversations;
    setShowConversations(newState);
    // Recargar conversaciones cuando se abre el menú
    if (newState) {
      loadConversations();
    }
  };

  const handleSend = async () => {
    if (inputText.trim()) {
      await sendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ModelStatusIndicator />
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleToggleConversations}>
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
            onPress={handleNewConversation}
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
            keyExtractor={(item) => `${item.id}-${item.createdAt}`}
            renderItem={({ item }) => {
              // No renderizar mensajes del sistema
              if (item.role === 'system') return null;
              
              return (
                <ChatMessage 
                  content={item.content} 
                  role={item.role} 
                />
              );
            }}
            contentContainerStyle={styles.messagesList}
            removeClippedSubviews={false}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={100}
            windowSize={5}
            initialNumToRender={10}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Inicia una conversación enviando un mensaje
                </Text>
              </View>
            }
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.PRIMARY} />
              <Text style={styles.loadingText}>Pensando...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorContent}>
                <MaterialIcons name="error-outline" size={20} color="#c62828" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
                <MaterialIcons name="close" size={18} color="#c62828" />
              </TouchableOpacity>
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
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={handleSend} 
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]} 
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.WHITE} size="small" />
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
      flexGrow: 1,
      paddingBottom: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.LIGHT_GRAY,
      backgroundColor: colors.WHITE,
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
    sendButtonDisabled: {
      opacity: 0.5,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: '#ffebee',
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#c62828',
    },
    errorContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      flex: 1,
      color: '#c62828',
      fontSize: 14,
    },
    errorCloseButton: {
      padding: 4,
      marginLeft: 8,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    loadingText: {
      marginLeft: 8,
      color: colors.TEXT_SECONDARY,
      fontSize: 14,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      color: colors.TEXT_SECONDARY,
      fontSize: 16,
      textAlign: 'center',
    },
    conversationsContainer: {
      flex: 1,
      backgroundColor: colors.WHITE,
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