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
  }, []);

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
      .order('date')
      .order('start_time');

    if (error) throw error;
    setSessions(data || []);
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    setTeams(data || []);
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

  const groupSessionsByDate = () => {
    const grouped: Record<string, TrainingSession[]> = {};
    sessions.forEach(session => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });
    return grouped;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSessions = selectedTeam
    ? sessions.filter(session => session.team_id === selectedTeam)
    : sessions;

  const groupedSessions = groupSessionsByDate();

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

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name} - {team.sport}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar View */}
      <div className="space-y-6">
        {Object.entries(groupedSessions).map(([date, sessions]) => (
          <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">
                {new Date(date).toLocaleDateString(undefined, { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium">{session.team.name}</h4>
                        <p className="text-sm text-gray-500">{session.team.sport} - {session.team.age_group}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Clock size={16} className="mr-2" />
                        {session.start_time} - {session.end_time}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin size={16} className="mr-2" />
                        {session.location}
                      </div>
                      {session.description && (
                        <p className="text-gray-600 mt-2">{session.description}</p>
                      )}
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                      <div className="space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(session.id, 'completed')}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(session.id, 'cancelled')}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        >
                          Cancel
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No training sessions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Training;