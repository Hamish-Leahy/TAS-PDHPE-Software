import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  RefreshCw, 
  Filter,
  Download,
  Save,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FitnessStandard {
  id: string;
  test_id: string;
  age_group: string;
  gender: string;
  bronze_standard: number;
  silver_standard: number;
  gold_standard: number;
  test: {
    name: string;
    unit: string;
    measurement_type: string;
  };
}

const FitnessStandards = () => {
  const [standards, setStandards] = useState<FitnessStandard[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    test: '',
    ageGroup: '',
    gender: ''
  });
  const [newStandard, setNewStandard] = useState({
    test_id: '',
    age_group: '',
    gender: '',
    bronze_standard: '',
    silver_standard: '',
    gold_standard: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStandards(),
        fetchTests()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStandards = async () => {
    const { data, error } = await supabase
      .from('fitness_standards')
      .select(`
        *,
        test:fitness_tests(name, unit, measurement_type)
      `)
      .order('test_id')
      .order('age_group')
      .order('gender');

    if (error) throw error;
    setStandards(data || []);
  };

  const fetchTests = async () => {
    const { data, error } = await supabase
      .from('fitness_tests')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setTests(data || []);
  };

  const handleAddStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that silver is between bronze and gold
    const bronze = parseFloat(newStandard.bronze_standard);
    const silver = parseFloat(newStandard.silver_standard);
    const gold = parseFloat(newStandard.gold_standard);

    if (silver <= bronze || silver >= gold) {
      setError('Silver standard must be between bronze and gold standards');
      return;
    }

    try {
      const { error } = await supabase
        .from('fitness_standards')
        .insert([{
          test_id: newStandard.test_id,
          age_group: newStandard.age_group,
          gender: newStandard.gender,
          bronze_standard: bronze,
          silver_standard: silver,
          gold_standard: gold
        }]);

      if (error) throw error;

      setSuccess('Fitness standard added successfully');
      setShowAddModal(false);
      setNewStandard({
        test_id: '',
        age_group: '',
        gender: '',
        bronze_standard: '',
        silver_standard: '',
        gold_standard: ''
      });
      fetchStandards();
    } catch (err) {
      console.error('Error adding fitness standard:', err);
      setError('Failed to add fitness standard');
    }
  };

  const exportStandards = () => {
    const headers = ['Test', 'Age Group', 'Gender', 'Bronze', 'Silver', 'Gold', 'Unit'];
    const csvContent = [
      headers.join(','),
      ...filteredStandards.map(standard => [
        standard.test.name,
        standard.age_group,
        standard.gender,
        standard.bronze_standard,
        standard.silver_standard,
        standard.gold_standard,
        standard.test.unit
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fitness-standards.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStandards = standards.filter(standard => {
    return (
      (!filters.test || standard.test_id === filters.test) &&
      (!filters.ageGroup || standard.age_group === filters.ageGroup) &&
      (!filters.gender || standard.gender === filters.gender)
    );
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
        <h1 className="text-2xl font-bold">Fitness Standards</h1>
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
            Add Standard
          </button>
          <button
            onClick={exportStandards}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Download size={18} className="mr-2" />
            Export CSV
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

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.test}
            onChange={(e) => setFilters({ ...filters, test: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Tests</option>
            {tests.map(test => (
              <option key={test.id} value={test.id}>{test.name}</option>
            ))}
          </select>
          <select
            value={filters.ageGroup}
            onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Age Groups</option>
            {ageGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <select
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Standards Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bronze
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Silver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gold
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStandards.map((standard) => (
                <tr key={standard.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {standard.test.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {standard.test.measurement_type} ({standard.test.unit})
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {standard.age_group}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {standard.gender.charAt(0).toUpperCase() + standard.gender.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                      {standard.bronze_standard} {standard.test.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-300">
                      {standard.silver_standard} {standard.test.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                      {standard.gold_standard} {standard.test.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Standard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Fitness Standard</h2>
            <form onSubmit={handleAddStandard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fitness Test</label>
                <select
                  value={newStandard.test_id}
                  onChange={(e) => setNewStandard({ ...newStandard, test_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Select Test</option>
                  {tests.map(test => (
                    <option key={test.id} value={test.id}>
                      {test.name} ({test.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Group</label>
                  <select
                    value={newStandard.age_group}
                    onChange={(e) => setNewStandard({ ...newStandard, age_group: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="">Select Age Group</option>
                    {ageGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={newStandard.gender}
                    onChange={(e) => setNewStandard({ ...newStandard, gender: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bronze</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStandard.bronze_standard}
                    onChange={(e) => setNewStandard({ ...newStandard, bronze_standard: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Silver</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStandard.silver_standard}
                    onChange={(e) => setNewStandard({ ...newStandard, silver_standard: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gold</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStandard.gold_standard}
                    onChange={(e) => setNewStandard({ ...newStandard, gold_standard: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
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
                  Add Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standards Guide */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Award className="text-blue-600 mr-2" size={24} />
          <h2 className="text-xl font-semibold">Achievement Standards Guide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 mr-2">
                Gold
              </span>
              <span className="font-medium">Exceptional Performance</span>
            </div>
            <p className="text-sm text-gray-600">
              Represents outstanding achievement and exceptional fitness levels.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-300 mr-2">
                Silver
              </span>
              <span className="font-medium">Above Average</span>
            </div>
            <p className="text-sm text-gray-600">
              Indicates performance above the expected standard for the age group.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 border border-orange-300 mr-2">
                Bronze
              </span>
              <span className="font-medium">Meeting Standards</span>
            </div>
            <p className="text-sm text-gray-600">
              Represents meeting the basic fitness requirements for the age group.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessStandards;