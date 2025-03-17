import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OceanSwimLayout from './OceanSwimLayout';
import Dashboard from './Dashboard';
import Participants from './Participants';
import Sessions from './Sessions';
import RaceTracking from './RaceTracking';
import Reports from './Reports';

const OceanSwimApp = () => {
  return (
    <OceanSwimLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/participants" element={<Participants />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/tracking" element={<RaceTracking />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </OceanSwimLayout>
  );
};

export default OceanSwimApp;