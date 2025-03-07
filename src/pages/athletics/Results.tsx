import React, { useState, useEffect } from 'react';
import { Medal, Search, RefreshCw, Filter, Download, Timer, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Result {
  id: string;
  entry_id: string;
  value: number;
  wind_reading: number | null;
  is_legal: boolean;
  notes: string | null;
  entry: {
    student: {
      first_name: string;
      last_name: string;
      house: string;
    };
    event: {
      name: string;
      type: string;
      measurement_unit: string;
    };
    division: {
      name: string;
      gender: string;
    };
  };
}

const Results = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    event: '',
    division: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchResults(),
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

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('event_results')
      .select(`
        *,
        entry:athlete_entries(
          student:students(
            first_name,
            last_name,
            house
          ),
          event:carnival_events(
            name,
            type,
            measurement_unit
          ),
          division:event_divisions(
            name,
            gender
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setResults(data || []);
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

  const exportResults = () => {
    const headers = ['Athlete', 'Event', 'Division', 'Result', 'Wind', 'Legal', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredResults.map(result => [
        `${result.entry.student.first_name} ${result.entry.student.last_name}`,
        result.entry.event.name,
        `${result.entry.division.name} - ${result.entry.division.gender}`,
        `${result.value} ${result.entry.event.measurement_unit}`,
        result.wind_reading || '',
        result.is_legal ? 'Yes' : 'No',
        result.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'athletics-results.csv';
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

  const filteredResults = results.filter(result => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      `${result.entry.student.first_name} ${result.entry.student.last_name}`.toLowerCase().includes(searchLower) ||
      result.entry.event.name.toLowerCase().includes(searchLower);

    const matchesFilters = 
      (!filters.event || result.entry.event.name === filters.event) &&
      (!filters.division || result.entry.division.name === filters.division);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Results</h1>
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
            onClick={exportResults}
            disabled={results.length === 0}
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
              <option key={event.id} value={event.name}>{event.name}</option>
            ))}
          </select>
          <select
            value={filters.division}
            onChange={(e) => setFilters({ ...filters, division: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Divisions</option>
            {divisions.map(division => (
              <option key={division.id} value={division.name}>
                {division.name} - {division.gender}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <p>Loading results...</p>
          </div>
        ) : filteredResults.length > 0 ? (
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
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wind
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.entry.student.first_name} {result.entry.student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.entry.student.house}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getEventTypeIcon(result.entry.event.type)}
                        </span>
                        <div className="text-sm text-gray-900">
                          {result.entry.event.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.entry.division.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.entry.division.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.value} {result.entry.event.measurement_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.wind_reading ? `${result.wind_reading} m/s` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.is_legal
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.is_legal ? 'Legal' : 'Foul'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Medal size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No results found</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Results Guide</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Understanding Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Track Events</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Results recorded in minutes and seconds</li>
                  <li>Wind readings required for sprint events</li>
                  <li>False starts result in disqualification</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Field Events</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Distances measured in meters</li>
                  <li>Heights measured in centimeters</li>
                  <li>Best legal attempt is recorded</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <h3 className="font-medium text-amber-800">Important Notes</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
              <li>Results are final once entered and verified</li>
              <li>Wind readings above +2.0 m/s are not legal for records</li>
              <li>All measurements are rounded according to IAAF rules</li>
              <li>Records must be separately verified and approved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;