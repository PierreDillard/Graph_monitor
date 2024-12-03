
import { useEffect, useState } from 'react';
import { gpacWebSocket } from '../services/gpacWebSocket';
import { useDispatch } from 'react-redux';
import { setSelectedFilterDetails, setSelectedNode } from '../store/slices/graphSlice';
import { addSelectedFilter, removeSelectedFilter } from '../store/slices/multiFilterSlice';

const useGraphWebSocket = (id: string) => {
  const dispatch = useDispatch();
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Connecting to WebSocket...');
    gpacWebSocket.connect();

    gpacWebSocket.onError((error: string) => {
      console.error('WebSocket Error:', error);
      setConnectionError(error);
    });

    return () => {
      console.log('Disconnecting WebSocket...');
      gpacWebSocket.disconnect();
    };
  }, []);

  const retryConnection = () => {
    setConnectionError(null);
    gpacWebSocket.connect();
  };

  return { connectionError, retryConnection };
};

export default useGraphWebSocket;
