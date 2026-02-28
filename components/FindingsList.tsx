import React from 'react';
import { Finding } from '../types';

interface FindingsListProps {
  findings: Finding[];
  onSelectFinding: (id: string) => void;
  selectedFindingId?: string;
}

const severityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const FindingsList: React.FC<FindingsListProps> = ({ findings, onSelectFinding, selectedFindingId }) => {
  if (findings.length === 0) {
    return <div className="p-4 text-gray-500 italic text-center">No issues found. Great job!</div>;
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {findings.map((f) => (
        <div
          key={f.id}
          onClick={() => onSelectFinding(f.id)}
          className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
            selectedFindingId === f.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-wrap gap-2">
               {/* Category Badge */}
               {f.category === 'WCAG' ? (
                 <span className="px-2 py-0.5 rounded text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-1">
                   ♿ WCAG
                 </span>
               ) : (
                 <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                   UX
                 </span>
               )}

               {/* ID/Heuristic Badge */}
               {f.rule_id && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                  {f.rule_id}
                </span>
               )}
               
               {/* Severity Badge */}
               <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColors[f.severity]}`}>
                 {f.severity}
               </span>
            </div>
            <span className="text-xs text-gray-400 font-mono ml-2">{f.id}</span>
          </div>
          
          <h4 className="font-semibold text-gray-800 mb-1">{f.element_name}</h4>
          <p className="text-sm text-gray-600 mb-2">{f.issue_description}</p>
          
          <div className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
            <span className="font-semibold text-gray-700">Suggestion: </span>
            <span className="text-gray-600">{f.suggestion}</span>
          </div>
        </div>
      ))}
    </div>
  );
};