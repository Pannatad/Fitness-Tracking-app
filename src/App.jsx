
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WorkoutLogger from './components/WorkoutLogger';
import CalendarView from './components/CalendarView';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'workout':
        return <WorkoutLogger />;
      case 'history':
        return <CalendarView />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            <p>Coming Soon</p>
          </div>
        );
    }
  };

  if (!user) {
    return <AuthModal />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
