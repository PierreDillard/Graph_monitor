import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';

// Définition du composant App avec le bon typage JSX
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-950 text-white">
        <DashboardLayout />
      </div>
    </Provider>
  );
};

export default App;
