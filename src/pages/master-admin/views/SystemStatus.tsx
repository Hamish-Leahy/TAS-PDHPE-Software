import React, { useState, useEffect } from 'react';
import { Power, AlertTriangle, RefreshCw, Check, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const SystemStatus = () => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showKillswitch, setShowKillswitch] = useState(false);
  const [killswitchMessage, setKillswitchMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlatforms();
  }, []);

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

  const togglePlatform = async (platform: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const { error } = await supabase
        .from('platform_status')
        .update({
          status: newStatus,
          message: newStatus === 'active' ? 'System operational' : 'System disabled by master admin',
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'cross_country':
        return 'Running Track';
      case 'athletics':
        return 'Athletics Stadium';
      case 'biometrics':
        return 'Health Monitoring';
      case 'coach':
        return 'Team Management';
      default:
        return 'System Module';
    }
  };

  const getPlatformDescription = (platform: string) => {
    switch (platform) {
      case 'cross_country':
        return 'Cross Country race management and tracking';
      case 'athletics':
        return 'Athletics carnival and event management';
      case 'biometrics':
        return 'Student fitness and health tracking';
      case 'coach':
        return 'Team and training management';
      default:
        return 'System module';
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
        <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div 
            key={platform.id} 
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {platform.platform.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {getPlatformDescription(platform.platform)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Last updated: {new Date(platform.last_updated).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  platform.status === 'active' 
                    ? 'bg-green-900 text-green-200 border border-green-700' 
                    : 'bg-red-900 text-red-200 border border-red-700'
                }`}>
                  {platform.status}
                </span>
              </div>
              
              <p className="text-gray-300 mb-4">{platform.message}</p>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Updated by: {platform.updated_by}</span>
                <button
                  onClick={() => togglePlatform(platform.platform, platform.status)}
                  className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                    platform.status === 'active'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
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
          </div>
        ))}
      </div>

      {showKillswitch && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <h2 className="text-2xl font-bold text-red-500 mb-6 flex items-center">
              <AlertTriangle className="w-8 h-8 mr-2" />
              Emergency Killswitch
            </h2>
            
            <div className="space-y-6">
              <p className="text-gray-300">
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
              
              <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-700">
                <p className="text-red-200 font-medium mb-2">Warning:</p>
                <ul className="list-disc list-inside text-red-300 text-sm space-y-2">
                  <li>This action will affect all users immediately</li>
                  <li>All ongoing operations will be interrupted</li>
                  <li>This should only be used in emergencies</li>
                </ul>
              </div>
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