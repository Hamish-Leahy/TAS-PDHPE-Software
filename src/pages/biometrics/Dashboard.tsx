import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  RefreshCw,
  Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalStudents: number;
  testsThisMonth: number;
  upcomingTests: number;
  recentUpdates: number;
  averageBMI: number;
  fitnessTestsPassed: number;
  fitnessTestsFailed: number;
}

interface RecentTest {
  id: string;
  student_name: string;
  test_name: string;
  value: number;
  test_date: string;
  achievement: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    testsThisMonth: 0,
    upcomingTests: 0,
    recentUpdates: 0,
    averageBMI: 0,
    fitnessTestsPassed: 0,
    fitnessTestsFailed: 0
  });
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // Fetch total students
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Get start of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch tests this month
      const { count: monthlyTests } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .gte('test_date', startOfMonth.toISOString());

      // Calculate average BMI
      const { data: biometricData } = await supabase
        .from('biometric_records')
        .select('bmi')
        .not('bmi', 'is', null);

      const avgBMI = biometricData?.reduce((sum, record) => sum + (record.bmi || 0), 0) || 0;
      const totalBMIRecords = biometricData?.length || 1;

      // Fetch recent test results with standards comparison
      const { data: recentTestData } = await supabase
        .from('test_results')
        .select(`
          id,
          value,
          test_date,
          students (first_name, last_name),
          fitness_tests (
            name,
            id
          )
        `)
        .order('test_date', { ascending: false })
        .limit(5);

      // Get fitness standards for comparison
      const { data: standardsData } = await supabase
        .from('fitness_standards')
        .select('*');

      // Transform test data and compare with standards
      const formattedTests = await Promise.all(recentTestData?.map(async (test) => {
        const standards = standardsData?.find(s => s.test_id === test.fitness_tests.id);
        let achievement = 'none';
        
        if (standards) {
          if (test.value >= standards.gold_standard) achievement = 'gold';
          else if (test.value >= standards.silver_standard) achievement = 'silver';
          else if (test.value >= standards.bronze_standard) achievement = 'bronze';
        }

        return {
          id: test.id,
          student_name: `${test.students.first_name} ${test.students.last_name}`,
          test_name: test.fitness_tests.name,
          value: test.value,
          test_date: test.test_date,
          achievement
        };
      }) || []);

      // Count passed/failed tests
      const { data: allTestResults } = await supabase
        .from('test_results')
        .select('value, fitness_tests(id)');

      let passed = 0;
      let failed = 0;

      allTestResults?.forEach(result => {
        const standards = standardsData?.find(s => s.test_id === result.fitness_tests.id);
        if (standards) {
          if (result.value >= standards.bronze_standard) passed++;
          else failed++;
        }
      });

      setStats({
        totalStudents: studentCount || 0,
        testsThisMonth: monthlyTests || 0,
        upcomingTests: 0, // To be implemented with scheduling feature
        recentUpdates: recentTestData?.length || 0,
        averageBMI: avgBMI / totalBMIRecords,
        fitnessTestsPassed: passed,
        fitnessTestsFailed: failed
      });

      setRecentTests(formattedTests);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAchievementColor = (achievement: string) => {
    switch (achievement) {
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'bronze':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600' };
    return { label: 'Obese', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Biometrics Dashboard</h1>
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

      {loading ? (
        <div className="text-center py-8">
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Students</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.totalStudents}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Tests This Month</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.testsThisMonth}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Average BMI</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.averageBMI.toFixed(1)}</h3>
                  <p className={`text-sm ${getBMICategory(stats.averageBMI).color}`}>
                    {getBMICategory(stats.averageBMI).label}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Fitness Tests</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {((stats.fitnessTestsPassed / (stats.fitnessTestsPassed + stats.fitnessTestsFailed)) * 100).toFixed(1)}%
                  </h3>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tests */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Test Results</h2>
              {recentTests.length > 0 ? (
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentTests.map((test) => (
                        <tr key={test.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {test.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {test.test_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {test.value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getAchievementColor(test.achievement)}`}>
                              {test.achievement.charAt(0).toUpperCase() + test.achievement.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(test.test_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent test results found.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/biometrics/test-results')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Activity className="w-5 h-5 text-blue-600 mr-2" />
                  Record New Test
                </button>
                <button
                  onClick={() => navigate('/biometrics/students')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  Add Student
                </button>
                <button
                  onClick={() => navigate('/biometrics/biometrics')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                  Update Biometrics
                </button>
                <button
                  onClick={() => navigate('/biometrics/standards')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Award className="w-5 h-5 text-yellow-600 mr-2" />
                  View Standards
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Fitness Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-green-800">Tests Passed</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.fitnessTestsPassed}</p>
                  </div>
                  <div className="text-green-600">
                    <Award size={24} />
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-red-800">Tests Failed</h3>
                    <p className="text-2xl font-bold text-red-600">{stats.fitnessTestsFailed}</p>
                  </div>
                  <div className="text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-blue-800">Tests This Month</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.testsThisMonth}</p>
                  </div>
                  <div className="text-blue-600">
                    <Calendar size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;