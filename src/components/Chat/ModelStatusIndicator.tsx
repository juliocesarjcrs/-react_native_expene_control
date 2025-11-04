import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCurrentModel } from '~/services/aiConfigService';

export const ModelStatusIndicator = () => {
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const data = await getCurrentModel();
        setModel(data);
      } catch (error) {
        console.error('Error loading model:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModel();
    // Recargar cada 5 minutos
    // const interval = setInterval(loadModel, 5 * 60 * 1000);
    // return () => clearInterval(interval);
  }, []);

  if (loading) return <Text>Cargando...</Text>;

  const isHealthy = model?.health?.isHealthy;
  const healthColor = isHealthy ? '#10b981' : '#ef4444';

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: healthColor }]} />
      <Text style={styles.label}>
        {model?.model?.name} - {model?.health?.healthScore.toFixed(2)}%
      </Text>
      <Text style={styles.responseTime}>Latencia: {model?.health?.responseTime}ms</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f3f4f6',
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
    color: '#6b7280',
    marginLeft: 'auto'
  }
});
