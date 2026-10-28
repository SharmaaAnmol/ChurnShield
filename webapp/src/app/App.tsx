import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AppShell } from '../components/layout/AppShell';
import { OverviewPage } from '../pages/OverviewPage';
import { PredictionStudioPage } from '../pages/PredictionStudioPage';
import { CustomerExplorerPage } from '../pages/CustomerExplorerPage';
import { ModelPerformancePage } from '../pages/ModelPerformancePage';
import { FeatureInsightsPage } from '../pages/FeatureInsightsPage';
import { MethodologyPage } from '../pages/MethodologyPage';
import { checkBackendHealth } from '../lib/api/prediction-client';
import { TimelineProvider } from '../lib/context/TimelineContext';

export function App() {
  const [isDataConnected, setIsDataConnected] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    // 1. Check if public static data files are connected
    async function checkDataConnectivity() {
      try {
        const res = await fetch('/data/evaluation_metrics.json');
        setIsDataConnected(res.ok);
      } catch {
        setIsDataConnected(false);
      }
    }

    // 2. Check if FastAPI inference backend is live
    async function checkApiConnectivity() {
      const res = await checkBackendHealth();
      setIsBackendConnected(res.isOnline);
    }

    checkDataConnectivity();
    checkApiConnectivity();
  }, []);

  return (
    <TimelineProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <AppShell
                isDataConnected={isDataConnected}
                isBackendConnected={isBackendConnected}
              />
            }
          >
            <Route path="/" element={<OverviewPage />} />
            <Route path="/prediction-studio" element={<PredictionStudioPage />} />
            <Route path="/predict" element={<Navigate to="/prediction-studio" replace />} />
            <Route path="/customers" element={<CustomerExplorerPage />} />
            <Route path="/model" element={<ModelPerformancePage />} />
            <Route path="/features" element={<FeatureInsightsPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Analytics />
    </TimelineProvider>
  );
}

export default App;
