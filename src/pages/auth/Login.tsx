import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-20"
          src="https://boardingexpo.com.au/wp-content/uploads/TAS_Logo_ExtHoriz_FullCol_RGB.jpg"
          alt="TAS Logo"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          TAS Cross Country
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in with your TAS email address
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1e40af',
                    brandAccent: '#1e3a8a',
                  },
                },
              },
            }}
            providers={[]}
            theme="default"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'TAS Email Address',
                  email_input_placeholder: 'your.name@as.edu.au',
                  password_label: 'Your Password',
                },
                sign_up: {
                  email_label: 'TAS Email Address',
                  email_input_placeholder: 'your.name@as.edu.au',
                  password_label: 'Create Password',
                },
              },
            }}
          />
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Only @as.edu.au email addresses are allowed
        </div>
      </div>
    </div>
  );
};

export default Login;