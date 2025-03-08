import React, { useState, useEffect } from 'react';
import { School as Pool, Timer, Medal, Users, Calendar, RefreshCw, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalEvents: number;
  totalEntries: number;
  completedEvents: number;
  pendingEvents: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalEntries: 0,
    completedEvents: 0,
    pendingEvents: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // Fetch event statistics
      const { data: eventStats, error: eventError } = await supabase
        .from('swimming_events')
        .select('id, stroke');

      if (eventError) throw eventError;

      // Fetch total entries
      const { count: entriesCount, error: entriesError } = await supabase
        .from('swimming_entries')
        .select('*', { count: 'exact', head: true });

      if (entriesError) throw entriesError;

      // Calculate stats
      const total = eventStats?.length || 0;
      const completed = eventStats?.filter(e => e.status === 'completed').length || 0;

      setStats({
        totalEvents: total,
        totalEntries: entriesCount || 0,
        completedEvents: completed,
        pendingEvents: total - completed
      });

      // Fetch upcoming events
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('swimming_events')
        .select('*')
        .eq('status', 'pending')
        .order('scheduled_time')
        .limit(5);

      if (upcomingError) throw upcomingError;
      setUpcomingEvents(upcomingData || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStrokeColor = (stroke: string) => {
    switch (stroke) {
      case 'freestyle':
        return 'bg-blue-100 text-blue-800';
      case 'backstroke':
        return 'bg-green-100 text-green-800';
      case 'breaststroke':
        return 'bg-yellow-100 text-yellow-800';
      case 'butterfly':
        return 'bg-purple-100 text-purple-800';
      case 'medley':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Swimming Carnival Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded flex items-center"
        >
          <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Events</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalEvents}</h3>
            </div>
            <div className="p-3 bg-cyan-100 rounded-full">
              <Pool className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Entries</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalEntries}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed Events</p>
              <h3 className="text-3xl font-bold mt-2">{stats.completedEvents}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Medal className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Events</p>
              <h3 className="text-3xl font-bold mt-2">{stats.pendingEvents}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{event.name}</h3>
                      <p className="text-sm text-gray-500">
                        {event.distance}m {event.stroke} - {event.age_group} {event.gender}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStrokeColor(event.stroke)}`}>
                      {event.stroke}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Clock size={16} className="mr-2" />
                      {event.scheduled_time ? new Date(event.scheduled_time).toLocaleTimeString() : 'Time TBD'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin size={16} className="mr-2" />
                      Pool
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming events scheduled</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h3 className="font-medium">Record Times</h3>
              <p className="text-sm text-gray-500 mt-1">Enter results for completed events</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h3 className="font-medium">Add Entries</h3>
              <p className="text-sm text-gray-500 mt-1">Register swimmers for events</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h3 className="font-medium">View Schedule</h3>
              <p className="text-sm text-gray-500 mt-1">Check event timings</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h3 className="font-medium">Generate Reports</h3>
              <p className="text-sm text-gray-500 mt-1">Create event summaries</p>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-1">
                <h3 className="font-medium text-green-800">System Online</h3>
                <p className="text-sm text-green-600 mt-1">All systems are operating normally</p>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <h3 className="font-medium text-blue-800">Data Backup</h3>
                <p className="text-sm text-blue-600 mt-1">Last backup: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Important Notice</h3>
                <p className="text-sm text-amber-600 mt-1">
                  Remember to verify all times before finalizing events
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;