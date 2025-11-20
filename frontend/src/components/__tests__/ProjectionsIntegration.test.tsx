/**
 * Tests for ProjectionsIntegration component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectionsIntegration } from '../common/ProjectionsIntegration';
import { useProjectionsStore } from '../../store/useProjectionsStore';
import { useToastStore } from '../../store/useToastStore';
import {
  importProjectionsFromCSV,
  importProjectionsFromExcel,
  autoPopulateInflowFromProjections,
  getSavingsProgress,
} from '../../utils/projectionsIntegration';

// Mock dependencies
vi.mock('../../store/useProjectionsStore');
vi.mock('../../store/useToastStore');
vi.mock('../../utils/projectionsIntegration');

describe('ProjectionsIntegration', () => {
  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();
  const mockImportProjections = vi.fn();
  const mockClearAll = vi.fn();
  const mockSetProjection = vi.fn();
  const mockClearProjection = vi.fn();

  const mockProjections = [
    {
      monthId: '2024-01',
      inflowTotal: 100000,
      savingsTarget: 20000,
      lastUpdated: '2024-01-01T00:00:00Z',
    },
    {
      monthId: '2024-02',
      inflowTotal: 110000,
      savingsTarget: 25000,
      lastUpdated: '2024-02-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useToastStore).mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    } as any);

    vi.mocked(useProjectionsStore).mockReturnValue({
      projections: mockProjections,
      importProjections: mockImportProjections,
      clearAll: mockClearAll,
      setProjection: mockSetProjection,
      clearProjection: mockClearProjection,
      getProjection: vi.fn((id: string) => mockProjections.find((p) => p.monthId === id)),
      getInflowTotal: vi.fn((id: string) => {
        const proj = mockProjections.find((p) => p.monthId === id);
        return proj?.inflowTotal ?? null;
      }),
      getSavingsTarget: vi.fn((id: string) => {
        const proj = mockProjections.find((p) => p.monthId === id);
        return proj?.savingsTarget ?? null;
      }),
    } as any);

    vi.mocked(getSavingsProgress).mockReturnValue({
      target: 20000,
      actual: 15000,
      progress: 75,
    });
  });

  describe('Rendering', () => {
    it('should render projections table', () => {
      render(<ProjectionsIntegration />);

      expect(screen.getByText(/projections integration/i)).toBeInTheDocument();
      // Check for month display (formatted as "Jan 2024" etc)
      expect(screen.getByText(/jan/i)).toBeInTheDocument();
    });

    it('should display projection data correctly', () => {
      render(<ProjectionsIntegration />);

      // Check that inflow totals are displayed (formatted currency)
      expect(screen.getByText(/1,00,000/i)).toBeInTheDocument();
    });

    it('should display savings progress', () => {
      render(<ProjectionsIntegration />);

      // Progress should be displayed (75% in mock, formatted as "75" or "75%")
      // The component displays progress.toFixed(0) + "%"
      // There are multiple rows, so use getAllByText
      const progressTexts = screen.getAllByText(/75/i);
      expect(progressTexts.length).toBeGreaterThan(0);
    });

    it('should show empty state when no projections', () => {
      vi.mocked(useProjectionsStore).mockReturnValue({
        projections: [],
        importProjections: mockImportProjections,
        clearAll: mockClearAll,
        setProjection: mockSetProjection,
        clearProjection: mockClearProjection,
        getProjection: vi.fn(),
        getInflowTotal: vi.fn(),
        getSavingsTarget: vi.fn(),
      } as any);

      render(<ProjectionsIntegration />);

      expect(screen.getByText(/no projections imported/i)).toBeInTheDocument();
    });
  });

  describe('CSV Import', () => {
    it('should import CSV file successfully', async () => {
      const user = userEvent.setup();
      const csvContent = 'Month,Inflow Total,Savings Target\n2024-03,120000,30000';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      vi.mocked(importProjectionsFromCSV).mockResolvedValue({
        projections: [
          {
            month: '2024-03',
            inflowTotal: 120000,
            savingsTarget: 30000,
          },
        ],
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          duplicateMonths: [],
          invalidRows: [],
          validRows: 1,
        },
      });

      render(<ProjectionsIntegration />);

      // Open import dialog
      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);

      // Find file input (hidden)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Upload file
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(importProjectionsFromCSV).toHaveBeenCalledWith(file);
        expect(mockImportProjections).toHaveBeenCalled();
      });
    });

    it('should show error on import failure', async () => {
      const user = userEvent.setup();
      const file = new File([''], 'test.csv', { type: 'text/csv' });

      vi.mocked(importProjectionsFromCSV).mockResolvedValue({
        projections: [],
        validation: {
          isValid: false,
          errors: ['Invalid month format'],
          warnings: [],
          duplicateMonths: [],
          invalidRows: [2],
          validRows: 0,
        },
      });

      render(<ProjectionsIntegration />);

      // Open import dialog
      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);

      // Find file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Import failed'));
      });
    });

    it('should show warnings for duplicate months', async () => {
      const user = userEvent.setup();
      const file = new File([''], 'test.csv', { type: 'text/csv' });

      vi.mocked(importProjectionsFromCSV).mockResolvedValue({
        projections: [
          {
            month: '2024-01',
            inflowTotal: 120000,
            savingsTarget: 30000,
          },
        ],
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          duplicateMonths: ['2024-01'],
          invalidRows: [],
          validRows: 1,
        },
      });

      render(<ProjectionsIntegration />);

      // Open import dialog
      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);

      // Find file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Duplicate months'));
      });
    });
  });

  describe('Excel Import', () => {
    it('should import Excel file successfully', async () => {
      const user = userEvent.setup();
      const file = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      vi.mocked(importProjectionsFromExcel).mockResolvedValue({
        projections: [
          {
            month: '2024-03',
            inflowTotal: 120000,
            savingsTarget: 30000,
          },
        ],
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          duplicateMonths: [],
          invalidRows: [],
          validRows: 1,
        },
      });

      render(<ProjectionsIntegration />);

      // Open import dialog
      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);

      // Find file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(importProjectionsFromExcel).toHaveBeenCalledWith(file);
        expect(mockImportProjections).toHaveBeenCalled();
      });
    });

    it('should reject unsupported file format', async () => {
      const user = userEvent.setup();
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });

      render(<ProjectionsIntegration />);

      // Open import dialog
      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);

      // Wait for dialog to open - use getAllByText since there might be multiple matches
      await waitFor(() => {
        const dialogTitles = screen.getAllByText(/import projections/i);
        expect(dialogTitles.length).toBeGreaterThan(0);
      });

      // Find file input (hidden)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Simulate file selection by creating a proper change event
      // The component checks file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      // Since test.pdf doesn't match, it should show error
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
        configurable: true,
      });

      // Create and dispatch change event
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Unsupported file format'));
      }, { timeout: 3000 });
    });
  });

  describe('Auto-Populate Inflow', () => {
    it('should call autoPopulateInflowFromProjections when button clicked', async () => {
      const user = userEvent.setup();

      render(<ProjectionsIntegration />);

      // Find and click auto-populate button (icon button with aria-label)
      const buttons = screen.getAllByRole('button', { name: /auto-populate inflow/i });
      if (buttons.length > 0) {
        await user.click(buttons[0]);

        await waitFor(() => {
          expect(autoPopulateInflowFromProjections).toHaveBeenCalledWith('2024-01');
        });
      }
    });
  });

  describe('Clear All', () => {
    it('should clear all projections when button clicked', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      window.confirm = vi.fn(() => true);

      render(<ProjectionsIntegration />);

      const clearButton = screen.getByRole('button', { name: /clear all projections/i });
      await user.click(clearButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockClearAll).toHaveBeenCalled();
    });

    it('should not clear if user cancels confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm to return false
      window.confirm = vi.fn(() => false);

      render(<ProjectionsIntegration />);

      const clearButton = screen.getByRole('button', { name: /clear all projections/i });
      await user.click(clearButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockClearAll).not.toHaveBeenCalled();
    });
  });
});

