import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';

type InteractionLog = {
  id: number;
  conversationId: number;
  userId: number;
  aiModelId: number;
  model_name: string;
  user_query: string;
  detected_intent: string;
  extracted_parameters: any;
  tool_result: any;
  response_time: number;
  iteration: number;
  createdAt: string;
};

type Props = {
  log: InteractionLog;
};

export default function InteractionCard({ log }: Props) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const isSuccess = log.tool_result?.success;
  const hasData = log.tool_result?.data?.count > 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          borderLeftColor: isSuccess ? (hasData ? colors.SUCCESS : colors.WARNING) : colors.ERROR
        }
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iterationBadge,
              {
                backgroundColor: colors.PRIMARY + '20'
              }
            ]}
          >
            <Text style={[styles.iterationText, { color: colors.PRIMARY }]}>#{log.iteration}</Text>
          </View>
          <View>
            <Text style={[styles.modelName, { color: colors.INFO }]}>
              {log.model_name.split('/')[1] || log.model_name}
            </Text>
            <Text style={[styles.timestamp, { color: colors.TEXT_SECONDARY }]}>
              {new Date(log.createdAt).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.statsRow}>
            <Icon
              name="timer-outline"
              type="material-community"
              color={colors.TEXT_SECONDARY}
              size={14}
            />
            <Text style={[styles.responseTime, { color: colors.TEXT_SECONDARY }]}>
              {log.response_time}ms
            </Text>
          </View>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            type="material-community"
            color={colors.TEXT_SECONDARY}
            size={20}
          />
        </View>
      </View>

      {/* User Query */}
      <Text style={[styles.userQuery, { color: colors.TEXT_PRIMARY }]}>"{log.user_query}"</Text>

      {/* Tool Badge */}
      <View
        style={[
          styles.toolBadge,
          {
            backgroundColor: colors.PRIMARY + '15'
          }
        ]}
      >
        <Icon name="wrench" type="material-community" color={colors.PRIMARY} size={14} />
        <Text style={[styles.toolName, { color: colors.PRIMARY }]}>{log.detected_intent}</Text>
      </View>

      {/* Result Summary */}
      <View style={styles.resultSummary}>
        {isSuccess ? (
          <>
            {hasData ? (
              <View style={styles.successRow}>
                <Icon
                  name="check-circle"
                  type="material-community"
                  color={colors.SUCCESS}
                  size={16}
                />
                <Text style={[styles.resultText, { color: colors.SUCCESS }]}>
                  {log.tool_result.data.count} registros encontrados • Total: $
                  {log.tool_result.data.total?.toLocaleString()}
                </Text>
              </View>
            ) : (
              <View style={styles.warningRow}>
                <Icon name="alert" type="material-community" color={colors.WARNING} size={16} />
                <Text style={[styles.resultText, { color: colors.WARNING }]}>Sin resultados</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" type="material-community" color={colors.ERROR} size={16} />
            <Text style={[styles.resultText, { color: colors.ERROR }]}>Error en ejecución</Text>
          </View>
        )}
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Parameters */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_SECONDARY }]}>
              Parámetros Extraídos:
            </Text>
            <View
              style={[
                styles.codeBlock,
                { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }
              ]}
            >
              <Text style={[styles.codeText, { color: colors.TEXT_PRIMARY }]}>
                {JSON.stringify(log.extracted_parameters, null, 2)}
              </Text>
            </View>
          </View>

          {/* Result */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_SECONDARY }]}>Resultado:</Text>
            <View
              style={[
                styles.codeBlock,
                {
                  backgroundColor: isSuccess ? colors.SUCCESS + '10' : colors.ERROR + '10',
                  borderColor: isSuccess ? colors.SUCCESS : colors.ERROR
                }
              ]}
            >
              <Text style={[styles.codeText, { color: isSuccess ? colors.SUCCESS : colors.ERROR }]}>
                {JSON.stringify(log.tool_result, null, 2)}
              </Text>
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, { color: colors.TEXT_SECONDARY }]}>
              ID: {log.id} • Conv: {log.conversationId} • User: {log.userId}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iterationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center'
  },
  iterationText: {
    fontSize: 12,
    fontWeight: '700'
  },
  modelName: {
    fontSize: 12,
    fontWeight: '600'
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  responseTime: {
    fontSize: 11
  },
  userQuery: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  toolName: {
    fontSize: 12,
    fontWeight: '600'
  },
  resultSummary: {
    marginBottom: 8
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  resultText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  section: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  codeBlock: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16
  },
  metadata: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  metadataText: {
    fontSize: 10
  }
});
