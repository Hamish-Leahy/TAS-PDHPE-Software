import React, { useState, useEffect } from 'react';
import { Power, AlertTriangle, RefreshCw, Check, X, Shield, Activity, Server, Database, Globe } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SystemHealth {
  cpu: number;
  memory: number;
  storage: number;
  uptime: number;
}

interface SystemStatusProps {
  systemHealth: SystemHealth;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ systemHealth }) => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showKillswitch, setShowKillswitch] = useState(false);
  const [killswitchMessage, setKillswitchMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: null as string | null,
    nextBackup: null as string | null
  });
  const [systemMetrics, setSystemMetrics] = useState({
    activeUsers: 0,
    totalRequests: 0,
    errorRate: 0,
    responseTime: 0
  });

  useEffect(() => {
    fetchPlatforms();
    fetchBackupStatus();
    fetchSystemMetrics();
    startMetricsPolling();

    return () => {
      // Cleanup polling interval
      clearInterval(metricsInterval);
    };
  }, []);

  let metricsInterval: NodeJS.Timeout;

  const startMetricsPolling = () => {
    // Update metrics every 30 seconds
    metricsInterval = setInterval(fetchSystemMetrics, 30000);
  };

  const fetchPlatforms = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('platform_status')
        .select('*')
        .order('platform');

      setPlatforms(data || []);
    } catch (err) {
      console.error('Error fetching platforms:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBackupStatus = async () => {
    try {
      const { data: lastBackup } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'last_backup_time')
        .single();

      const { data: backupSchedule } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'backup_schedule')
        .single();

      if (lastBackup?.value) {
        const lastBackupTime = new Date(lastBackup.value);
        const nextBackupTime = new Date(lastBackupTime.getTime() + parseInt(backupSchedule?.value || '86400000'));

        setBackupStatus({
          lastBackup: lastBackupTime.toISOString(),
          nextBackup: nextBackupTime.toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching backup status:', err);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      // Get active users in last hour
      const { count: activeUsers } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString());

      // Get total requests in last hour
      const { data: requests } = await supabase
        .from('admin_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString());

      // Calculate error rate
      const errors = requests?.filter(r => r.action.includes('error')).length || 0;
      const totalRequests = requests?.length || 0;
      const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

      // Simulate response time (would be real metric in production)
      const responseTime = Math.random() * 100 + 50; // 50-150ms

      setSystemMetrics({
        activeUsers: activeUsers || 0,
        totalRequests,
        errorRate,
        responseTime
      });
    } catch (err) {
      console.error('Error fetching system metrics:', err);
    }
  };

  const togglePlatform = async (platform: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const { error } = await supabase
        .from('platform_status')
        .update({
          status: newStatus,
          message: newStatus === 'active' ? 'System operational' : 'System temporarily disabled',
          updated_by: 'hleahy',
          last_updated: new Date().toISOString()
        })
        .eq('platform', platform);

      if (error) throw error;

      setSuccess(`Platform ${platform} ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchPlatforms();
    } catch (err) {
      setError('Failed to update platform status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const activateKillswitch = async () => {
    if (!killswitchMessage) {
      setError('Please provide a message for users');
      return;
    }

    try {
      const { error } = await supabase
        .from('platform_status')
        .update({
          status: 'disabled',
          message: killswitchMessage,
          updated_by: 'hleahy',
          last_updated: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess('Emergency killswitch activated');
      setShowKillswitch(false);
      setKillswitchMessage('');
      fetchPlatforms();
    } catch (err) {
      setError('Failed to activate killswitch');
    }
  };

  const getSystemHealthStatus = (value: number) => {
    if (value < 50) return 'good';
    if (value < 80) return 'warning';
    return 'critical';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'cross_country':
        return <Activity className="w-5 h-5" />;
      case 'athletics':
        return <Activity className="w-5 h-5" />;
      case 'swimming':
        return <Activity className="w-5 h-5" />;
      case 'coach':
        return <Shield className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">System Status</h2>
        <div className="flex space-x-4">
          <button
            onClick={fetchPlatforms}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowKillswitch(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Power className="w-5 h-5 mr-2" />
            Emergency Killswitch
          </button>
        </div>
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

      {/* System Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">CPU Usage</p>
              <h3 className={`text-3xl font-bold mt-2 ${getHealthColor(getSystemHealthStatus(systemHealth.cpu))}`}>
                {Math.round(systemHealth.cpu)}%
              </h3>
            </div>
            <div className="p-3 bg-gray-700 rounded-full">
              <Server className={`w-6 h-6 ${getHealthColor(getSystemHealthStatus(systemHealth.cpu))}`} />
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                getSystemHealthStatus(systemHealth.cpu) === 'good' ? 'bg-green-500' :
                getSystemHealthStatus(systemHealth.cpu) === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${systemHealth.cpu}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Memory Usage</p>
              <h3 className={`text-3xl font-bold mt-2 ${getHealthColor(getSystemHealthStatus(systemHealth.memory))}`}>
                {Math.round(systemHealth.memory)}%
              </h3>
            </div>
            <div className="p-3 bg-gray-700 rounded-full">
              <Database className={`w-6 h-6 ${getHealthColor(getSystemHealthStatus(systemHealth.memory))}`} />
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                getSystemHealthStatus(systemHealth.memory) === 'good' ? 'bg-green-500' :
                getSystemHealthStatus(systemHealth.memory) === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${systemHealth.memory}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Storage</p>
              <h3 className={`text-3xl font-bold mt-2 ${getHealthColor(getSystemHealthStatus(systemHealth.storage))}`}>
                {Math.round(systemHealth.storage)}%
              </h3>
            </div>
            <div className="p-3 bg-gray-700 rounded-full">
              <Database className={`w-6 h-6 ${getHealthColor(getSystemHealthStatus(systemHealth.storage))}`} />
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                getSystemHealthStatus(systemHealth.storage) === 'good' ? 'bg-green-500' :
                getSystemHealthStatus(systemHealth.storage) === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${systemHealth.storage}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Uptime</p>
              <h3 className="text-3xl font-bold mt-2 text-blue-400">
                {Math.floor(systemHealth.uptime / 60)}h {systemHealth.uptime % 60}m
              </h3>
            </div>
            <div className="p-3 bg-gray-700 rounded-full">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Platform Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div 
            key={platform.id} 
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  {getPlatformIcon(platform.platform)}
                  <h3 className="text-lg font-medium text-white ml-2 capitalize">
                    {platform.platform.replace(/_/g, ' ')}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Last updated: {new Date(platform.last_updated).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  Updated by: {platform.updated_by}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  platform.status === 'active' 
                    ? 'bg-green-900 text-green-200 border border-green-700' 
                    : 'bg-red-900 text-red-200 border border-red-700'
                }`}>
                  {platform.status}
                </span>
              </div>
            </div>

            <p className="text-gray-300 mt-4">{platform.message}</p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => togglePlatform(platform.platform, platform.status)}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  platform.status === 'active'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white transition-colors`}
              >
                {platform.status === 'active' ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Enable
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Killswitch Modal */}
      {showKillswitch && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-2" />
              <h2 className="text-2xl font-bold text-white">Emergency Killswitch</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              This will immediately disable ALL platforms and prevent access for all users.
              Only master admin can re-enable the systems.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Message to Users
              </label>
              <textarea
                value={killswitchMessage}
                onChange={(e) => setKillswitchMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter message to display to users..."
                rows={3}
                required
              />
            </div>
            
            <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-700 mt-6">
              <p className="text-red-200 font-medium mb-2">Warning:</p>
              <ul className="list-disc list-inside text-red-300 text-sm space-y-2">
                <li>This action will affect all users immediately</li>
                <li>All ongoing operations will be interrupted</li>
                <li>This should only be used in emergencies</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowKillswitch(false);
                  setKillswitchMessage('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={activateKillswitch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Power className="w-5 h-5 mr-2" />
                Activate Killswitch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;