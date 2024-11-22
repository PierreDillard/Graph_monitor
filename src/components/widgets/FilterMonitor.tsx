import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Activity } from 'lucide-react';
import { RootState } from '../../store';
import WidgetWrapper from '../common/WidgetWrapper';

const FilterMonitor = ({ id, title }) => {
  // Récupérer le nœud sélectionné depuis le store Redux
  const selectedNode = useSelector((state: RootState) => {
    console.log('FilterMonitor - Current Redux State:', state);
    console.log('FilterMonitor - Selected Node:', state.graph?.selectedFilterDetails);
    return state.graph?.selectedFilterDetails || null;
  });

  // Log lors du rendu du composant
  useEffect(() => {
    console.log('FilterMonitor - Component rendered with selectedNode:', selectedNode);
  }, [selectedNode]);

  // Si aucun nœud n'est sélectionné, afficher un message d'instruction
  if (!selectedNode) {
    console.log('FilterMonitor - No node selected, showing placeholder');
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center h-full p-4 text-gray-400">
          Select a node in the Graph Monitor to view details
        </div>
      </WidgetWrapper>
    );
  }

  console.log('FilterMonitor - Rendering with node:', selectedNode);

  // Afficher les informations du filtre sélectionné
  return (
    <WidgetWrapper id={id} title={title}>
      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium mb-2">Filter Details</h3>
          
          <div className="space-y-2">
            {/* Affichage du nom */}
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-gray-300">Name:</span>
              <span className="text-white font-medium">
                {selectedNode.name || JSON.stringify(selectedNode)}
              </span>
            </div>

            {/* Affichage du type */}
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Type:</span>
              <span className="text-white">{selectedNode.type || 'N/A'}</span>
            </div>

            {/* Debug info */}
            <div className="mt-4 p-2 bg-gray-900 rounded text-xs text-gray-400">
              <pre>{JSON.stringify(selectedNode, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(FilterMonitor);