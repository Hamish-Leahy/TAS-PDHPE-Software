import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Users, Calendar, ClipboardCheck, FileText, LogOut, HelpCircle, Grid, MessageSquare, Clock8, Ban as Bandage, Box } from 'lucide-react';
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
    { path: '/coach/communications', label: 'Communications', icon: <MessageSquare size={20} /> },
    { path: '/coach/timesheets', label: 'Timesheets', icon: <Clock8 size={20} /> },
    { path: '/coach/incidents', label: 'Incidents', icon: <Bandage size={20} /> },
    { path: '/coach/resources', label: 'Resources', icon: <Box size={20} /> }
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <nav className="w-64 bg-[#1E2633] shadow-md flex flex-col">
        <div className="flex-1">
          <ul className="py-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-300 hover:bg-[#2A3547] hover:text-white transition-colors ${
                    location.pathname === item.path ? 'bg-[#2A3547] text-white border-l-4 border-white' : ''
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#2A3547]">
          <div className="text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} The Armidale School
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#1E2633] text-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex-shrink-0">
                <img 
                  src="https://as.edu.au/wp-content/uploads/2022/12/TAS-Logo-Horizontal-White-472w-x-300h-300x191.png" 
                  alt="TAS Logo" 
                  className="h-12"
                />
              </Link>
              <h1 className="text-2xl font-bold tracking-wide">TAS Coach Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="p-2 hover:bg-[#2A3547] rounded-full transition-colors"
                title="Get Help"
              >
                <HelpCircle size={20} />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-[#2A3547] rounded-full transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowWaffleMenu(!showWaffleMenu)}
                  className="p-2 hover:bg-[#2A3547] rounded-full transition-colors"
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CoachLayout;