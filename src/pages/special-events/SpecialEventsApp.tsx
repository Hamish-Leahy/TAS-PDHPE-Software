import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SpecialEventsLayout from './SpecialEventsLayout';
import OceanSwim from './OceanSwim';
import City2Surf from './City2Surf';
import NineteenForNineteen from './NineteenForNineteen';

const SpecialEventsApp = () => {
  return (
    <SpecialEventsLayout>
      <Routes>
        <Route path="/ocean-swim/*" element={<OceanSwim />} />
        <Route path="/city2surf/*" element={<City2Surf />} />
        <Route path="/19for19/*" element={<NineteenForNineteen />} />
      </Routes>
    </SpecialEventsLayout>
  );
};

export default SpecialEventsApp;