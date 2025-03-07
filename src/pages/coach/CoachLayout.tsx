import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Users, Calendar, ClipboardCheck, FileText, LogOut, HelpCircle, Grid } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import WaffleMenu from '../../components/WaffleMenu';
import ServiceDisabledOverlay from '../../components/ServiceDisabledOverlay';
import { usePlatformStatus } from '../../hooks/usePlatformStatus';

interface LayoutProps {
  children: ReactNode;
}

const CoachLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showWaffleMenu, setShowWaffleMenu] = useState(false);
  const { status, loading } = usePlatformStatus('coach');

  const navItems = [
    { path: '/coach', label: 'Dashboard', icon: <Dumbbell size={20} /> },
    { path: '/coach/teams', label: 'Teams', icon: <Users size={20} /> },
    { path: '/coach/training', label: 'Training', icon: <Calendar size={20} /> },
    { path: '/coach/attendance', label: 'Attendance', icon: <ClipboardCheck size={20} /> },
    { path: '/coach/plans', label: 'Training Plans', icon: <FileText size={20} /> },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (status.status === 'disabled') {
    return <ServiceDisabledOverlay message={status.message} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img 
                src="https://boardingexpo.com.au/wp-content/uploads/TAS_Logo_ExtHoriz_FullCol_RGB.jpg" 
                alt="TAS Logo" 
                className="h-10"
              />
            </Link>
            <h1 className="text-xl font-bold">TAS Coach Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Get Help"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowWaffleMenu(!showWaffleMenu)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                title="TAS Apps"
              >
                <Grid size={20} />
              </button>
              
              <WaffleMenu 
                isOpen={showWaffleMenu} 
                onClose={() => setShowWaffleMenu(false)} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-md">
          <ul className="py-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 hover:bg-blue-50 transition-colors ${
                    location.pathname === item.path ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <span className="mr-3 text-blue-600">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} The Armidale School Coach Dashboard
        </div>
      </footer>
    </div>
  );
};

export default CoachLayout;