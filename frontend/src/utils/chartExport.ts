/**
 * Chart Export Utilities
 * Provides functionality to export charts as images (PNG/SVG)
 */

import html2canvas from 'html2canvas';

/**
 * Export a chart element as PNG image
 * @param elementId - ID of the chart container element
 * @param filename - Optional filename (without extension)
 */
export async function exportChartAsPNG(elementId: string, filename?: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename ? `${filename}.png` : `chart-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
    throw error;
  }
}

/**
 * Export a chart element as SVG
 * Note: This works best with SVG-based charts (like Recharts)
 * @param elementId - ID of the chart container element
 * @param filename - Optional filename (without extension)
 */
export function exportChartAsSVG(elementId: string, filename?: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Find SVG element within the container
  const svgElement = element.querySelector('svg');
  if (!svgElement) {
    throw new Error('No SVG element found in chart container');
  }

  try {
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Get computed styles and apply them
    const styles = window.getComputedStyle(element);
    clonedSvg.setAttribute('style', `background-color: ${styles.backgroundColor || 'white'};`);

    // Serialize SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename ? `${filename}.svg` : `chart-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting chart as SVG:', error);
    throw error;
  }
}

/**
 * Export multiple charts as a combined image
 * @param elementIds - Array of chart container element IDs
 * @param filename - Optional filename (without extension)
 */
export async function exportMultipleChartsAsPNG(elementIds: string[], filename?: string): Promise<void> {
  const elements = elementIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  
  if (elements.length === 0) {
    throw new Error('No valid chart elements found');
  }

  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '16px';
    container.style.padding = '16px';
    container.style.backgroundColor = '#ffffff';
    
    // Clone elements
    elements.forEach((el) => {
      const clone = el.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
    });
    
    document.body.appendChild(container);
    
    // Export as image
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });
    
    // Cleanup
    document.body.removeChild(container);
    
    // Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename ? `${filename}.png` : `charts-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting multiple charts:', error);
    throw error;
  }
}

