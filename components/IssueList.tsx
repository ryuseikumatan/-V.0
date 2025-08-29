import React from 'react';
import { Issue } from '../types';
import { WarningIcon, CheckCircleIcon } from './icons';

interface IssueListProps {
  issues: Issue[];
  onIssueClick: (time: number) => void;
}

const IssueCard: React.FC<{ issue: Issue; onClick: () => void }> = ({ issue, onClick }) => (
  <div
    className="bg-zinc-800/50 p-4 rounded-lg mb-4 border border-zinc-700 hover:border-blue-500 cursor-pointer transition-all"
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-mono bg-zinc-700 text-zinc-300 px-2 py-1 rounded">
        {new Date(issue.timestamp * 1000).toISOString().substr(14, 5)}
      </span>
    </div>
    <div className="mb-3">
        <p className="text-sm text-zinc-400 mb-1">元の表現:</p>
        <p className="text-zinc-100 italic">「{issue.originalText}」</p>
    </div>

    <div className="space-y-3">
        <div className="flex items-start gap-2">
            <WarningIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
                <h4 className="font-semibold text-red-400">問題点</h4>
                <p className="text-sm text-zinc-300">{issue.problem}</p>
            </div>
        </div>
        <div className="flex items-start gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
                <h4 className="font-semibold text-green-400">改善案</h4>
                <p className="text-sm text-zinc-300">{issue.suggestion}</p>
            </div>
        </div>
    </div>
  </div>
);


const IssueList: React.FC<IssueListProps> = ({ issues, onIssueClick }) => {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center text-zinc-500">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-300">素晴らしいです！</h3>
        <p>薬機法に抵触する可能性のある表現は見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div>
      {issues.map((issue) => (
        <IssueCard key={issue.timestamp} issue={issue} onClick={() => onIssueClick(issue.timestamp)} />
      ))}
    </div>
  );
};

export default IssueList;