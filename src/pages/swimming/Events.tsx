import React, { useState, useEffect } from 'react';
import { School as Pool, Plus, Search, RefreshCw, Filter, Timer, Medal, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  name: string;
  stroke: string;
  distance: number;
  age_group: string;
  gender: string;
  status: string;
  scheduled_time: string | null;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    stroke: '',
    ageGroup: '',
    gender: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('swimming_events')
        .select('*')
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStrokeColor = (stroke: string) => {
    switch (stroke) {
      case 'freestyle':
        return 'bg-blue-100 text-blue-800';
      case 'backstroke':
        return 'bg-green-100 text-green-800';
      case 'breaststroke':
        return 'bg-yellow-100 text-yellow-800';
      case 'butterfly':
        return 'bg-purple-100 text-purple-800';
      case 'medley':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = 
      (!filters.stroke || event.stroke === filters.stroke) &&
      (!filters.ageGroup || event.age_group === filters.ageGroup) &&
      (!filters.gender || event.gender === filters.gender);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Swimming Events</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchEvents}
            disabled={refreshing}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
          >
            <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Add Event
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
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <select
            value={filters.stroke}
            onChange={(e) => setFilters({ ...filters, stroke: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Strokes</option>
            <option value="freestyle">Freestyle</option>
            <option value="backstroke">Backstroke</option>
            <option value="breaststroke">Breaststroke</option>
            <option value="butterfly">Butterfly</option>
            <option value="medley">Medley</option>
          </select>
          <select
            value={filters.ageGroup}
            onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Age Groups</option>
            <option value="Under 12">Under 12</option>
            <option value="Under 13">Under 13</option>
            <option value="Under 14">Under 14</option>
            <option value="Under 15">Under 15</option>
            <option value="Under 16">Under 16</option>
            <option value="Open">Open</option>
          </select>
          <select
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{event.name}</h3>
                  <p className="text-sm text-gray-500">
                    {event.distance}m {event.stroke}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStrokeColor(event.stroke)}`}>
                  {event.stroke}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{event.age_group}</span>
                  <span className="text-sm font-medium capitalize">{event.gender}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {event.scheduled_time 
                      ? new Date(event.scheduled_time).toLocaleString()
                      : 'Time TBD'
                    }
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">
                  View Heats
                </button>
                <button className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200">
                  Results
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-md p-6 text-center">
            <Pool size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No events found</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Event Management Guide</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Event Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Individual Events</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Freestyle: 50m, 100m, 200m</li>
                  <li>Backstroke: 50m, 100m</li>
                  <li>Breaststroke: 50m, 100m</li>
                  <li>Butterfly: 50m, 100m</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Medley Events</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Individual Medley: 200m</li>
                  <li>Medley Relay: 4x50m</li>
                  <li>Order: Fly, Back, Breast, Free</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Relay Events</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Freestyle Relay: 4x50m</li>
                  <li>Mixed Relay: 4x50m</li>
                  <li>House Relay: 4x50m</li>
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
              <li>Events must be created in chronological order</li>
              <li>Check age groups and gender categories carefully</li>
              <li>Allow sufficient time between events</li>
              <li>Consider warm-up and marshalling times</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;