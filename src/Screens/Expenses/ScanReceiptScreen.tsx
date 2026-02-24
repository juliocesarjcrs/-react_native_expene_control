import React, { useState } from 'react';
import { View } from 'react-native';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import ReceiptScanner from '../../components/ocr/ReceiptScanner';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

const ScanReceiptScreen: React.FC = () => {
  const config = screenConfigs.scanInvoiceExpense;
  const colors = useThemeColors();
  const [, setExtracted] = useState<{
    price: string;
    category?: string;
    subcategory?: string;
    rawText: string;
  } | null>(null);

  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <ReceiptScanner onExtractedData={setExtracted} />
    </View>
  );
};

export default ScanReceiptScreen;
