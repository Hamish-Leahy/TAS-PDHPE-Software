import React, { useState, useEffect } from 'react';
import { Medal, Search, RefreshCw, Filter, Download, Timer, AlertTriangle, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Record {
  id: string;
  event_id: string;
  division_id: string;
  student_id: string;
  value: number;
  date_set: string;
  competition_name: string;
  verified: boolean;
  event: {
    name: string;
    type: string;
    measurement_unit: string;
  };
  division: {
    name: string;
    gender: string;
  };
  student: {
    first_name: string;
    last_name: string;
  };
}

const Records = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    event: '',
    division: '',
    verified: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRecords(),
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

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('carnival_records')
      .select(`
        *,
        event:carnival_events(
          name,
          type,
          measurement_unit
        ),
        division:event_divisions(
          name,
          gender
        ),
        student:students(
          first_name,
          last_name
        )
      `)
      .order('date_set', { ascending: false });

    if (error) throw error;
    setRecords(data || []);
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

  const exportRecords = () => {
    const headers = ['Event', 'Division', 'Athlete', 'Record', 'Date Set', 'Competition', 'Verified'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.event.name,
        `${record.division.name} - ${record.division.gender}`,
        `${record.student.first_name} ${record.student.last_name}`,
        `${record.value} ${record.event.measurement_unit}`,
        new Date(record.date_set).toLocaleDateString(),
        record.competition_name,
        record.verified ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'carnival-records.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const filteredRecords = records.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      `${record.student.first_name} ${record.student.last_name}`.toLowerCase().includes(searchLower) ||
      record.event.name.toLowerCase().includes(searchLower) ||
      record.competition_name.toLowerCase().includes(searchLower);

    const matchesFilters = 
      (!filters.event || record.event_id === filters.event) &&
      (!filters.division || record.division_id === filters.division) &&
      (filters.verified === '' || record.verified === (filters.verified === 'true'));

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Carnival Records</h1>
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
            onClick={exportRecords}
            disabled={records.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Download size={18} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
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
                placeholder="Search by athlete, event, or competition..."
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
            value={filters.verified}
            onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Records</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <p>Loading records...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Record Holder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Record
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getEventTypeIcon(record.event.type)}
                        </span>
                        <div className="text-sm text-gray-900">
                          {record.event.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.division.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.division.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student.first_name} {record.student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.date_set).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.value} {record.event.measurement_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.competition_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No records found</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Records Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Record Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Track Records</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Timed events measured to 0.01 seconds</li>
                  <li>Electronic timing for sprints</li>
                  <li>Wind readings must be legal (+2.0 m/s or less)</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Field Records</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Jumps measured to nearest centimeter</li>
                  <li>Throws measured to nearest centimeter</li>
                  <li>All implements must be certified</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <h3 className="font-medium text-amber-800">Record Verification</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
              <li>All records must be verified by officials</li>
              <li>Supporting documentation required for verification</li>
              <li>Records must be set in sanctioned competitions</li>
              <li>Age verification required for age group records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Records;