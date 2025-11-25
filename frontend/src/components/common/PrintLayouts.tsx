import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  FormGroup,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

export type PrintOrientation = 'portrait' | 'landscape';
export type PrintLayout = 'compact' | 'detailed' | 'minimal' | 'custom';
export type PrintSize = 'a4' | 'letter' | 'legal';

interface PrintLayoutsProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

interface PrintLayoutOptions {
  orientation: PrintOrientation;
  layout: PrintLayout;
  size: PrintSize;
  showHeaders: boolean;
  showFooters: boolean;
  showPageNumbers: boolean;
  showDate: boolean;
  showMetadata: boolean;
  compactMode: boolean;
  hideCharts: boolean;
  hideEmptySections: boolean;
}

export function PrintLayouts({ open, onClose, children, title = 'Print Layout' }: PrintLayoutsProps) {
  const [options, setOptions] = useState<PrintLayoutOptions>({
    orientation: 'portrait',
    layout: 'detailed',
    size: 'a4',
    showHeaders: true,
    showFooters: true,
    showPageNumbers: true,
    showDate: true,
    showMetadata: true,
    compactMode: false,
    hideCharts: false,
    hideEmptySections: false,
  });

  const previewRef = useRef<HTMLDivElement>(null);

  const handleOptionChange = <K extends keyof PrintLayoutOptions>(
    key: K,
    value: PrintLayoutOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrint = () => {
    if (!previewRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to use print preview');
      return;
    }

    const content = previewRef.current.innerHTML;
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    // Generate custom print styles based on options
    const customStyles = `
      @page {
        size: ${options.size} ${options.orientation};
        margin: ${options.compactMode ? '10mm' : '20mm'};
      }
      @media print {
        body {
          font-size: ${options.compactMode ? '10px' : '12px'};
        }
        .print-header {
          display: ${options.showHeaders ? 'block' : 'none'} !important;
        }
        .print-footer {
          display: ${options.showFooters ? 'block' : 'none'} !important;
        }
        .print-metadata {
          display: ${options.showMetadata ? 'block' : 'none'} !important;
        }
        .print-date {
          display: ${options.showDate ? 'block' : 'none'} !important;
        }
        .print-page-number::after {
          content: ${options.showPageNumbers ? 'counter(page)' : 'none'};
        }
        .recharts-wrapper {
          display: ${options.hideCharts ? 'none' : 'block'} !important;
        }
        .empty-section {
          display: ${options.hideEmptySections ? 'none' : 'block'} !important;
        }
        .MuiPaper-root {
          padding: ${options.compactMode ? '8px' : '16px'} !important;
          margin-bottom: ${options.compactMode ? '8px' : '16px'} !important;
        }
        .MuiTableCell-root {
          padding: ${options.compactMode ? '4px 8px' : '8px 16px'} !important;
          font-size: ${options.compactMode ? '10px' : '12px'} !important;
        }
        .MuiTypography-h6 {
          font-size: ${options.compactMode ? '14px' : '18px'} !important;
        }
        .MuiTypography-h5 {
          font-size: ${options.compactMode ? '16px' : '20px'} !important;
        }
        .MuiTypography-h4 {
          font-size: ${options.compactMode ? '18px' : '24px'} !important;
        }
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            ${styles}
            ${customStyles}
            @media print {
              body { margin: 0; padding: 16px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 250);
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Custom Print Layout</span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
          {/* Options Panel */}
          <Box sx={{ flex: '0 0 300px', minWidth: 0 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Print Options</Typography>

              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={options.orientation}
                  onChange={(e) => handleOptionChange('orientation', e.target.value as PrintOrientation)}
                  label="Orientation"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Paper Size</InputLabel>
                <Select
                  value={options.size}
                  onChange={(e) => handleOptionChange('size', e.target.value as PrintSize)}
                  label="Paper Size"
                >
                  <MenuItem value="a4">A4</MenuItem>
                  <MenuItem value="letter">Letter</MenuItem>
                  <MenuItem value="legal">Legal</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Layout Style</InputLabel>
                <Select
                  value={options.layout}
                  onChange={(e) => handleOptionChange('layout', e.target.value as PrintLayout)}
                  label="Layout Style"
                >
                  <MenuItem value="compact">Compact</MenuItem>
                  <MenuItem value="detailed">Detailed</MenuItem>
                  <MenuItem value="minimal">Minimal</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>

              <Divider />

              <Typography variant="subtitle2">Display Options</Typography>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.showHeaders}
                      onChange={(e) => handleOptionChange('showHeaders', e.target.checked)}
                    />
                  }
                  label="Show Headers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.showFooters}
                      onChange={(e) => handleOptionChange('showFooters', e.target.checked)}
                    />
                  }
                  label="Show Footers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.showPageNumbers}
                      onChange={(e) => handleOptionChange('showPageNumbers', e.target.checked)}
                    />
                  }
                  label="Show Page Numbers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.showDate}
                      onChange={(e) => handleOptionChange('showDate', e.target.checked)}
                    />
                  }
                  label="Show Date"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.showMetadata}
                      onChange={(e) => handleOptionChange('showMetadata', e.target.checked)}
                    />
                  }
                  label="Show Metadata"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.compactMode}
                      onChange={(e) => handleOptionChange('compactMode', e.target.checked)}
                    />
                  }
                  label="Compact Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.hideCharts}
                      onChange={(e) => handleOptionChange('hideCharts', e.target.checked)}
                    />
                  }
                  label="Hide Charts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.hideEmptySections}
                      onChange={(e) => handleOptionChange('hideEmptySections', e.target.checked)}
                    />
                  }
                  label="Hide Empty Sections"
                />
              </FormGroup>
            </Stack>
          </Box>

          {/* Preview Panel */}
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Preview</Typography>
            <Box
              ref={previewRef}
              sx={{
                backgroundColor: 'white',
                color: 'black',
                p: 2,
                minHeight: '400px',
                border: '1px solid #ddd',
                borderRadius: 1,
                '@media print': {
                  backgroundColor: 'white',
                  color: 'black',
                },
              }}
            >
              {children}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print with Layout
        </Button>
      </DialogActions>
    </Dialog>
  );
}

