import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSettingChange = (id: string, value: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };

  const handleSaveSettings = async () => {
    setError(null);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: setting.value })
          .eq('id', setting.id);

        if (error) throw error;
      }

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <div className="flex space-x-4">
          <button
            onClick={fetchSettings}
            disabled={refreshing}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSaveSettings}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Changes
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

      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Settings className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Configuration</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading settings...
            </div>
          ) : settings.length > 0 ? (
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="border border-gray-700 rounded-lg p-4">
                  <label className="block">
                    <span className="text-white font-medium">{setting.key}</span>
                    <p className="text-sm text-gray-400 mt-1 mb-2">{setting.description}</p>
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(setting.updated_at).toLocaleString()}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No system settings found.
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Settings Documentation</h3>
          <div className="prose prose-invert">
            <p className="text-gray-300">
              These settings control various aspects of the system's behavior. Changes will take effect immediately after saving.
              Please ensure you understand the impact of any changes before saving them.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>Security settings affect system-wide access controls</li>
              <li>Email settings configure notification delivery</li>
              <li>Integration settings manage external service connections</li>
              <li>Performance settings tune system behavior and resource usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;