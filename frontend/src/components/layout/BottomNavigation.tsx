import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper, useTheme, useMediaQuery } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const bottomNavItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Accounts', path: '/accounts', icon: <AccountBalanceWalletIcon /> },
  { label: 'Transactions', path: '/transactions', icon: <ReceiptIcon /> },
  { label: 'Planner', path: '/planner', icon: <EventNoteOutlinedIcon /> },
  { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon /> },
] as const;

export function BottomNavigation() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  // Find the current active route
  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const matchingItem = bottomNavItems.find((item) => {
      if (item.path === '/') {
        return currentPath === '/' || currentPath === '/instant-express-manager' || currentPath === '/instant-express-manager/';
      }
      return currentPath.startsWith(item.path) || currentPath === item.path;
    });
    return matchingItem ? matchingItem.path : '/';
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: 1,
        borderColor: 'divider',
        display: { xs: 'block', md: 'none' },
      }}
      elevation={3}
    >
      <MuiBottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          backgroundColor: 'background.paper',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            padding: '6px 12px',
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.5rem',
            },
          },
        }}
      >
        {bottomNavItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            value={item.path}
            icon={item.icon}
            sx={{
              fontSize: '0.75rem',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.6875rem',
                fontWeight: 500,
                marginTop: '4px',
                '&.Mui-selected': {
                  fontSize: '0.6875rem',
                },
              },
            }}
          />
        ))}
      </MuiBottomNavigation>
    </Paper>
  );
}

