import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Medal, Trash2, AlertTriangle, FileText, Printer, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateResultsPDF } from '../components/PDFGenerator';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<number | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [houseResults, setHouseResults] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [raceToDelete, setRaceToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRaces = races.filter(race => 
    race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(race.date).toLocaleDateString().includes(searchQuery)
  );

  useEffect(() => {
    fetchRaces();
  }, []);

  useEffect(() => {
    if (selectedRace) {
      fetchRaceResults(selectedRace);
    } else {
      setResults([]);
      setHouseResults({});
    }
  }, [selectedRace]);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('race_events')
        .select('*')
        .order('date', { ascending: false });
      
      if (data && data.length > 0) {
        setRaces(data);
        setSelectedRace(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching races:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaceResults = async (raceId: number) => {
    setLoading(true);
    try {
      const { data: assignedRunners, error: assignmentError } = await supabase
        .from('runner_races')
        .select('runner_id')
        .eq('race_id', raceId);

      if (assignmentError) throw assignmentError;

      const runnerIds = assignedRunners?.map(ar => ar.runner_id) || [];

      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .in('id', runnerIds)
        .not('position', 'is', null)
        .order('position');
      
      if (error) throw error;
      
      if (data) {
        setResults(data);
        
        const points: Record<string, number> = {
          'Broughton': 0,
          'Abbott': 0,
          'Croft': 0,
          'Tyrrell': 0,
          'Green': 0,
          'Ross': 0
        };
        
        data.forEach((runner, index) => {
          if (index < 10 && runner.house) {
            points[runner.house] += (10 - index);
          }
        });
        
        setHouseResults(points);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch race results');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (results.length === 0) return;
    
    const headers = ['Position', 'Name', 'House', 'Age Group', 'Running Time'];
    const csvContent = [
      headers.join(','),
      ...results.map(runner => [
        runner.position,
        `"${runner.name}"`,
        runner.house,
        runner.age_group,
        formatRunningTime(runner.running_time_seconds)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const race = races.find(r => r.id === selectedRace);
    link.setAttribute('download', `${race?.name}-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRace = async () => {
    if (!raceToDelete) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('race_events')
        .delete()
        .eq('id', raceToDelete);
      
      if (error) throw error;
      
      await fetchRaces();
      
      setSuccess('Race deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting race:', err);
      setError('Failed to delete race. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setRaceToDelete(null);
    }
  };

  const confirmDeleteRace = (raceId: number) => {
    setRaceToDelete(raceId);
    setShowDeleteConfirm(true);
  };

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

  const getHouseBgColor = (house: string) => {
    const colors: Record<string, string> = {
      'Broughton': 'bg-yellow-500',
      'Abbott': 'bg-blue-900',
      'Croft': 'bg-black',
      'Tyrrell': 'bg-red-900',
      'Green': 'bg-red-600',
      'Ross': 'bg-green-600'
    };
    return colors[house] || 'bg-gray-500';
  };

  const formatRunningTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generatePDF = async () => {
    if (!selectedRace || results.length === 0) return;
    
    setGeneratingPDF(true);
    try {
      const race = races.find(r => r.id === selectedRace);
      if (!race) {
        throw new Error('Race not found');
      }
      
      const doc = await generateResultsPDF(race, results);
      
      doc.save(`TAS_Cross_Country_Results_${race.name.replace(/\s+/g, '_')}.pdf`);
      
      setSuccess('PDF generated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const printResults = async () => {
    if (!selectedRace || results.length === 0) return;
    
    setGeneratingPDF(true);
    try {
      const race = races.find(r => r.id === selectedRace);
      if (!race) {
        throw new Error('Race not found');
      }
      
      const doc = await generateResultsPDF(race, results);
      
      const pdfData = doc.output('datauristring');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Results - ${race.name}</title>
            </head>
            <body style="margin:0">
              <embed width="100%" height="100%" src="${pdfData}" type="application/pdf" />
            </body>
          </html>
        `);
        
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      } else {
        throw new Error('Could not open print window. Please check your popup blocker settings.');
      }
    } catch (err) {
      console.error('Error printing results:', err);
      setError('Failed to print results. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setGeneratingPDF(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Race Results</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToCsv}
            disabled={results.length === 0 || loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <Download size={18} className="mr-2" /> Export CSV
          </button>
          <button
            onClick={generatePDF}
            disabled={results.length === 0 || loading || generatingPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <FileText size={18} className="mr-2" /> 
            {generatingPDF ? 'Generating...' : 'Generate PDF'}
          </button>
          <button
            onClick={printResults}
            disabled={results.length === 0 || loading || generatingPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <Printer size={18} className="mr-2" /> Print Results
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

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Select Race</h2>
        
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search races by name or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading && races.length === 0 ? (
          <div className="text-center py-4">
            <p>Loading races...</p>
          </div>
        ) : races.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 h-[300px] overflow-y-auto pr-2">
            {filteredRaces.map(race => (
              <div
                key={race.id}
                className={`p-4 border rounded-lg text-left transition-colors cursor-pointer ${
                  selectedRace === race.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRace(race.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{race.name}</div>
                    <div className="text-sm text-gray-500">{new Date(race.date).toLocaleDateString()}</div>
                    <span className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${
                      race.status === 'active' ? 'bg-green-100 text-green-800' : 
                      race.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {race.status}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteRace(race.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    title="Delete race"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p>No races found. Create a race from the Dashboard.</p>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Race Deletion</h2>
            
            <div className="mb-6">
              <p className="mb-4">
                <AlertTriangle size={20} className="inline-block text-amber-500 mr-2" />
                Are you sure you want to delete this race? This action cannot be undone.
              </p>
              <p className="font-medium mb-2">
                All race data will be permanently removed from the system.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRaceToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRace}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Race
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">House Results</h2>
        {selectedRace ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(houseResults)
              .sort((a, b) => b[1] - a[1])
              .map(([house, points], index) => (
                <div key={house} className="border rounded-lg overflow-hidden">
                  <div className={`p-4 text-white ${getHouseBgColor(house)}`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">{house}</h3>
                      {index === 0 && <Medal size={24} />}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-3xl font-bold">{points}</div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center">Select a race to view house results</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Individual Results</h2>
        {loading ? (
          <div className="text-center py-8">
            <p>Loading results...</p>
          </div>
        ) : selectedRace ? (
          results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      House
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Running Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((runner) => (
                    <tr key={runner.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {runner.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {runner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getHouseColor(runner.house)}`}>
                          {runner.house}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {runner.age_group}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatRunningTime(runner.running_time_seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>No results available for this race</p>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <p>Select a race to view results</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Results Export Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <Download size={24} className="text-green-600 mr-2" />
              <h3 className="text-lg font-medium">CSV Export</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Export results to a CSV file for use in spreadsheet applications like Excel.
            </p>
            <button
              onClick={exportToCsv}
              disabled={!selectedRace || results.length === 0 || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center disabled:opacity-50"
            >
              <Download size={18} className="mr-2" /> Export to CSV
            </button>
          </div>
          
          <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <FileText size={24} className="text-blue-600 mr-2" />
              <h3 className="text-lg font-medium">PDF Report</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Generate a professional PDF report with podium finishers and complete results.
            </p>
            <button
              onClick={generatePDF}
              disabled={!selectedRace || results.length === 0 || loading || generatingPDF}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center disabled:opacity-50"
            >
              <FileText size={18} className="mr-2" /> 
              {generatingPDF ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
          
          <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <Printer size={24} className="text-purple-600 mr-2" />
              <h3 className="text-lg font-medium">Print Results</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Open a print-friendly version of the results that you can print directly.
            </p>
            <button
              onClick={printResults}
              disabled={!selectedRace || results.length === 0 || loading || generatingPDF}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center justify-center disabled:opacity-50"
            >
              <Printer size={18} className="mr-2" /> Print Results
            </button>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">About PDF Reports</h3>
          <p className="text-blue-700 mb-2">
            The PDF report includes:
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-700 pl-4">
            <li>Race information and details</li>
            <li>Podium visualization for top 3 finishers</li>
            <li>Complete results table sorted by position</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Results;