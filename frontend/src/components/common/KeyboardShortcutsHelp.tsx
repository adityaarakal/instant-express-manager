import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import SearchIcon from '@mui/icons-material/Search';
import { useMediaQuery } from '@mui/material';

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'editing' | 'general';
  platform?: 'all' | 'windows' | 'mac';
}

const allShortcuts: Shortcut[] = [
  // Navigation
  {
    keys: ['?'],
    description: 'Show keyboard shortcuts help',
    category: 'navigation',
  },
  {
    keys: ['Escape'],
    description: 'Close dialog or cancel action',
    category: 'navigation',
  },
  {
    keys: ['Tab'],
    description: 'Navigate between form fields',
    category: 'navigation',
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Navigate backwards between form fields',
    category: 'navigation',
  },
  {
    keys: ['Arrow Up', 'Arrow Down'],
    description: 'Navigate table rows (when not in input)',
    category: 'navigation',
  },
  {
    keys: ['Arrow Left', 'Arrow Right'],
    description: 'Navigate table cells (when not in input)',
    category: 'navigation',
  },

  // Actions
  {
    keys: ['Ctrl', 'N'],
    description: 'New transaction/EMI/recurring (on respective pages)',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'N'],
    description: 'New transaction/EMI/recurring (on respective pages)',
    category: 'actions',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'Focus search/filter input',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'K'],
    description: 'Focus search/filter input',
    category: 'actions',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Save form (when in a dialog)',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'S'],
    description: 'Save form (when in a dialog)',
    category: 'actions',
    platform: 'mac',
  },
  {
    keys: ['Enter'],
    description: 'Save and move to next field (in forms)',
    category: 'actions',
  },

  // Editing
  {
    keys: ['Ctrl', 'Z'],
    description: 'Undo last action',
    category: 'editing',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'Z'],
    description: 'Undo last action',
    category: 'editing',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'Y'],
    description: 'Redo last undone action',
    category: 'editing',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'Y'],
    description: 'Redo last undone action',
    category: 'editing',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'Shift', 'Z'],
    description: 'Redo last undone action (alternative)',
    category: 'editing',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'Shift', 'Z'],
    description: 'Redo last undone action (alternative)',
    category: 'editing',
    platform: 'mac',
  },

  // General
  {
    keys: ['Ctrl', 'F'],
    description: 'Browser find (search page content)',
    category: 'general',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'F'],
    description: 'Browser find (search page content)',
    category: 'general',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'P'],
    description: 'Print current page',
    category: 'general',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'P'],
    description: 'Print current page',
    category: 'general',
    platform: 'mac',
  },
];

const categoryLabels: Record<Shortcut['category'], string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  editing: 'Editing',
  general: 'General',
};

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Shortcut['category'] | 'all'>('all');

  // Detect platform
  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  }, []);

  // Filter shortcuts based on platform and search
  const filteredShortcuts = useMemo(() => {
    return allShortcuts.filter((shortcut) => {
      // Platform filter
      if (shortcut.platform && shortcut.platform !== 'all') {
        if (isMac && shortcut.platform !== 'mac') return false;
        if (!isMac && shortcut.platform !== 'windows') return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && shortcut.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesDescription = shortcut.description.toLowerCase().includes(searchLower);
        const matchesKeys = shortcut.keys.some((key) => key.toLowerCase().includes(searchLower));
        if (!matchesDescription && !matchesKeys) return false;
      }

      return true;
    });
  }, [searchTerm, selectedCategory, isMac]);

  // Group by category
  const shortcutsByCategory = useMemo(() => {
    const grouped: Record<string, Shortcut[]> = {};
    filteredShortcuts.forEach((shortcut) => {
      if (!grouped[shortcut.category]) {
        grouped[shortcut.category] = [];
      }
      grouped[shortcut.category].push(shortcut);
    });
    return grouped;
  }, [filteredShortcuts]);

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: Shortcut['category'] | 'all') => {
    setSelectedCategory(newValue);
  };

  const renderKey = (key: string) => {
    const isModifier = ['Ctrl', 'Cmd', 'Shift', 'Alt', 'Meta'].includes(key);
    const displayKey = isMac && key === 'Ctrl' ? 'Cmd' : !isMac && key === 'Cmd' ? 'Ctrl' : key;

    return (
      <Chip
        label={displayKey}
        size="small"
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          height: 24,
          minWidth: isModifier ? 50 : 40,
          backgroundColor: isModifier ? 'action.selected' : 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
          fontWeight: isModifier ? 600 : 400,
        }}
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <KeyboardIcon />
            <Typography variant="h6">Keyboard Shortcuts</Typography>
          </Stack>
          <Chip
            label={isMac ? 'Mac' : 'Windows/Linux'}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All" value="all" />
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Tab key={key} label={label} value={key as Shortcut['category']} />
            ))}
          </Tabs>

          {/* Shortcuts List */}
          {filteredShortcuts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No shortcuts found matching your search.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {selectedCategory === 'all' ? (
                // Show grouped by category
                Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
                  <Box key={category}>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                      {categoryLabels[category as Shortcut['category']]}
                    </Typography>
                    <Stack spacing={1.5}>
                      {shortcuts.map((shortcut, index) => (
                        <Box key={index}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1}
                          >
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {shortcut.description}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                              {shortcut.keys.map((key, keyIndex) => (
                                <Box key={keyIndex}>
                                  {renderKey(key)}
                                  {keyIndex < shortcut.keys.length - 1 && (
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      sx={{ mx: 0.5, color: 'text.secondary' }}
                                    >
                                      +
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </Stack>
                          </Stack>
                          {index < shortcuts.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))
              ) : (
                // Show flat list for selected category
                <Stack spacing={1.5}>
                  {filteredShortcuts.map((shortcut, index) => (
                    <Box key={index}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1}
                      >
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {shortcut.description}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                          {shortcut.keys.map((key, keyIndex) => (
                            <Box key={keyIndex}>
                              {renderKey(key)}
                              {keyIndex < shortcut.keys.length - 1 && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{ mx: 0.5, color: 'text.secondary' }}
                                >
                                  +
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                      {index < filteredShortcuts.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {/* Help Text */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Tip:</strong> Press <kbd style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.1)' }}>?</kbd> anywhere in the app to open this dialog. Shortcuts work when you're not typing in an input field.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
