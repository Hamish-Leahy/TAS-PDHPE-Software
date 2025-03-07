import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  RefreshCw, 
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Team {
  id: string;
  name: string;
  sport: string;
  age_group: string;
  coach_id: string;
  assistant_coach_id: string | null;
  created_at: string;
}

interface Player {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  year_group: number;
  position: string | null;
  jersey_number: number | null;
}

interface Coach {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Record<string, Player[]>>({});
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newTeam, setNewTeam] = useState({
    name: '',
    sport: '',
    age_group: '',
    coach_id: '',
    assistant_coach_id: ''
  });

  const [newPlayer, setNewPlayer] = useState({
    student_id: '',
    position: '',
    jersey_number: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTeams(),
        fetchCoaches()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    setTeams(data || []);

    // Fetch players for each team
    for (const team of data || []) {
      await fetchTeamPlayers(team.id);
    }
  };

  const fetchTeamPlayers = async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_players')
      .select(`
        id,
        student_id,
        position,
        jersey_number,
        students (
          first_name,
          last_name,
          year_group
        )
      `)
      .eq('team_id', teamId);

    if (error) throw error;

    const formattedPlayers = data?.map(player => ({
      id: player.id,
      student_id: player.student_id,
      first_name: player.students.first_name,
      last_name: player.students.last_name,
      year_group: player.students.year_group,
      position: player.position,
      jersey_number: player.jersey_number
    }));

    setPlayers(prev => ({
      ...prev,
      [teamId]: formattedPlayers || []
    }));
  };

  const fetchCoaches = async () => {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .order('name');

    if (error) throw error;
    setCoaches(data || []);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([newTeam])
        .select();

      if (error) throw error;

      setSuccess('Team created successfully');
      setShowAddTeamModal(false);
      setNewTeam({
        name: '',
        sport: '',
        age_group: '',
        coach_id: '',
        assistant_coach_id: ''
      });
      fetchTeams();
    } catch (err) {
      console.error('Error adding team:', err);
      setError('Failed to create team');
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTeam) {
      setError('No team selected');
      return;
    }

    try {
      const { error } = await supabase
        .from('team_players')
        .insert([{
          team_id: selectedTeam.id,
          ...newPlayer
        }]);

      if (error) throw error;

      setSuccess('Player added successfully');
      setShowAddPlayerModal(false);
      setNewPlayer({
        student_id: '',
        position: '',
        jersey_number: ''
      });
      fetchTeamPlayers(selectedTeam.id);
    } catch (err) {
      console.error('Error adding player:', err);
      setError('Failed to add player');
    }
  };

  const handleRemovePlayer = async (teamId: string, playerId: string) => {
    if (!window.confirm('Are you sure you want to remove this player from the team?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      setSuccess('Player removed successfully');
      fetchTeamPlayers(teamId);
    } catch (err) {
      console.error('Error removing player:', err);
      setError('Failed to remove player');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team? This will remove all player associations.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setSuccess('Team deleted successfully');
      setSelectedTeam(null);
      fetchTeams();
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team');
    }
  };

  const getCoachName = (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    return coach ? coach.name : 'Unknown Coach';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Management</h1>
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
            onClick={() => setShowAddTeamModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Add Team
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

      <div className="grid grid-cols-12 gap-6">
        {/* Teams List */}
        <div className="col-span-4 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Teams</h2>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-gray-500">
                    {team.sport} - {team.age_group}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Coach: {getCoachName(team.coach_id)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Details */}
        <div className="col-span-8 bg-white rounded-lg shadow-md">
          {selectedTeam ? (
            <div>
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTeam.name}</h2>
                  <p className="text-gray-500">
                    {selectedTeam.sport} - {selectedTeam.age_group}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center text-sm"
                  >
                    <UserPlus size={16} className="mr-1" />
                    Add Player
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(selectedTeam.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center text-sm"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete Team
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Coaching Staff</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-gray-500">Head Coach</div>
                      <div className="font-medium">{getCoachName(selectedTeam.coach_id)}</div>
                    </div>
                    {selectedTeam.assistant_coach_id && (
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-gray-500">Assistant Coach</div>
                        <div className="font-medium">{getCoachName(selectedTeam.assistant_coach_id)}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Players</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jersey #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {players[selectedTeam.id]?.map(player => (
                          <tr key={player.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {player.first_name} {player.last_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Year {player.year_group}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.position || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.jersey_number || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleRemovePlayer(selectedTeam.id, player.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select a team to view details
            </div>
          )}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Team</h2>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sport</label>
                <input
                  type="text"
                  value={newTeam.sport}
                  onChange={(e) => setNewTeam({ ...newTeam, sport: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Age Group</label>
                <select
                  value={newTeam.age_group}
                  onChange={(e) => setNewTeam({ ...newTeam, age_group: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Select Age Group</option>
                  <option value="Under 12">Under 12</option>
                  <option value="Under 13">Under 13</option>
                  <option value="Under 14">Under 14</option>
                  <option value="Under 15">Under 15</option>
                  <option value="Under 16">Under 16</option>
                  <option value="First Team">First Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Head Coach</label>
                <select
                  value={newTeam.coach_id}
                  onChange={(e) => setNewTeam({ ...newTeam, coach_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Select Coach</option>
                  {coaches.map(coach => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assistant Coach</label>
                <select
                  value={newTeam.assistant_coach_id}
                  onChange={(e) => setNewTeam({ ...newTeam, assistant_coach_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select Assistant Coach</option>
                  {coaches.map(coach => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayerModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Player to {selectedTeam.name}</h2>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="text"
                  value={newPlayer.student_id}
                  onChange={(e) => setNewPlayer({ ...newPlayer, student_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  value={newPlayer.position}
                  onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Jersey Number</label>
                <input
                  type="number"
                  value={newPlayer.jersey_number}
                  onChange={(e) => setNewPlayer({ ...newPlayer, jersey_number: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;