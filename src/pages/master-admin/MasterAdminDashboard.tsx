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

  useEffect(() => {
    fetchUnreadNotifications();
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
        return <SystemStatus />;
      case 'security':
        return <SecurityLogs />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'notifications':
        return <Notifications onNotificationRead={fetchUnreadNotifications} />;
      default:
        return <SystemStatus />;
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
                  <span className="text-gray-400">Active Platforms</span>
                  <span className="text-white">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Users</span>
                  <span className="text-white">150+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">System Status</span>
                  <span className="text-green-400">Operational</span>
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