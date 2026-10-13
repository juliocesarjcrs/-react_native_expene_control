import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';
import { DateFormat, NumberFormat } from '~/utils/Helpers';
import { formatPrice } from '../../utils/formatters';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL, MEDIUM } from '~/styles/fonts';

interface PurchaseDetailViewProps {
  purchase: ProductPrice;
}

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.BORDER }]}>
      <Text style={[styles.infoLabel, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.TEXT_PRIMARY }]}>{value}</Text>
    </View>
  );
};

export const PurchaseDetailView: React.FC<PurchaseDetailViewProps> = ({ purchase }) => {
  const colors = useThemeColors();

  const hasDiscount = Boolean(purchase.discountPercent && purchase.originalPricePerKg);
  const savings = purchase.originalPricePerKg
    ? Math.round((purchase.originalPricePerKg - purchase.pricePerKg) * purchase.quantity)
    : 0;

  return (
    <View style={styles.container}>
      {/* Producto */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>Producto</Text>
        <Text style={[styles.productName, { color: colors.TEXT_PRIMARY }]}>{purchase.product}</Text>
      </View>

      {/* Detalles de la compra */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>Detalles</Text>
        <InfoRow label="Fecha" value={DateFormat(purchase.date, 'DD MMMM YYYY')} />
        <InfoRow label="Cantidad" value={`${purchase.quantity} ${purchase.unit || 'kg'}`} />
        <InfoRow label="Precio por unidad" value={formatPrice(purchase.pricePerKg, purchase)} />
        <InfoRow label="Costo total" value={NumberFormat(purchase.cost)} />
        {purchase.store && <InfoRow label="Tienda" value={purchase.store} />}
      </View>

      {/* Descuento si aplica */}
      {hasDiscount && purchase.originalPricePerKg && (
        <View
          style={[
            styles.section,
            styles.discountSection,
            { backgroundColor: colors.SUCCESS + '15' }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.SUCCESS }]}>Descuento Aplicado</Text>
          <InfoRow
            label="Precio original"
            value={formatPrice(purchase.originalPricePerKg, purchase)}
          />
          <InfoRow label="Descuento" value={`-${purchase.discountPercent}%`} />
          <InfoRow label="Precio final" value={formatPrice(purchase.pricePerKg, purchase)} />
          <View style={[styles.savingsBadge, { backgroundColor: colors.SUCCESS }]}>
            <Text style={[styles.savingsText, { color: colors.WHITE }]}>
              Ahorraste {NumberFormat(savings)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: SMALL,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12
  },
  productName: {
    fontSize: MEDIUM + 4,
    fontWeight: '700'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  infoLabel: {
    fontSize: SMALL,
    fontWeight: '500'
  },
  infoValue: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  discountSection: {
    padding: 16,
    borderRadius: 8
  },
  savingsBadge: {
    marginTop: 12,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  savingsText: {
    fontSize: SMALL,
    fontWeight: '700'
  }
});
