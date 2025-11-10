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

import { ThemeModeToggle } from './ThemeModeToggle';

type AppLayoutProps = {
  children: ReactNode;
};

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', to: '/', icon: <DashboardOutlinedIcon fontSize="small" />, end: true },
  { label: 'Planner', to: '/planner', icon: <EventNoteOutlinedIcon fontSize="small" /> },
  { label: 'Settings', to: '/settings', icon: <SettingsOutlinedIcon fontSize="small" /> },
] as const;

export function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

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
        {navItems.map(({ label, to, icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
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
              navItems.map(({ label, to, end }) => (
                <NavLink
                  key={label}
                  to={to}
                  end={end}
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
            <ThemeModeToggle />
          </Stack>
        </Toolbar>
      </AppBar>

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

