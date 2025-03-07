import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, RefreshCw, Trash2, Save, Download, Upload, AlertTriangle, Clock, List } from 'lucide-react';
import { useRaceStore } from '../store/raceStore';
import { supabase } from '../lib/supabase';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { 
    resetHousePoints, 
    verifyAdminPassword, 
    backupHousePoints,
    restoreHousePoints,
    logAdminAction,
    isLoading 
  } = useRaceStore();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [housePoints, setHousePoints] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backups, setBackups] = useState<any[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [confirmResetInput, setConfirmResetInput] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchHousePoints();
      fetchBackups();
      fetchAdminLogs();
    }
  }, [isAuthenticated]);

  const fetchHousePoints = async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from('house_points')
      .select('house, points');
    
    if (data) {
      const pointsByHouse: Record<string, number> = {
        'Broughton': 0,
        'Abbott': 0,
        'Croft': 0,
        'Tyrell': 0,
        'Green': 0,
        'Ross': 0
      };
      
      data.forEach(item => {
        pointsByHouse[item.house] += item.points;
      });
      
      setHousePoints(pointsByHouse);
    }
    setRefreshing(false);
  };

  const fetchBackups = async () => {
    try {
      // Check if there's a backup in admin_settings
      const { data } = await supabase
        .from('admin_settings')
        .select('*')
        .like('key', 'house_points_backup%')
        .order('updated_at', { ascending: false });
      
      if (data && data.length > 0) {
        const parsedBackups = data.map(item => {
          try {
            const backupData = JSON.parse(item.value);
            return {
              id: item.id,
              key: item.key,
              timestamp: backupData.timestamp,
              data: backupData.data,
              updated_at: item.updated_at
            };
          } catch (err) {
            console.error('Error parsing backup data:', err);
            return null;
          }
        }).filter(Boolean);
        
        // Limit to the latest 3 backups
        setBackups(parsedBackups.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    }
  };

  const fetchAdminLogs = async () => {
    try {
      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (data) {
        setAdminLogs(data);
      }
    } catch (err) {
      console.error('Error fetching admin logs:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const isValid = await verifyAdminPassword(password);
      
      if (isValid) {
        setIsAuthenticated(true);
        setPassword('');
        await logAdminAction('admin_login', { success: true });
      } else {
        setError('Invalid password. Please try again.');
        await logAdminAction('admin_login', { success: false });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    }
  };

  const handleResetPoints = async () => {
    if (confirmResetInput !== 'RESET') {
      setError('Please type RESET to confirm');
      return;
    }
    
    setShowConfirmReset(false);
    setConfirmResetInput('');
    
    try {
      // Create a backup before resetting
      await backupHousePoints();
      
      // Reset points
      await resetHousePoints();
      
      // Reset local state
      setHousePoints({
        'Broughton': 0,
        'Abbott': 0,
        'Croft': 0,
        'Tyrell': 0,
        'Green': 0,
        'Ross': 0
      });
      
      setSuccess('House points have been reset successfully. A backup was created automatically.');
      fetchBackups();
      fetchAdminLogs();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to reset house points. Please try again.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    try {
      // First check if the entry exists
      const { data: existingData } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'admin_password');
      
      if (existingData && existingData.length > 0) {
        // Update existing password
        const { error } = await supabase
          .from('admin_settings')
          .update({ value: newPassword })
          .eq('key', 'admin_password');
        
        if (error) throw error;
      } else {
        // Insert new password entry
        const { error } = await supabase
          .from('admin_settings')
          .insert({ key: 'admin_password', value: newPassword });
        
        if (error) throw error;
      }
      
      await logAdminAction('change_password');
      
      setSuccess('Password has been updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Password update error:', err);
      setError('Failed to update password. Please try again.');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const backupData = await backupHousePoints();
      
      if (backupData) {
        setSuccess('Backup created successfully.');
        fetchBackups();
        fetchAdminLogs();
        
        // Download the backup file
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `house-points-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Failed to create backup.');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to create backup. Please try again.');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup && !backupFile) {
      setError('Please select a backup to restore.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to restore this backup? This will replace all current house points.')) {
      return;
    }
    
    try {
      let backupData = '';
      
      if (selectedBackup) {
        // Restore from selected backup
        const backup = backups.find(b => b.id === selectedBackup);
        if (backup) {
          backupData = JSON.stringify({
            timestamp: backup.timestamp,
            data: backup.data
          });
        }
      } else if (backupFile) {
        // Restore from uploaded file
        backupData = await readFileAsText(backupFile);
      }
      
      if (!backupData) {
        throw new Error('Invalid backup data');
      }
      
      await restoreHousePoints(backupData);
      
      setSuccess('Backup restored successfully.');
      fetchHousePoints();
      fetchAdminLogs();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Restore error:', err);
      setError('Failed to restore backup. Please try again.');
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupFile(e.target.files[0]);
      setSelectedBackup(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getHouseColor = (house: string) => {
    const colors: Record<string, string> = {
      'Broughton': 'bg-yellow-500', // Yellow
      'Abbott': 'bg-blue-900',      // Navy blue
      'Croft': 'bg-black',          // Black
      'Tyrell': 'bg-red-900',       // Maroon
      'Green': 'bg-red-600',        // Red
      'Ross': 'bg-green-600'        // Green
    };
    return colors[house] || 'bg-gray-500';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'reset_house_points':
        return <Trash2 size={16} className="text-red-500" />;
      case 'backup_house_points':
        return <Download size={16} className="text-blue-500" />;
      case 'restore_house_points':
        return <Upload size={16} className="text-green-500" />;
      case 'admin_login':
        return <Lock size={16} className="text-purple-500" />;
      case 'change_password':
        return <Save size={16} className="text-orange-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'reset_house_points':
        return 'Reset all house points';
      case 'backup_house_points':
        return 'Created house points backup';
      case 'restore_house_points':
        return 'Restored house points from backup';
      case 'admin_login':
        return 'Admin login';
      case 'change_password':
        return 'Changed admin password';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Admin Access</h1>
        </div>
        
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <Lock size={32} className="text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-6">Administrator Login</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>To Gain Access Make A Request to Hamish Leahy</p>
            <p>hleahy@as.edu.au - Email</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <button
          onClick={fetchHousePoints}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
        >
          <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Points Reset</h2>
            
            <div className="mb-6">
              <p className="mb-4">
                <AlertTriangle size={20} className="inline-block text-amber-500 mr-2" />
                This action will permanently delete all house points. This cannot be undone.
              </p>
              <p className="font-medium mb-2">A backup will be created automatically before resetting.</p>
              
              <div className="bg-red-50 p-4 rounded-md mb-4">
                <p className="text-red-700 font-medium">Type "RESET" to confirm:</p>
                <input
                  type="text"
                  value={confirmResetInput}
                  onChange={(e) => setConfirmResetInput(e.target.value)}
                  className="w-full px-3 py-2 mt-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Type RESET"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmReset(false);
                  setConfirmResetInput('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPoints}
                disabled={confirmResetInput !== 'RESET'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reset All Points
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* House Points Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">House Points Management</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(housePoints).map(([house, points]) => (
                <div key={house} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${getHouseColor(house)} mr-2`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{house}</span>
                      <span className="font-bold">{points} pts</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getHouseColor(house)}`} 
                        style={{ width: `${Math.min(100, (points / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 mt-4">
              <button
                onClick={() => setShowConfirmReset(true)}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center disabled:opacity-50"
              >
                <Trash2 size={18} className="mr-2" />
                Reset All House Points
              </button>
              
              <button
                onClick={handleCreateBackup}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center disabled:opacity-50"
              >
                <Download size={18} className="mr-2" />
                Backup House Points
              </button>
            </div>
            
            <div className="flex items-center mt-2">
              <AlertTriangle size={16} className="text-amber-500 mr-2" />
              <p className="text-sm text-gray-500">
                Warning: Resetting will permanently delete all house points. A backup is automatically created.
              </p>
            </div>
          </div>
        </div>

        {/* Change Admin Password */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Change Admin Password</h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Save size={18} className="mr-2" />
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Admin Activity Log */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <List size={20} className="text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Admin Activity Log</h2>
        </div>
        
        {adminLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {getActionDescription(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.user_id === 'anonymous' ? 'Anonymous' : log.user_id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.details ? (
                        <div className="max-w-xs truncate">
                          {(() => {
                            try {
                              const details = JSON.parse(log.details);
                              return Object.entries(details).map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  {key}: {String(value)}
                                </span>
                              ));
                            } catch (e) {
                              return log.details;
                            }
                          })()}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">No admin activity logs available.</p>
        )}
      </div>

      {/* Backup and Restore */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Backup and Restore</h2>
        
        <div className="space-y-6">
          {/* Available Backups */}
          <div>
            <h3 className="font-medium text-lg mb-3">Available Backups (Latest 3)</h3>
            
            {backups.length > 0 ? (
              <div className="space-y-3">
                {backups.map(backup => (
                  <div 
                    key={backup.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedBackup === backup.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedBackup(backup.id);
                      setBackupFile(null);
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {backup.key === 'house_points_backup' ? 'Latest Backup' : 'Historical Backup'}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(backup.timestamp)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {backup.data.length} house point entries
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No backups available.</p>
            )}
          </div>
          
          {/* Upload Backup */}
          <div>
            <h3 className="font-medium text-lg mb-3">Upload Backup File</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="backupFile"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="backupFile"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {backupFile ? backupFile.name : 'Click to upload backup file'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Only .json files are supported
                </span>
              </label>
            </div>
          </div>
          
          {/* Restore Button */}
          <button
            onClick={handleRestoreBackup}
            disabled={isLoading || (!selectedBackup && !backupFile)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Upload size={18} className="mr-2" />
            {isLoading ? 'Restoring...' : 'Restore Selected Backup'}
          </button>
          
          <div className="flex items-center mt-2">
            <AlertTriangle size={16} className="text-amber-500 mr-2" />
            <p className="text-sm text-gray-500">
              Warning: Restoring will replace all current house points with the backup data.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Admin Instructions</h2>
        <div className="space-y-4 text-gray-700">
          <p>
            This admin panel allows you to manage the cross country tracking system.
          </p>
          <h3 className="font-medium text-lg mt-4">House Points Management</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>View current house points totals</li>
            <li>Reset all house points if needed (e.g., at the start of a new season)</li>
            <li>Create backups before making major changes</li>
            <li>Restore from backups if needed</li>
          </ul>
          
          <h3 className="font-medium text-lg mt-4">Security</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Change the admin password regularly for security</li>
            <li>Make sure to use a strong password with at least 8 characters</li>
            <li>Include numbers, special characters, and mixed case for better security</li>
            <li>All admin actions are logged for security and auditing purposes</li>
          </ul>
          
          <p className="mt-4 text-sm text-gray-500">
            Note: Only authorized staff should have access to this admin panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;

