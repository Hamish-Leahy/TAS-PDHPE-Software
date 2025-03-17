import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, RefreshCw, MapPin, AlertTriangle, Waves, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Session {
  id: string;
  date: string;
  location: string;
  conditions: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: 'all'
  });
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    conditions: '',
    status: 'scheduled' as const
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('ocean_swim_sessions')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { error } = await supabase
        .from('ocean_swim_sessions')
        .insert([newSession]);

      if (error) throw error;

      setSuccess('Session added successfully');
      setShowAddModal(false);
      setNewSession({
        date: new Date().toISOString().split('T')[0],
        location: '',
        conditions: '',
        status: 'scheduled'
      });
      fetchSessions();
    } catch (err) {
      console.error('Error adding session:', err);
      setError('Failed to add session');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Session['status']) => {
    try {
      const { error } = await supabase
        .from('ocean_swim_sessions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Session status updated successfully');
      fetchSessions();
    } catch (err) {
      console.error('Error updating session status:', err);
      setError('Failed to update session status');
    }
  };

  const filteredSessions = sessions.filter(session => {
    const searchMatch = 
      session.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.conditions?.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = !filters.status || session.status === filters.status;
    const dateMatch = filterByDate(session.date, filters.dateRange);

    return searchMatch && statusMatch && dateMatch;
  });

  const filterByDate = (date: string, range: string) => {
    if (range === 'all') return true;
    
    const sessionDate = new Date(date);
    const now = new Date();
    
    switch (range) {
      case 'upcoming':
        return sessionDate >= now;
      case 'past':
        return sessionDate < now;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sessionDate >= monthAgo;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ocean Swim Sessions</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchSessions}
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

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading sessions...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-4">
              {filteredSessions.map(session => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="font-medium">{new Date(session.date).toLocaleDateString()}</h3>
                      </div>
                      <div className="flex items-center mt-2">
                        <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                        <p className="text-sm text-gray-600">{session.location}</p>
                      </div>
                      {session.conditions && (
                        <div className="flex items-center mt-2">
                          <Waves className="w-4 h-4 text-gray-500 mr-2" />
                          <p className="text-sm text-gray-600">{session.conditions}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.status}
                      </span>
                      {session.status === 'scheduled' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleUpdateStatus(session.id, 'completed')}
                            className="p-1 hover:bg-green-100 rounded-full text-green-600"
                            title="Mark as completed"
                          >
                            <Clock size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(session.id, 'cancelled')}
                            className="p-1 hover:bg-red-100 rounded-full text-red-600"
                            title="Cancel session"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No sessions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Session</h2>
            <form onSubmit={handleAddSession} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newSession.location}
                  onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Coffs Harbour Beach"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Conditions</label>
                <textarea
                  value={newSession.conditions}
                  onChange={(e) => setNewSession({ ...newSession, conditions: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Weather and ocean conditions..."
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

      {/* Safety Guidelines */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Session Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-lg mb-2">Weather Conditions</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Check surf and weather reports</li>
              <li>Monitor wind conditions</li>
              <li>Assess wave height and period</li>
              <li>Consider water temperature</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">Session Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Minimum 2 qualified supervisors</li>
              <li>First aid kit on site</li>
              <li>Emergency contact list</li>
              <li>Communication devices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sessions;