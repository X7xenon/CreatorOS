import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { MissionControl } from './pages/MissionControl';
import { Analytics } from './pages/Analytics';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';
import { Home } from './pages/Home';
import { Compare } from './pages/Compare';
import ProxyManager from './pages/ProxyManager';
import { useStore } from './store/useStore';

function App() {
  const { fetchAccounts } = useStore();
  const location = useLocation();
  
  // Load theme from localStorage on mount and fetch accounts
  useEffect(() => {
    const savedTheme = localStorage.getItem('creatoros-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    fetchAccounts();
  }, []);

  // Update document title based on route
  useEffect(() => {
    const path = location.pathname.substring(1);
    if (path) {
      const titles: Record<string, string> = {
        'home': 'Home',
        'dashboard': 'Dashboard',
        'mission': 'Mission Control',
        'analytics': 'Analytics',
        'compare': 'Compare',
        'calendar': 'Calendar',
        'proxy': 'Proxy Manager',
        'settings': 'Settings'
      };
      const tabName = titles[path] || path.charAt(0).toUpperCase() + path.slice(1);
      document.title = `CreatorOS | ${tabName}`;
    } else {
      document.title = 'CreatorOS Analytics Dashboard';
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="mission" element={<MissionControl />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="compare" element={<Compare />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="proxy" element={<ProxyManager />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
