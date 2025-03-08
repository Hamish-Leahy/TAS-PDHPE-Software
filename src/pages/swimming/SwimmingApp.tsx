import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SwimmingLayout from './SwimmingLayout';
import Dashboard from './Dashboard';
import Events from './Events';
import TimeTrials from './TimeTrials';
import Results from './Results';
import Records from './Records';
import Admin from './Admin';

const SwimmingApp = () => {
  return (
    <SwimmingLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/time-trials" element={<TimeTrials />} />
        <Route path="/results" element={<Results />} />
        <Route path="/records" element={<Records />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </SwimmingLayout>
  );
};

export default SwimmingApp;