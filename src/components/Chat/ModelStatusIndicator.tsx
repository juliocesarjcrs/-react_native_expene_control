import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCurrentModel } from '~/services/aiConfigService';
import { useThemeColors } from '~/customHooks/useThemeColors';

type CurrentModel = Awaited<ReturnType<typeof getCurrentModel>>;

export const ModelStatusIndicator = () => {
  const colors = useThemeColors();
  const [model, setModel] = useState<CurrentModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        const data = await getCurrentModel();
        if (isMounted) setModel(data);
      } catch {
        // Si falla, model queda en null y se muestra "Modelo no disponible"
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Text style={{ color: colors.TEXT_SECONDARY }}>Cargando...</Text>;
  }

  if (!model) {
    return <Text style={{ color: colors.TEXT_SECONDARY }}>Modelo no disponible</Text>;
  }

  const healthColor = model.health?.isHealthy ? colors.SUCCESS : colors.ERROR;
  const healthPercent = Math.round((model.health?.healthScore ?? 0) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
      <View style={[styles.indicator, { backgroundColor: healthColor }]} />
      <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
        {model.model?.name} - {healthPercent}%
      </Text>
      <Text style={[styles.responseTime, { color: colors.TEXT_SECONDARY }]}>
        Latencia: {model.health?.responseTime ?? 0}ms
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600'
  },
  responseTime: {
    fontSize: 12,
    marginLeft: 'auto'
  }
});
