import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, Platform, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

export function ChatMessage({ content, role }: ChatMessageProps) {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();

  // Ancho diferente según el rol
  const maxWidth =
    role === 'user'
      ? windowWidth * 0.75 // Usuario: 75%
      : windowWidth * 0.9; // Asistente: 90%

  const handleLongPress = async () => {
    await Clipboard.setStringAsync(content);
    Alert.alert('Copiado', 'El mensaje se ha copiado al portapapeles.');
  };

  // Colores dinámicos según el rol y theme
  const messageBackgroundColor = role === 'user' ? colors.PRIMARY : colors.CARD_BACKGROUND;

  const textColor = role === 'user' ? colors.WHITE : colors.TEXT_PRIMARY;

  const codeBackgroundColor = role === 'user' ? 'rgba(255, 255, 255, 0.2)' : colors.BACKGROUND;

  const blockquoteBackgroundColor = role === 'user' ? 'rgba(255, 255, 255, 0.1)' : colors.BACKGROUND;

  const blockquoteBorderColor = role === 'user' ? 'rgba(255, 255, 255, 0.4)' : colors.BORDER;

  const hrColor = role === 'user' ? 'rgba(255, 255, 255, 0.3)' : colors.BORDER;

  // Estilos dinámicos de Markdown
  const dynamicMarkdownStyles = StyleSheet.create({
    body: {
      color: textColor,
      fontSize: SMALL + 1,
      lineHeight: 22,
      flexShrink: 1
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
      color: textColor,
      lineHeight: 22
    },
    text: {
      color: textColor
    },
    strong: {
      fontWeight: 'bold',
      color: textColor
    },
    em: {
      fontStyle: 'italic',
      color: textColor
    },
    heading1: {
      fontSize: 20,
      fontWeight: 'bold',
      color: textColor,
      marginTop: 8,
      marginBottom: 8
    },
    heading2: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textColor,
      marginTop: 6,
      marginBottom: 6
    },
    heading3: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textColor,
      marginTop: 6,
      marginBottom: 6
    },
    list_item: {
      flexDirection: 'row',
      marginBottom: 4
    },
    bullet_list: {
      marginBottom: 8
    },
    ordered_list: {
      marginBottom: 8
    },
    bullet_list_icon: {
      color: textColor,
      marginLeft: 0,
      marginRight: 8
    },
    ordered_list_icon: {
      color: textColor,
      marginLeft: 0,
      marginRight: 8
    },
    bullet_list_content: {
      flex: 1,
      color: textColor
    },
    ordered_list_content: {
      flex: 1,
      color: textColor
    },
    code_inline: {
      backgroundColor: codeBackgroundColor,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      color: textColor,
      fontSize: 14
    },
    fence: {
      backgroundColor: codeBackgroundColor,
      padding: 10,
      borderRadius: 5,
      marginVertical: 8
    },
    code_block: {
      backgroundColor: codeBackgroundColor,
      padding: 10,
      borderRadius: 5,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      color: textColor,
      fontSize: 14
    },
    hr: {
      backgroundColor: hrColor,
      height: 1,
      marginVertical: 10
    },
    blockquote: {
      backgroundColor: blockquoteBackgroundColor,
      borderLeftWidth: 4,
      borderLeftColor: blockquoteBorderColor,
      paddingLeft: 10,
      marginVertical: 8
    },
    link: {
      color: role === 'user' ? colors.WHITE : colors.PRIMARY,
      textDecorationLine: 'underline'
    }
  });

  return (
    <View style={[styles.messageWrapper, role === 'user' ? styles.userWrapper : styles.assistantWrapper]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={handleLongPress}
        style={[
          styles.messageContainer,
          {
            backgroundColor: messageBackgroundColor,
            shadowColor: colors.BLACK
          }
        ]}
      >
        <View style={{ width: maxWidth - 28 }}>
          <Markdown style={dynamicMarkdownStyles}>{content}</Markdown>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    width: '100%',
    marginVertical: 6
  },
  userWrapper: {
    alignItems: 'flex-end',
    paddingLeft: 40
  },
  assistantWrapper: {
    alignItems: 'flex-start',
    paddingRight: 20
  },
  messageContainer: {
    padding: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  }
});
