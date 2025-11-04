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
import { Colors } from '~/styles';
import { useChat } from '~/features/chat/ChatContext';
import { ConversationsList } from './ConversationsList';
import { ModelStatusIndicator } from './ModelStatusIndicator';
import { ChatMessage } from './ChatMessage';

export function ChatWindow({ onClose }: { onClose: () => void }) {
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
          <MaterialIcons name="menu" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Assistant</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={Colors.WHITE} />
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
            <MaterialIcons name="add" size={24} color={Colors.WHITE} />
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
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={isLoading || !inputText.trim()}>
              {isLoading ? (
                <ActivityIndicator color={Colors.WHITE} />
              ) : (
                <MaterialIcons name="send" size={24} color={Colors.WHITE} />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

export function ChatButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.floatingButton} onPress={onPress}>
      <MaterialIcons name="chat" size={30} color={Colors.WHITE} />
    </TouchableOpacity>
  );
}
// Estilos para el Markdown
const markdownStyles =  StyleSheet.create({
  body: {
    color: Colors.WHITE,
    fontSize: 16,
  },
  strong: {
    fontWeight: 'bold',
    color: Colors.WHITE,
  },
  em: {
    fontStyle: 'italic',
  },
  list_item: {
    flexDirection: 'row',
  }
 });


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.PRIMARY
  },
  headerTitle: {
    color: Colors.WHITE,
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 4
  },
  messagesList: {
    padding: 16
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.PRIMARY
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.CHAT_SECONDARY
  },
  messageText: {
    color: Colors.WHITE,
    fontSize: 16
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.LIGHT_GRAY
  },
  input: {
    flex: 1,
    marginRight: 8,
    padding: 12,
    borderRadius: 20,
    backgroundColor: Colors.LIGHT_GRAY,
    maxHeight: 100
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center'
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  errorContainer: {
    padding: 8,
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8
  },
  errorText: {
    color: '#c62828',
    fontSize: 14
  },
  conversationsContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY
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
    padding: 4
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.PRIMARY
  },
  newConversationText: {
    color: Colors.WHITE,
    marginLeft: 8,
    fontSize: 16
  },
});
