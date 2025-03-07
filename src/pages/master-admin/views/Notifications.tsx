import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  created_at: string;
  read: boolean;
}

interface NotificationsProps {
  onNotificationRead: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onNotificationRead }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      onNotificationRead();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      onNotificationRead();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-900 bg-opacity-50 border-red-700';
      case 'warning':
        return 'bg-yellow-900 bg-opacity-50 border-yellow-700';
      default:
        return 'bg-blue-900 bg-opacity-50 border-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
        <button
          onClick={fetchNotifications}
          disabled={refreshing}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? ' animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Bell className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">System Notifications</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${getNotificationStyle(notification.type)} ${
                    !notification.read ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-white">
                        {notification.title}
                      </h4>
                      <p className="text-gray-300 mt-1">{notification.message}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-green-500 hover:bg-green-900 hover:bg-opacity-50 rounded-full transition-colors"
                          title="Mark as read"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-red-500 hover:bg-red-900 hover:bg-opacity-50 rounded-full transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No notifications to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;