import React, { useState, useEffect } from 'react';
import { Clock8, Plus, Search, RefreshCw, Filter, Save, X, Check, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Timesheet {
  id: string;
  coach_id: string;
  date: string;
  start_time: string;
  end_time: string;
  activity_type: string;
  description: string;
  status: string;
  created_at: string;
  coach: {
    name: string;
    email: string;
  };
}

const Timesheets = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    activityType: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newTimesheet, setNewTimesheet] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    activity_type: 'training',
    description: ''
  });

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('coach_timesheets')
        .select(`
          *,
          coach:coaches(name, email)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setTimesheets(data || []);
    } catch (err) {
      console.error('Error fetching timesheets:', err);
      setError('Failed to fetch timesheets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Get current coach's ID
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('email', (await supabase.auth.getSession()).data.session?.user.email)
        .single();

      if (!coachData) {
        throw new Error('Coach not found');
      }

      const { error } = await supabase
        .from('coach_timesheets')
        .insert({
          coach_id: coachData.id,
          ...newTimesheet
        });

      if (error) throw error;

      setSuccess('Timesheet submitted successfully');
      setShowAddModal(false);
      setNewTimesheet({
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        activity_type: 'training',
        description: ''
      });
      fetchTimesheets();
    } catch (err) {
      console.error('Error submitting timesheet:', err);
      setError('Failed to submit timesheet');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'bg-blue-100 text-blue-800';
      case 'game':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesSearch = 
      timesheet.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = 
      (!filters.status || timesheet.status === filters.status) &&
      (!filters.activityType || timesheet.activity_type === filters.activityType);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Timesheets</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchTimesheets}
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
            Add Timesheet
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
                placeholder="Search timesheets..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.activityType}
            onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Activities</option>
            <option value="training">Training</option>
            <option value="game">Game</option>
            <option value="meeting">Meeting</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Timesheets List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading timesheets...</p>
            </div>
          ) : filteredTimesheets.length > 0 ? (
            <div className="space-y-4">
              {filteredTimesheets.map(timesheet => (
                <div key={timesheet.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActivityTypeColor(timesheet.activity_type)}`}>
                          {timesheet.activity_type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(timesheet.status)}`}>
                          {timesheet.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {new Date(timesheet.date).toLocaleDateString()}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {timesheet.start_time} - {timesheet.end_time}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{timesheet.coach.name}</p>
                      <p className="text-sm text-gray-500">{timesheet.coach.email}</p>
                    </div>
                  </div>
                  {timesheet.description && (
                    <p className="mt-3 text-gray-700">{timesheet.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock8 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No timesheets found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Timesheet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Timesheet</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitTimesheet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={newTimesheet.date}
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newTimesheet.start_time}
                    onChange={(e) => setNewTimesheet({ ...newTimesheet, start_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newTimesheet.end_time}
                    onChange={(e) => setNewTimesheet({ ...newTimesheet, end_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                <select
                  value={newTimesheet.activity_type}
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, activity_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="training">Training</option>
                  <option value="game">Game</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newTimesheet.description}
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any additional details..."
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  Submit Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheets;