import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CoachLayout from './CoachLayout';
import Dashboard from './Dashboard';
import Teams from './Teams';
import Training from './Training';
import Attendance from './Attendance';
import Plans from './Plans';
import Communications from './Communications';
import Timesheets from './Timesheets';
import Incidents from './Incidents';
import Resources from './Resources';

const CoachApp = () => {
  return (
    <CoachLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/training" element={<Training />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/timesheets" element={<Timesheets />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/resources" element={<Resources />} />
      </Routes>
    </CoachLayout>
  );
};

export default CoachApp;