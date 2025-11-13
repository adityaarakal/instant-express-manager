import { Route, Routes } from 'react-router-dom';

import { Dashboard } from '../pages/Dashboard';
import { Banks } from '../pages/Banks';
import { BankAccounts } from '../pages/BankAccounts';
import { Transactions } from '../pages/Transactions';
import { EMIs } from '../pages/EMIs';
import { Recurring } from '../pages/Recurring';
import { Planner } from '../pages/Planner';
import { Analytics } from '../pages/Analytics';
import { Settings } from '../pages/Settings';

export function AppRoutes() {
  return (
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
  );
}

