import React, { useState, useEffect } from 'react';
import { Timer, Plus, RefreshCw, Filter, Clock, MapPin, X, Edit, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  name: string;
  type: 'track' | 'field' | 'relay';
  measurement_unit: string;
  scoring_type: string;
  min_value: number | null;
  max_value: number | null;
  decimal_places: number;
  divisions: EventDivision[];
}

interface EventDivision {
  id: string;
  name: string;
  min_age: number | null;
  max_age: number | null;
  gender: 'male' | 'female' | 'mixed';
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState({
    type: '',
    division: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    name: '',
    type: 'track',
    measurement_unit: '',
    scoring_type: 'time',
    min_value: '',
    max_value: '',
    decimal_places: 2,
    divisions: [
      {
        name: '',
        min_age: '',
        max_age: '',
        gender: 'mixed'
      }
    ]
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('carnival_events')
        .select('*, divisions:event_divisions(*)')
        .order('name');

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // First create the event
      const { data: eventData, error: eventError } = await supabase
        .from('carnival_events')
        .insert([{
          name: newEvent.name,
          type: newEvent.type,
          measurement_unit: newEvent.measurement_unit,
          scoring_type: newEvent.scoring_type,
          min_value: newEvent.min_value ? parseFloat(newEvent.min_value) : null,
          max_value: newEvent.max_value ? parseFloat(newEvent.max_value) : null,
          decimal_places: newEvent.decimal_places
        }])
        .select();

      if (eventError) throw eventError;

      // Then create the divisions
      const divisions = newEvent.divisions.map(division => ({
        event_id: eventData[0].id,
        name: division.name,
        min_age: division.min_age ? parseInt(division.min_age as string) : null,
        max_age: division.max_age ? parseInt(division.max_age as string) : null,
        gender: division.gender
      }));

      const { error: divisionsError } = await supabase
        .from('event_divisions')
        .insert(divisions);

      if (divisionsError) throw divisionsError;

      setSuccess('Event created successfully');
      setShowAddModal(false);
      setNewEvent({
        name: '',
        type: 'track',
        measurement_unit: '',
        scoring_type: 'time',
        min_value: '',
        max_value: '',
        decimal_places: 2,
        divisions: [
          {
            name: '',
            min_age: '',
            max_age: '',
            gender: 'mixed'
          }
        ]
      });
      fetchEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all divisions and results.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('carnival_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Event deleted successfully');
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
    }
  };

  const handleAddDivision = () => {
    setNewEvent(prev => ({
      ...prev,
      divisions: [
        ...prev.divisions,
        {
          name: '',
          min_age: '',
          max_age: '',
          gender: 'mixed'
        }
      ]
    }));
  };

  const handleRemoveDivision = (index: number) => {
    setNewEvent(prev => ({
      ...prev,
      divisions: prev.divisions.filter((_, i) => i !== index)
    }));
  };

  const handleDivisionChange = (index: number, field: string, value: string) => {
    setNewEvent(prev => ({
      ...prev,
      divisions: prev.divisions.map((division, i) => 
        i === index ? { ...division, [field]: value } : division
      )
    }));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'track':
        return 'bg-blue-100 text-blue-800';
      case 'field':
        return 'bg-green-100 text-green-800';
      case 'relay':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMeasurementUnitOptions = (type: string) => {
    switch (type) {
      case 'track':
        return ['seconds', 'minutes'];
      case 'field':
        return ['meters', 'centimeters'];
      case 'relay':
        return ['seconds', 'minutes'];
      default:
        return [];
    }
  };

  const filteredEvents = events.filter(event => {
    return (
      (!filter.type || event.type === filter.type)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Events Management</h1>
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
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center"
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

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Event</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  placeholder="e.g., 100m Sprint"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    required
                  >
                    <option value="track">Track</option>
                    <option value="field">Field</option>
                    <option value="relay">Relay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Measurement Unit</label>
                  <select
                    value={newEvent.measurement_unit}
                    onChange={(e) => setNewEvent({ ...newEvent, measurement_unit: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select Unit</option>
                    {getMeasurementUnitOptions(newEvent.type).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scoring Type</label>
                  <select
                    value={newEvent.scoring_type}
                    onChange={(e) => setNewEvent({ ...newEvent, scoring_type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    required
                  >
                    <option value="time">Time</option>
                    <option value="distance">Distance</option>
                    <option value="height">Height</option>
                    <option value="points">Points</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Decimal Places</label>
                  <input
                    type="number"
                    value={newEvent.decimal_places}
                    onChange={(e) => setNewEvent({ ...newEvent, decimal_places: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    min="0"
                    max="3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Value</label>
                  <input
                    type="number"
                    value={newEvent.min_value}
                    onChange={(e) => setNewEvent({ ...newEvent, min_value: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Value</label>
                  <input
                    type="number"
                    value={newEvent.max_value}
                    onChange={(e) => setNewEvent({ ...newEvent, max_value: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Divisions</h3>
                  <button
                    type="button"
                    onClick={handleAddDivision}
                    className="text-amber-600 hover:text-amber-800 flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Division
                  </button>
                </div>

                {newEvent.divisions.map((division, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">Division {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDivision(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={division.name}
                        onChange={(e) => handleDivisionChange(index, 'name', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="Division name"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500">Min Age</label>
                        <input
                          type="number"
                          value={division.min_age}
                          onChange={(e) => handleDivisionChange(index, 'min_age', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-500">Max Age</label>
                        <input
                          type="number"
                          value={division.max_age}
                          onChange={(e) => handleDivisionChange(index, 'max_age', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-500">Gender</label>
                        <select
                          value={division.gender}
                          onChange={(e) => handleDivisionChange(index, 'gender', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          required
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
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
                  className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
        >
          <option value="">All Event Types</option>
          <option value="track">Track</option>
          <option value="field">Field</option>
          <option value="relay">Relay</option>
        </select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{event.name}</h3>
                  <span className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Measurement:</span> {event.measurement_unit}
                </div>
                <div>
                  <span className="font-medium">Scoring:</span> {event.scoring_type}
                </div>
                {event.min_value !== null && (
                  <div>
                    <span className="font-medium">Min Value:</span> {event.min_value}
                  </div>
                )}
                {event.max_value !== null && (
                  <div>
                    <span className="font-medium">Max Value:</span> {event.max_value}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Divisions</h4>
                <div className="space-y-2">
                  {event.divisions.map(division => (
                    <div key={division.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium">{division.name}</h5>
                          <p className="text-sm text-gray-500">
                            {division.min_age && division.max_age
                              ? `Ages ${division.min_age}-${division.max_age}`
                              : 'No age restriction'}
                          </p>
                        </div>
                        <span className="text-sm text-gray-600 capitalize">{division.gender}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-md p-6 text-center">
            <Timer size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No events found</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Managing Events</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>Click "Add Event" to create a new event</li>
              <li>Specify event details including name, type, and measurement units</li>
              <li>Create divisions based on age groups and gender</li>
              <li>Set minimum and maximum values for result validation</li>
              <li>Use the filter to view specific event types</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Event Types</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-blue-700">
              <li>Track: Running events measured in time</li>
              <li>Field: Events like long jump, high jump measured in distance/height</li>
              <li>Relay: Team events measured in time</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-md">
            <h3 className="font-medium text-amber-800">Important Notes</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-amber-700">
              <li>Deleting an event will remove all associated divisions and results</li>
              <li>Age groups should align with school policies</li>
              <li>Consider adding multiple divisions for inclusive participation</li>
              <li>Set appropriate min/max values to prevent data entry errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;