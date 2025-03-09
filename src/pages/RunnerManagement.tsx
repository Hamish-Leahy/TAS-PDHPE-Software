import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, AlertTriangle, RefreshCw, Check, User, X, Calendar } from 'lucide-react';
import { useRaceStore } from '../store/raceStore';
import { supabase } from '../lib/supabase';
import RunnerAssignmentModal from '../components/RunnerAssignmentModal';

const houses = ['Broughton', 'Abbott', 'Croft', 'Tyrrell', 'Green', 'Ross'];

const getHouseColor = (house: string) => {
  const colors: Record<string, string> = {
    'Broughton': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Abbott': 'bg-blue-100 text-blue-800 border-blue-300',
    'Croft': 'bg-gray-900 text-white border-gray-700',
    'Tyrrell': 'bg-red-100 text-red-800 border-red-300',
    'Green': 'bg-red-100 text-red-800 border-red-300',
    'Ross': 'bg-green-100 text-green-800 border-green-300'
  };
  return colors[house] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const RunnerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { runners, fetchRunners, addRunner, isLoading, error } = useRaceStore();
  
  const [formData, setFormData] = useState({
    name: '',
    house: 'Broughton',
    age_group: 'Under 11',
    date_of_birth: '',
    gender: 'male'
  });
  
  const [filter, setFilter] = useState({
    house: '',
    age_group: '',
    race_id: '',
    gender: '',
    sortBy: 'name'
  });

  const [selectedRunners, setSelectedRunners] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [races, setRaces] = useState<any[]>([]);
  const [showRunnerDetail, setShowRunnerDetail] = useState(false);
  const [selectedRunnerDetail, setSelectedRunnerDetail] = useState<any>(null);
  const [showAssignRaceModal, setShowAssignRaceModal] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRunners();
    fetchRaces();
  }, [fetchRunners]);

  const fetchRaces = async () => {
    try {
      const { data } = await supabase
        .from('race_events')
        .select('*')
        .order('date', { ascending: false });
      
      if (data) {
        setRaces(data);
      }
    } catch (err) {
      console.error('Error fetching races:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculatedAgeGroup = determineAgeGroup(formData.date_of_birth);
    
    await addRunner({
      ...formData,
      age_group: calculatedAgeGroup
    });
    
    setFormData({
      name: '',
      house: 'Broughton',
      age_group: 'Under 11',
      date_of_birth: '',
      gender: 'male'
    });
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n');
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const [name, house, age_group, date_of_birth, gender] = line.split(',');
          
          if (name && house && age_group && date_of_birth && gender) {
            await addRunner({
              name: name.trim(),
              house: house.trim(),
              age_group: age_group.trim(),
              date_of_birth: date_of_birth.trim(),
              gender: gender.trim().toLowerCase()
            });
          }
        }
        
        fetchRunners();
      } catch (error) {
        console.error('Error processing CSV:', error);
      }
    };
    
    reader.readAsText(file);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRunners();
    setRefreshing(false);
  };

  const toggleRunnerSelection = (id: number) => {
    setSelectedRunners(prev => {
      if (prev.includes(id)) {
        return prev.filter(runnerId => runnerId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRunners.length === filteredRunners.length) {
      setSelectedRunners([]);
    } else {
      setSelectedRunners(filteredRunners.map(runner => runner.id!));
    }
  };

  const confirmDeleteRunners = () => {
    if (selectedRunners.length === 0) {
      setDeleteError('Please select at least one runner to delete');
      setTimeout(() => setDeleteError(null), 3000);
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDeleteRunners = async () => {
    if (selectedRunners.length === 0) return;

    try {
      for (const id of selectedRunners) {
        const { error } = await supabase
          .from('runners')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setDeleteSuccess(`Successfully deleted ${selectedRunners.length} runner${selectedRunners.length > 1 ? 's' : ''}`);
      setTimeout(() => setDeleteSuccess(null), 3000);
      
      setSelectedRunners([]);
      fetchRunners();
    } catch (err) {
      console.error('Error deleting runners:', err);
      setDeleteError('Failed to delete runners. Please try again.');
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleViewRunnerDetail = (runner: any) => {
    setSelectedRunnerDetail(runner);
    setShowRunnerDetail(true);
  };

  const handleShowAssignRaceModal = () => {
    if (selectedRunners.length === 0) {
      setDeleteError('Please select at least one runner to assign to races');
      setTimeout(() => setDeleteError(null), 3000);
      return;
    }
    setShowAssignRaceModal(true);
  };

  const handleAssignRaceSuccess = async () => {
    setAssignSuccess(`Successfully assigned runners to races`);
    setTimeout(() => setAssignSuccess(null), 3000);
    setSelectedRunners([]);
    await fetchRunners();
  };

  const getRaceName = (raceId: number | null) => {
    if (!raceId) return 'Not assigned';
    const race = races.find(r => r.id === raceId);
    return race ? race.name : 'Unknown race';
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const determineAgeGroup = (dateOfBirth: string) => {
    const age = calculateAge(dateOfBirth);
    if (age <= 11) return 'Under 11';
    if (age <= 12) return 'Under 12';
    if (age <= 13) return 'Under 13';
    if (age <= 14) return 'Under 14';
    if (age <= 15) return 'Under 15';
    if (age <= 16) return 'Under 16';
    if (age <= 17) return 'Under 17';
    return 'Under 18';
  };

  const filteredRunners = runners.filter(runner => {
    return (
      (filter.house === '' || runner.house === filter.house) &&
      (filter.age_group === '' || runner.age_group === filter.age_group) &&
      (filter.gender === '' || runner.gender === filter.gender) &&
      (filter.race_id === '' || String(runner.race_id) === filter.race_id || (filter.race_id === 'unassigned' && !runner.race_id))
    );
  }).sort((a, b) => {
    switch (filter.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'age':
        return new Date(b.date_of_birth).getTime() - new Date(a.date_of_birth).getTime();
      case 'gender':
        return a.gender.localeCompare(b.gender);
      default:
        return 0;
    }
  });

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
          <h1 className="text-2xl font-bold">Runner Management</h1>
        </div>
      </div>

      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {deleteSuccess}
        </div>
      )}

      {assignSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {assignSuccess}
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {deleteError}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Runner Deletion</h2>
            
            <div className="mb-6">
              <p className="mb-4">
                <AlertTriangle size={20} className="inline-block text-amber-500 mr-2" />
                Are you sure you want to delete {selectedRunners.length} runner{selectedRunners.length > 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <p className="font-medium mb-2">
                All runner data will be permanently removed from the system.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRunners}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Runner{selectedRunners.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <RunnerAssignmentModal
        isOpen={showAssignRaceModal}
        onClose={() => setShowAssignRaceModal(false)}
        selectedRunners={selectedRunners}
        races={races}
        onSuccess={handleAssignRaceSuccess}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Add Runner</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>
            <div>
              <label htmlFor="house" className="block text-sm font-medium text-gray-700 mb-1">
                House
              </label>
              <select
                id="house"
                name="house"
                value={formData.house}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {houses.map(house => (
                  <option key={house} value={house}>{house}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="age_group" className="block text-sm font-medium text-gray-700 mb-1">
                Age Group (Auto-calculated)
              </label>
              <input
                type="text"
                id="age_group"
                value={formData.date_of_birth ? determineAgeGroup(formData.date_of_birth) : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                disabled
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" />
              {isLoading ? 'Adding...' : 'Add Runner'}
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-2">Bulk Upload</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with columns: name, house, age_group, date_of_birth, gender
            </p>
            <label className="block">
              <span className="sr-only">Choose CSV file</span>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleBulkUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Runners</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleShowAssignRaceModal}
                disabled={selectedRunners.length === 0 || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Calendar size={16} className="mr-2" />
                Assign to Races
              </button>
              <button
                onClick={confirmDeleteRunners}
                disabled={selectedRunners.length === 0 || isLoading}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Selected
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <select
              name="house"
              value={filter.house}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Houses</option>
              {houses.map(house => (
                <option key={house} value={house}>{house}</option>
              ))}
            </select>
            <select
              name="age_group"
              value={filter.age_group}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Age Groups</option>
              {ageGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <select
              name="gender"
              value={filter.gender}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
            </select>
            <select
              name="sortBy"
              value={filter.sortBy}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="age">Sort by Age</option>
              <option value="gender">Sort by Gender</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading runners...</p>
            </div>
          ) : filteredRunners.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 text-left bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedRunners.length === filteredRunners.length && filteredRunners.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Date of Birth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Age Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        House
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Races
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRunners.map(runner => (
                      <tr key={runner.id}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRunners.includes(runner.id!)}
                            onChange={() => toggleRunnerSelection(runner.id!)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewRunnerDetail(runner)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            {runner.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(runner.date_of_birth).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{runner.age_group}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 capitalize">{runner.gender}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getHouseColor(runner.house)}`}>
                            {runner.house}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {runner.race_id ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {getRaceName(runner.race_id)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic text-center py-8">No runners found. Add some runners to get started.</p>
          )}

          {filteredRunners.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredRunners.length} runner{filteredRunners.length !== 1 ? 's' : ''} 
              {(filter.house || filter.age_group || filter.race_id || filter.gender) && ' with applied filters'}
              {selectedRunners.length > 0 && ` (${selectedRunners.length} selected)`}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Adding Runners</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>Fill out the form with name, date of birth, gender, and house</li>
              <li>Age group will be automatically calculated based on date of birth</li>
              <li>For bulk uploads, prepare a CSV file with headers: name, house, age_group, date_of_birth, gender</li>
              <li>Upload the CSV file using the bulk upload option</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">Managing Runners</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
              <li>Use the filters to find specific runners by house, age group, gender, or race</li>
              <li>Sort runners by name, age, or gender using the sort dropdown</li>
              <li>Select runners by checking the boxes next to their names</li>
              <li>Click on a runner's name to view and edit their detailed information</li>
              <li>Assign selected runners to races using the "Assign to Races" button</li>
              <li>Delete selected runners using the "Delete Selected" button</li>
              <li>Use the "Select All" checkbox to select all runners in the current view</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Important Notes</h3>
            <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-blue-700">
              <li>Age groups are automatically determined based on date of birth</li>
              <li>Available age groups: Under 11 through Under 18</li>
              <li>Deleting runners cannot be undone</li>
              <li>If a runner has already participated in races, their results will also be deleted</li>
              <li>Make sure to double-check your selection before confirming deletion</li>
              <li>Runners can be assigned to multiple races</li>
              <li>You can view and manage race assignments in the runner details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerManagement;