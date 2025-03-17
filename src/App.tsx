import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CrossCountry from './pages/cross-country/CrossCountry';
import MasterAdmin from './pages/master-admin/MasterAdmin';
import BiometricsApp from './pages/biometrics/BiometricsApp';
import CoachApp from './pages/coach/CoachApp';
import AthleticsApp from './pages/athletics/AthleticsApp';
import SwimmingApp from './pages/swimming/SwimmingApp';
import OceanSwimApp from './pages/ocean-swim/OceanSwimApp';
import City2SurfApp from './pages/city2surf/City2SurfApp';
import NineteenApp from './pages/nineteen/NineteenApp';
import Login from './pages/auth/Login';
import PrivateRoute from './components/PrivateRoute';
import { supabase } from './lib/supabase';
import useAuthStore from './store/authStore';

function App() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/master-admin/*"
          element={
            <PrivateRoute>
              <MasterAdmin />
            </PrivateRoute>
          }
        />
        <Route
          path="/biometrics/*"
          element={
            <PrivateRoute>
              <BiometricsApp />
            </PrivateRoute>
          }
        />
        <Route
          path="/coach/*"
          element={
            <PrivateRoute>
              <CoachApp />
            </PrivateRoute>
          }
        />
        <Route
          path="/athletics/*"
          element={
            <PrivateRoute>
              <AthleticsApp />
            </PrivateRoute>
          }
        />
        <Route
          path="/swimming/*"
          element={
            <PrivateRoute>
              <SwimmingApp />
            </PrivateRoute>
          }
        />
        <Route
          path="/ocean-swim/*"
          element={
            <PrivateRoute>
              <OceanSwimApp />
            </PrivateRoute>
          }
        />
        <Route
          path="/city2surf/*"
          element={
            <PrivateRoute>
              <City2SurfApp />
            </PrivateRoute>
          }
        />
        <Route
          path="/19for19/*"
          element={
            <PrivateRoute>
              <NineteenApp />
            </PrivateRoute>
          }
        />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <CrossCountry />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;