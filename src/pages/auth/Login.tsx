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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-20"
          src="https://as.edu.au/wp-content/webp-express/webp-images/uploads/2025/01/TAS_Logo_Horiz_Straw_PMS-713x375.png.webp"
          alt="TAS Logo"
        />
        <p className="mt-2 text-center text-sm text-gray-400">
          Sign in with your TAS email address
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-700">
          {error && (
            <div className="mb-4 bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-md">
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
                    inputBackground: 'rgb(31, 41, 55)',
                    inputText: 'white',
                    inputBorder: 'rgb(75, 85, 99)',
                    inputLabelText: 'rgb(156, 163, 175)',
                    inputPlaceholder: 'rgb(107, 114, 128)',
                  },
                },
              },
              className: {
                input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400',
                label: 'text-gray-300',
                button: 'bg-blue-600 hover:bg-blue-700 text-white',
              },
            }}
            providers={[]}
            theme="dark"
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