import React, { useState, useEffect } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HelpRequest {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string | null;
}

const HelpRequestsSection: React.FC = () => {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching help requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (request: HelpRequest) => {
    try {
      const { error } = await supabase
        .from('help_requests')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: 'admin', // You might want to use the actual admin's name/ID
          notes: notes || null
        })
        .eq('id', request.id);

      if (error) throw error;

      setSelectedRequest(null);
      setNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Error resolving help request:', err);
      setError('Failed to resolve request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading help requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <MessageCircle size={24} className="text-blue-600 mr-2" />
          Help Requests
        </h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {requests.filter(r => r.status === 'pending').length} pending
        </span>
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-500 italic text-center py-4">
          No help requests at this time.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div
              key={request.id}
              className={`border rounded-lg p-4 ${
                request.status === 'pending' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{request.name}</h3>
                  <p className="text-sm text-gray-600">{request.email}</p>
                  <p className="mt-2">{request.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Submitted: {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {request.status}
                  </span>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-1 hover:bg-blue-100 rounded-full"
                    >
                      <Check size={18} className="text-green-600" />
                    </button>
                  )}
                </div>
              </div>

              {request.status === 'resolved' && request.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Resolution Notes:</span> {request.notes}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Resolved by {request.resolved_by} on {new Date(request.resolved_at!).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Resolve Help Request</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="font-medium">{selectedRequest.name}</p>
              <p className="text-sm text-gray-600">{selectedRequest.email}</p>
              <p className="mt-2">{selectedRequest.message}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about how the request was resolved..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(selectedRequest)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpRequestsSection;