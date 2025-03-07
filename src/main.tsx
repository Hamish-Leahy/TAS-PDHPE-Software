import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ConnectSupabase from './components/ConnectSupabase.tsx';
import { supabase } from './lib/supabase.ts';

const Root = () => {
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Try to make a simple query to check connection
        const { error } = await supabase.from('runners').select('count', { count: 'exact', head: true });
        
        if (error && (error.message.includes('connection') || error.message.includes('auth'))) {
          setSupabaseConnected(false);
        } else {
          setSupabaseConnected(true);
        }
      } catch (err) {
        setSupabaseConnected(false);
      } finally {
        setChecking(false);
      }
    };

    checkSupabaseConnection();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Checking database connection...</p>
      </div>
    );
  }

  return (
    <StrictMode>
      <App />
      {!supabaseConnected && <ConnectSupabase />}
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<Root />);