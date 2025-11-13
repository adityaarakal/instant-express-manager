import { Route, Routes } from 'react-router-dom';

import { Dashboard } from '../pages/Dashboard';
import { Banks } from '../pages/Banks';
import { BankAccounts } from '../pages/BankAccounts';
import { Planner } from '../pages/Planner';
import { Settings } from '../pages/Settings';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/banks" element={<Banks />} />
      <Route path="/accounts" element={<BankAccounts />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

