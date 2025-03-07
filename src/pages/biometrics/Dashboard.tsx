import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalStudents: number;
  testsThisMonth: number;
  upcomingTests: number;
  recentUpdates: number;
}

interface RecentTest {
  id: string;
  student_name: string;
  test_name: string;
  value: number;
  test_date: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    testsThisMonth: 0,
    upcomingTests: 0,
    recentUpdates: 0
  });
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      // Fetch tests this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { count: monthlyTests } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .gte('test_date', startOfMonth.toISOString());

      // Fetch recent test results
      const { data: recentTestData } = await supabase
        .from('test_results')
        .select(`
          id,
          value,
          test_date,
          students (first_name, last_name),
          fitness_tests (name)
        `)
        .order('test_date', { ascending: false })
        .limit(5);

      // Transform the data
      const formattedTests = recentTestData?.map(test => ({
        id: test.id,
        student_name: `${test.students.first_name} ${test.students.last_name}`,
        test_name: test.fitness_tests.name,
        value: test.value,
        test_date: test.test_date
      })) || [];

      setStats({
        totalStudents: studentCount || 0,
        testsThisMonth: monthlyTests || 0,
        upcomingTests: 0, // To be implemented with scheduling feature
        recentUpdates: recentTestData?.length || 0
      });

      setRecentTests(formattedTests);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

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

      {loading ? (
        <div className="text-center py-8">
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="bg-blue-600"
            />
            <StatCard
              title="Tests This Month"
              value={stats.testsThisMonth}
              icon={Activity}
              color="bg-green-600"
            />
            <StatCard
              title="Upcoming Tests"
              value={stats.upcomingTests}
              icon={Calendar}
              color="bg-purple-600"
            />
            <StatCard
              title="Recent Updates"
              value={stats.recentUpdates}
              icon={TrendingUp}
              color="bg-orange-600"
            />
          </div>

          {/* Recent Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
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

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                onClick={() => navigate('/biometrics/reports')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                View Reports
              </button>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-700">
                Remember to regularly backup your data and check for fitness test standards updates.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;