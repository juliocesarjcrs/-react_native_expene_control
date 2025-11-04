import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '~/styles';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

export function ChatMessage({ content, role }: ChatMessageProps) {
  const handleLongPress = async () => {
    await Clipboard.setStringAsync(content);
    Alert.alert('Copiado', 'El mensaje se ha copiado al portapapeles.');
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={handleLongPress}
    >
      <View
        style={[
          styles.messageContainer,
          role === 'user' ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <Markdown style={markdownStyles}>{content}</Markdown>
      </View>
    </TouchableOpacity>
  );
}

const markdownStyles = StyleSheet.create({
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
  },
});

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.PRIMARY,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.CHAT_SECONDARY,
  },
});
