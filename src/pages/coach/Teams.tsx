import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, RefreshCw, Filter, UserPlus, Trash2, MoreVertical, ChevronDown, ChevronRight, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  year_group: number;
  house: string;
}

interface Team {
  id: string;
  name: string;
  sport: string;
  age_group: string;
  coach_id: string;
  assistant_coach_id: string | null;
  coach: { name: string } | null;
  assistant_coach: { name: string } | null;
  players: Student[];
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [filters, setFilters] = useState({
    yearGroup: '',
    sport: '',
    showHidden: false
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTeams(),
        fetchUnassignedStudents()
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
    try {
      // First get all teams with coach info
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coaches!teams_coach_id_fkey(name),
          assistant_coach:coaches!teams_assistant_coach_id_fkey(name)
        `)
        .order('name');

      if (teamsError) throw teamsError;

      // Then get players for each team
      const teamsWithPlayers = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { data: playersData } = await supabase
            .from('team_players')
            .select(`
              student:students(
                id,
                first_name,
                last_name,
                year_group,
                house
              )
            `)
            .eq('team_id', team.id);

          return {
            ...team,
            players: (playersData || []).map(p => p.student)
          };
        })
      );

      setTeams(teamsWithPlayers);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to fetch teams');
    }
  };

  const fetchUnassignedStudents = async () => {
    try {
      // First get all assigned student IDs
      const { data: assignedData } = await supabase
        .from('team_players')
        .select('student_id');

      const assignedIds = (assignedData || []).map(a => a.student_id);

      // Then get all students not in that list
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('last_name');

      if (studentsError) throw studentsError;

      const unassigned = studentsData?.filter(student => 
        !assignedIds.includes(student.id)
      ) || [];

      setUnassignedStudents(unassigned);
    } catch (err) {
      console.error('Error fetching unassigned students:', err);
      setError('Failed to fetch unassigned students');
    }
  };

  const handleAssignStudent = async (studentId: string, teamId: string) => {
    try {
      const { error } = await supabase
        .from('team_players')
        .insert({
          team_id: teamId,
          student_id: studentId
        });

      if (error) throw error;

      setSuccess('Student assigned successfully');
      fetchData();
    } catch (err) {
      console.error('Error assigning student:', err);
      setError('Failed to assign student');
    }
  };

  const handleRemoveStudent = async (studentId: string, teamId: string) => {
    try {
      const { error } = await supabase
        .from('team_players')
        .delete()
        .match({
          team_id: teamId,
          student_id: studentId
        });

      if (error) throw error;

      setSuccess('Student removed successfully');
      fetchData();
    } catch (err) {
      console.error('Error removing student:', err);
      setError('Failed to remove student');
    }
  };

  const filteredUnassignedStudents = unassignedStudents.filter(student => {
    const searchMatch = `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase());

    const yearGroupMatch = !filters.yearGroup || student.year_group === parseInt(filters.yearGroup);

    return searchMatch && yearGroupMatch;
  });

  const filteredTeams = teams.filter(team => {
    const searchMatch = team.name
      .toLowerCase()
      .includes(teamSearch.toLowerCase());

    const sportMatch = !filters.sport || team.sport === filters.sport;

    return searchMatch && sportMatch;
  });

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Team Assignment</h1>
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
        {/* Unassigned Students */}
        <div className="flex flex-col">
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Unassigned Students</h2>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {filteredUnassignedStudents.length} students
              </span>
            </div>

            <div className="flex space-x-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
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
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-theme(spacing.64))]">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading students...</div>
              ) : filteredUnassignedStudents.length > 0 ? (
                filteredUnassignedStudents.map(student => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Year {student.year_group} - {student.house}
                      </div>
                    </div>
                    {selectedTeam && (
                      <button
                        onClick={() => handleAssignStudent(student.id, selectedTeam)}
                        className="p-1 hover:bg-blue-100 rounded-full text-blue-600"
                        title="Add to selected team"
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding some students to the system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="flex flex-col">
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Teams</h2>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {filteredTeams.length} teams
              </span>
            </div>

            <div className="flex space-x-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Sports</option>
                {Array.from(new Set(teams.map(t => t.sport))).map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-theme(spacing.64))]">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading teams...</div>
              ) : filteredTeams.length > 0 ? (
                filteredTeams.map(team => (
                  <div key={team.id} className="mb-4 border rounded-lg">
                    <div
                      className={`p-4 flex items-center justify-between cursor-pointer ${
                        selectedTeam === team.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {team.sport} - {team.age_group}
                        </div>
                        <div className="text-sm text-gray-500">
                          Coach: {team.coach?.name}
                          {team.assistant_coach?.name && ` / Assistant: ${team.assistant_coach.name}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {team.players.length} players
                        </span>
                        {selectedTeam === team.id ? (
                          <ChevronDown size={20} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    {selectedTeam === team.id && (
                      <div className="border-t p-4">
                        <div className="space-y-2">
                          {team.players.length > 0 ? (
                            team.players.map(player => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                              >
                                <div>
                                  <div className="font-medium">
                                    {player.first_name} {player.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Year {player.year_group} - {player.house}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveStudent(player.id, team.id)}
                                  className="p-1 hover:bg-red-100 rounded-full text-red-600"
                                  title="Remove from team"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Users className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No players assigned</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Start by adding players from the unassigned list.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first team.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;