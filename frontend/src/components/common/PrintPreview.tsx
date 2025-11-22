import { useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

interface PrintPreviewProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

/**
 * Print Preview Dialog Component
 * Shows a preview of how the content will look when printed
 */
export function PrintPreview({ open, onClose, children, title = 'Print Preview' }: PrintPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!previewRef.current) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to use print preview');
      return;
    }

    // Get the content to print
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            ${styles}
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

    // Wait for content to load, then print
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
          <span>{title}</span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          ref={previewRef}
          sx={{
            backgroundColor: 'white',
            color: 'black',
            p: 2,
            minHeight: '400px',
            '@media print': {
              backgroundColor: 'white',
              color: 'black',
            },
          }}
        >
          {children}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}

