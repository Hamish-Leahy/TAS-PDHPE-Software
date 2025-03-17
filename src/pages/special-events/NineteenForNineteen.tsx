import React, { useState, useEffect } from 'react';
import { Timer, Users, Medal, RefreshCw, Plus, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const NineteenForNineteen = () => {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch participants data
      const { data } = await supabase
        .from('nineteen_participants')
        .select('*')
        .order('created_at', { ascending: false });

      setParticipants(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Timer className="w-8 h-8 text-red-600 mr-2" />
          19 For 19 Challenge
        </h1>
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
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Add Participant
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Participants</p>
              <h3 className="text-3xl font-bold mt-2">{participants.length}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Users className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Days Completed</p>
              <h3 className="text-3xl font-bold mt-2">7</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Finishers</p>
              <h3 className="text-3xl font-bold mt-2">12</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Medal className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Challenge Overview</h2>
        <div className="prose max-w-none">
          <p className="text-gray-600">
            The 19 For 19 Challenge is a unique endurance event where participants complete 19 minutes of intense exercise every day for 19 consecutive days. This challenge builds mental toughness, physical endurance, and community spirit.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">Daily Requirements</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>19 minutes of continuous exercise</li>
                <li>Record your activity type</li>
                <li>Log your perceived effort (1-10)</li>
                <li>Submit daily photo evidence</li>
                <li>Share on community board</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">Key Dates</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Challenge Start: May 1, 2025</li>
                <li>Midway Check-in: May 10, 2025</li>
                <li>Final Day: May 19, 2025</li>
                <li>Awards Ceremony: May 20, 2025</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Activities */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Suggested Activities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Cardio</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Running</li>
              <li>Cycling</li>
              <li>Swimming</li>
              <li>Rowing</li>
              <li>Jump Rope</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Strength</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Circuit Training</li>
              <li>Bodyweight Exercises</li>
              <li>Weight Training</li>
              <li>Resistance Bands</li>
              <li>CrossFit WODs</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Mixed</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>HIIT Workouts</li>
              <li>Sports Practice</li>
              <li>Yoga Flow</li>
              <li>Boxing</li>
              <li>Dance Workouts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Challenge Rules */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Challenge Rules & Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            
            <h3 className="font-medium text-lg mb-2">Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Must complete full 19 minutes</li>
              <li>No breaking up the time into segments</li>
              <li>Activity must be continuous</li>
              <li>Must log activity within 24 hours</li>
              <li>Missed days cannot be made up</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Success Tips</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Plan your activities in advance</li>
              <li>Vary your exercises to prevent burnout</li>
              <li>Find an accountability partner</li>
              <li>Set up activity reminders</li>
              <li>Join the community chat for support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NineteenForNineteen;