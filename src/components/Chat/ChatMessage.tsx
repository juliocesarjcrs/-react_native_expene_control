import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, Platform, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '~/styles';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

export function ChatMessage({ content, role }: ChatMessageProps) {
  const { width: windowWidth } = useWindowDimensions();
  
  // Ancho diferente según el rol  
  const maxWidth = role === 'user' 
    ? windowWidth * 0.75  // Usuario: 75%
    : windowWidth * 0.90; // Asistente: 90% (aumentado)

  const handleLongPress = async () => {
    await Clipboard.setStringAsync(content);
    Alert.alert('Copiado', 'El mensaje se ha copiado al portapapeles.');
  };

  return (
    <View
      style={[
        styles.messageWrapper,
        role === 'user' ? styles.userWrapper : styles.assistantWrapper,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={handleLongPress}
        style={[
          styles.messageContainer,
          role === 'user' ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <View style={{ width: maxWidth - 28 }}>
          <Text>
            <Markdown style={markdownStyles}>{content}</Markdown>
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    color: Colors.WHITE,
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
    color: Colors.WHITE,
    lineHeight: 22,
  },
  text: {
    color: Colors.WHITE,
  },
  strong: {
    fontWeight: 'bold',
    color: Colors.WHITE,
  },
  em: {
    fontStyle: 'italic',
    color: Colors.WHITE,
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.WHITE,
    marginTop: 8,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.WHITE,
    marginTop: 6,
    marginBottom: 6,
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  bullet_list_icon: {
    color: Colors.WHITE,
    marginLeft: 0,
    marginRight: 8,
  },
  ordered_list_icon: {
    color: Colors.WHITE,
    marginLeft: 0,
    marginRight: 8,
  },
  bullet_list_content: {
    flex: 1,
    color: Colors.WHITE,
  },
  ordered_list_content: {
    flex: 1,
    color: Colors.WHITE,
  },
  code_inline: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.WHITE,
    fontSize: 14,
  },
  fence: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 5,
    marginVertical: 8,
  },
  code_block: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 5,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.WHITE,
    fontSize: 14,
  },
  hr: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    height: 1,
    marginVertical: 10,
  },
  blockquote: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
    paddingLeft: 10,
    marginVertical: 8,
  },
});

const styles = StyleSheet.create({
  messageWrapper: {
    width: '100%',
    marginVertical: 6,
  },
  userWrapper: {
    alignItems: 'flex-end',
    paddingLeft: 40, // Espacio a la izquierda para mensajes de usuario
  },
  assistantWrapper: {
    alignItems: 'flex-start',
    paddingRight: 20, // Espacio a la derecha para mensajes del asistente
  },
  messageContainer: {
    padding: 14,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: Colors.PRIMARY,
  },
  assistantMessage: {
    backgroundColor: Colors.CHAT_SECONDARY,
  },
});