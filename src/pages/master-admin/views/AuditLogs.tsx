import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Search, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  timestamp: string;
  details: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-900 text-green-200';
      case 'update':
        return 'bg-blue-900 text-blue-200';
      case 'delete':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchMatch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());

    const actionMatch = !filters.action || log.action === filters.action;
    const dateMatch = filterByDate(log.timestamp, filters.dateRange);

    return searchMatch && actionMatch && dateMatch;
  });

  const filterByDate = (timestamp: string, range: string) => {
    if (range === 'all') return true;
    
    const date = new Date(timestamp);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return date >= monthAgo;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
        <button
          onClick={fetchLogs}
          disabled={refreshing}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
          </div>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <FileText className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">System Audit Trail</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading audit logs...
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {log.user_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="max-w-lg break-words">
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No audit logs found
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Audit Log Guide</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Understanding Logs</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>All system actions are automatically logged</li>
              <li>Logs include user identification and timestamps</li>
              <li>Action types are color-coded for easy reference</li>
              <li>Details provide context for each action</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Filtering Tips</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Use search to find specific actions or users</li>
              <li>Filter by date range for targeted analysis</li>
              <li>Combine filters for precise results</li>
              <li>Export filtered logs for reporting</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Security Notes</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Audit logs cannot be modified or deleted</li>
              <li>All administrator actions are tracked</li>
              <li>Logs are retained according to policy</li>
              <li>Regular review recommended for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;