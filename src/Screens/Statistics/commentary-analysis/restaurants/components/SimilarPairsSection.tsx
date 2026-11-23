import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Components
import { SectionHeader } from '../../products/components/shared/SectionHeader';
import { InfoBox } from '../../products/components/shared/InfoBox';

// Types
import { RestaurantSimilarPair } from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface SimilarPairsSectionProps {
  pairs: RestaurantSimilarPair[];
}

/** Aviso (no fusiona nada): se corrige editando el comentario. */
export function SimilarPairsSection({ pairs }: SimilarPairsSectionProps): React.JSX.Element | null {
  const colors = useThemeColors();

  if (pairs.length === 0) return null;

  return (
    <View>
      <SectionHeader
        title="Posibles duplicados"
        count={pairs.length}
        icon="alert-circle-outline"
        iconColor={colors.WARNING}
      />
      <InfoBox
        type="warning"
        icon="alert"
        text="Nombres casi iguales. Si son el mismo, edita el comentario para escribirlo igual."
        compact
      />
      {pairs.map((pair) => (
        <Text
          key={`${pair.keyA}-${pair.keyB}`}
          style={[styles.pair, { color: colors.TEXT_PRIMARY }]}
        >
          {pair.labelA} ({pair.visitsA}) ≈ {pair.labelB} ({pair.visitsB})
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { fontSize: SMALL + 1, marginBottom: 8, paddingLeft: 4 }
});
