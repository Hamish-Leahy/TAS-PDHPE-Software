import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, Power, Clock, Users, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const MaintenanceMode = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [scheduledMaintenance, setScheduledMaintenance] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState('60');
  const [affectedUsers, setAffectedUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    setRefreshing(true);
    try {
      // Check current maintenance status
      const { data: statusData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      setMaintenanceActive(statusData?.value === 'true');

      // Get scheduled maintenance windows
      const { data: maintenanceData } = await supabase
        .from('system_settings')
        .select('*')
        .like('key', 'scheduled_maintenance_%')
        .order('created_at', { ascending: false });

      setScheduledMaintenance(maintenanceData || []);

      // Get active user count
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setAffectedUsers(count || 0);
    } catch (err) {
      console.error('Error fetching maintenance status:', err);
      setError('Failed to fetch maintenance status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      if (!maintenanceActive && !message) {
        setError('Please provide a maintenance message');
        return;
      }

      // Update maintenance mode status
      const { error: statusError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'maintenance_mode',
          value: (!maintenanceActive).toString()
        });

      if (statusError) throw statusError;

      // If enabling maintenance mode, save the message and schedule
      if (!maintenanceActive) {
        const maintenanceWindow = {
          start_time: new Date().toISOString(),
          duration: parseInt(duration),
          message,
          affected_users: affectedUsers
        };

        const { error: scheduleError } = await supabase
          .from('system_settings')
          .insert({
            key: `scheduled_maintenance_${Date.now()}`,
            value: JSON.stringify(maintenanceWindow)
          });

        if (scheduleError) throw scheduleError;
      }

      setMaintenanceActive(!maintenanceActive);
      setSuccess(`Maintenance mode ${!maintenanceActive ? 'enabled' : 'disabled'} successfully`);
      fetchMaintenanceStatus();
    } catch (err) {
      console.error('Error toggling maintenance mode:', err);
      setError('Failed to toggle maintenance mode');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Maintenance Mode</h2>
        <button
          onClick={fetchMaintenanceStatus}
          disabled={refreshing}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Current Status */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Server className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">System Status</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            maintenanceActive 
              ? 'bg-red-900 text-red-200 border border-red-700' 
              : 'bg-green-900 text-green-200 border border-green-700'
          }`}>
            {maintenanceActive ? 'Maintenance Mode' : 'Operational'}
          </span>
        </div>

        <div className="space-y-6">
          {/* Maintenance Controls */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">Maintenance Controls</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maintenance Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter message to display to users during maintenance..."
                  disabled={maintenanceActive}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expected Duration (minutes)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={maintenanceActive}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-400">
                  <Users className="w-5 h-5 mr-2" />
                  <span>{affectedUsers} users will be affected</span>
                </div>
                <button
                  onClick={toggleMaintenanceMode}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    maintenanceActive
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white transition-colors`}
                >
                  <Power className="w-5 h-5 mr-2" />
                  {maintenanceActive ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </button>
              </div>
            </div>
          </div>

          {/* Maintenance History */}
          <div>
            <h4 className="text-white font-medium mb-4">Maintenance History</h4>
            <div className="space-y-4">
              {scheduledMaintenance.map((maintenance) => {
                const data = JSON.parse(maintenance.value);
                return (
                  <div key={maintenance.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white font-medium">
                          {new Date(data.start_time).toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          Duration: {data.duration} minutes
                        </div>
                        <div className="text-gray-400 text-sm">
                          Affected Users: {data.affected_users}
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                        Completed
                      </span>
                    </div>
                    <div className="mt-3 text-gray-300">
                      {data.message}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Maintenance Instructions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Before Maintenance</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Schedule maintenance during off-peak hours</li>
              <li>Notify users well in advance</li>
              <li>Create a backup of the system</li>
              <li>Prepare rollback plan if needed</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">During Maintenance</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Monitor system status continuously</li>
              <li>Keep track of all changes made</li>
              <li>Test critical functionality</li>
              <li>Update status page regularly</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">After Maintenance</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Verify all systems are operational</li>
              <li>Document all changes and updates</li>
              <li>Monitor for any issues</li>
              <li>Send completion notification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;