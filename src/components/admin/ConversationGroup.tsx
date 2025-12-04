import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import InteractionCard from './InteractionCard';

type Props = {
  conversationId: number;
  logs: any[];
};

export default function ConversationGroup({ conversationId, logs }: Props) {
  const colors = useThemeColors();
  const [collapsed, setCollapsed] = useState(false);

  const sortedLogs = [...logs].sort((a, b) => a.iteration - b.iteration);
  const totalTime = logs.reduce((sum, log) => sum + log.response_time, 0);
  const successCount = logs.filter((log) => log.tool_result?.success).length;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER
        }
      ]}
    >
      {/* Group Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.conversationBadge,
              {
                backgroundColor: colors.PRIMARY
              }
            ]}
          >
            <Icon name="message-text" type="material-community" color="#fff" size={16} />
          </View>
          <View>
            <Text style={[styles.conversationTitle, { color: colors.TEXT_PRIMARY }]}>
              Conversación #{conversationId}
            </Text>
            <Text style={[styles.conversationMeta, { color: colors.TEXT_SECONDARY }]}>
              {logs.length} iteraciones • {totalTime}ms total • {successCount}/{logs.length}{' '}
              exitosas
            </Text>
          </View>
        </View>

        <Icon
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          type="material-community"
          color={colors.TEXT_SECONDARY}
          size={24}
        />
      </TouchableOpacity>

      {/* Interactions */}
      {!collapsed && (
        <View style={styles.interactions}>
          {sortedLogs.map((log) => (
            <InteractionCard key={log.id} log={log} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  conversationBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  conversationMeta: {
    fontSize: 11,
    marginTop: 2
  },
  interactions: {
    padding: 12,
    paddingTop: 0
  }
});
