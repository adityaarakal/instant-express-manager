import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import RepeatIcon from '@mui/icons-material/Repeat';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { ThemeModeToggle } from './ThemeModeToggle';
import { KeyboardShortcutsHelp } from '../common/KeyboardShortcutsHelp';

type AppLayoutProps = {
  children: ReactNode;
};

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', to: '/', icon: <DashboardOutlinedIcon fontSize="small" />, end: true as const },
  { label: 'Banks', to: '/banks', icon: <AccountBalanceIcon fontSize="small" />, end: false as const },
  { label: 'Accounts', to: '/accounts', icon: <AccountBalanceWalletIcon fontSize="small" />, end: false as const },
  { label: 'Transactions', to: '/transactions', icon: <ReceiptIcon fontSize="small" />, end: false as const },
  { label: 'EMIs', to: '/emis', icon: <CreditCardIcon fontSize="small" />, end: false as const },
  { label: 'Recurring', to: '/recurring', icon: <RepeatIcon fontSize="small" />, end: false as const },
  { label: 'Planner', to: '/planner', icon: <EventNoteOutlinedIcon fontSize="small" />, end: false as const },
  { label: 'Settings', to: '/settings', icon: <SettingsOutlinedIcon fontSize="small" />, end: false as const },
] as const;

export function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const DrawerContent = (
    <Box role="presentation" sx={{ mt: 1 }}>
      <Toolbar>
        <Typography variant="h6" fontWeight={700}>
          Planned Expenses
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map(({ label, to, icon, end: navEnd }) => (
          <NavLink
            key={label}
            to={to}
            end={navEnd}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {({ isActive }) => (
              <ListItemButton
                onClick={() => setMobileOpen(false)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    color: 'primary.main',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            )}
          </NavLink>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="default"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {!isDesktop && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                size="small"
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={700}>
              Planned Expenses
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {isDesktop &&
              navItems.map(({ label, to, end: navEnd }) => (
                <NavLink
                  key={label}
                  to={to}
                  end={navEnd}
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <Button
                      color={isActive ? 'primary' : 'inherit'}
                      sx={{ fontWeight: 600 }}
                    >
                      {label}
                    </Button>
                  )}
                </NavLink>
              ))}
            <IconButton
              size="small"
              onClick={() => setShortcutsHelpOpen(true)}
              title="Keyboard Shortcuts (?)"
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
            <ThemeModeToggle />
          </Stack>
        </Toolbar>
      </AppBar>
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={!isDesktop && mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {DrawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {DrawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          px: { xs: 2, md: 6 },
          pb: { xs: 6, md: 8 },
        }}
      >
        <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            py: { xs: 3, md: 4 },
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}

