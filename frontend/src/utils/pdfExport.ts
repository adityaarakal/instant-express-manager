/**
 * PDF Export Utilities
 * 
 * Provides utilities for exporting data to PDF format using jsPDF.
 * This module is lazy-loaded to reduce initial bundle size.
 * 
 * @module pdfExport
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExportOptions } from './dataExport';

/**
 * Exports a table of data to PDF format
 */
export async function exportTableToPDF<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {},
): Promise<void> {
  if (data.length === 0) {
    throw new Error('Cannot export empty data to PDF');
  }

  const { filename = 'export.pdf', headers, excludeFields = [], includeFields } = options;

  // Get field names
  const allFields = Object.keys(data[0]);
  const fields = includeFields || allFields.filter((field) => !excludeFields.includes(field));

  // Create header row with custom mapping
  const headerRow = fields.map((field) => headers?.[field] || field);

  // Convert data to rows
  const rows = data.map((item) => fields.map((field) => {
    const value = item[field];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }));

  // Create PDF
  const doc = new jsPDF();
  const margin = 14;

  // Add title if provided
  if (options.filename && options.filename !== 'export.pdf') {
    doc.setFontSize(16);
    const title = options.filename.replace('.pdf', '');
    doc.text(title, margin, 20);
  }

  // Add table
  autoTable(doc, {
    head: [headerRow],
    body: rows,
    startY: options.filename && options.filename !== 'export.pdf' ? 30 : 20,
    margin: { top: 20, right: margin, bottom: 20, left: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Save PDF
  doc.save(filename);
}

