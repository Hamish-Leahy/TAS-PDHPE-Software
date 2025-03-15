import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  Users,
  RefreshCw,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TrainingSession {
  id: string;
  team_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  status: string;
  team: {
    name: string;
    sport: string;
    age_group: string;
  };
}

const Training = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newSession, setNewSession] = useState({
    team_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '15:00',
    end_time: '16:30',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSessions(),
        fetchTeams()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSessions = async () => {
    try {
      // Get current coach's email
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get coach's ID
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!coachData) return;

      // Get start and end of current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Fetch sessions for teams where user is coach or assistant coach
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          team:teams (
            name,
            sport,
            age_group
          )
        `)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .in('team_id', `(
          SELECT id FROM teams 
          WHERE coach_id = '${coachData.id}' 
          OR assistant_coach_id = '${coachData.id}'
        )`);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to fetch training sessions');
    }
  };

  const fetchTeams = async () => {
    try {
      // Get current coach's email
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get teams where user is coach or assistant coach
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .or(`coach_id.eq.(SELECT id FROM coaches WHERE email = '${session.user.email}'),assistant_coach_id.eq.(SELECT id FROM coaches WHERE email = '${session.user.email}')`)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { error } = await supabase
        .from('training_sessions')
        .insert([newSession]);

      if (error) throw error;

      setSuccess('Training session added successfully');
      setShowAddModal(false);
      setNewSession({
        team_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '15:00',
        end_time: '16:30',
        location: '',
        description: ''
      });
      fetchSessions();
    } catch (err) {
      console.error('Error adding session:', err);
      setError('Failed to add training session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this training session?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Training session deleted successfully');
      fetchSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete training session');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Status updated successfully');
      fetchSessions();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSessionsForDay = (day: number) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getDate() === day;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const weeks = Math.ceil((daysInMonth + firstDay) / 7);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold">
            {monthName} {year}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}

          {Array.from({ length: weeks * 7 }).map((_, index) => {
            const day = index - firstDay + 1;
            const isValidDay = day > 0 && day <= daysInMonth;
            const sessionsForDay = isValidDay ? getSessionsForDay(day) : [];
            const isToday = isValidDay && 
              day === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div 
                key={index}
                className={`bg-white p-2 min-h-[120px] ${
                  isValidDay ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                {isValidDay && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {sessionsForDay.map(session => (
                        <div
                          key={session.id}
                          className="p-1 text-xs rounded bg-blue-50 border border-blue-100"
                        >
                          <div className="font-medium text-blue-900 truncate">
                            {session.team.name}
                          </div>
                          <div className="text-blue-700 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {session.start_time.slice(0, 5)}
                          </div>
                          <div className="text-blue-700 flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {session.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training Calendar</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
          >
            <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Add Session
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Calendar View */}
      {loading ? (
        <div className="text-center py-8">
          <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Loading calendar...</p>
        </div>
      ) : (
        renderCalendar()
      )}

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Training Session</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Team</label>
                <select
                  value={newSession.team_id}
                  onChange={(e) => setNewSession({ ...newSession, team_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} - {team.sport}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newSession.end_time}
                    onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newSession.location}
                  onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Main Field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Training session details..."
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Calendar Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Managing Training Sessions</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>Click "Add Session" to schedule a new training</li>
              <li>Select a team and set the date, time, and location</li>
              <li>View all your team's training sessions in the calendar</li>
              <li>Click on a session to view details or make changes</li>
              <li>Use the navigation arrows to move between months</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Tips</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-blue-700">
              <li>Plan sessions in advance to ensure facility availability</li>
              <li>Check for conflicts with other team schedules</li>
              <li>Consider weather conditions for outdoor trainings</li>
              <li>Allow adequate rest time between sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;