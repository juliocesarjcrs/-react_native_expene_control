import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { FeatureFlagsProvider, useFeatureFlags, useFeatureFlag } from '../FeatureFlagsContext';
import * as featureFlagsService from '~/services/featureFlagsService';
import * as showErrorUtil from '~/utils/showError';
import { FeatureFlag } from '~/shared/types/models/feature-flags.type';

// ============================================
// MOCKS
// ============================================

jest.mock('~/services/featureFlagsService');
jest.mock('~/utils/showError');

const mockedGetMyFeatures = featureFlagsService.getMyFeatures as jest.MockedFunction<
  typeof featureFlagsService.getMyFeatures
>;
const mockedCanAccessFeatureAPI = featureFlagsService.canAccessFeature as jest.MockedFunction<
  typeof featureFlagsService.canAccessFeature
>;
const mockedShowError = showErrorUtil.showError as jest.MockedFunction<
  typeof showErrorUtil.showError
>;

// ============================================
// TEST DATA
// ============================================

// Features que el backend devuelve (solo habilitadas y accesibles)
const mockFeatures: FeatureFlag[] = [
  {
    id: 1,
    featureKey: 'chatbot',
    featureName: 'Chatbot Feature',
    description: 'AI Chatbot functionality',
    isEnabled: 1,
    requiresRole: null,
    defaultForUsers: 1,
    metadata: null,
    updatedBy: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 2,
    featureKey: 'invoice_scanner',
    featureName: 'Invoice Scanner',
    description: 'Scan and process invoices',
    isEnabled: 1,
    requiresRole: null,
    defaultForUsers: 1,
    metadata: null,
    updatedBy: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];


// ============================================
// HELPER: Wrapper Component
// ============================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
);

// ============================================
// TESTS
// ============================================

