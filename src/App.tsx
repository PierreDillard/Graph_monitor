import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';
import { ReactFlowProvider } from '@xyflow/react';
import GraphProvider from './context/GraphProvider';


const App: React.FC = () => {
  console.log('App mounting...');
  return (
    <Provider store={store}>
<ReactFlowProvider>
        <GraphProvider>
          <div className="min-h-screen bg-gray-950 text-white">
            <DashboardLayout />
          </div>
        </GraphProvider>
      </ReactFlowProvider>  
    
    </Provider>
  );
};

export default App;