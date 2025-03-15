import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Plus, Check, X, Settings, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
  config: Record<string, any>;
  last_sync: string;
}

const IntegrationManager = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .like('key', 'integration_%')
        .order('created_at', { ascending: false });

      setIntegrations(data?.map(d => JSON.parse(d.value)) || []);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Failed to fetch integrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'inactive':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'pending':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      default:
        return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Integration Manager</h2>
        <div className="flex space-x-4">
          <button
            onClick={fetchIntegrations}
            disabled={refreshing}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Integration
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
            <Globe className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Active Integrations</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading integrations...
            </div>
          ) : integrations.length > 0 ? (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-medium flex items-center">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {integration.name}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Type: {integration.type}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Last Sync: {new Date(integration.last_sync).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                      <button
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                        title="Configure integration"
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No integrations configured
            </div>
          )}
        </div>
      </div>

      {/* Available Integrations */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Available Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer">
            <h4 className="text-white font-medium">Google Workspace</h4>
            <p className="text-gray-400 text-sm mt-1">
              Sync users and calendar events with Google
            </p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer">
            <h4 className="text-white font-medium">Microsoft 365</h4>
            <p className="text-gray-400 text-sm mt-1">
              Connect with Microsoft services and Azure AD
            </p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer">
            <h4 className="text-white font-medium">Slack</h4>
            <p className="text-gray-400 text-sm mt-1">
              Send notifications and updates to Slack channels
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Integration Guide</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Setting Up Integrations</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Choose from available integration providers</li>
              <li>Configure authentication and permissions</li>
              <li>Set up data sync preferences</li>
              <li>Test the connection before activating</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Maintenance</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Monitor integration health and sync status</li>
              <li>Update credentials before they expire</li>
              <li>Review and adjust sync settings as needed</li>
              <li>Check logs for any sync issues</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Security Notes</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Use service accounts where possible</li>
              <li>Regularly rotate API keys and tokens</li>
              <li>Monitor for unusual activity patterns</li>
              <li>Review permissions periodically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationManager;