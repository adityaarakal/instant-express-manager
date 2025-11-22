import { useState, useEffect, type ReactNode } from 'react';
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
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { ThemeModeToggle } from './ThemeModeToggle';
import { KeyboardShortcutsHelp } from '../common/KeyboardShortcutsHelp';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { UndoRedoToolbar } from '../common/UndoRedoToolbar';

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
  { label: 'Analytics', to: '/analytics', icon: <AnalyticsIcon fontSize="small" />, end: false as const },
  { label: 'Credit Cards', to: '/credit-cards', icon: <CreditCardIcon fontSize="small" />, end: false as const },
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

  // Lock body and main content scroll when mobile drawer is open
  useEffect(() => {
    if (!isDesktop && mobileOpen) {
      // Store original overflow values
      const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
      const originalBodyPaddingRight = document.body.style.paddingRight;
      const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
      const originalRootOverflow = document.getElementById('root')?.style.overflow || '';
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Lock scroll on html, body, and root
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.overflow = 'hidden';
      }
      
      return () => {
        // Restore original styles
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.paddingRight = originalBodyPaddingRight;
        if (rootElement) {
          rootElement.style.overflow = originalRootOverflow || '';
        }
      };
    }
  }, [mobileOpen, isDesktop]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ? - Show keyboard shortcuts help
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        // Only trigger if not typing in an input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          setShortcutsHelpOpen(true);
        }
      }

      // Esc - Close shortcuts help dialog
      if (event.key === 'Escape' && shortcutsHelpOpen) {
        event.preventDefault();
        setShortcutsHelpOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsHelpOpen]);

  const DrawerContent = (
    <Box 
      role="presentation" 
      sx={{ 
        mt: 1, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, flexShrink: 0 }}>
        <Typography 
          variant="h6" 
          fontWeight={700}
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
            color: 'inherit',
          }}
        >
          Planned Expenses
        </Typography>
      </Toolbar>
      <Divider sx={{ flexShrink: 0 }} />
      <List 
        sx={{ 
          px: { xs: 0.5, sm: 1 },
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          width: '100%',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        }}
      >
        {navItems.map(({ label, to, icon, end: navEnd }) => (
          <NavLink
            key={label}
            to={to}
            end={navEnd}
            style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
          >
            {({ isActive }) => (
              <ListItemButton
                onClick={() => setMobileOpen(false)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  py: { xs: 1, sm: 1.25 },
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  color: 'inherit',
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    color: 'primary.main',
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: { xs: 40, sm: 36 },
                    justifyContent: 'center',
                  }}
                >
                  {icon}
                </ListItemIcon>
                <ListItemText 
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  }}
                />
              </ListItemButton>
            )}
          </NavLink>
        ))}
      </List>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        width: '100%',
        maxWidth: '100vw',
        backgroundColor: 'background.default',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
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
            gap: { xs: 0.5, sm: 1, md: 2 },
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 0.5, sm: 1, md: 2 },
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={{ xs: 0.5, sm: 1 }} 
            sx={{ 
              flexShrink: 0,
              minWidth: 0,
              maxWidth: { xs: '50%', sm: '40%', md: 'auto' },
            }}
          >
            {!isDesktop && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                size="medium"
                sx={{ 
                  minWidth: 44,
                  minHeight: 44,
                  p: 1,
                  flexShrink: 0,
                  color: 'inherit',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                aria-label="Toggle navigation menu"
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography 
              variant="h6" 
              fontWeight={700}
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
                color: 'inherit',
              }}
            >
              Planned Expenses
            </Typography>
          </Stack>
          <Stack 
            direction="row" 
            spacing={{ xs: 0.25, sm: 0.5, md: 1 }} 
            alignItems="center"
            sx={{
              flexShrink: 1,
              minWidth: 0,
              justifyContent: 'flex-end',
              flexWrap: 'nowrap',
            }}
          >
            {isDesktop &&
              navItems.map(({ label, to, end: navEnd }) => (
                <NavLink
                  key={label}
                  to={to}
                  end={navEnd}
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  {({ isActive }) => (
                    <Button
                      color={isActive ? 'primary' : 'inherit'}
                      sx={{ 
                        fontWeight: 600,
                        minHeight: 44,
                        px: { md: 1, lg: 1.5 },
                        fontSize: { md: '0.8125rem', lg: '0.875rem' },
                        flexShrink: 0,
                        color: isActive ? 'primary.main' : 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      {label}
                    </Button>
                  )}
                </NavLink>
              ))}
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <UndoRedoToolbar />
            </Box>
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <SaveStatusIndicator />
            </Box>
            <IconButton
              size="small"
              onClick={() => setShortcutsHelpOpen(true)}
              title="Keyboard Shortcuts (?)"
              aria-label="Show keyboard shortcuts help"
              sx={{
                minWidth: { xs: 36, sm: 40, md: 44 },
                minHeight: { xs: 36, sm: 40, md: 44 },
                p: { xs: 0.5, sm: 0.75, md: 1 },
                flexShrink: 0,
              }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flexShrink: 0 }}>
              <ThemeModeToggle />
            </Box>
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
            disableScrollLock: false,
            disableEnforceFocus: false,
            disableAutoFocus: false,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: { xs: 280, sm: drawerWidth },
              maxWidth: '85vw',
              overflow: 'hidden',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            '& .MuiModal-root': {
              overflow: 'hidden',
            },
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
          maxWidth: '100%',
          mt: { xs: 7, sm: 8 },
          px: { xs: 1, sm: 2, md: 3, lg: 4 },
          pb: { xs: 4, sm: 6, md: 8 },
          minHeight: '100vh',
          overflowX: 'hidden',
          overflowY: !isDesktop && mobileOpen ? 'hidden' : 'auto',
          boxSizing: 'border-box',
          touchAction: !isDesktop && mobileOpen ? 'none' : 'auto',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3, md: 4 },
            px: { xs: 0, sm: 2 },
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}

