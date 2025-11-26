import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string; // ISO date string
  currentAmount: number;
  monthlyContribution?: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface ForecastScenario {
  id: string;
  name: string;
  description?: string;
  assumptions: {
    incomeMultiplier?: number; // e.g., 1.1 for 10% increase
    expenseMultiplier?: number; // e.g., 0.9 for 10% decrease
    savingsMultiplier?: number;
    incomeAdjustments?: Array<{ category: string; amount: number }>;
    expenseAdjustments?: Array<{ category: string; amount: number }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CashFlowProjection {
  monthId: string; // Format: "YYYY-MM"
  projectedIncome: number;
  projectedExpenses: number;
  projectedSavings: number;
  projectedBalance: number; // Cumulative balance
  confidence: 'high' | 'medium' | 'low'; // Based on data availability
}

export interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  recommendedSpending: number;
  savingsPotential: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

type ForecastingState = {
  savingsGoals: SavingsGoal[];
  scenarios: ForecastScenario[];
  projections: CashFlowProjection[];
  budgetRecommendations: BudgetRecommendation[];
  
  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'status'>) => string;
  updateSavingsGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => void;
  deleteSavingsGoal: (id: string) => void;
  getSavingsGoal: (id: string) => SavingsGoal | undefined;
  getActiveSavingsGoals: () => SavingsGoal[];
  
  // Scenarios
  addScenario: (scenario: Omit<ForecastScenario, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateScenario: (id: string, updates: Partial<Omit<ForecastScenario, 'id' | 'createdAt'>>) => void;
  deleteScenario: (id: string) => void;
  getScenario: (id: string) => ForecastScenario | undefined;
  duplicateScenario: (id: string, newName: string) => string;
  
  // Projections (computed, not stored)
  setProjections: (projections: CashFlowProjection[]) => void;
  clearProjections: () => void;
  
  // Budget Recommendations (computed, not stored)
  setBudgetRecommendations: (recommendations: BudgetRecommendation[]) => void;
  clearBudgetRecommendations: () => void;
};

const storage = getLocalforageStorage('forecasting');

export const useForecastingStore = create<ForecastingState>()(
  devtools(
    persist(
      (set, get) => ({
        savingsGoals: [],
        scenarios: [],
        projections: [],
        budgetRecommendations: [],

        // Savings Goals
        addSavingsGoal: (goal) => {
          const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `goal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          
          const newGoal: SavingsGoal = {
            ...goal,
            id,
            currentAmount: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          set((state) => ({
            savingsGoals: [...state.savingsGoals, newGoal],
          }));
          
          return id;
        },

        updateSavingsGoal: (id, updates) => {
          set((state) => ({
            savingsGoals: state.savingsGoals.map((goal) =>
              goal.id === id
                ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
                : goal
            ),
          }));
        },

        deleteSavingsGoal: (id) => {
          set((state) => ({
            savingsGoals: state.savingsGoals.filter((goal) => goal.id !== id),
          }));
        },

        getSavingsGoal: (id) => {
          return get().savingsGoals.find((goal) => goal.id === id);
        },

        getActiveSavingsGoals: () => {
          return get().savingsGoals.filter((goal) => goal.status === 'active');
        },

        // Scenarios
        addScenario: (scenario) => {
          const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `scenario_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          
          const newScenario: ForecastScenario = {
            ...scenario,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          set((state) => ({
            scenarios: [...state.scenarios, newScenario],
          }));
          
          return id;
        },

        updateScenario: (id, updates) => {
          set((state) => ({
            scenarios: state.scenarios.map((scenario) =>
              scenario.id === id
                ? { ...scenario, ...updates, updatedAt: new Date().toISOString() }
                : scenario
            ),
          }));
        },

        deleteScenario: (id) => {
          set((state) => ({
            scenarios: state.scenarios.filter((scenario) => scenario.id !== id),
          }));
        },

        getScenario: (id) => {
          return get().scenarios.find((scenario) => scenario.id === id);
        },

        duplicateScenario: (id, newName) => {
          const scenario = get().getScenario(id);
          if (!scenario) {
            throw new Error('Scenario not found');
          }
          
          return get().addScenario({
            ...scenario,
            name: newName,
            description: scenario.description ? `${scenario.description} (Copy)` : undefined,
          });
        },

        // Projections
        setProjections: (projections) => {
          set({ projections });
        },

        clearProjections: () => {
          set({ projections: [] });
        },

        // Budget Recommendations
        setBudgetRecommendations: (recommendations) => {
          set({ budgetRecommendations: recommendations });
        },

        clearBudgetRecommendations: () => {
          set({ budgetRecommendations: [] });
        },
      }),
      {
        name: 'forecasting',
        storage,
        version: 1,
      }
    )
  )
);

