import React from 'react';
import { Database } from 'lucide-react';

const ConnectSupabase: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <Database size={40} className="text-green-600 mr-3" />
          <h2 className="text-2xl font-bold">Connect to Supabase</h2>
        </div>
        
        <p className="mb-6 text-gray-700">
          This application requires a Supabase database connection to function properly. Please click the "Connect to Supabase" button in the top right corner of the editor to set up your database.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-semibold text-blue-800 mb-2">After connecting:</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>The database schema will be automatically created</li>
              <li>You'll need to add some test runners in the Runner Management page</li>
              <li>Create a race on the Dashboard</li>
              <li>Start recording finishes on the Finish Line page</li>
            </ol>
          </div>
          
          <p className="text-sm text-gray-500">
            Note: The database connection details will be stored in your project's .env file.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectSupabase;