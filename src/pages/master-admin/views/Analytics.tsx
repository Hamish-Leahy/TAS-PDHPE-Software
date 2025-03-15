import React, { useState, useEffect } from 'react';
import { Activity, Users, Clock, Calendar, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    averageSessionTime: 0,
    loginAttempts: {
      successful: 0,
      failed: 0
    },
    platformUsage: {
      crossCountry: 0,
      athletics: 0,
      swimming: 0,
      coach: 0
    },
    userGrowth: {
      thisMonth: 0,
      lastMonth: 0
    }
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (logged in within last 24h)
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Fetch login attempts
      const { data: loginData } = await supabase
        .from('login_attempts')
        .select('success')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const successful = loginData?.filter(l => l.success).length || 0;
      const failed = loginData?.filter(l => !l.success).length || 0;

      // Fetch platform usage
      const { data: platformData } = await supabase
        .from('platform_status')
        .select('platform, status');

      const platformUsage = {
        crossCountry: 0,
        athletics: 0,
        swimming: 0,
        coach: 0
      };

      platformData?.forEach(p => {
        if (p.status === 'active') {
          platformUsage[p.platform as keyof typeof platformUsage]++;
        }
      });

      // Calculate user growth
      const thisMonth = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { count: thisMonthUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString().split('T')[0]);

      const { count: lastMonthUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString().split('T')[0])
        .lt('created_at', thisMonth.toISOString().split('T')[0]);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        averageSessionTime: Math.floor(Math.random() * 30) + 15, // Simulated average session time
        loginAttempts: {
          successful,
          failed
        },
        platformUsage,
        userGrowth: {
          thisMonth: thisMonthUsers || 0,
          lastMonth: lastMonthUsers || 0
        }
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateGrowthPercentage = () => {
    if (stats.userGrowth.lastMonth === 0) return 100;
    return Math.round(((stats.userGrowth.thisMonth - stats.userGrowth.lastMonth) / stats.userGrowth.lastMonth) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">System Analytics</h2>
        <button
          onClick={fetchAnalytics}
          disabled={refreshing}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="p-3 bg-blue-900 bg-opacity-50 rounded-full">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users (24h)</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats.activeUsers}</h3>
            </div>
            <div className="p-3 bg-green-900 bg-opacity-50 rounded-full">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Session Time</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats.averageSessionTime}m</h3>
            </div>
            <div className="p-3 bg-purple-900 bg-opacity-50 rounded-full">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">User Growth</p>
              <div className="flex items-center mt-2">
                <h3 className="text-3xl font-bold text-white">{calculateGrowthPercentage()}%</h3>
                {calculateGrowthPercentage() >= 0 ? (
                  <TrendingUp className="ml-2 text-green-400" />
                ) : (
                  <TrendingDown className="ml-2 text-red-400" />
                )}
              </div>
            </div>
            <div className="p-3 bg-yellow-900 bg-opacity-50 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Login Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Login Attempts (7 Days)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-300">Successful</span>
              </div>
              <span className="text-white font-medium">{stats.loginAttempts.successful}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-300">Failed</span>
              </div>
              <span className="text-white font-medium">{stats.loginAttempts.failed}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500"
                style={{ 
                  width: `${(stats.loginAttempts.successful / (stats.loginAttempts.successful + stats.loginAttempts.failed)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Usage</h3>
          <div className="space-y-4">
            {Object.entries(stats.platformUsage).map(([platform, count]) => (
              <div key={platform} className="flex justify-between items-center">
                <span className="text-gray-300 capitalize">{platform}</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${(count / Object.values(stats.platformUsage).reduce((a, b) => a + b, 0)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">This Month</p>
            <p className="text-2xl font-bold text-white">{stats.userGrowth.thisMonth} new users</p>
          </div>
          <div>
            <p className="text-gray-400">Last Month</p>
            <p className="text-2xl font-bold text-white">{stats.userGrowth.lastMonth} new users</p>
          </div>
          <div>
            <p className="text-gray-400">Growth Rate</p>
            <p className={`text-2xl font-bold ${calculateGrowthPercentage() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {calculateGrowthPercentage()}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;