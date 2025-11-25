import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

type OnboardingState = {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setCurrentStep: (step: number) => void;
  resetOnboarding: () => void;
};

const storage = getLocalforageStorage('onboarding');

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set) => ({
        hasCompletedOnboarding: false,
        currentStep: 0,
        setHasCompletedOnboarding: (completed) => {
          set({ hasCompletedOnboarding: completed });
        },
        setCurrentStep: (step) => {
          set({ currentStep: step });
        },
        resetOnboarding: () => {
          set({ hasCompletedOnboarding: false, currentStep: 0 });
        },
      }),
      {
        name: 'onboarding',
        storage,
        version: 1,
      },
    ),
  ),
);

