import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, RefreshCw, Filter, Send, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Communication {
  id: string;
  sender_id: string;
  recipient_type: 'team' | 'individual' | 'all';
  recipient_id: string | null;
  subject: string;
  message: string;
  status: 'draft' | 'sent' | 'read';
  created_at: string;
  sender: {
    name: string;
    email: string;
  };
}

const Communications = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState({
    recipient_type: 'team',
    recipient_id: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCommunications(),
        fetchTeams()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_communications')
        .select(`
          *,
          sender:coaches(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (err) {
      console.error('Error fetching communications:', err);
      setError('Failed to fetch communications');
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

  const handleSendMessage = async (e: React.FormEvent) => {
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
        .from('coach_communications')
        .insert({
          sender_id: coachData.id,
          ...newMessage
        });

      if (error) throw error;

      setSuccess('Message sent successfully');
      setShowAddModal(false);
      setNewMessage({
        recipient_type: 'team',
        recipient_id: '',
        subject: '',
        message: ''
      });
      fetchCommunications();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coach_communications')
        .update({ status: 'read' })
        .eq('id', id);

      if (error) throw error;

      fetchCommunications();
    } catch (err) {
      console.error('Error marking message as read:', err);
      setError('Failed to update message status');
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = 
      comm.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = 
      (!filters.type || comm.recipient_type === filters.type) &&
      (!filters.status || comm.status === filters.status);

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Communications</h1>
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-2" />
            New Message
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
                placeholder="Search messages..."
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
            <option value="team">Team</option>
            <option value="individual">Individual</option>
            <option value="all">Broadcast</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading communications...</p>
            </div>
          ) : filteredCommunications.length > 0 ? (
            <div className="space-y-4">
              {filteredCommunications.map(comm => (
                <div key={comm.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{comm.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        From: {comm.sender.name} ({comm.sender.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        To: {comm.recipient_type === 'all' ? 'All Teams' : 
                            comm.recipient_type === 'team' ? 
                            teams.find(t => t.id === comm.recipient_id)?.name || 'Unknown Team' : 
                            'Individual'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comm.status === 'read' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {comm.status}
                      </span>
                      {comm.status === 'sent' && (
                        <button
                          onClick={() => handleMarkAsRead(comm.id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="Mark as read"
                        >
                          <Check size={16} className="text-green-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-gray-700">{comm.message}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    {new Date(comm.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No communications found</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Message</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Recipient Type</label>
                <select
                  value={newMessage.recipient_type}
                  onChange={(e) => setNewMessage({ ...newMessage, recipient_type: e.target.value as 'team' | 'individual' | 'all' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="team">Team</option>
                  <option value="all">All Teams (Broadcast)</option>
                </select>
              </div>

              {newMessage.recipient_type === 'team' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Team</label>
                  <select
                    value={newMessage.recipient_id}
                    onChange={(e) => setNewMessage({ ...newMessage, recipient_id: e.target.value })}
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
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Message subject"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={6}
                  placeholder="Type your message here..."
                  required
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
                  <Send size={18} className="mr-2" />
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communications;