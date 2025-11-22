/**
 * Store for managing customizable dashboard widgets
 * Allows users to show/hide and reorder dashboard widgets
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export type WidgetId =
  | 'summary-cards'
  | 'due-soon-reminders'
  | 'savings-trend-chart'
  | 'budget-vs-actual'
  | 'income-expense-chart'
  | 'category-breakdown';

export interface DashboardWidget {
  id: WidgetId;
  enabled: boolean;
  order: number;
  size?: 'small' | 'medium' | 'large';
}

type DashboardWidgetsState = {
  widgets: DashboardWidget[];
  /**
   * Initialize widgets with default configuration
   */
  initializeWidgets: () => void;
  /**
   * Toggle widget visibility
   */
  toggleWidget: (id: WidgetId) => void;
  /**
   * Update widget order
   */
  updateWidgetOrder: (id: WidgetId, newOrder: number) => void;
  /**
   * Update widget size
   */
  updateWidgetSize: (id: WidgetId, size: DashboardWidget['size']) => void;
  /**
   * Get enabled widgets sorted by order
   */
  getEnabledWidgets: () => DashboardWidget[];
  /**
   * Reset to default configuration
   */
  resetToDefaults: () => void;
};

const storage = getLocalforageStorage('dashboard-widgets');

const defaultWidgets: DashboardWidget[] = [
  { id: 'summary-cards', enabled: true, order: 0, size: 'medium' },
  { id: 'due-soon-reminders', enabled: true, order: 1, size: 'medium' },
  { id: 'savings-trend-chart', enabled: true, order: 2, size: 'large' },
  { id: 'budget-vs-actual', enabled: true, order: 3, size: 'large' },
  { id: 'income-expense-chart', enabled: false, order: 4, size: 'medium' },
  { id: 'category-breakdown', enabled: false, order: 5, size: 'medium' },
];

export const useDashboardWidgetsStore = create<DashboardWidgetsState>()(
  devtools(
    persist(
      (set, get) => ({
        widgets: defaultWidgets,
        initializeWidgets: () => {
          const current = get().widgets;
          if (current.length === 0) {
            set({ widgets: defaultWidgets });
          } else {
            // Merge with defaults to add any new widgets
            const existingIds = new Set(current.map((w) => w.id));
            const newWidgets = defaultWidgets.filter((w) => !existingIds.has(w.id));
            set({ widgets: [...current, ...newWidgets] });
          }
        },
        toggleWidget: (id) => {
          set((state) => ({
            widgets: state.widgets.map((widget) =>
              widget.id === id ? { ...widget, enabled: !widget.enabled } : widget,
            ),
          }));
        },
        updateWidgetOrder: (id, newOrder) => {
          const current = get().widgets;
          const widget = current.find((w) => w.id === id);
          if (!widget) return;

          // Reorder widgets
          const otherWidgets = current.filter((w) => w.id !== id);
          const updated = [...otherWidgets, { ...widget, order: newOrder }].sort((a, b) => a.order - b.order);

          // Renumber orders to be sequential
          const renumbered = updated.map((w, index) => ({ ...w, order: index }));
          set({ widgets: renumbered });
        },
        updateWidgetSize: (id, size) => {
          set((state) => ({
            widgets: state.widgets.map((widget) => (widget.id === id ? { ...widget, size } : widget)),
          }));
        },
        getEnabledWidgets: () => {
          return get()
            .widgets.filter((w) => w.enabled)
            .sort((a, b) => a.order - b.order);
        },
        resetToDefaults: () => {
          set({ widgets: defaultWidgets });
        },
      }),
      {
        name: 'dashboard-widgets',
        storage,
        version: 1,
      },
    ),
  ),
);

