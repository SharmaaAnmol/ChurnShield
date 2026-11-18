import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SiteShell } from '../components/layout/SiteShell';
import { HomePage } from '../pages/site/HomePage';
import { DataPage } from '../pages/site/DataPage';
import { TryModelPage } from '../pages/site/TryModelPage';
import { ResultsPage } from '../pages/site/ResultsPage';
import { CustomersPage } from '../pages/site/CustomersPage';
import { HowItsBuiltPage } from '../pages/site/HowItsBuiltPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/prediction-studio" element={<TryModelPage />} />
          <Route path="/model" element={<ResultsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/how-its-built" element={<HowItsBuiltPage />} />
          {/* old URLs */}
          <Route path="/predict" element={<Navigate to="/prediction-studio" replace />} />
          <Route path="/features" element={<Navigate to="/model" replace />} />
          <Route path="/methodology" element={<Navigate to="/model" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
