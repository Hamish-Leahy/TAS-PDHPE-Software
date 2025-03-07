import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  ClipboardList,
  AlertTriangle,
  RefreshCw,
  Award,
  Activity,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AthleteProgress {
  student_id: string;
  name: string;
  recent_tests: {
    test_name: string;
    value: number;
    date: string;
    achievement: string;
  }[];
  biometrics: {
    height_cm: number;
    weight_kg: number;
    bmi: number;
    measurement_date: string;
  };
}

const CoachDashboard = () => {
  const [athletes, setAthletes] = useState<AthleteProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [tests, setTests] = useState<any[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAthleteProgress(),
        fetchTests(),
        fetchUpcomingTests()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAthleteProgress = async () => {
    try {
      // Fetch students with their latest test results and biometrics
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          year_group,
          house,
          test_results (
            value,
            test_date,
            fitness_tests (name)
          ),
          biometric_records (
            height_cm,
            weight_kg,
            bmi,
            measurement_date
          )
        `)
        .order('last_name');

      if (studentsData) {
        const progressData = studentsData.map(student => ({
          student_id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          recent_tests: student.test_results
            .sort((a: any, b: any) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())
            .slice(0, 3)
            .map((test: any) => ({
              test_name: test.fitness_tests.name,
              value: test.value,
              date: test.test_date,
              achievement: 'gold' // This would be calculated based on standards
            })),
          biometrics: student.biometric_records
            .sort((a: any, b: any) => new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime())[0] || null
        }));

        setAthletes(progressData);
      }
    } catch (err) {
      console.error('Error fetching athlete progress:', err);
      throw err;
    }
  };

  const fetchTests = async () => {
    try {
      const { data } = await supabase
        .from('fitness_tests')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setTests(data || []);
    } catch (err) {
      console.error('Error fetching tests:', err);
      throw err;
    }
  };

  const fetchUpcomingTests = async () => {
    // This would be implemented when a test scheduling feature is added
    setUpcomingTests([]);
  };

  const getAchievementColor = (achievement: string) => {
    const colors = {
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      bronze: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[achievement as keyof typeof colors] || colors.bronze;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
        >
          <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Athletes</p>
              <h3 className="text-3xl font-bold mt-2">{athletes.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Tests</p>
              <h3 className="text-3xl font-bold mt-2">{tests.length}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming Tests</p>
              <h3 className="text-3xl font-bold mt-2">{upcomingTests.length}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Recent Achievements</p>
              <h3 className="text-3xl font-bold mt-2">24</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Progress */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Athlete Progress</h2>
            <div className="flex space-x-4">
              <select
                value={selectedAgeGroup}
                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Age Groups</option>
                {Array.from({ length: 6 }, (_, i) => i + 7).map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Tests</option>
                {tests.map(test => (
                  <option key={test.id} value={test.id}>{test.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recent Tests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latest Biometrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {athletes.map((athlete) => (
                  <tr key={athlete.student_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {athlete.recent_tests.map((test, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{test.test_name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getAchievementColor(test.achievement)}`}>
                              {test.value}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(test.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {athlete.biometrics ? (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            Height: {athlete.biometrics.height_cm} cm
                          </div>
                          <div className="text-sm text-gray-900">
                            Weight: {athlete.biometrics.weight_kg} kg
                          </div>
                          <div className="text-sm text-gray-900">
                            BMI: {athlete.biometrics.bmi}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(athlete.biometrics.measurement_date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No data</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-600">Improving</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-6 h-6 text-amber-500 mr-2" />
            Attention Required
          </h2>
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Fitness Test Overdue</h3>
                <p className="text-sm text-amber-700 mt-1">
                  5 students haven't completed their monthly fitness assessment
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Performance Decline</h3>
                <p className="text-sm text-red-700 mt-1">
                  3 students showing decreased performance in endurance tests
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ClipboardList className="w-6 h-6 text-blue-600 mr-2" />
            Upcoming Tests
          </h2>
          <div className="space-y-4">
            {upcomingTests.length > 0 ? (
              upcomingTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{test.date}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming tests scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;