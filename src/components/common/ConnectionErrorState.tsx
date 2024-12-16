import React from 'react';
import WidgetWrapper from '../common/WidgetWrapper';

interface ConnectionErrorStateProps {
  id: string;
  title: string;
  errorMessage: string;
  onRetry: () => void;
}

const ConnectionErrorState: React.FC<ConnectionErrorStateProps> = ({
  id,
  title,
  errorMessage,
  onRetry,
}) => {
  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 mb-4">Connexion error</div>
        <div className="text-gray-400 text-center">{errorMessage}</div>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Réessayer
        </button>
      </div>
    </WidgetWrapper>
  );
};

export default ConnectionErrorState;
