
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Flag, 
  Award, 
  ChevronDown,
  Plus,
  RefreshCw,
  Timer,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { useRaceStore } from '../store/raceStore';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalRunners: number;
  totalRaces: number;
  totalPoints: number;
  activeRace: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentRace, createRace, updateRaceStatus, setCurrentRace, isLoading } = useRaceStore();
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState(new Date().toISOString().split('T')[0]);
  const [housePoints, setHousePoints] = useState<Record<string, number>>({});
  const [activeRaces, setActiveRaces] = useState<any[]>([]);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRunners: 0,
    totalRaces: 0,
    totalPoints: 0,
    activeRace: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchHousePoints(),
        fetchActiveRaces(),
        fetchStats()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try refreshing.');
    }
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const { count: runnersCount } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true });

      const { data: races } = await supabase
        .from('race_events')
        .select('*');

      const { data: points } = await supabase
        .from('house_points')
        .select('points');

      const totalPoints = points?.reduce((sum, record) => sum + record.points, 0) || 0;

      setStats({
        totalRunners: runnersCount || 0,
        totalRaces: races?.length || 0,
        totalPoints: totalPoints,
        activeRace: currentRace.name || 'None'
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
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

  const handleSelectRace = async (race: any) => {
    try {
      // First set the current race in the store
      setCurrentRace(race);
      
      // Then update the race status if needed
      if (race.status !== currentRace.status) {
        await updateRaceStatus(race.status);
      }
      
      setShowRaceModal(false);
      setSuccess(`Selected race: ${race.name}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error selecting race:', err);
      setError('Failed to select race. Please try again.');
      setTimeout(() => setError(null), 3000);
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
    const colors: Record<string, { bg: string, text: string }> = {
      'Broughton': { bg: 'bg-yellow-500', text: 'text-black' },
      'Abbott': { bg: 'bg-blue-900', text: 'text-white' },
      'Croft': { bg: 'bg-black', text: 'text-white' },
      'Tyrell': { bg: 'bg-red-900', text: 'text-white' },
      'Green': { bg: 'bg-red-600', text: 'text-white' },
      'Ross': { bg: 'bg-green-600', text: 'text-white' }
    };
    return colors[house] || { bg: 'bg-gray-500', text: 'text-white' };
  };

  const getMaxPoints = () => {
    const points = Object.values(housePoints);
    return points.length > 0 ? Math.max(...points) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cross Country Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleStartRace}
            disabled={!currentRace.id || currentRace.status === 'active' || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
          >
            <Play size={18} className="mr-2" /> Start Race
          </button>
          <button
            onClick={handleStopRace}
            disabled={!currentRace.id || currentRace.status !== 'active' || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
          >
            <Pause size={18} className="mr-2" /> End Race
          </button>
          <button
            onClick={() => navigate('/finish-line')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Flag size={18} className="mr-2" /> Finish Line
          </button>
          <button
            onClick={() => navigate('/results')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Award size={18} className="mr-2" /> Results
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Race</p>
              <h3 className="text-xl font-bold mt-2">{currentRace.name || 'None'}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Timer className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Races</p>
              <h3 className="text-xl font-bold mt-2">{stats.totalRaces}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Runners</p>
              <h3 className="text-xl font-bold mt-2">{stats.totalRunners}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Points</p>
              <h3 className="text-xl font-bold mt-2">{stats.totalPoints}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Race Form */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
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
          </div>
          
          <form onSubmit={handleCreateRace} className="p-6 space-y-4">
            <div>
              <label htmlFor="raceName" className="block text-sm font-medium text-gray-700 mb-1">
                Race Name
              </label>
              <input
                type="text"
                id="raceName"
                value={raceName}
                onChange={(e) => setRaceName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" />
              {isLoading ? 'Creating...' : 'Create Race'}
            </button>
          </form>

          {/* Active Race Status */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Active Race</h3>
              {currentRace.id && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  currentRace.status === 'active' ? 'bg-green-100 text-green-800' : 
                  currentRace.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentRace.status}
                </span>
              )}
            </div>
            
            {currentRace.id ? (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{currentRace.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(currentRace.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Check size={20} className="text-green-500" />
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRaceModal(true)}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors"
              >
                <Calendar size={20} className="mr-2 text-gray-400" />
                Select a Race
              </button>
            )}
          </div>
        </div>

        {/* House Points */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">House Points</h2>
          <div className="space-y-4">
            {Object.entries(housePoints)
              .sort((a, b) => b[1] - a[1])
              .map(([house, points], index) => {
                const maxPoints = getMaxPoints();
                const percentage = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
                const { bg, text } = getHouseColor(house);
                
                return (
                  <div key={house} className="relative">
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full ${bg} mr-2`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{house}</span>
                          <span className="font-bold">{points} pts</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${bg} transition-all duration-500`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Race Selection Modal */}
      {showRaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Select Race</h2>
                <button
                  onClick={() => setShowRaceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 gap-3">
                {activeRaces.map(race => (
                  <button
                    key={race.id}
                    onClick={() => handleSelectRace(race)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      currentRace.id === race.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{race.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(race.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        race.status === 'active' ? 'bg-green-100 text-green-800' : 
                        race.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {race.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowRaceModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">System Status</h2>
          <Clock size={20} className="text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-medium text-green-800">System Online</h3>
            </div>
            <p className="mt-1 text-sm text-green-600">All systems operating normally</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="font-medium text-blue-800">Last Backup</h3>
            </div>
            <p className="mt-1 text-sm text-blue-600">{new Date().toLocaleString()}</p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle size={16} className="text-yellow-600 mr-2" />
              <h3 className="font-medium text-yellow-800">Important Notice</h3>
            </div>
            <p className="mt-1 text-sm text-yellow-600">
              Remember to save results after each race completion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;