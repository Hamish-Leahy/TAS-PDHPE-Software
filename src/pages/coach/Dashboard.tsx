import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  ClipboardCheck, 
  FileText,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface TeamSummary {
  id: string;
  name: string;
  sport: string;
  age_group: string;
  player_count: number;
  next_session: {
    date: string;
    time: string;
    location: string;
  } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTeams(),
        fetchUpcomingSessions(),
        fetchRecentAttendance()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTeams = async () => {
    const { data: teamsData, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        sport,
        age_group,
        team_players (count)
      `);

    if (error) throw error;

    const teams = teamsData?.map(team => ({
      ...team,
      player_count: team.team_players[0].count,
      next_session: null // Will be populated when training sessions are implemented
    }));

    setTeams(teams || []);
  };

  const fetchUpcomingSessions = async () => {
    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        id,
        date,
        start_time,
        end_time,
        location,
        teams (name)
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('start_time')
      .limit(5);

    if (error) throw error;
    setUpcomingSessions(data || []);
  };

  const fetchRecentAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        session_id,
        status,
        training_sessions (
          date,
          teams (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    setRecentAttendance(data || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
        >
          <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
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
              <p className="text-gray-500 text-sm">Total Teams</p>
              <h3 className="text-3xl font-bold mt-2">{teams.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming Sessions</p>
              <h3 className="text-3xl font-bold mt-2">{upcomingSessions.length}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Recent Attendance</p>
              <h3 className="text-3xl font-bold mt-2">{recentAttendance.length}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ClipboardCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Training Plans</p>
              <h3 className="text-3xl font-bold mt-2">5</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Teams Overview */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Teams Overview</h2>
            <button
              onClick={() => navigate('/coach/teams')}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              View All Teams
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="border rounded-lg p-4">
                <h3 className="font-medium text-lg">{team.name}</h3>
                <p className="text-gray-500 text-sm">{team.sport} - {team.age_group}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-gray-600">{team.player_count} Players</span>
                  {team.next_session && (
                    <span className="text-sm text-blue-600">
                      Next: {new Date(team.next_session.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
              <button
                onClick={() => navigate('/coach/training')}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                View Schedule
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{session.teams.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(session.date).toLocaleDateString()} at {session.start_time}
                      </div>
                      <div className="text-sm text-gray-500">{session.location}</div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Recent Attendance</h2>
              <button
                onClick={() => navigate('/coach/attendance')}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            {recentAttendance.length > 0 ? (
              <div className="space-y-4">
                {recentAttendance.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{record.training_sessions.teams.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.training_sessions.date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent attendance records</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/coach/teams')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            Manage Teams
          </button>
          <button
            onClick={() => navigate('/coach/training')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Calendar className="w-5 h-5 text-green-600 mr-2" />
            Schedule Training
          </button>
          <button
            onClick={() => navigate('/coach/attendance')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <ClipboardCheck className="w-5 h-5 text-purple-600 mr-2" />
            Take Attendance
          </button>
          <button
            onClick={() => navigate('/coach/plans')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <FileText className="w-5 h-5 text-yellow-600 mr-2" />
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;