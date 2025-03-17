import React, { useState, useEffect } from 'react';
import { Waves, Users, Medal, RefreshCw, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const OceanSwim = () => {
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
        .from('ocean_swim_participants')
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
          <Waves className="w-8 h-8 text-blue-600 mr-2" />
          Ocean Swim Program
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
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
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Training Sessions</p>
              <h3 className="text-3xl font-bold mt-2">12</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Waves className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed Events</p>
              <h3 className="text-3xl font-bold mt-2">3</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Medal className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Program Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Program Overview</h2>
        <div className="prose max-w-none">
          <p className="text-gray-600">
            The TAS Ocean Swim program prepares students for open water swimming through structured training sessions and progressive skill development. The program includes pool training, beach safety education, and supervised ocean swimming practice.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">Training Schedule</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Pool Training: Tuesday & Thursday 6:30 AM</li>
                <li>Beach Sessions: Saturday 7:00 AM</li>
                <li>Theory Classes: Wednesday 3:30 PM</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">Key Dates</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Program Start: March 1, 2025</li>
                <li>First Beach Session: March 15, 2025</li>
                <li>Final Assessment: April 30, 2025</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements & Safety */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Requirements & Safety</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-lg mb-2">Required Equipment</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Swimming goggles (2 pairs recommended)</li>
              <li>Wetsuit for ocean swimming</li>
              <li>High-visibility swim cap (provided)</li>
              <li>Towels and warm clothing</li>
              <li>Water bottle and snacks</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Safety Protocols</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Always swim with a buddy</li>
              <li>Follow lifeguard instructions</li>
              <li>Check in and out with supervisors</li>
              <li>Stay within designated areas</li>
              <li>Report any concerns immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OceanSwim;