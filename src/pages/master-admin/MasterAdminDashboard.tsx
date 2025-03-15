import React, { useState, useEffect } from 'react';
import { Power, AlertTriangle, RefreshCw, Check, X, LogOut, ChevronLeft, Bell, List, Settings, Users, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SystemStatus from './views/SystemStatus';
import SecurityLogs from './views/SecurityLogs';
import UserManagement from './views/UserManagement';
import SystemSettings from './views/SystemSettings';
import Notifications from './views/Notifications';

type View = 'status' | 'security' | 'users' | 'settings' | 'notifications';

const MasterAdminDashboard = () => {
  const [currentView, setCurrentView] = useState<View>('status');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [systemHealth, setSystemHealth] = useState({
    cpu: Math.random() * 60 + 20, // Simulated values between 20-80%
    memory: Math.random() * 60 + 20,
    storage: Math.random() * 40 + 10, // Lower storage usage 10-50%
    uptime: 0 // Will be set from Supabase
  });

  useEffect(() => {
    fetchUnreadNotifications();
    fetchSystemHealth();
    startHealthCheck();
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('count')
        .eq('read', false)
        .single();
      
      setUnreadNotifications(data?.count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      // Get Supabase instance start time from platform_status
      const { data: platformData } = await supabase
        .from('platform_status')
        .select('last_updated')
        .eq('platform', 'master_admin')
        .single();

      if (platformData) {
        const startTime = new Date(platformData.last_updated);
        const now = new Date();
        const uptimeMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

        setSystemHealth(prev => ({
          ...prev,
          uptime: uptimeMinutes
        }));
      }
    } catch (err) {
      console.error('Error fetching system health:', err);
    }
  };

  const startHealthCheck = () => {
    // Update simulated metrics and fetch real uptime every 5 seconds
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        cpu: Math.min(95, Math.max(5, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(95, Math.max(5, prev.memory + (Math.random() - 0.5) * 8)),
        storage: Math.min(95, Math.max(5, prev.storage + (Math.random() - 0.5) * 2)),
        uptime: prev.uptime + 1 // Increment uptime by 1 minute
      }));
    }, 5000);

    // Fetch real uptime every minute
    const uptimeInterval = setInterval(fetchSystemHealth, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(uptimeInterval);
    };
  };

  const handleLogout = () => {
    sessionStorage.removeItem('masterAdminAuth');
    window.location.reload();
  };

  const views = [
    { id: 'status', label: 'System Status', icon: Power },
    { id: 'security', label: 'Security Logs', icon: Lock },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'status':
        return <SystemStatus systemHealth={systemHealth} />;
      case 'security':
        return <SecurityLogs />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'notifications':
        return <Notifications onNotificationRead={fetchUnreadNotifications} />;
      default:
        return <SystemStatus systemHealth={systemHealth} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800 bg-opacity-50 backdrop-blur-sm shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/"
                className="flex items-center text-gray-400 hover:text-white transition-colors mr-8"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Cross Country
              </Link>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <Lock className="w-8 h-8 mr-2 text-red-500" />
                Master Admin Control
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
              <nav className="space-y-1">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id as View)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      currentView === view.id
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <view.icon className="w-5 h-5 mr-3" />
                    <span>{view.label}</span>
                    {view.badge ? (
                      <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                        {view.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </nav>
            </div>

            {/* System Overview */}
            <div className="mt-6 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">CPU Usage</span>
                  <span className="text-white">{Math.round(systemHealth.cpu)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-white">{Math.round(systemHealth.memory)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-white">{Math.round(systemHealth.storage)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white">{Math.floor(systemHealth.uptime / 60)}h {systemHealth.uptime % 60}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {renderView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterAdminDashboard;