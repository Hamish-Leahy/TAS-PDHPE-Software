import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface LoginAttempt {
  id: string;
  timestamp: string;
  username: string;
  ip_address: string;
  success: boolean;
  user_agent: string;
}

const SecurityLogs = () => {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLoginAttempts();
  }, []);

  const fetchLoginAttempts = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('login_attempts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      setLoginAttempts(data || []);
    } catch (err) {
      console.error('Error fetching login attempts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Security Logs</h2>
        <button
          onClick={fetchLoginAttempts}
          disabled={refreshing}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Recent Login Attempts</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading security logs...
            </div>
          ) : loginAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Browser
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loginAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {attempt.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {attempt.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          attempt.success
                            ? 'bg-green-900 text-green-200'
                            : 'bg-red-900 text-red-200'
                        }`}>
                          {attempt.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {attempt.user_agent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No login attempts recorded yet.
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Security Alerts</h3>
          </div>

          <div className="space-y-4">
            {loginAttempts.filter(a => !a.success).length > 10 && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4">
                <p className="text-red-200">
                  High number of failed login attempts detected. Consider implementing additional security measures.
                </p>
              </div>
            )}

            <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Security Statistics</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Total Login Attempts: {loginAttempts.length}</li>
                <li>Successful Logins: {loginAttempts.filter(a => a.success).length}</li>
                <li>Failed Attempts: {loginAttempts.filter(a => !a.success).length}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;