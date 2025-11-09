import { Route, Routes } from 'react-router-dom';

import { Dashboard } from '../pages/Dashboard';
import { Planner } from '../pages/Planner';
import { Settings } from '../pages/Settings';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

