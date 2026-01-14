// ~/contexts/InvestmentComparisonContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  SavingsScenario,
  FuturePropertyScenario,
  ImmediateRentScenario,
  ScenarioType,
  UserProfile,
  RiskProfile,
  TimeHorizon,
  UserPriority
} from '~/shared/types/services/Investment-comparison.types';

// ============================================
// INTERFACE DEL CONTEXT
// ============================================

interface InvestmentComparisonState {
  userProfile: UserProfile;
  scenarios: {
    savings: SavingsScenario | null;
    futureProperty: FuturePropertyScenario | null;
    immediateRent: ImmediateRentScenario | null;
  };
}

interface InvestmentComparisonContextData {
  // Estado completo
  state: InvestmentComparisonState;

  // Funciones para actualizar perfil de usuario
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  // Funciones para guardar escenarios
  saveScenario: (type: ScenarioType, scenario: any) => void;

  // Función para obtener un escenario específico
  getScenario: (type: ScenarioType) => any;

  // Función para verificar si un escenario está configurado
  isScenarioConfigured: (type: ScenarioType) => boolean;

  // Función para limpiar un escenario específico
  clearScenario: (type: ScenarioType) => void;

  // Función para resetear todo
  clearAllScenarios: () => void;
}

// ============================================
// CONTEXT CREATION
// ============================================

const InvestmentComparisonContext = createContext<InvestmentComparisonContextData>(
  {} as InvestmentComparisonContextData
);

export const useInvestmentComparison = () => {
  const context = useContext(InvestmentComparisonContext);
  if (!context) {
    throw new Error('useInvestmentComparison must be used within InvestmentComparisonProvider');
  }
  return context;
};

// ============================================
// PROVIDER COMPONENT
// ============================================

interface Props {
  children: ReactNode;
}

export const InvestmentComparisonProvider: React.FC<Props> = ({ children }) => {
  const [state, setState] = useState<InvestmentComparisonState>({
    userProfile: {
      riskProfile: RiskProfile.MODERATE,
      timeHorizon: TimeHorizon.MEDIUM,
      priorities: [UserPriority.PROFITABILITY, UserPriority.LIQUIDITY]
    },
    scenarios: {
      savings: null,
      futureProperty: null,
      immediateRent: null
    }
  });

  // ============================================
  // FUNCIONES DEL CONTEXT
  // ============================================

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        ...profile
      }
    }));
  };

  const saveScenario = (type: ScenarioType, scenario: any) => {
    setState((prev) => {
      const newScenarios = { ...prev.scenarios };

      switch (type) {
        case ScenarioType.SAVINGS:
          newScenarios.savings = scenario as SavingsScenario;
          console.log('✅ Escenario de Ahorro guardado:', scenario.name);
          break;
        case ScenarioType.FUTURE_PROPERTY:
          newScenarios.futureProperty = scenario as FuturePropertyScenario;
          console.log('✅ Escenario Vivienda a Futuro guardado:', scenario.name);
          break;
        case ScenarioType.IMMEDIATE_RENT:
          newScenarios.immediateRent = scenario as ImmediateRentScenario;
          console.log('✅ Escenario Compra Inmediata guardado:', scenario.name);
          break;
      }

      return {
        ...prev,
        scenarios: newScenarios
      };
    });
  };

  const getScenario = (type: ScenarioType): any => {
    switch (type) {
      case ScenarioType.SAVINGS:
        return state.scenarios.savings;
      case ScenarioType.FUTURE_PROPERTY:
        return state.scenarios.futureProperty;
      case ScenarioType.IMMEDIATE_RENT:
        return state.scenarios.immediateRent;
      default:
        return null;
    }
  };

  const isScenarioConfigured = (type: ScenarioType): boolean => {
    const scenario = getScenario(type);
    return scenario !== null;
  };

  const clearScenario = (type: ScenarioType) => {
    setState((prev) => {
      const newScenarios = { ...prev.scenarios };

      switch (type) {
        case ScenarioType.SAVINGS:
          newScenarios.savings = null;
          break;
        case ScenarioType.FUTURE_PROPERTY:
          newScenarios.futureProperty = null;
          break;
        case ScenarioType.IMMEDIATE_RENT:
          newScenarios.immediateRent = null;
          break;
      }

      console.log('🗑️ Escenario eliminado:', type);
      return {
        ...prev,
        scenarios: newScenarios
      };
    });
  };

  const clearAllScenarios = () => {
    setState((prev) => ({
      ...prev,
      scenarios: {
        savings: null,
        futureProperty: null,
        immediateRent: null
      }
    }));
    console.log('🔄 Todos los escenarios eliminados');
  };

  // ============================================
  // RENDER PROVIDER
  // ============================================

  return (
    <InvestmentComparisonContext.Provider
      value={{
        state,
        updateUserProfile,
        saveScenario,
        getScenario,
        isScenarioConfigured,
        clearScenario,
        clearAllScenarios
      }}
    >
      {children}
    </InvestmentComparisonContext.Provider>
  );
};
