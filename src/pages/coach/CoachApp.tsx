import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CoachLayout from './CoachLayout';
import Dashboard from './Dashboard';
import Teams from './Teams';
import Training from './Training';
import Attendance from './Attendance';
import Plans from './Plans';

const CoachApp = () => {
  return (
    <CoachLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/training" element={<Training />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/plans" element={<Plans />} />
      </Routes>
    </CoachLayout>
  );
};

export default CoachApp;