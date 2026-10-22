import React, { useState } from 'react';
import { Terminal, Download, Trash2, Filter } from 'lucide-react';
import { EventLogEntry } from '../types/camera';

interface EventLogDrawerProps {
  logs: EventLogEntry[];
  onClearLogs: () => void;
}

export const EventLogDrawer: React.FC<EventLogDrawerProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const exportLogsAsText = () => {
    const textContent = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message} ${l.details || ''}`)
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esp32_cctv_audit_log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Security Event Log</span>
              <span className="text-xs font-mono font-normal text-zinc-400">
                ({filteredLogs.length})
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">Real-time command telemetry & sensor triggers</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Selector */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
            <Filter className="w-3 h-3 text-zinc-500 ml-1" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-zinc-300 text-xs focus:outline-none pr-1"
            >
              <option value="all">All Events</option>
              <option value="command">Commands</option>
              <option value="success">Snapshots</option>
              <option value="info">System Info</option>
              <option value="error">Errors</option>
            </select>
          </div>

          <button
            type="button"
            onClick={exportLogsAsText}
            disabled={logs.length === 0}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 disabled:opacity-40"
            title="Export log as text file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 disabled:opacity-40"
            title="Clear all event logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="p-4 overflow-y-auto max-h-64 sm:max-h-72 font-mono text-xs space-y-1.5 bg-zinc-950/70">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-zinc-600">
            No events recorded for selected filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            let badgeColor = 'text-teal-400';
            if (log.type === 'error') badgeColor = 'text-red-400';
            if (log.type === 'warning') badgeColor = 'text-amber-400';
            if (log.type === 'command') badgeColor = 'text-sky-400';
            if (log.type === 'success') badgeColor = 'text-emerald-400';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 p-1.5 rounded hover:bg-zinc-900/60 transition-colors"
              >
                <span className="text-zinc-600 shrink-0 select-none">
                  [{log.timestamp}]
                </span>
                <span className={`font-semibold shrink-0 uppercase text-[10px] ${badgeColor}`}>
                  {log.type}
                </span>
                <span className="text-zinc-300 break-all flex-1">
                  {log.message}
                  {log.details && (
                    <span className="text-zinc-500 ml-1.5">({log.details})</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
