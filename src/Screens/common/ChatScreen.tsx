import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import { ChatProvider } from '../../features/chat/ChatContext';
import { ChatButton, ChatWindow } from '../../components/Chat/ChatComponents';

export function ChatScreen() {
  const [isChatVisible, setIsChatVisible] = useState(false);

  return (
    <ChatProvider>
      <View style={{ flex: 1 }}>
        {/* Your existing screen content */}
        
        <Modal
          visible={isChatVisible}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <ChatWindow onClose={() => setIsChatVisible(false)} />
        </Modal>

        <ChatButton onPress={() => setIsChatVisible(true)} />
      </View>
    </ChatProvider>
  );
}