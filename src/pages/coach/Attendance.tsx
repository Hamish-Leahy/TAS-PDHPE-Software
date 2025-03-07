import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  RefreshCw, 
  Check,
  X,
  AlertTriangle,
  Users,
  Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: string;
  notes: string | null;
  student: {
    first_name: string;
    last_name: string;
    year_group: number;
  };
  training_session: {
    date: string;
    start_time: string;
    end_time: string;
    team: {
      name: string;
      sport: string;
    };
  };
}

const Attendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamSessions(selectedTeam);
    } else {
      setSessions([]);
    }
  }, [selectedTeam]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAttendance(),
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

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        student:students(
          first_name,
          last_name,
          year_group
        ),
        training_session:training_sessions(
          date,
          start_time,
          end_time,
          team:teams(
            name,
            sport
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setRecords(data || []);
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    setTeams(data || []);
  };

  const fetchTeamSessions = async (teamId: string) => {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: false });

    if (error) throw error;
    setSessions(data || []);
  };

  const handleUpdateStatus = async (recordId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) throw error;

      setSuccess('Attendance status updated successfully');
      fetchAttendance();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update attendance status');
    }
  };

  const handleAddNote = async (recordId: string, note: string) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ notes: note })
        .eq('id', recordId);

      if (error) throw error;

      setSuccess('Note added successfully');
      fetchAttendance();
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      `${record.student.first_name} ${record.student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTeam = !selectedTeam || record.training_session.team.id === selectedTeam;
    const matchesSession = !selectedSession || record.session_id === selectedSession;

    return matchesSearch && matchesTeam && matchesSession;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Records</p>
              <h3 className="text-3xl font-bold mt-2">{records.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Present</p>
              <h3 className="text-3xl font-bold mt-2">
                {records.filter(r => r.status === 'present').length}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Absent</p>
              <h3 className="text-3xl font-bold mt-2">
                {records.filter(r => r.status === 'absent').length}
              </h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Late</p>
              <h3 className="text-3xl font-bold mt-2">
                {records.filter(r => r.status === 'late').length}
              </h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} - {team.sport}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!selectedTeam}
            >
              <option value="">All Sessions</option>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {new Date(session.date).toLocaleDateString()} - {session.start_time}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <p>Loading attendance records...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team & Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map(record => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student.first_name} {record.student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Year {record.student.year_group}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.training_session.team.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.training_session.date).toLocaleDateString()} at{' '}
                        {record.training_session.start_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {record.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(record.id, 'present')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as present"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(record.id, 'absent')}
                          className="text-red-600 hover:text-red-900"
                          title="Mark as absent"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt('Enter note:', record.notes || '');
                            if (note !== null) {
                              handleAddNote(record.id, note);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Add note"
                        >
                          <ClipboardCheck size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No attendance records found</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Managing Attendance</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>Use the filters above to find specific records by team or session</li>
              <li>Click the check mark to mark a student as present</li>
              <li>Click the X to mark a student as absent</li>
              <li>Click the clipboard icon to add notes about attendance</li>
              <li>Use the search bar to quickly find students by name</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Important Notes</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-blue-700">
              <li>Attendance records are automatically created when a training session is scheduled</li>
              <li>Records can be updated at any time</li>
              <li>Add notes to explain absences or late arrivals</li>
              <li>Use the refresh button to see the latest updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;