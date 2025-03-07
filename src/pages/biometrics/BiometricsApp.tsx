import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BiometricsLayout from './BiometricsLayout';
import CoachDashboard from './CoachDashboard';
import StudentManagement from './StudentManagement';
import TestResults from './TestResults';
import BiometricRecords from './BiometricRecords';
import FitnessStandards from './FitnessStandards';

const BiometricsApp = () => {
  return (
    <BiometricsLayout>
      <Routes>
        <Route path="/" element={<CoachDashboard />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/test-results" element={<TestResults />} />
        <Route path="/biometrics" element={<BiometricRecords />} />
        <Route path="/standards" element={<FitnessStandards />} />
      </Routes>
    </BiometricsLayout>
  );
};

export default BiometricsApp;