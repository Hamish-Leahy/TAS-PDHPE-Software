import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CrossCountry from './pages/cross-country/CrossCountry';
import MasterAdmin from './pages/master-admin/MasterAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/master-admin/*" element={<MasterAdmin />} />
        <Route path="/*" element={<CrossCountry />} />
      </Routes>
    </Router>
  );
}

export default App;