import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Flag, Award, ChevronDown, Plus, RefreshCw } from 'lucide-react';
import { useRaceStore } from '../store/raceStore';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentRace, createRace, updateRaceStatus, isLoading } = useRaceStore();
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState(new Date().toISOString().split('T')[0]);
  const [housePoints, setHousePoints] = useState<Record<string, number>>({});
  const [activeRaces, setActiveRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<number | null>(null);
  const [showRaceDropdown, setShowRaceDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchHousePoints(),
      fetchActiveRaces()
    ]);
    setRefreshing(false);
  };

  const fetchHousePoints = async () => {
    try {
      const { data } = await supabase
        .from('house_points')
        .select('house, points');
      
      if (data) {
        const pointsByHouse: Record<string, number> = {
          'Broughton': 0,
          'Abbott': 0,
          'Croft': 0,
          'Tyrell': 0,
          'Green': 0,
          'Ross': 0
        };
        
        data.forEach(item => {
          pointsByHouse[item.house] += item.points;
        });
        
        setHousePoints(pointsByHouse);
      }
    } catch (err) {
      console.error('Error fetching house points:', err);
      setError('Failed to fetch house points. Please try refreshing.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const fetchActiveRaces = async () => {
    try {
      const { data } = await supabase
        .from('race_events')
        .select('*')
        .order('date', { ascending: false });
      
      if (data) {
        setActiveRaces(data);
      }
    } catch (err) {
      console.error('Error fetching races:', err);
    }
  };

  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raceName || !raceDate) {
      setError('Please provide both race name and date');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      await createRace(raceName, raceDate);
      setRaceName('');
      setSuccess('Race created successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchActiveRaces();
    } catch (err) {
      console.error('Error creating race:', err);
      setError('Failed to create race. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSelectRace = async (raceId: number) => {
    setSelectedRace(raceId);
    setShowRaceDropdown(false);
    
    const race = activeRaces.find(r => r.id === raceId);
    if (race) {
      try {
        await updateRaceStatus(race.status);
        setSuccess(`Selected race: ${race.name}`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error selecting race:', err);
        setError('Failed to select race. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleStartRace = async () => {
    if (currentRace.id) {
      try {
        await updateRaceStatus('active');
        navigate('/finish-line');
      } catch (err) {
        console.error('Error starting race:', err);
        setError('Failed to start race. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    } else {
      setError('Please select a race first');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleStopRace = async () => {
    if (currentRace.id) {
      try {
        await updateRaceStatus('completed');
        setSuccess('Race marked as completed');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error stopping race:', err);
        setError('Failed to stop race. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const getHouseColor = (house: string) => {
    const colors: Record<string, string> = {
      'Broughton': 'bg-yellow-500', // Yellow
      'Abbott': 'bg-blue-900',      // Navy blue
      'Croft': 'bg-black',          // Black
      'Tyrell': 'bg-red-900',       // Maroon
      'Green': 'bg-red-600',        // Red
      'Ross': 'bg-green-600'        // Green
    };
    return colors[house] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cross Country Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleStartRace}
            disabled={!currentRace.id || currentRace.status === 'active' || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <Play size={18} className="mr-2" /> Start Race
          </button>
          <button
            onClick={handleStopRace}
            disabled={!currentRace.id || currentRace.status !== 'active' || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <Pause size={18} className="mr-2" /> End Race
          </button>
          <button
            onClick={() => navigate('/finish-line')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Flag size={18} className="mr-2" /> Finish Line
          </button>
          <button
            onClick={() => navigate('/results')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Award size={18} className="mr-2" /> Results
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Race Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Race</h2>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
              title="Refresh data"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <form onSubmit={handleCreateRace} className="space-y-4">
            <div>
              <label htmlFor="raceName" className="block text-sm font-medium text-gray-700 mb-1">
                Race Name
              </label>
              <input
                type="text"
                id="raceName"
                value={raceName}
                onChange={(e) => setRaceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Junior Boys 3km"
                required
              />
            </div>
            <div>
              <label htmlFor="raceDate" className="block text-sm font-medium text-gray-700 mb-1">
                Race Date
              </label>
              <input
                type="date"
                id="raceDate"
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" />
              {isLoading ? 'Creating...' : 'Create Race'}
            </button>
          </form>

          {/* Race Selection Dropdown */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Select Existing Race</h3>
            <div className="relative">
              <button
                onClick={() => setShowRaceDropdown(!showRaceDropdown)}
                className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                <span>
                  {currentRace.id
                    ? currentRace.name
                    : selectedRace
                    ? activeRaces.find(r => r.id === selectedRace)?.name
                    : 'Select Race'}
                </span>
                <ChevronDown size={18} />
              </button>
              
              {showRaceDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {activeRaces.length > 0 ? (
                    activeRaces.map(race => (
                      <button
                        key={race.id}
                        onClick={() => handleSelectRace(race.id)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{race.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(race.date).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full 
                          ${race.status === 'active' ? 'bg-green-100 text-green-800' : 
                            race.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {race.status}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No races available</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* House Points */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">House Points</h2>
          <div className="space-y-4">
            {Object.entries(housePoints)
              .sort((a, b) => b[1] - a[1])
              .map(([house, points]) => (
                <div key={house} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${getHouseColor(house)} mr-2`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{house}</span>
                      <span className="font-bold">{points} pts</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getHouseColor(house)}`} 
                        style={{ width: `${Math.min(100, (points / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Races */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Races</h2>
        {activeRaces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Race Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeRaces.map((race) => (
                  <tr key={race.id} className={currentRace.id === race.id ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{race.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(race.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${race.status === 'active' ? 'bg-green-100 text-green-800' : 
                          race.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {race.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleSelectRace(race.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Select
                      </button>
                      <button 
                        onClick={() => navigate('/results')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">No races have been created yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;