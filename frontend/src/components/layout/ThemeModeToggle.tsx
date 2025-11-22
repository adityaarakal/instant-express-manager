import { useMemo } from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MonitorIcon from '@mui/icons-material/Monitor';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useBoolean } from '../../hooks/useBoolean';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
  { value: 'system', label: 'System', icon: <MonitorIcon fontSize="small" /> },
] as const;

type ThemeChoice = (typeof OPTIONS)[number]['value'];

export function ThemeModeToggle() {
  const mode = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const { anchorEl, open, handleOpen, handleClose } = useBoolean();

  const activeOption = useMemo(
    () => OPTIONS.find((option) => option.value === mode) ?? OPTIONS[0],
    [mode],
  );

  const handleSelect = (value: ThemeChoice) => {
    updateSettings({ theme: value });
    handleClose();
  };

  return (
    <>
      <Tooltip title={`Theme mode: ${activeOption.label}`}>
        <IconButton 
          color="primary" 
          onClick={handleOpen} 
          size="small"
          sx={{
            minWidth: { xs: 36, sm: 40, md: 44 },
            minHeight: { xs: 36, sm: 40, md: 44 },
            p: { xs: 0.5, sm: 0.75, md: 1 },
            flexShrink: 0,
          }}
        >
          {activeOption.icon}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            selected={mode === option.value}
          >
            {option.icon}
            <span style={{ marginLeft: 8 }}>{option.label}</span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

