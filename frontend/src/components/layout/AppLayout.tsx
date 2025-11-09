import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{ backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary" fontWeight={700}>
            Planned Expenses
          </Typography>
          <Stack direction="row" spacing={1}>
            {[
              { label: 'Dashboard', to: '/', end: true },
              { label: 'Planner', to: '/planner' },
              { label: 'Settings', to: '/settings' },
            ].map(({ label, to, end }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                style={{ textDecoration: 'none' }}
              >
                {({ isActive }) => (
                  <Button
                    variant="text"
                    sx={{
                      fontWeight: 600,
                      color: isActive ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {label}
                  </Button>
                )}
              </NavLink>
            ))}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {children}
      </Container>
    </Box>
  );
}

