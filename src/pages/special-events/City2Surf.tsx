import React, { useState, useEffect } from 'react';
import { Mountain, Users, Medal, RefreshCw, Plus, Route } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const City2Surf = () => {
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
        .from('city2surf_participants')
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
          <Mountain className="w-8 h-8 text-purple-600 mr-2" />
          City2Surf Training Program
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
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center"
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
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Training Runs</p>
              <h3 className="text-3xl font-bold mt-2">16</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Route className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Best Times</p>
              <h3 className="text-3xl font-bold mt-2">5</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Medal className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Program Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Program Overview</h2>
        <div className="prose max-w-none">
          <p className="text-gray-600">
            The TAS City2Surf training program prepares students for Sydney's iconic 14km run from Hyde Park to Bondi Beach. Our comprehensive program includes structured training runs, hill work, and race strategy development.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">Training Schedule</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Long Runs: Sunday 7:00 AM</li>
                <li>Hill Training: Tuesday 4:00 PM</li>
                <li>Speed Work: Thursday 4:00 PM</li>
                <li>Recovery Runs: Wednesday 7:00 AM</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">Key Dates</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Training Start: June 1, 2025</li>
                <li>Time Trials: July 15, 2025</li>
                <li>Race Day: August 11, 2025</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Training Routes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Training Routes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Beginner Route</h3>
            <div className="space-y-2 text-gray-600">
              <p>5km flat course around town</p>
              <ul className="list-disc list-inside">
                <li>Minimal elevation gain</li>
                <li>Well-lit paths</li>
                <li>Water station available</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Intermediate Route</h3>
            <div className="space-y-2 text-gray-600">
              <p>8km course with hills</p>
              <ul className="list-disc list-inside">
                <li>200m elevation gain</li>
                <li>Mixed terrain</li>
                <li>Two water stations</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">Advanced Route</h3>
            <div className="space-y-2 text-gray-600">
              <p>12km challenging course</p>
              <ul className="list-disc list-inside">
                <li>400m elevation gain</li>
                <li>Hill repeats section</li>
                <li>Three water stations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Race Day Preparation */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Race Day Preparation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-lg mb-2">Essential Equipment</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Running shoes (properly broken in)</li>
              <li>Race day clothing (weather appropriate)</li>
              <li>Race bib and timing chip</li>
              <li>Anti-chafing products</li>
              <li>Hydration pack or water bottle</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Race Strategy</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Pace yourself for Heartbreak Hill</li>
              <li>Use water stations strategically</li>
              <li>Start in the correct wave</li>
              <li>Follow the race nutrition plan</li>
              <li>Meet at designated finish area</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default City2Surf;