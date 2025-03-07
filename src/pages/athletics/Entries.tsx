import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, RefreshCw, Filter, Timer, Medal, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Entry {
  id: string;
  student_id: string;
  event_id: string;
  division_id: string;
  heat_id: string | null;
  lane_number: number | null;
  status: string;
  student: {
    first_name: string;
    last_name: string;
    year_group: number;
    house: string;
  };
  event: {
    name: string;
    type: string;
  };
  division: {
    name: string;
    gender: string;
  };
}

const Entries = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    event: '',
    division: '',
    status: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEntries(),
        fetchEvents(),
        fetchDivisions()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('athlete_entries')
      .select(`
        *,
        student:students(
          first_name,
          last_name,
          year_group,
          house
        ),
        event:carnival_events(
          name,
          type
        ),
        division:event_divisions(
          name,
          gender
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setEntries(data || []);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('carnival_events')
      .select('*')
      .order('name');

    if (error) throw error;
    setEvents(data || []);
  };

  const fetchDivisions = async () => {
    const { data, error } = await supabase
      .from('event_divisions')
      .select('*')
      .order('name');

    if (error) throw error;
    setDivisions(data || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-green-100 text-green-800';
      case 'scratched':
        return 'bg-red-100 text-red-800';
      case 'dns':
        return 'bg-yellow-100 text-yellow-800';
      case 'dnf':
        return 'bg-orange-100 text-orange-800';
      case 'dq':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'track':
        return <Timer className="w-5 h-5" />;
      case 'field':
        return <Medal className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const filteredEntries = entries.filter(entry => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      `${entry.student.first_name} ${entry.student.last_name}`.toLowerCase().includes(searchLower) ||
      entry.event.name.toLowerCase().includes(searchLower);

    const matchesFilters = 
      (!filters.event || entry.event_id === filters.event) &&
      (!filters.division || entry.division_id === filters.division) &&
      (!filters.status || entry.status === filters.status);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Entries</h1>
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
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Add Entry
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
                placeholder="Search by athlete name or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <select
            value={filters.event}
            onChange={(e) => setFilters({ ...filters, event: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
          <select
            value={filters.division}
            onChange={(e) => setFilters({ ...filters, division: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Divisions</option>
            {divisions.map(division => (
              <option key={division.id} value={division.id}>
                {division.name} - {division.gender}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="registered">Registered</option>
            <option value="scratched">Scratched</option>
            <option value="dns">DNS</option>
            <option value="dnf">DNF</option>
            <option value="dq">DQ</option>
          </select>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <p>Loading entries...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heat/Lane
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.student.first_name} {entry.student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Year {entry.student.year_group} - {entry.student.house}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getEventTypeIcon(entry.event.type)}
                        </span>
                        <div className="text-sm text-gray-900">{entry.event.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.division.name}</div>
                      <div className="text-sm text-gray-500">{entry.division.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.heat_id ? (
                        <span>
                          Heat {entry.heat_id}
                          {entry.lane_number && ` - Lane ${entry.lane_number}`}
                        </span>
                      ) : (
                        'Not assigned'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No entries found</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Managing Entries</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Entry Status Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="font-medium text-green-800">Registered</span>
                <p className="text-sm text-green-600 mt-1">Athlete is confirmed for the event</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="font-medium text-red-800">Scratched</span>
                <p className="text-sm text-red-600 mt-1">Withdrawn before the event</p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="font-medium text-yellow-800">DNS</span>
                <p className="text-sm text-yellow-600 mt-1">Did not start</p>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="font-medium text-orange-800">DNF</span>
                <p className="text-sm text-orange-600 mt-1">Did not finish</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="font-medium text-purple-800">DQ</span>
                <p className="text-sm text-purple-600 mt-1">Disqualified</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <h3 className="font-medium text-amber-800">Important Notes</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
              <li>Athletes can only be entered in events for their age group</li>
              <li>Check division requirements before adding entries</li>
              <li>Heat and lane assignments will be done separately</li>
              <li>Status changes are logged for tracking purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Entries;