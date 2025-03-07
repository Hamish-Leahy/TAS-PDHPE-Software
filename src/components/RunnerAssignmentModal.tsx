import React, { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Race {
  id: number;
  name: string;
  date: string;
  status: string;
}

interface RunnerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRunners: number[];
  races: Race[];
  onSuccess: () => void;
}

const RunnerAssignmentModal: React.FC<RunnerAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedRunners,
  races,
  onSuccess
}) => {
  const [selectedRace, setSelectedRace] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAssignments, setExistingAssignments] = useState<{[key: string]: number[]}>({});

  useEffect(() => {
    if (isOpen && selectedRunners.length > 0) {
      fetchExistingAssignments();
    }
  }, [isOpen, selectedRunners]);

  const fetchExistingAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('runner_races')
        .select('runner_id, race_id')
        .in('runner_id', selectedRunners);

      if (error) throw error;

      // Create a map of runner_id to array of race_ids
      const assignments: {[key: string]: number[]} = {};
      data?.forEach(assignment => {
        if (!assignments[assignment.runner_id]) {
          assignments[assignment.runner_id] = [];
        }
        assignments[assignment.runner_id].push(assignment.race_id);
      });

      setExistingAssignments(assignments);
    } catch (err) {
      console.error('Error fetching existing assignments:', err);
    }
  };

  const handleAssignRace = async () => {
    if (!selectedRace) {
      setError('Please select a race');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Filter out runners that are already assigned to this race
      const runnersToAssign = selectedRunners.filter(runnerId => {
        const runnerAssignments = existingAssignments[runnerId] || [];
        return !runnerAssignments.includes(selectedRace);
      });

      if (runnersToAssign.length === 0) {
        setError('All selected runners are already assigned to this race');
        setIsLoading(false);
        return;
      }

      // Create new assignments only for runners not already assigned
      const assignments = runnersToAssign.map(runnerId => ({
        runner_id: runnerId,
        race_id: selectedRace
      }));

      const { error } = await supabase
        .from('runner_races')
        .insert(assignments);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning race:', err);
      setError('Failed to assign race. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-600 flex items-center">
            <Calendar size={24} className="mr-2" />
            Assign Runners to Race
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-4">
            Assign {selectedRunners.length} selected runner{selectedRunners.length > 1 ? 's' : ''} to a race:
          </p>

          <div className="space-y-3">
            {races.map(race => {
              // Count how many selected runners are already assigned to this race
              const assignedCount = selectedRunners.reduce((count, runnerId) => {
                const runnerAssignments = existingAssignments[runnerId] || [];
                return count + (runnerAssignments.includes(race.id) ? 1 : 0);
              }, 0);

              return (
                <label
                  key={race.id}
                  className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                    selectedRace === race.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="race"
                    value={race.id}
                    checked={selectedRace === race.id}
                    onChange={() => setSelectedRace(race.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium">{race.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(race.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {assignedCount > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {assignedCount} already assigned
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      race.status === 'active' ? 'bg-green-100 text-green-800' : 
                      race.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {race.status}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignRace}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Check size={18} className="mr-2" />
            {isLoading ? 'Assigning...' : 'Assign to Race'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunnerAssignmentModal;