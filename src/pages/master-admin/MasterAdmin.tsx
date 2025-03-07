import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, ChevronLeft } from 'lucide-react';
import MasterAdminDashboard from './MasterAdminDashboard';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const MasterAdmin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Direct credential check
    if (username === 'hleahy' && password === 'Pw45Ut09') {
      setAuthenticated(true);
      sessionStorage.setItem('masterAdminAuth', 'true');
    } else {
      setError('Invalid credentials');
    }
  };

  useEffect(() => {
    // Check if already authenticated
    const sessionAuth = sessionStorage.getItem('masterAdminAuth');
    if (sessionAuth === 'true') {
      setAuthenticated(true);
    }
  }, []);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
        {/* Back to Cross Country Link */}
        <div className="absolute top-4 left-4">
          <Link 
            to="/"
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Cross Country
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-red-500 rounded-lg blur opacity-25"></div>
                <Shield className="relative w-16 h-16 text-red-500" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              TAS Master Admin
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              System-wide administrative control
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-700">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full border border-gray-600 bg-gray-700 bg-opacity-50 rounded-lg shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-600 bg-gray-700 bg-opacity-50 rounded-lg shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Access Master Controls
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">
                      Security Notice
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-center text-gray-400">
                  This is a restricted administrative interface. Unauthorized access attempts will be logged and reported.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} The Armidale School. All rights reserved.
        </footer>
      </div>
    );
  }

  return <MasterAdminDashboard />;
};

export default MasterAdmin;