import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ParticipantForm from './ParticipantForm';
import RaceTracking from './RaceTracking';

const OceanSwim = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/register" element={<ParticipantForm onClose={() => {}} onSuccess={() => {}} />} />
      <Route path="/tracking" element={<RaceTracking />} />
    </Routes>
  );
};

export default OceanSwim;