import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RefreshCw, Search, Calendar, Download } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    lastHour: 0
  });

  useEffect(() => {
    fetchLoginAttempts();
  }, []);

  const fetchLoginAttempts = async () => {
    setRefreshing(true);
    try {
      let query = supabase
        .from('login_attempts')
        .select('*')
        .order('timestamp', { ascending: false });

      if (searchQuery) {
        query = query.ilike('username', `%${searchQuery}%`);
      }

      if (dateRange.start) {
        query = query.gte('timestamp', dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte('timestamp', dateRange.end);
      }

      const { data } = await query;

      if (data) {
        setLoginAttempts(data);
        
        // Calculate statistics
        const successful = data.filter(attempt => attempt.success).length;
        const lastHourAttempts = data.filter(attempt => {
          const attemptTime = new Date(attempt.timestamp);
          const hourAgo = new Date();
          hourAgo.setHours(hourAgo.getHours() - 1);
          return attemptTime >= hourAgo;
        }).length;

        setStats({
          total: data.length,
          successful: successful,
          failed: data.length - successful,
          lastHour: lastHourAttempts
        });
      }
    } catch (err) {
      console.error('Error fetching login attempts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportLogs = () => {
    const headers = ['Timestamp', 'Username', 'IP Address', 'Status', 'User Agent'];
    const csvContent = [
      headers.join(','),
      ...loginAttempts.map(attempt => [
        new Date(attempt.timestamp).toISOString(),
        attempt.username,
        attempt.ip_address,
        attempt.success ? 'Success' : 'Failed',
        `"${attempt.user_agent.replace(/"/g, '""')}"` // Escape quotes for CSV
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (success: boolean) => {
    return success
      ? 'bg-green-900 text-green-200'
      : 'bg-red-900 text-red-200';
  };

  const getStatColor = (value: number, threshold: number) => {
    return value > threshold
      ? 'text-red-400'
      : 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Security Logs</h2>
        <div className="flex space-x-4">
          <button
            onClick={fetchLoginAttempts}
            disabled={refreshing}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="text-gray-400 text-sm">Total Attempts</div>
          <div className="text-3xl font-bold text-white mt-2">{stats.total}</div>
        </div>
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="text-gray-400 text-sm">Successful Logins</div>
          <div className="text-3xl font-bold text-green-400 mt-2">{stats.successful}</div>
        </div>
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="text-gray-400 text-sm">Failed Attempts</div>
          <div className={`text-3xl font-bold mt-2 ${getStatColor(stats.failed, 10)}`}>
            {stats.failed}
          </div>
        </div>
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="text-gray-400 text-sm">Last Hour</div>
          <div className={`text-3xl font-bold mt-2 ${getStatColor(stats.lastHour, 20)}`}>
            {stats.lastHour}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <div>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <button
              onClick={fetchLoginAttempts}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Login Attempts Table */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Login Attempts</h3>
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(attempt.success)}`}>
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

      {/* Security Alerts */}
      {stats.failed > 10 && (
        <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Security Alert</h3>
          </div>
          <p className="text-red-200">
            High number of failed login attempts detected ({stats.failed} failures).
            Consider implementing additional security measures such as:
          </p>
          <ul className="list-disc list-inside mt-2 text-red-200">
            <li>Temporary IP blocking after multiple failures</li>
            <li>Two-factor authentication for sensitive accounts</li>
            <li>Password policy review</li>
            <li>User notification of failed attempts</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SecurityLogs;