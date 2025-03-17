import React, { useState, useEffect } from 'react';
import { Waves, Users, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Participant {
  id: string;
  student_id: string;
  swim_level: string;
  status?: 'not_started' | 'in_water' | 'finished' | 'withdrawn';
  start_time?: string;
  finish_time?: string;
  student: {
    first_name: string;
    last_name: string;
  };
}

const RaceTracking = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Get current active session
      const { data: sessionData } = await supabase
        .from('ocean_swim_sessions')
        .select('*')
        .eq('status', 'in_progress')
        .single();

      setActiveSession(sessionData);

      if (sessionData) {
        // Get participants for active session
        const { data: participantData } = await supabase
          .from('ocean_swim_participants')
          .select(`
            *,
            student:students(
              first_name,
              last_name
            )
          `);

        setParticipants(participantData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch race data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartSwim = async (participantId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('ocean_swim_attendance')
        .update({
          status: 'in_water',
          start_time: new Date().toISOString()
        })
        .eq('participant_id', participantId)
        .eq('session_id', activeSession.id);

      if (updateError) throw updateError;

      setParticipants(prev =>
        prev.map(p =>
          p.id === participantId
            ? { ...p, status: 'in_water', start_time: new Date().toISOString() }
            : p
        )
      );

      setSuccess(`Participant started swim at ${new Date().toLocaleTimeString()}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error starting swim:', err);
      setError('Failed to start swim');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleFinishSwim = async (participantId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('ocean_swim_attendance')
        .update({
          status: 'finished',
          finish_time: new Date().toISOString()
        })
        .eq('participant_id', participantId)
        .eq('session_id', activeSession.id);

      if (updateError) throw updateError;

      setParticipants(prev =>
        prev.map(p =>
          p.id === participantId
            ? { ...p, status: 'finished', finish_time: new Date().toISOString() }
            : p
        )
      );

      setSuccess(`Participant finished swim at ${new Date().toLocaleTimeString()}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error finishing swim:', err);
      setError('Failed to record finish');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleWithdraw = async (participantId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('ocean_swim_attendance')
        .update({
          status: 'withdrawn',
          finish_time: new Date().toISOString()
        })
        .eq('participant_id', participantId)
        .eq('session_id', activeSession.id);

      if (updateError) throw updateError;

      setParticipants(prev =>
        prev.map(p =>
          p.id === participantId
            ? { ...p, status: 'withdrawn', finish_time: new Date().toISOString() }
            : p
        )
      );

      setSuccess('Participant withdrawn from swim');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error withdrawing participant:', err);
      setError('Failed to withdraw participant');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Waves className="w-8 h-8 text-blue-600 mr-2" />
          Race Tracking
        </h1>
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

      {/* Active Session Info */}
      {activeSession ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">Active Session</h2>
              <p className="text-gray-600 mt-1">
                {new Date(activeSession.date).toLocaleDateString()} at {activeSession.location}
              </p>
              {activeSession.conditions && (
                <p className="text-gray-600">Conditions: {activeSession.conditions}</p>
              )}
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              In Progress
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
            <p className="text-yellow-700">No active session in progress</p>
          </div>
        </div>
      )}

      {/* Participant Tracking */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Participant Tracking</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {participants.filter(p => p.status === 'in_water').length} swimmers in water
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">
                {participants.filter(p => p.status === 'finished').length} completed
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finish Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
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
                        participant.status === 'finished' ? 'bg-green-100 text-green-800' :
                        participant.status === 'in_water' ? 'bg-blue-100 text-blue-800' :
                        participant.status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.status || 'not_started'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.start_time ? new Date(participant.start_time).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.finish_time ? new Date(participant.finish_time).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {!participant.status || participant.status === 'not_started' ? (
                          <button
                            onClick={() => handleStartSwim(participant.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Start swim"
                          >
                            <Check size={18} />
                          </button>
                        ) : participant.status === 'in_water' ? (
                          <>
                            <button
                              onClick={() => handleFinishSwim(participant.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Finish swim"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleWithdraw(participant.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Withdraw"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Safety Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Safety Instructions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-medium text-lg mb-2 text-blue-800">Start Procedure</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-700">
              <li>Verify participant is ready</li>
              <li>Check safety equipment</li>
              <li>Confirm medical clearance</li>
              <li>Record start time accurately</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="font-medium text-lg mb-2 text-green-800">During Swim</h3>
            <ul className="list-disc list-inside space-y-2 text-green-700">
              <li>Maintain visual contact</li>
              <li>Monitor for distress</li>
              <li>Track position in water</li>
              <li>Ready rescue equipment</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-red-50">
            <h3 className="font-medium text-lg mb-2 text-red-800">Emergency Response</h3>
            <ul className="list-disc list-inside space-y-2 text-red-700">
              <li>Signal for assistance</li>
              <li>Initiate rescue protocol</li>
              <li>Contact emergency services</li>
              <li>Document incident details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceTracking;