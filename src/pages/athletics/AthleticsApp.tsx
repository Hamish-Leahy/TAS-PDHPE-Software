import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AthleticsLayout from './AthleticsLayout';
import Dashboard from './Dashboard';
import Events from './Events';
import Entries from './Entries';
import Results from './Results';
import Records from './Records';
import Admin from './Admin';

const AthleticsApp = () => {
  return (
    <AthleticsLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/entries" element={<Entries />} />
        <Route path="/results" element={<Results />} />
        <Route path="/records" element={<Records />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </AthleticsLayout>
  );
};

export default AthleticsApp;