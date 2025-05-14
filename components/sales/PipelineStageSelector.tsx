import React, { useState } from 'react';

interface PipelineStage {
  id: number;
  name: string;
  order_num: number;
  color: string;
}

interface PipelineStageSelectorProps {
  stages: PipelineStage[];
  currentStageId: number;
  onChange: (stageId: number) => void;
  simplified?: boolean;
}

export default function PipelineStageSelector({ 
  stages, 
  currentStageId, 
  onChange,
  simplified = false
}: PipelineStageSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Sort stages by order number
  const sortedStages = [...stages].sort((a, b) => a.order_num - b.order_num);
  
  // Find current stage
  const currentStage = stages.find(stage => stage.id === currentStageId) || sortedStages[0];
  
  return (
    <div className="relative">
      {simplified ? (
        <select 
          value={currentStageId} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {sortedStages.map(stage => (
            <option key={stage.id} value={stage.id}>{stage.name}</option>
          ))}
        </select>
      ) : (
        <>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center">
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: currentStage.color }}
              />
              <span>{currentStage.name}</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
              <ul className="py-1">
                {sortedStages.map(stage => (
                  <li 
                    key={stage.id}
                    onClick={() => {
                      onChange(stage.id);
                      setShowDropdown(false);
                    }}
                    className={`flex items-center px-3 py-2 text-sm cursor-pointer ${
                      stage.id === currentStageId ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span>{stage.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}