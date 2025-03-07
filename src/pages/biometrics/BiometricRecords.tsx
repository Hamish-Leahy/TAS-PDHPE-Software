import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Plus, 
  Search, 
  RefreshCw, 
  Filter,
  Download,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BiometricRecord {
  id: string;
  student_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  bmi: number | null;
  measurement_date: string;
  notes: string | null;
  student: {
    first_name: string;
    last_name: string;
    year_group: number;
    house: string;
  };
}

const BiometricRecords = () => {
  const [records, setRecords] = useState<BiometricRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    yearGroup: '',
    dateRange: 'all'
  });
  const [newRecord, setNewRecord] = useState({
    student_id: '',
    height_cm: '',
    weight_kg: '',
    body_fat_percentage: '',
    measurement_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchBiometricRecords(),
        fetchStudents()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBiometricRecords = async () => {
    const { data, error } = await supabase
      .from('biometric_records')
      .select(`
        *,
        student:students(first_name, last_name, year_group, house)
      `)
      .order('measurement_date', { ascending: false });

    if (error) throw error;
    setRecords(data || []);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('last_name');

    if (error) throw error;
    setStudents(data || []);
  };

  const calculateBMI = (weight: string, height: string): number | null => {
    const weightKg = parseFloat(weight);
    const heightM = parseFloat(height) / 100; // Convert cm to m
    if (!weightKg || !heightM) return null;
    return Number((weightKg / (heightM * heightM)).toFixed(1));
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const bmi = calculateBMI(newRecord.weight_kg, newRecord.height_cm);
      
      const { error } = await supabase
        .from('biometric_records')
        .insert([{
          student_id: newRecord.student_id,
          height_cm: newRecord.height_cm ? parseFloat(newRecord.height_cm) : null,
          weight_kg: newRecord.weight_kg ? parseFloat(newRecord.weight_kg) : null,
          body_fat_percentage: newRecord.body_fat_percentage ? parseFloat(newRecord.body_fat_percentage) : null,
          bmi,
          measurement_date: newRecord.measurement_date,
          notes: newRecord.notes || null
        }]);

      if (error) throw error;

      setSuccess('Biometric record added successfully');
      setShowAddModal(false);
      setNewRecord({
        student_id: '',
        height_cm: '',
        weight_kg: '',
        body_fat_percentage: '',
        measurement_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchBiometricRecords();
    } catch (err) {
      console.error('Error adding biometric record:', err);
      setError('Failed to add biometric record');
    }
  };

  const exportRecords = () => {
    const headers = ['Student', 'Height (cm)', 'Weight (kg)', 'BMI', 'Body Fat %', 'Date', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        `${record.student.first_name} ${record.student.last_name}`,
        record.height_cm || '',
        record.weight_kg || '',
        record.bmi || '',
        record.body_fat_percentage || '',
        record.measurement_date,
        record.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'biometric-records.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBMICategory = (bmi: number | null): string => {
    if (!bmi) return 'N/A';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMICategoryStyle = (category: string): string => {
    const styles = {
      'Underweight': 'bg-blue-100 text-blue-800 border-blue-300',
      'Normal': 'bg-green-100 text-green-800 border-green-300',
      'Overweight': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Obese': 'bg-red-100 text-red-800 border-red-300',
      'N/A': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[category as keyof typeof styles] || styles['N/A'];
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      `${record.student.first_name} ${record.student.last_name}`.toLowerCase().includes(searchLower);

    const matchesFilters = 
      (!filters.yearGroup || record.student.year_group === parseInt(filters.yearGroup)) &&
      (!filters.dateRange || filterByDateRange(record.measurement_date, filters.dateRange));

    return matchesSearch && matchesFilters;
  });

  const filterByDateRange = (date: string, range: string) => {
    const measurementDate = new Date(date);
    const now = new Date();
    switch (range) {
      case 'week':
        return measurementDate >= new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return measurementDate >= new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return measurementDate >= new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Biometric Records</h1>
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
            Add Record
          </button>
          <button
            onClick={exportRecords}
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
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
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

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Height (cm)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BMI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Body Fat %
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
              {filteredRecords.map((record) => {
                const bmiCategory = getBMICategory(record.bmi);
                return (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student.first_name} {record.student.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Year {record.student.year_group}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.height_cm || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.weight_kg || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">{record.bmi || '-'}</span>
                        {record.bmi && (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getBMICategoryStyle(bmiCategory)}`}>
                            {bmiCategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.body_fat_percentage ? `${record.body_fat_percentage}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.measurement_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Biometric Record</h2>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student</label>
                <select
                  value={newRecord.student_id}
                  onChange={(e) => setNewRecord({ ...newRecord, student_id: e.target.value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.height_cm}
                    onChange={(e) => setNewRecord({ ...newRecord, height_cm: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.weight_kg}
                    onChange={(e) => setNewRecord({ ...newRecord, weight_kg: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Body Fat Percentage</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRecord.body_fat_percentage}
                  onChange={(e) => setNewRecord({ ...newRecord, body_fat_percentage: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Measurement Date</label>
                <input
                  type="date"
                  value={newRecord.measurement_date}
                  onChange={(e) => setNewRecord({ ...newRecord, measurement_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
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
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BMI Categories Legend */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <TrendingUp className="text-blue-600 mr-2" size={24} />
          <h2 className="text-xl font-semibold">BMI Categories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getBMICategoryStyle('Underweight')}`}>
              Underweight
            </span>
            <span className="text-sm text-gray-600">&lt; 18.5</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getBMICategoryStyle('Normal')}`}>
              Normal
            </span>
            <span className="text-sm text-gray-600">18.5 - 24.9</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getBMICategoryStyle('Overweight')}`}>
              Overweight
            </span>
            <span className="text-sm text-gray-600">25 - 29.9</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getBMICategoryStyle('Obese')}`}>
              Obese
            </span>
            <span className="text-sm text-gray-600">&ge; 30</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricRecords;