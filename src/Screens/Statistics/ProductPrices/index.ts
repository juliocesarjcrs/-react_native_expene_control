// Hooks
export { useProductData } from './hooks/useProductData';
export { useProductExpansion } from './hooks/useProductExpansion';

// Components
export { ProductCard } from './components/ProductCard/ProductCard';
export { IncompleteCard } from './components/IncompleteCard/IncompleteCard';
export { PurchaseDetailModal } from './components/PurchaseDetailModal/PurchaseDetailModal';
export { SectionHeader } from './components/shared/SectionHeader';
export { StatsGrid } from './components/shared/StatsGrid';
export { EmptyState } from './components/shared/EmptyState';
export { InfoBox } from './components/shared/InfoBox';

// Types
export type {
  ProductSummary,
  GroupedProducts,
  PurchaseModalMode,
  PurchaseUpdateCallbacks
} from './types';

// Utils
export { formatPrice, getUnitLabel, normalizeSearchText } from './utils/formatters';
