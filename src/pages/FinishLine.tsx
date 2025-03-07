import React, { useState, useEffect, useRef } from 'react';
import { useRaceStore } from '../store/raceStore';
import { ArrowLeft, Undo2, Save, Search, Clock, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FinishLine: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentRace, 
    runners, 
    finishOrder, 
    undoLastFinish, 
    fetchRunners,
    calculateHousePoints,
    isLoading,
    error
  } = useRaceStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState<any>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [runningTime, setRunningTime] = useState({ minutes: '', seconds: '' });
  const [placement, setPlacement] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentRace.id) {
      fetchRaceRunners();
    }
    // Focus the input field when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentRace.id]);

  const fetchRaceRunners = async () => {
    try {
      // First get all runners assigned to this race
      const { data: assignedRunners, error: assignmentError } = await supabase
        .from('runner_races')
        .select('runner_id')
        .eq('race_id', currentRace.id);

      if (assignmentError) throw assignmentError;

      // Get the runner IDs
      const runnerIds = assignedRunners?.map(ar => ar.runner_id) || [];

      // Then fetch the actual runners
      const { data: raceRunners, error: runnersError } = await supabase
        .from('runners')
        .select('*')
        .in('id', runnerIds);

      if (runnersError) throw runnersError;

      // Update the store with race-specific runners
      if (raceRunners) {
        await fetchRunners(selectedAgeGroup, raceRunners);
      }
    } catch (err) {
      console.error('Error fetching race runners:', err);
      setRecordError('Failed to fetch runners for this race');
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchRunners(searchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Focus minutes input when modal opens
  useEffect(() => {
    if (showTimeModal && minutesInputRef.current) {
      setTimeout(() => {
        minutesInputRef.current?.focus();
      }, 100);
    }
  }, [showTimeModal]);

  const searchRunners = async (query: string) => {
    if (!currentRace.id) {
      setRecordError('No active race selected');
      return;
    }

    try {
      // First get runners assigned to this race
      const { data: assignedRunners } = await supabase
        .from('runner_races')
        .select('runner_id')
        .eq('race_id', currentRace.id);

      const runnerIds = assignedRunners?.map(ar => ar.runner_id) || [];

      // Then search within those runners
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .in('id', runnerIds)
        .ilike('name', `%${query}%`)
        .is('finish_time', null);
      
      if (error) throw error;
      
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Error searching runners:', err);
      setRecordError('Failed to search runners');
    }
  };

  const handleRecordFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);
    
    // If there's a search query but no selected runner, try to find a match
    if (searchQuery && !selectedRunner) {
      // Try to find a match by name
      const matchingRunner = runners.find(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // If no exact match, try the first search result
      if (!matchingRunner && searchResults.length > 0) {
        setSelectedRunner(searchResults[0]);
        setShowTimeModal(true);
        return;
      }
      
      if (matchingRunner) {
        setSelectedRunner(matchingRunner);
        setShowTimeModal(true);
        return;
      }
    }
    
    if (selectedRunner) {
      // Show the time modal instead of immediately recording
      setShowTimeModal(true);
    } else if (searchQuery) {
      // If we have a search query but no match was found
      setRecordError("No runner found matching that search. Please try again or select from the list.");
    } else {
      setRecordError("Please enter a runner name or select a runner from the list.");
    }
  };

  const handleTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRunner) {
      setRecordError("No runner selected. Please select a runner first.");
      return;
    }
    
    try {
      // Calculate total seconds from minutes and seconds
      const totalMinutes = parseInt(runningTime.minutes) || 0;
      const totalSeconds = parseInt(runningTime.seconds) || 0;
      const totalTimeInSeconds = (totalMinutes * 60) + totalSeconds;
      
      // Create a timestamp
      const now = new Date();
      const timestamp = now.toISOString();
      
      // Calculate position from placement input or use next available position
      const position = placement ? parseInt(placement) : finishOrder.length + 1;
      
      // Update in database with custom time and position
      const { error } = await supabase
        .from('runners')
        .update({ 
          finish_time: timestamp,
          position: position,
          running_time_seconds: totalTimeInSeconds
        })
        .eq('id', selectedRunner.id);
      
      if (error) throw error;
      
      // Refresh the runners list
      await fetchRunners(selectedAgeGroup);
      
      // Clear form and close modal
      setRunningTime({ minutes: '', seconds: '' });
      setPlacement('');
      setShowTimeModal(false);
      setSelectedRunner(null);
      
      // Re-focus the search input
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    } catch (error) {
      console.error('Error recording finish:', error);
      setRecordError("Failed to record finish. Please try again.");
    }
  };

  const handleSelectRunner = (runner: any) => {
    setSelectedRunner(runner);
    setSearchQuery(runner.name);
    setShowSearchResults(false);
  };

  const handleUndoLastFinish = async () => {
    await undoLastFinish();
  };

  const handleSaveResults = async () => {
    await calculateHousePoints();
    navigate('/results');
  };

  const getHouseColor = (house: string) => {
    const colors: Record<string, { bg: string, text: string, hover: string }> = {
      'Broughton': { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        hover: 'hover:bg-yellow-200'
      },
      'Abbott': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        hover: 'hover:bg-blue-200'
      },
      'Croft': { 
        bg: 'bg-gray-900', 
        text: 'text-white',
        hover: 'hover:bg-gray-800'
      },
      'Tyrell': { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        hover: 'hover:bg-red-200'
      },
      'Green': { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        hover: 'hover:bg-red-200'
      },
      'Ross': { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        hover: 'hover:bg-green-200'
      }
    };
    return colors[house] || { bg: 'bg-gray-100', text: 'text-gray-800', hover: 'hover:bg-gray-200' };
  };

  const formatRunningTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const ageGroups = [
    'Under 11',
    'Under 12',
    'Under 13',
    'Under 14',
    'Under 15',
    'Under 16',
    'Under 17',
    'Under 18'
  ];

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
          <h1 className="text-2xl font-bold">Finish Line Recording</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleUndoLastFinish}
            disabled={finishOrder.length === 0 || isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <Undo2 size={18} className="mr-2" /> Undo Last
          </button>
          <button
            onClick={handleSaveResults}
            disabled={finishOrder.length === 0 || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <Save size={18} className="mr-2" /> Save Results
          </button>
        </div>
      </div>

      {/* Race Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {currentRace.name || 'No Active Race'}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${currentRace.status === 'active' ? 'bg-green-100 text-green-800' : 
              currentRace.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
              'bg-yellow-100 text-yellow-800'}`}>
            {currentRace.status || 'Not Started'}
          </span>
        </div>

        {/* Age Group Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Age Group
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedAgeGroup('')}
              className={`px-4 py-2 rounded-md border ${
                selectedAgeGroup === '' ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
              }`}
            >
              All
            </button>
            {ageGroups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedAgeGroup(group)}
                className={`px-4 py-2 rounded-md border ${
                  selectedAgeGroup === group ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Runner Search and Selection */}
        <div className="mb-6">
          <form onSubmit={handleRecordFinish} className="mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Runner (type name)
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    id="searchQuery"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type runner's name"
                  />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map(runner => {
                        const houseStyle = getHouseColor(runner.house);
                        return (
                          <button
                            key={runner.id}
                            type="button"
                            onClick={() => handleSelectRunner(runner)}
                            className={`w-full text-left px-4 py-2 ${houseStyle.hover} border-b border-gray-100 last:border-b-0`}
                          >
                            <div className="font-medium">{runner.name}</div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">{runner.age_group}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${houseStyle.bg} ${houseStyle.text}`}>
                                {runner.house}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedRunner && (
                <div className="flex-1 bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedRunner.name}</p>
                      <p className="text-sm text-gray-600">{selectedRunner.age_group}</p>
                      <span className={`mt-1 inline-block px-2 py-1 text-xs rounded-full ${getHouseColor(selectedRunner.house).bg} ${getHouseColor(selectedRunner.house).text}`}>
                        {selectedRunner.house}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedRunner(null);
                        setSearchQuery('');
                      }}
                      className="p-1 rounded-full hover:bg-blue-100"
                    >
                      <X size={18} className="text-blue-700" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="self-end">
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Record Finish
                </button>
              </div>
            </div>
            {recordError && <p className="mt-2 text-red-600 text-sm">{recordError}</p>}
            {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
          </form>
        </div>

        {/* Time and Placement Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Clock size={24} className="text-blue-600 mr-2" />
                Record Finish Time
              </h2>
              
              {selectedRunner && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="font-medium">{selectedRunner.name}</p>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">{selectedRunner.age_group}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getHouseColor(selectedRunner.house).bg} ${getHouseColor(selectedRunner.house).text}`}>
                      {selectedRunner.house}
                    </span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleTimeSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Running Time
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          ref={minutesInputRef}
                          type="number"
                          min="0"
                          placeholder="Minutes"
                          value={runningTime.minutes}
                          onChange={(e) => setRunningTime({...runningTime, minutes: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <span className="text-lg font-medium">:</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Seconds"
                          value={runningTime.seconds}
                          onChange={(e) => setRunningTime({...runningTime, seconds: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Format: minutes:seconds (e.g., 1:30)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placement (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Position (e.g., 1, 2, 3)"
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave blank to use next available position ({finishOrder.length + 1})
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTimeModal(false);
                      setRunningTime({ minutes: '', seconds: '' });
                      setPlacement('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Save Finish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Finish Order */}
        <div>
          <h3 className="text-lg font-medium mb-3">Finish Order</h3>
          {finishOrder.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      House
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Running Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finish Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {finishOrder.map((runner, index) => (
                    <tr key={runner.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold">{runner.position || index + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{runner.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getHouseColor(runner.house).bg} ${getHouseColor(runner.house).text}`}>
                          {runner.house}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{runner.age_group}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatRunningTime(runner.running_time_seconds)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {runner.finish_time ? new Date(runner.finish_time).toLocaleTimeString() : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No finishes recorded yet.</p>
          )}
        </div>
      </div>

      {/* Remaining Runners */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Remaining Runners</h2>
        {runners.filter(r => r.finish_time === null).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runners
                  .filter(runner => runner.finish_time === null)
                  .map(runner => (
                    <tr key={runner.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{runner.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getHouseColor(runner.house).bg} ${getHouseColor(runner.house).text}`}>
                          {runner.house}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{runner.age_group}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectRunner(runner)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">All runners have finished or no runners registered.</p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Recording Finishes</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>Type a runner's name in the search box</li>
              <li>You can also select a runner from the dropdown suggestions or from the Remaining Runners table</li>
              <li>Click "Record Finish" to open the time entry form</li>
              <li>Enter the runner's time in minutes and seconds (e.g., 1:30 for one minute and thirty seconds)</li>
              <li>Optionally enter a specific placement position</li>
              <li>If you make a mistake, use "Undo Last" to remove the most recent finish</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">Saving Results</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>When all runners have finished, click "Save Results"</li>
              <li>This will calculate house points based on finishing positions</li>
              <li>You will be redirected to the Results page to view the final standings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinishLine;