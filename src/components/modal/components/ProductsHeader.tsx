/**
 * ProductsHeader.tsx
 *
 * Header del modal de gastos con preview del documento fuente.
 *
 * - Imagen: muestra preview visual (comportamiento original)
 * - PDF: muestra tarjeta informativa con nombre e icono
 *        (Image no puede renderizar PDFs en React Native)
 */
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { logger } from '~/utils/logger';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SourceType = 'image' | 'pdf';

type ProductsHeaderProps = {
  title: string;
  count: number;
  imageUri?: string | null;
  sourceType?: SourceType; // nuevo — indica si el uri es imagen o PDF
  onClose?: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPdfUri(uri: string): boolean {
  return uri.endsWith('.pdf') || uri.includes('ocr_pdf_');
}

function extractPdfName(uri: string): string {
  // Intenta extraer el nombre del archivo del path
  const parts = uri.split('/');
  const last = parts[parts.length - 1];
  // Quitar timestamp del nombre generado internamente (ocr_pdf_1234567890.pdf)
  if (last.startsWith('ocr_pdf_')) return 'Factura PDF';
  return last || 'Documento PDF';
}

// ─── Componente ───────────────────────────────────────────────────────────────

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  title,
  count,
  imageUri,
  sourceType,
  onClose
}) => {
  // Detectar tipo de fuente: prop explícita o inferida del URI
  const resolvedSourceType: SourceType =
    sourceType ?? (imageUri && isPdfUri(imageUri) ? 'pdf' : 'image');

  const isPdf = resolvedSourceType === 'pdf';

  return (
    <View style={styles.container}>
      {/* ── Fila de cabecera ── */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rightContainer}>
          <Text style={styles.countText}>
            {count} {count === 1 ? 'producto' : 'productos'}
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Preview del documento fuente ── */}
      {imageUri && (isPdf ? <PdfPreview uri={imageUri} /> : <ImagePreview uri={imageUri} />)}
    </View>
  );
};

// ─── Sub-componente: preview de imagen ────────────────────────────────────────

const ImagePreview: React.FC<{ uri: string }> = ({ uri }) => (
  <View style={styles.previewContainer}>
    <Image
      source={{ uri }}
      style={styles.image}
      resizeMode="contain"
      onError={(e) => logger.error('Error loading image:', e.nativeEvent.error)}
    />
  </View>
);

// ─── Sub-componente: preview de PDF ──────────────────────────────────────────

const PdfPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const name = extractPdfName(uri);

  return (
    <View style={styles.pdfPreviewContainer}>
      <Icon name="file-pdf-o" type="font-awesome" size={36} color="#e53935" />
      <View style={styles.pdfInfo}>
        <Text style={styles.pdfName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.pdfSubtitle}>Factura electrónica · PDF procesado con OCR</Text>
      </View>
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16
  },
  countText: {
    color: '#555',
    fontSize: 13
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  closeButton: {
    marginLeft: 10
  },
  // Preview imagen (comportamiento original)
  previewContainer: {
    height: 200,
    width: '100%',
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  // Preview PDF
  pdfPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#fff3f3',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    gap: 12
  },
  pdfInfo: {
    flex: 1
  },
  pdfName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  pdfSubtitle: {
    fontSize: 12,
    color: '#888'
  }
});

export default ProductsHeader;
