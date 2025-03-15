import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, RefreshCw, Filter, Save, X, Calendar, Clock, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Room {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  capacity: number;
  facilities: string[];
  floor_level: string;
  building: string;
  notes: string | null;
}

interface Booking {
  id: string;
  resource_id: string;
  coach_id: string;
  team_id: string;
  training_session_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  attendees_count: number;
  status: string;
  resource: Room;
  coach: {
    name: string;
    email: string;
  };
  team: {
    name: string;
    sport: string;
  };
  training_session?: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
  };
}

const Resources = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    building: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newBooking, setNewBooking] = useState({
    team_id: '',
    training_session_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    purpose: '',
    attendees_count: 1,
    recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRooms(),
        fetchBookings(),
        fetchTeams(),
        fetchTrainingSessions()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_resources')
        .select('*')
        .in('type', ['room', 'gym'])
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to fetch rooms');
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_resource_bookings')
        .select(`
          *,
          resource:coach_resources(*),
          coach:coaches(name,email),
          team:teams(name,sport),
          training_session:training_sessions(
            id,
            date,
            start_time,
            end_time,
            location
          )
        `)
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings');
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchTrainingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setTrainingSessions(data || []);
    } catch (err) {
      console.error('Error fetching training sessions:', err);
    }
  };

  const handleBookRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
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
        .from('coach_resource_bookings')
        .insert({
          resource_id: selectedRoom.id,
          coach_id: coachData.id,
          ...newBooking
        });

      if (error) throw error;

      setSuccess('Room booked successfully');
      setShowBookingModal(false);
      setSelectedRoom(null);
      setNewBooking({
        team_id: '',
        training_session_id: '',
        booking_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        purpose: '',
        attendees_count: 1,
        recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_end_date: ''
      });
      fetchBookings();
    } catch (err) {
      console.error('Error booking room:', err);
      setError('Failed to book room');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gym':
        return 'bg-purple-100 text-purple-800';
      case 'room':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = 
      (!filters.type || room.type === filters.type) &&
      (!filters.status || room.status === filters.status) &&
      (!filters.building || room.building === filters.building);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Room Bookings</h1>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
        >
          <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="gym">Gym</option>
            <option value="room">Room</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select
            value={filters.building}
            onChange={(e) => setFilters({ ...filters, building: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Buildings</option>
            <option value="Sports Complex">Sports Complex</option>
            <option value="Main Building">Main Building</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p>Loading rooms...</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{room.name}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(room.type)}`}>
                        {room.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Capacity: {room.capacity}</p>
                    <p className="text-sm text-gray-500">{room.building}</p>
                    <p className="text-sm text-gray-500">{room.floor_level}</p>
                  </div>
                </div>

                {room.facilities && room.facilities.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Facilities:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {room.facilities.map((facility, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {room.notes && (
                  <p className="mt-3 text-sm text-gray-600">{room.notes}</p>
                )}

                <button
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowBookingModal(true);
                  }}
                  disabled={room.status !== 'available'}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Book Room
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <Box size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No rooms found</p>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.resource.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.resource.building} - {booking.resource.floor_level}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.team.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.team.sport}
                        </div>
                        {booking.training_session && (
                          <div className="flex items-center text-sm text-blue-600 mt-1">
                            <LinkIcon size={14} className="mr-1" />
                            Training: {new Date(booking.training_session.date).toLocaleDateString()} at {booking.training_session.start_time}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.start_time} - {booking.end_time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.purpose}
                        </div>
                        <div className="text-sm text-gray-500">
                          Attendees: {booking.attendees_count}
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
            <p className="text-center py-4 text-gray-500">No bookings found</p>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Book {selectedRoom.name}</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedRoom(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{selectedRoom.name}</h3>
                  <p className="text-sm text-gray-500">{selectedRoom.building} - {selectedRoom.floor_level}</p>
                  <p className="text-sm text-gray-500">Capacity: {selectedRoom.capacity} people</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedRoom.status)}`}>
                    {selectedRoom.status}
                  </span>
                </div>
              </div>

              {selectedRoom.facilities && selectedRoom.facilities.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Available Facilities:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRoom.facilities.map((facility, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleBookRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team</label>
                  <select
                    value={newBooking.team_id}
                    onChange={(e) => setNewBooking({ ...newBooking, team_id: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700">Training Session (Optional)</label>
                  <select
                    value={newBooking.training_session_id}
                    onChange={(e) => setNewBooking({ ...newBooking, training_session_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Training Session</option>
                    {trainingSessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {new Date(session.date).toLocaleDateString()} - {session.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <input
                  type="text"
                  value={newBooking.purpose}
                  onChange={(e) => setNewBooking({ ...newBooking, purpose: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Team Training, Meeting, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={newBooking.booking_date}
                    onChange={(e) => setNewBooking({ ...newBooking, booking_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Attendees</label>
                  <input
                    type="number"
                    value={newBooking.attendees_count}
                    onChange={(e) => setNewBooking({ ...newBooking, attendees_count: parseInt(e.target.value) })}
                    min="1"
                    max={selectedRoom.capacity}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newBooking.start_time}
                    onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newBooking.end_time}
                    onChange={(e) => setNewBooking({ ...newBooking, end_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newBooking.recurring}
                    onChange={(e) => setNewBooking({ ...newBooking, recurring: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recurring Booking</span>
                </label>
              </div>

              {newBooking.recurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recurrence Pattern</label>
                    <select
                      value={newBooking.recurrence_pattern}
                      onChange={(e) => setNewBooking({ ...newBooking, recurrence_pattern: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={newBooking.recurrence_end_date}
                      onChange={(e) => setNewBooking({ ...newBooking, recurrence_end_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedRoom(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Calendar size={18} className="mr-2" />
                  Book Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;