import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AllocationTemplate } from '../types/templates';
import { getLocalforageStorage } from '../utils/storage';

type TemplatesState = {
  templates: AllocationTemplate[];
  saveTemplate: (template: Omit<AllocationTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
  updateTemplate: (id: string, updates: Partial<AllocationTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => AllocationTemplate | undefined;
  useTemplate: (id: string) => void;
};

const storage = getLocalforageStorage('allocation-templates');

export const useTemplatesStore = create<TemplatesState>()(
  devtools(
    persist(
      (set, get) => ({
        templates: [],
        saveTemplate: (templateData) => {
          const newTemplate: AllocationTemplate = {
            id:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `tpl_${Math.random().toString(36).slice(2)}`,
            ...templateData,
            createdAt: new Date().toISOString(),
            useCount: 0,
          };

          set((state) => ({
            templates: [...state.templates, newTemplate],
          }));
        },
        updateTemplate: (id, updates) =>
          set((state) => ({
            templates: state.templates.map((tpl) =>
              tpl.id === id ? { ...tpl, ...updates } : tpl,
            ),
          })),
        deleteTemplate: (id) =>
          set((state) => ({
            templates: state.templates.filter((tpl) => tpl.id !== id),
          })),
        getTemplate: (id) => get().templates.find((tpl) => tpl.id === id),
        useTemplate: (id) => {
          const template = get().templates.find((tpl) => tpl.id === id);
          if (template) {
            set((state) => ({
              templates: state.templates.map((tpl) =>
                tpl.id === id
                  ? { ...tpl, useCount: tpl.useCount + 1, lastUsed: new Date().toISOString() }
                  : tpl,
              ),
            }));
          }
        },
      }),
      {
        name: 'allocation-templates',
        storage,
      },
    ),
  ),
);

