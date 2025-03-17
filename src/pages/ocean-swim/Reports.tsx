import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Filter, Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Report {
  id: string;
  date: string;
  participant_count: number;
  completion_rate: number;
  average_time: number;
  conditions: string;
  notes: string;
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setRefreshing(true);
    try {
      // Get all sessions with attendance data
      const { data: sessions } = await supabase
        .from('ocean_swim_sessions')
        .select(`
          *,
          attendance:ocean_swim_attendance(
            status,
            start_time,
            finish_time
          )
        `)
        .order('date', { ascending: false });

      if (sessions) {
        // Process session data into reports
        const processedReports = sessions.map(session => {
          const attendance = session.attendance || [];
          const participants = attendance.length;
          const completed = attendance.filter((a: any) => a.status === 'finished').length;
          const completionRate = participants > 0 ? (completed / participants) * 100 : 0;

          // Calculate average time for completed swims
          const times = attendance
            .filter((a: any) => a.start_time && a.finish_time)
            .map((a: any) => {
              const start = new Date(a.start_time);
              const finish = new Date(a.finish_time);
              return (finish.getTime() - start.getTime()) / 1000; // time in seconds
            });

          const averageTime = times.length > 0 
            ? times.reduce((a: number, b: number) => a + b, 0) / times.length 
            : 0;

          return {
            id: session.id,
            date: session.date,
            participant_count: participants,
            completion_rate: completionRate,
            average_time: averageTime,
            conditions: session.conditions || '',
            notes: ''
          };
        });

        setReports(processedReports);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportReports = () => {
    const headers = [
      'Date',
      'Participants',
      'Completion Rate',
      'Average Time (min)',
      'Conditions',
      'Notes'
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        new Date(report.date).toLocaleDateString(),
        report.participant_count,
        `${report.completion_rate.toFixed(1)}%`,
        (report.average_time / 60).toFixed(2),
        `"${report.conditions.replace(/"/g, '""')}"`,
        `"${report.notes.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocean-swim-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(report => {
    if (!dateRange.start && !dateRange.end) return true;
    
    const reportDate = new Date(report.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    return (!startDate || reportDate >= startDate) && 
           (!endDate || reportDate <= endDate);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ocean Swim Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchReports}
            disabled={refreshing}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
          >
            <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportReports}
            disabled={reports.length === 0}
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

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading reports...</p>
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conditions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.participant_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.completion_rate.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(report.average_time / 60).toFixed(2)} min
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {report.conditions || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No reports available</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Participation Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sessions</span>
              <span className="font-medium">{reports.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Participants</span>
              <span className="font-medium">
                {reports.length > 0
                  ? (reports.reduce((sum, r) => sum + r.participant_count, 0) / reports.length).toFixed(1)
                  : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Participants</span>
              <span className="font-medium">
                {reports.reduce((sum, r) => sum + r.participant_count, 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Completion Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Completion</span>
              <span className="font-medium">
                {reports.length > 0
                  ? (reports.reduce((sum, r) => sum + r.completion_rate, 0) / reports.length).toFixed(1)
                  : '0'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Best Completion</span>
              <span className="font-medium">
                {reports.length > 0
                  ? Math.max(...reports.map(r => r.completion_rate)).toFixed(1)
                  : '0'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Lowest Completion</span>
              <span className="font-medium">
                {reports.length > 0
                  ? Math.min(...reports.map(r => r.completion_rate)).toFixed(1)
                  : '0'}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Time Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Time</span>
              <span className="font-medium">
                {reports.length > 0
                  ? (reports.reduce((sum, r) => sum + r.average_time, 0) / reports.length / 60).toFixed(2)
                  : '0'} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Best Time</span>
              <span className="font-medium">
                {reports.length > 0
                  ? (Math.min(...reports.map(r => r.average_time)) / 60).toFixed(2)
                  : '0'} min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Longest Time</span>
              <span className="font-medium">
                {reports.length > 0
                  ? (Math.max(...reports.map(r => r.average_time)) / 60).toFixed(2)
                  : '0'} min
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;