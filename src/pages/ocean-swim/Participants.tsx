import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, RefreshCw, Filter, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ParticipantForm from './ParticipantForm';

interface Participant {
  id: string;
  student_id: string;
  swim_level: string;
  medical_clearance: boolean;
  student: {
    first_name: string;
    last_name: string;
    year_group: number;
    house: string;
  };
}

const Participants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    swimLevel: '',
    yearGroup: '',
    medicalClearance: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('ocean_swim_participants')
        .select(`
          *,
          student:students(
            first_name,
            last_name,
            year_group,
            house
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to fetch participants');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddSuccess = () => {
    setSuccess('Participant added successfully');
    setShowAddModal(false);
    fetchParticipants();
    setTimeout(() => setSuccess(null), 3000);
  };

  const filteredParticipants = participants.filter(participant => {
    const searchMatch = 
      `${participant.student.first_name} ${participant.student.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const swimLevelMatch = !filters.swimLevel || participant.swim_level === filters.swimLevel;
    const yearGroupMatch = !filters.yearGroup || participant.student.year_group === parseInt(filters.yearGroup);
    const medicalMatch = !filters.medicalClearance || 
      (filters.medicalClearance === 'yes' ? participant.medical_clearance : !participant.medical_clearance);

    return searchMatch && swimLevelMatch && yearGroupMatch && medicalMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ocean Swim Participants</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchParticipants}
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
            Add Participant
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
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <select
            value={filters.swimLevel}
            onChange={(e) => setFilters({ ...filters, swimLevel: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            value={filters.yearGroup}
            onChange={(e) => setFilters({ ...filters, yearGroup: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Years</option>
            {Array.from({ length: 6 }, (_, i) => i + 7).map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
          <select
            value={filters.medicalClearance}
            onChange={(e) => setFilters({ ...filters, medicalClearance: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Medical Status</option>
            <option value="yes">Cleared</option>
            <option value="no">Not Cleared</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading participants...</p>
            </div>
          ) : filteredParticipants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Swim Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medical Clearance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      House
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.student.first_name} {participant.student.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          participant.swim_level === 'advanced' ? 'bg-green-100 text-green-800' :
                          participant.swim_level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {participant.swim_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          participant.medical_clearance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {participant.medical_clearance ? 'Cleared' : 'Not Cleared'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.student.house}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Year {participant.student.year_group}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No participants found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <ParticipantForm
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Safety Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
          <h2 className="text-lg font-semibold text-yellow-800">Important Safety Notice</h2>
        </div>
        <div className="space-y-4 text-yellow-700">
          <p>
            All participants must have:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Current medical clearance</li>
            <li>Completed swimming assessment</li>
            <li>Signed parental consent form</li>
            <li>Emergency contact information on file</li>
          </ul>
          <p className="text-sm">
            Students without proper documentation will not be allowed to participate in ocean swimming activities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Participants;