import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRaceStore } from '../store/raceStore';
import { supabase } from '../lib/supabase';

const QuickPoints: React.FC = () => {
  const navigate = useNavigate();
  const { addQuickHousePoint, isLoading } = useRaceStore();
  const [housePoints, setHousePoints] = useState<Record<string, number>>({});
  const [recentPoints, setRecentPoints] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHousePoints();
    fetchRecentPoints();
  }, []);

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
          'Tyrrell': 0,
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

  const fetchRecentPoints = async () => {
    try {
      const { data } = await supabase
        .from('house_points')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) {
        setRecentPoints(data);
      }
    } catch (err) {
      console.error('Error fetching recent points:', err);
    }
  };

  const handleAddPoint = async (house: string) => {
    try {
      await addQuickHousePoint(house);
      
      // Update local state for immediate feedback
      setHousePoints(prev => ({
        ...prev,
        [house]: (prev[house] || 0) + 1
      }));
      
      // Show success message
      setSuccess(`Point added to ${house}`);
      setTimeout(() => setSuccess(null), 1500);
      
      // Refresh data
      fetchRecentPoints();
    } catch (err) {
      console.error('Error adding point:', err);
      setError('Failed to add point. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHousePoints();
    await fetchRecentPoints();
    setRefreshing(false);
  };

  const getHouseStyle = (house: string) => {
    const styles: Record<string, { bg: string, text: string, hover: string }> = {
      'Broughton': { 
        bg: 'bg-yellow-500', 
        text: 'text-black',
        hover: 'hover:bg-yellow-600'
      },
      'Abbott': { 
        bg: 'bg-blue-900', 
        text: 'text-white',
        hover: 'hover:bg-blue-950'
      },
      'Croft': { 
        bg: 'bg-black', 
        text: 'text-white',
        hover: 'hover:bg-gray-900'
      },
      'Tyrrell': { 
        bg: 'bg-red-900', 
        text: 'text-white',
        hover: 'hover:bg-red-950'
      },
      'Green': { 
        bg: 'bg-red-600', 
        text: 'text-white',
        hover: 'hover:bg-red-700'
      },
      'Ross': { 
        bg: 'bg-green-600', 
        text: 'text-white',
        hover: 'hover:bg-green-700'
      }
    };
    return styles[house] || { bg: 'bg-gray-500', text: 'text-white', hover: 'hover:bg-gray-600' };
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Quick House Points</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
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

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Click a house to add a point</h2>
        <p className="text-gray-600 mb-6">
          Use this page to quickly add points for each house as runners cross the finish line. 
          Each click adds one point to the selected house.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(housePoints).map(([house, points]) => {
            const style = getHouseStyle(house);
            return (
              <button
                key={house}
                onClick={() => handleAddPoint(house)}
                disabled={isLoading}
                className={`p-6 rounded-lg shadow-sm ${style.bg} ${style.text} ${style.hover} transition-colors flex flex-col items-center justify-center h-40 disabled:opacity-75`}
              >
                <span className="text-2xl font-bold mb-2">{house}</span>
                <span className="text-4xl font-bold">{points}</span>
                <span className="mt-2 text-sm opacity-80">Click to add point</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Points Added</h2>
        {recentPoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPoints.map(point => {
                  const style = getHouseStyle(point.house);
                  return (
                    <tr key={point.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(point.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style.bg} ${style.text}`}>
                          {point.house}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">+{point.points}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">No points have been added yet.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-4 text-gray-700">
          <p>
            This page allows teachers to quickly add points for each house as runners cross the finish line.
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>As a runner crosses the finish line, click on their house button</li>
            <li>Each click adds one point to the house total</li>
            <li>The points are saved automatically to the database</li>
            <li>Use the Refresh button to update the totals if multiple people are adding points</li>
            <li>To reset all house points, use the Admin Dashboard</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Note: These points are separate from the automatic points calculated based on race positions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickPoints;