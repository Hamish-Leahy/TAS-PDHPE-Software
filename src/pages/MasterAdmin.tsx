import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Power, Shield, Settings, RefreshCw, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MasterAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showKillswitchConfirm, setShowKillswitchConfirm] = useState(false);
  const [killswitchMessage, setKillswitchMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data } = await supabase
        .from('master_admin_settings')
        .select('key, value')
        .in('key', ['master_admin_username', 'master_admin_password']);

      if (data) {
        const storedCredentials = {
          username: data.find(d => d.key === 'master_admin_username')?.value,
          password: data.find(d => d.key === 'master_admin_password')?.value
        };

        // Check if already authenticated in this session
        const sessionAuth = sessionStorage.getItem('masterAdminAuth');
        if (sessionAuth === 'true') {
          setAuthenticated(true);
          fetchPlatforms();
        }
      }
    } catch (err) {
      console.error('Error checking authentication:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { data } = await supabase
        .from('master_admin_settings')
        .select('key, value')
        .in('key', ['master_admin_username', 'master_admin_password']);

      if (data) {
        const storedCredentials = {
          username: data.find(d => d.key === 'master_admin_username')?.value,
          password: data.find(d => d.key === 'master_admin_password')?.value
        };

        if (username === storedCredentials.username && password === storedCredentials.password) {
          setAuthenticated(true);
          sessionStorage.setItem('masterAdminAuth', 'true');
          fetchPlatforms();
        } else {
          setError('Invalid credentials');
        }
      }
    } catch (err) {
      console.error('Error logging in:', err);
      setError('Authentication failed');
    }
  };

  const fetchPlatforms = async () => {
    try {
      const { data } = await supabase
        .from('platform_status')
        .select('*')
        .order('platform');

      setPlatforms(data || []);
    } catch (err) {
      console.error('Error fetching platforms:', err);
    }
  };

  const togglePlatformStatus = async (platform: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const message = newStatus === 'active' ? 'System operational' : 'System temporarily disabled';

      const { error } = await supabase
        .from('platform_status')
        .update({
          status: newStatus,
          message,
          updated_by: username,
          last_updated: new Date().toISOString()
        })
        .eq('platform', platform);

      if (error) throw error;

      await fetchPlatforms();
      setSuccess(`${platform} status updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating platform status:', err);
      setError('Failed to update platform status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleKillswitch = async () => {
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
          updated_by: username,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;

      await fetchPlatforms();
      setShowKillswitchConfirm(false);
      setKillswitchMessage('');
      setSuccess('Emergency killswitch activated - all platforms disabled');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error activating killswitch:', err);
      setError('Failed to activate killswitch');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Shield className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Master Admin Access
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Shield className="mr-2" /> Master Admin Control
        </h1>
        <button
          onClick={() => setShowKillswitchConfirm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
        >
          <Power className="mr-2" /> Emergency Killswitch
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {showKillswitchConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center">
              <AlertTriangle className="mr-2" /> Emergency Killswitch
            </h2>
            
            <div className="mb-6">
              <p className="mb-4 text-gray-700">
                This will immediately disable ALL platforms and prevent access for all users.
                Only master admins will be able to re-enable the systems.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Users
                </label>
                <textarea
                  value={killswitchMessage}
                  onChange={(e) => setKillswitchMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter message to display to users..."
                  rows={3}
                  required
                />
              </div>
              
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-700 font-medium">Warning:</p>
                <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                  <li>This action will affect all users immediately</li>
                  <li>All ongoing operations will be interrupted</li>
                  <li>This should only be used in emergencies</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowKillswitchConfirm(false);
                  setKillswitchMessage('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleKillswitch}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Power className="mr-2" /> Activate Killswitch
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {platform.platform.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(platform.last_updated).toLocaleString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                platform.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {platform.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{platform.message}</p>
            
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Updated by: {platform.updated_by}</span>
              <button
                onClick={() => togglePlatformStatus(platform.platform, platform.status)}
                className={`px-3 py-1 rounded-md flex items-center ${
                  platform.status === 'active'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {platform.status === 'active' ? (
                  <>
                    <X className="w-4 h-4 mr-1" /> Disable
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Enable
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Master Admin Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Platform Management</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-gray-700">
              <li>Each platform can be individually enabled or disabled</li>
              <li>Disabled platforms will prevent all user access except for master admins</li>
              <li>Status changes are logged with the admin's email address</li>
              <li>Custom messages can be set to inform users of the current status</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">Emergency Killswitch</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-gray-700">
              <li>Use only in emergency situations or when immediate system shutdown is required</li>
              <li>Affects all platforms simultaneously</li>
              <li>Requires a message to inform users of the situation</li>
              <li>Can only be reversed by a master admin</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Security Notes</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-blue-700">
              <li>All actions are logged and cannot be deleted</li>
              <li>Only designated master admins have access to these controls</li>
              <li>Regular platform admins cannot override master admin decisions</li>
              <li>Consider creating backups before making major system changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterAdmin;