import React, { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const logLoginAttempt = async (email: string, success: boolean) => {
    try {
      await supabase.from('login_attempts').insert({
        username: email,
        ip_address: 'Web Client', // Since we're in browser environment
        user_agent: navigator.userAgent,
        success: success,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error logging login attempt:', err);
    }
  };

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
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
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
            onError={(error) => {
              console.error('Auth error:', error);
              setError('Authentication failed. Please try again.');
              // Log failed attempt if we can extract the email
              const emailMatch = error.message.match(/email "([^"]+)"/);
              if (emailMatch) {
                logLoginAttempt(emailMatch[1], false);
              }
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