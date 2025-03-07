import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  RefreshCw, 
  Filter,
  Download,
  Award,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TestResult {
  id: string;
  student_id: string;
  test_id: string;
  value: number;
  test_date: string;
  notes: string | null;
  student: {
    first_name: string;
    last_name: string;
    year_group: number;
    house: string;
  };
  fitness_test: {
    name: string;
    unit: string;
    measurement_type: string;
  };
}

interface FitnessTest {
  id: string;
  name: string;
  description: string;
  unit: string;
  measurement_type: string;
}

interface FitnessStandard {
  bronze_standard: number;
  silver_standard: number;
  gold_standard: number;
}

const TestResults = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [tests, setTests] = useState<FitnessTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    test: '',
    yearGroup: '',
    dateRange: 'all'
  });
  const [newResult, setNewResult] = useState({
    student_id: '',
    test_id: '',
    value: '',
    test_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [standards, setStandards] = useState<Record<string, FitnessStandard>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTestResults(),
        fetchFitnessTests(),
        fetchStudents(),
        fetchStandards()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTestResults = async () => {
    const { data, error } = await supabase
      .from('test_results')
      .select(`
        *,
        student:students(first_name, last_name, year_group, house),
        fitness_test:fitness_tests(name, unit, measurement_type)
      `)
      .order('test_date', { ascending: false });

    if (error) throw error;
    setResults(data || []);
  };

  const fetchFitnessTests = async () => {
    const { data, error } = await supabase
      .from('fitness_tests')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setTests(data || []);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('last_name');

    if (error) throw error;
    setStudents(data || []);
  };

  const fetchStandards = async () => {
    const { data, error } = await supabase
      .from('fitness_standards')
      .select('*');

    if (error) throw error;

    // Organize standards by test_id
    const standardsMap: Record<string, FitnessStandard> = {};
    data?.forEach(standard => {
      standardsMap[standard.test_id] = {
        bronze_standard: standard.bronze_standard,
        silver_standard: standard.silver_standard,
        gold_standard: standard.gold_standard
      };
    });
    setStandards(standardsMap);
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { error } = await supabase
        .from('test_results')
        .insert([{
          student_id: newResult.student_id,
          test_id: newResult.test_id,
          value: parseFloat(newResult.value),
          test_date: newResult.test_date,
          notes: newResult.notes || null
        }]);

      if (error) throw error;

      setSuccess('Test result added successfully');
      setShowAddModal(false);
      setNewResult({
        student_id: '',
        test_id: '',
        value: '',
        test_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchTestResults();
    } catch (err) {
      console.error('Error adding test result:', err);
      setError('Failed to add test result');
    }
  };

  const exportResults = () => {
    const headers = ['Student', 'Test', 'Value', 'Unit', 'Date', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredResults.map(result => [
        `${result.student.first_name} ${result.student.last_name}`,
        result.fitness_test.name,
        result.value,
        result.fitness_test.unit,
        result.test_date,
        result.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test-results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAchievementLevel = (result: TestResult): string => {
    const testStandards = standards[result.test_id];
    if (!testStandards) return 'N/A';

    const value = result.value;
    if (value >= testStandards.gold_standard) return 'gold';
    if (value >= testStandards.silver_standard) return 'silver';
    if (value >= testStandards.bronze_standard) return 'bronze';
    return 'none';
  };

  const getAchievementBadge = (level: string) => {
    const badges = {
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      bronze: 'bg-orange-100 text-orange-800 border-orange-300',
      none: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return badges[level as keyof typeof badges] || badges.none;
  };

  const filteredResults = results.filter(result => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      `${result.student.first_name} ${result.student.last_name}`.toLowerCase().includes(searchLower) ||
      result.fitness_test.name.toLowerCase().includes(searchLower);

    const matchesFilters = 
      (!filters.test || result.test_id === filters.test) &&
      (!filters.yearGroup || result.student.year_group === parseInt(filters.yearGroup)) &&
      (!filters.dateRange || filterByDateRange(result.test_date, filters.dateRange));

    return matchesSearch && matchesFilters;
  });

  const filterByDateRange = (date: string, range: string) => {
    const testDate = new Date(date);
    const now = new Date();
    switch (range) {
      case 'week':
        return testDate >= new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return testDate >= new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return testDate >= new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Results</h1>
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
            Add Result
          </button>
          <button
            onClick={exportResults}
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

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by student name or test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
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
            value={filters.yearGroup}
            onChange={(e) => setFilters({ ...filters, yearGroup: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Year Groups</option>
            {Array.from({ length: 6 }, (_, i) => i + 7).map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Achievement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result) => {
                const achievementLevel = getAchievementLevel(result);
                return (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.student.first_name} {result.student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Year {result.student.year_group}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{result.fitness_test.name}</div>
                      <div className="text-sm text-gray-500">{result.fitness_test.measurement_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.value} {result.fitness_test.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getAchievementBadge(achievementLevel)}`}>
                        {achievementLevel.charAt(0).toUpperCase() + achievementLevel.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(result.test_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Result Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Test Result</h2>
            <form onSubmit={handleAddResult} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student</label>
                <select
                  value={newResult.student_id}
                  onChange={(e) => setNewResult({ ...newResult, student_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} - Year {student.year_group}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fitness Test</label>
                <select
                  value={newResult.test_id}
                  onChange={(e) => setNewResult({ ...newResult, test_id: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Result Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={newResult.value}
                  onChange={(e) => setNewResult({ ...newResult, value: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Test Date</label>
                <input
                  type="date"
                  value={newResult.test_date}
                  onChange={(e) => setNewResult({ ...newResult, test_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={newResult.notes}
                  onChange={(e) => setNewResult({ ...newResult, notes: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  rows={3}
                />
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
                  Add Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Achievement Standards Legend */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Award className="text-yellow-600 mr-2" size={24} />
          <h2 className="text-xl font-semibold">Achievement Standards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getAchievementBadge('gold')}`}>
              Gold
            </span>
            <span className="text-sm text-gray-600">Exceptional Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getAchievementBadge('silver')}`}>
              Silver
            </span>
            <span className="text-sm text-gray-600">Above Average</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getAchievementBadge('bronze')}`}>
              Bronze
            </span>
            <span className="text-sm text-gray-600">Meeting Standards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;