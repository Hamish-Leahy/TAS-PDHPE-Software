import React, { useState, useEffect } from 'react';
import { FileText, Plus, Clock, RefreshCw, X, Edit, Save, AlertTriangle, CircleDot as DragHandleDots2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TrainingPlan {
  id: string;
  team_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  team: {
    name: string;
    sport: string;
    age_group: string;
  };
  activities: TrainingActivity[];
}

interface TrainingActivity {
  id: string;
  plan_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  sequence_order: number;
}

const Plans = () => {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newPlan, setNewPlan] = useState({
    team_id: '',
    name: '',
    description: '',
    duration_minutes: 60,
    activities: [
      {
        name: 'Warm-up',
        description: '',
        duration_minutes: 10,
        sequence_order: 1
      }
    ]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPlans(),
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

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('training_plans')
      .select(`
        *,
        team:teams (
          name,
          sport,
          age_group
        ),
        activities:training_activities (
          id,
          name,
          description,
          duration_minutes,
          sequence_order
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setPlans(data || []);
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    setTeams(data || []);
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // First create the plan
      const { data: planData, error: planError } = await supabase
        .from('training_plans')
        .insert([{
          team_id: newPlan.team_id,
          name: newPlan.name,
          description: newPlan.description,
          duration_minutes: newPlan.duration_minutes
        }])
        .select();

      if (planError) throw planError;

      // Then create the activities
      const activities = newPlan.activities.map(activity => ({
        ...activity,
        plan_id: planData[0].id
      }));

      const { error: activitiesError } = await supabase
        .from('training_activities')
        .insert(activities);

      if (activitiesError) throw activitiesError;

      setSuccess('Training plan created successfully');
      setShowAddModal(false);
      setNewPlan({
        team_id: '',
        name: '',
        description: '',
        duration_minutes: 60,
        activities: [
          {
            name: 'Warm-up',
            description: '',
            duration_minutes: 10,
            sequence_order: 1
          }
        ]
      });
      fetchPlans();
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('Failed to create training plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this training plan?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Training plan deleted successfully');
      fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete training plan');
    }
  };

  const handleAddActivity = () => {
    setNewPlan(prev => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          name: '',
          description: '',
          duration_minutes: 15,
          sequence_order: prev.activities.length + 1
        }
      ]
    }));
  };

  const handleRemoveActivity = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const handleActivityChange = (index: number, field: string, value: string | number) => {
    setNewPlan(prev => ({
      ...prev,
      activities: prev.activities.map((activity, i) => 
        i === index ? { ...activity, [field]: value } : activity
      )
    }));
  };

  const filteredPlans = selectedTeam
    ? plans.filter(plan => plan.team_id === selectedTeam)
    : plans;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training Plans</h1>
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
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Create Plan
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

      {/* Create Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Training Plan</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Team</label>
                <select
                  value={newPlan.team_id}
                  onChange={(e) => setNewPlan({ ...newPlan, team_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} - {team.sport}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Pre-season Conditioning"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of the training plan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Total Duration (minutes)</label>
                <input
                  type="number"
                  value={newPlan.duration_minutes}
                  onChange={(e) => setNewPlan({ ...newPlan, duration_minutes: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="15"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Activities</h3>
                  <button
                    type="button"
                    onClick={handleAddActivity}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Activity
                  </button>
                </div>

                {newPlan.activities.map((activity, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">Activity {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={activity.name}
                        onChange={(e) => handleActivityChange(index, 'name', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Activity name"
                        required
                      />
                    </div>

                    <div>
                      <textarea
                        value={activity.description}
                        onChange={(e) => handleActivityChange(index, 'description', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Activity description..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-500">Duration (minutes)</label>
                      <input
                        type="number"
                        value={activity.duration_minutes}
                        onChange={(e) => handleActivityChange(index, 'duration_minutes', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="5"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Teams</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name} - {team.sport}
            </option>
          ))}
        </select>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.team.name} - {plan.team.sport}</p>
                </div>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={20} />
                </button>
              </div>

              {plan.description && (
                <p className="mt-2 text-gray-600">{plan.description}</p>
              )}

              <div className="mt-4 flex items-center text-gray-500">
                <Clock size={16} className="mr-2" />
                {plan.duration_minutes} minutes
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-gray-700">Activities</h4>
                {plan.activities
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map(activity => (
                    <div key={activity.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{activity.name}</h5>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{activity.duration_minutes}m</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ))}

        {filteredPlans.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-md p-6 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No training plans found</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Creating Training Plans</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>Click "Create Plan" to start a new training plan</li>
              <li>Select the team the plan is for</li>
              <li>Add a descriptive name and overview</li>
              <li>Set the total duration of the training session</li>
              <li>Add individual activities with their own durations</li>
              <li>Activities can be reordered by dragging</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Tips for Effective Plans</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-blue-700">
              <li>Start with a proper warm-up activity</li>
              <li>Include a mix of different training types</li>
              <li>Allow time for cool-down and stretching</li>
              <li>Consider the age group and skill level</li>
              <li>Add detailed descriptions for each activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;