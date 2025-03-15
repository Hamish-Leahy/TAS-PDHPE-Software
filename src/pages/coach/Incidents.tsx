import React, { useState, useEffect } from 'react';
import { Ban as Bandage, Plus, Search, RefreshCw, Filter, Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Incident {
  id: string;
  reporter_id: string;
  incident_date: string;
  incident_time: string;
  location: string;
  incident_type: string;
  severity: string;
  description: string;
  action_taken: string | null;
  status: string;
  created_at: string;
  reporter: {
    name: string;
    email: string;
  };
}

const Incidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newIncident, setNewIncident] = useState({
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    location: '',
    incident_type: 'injury',
    severity: 'low',
    description: '',
    action_taken: ''
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('coach_incidents')
        .select(`
          *,
          reporter:coaches(name,email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Failed to fetch incidents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
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
        .from('coach_incidents')
        .insert({
          reporter_id: coachData.id,
          ...newIncident
        });

      if (error) throw error;

      setSuccess('Incident reported successfully');
      setShowAddModal(false);
      setNewIncident({
        incident_date: new Date().toISOString().split('T')[0],
        incident_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        location: '',
        incident_type: 'injury',
        severity: 'low',
        description: '',
        action_taken: ''
      });
      fetchIncidents();
    } catch (err) {
      console.error('Error reporting incident:', err);
      setError('Failed to report incident');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'injury':
        return 'bg-red-100 text-red-800';
      case 'behavior':
        return 'bg-purple-100 text-purple-800';
      case 'equipment':
        return 'bg-blue-100 text-blue-800';
      case 'facility':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = 
      (!filters.type || incident.incident_type === filters.type) &&
      (!filters.severity || incident.severity === filters.severity) &&
      (!filters.status || incident.status === filters.status);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Incident Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchIncidents}
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
            Report Incident
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
                placeholder="Search incidents..."
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
            <option value="injury">Injury</option>
            <option value="behavior">Behavior</option>
            <option value="equipment">Equipment</option>
            <option value="facility">Facility</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="reported">Reported</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading incidents...</p>
            </div>
          ) : filteredIncidents.length > 0 ? (
            <div className="space-y-4">
              {filteredIncidents.map(incident => (
                <div key={incident.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(incident.incident_type)}`}>
                          {incident.incident_type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(incident.incident_date).toLocaleDateString()} at {incident.incident_time}
                      </p>
                      <p className="text-sm text-gray-500">Location: {incident.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{incident.reporter.name}</p>
                      <p className="text-sm text-gray-500">{incident.reporter.email}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-gray-700">{incident.description}</p>
                    {incident.action_taken && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Action Taken:</p>
                        <p className="text-sm text-gray-600">{incident.action_taken}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Reported: {new Date(incident.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bandage size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No incidents found</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Incident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Report Incident</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={newIncident.incident_date}
                    onChange={(e) => setNewIncident({ ...newIncident, incident_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={newIncident.incident_time}
                    onChange={(e) => setNewIncident({ ...newIncident, incident_time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Where did the incident occur?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Incident Type</label>
                  <select
                    value={newIncident.incident_type}
                    onChange={(e) => setNewIncident({ ...newIncident, incident_type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="injury">Injury</option>
                    <option value="behavior">Behavior</option>
                    <option value="equipment">Equipment</option>
                    <option value="facility">Facility</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe what happened..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Action Taken</label>
                <textarea
                  value={newIncident.action_taken}
                  onChange={(e) => setNewIncident({ ...newIncident, action_taken: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe any immediate actions taken..."
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
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;