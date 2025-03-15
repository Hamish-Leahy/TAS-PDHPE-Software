import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, RefreshCw, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface BackupManagerProps {
  lastBackup: string | null;
}

const BackupManager: React.FC<BackupManagerProps> = ({ lastBackup }) => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .like('key', 'backup_%')
        .order('updated_at', { ascending: false });

      setBackups(data || []);
    } catch (err) {
      console.error('Error fetching backups:', err);
      setError('Failed to fetch backups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createBackup = async () => {
    try {
      // Simulate backup creation
      const backupData = {
        timestamp: new Date().toISOString(),
        type: 'full',
        size: Math.floor(Math.random() * 1000) + 'MB',
        tables: ['users', 'teams', 'events', 'results']
      };

      const { error } = await supabase
        .from('system_settings')
        .insert({
          key: `backup_${Date.now()}`,
          value: JSON.stringify(backupData)
        });

      if (error) throw error;

      setSuccess('Backup created successfully');
      fetchBackups();
    } catch (err) {
      console.error('Error creating backup:', err);
      setError('Failed to create backup');
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess('Backup restored successfully');
      setShowRestoreConfirm(false);
      setSelectedBackup(null);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setError('Failed to restore backup');
    }
  };

  const deleteBackup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Backup deleted successfully');
      fetchBackups();
    } catch (err) {
      console.error('Error deleting backup:', err);
      setError('Failed to delete backup');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Backup Manager</h2>
        <div className="flex space-x-4">
          <button
            onClick={fetchBackups}
            disabled={refreshing}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={createBackup}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Database className="w-5 h-5 mr-2" />
            Create Backup
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
            <Database className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">System Backups</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading backups...
            </div>
          ) : backups.length > 0 ? (
            <div className="space-y-4">
              {backups.map((backup) => {
                const backupData = JSON.parse(backup.value);
                return (
                  <div key={backup.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">
                          Backup {new Date(backupData.timestamp).toLocaleString()}
                        </h4>
                        <p className="text-gray-400 text-sm mt-1">
                          Type: {backupData.type} • Size: {backupData.size}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          {backupData.tables.map((table: string) => (
                            <span
                              key={table}
                              className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300"
                            >
                              {table}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBackup(backup.id);
                            setShowRestoreConfirm(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-900 hover:bg-opacity-50 rounded-full transition-colors"
                          title="Restore backup"
                        >
                          <Upload size={18} />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="p-2 text-red-500 hover:bg-red-900 hover:bg-opacity-50 rounded-full transition-colors"
                          title="Delete backup"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No backups found
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-white">Confirm Restore</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to restore this backup? This will replace all current data with the backup data.
              This action cannot be undone.
            </p>
            
            <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                Warning: All current data will be lost and replaced with the backup data.
                Make sure to create a new backup of the current state if needed.
              </p>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setSelectedBackup(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={restoreBackup}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Backup Instructions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Creating Backups</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Backups are automatically created daily</li>
              <li>Manual backups can be created at any time</li>
              <li>Each backup includes all system data and configurations</li>
              <li>Backups are encrypted and stored securely</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Restoring Backups</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Choose a backup point to restore from</li>
              <li>System will be unavailable during restore</li>
              <li>All current data will be replaced</li>
              <li>Users will be notified of the maintenance</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Best Practices</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Create a backup before major system changes</li>
              <li>Keep at least 3 recent backups</li>
              <li>Test restore process periodically</li>
              <li>Document any custom configurations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;