import React, { useState, useEffect } from 'react';
import { Waves, Users, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeSessions: 0,
    completedSessions: 0,
    medicalClearance: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // Fetch total participants
      const { count: participantCount } = await supabase
        .from('ocean_swim_participants')
        .select('*', { count: 'exact', head: true });

      // Fetch medical clearance count
      const { count: medicalCount } = await supabase
        .from('ocean_swim_participants')
        .select('*', { count: 'exact', head: true })
        .eq('medical_clearance', true);

      // Fetch session counts
      const { data: sessions } = await supabase
        .from('ocean_swim_sessions')
        .select('status');

      const completedCount = sessions?.filter(s => s.status === 'completed').length || 0;
      const activeCount = sessions?.filter(s => s.status === 'scheduled').length || 0;

      // Fetch upcoming sessions
      const { data: upcoming } = await supabase
        .from('ocean_swim_sessions')
        .select('*')
        .eq('status', 'scheduled')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .limit(5);

      setStats({
        totalParticipants: participantCount || 0,
        activeSessions: activeCount,
        completedSessions: completedCount,
        medicalClearance: medicalCount || 0
      });

      setUpcomingSessions(upcoming || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Waves className="w-8 h-8 text-blue-600 mr-2" />
          Ocean Swim Dashboard
        </h1>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
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
              <p className="text-gray-500 text-sm">Total Participants</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalParticipants}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Sessions</p>
              <h3 className="text-3xl font-bold mt-2">{stats.activeSessions}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed Sessions</p>
              <h3 className="text-3xl font-bold mt-2">{stats.completedSessions}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Waves className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Medical Clearance</p>
              <h3 className="text-3xl font-bold mt-2">{stats.medicalClearance}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map(session => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{new Date(session.date).toLocaleDateString()}</h3>
                      <p className="text-sm text-gray-500 mt-1">Location: {session.location}</p>
                      {session.conditions && (
                        <p className="text-sm text-gray-500">Conditions: {session.conditions}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'scheduled' ? 'bg-green-100 text-green-800' : 
                      session.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming sessions scheduled</p>
          )}
        </div>
      </div>

      {/* Safety Reminders */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Safety Reminders</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-medium text-lg mb-2 text-blue-800">Before Swimming</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-700">
              <li>Check weather conditions</li>
              <li>Verify medical clearance</li>
              <li>Inspect safety equipment</li>
              <li>Brief participants on signals</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="font-medium text-lg mb-2 text-green-800">During Session</h3>
            <ul className="list-disc list-inside space-y-2 text-green-700">
              <li>Maintain buddy system</li>
              <li>Regular head counts</li>
              <li>Monitor conditions</li>
              <li>Stay within boundaries</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-red-50">
            <h3 className="font-medium text-lg mb-2 text-red-800">Emergency Procedures</h3>
            <ul className="list-disc list-inside space-y-2 text-red-700">
              <li>Emergency signals review</li>
              <li>First aid equipment check</li>
              <li>Communication devices ready</li>
              <li>Emergency contacts updated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;