describe('FeatureFlagsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // PROVIDER TESTS
  // ==========================================

  describe('FeatureFlagsProvider', () => {
    it('should load features on mount', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedGetMyFeatures).toHaveBeenCalledTimes(1);
      expect(result.current.features).toEqual(mockFeatures);
    });

    it('should handle error when loading features', async () => {
      const error = new Error('Failed to load features');
      mockedGetMyFeatures.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedShowError).toHaveBeenCalledWith(error);
      expect(result.current.features).toEqual([]);
    });
  });

  // ==========================================
  // isFeatureEnabled TESTS
  // ==========================================

  describe('isFeatureEnabled', () => {
    it('should return true for enabled feature (chatbot)', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const isEnabled = result.current.isFeatureEnabled('chatbot');
      expect(isEnabled).toBe(true);
    });

    it('should return true for enabled feature (invoice_scanner)', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const isEnabled = result.current.isFeatureEnabled('invoice_scanner');
      expect(isEnabled).toBe(true);
    });

    it('should return false for disabled feature', async () => {
      // getMyFeatures NO devuelve features deshabilitadas
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // disabled_feature no está en mockFeatures, por lo tanto retorna false
      const isEnabled = result.current.isFeatureEnabled('disabled_feature');
      expect(isEnabled).toBe(false);
    });

    it('should return false for non-existent feature', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const isEnabled = result.current.isFeatureEnabled('non_existent_feature');
      expect(isEnabled).toBe(false);
    });

    it('should work correctly when features list is empty', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const isEnabled = result.current.isFeatureEnabled('chatbot');
      expect(isEnabled).toBe(false);
    });
  });

  // ==========================================
  // canAccessFeature TESTS
  // ==========================================

  describe('canAccessFeature', () => {
    beforeEach(async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);
    });

    it('should return true when API allows access', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);
      mockedCanAccessFeatureAPI.mockResolvedValueOnce({
        featureKey: 'chatbot',
        canAccess: true
      });

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const canAccess = await result.current.canAccessFeature('chatbot');

      expect(mockedCanAccessFeatureAPI).toHaveBeenCalledWith('chatbot');
      expect(canAccess).toBe(true);
    });

    it('should return false when API denies access (chatbot scenario)', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);
      mockedCanAccessFeatureAPI.mockResolvedValueOnce({
        featureKey: 'chatbot',
        canAccess: false
      });

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const canAccess = await result.current.canAccessFeature('chatbot');

      expect(mockedCanAccessFeatureAPI).toHaveBeenCalledWith('chatbot');
      expect(canAccess).toBe(false);
    });

    it('should return false when API denies access for invoice_scanner', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);
      mockedCanAccessFeatureAPI.mockResolvedValueOnce({
        featureKey: 'invoice_scanner',
        canAccess: false
      });

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const canAccess = await result.current.canAccessFeature('invoice_scanner');

      expect(mockedCanAccessFeatureAPI).toHaveBeenCalledWith('invoice_scanner');
      expect(canAccess).toBe(false);
    });

    it('should handle API error and return false', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);
      const error = new Error('API Error');
      mockedCanAccessFeatureAPI.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const canAccess = await result.current.canAccessFeature('chatbot');

      expect(mockedShowError).toHaveBeenCalledWith(error);
      expect(canAccess).toBe(false);
    });
  });

  // ==========================================
  // refreshFeatures TESTS
  // ==========================================

  describe('refreshFeatures', () => {
    it('should reload features from API', async () => {
      mockedGetMyFeatures.mockResolvedValue(mockFeatures);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      // Esperar a que cargue la primera vez
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verificar que tenemos las features iniciales
      expect(result.current.features).toEqual(mockFeatures);
      expect(mockedGetMyFeatures).toHaveBeenCalledTimes(1);

      // Ejecutar refresh
      await act(async () => {
        await result.current.refreshFeatures();
      });

      // Esperar a que termine el loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verificar que se llamó 2 veces (mount + refresh)
      expect(mockedGetMyFeatures).toHaveBeenCalledTimes(2);
      
      // Las features siguen siendo las mismas (porque el mock retorna lo mismo)
      expect(result.current.features).toEqual(mockFeatures);
    });
  });

  // ==========================================
  // useFeatureFlags HOOK TESTS
  // ==========================================

  describe('useFeatureFlags hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFeatureFlags());
      }).toThrow('useFeatureFlags debe usarse dentro de FeatureFlagsProvider');

      consoleError.mockRestore();
    });

    it('should return context value when used inside provider', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('features');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('isFeatureEnabled');
      expect(result.current).toHaveProperty('canAccessFeature');
      expect(result.current).toHaveProperty('refreshFeatures');
    });
  });

  // ==========================================
  // useFeatureFlag HOOK TESTS
  // ==========================================

  describe('useFeatureFlag hook', () => {
    it('should return enabled state for chatbot feature', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlag('chatbot'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.feature).toEqual(mockFeatures[0]);
    });

    it('should return enabled state for invoice_scanner feature', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlag('invoice_scanner'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.feature).toEqual(mockFeatures[1]);
    });

    it('should return disabled state for disabled feature', async () => {
      // getMyFeatures NO devuelve features deshabilitadas
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlag('disabled_feature'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // La feature no está en la lista, por lo tanto isEnabled es false
      expect(result.current.isEnabled).toBe(false);
      // Y feature es undefined porque no está en la lista
      expect(result.current.feature).toBeUndefined();
    });

    it('should return false for non-existent feature', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);

      const { result } = renderHook(() => useFeatureFlag('non_existent'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.feature).toBeUndefined();
    });
  });

  // ==========================================
  // INTEGRATION TESTS - isFeatureEnabled vs canAccessFeature
  // ==========================================

  describe('isFeatureEnabled vs canAccessFeature integration', () => {
    it('should show difference: isFeatureEnabled returns true but canAccessFeature returns false', async () => {
      // Escenario: La feature está en la lista local (isEnabled=1)
      // pero el servidor dice que no tiene acceso (canAccess=false)
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);
      mockedCanAccessFeatureAPI.mockResolvedValueOnce({
        featureKey: 'chatbot',
        canAccess: false
      });

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // isFeatureEnabled: verificación local (rápida)
      const isEnabledLocally = result.current.isFeatureEnabled('chatbot');
      expect(isEnabledLocally).toBe(true);

      // canAccessFeature: verificación en servidor (real-time)
      const canAccessFromServer = await result.current.canAccessFeature('chatbot');
      expect(canAccessFromServer).toBe(false);

      // Esto demuestra la diferencia entre verificación local y servidor
      expect(isEnabledLocally).not.toBe(canAccessFromServer);
    });

    it('should handle invoice_scanner: enabled locally but denied by server', async () => {
      mockedGetMyFeatures.mockResolvedValueOnce(mockFeatures);
      mockedCanAccessFeatureAPI.mockResolvedValueOnce({
        featureKey: 'invoice_scanner',
        canAccess: false
      });

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const isEnabledLocally = result.current.isFeatureEnabled('invoice_scanner');
      expect(isEnabledLocally).toBe(true);

      const canAccessFromServer = await result.current.canAccessFeature('invoice_scanner');
      expect(canAccessFromServer).toBe(false);
    });
  });
});