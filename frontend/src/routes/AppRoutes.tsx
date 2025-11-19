import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { trackPageView, isAnalyticsEnabled } from '../utils/analytics';

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import('../pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Banks = lazy(() => import('../pages/Banks').then((module) => ({ default: module.Banks })));
const BankAccounts = lazy(() => import('../pages/BankAccounts').then((module) => ({ default: module.BankAccounts })));
const Transactions = lazy(() => import('../pages/Transactions').then((module) => ({ default: module.Transactions })));
const EMIs = lazy(() => import('../pages/EMIs').then((module) => ({ default: module.EMIs })));
const Recurring = lazy(() => import('../pages/Recurring').then((module) => ({ default: module.Recurring })));
const Planner = lazy(() => import('../pages/Planner').then((module) => ({ default: module.Planner })));
const Analytics = lazy(() => import('../pages/Analytics').then((module) => ({ default: module.Analytics })));
const Settings = lazy(() => import('../pages/Settings').then((module) => ({ default: module.Settings })));

// Loading fallback component
function RouteLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

/**
 * Component to track page views on route changes
 */
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    isAnalyticsEnabled().then((enabled) => {
      if (enabled) {
        trackPageView(location.pathname + location.search);
      }
    });
  }, [location]);

  return null;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <PageViewTracker />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/banks" element={<Banks />} />
        <Route path="/accounts" element={<BankAccounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/emis" element={<EMIs />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

