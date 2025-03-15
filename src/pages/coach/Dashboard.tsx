import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ClipboardCheck, FileText, RefreshCw, AlertTriangle, TrendingUp, Clock, MessageSquare, Clock8, Ban as Bandage, Box, Activity, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalTeams: number;
  totalPlayers: number;
  upcomingTraining: number;
  attendanceRate: number;
  unreadMessages: number;
  pendingTimesheets: number;
  openIncidents: number;
  resourceBookings: number;
}

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

interface Communication {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
}

interface ResourceBooking {
  id: string;
  resource: {
    name: string;
    type: string;
  };
  booking_date: string;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalPlayers: 0,
    upcomingTraining: 0,
    attendanceRate: 0,
    unreadMessages: 0,
    pendingTimesheets: 0,
    openIncidents: 0,
    resourceBookings: 0
  });
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resourceBookings, setResourceBookings] = useState<ResourceBooking[]>([]);
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
        fetchStats(),
        fetchTeams(),
        fetchCommunications(),
        fetchIncidents(),
        fetchResourceBookings()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total teams
      const { count: teamsCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      // Get total players
      const { count: playersCount } = await supabase
        .from('team_players')
        .select('*', { count: 'exact', head: true });

      // Get upcoming training sessions
      const { count: trainingCount } = await supabase
        .from('training_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled');

      // Get unread messages
      const { count: messagesCount } = await supabase
        .from('coach_communications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');

      // Get pending timesheets
      const { count: timesheetsCount } = await supabase
        .from('coach_timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get open incidents
      const { count: incidentsCount } = await supabase
        .from('coach_incidents')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'resolved');

      // Get resource bookings
      const { count: bookingsCount } = await supabase
        .from('coach_resource_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate attendance rate
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('status');

      const totalAttendance = attendanceData?.length || 0;
      const presentCount = attendanceData?.filter(record => record.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      setStats({
        totalTeams: teamsCount || 0,
        totalPlayers: playersCount || 0,
        upcomingTraining: trainingCount || 0,
        attendanceRate: attendanceRate,
        unreadMessages: messagesCount || 0,
        pendingTimesheets: timesheetsCount || 0,
        openIncidents: incidentsCount || 0,
        resourceBookings: bookingsCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data: teamsData } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          sport,
          age_group,
          team_players (count)
        `);

      if (teamsData) {
        const teams = teamsData.map(team => ({
          ...team,
          player_count: team.team_players[0].count,
          next_session: null
        }));

        // Get next session for each team
        for (const team of teams) {
          const { data: sessionData } = await supabase
            .from('training_sessions')
            .select('*')
            .eq('team_id', team.id)
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(1);

          if (sessionData && sessionData[0]) {
            team.next_session = {
              date: sessionData[0].date,
              time: sessionData[0].start_time,
              location: sessionData[0].location
            };
          }
        }

        setTeams(teams);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchCommunications = async () => {
    try {
      const { data } = await supabase
        .from('coach_communications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setCommunications(data || []);
    } catch (err) {
      console.error('Error fetching communications:', err);
    }
  };

  const fetchIncidents = async () => {
    try {
      const { data } = await supabase
        .from('coach_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setIncidents(data || []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  const fetchResourceBookings = async () => {
    try {
      const { data } = await supabase
        .from('coach_resource_bookings')
        .select(`
          *,
          resource:coach_resources (
            name,
            type
          )
        `)
        .order('booking_date', { ascending: true })
        .limit(5);

      setResourceBookings(data || []);
    } catch (err) {
      console.error('Error fetching resource bookings:', err);
    }
  };

  const getIncidentSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              <p className="text-gray-500 text-sm">Teams</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalTeams}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Players</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalPlayers}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming Training</p>
              <h3 className="text-3xl font-bold mt-2">{stats.upcomingTraining}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Attendance Rate</p>
              <h3 className="text-3xl font-bold mt-2">{stats.attendanceRate.toFixed(1)}%</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClipboardCheck className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Unread Messages</p>
              <h3 className="text-3xl font-bold mt-2">{stats.unreadMessages}</h3>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Timesheets</p>
              <h3 className="text-3xl font-bold mt-2">{stats.pendingTimesheets}</h3>
            </div>
            <div className="p-3 bg-cyan-100 rounded-full">
              <Clock8 className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Open Incidents</p>
              <h3 className="text-3xl font-bold mt-2">{stats.openIncidents}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Bandage className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Resource Bookings</p>
              <h3 className="text-3xl font-bold mt-2">{stats.resourceBookings}</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Box className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Communications */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Recent Communications</h2>
              <button
                onClick={() => navigate('/coach/communications')}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            {communications.length > 0 ? (
              <div className="space-y-4">
                {communications.map(comm => (
                  <div key={comm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{comm.subject}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(comm.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      comm.status === 'read' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {comm.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent communications</p>
            )}
          </div>
        </div>

        {/* Incidents */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Recent Incidents</h2>
              <button
                onClick={() => navigate('/coach/incidents')}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map(incident => (
                  <div key={incident.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{incident.incident_type}</div>
                        <div className="text-sm text-gray-500 mt-1">{incident.description}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getIncidentSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {new Date(incident.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        incident.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent incidents</p>
            )}
          </div>
        </div>
      </div>

      {/* Resource Bookings */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Resource Bookings</h2>
            <button
              onClick={() => navigate('/coach/resources')}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              Manage Resources
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>

          {resourceBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resourceBookings.map(booking => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.resource.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {booking.resource.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No resource bookings found</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/coach/communications')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
            Send Message
          </button>
          <button
            onClick={() => navigate('/coach/timesheets')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Clock8 className="w-5 h-5 text-cyan-600 mr-2" />
            Submit Timesheet
          </button>
          <button
            onClick={() => navigate('/coach/incidents')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Bandage className="w-5 h-5 text-red-600 mr-2" />
            Report Incident
          </button>
          <button
            onClick={() => navigate('/coach/resources')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Box className="w-5 h-5 text-orange-600 mr-2" />
            Book Resource
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-medium text-green-800">System Online</h3>
            </div>
            <p className="mt-1 text-sm text-green-600">All features operating normally</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="font-medium text-blue-800">Last Backup</h3>
            </div>
            <p className="mt-1 text-sm text-blue-600">{new Date().toLocaleString()}</p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle size={16} className="text-yellow-600 mr-2" />
              <h3 className="font-medium text-yellow-800">Reminders</h3>
            </div>
            <p className="mt-1 text-sm text-yellow-600">
              Submit timesheets by end of week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;