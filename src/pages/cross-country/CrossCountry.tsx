import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import Dashboard from '../Dashboard';
import FinishLine from '../FinishLine';
import Results from '../Results';
import RunnerManagement from '../RunnerManagement';
import QuickPoints from '../QuickPoints';
import Admin from '../Admin';

const CrossCountry = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/finish-line" element={<FinishLine />} />
        <Route path="/quick-points" element={<QuickPoints />} />
        <Route path="/runners" element={<RunnerManagement />} />
        <Route path="/results" element={<Results />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
};

export default CrossCountry;