import React from 'react';
import { Image, Download, Trash2, Eye, Calendar, Sparkles, X } from 'lucide-react';
import { Snapshot } from '../types/camera';

interface SnapshotGalleryProps {
  snapshots: Snapshot[];
  onSelectSnapshot: (snapshot: Snapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearAll: () => void;
  onDownloadSnapshot: (snapshot: Snapshot) => void;
  onClose?: () => void;
}

export const SnapshotGallery: React.FC<SnapshotGalleryProps> = ({
  snapshots,
  onSelectSnapshot,
  onDeleteSnapshot,
  onClearAll,
  onDownloadSnapshot,
  onClose,
}) => {
  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Gallery Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Image className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
              Security Snapshot Gallery
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white bg-red-600 hover:bg-red-500 active:scale-98 rounded-lg transition-all border border-red-500 shadow-md shadow-red-600/30 cursor-pointer"
              title="Close Gallery"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Grid View */}
      <div className="p-4 sm:p-5">
        {snapshots.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-500 mb-3">
              <Image className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-1">No Snapshots Captured Yet</h4>
            <p className="text-xs text-zinc-500 max-w-sm font-mono leading-relaxed">
              Click the <span className="text-teal-400">Snapshot</span> button below the video feed or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px]">Space</kbd> to capture forensic frames.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                onClick={() => onSelectSnapshot(snap)}
                className="group relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/90 hover:border-teal-500/50 transition-all cursor-pointer shadow-md hover:shadow-teal-500/10 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-4/3 w-full bg-zinc-950 overflow-hidden">
                  <img
                    src={snap.dataUrl}
                    alt={snap.formattedTime}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-1.5 rounded-full bg-zinc-900/80 text-teal-400">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Resolution tag */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-zinc-300 backdrop-blur-xs">
                    {snap.resolution}
                  </span>
                </div>

                {/* Footer Metadata */}
                <div className="p-2 flex items-center justify-between gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-900/90 border-t border-zinc-800">
                  <span className="truncate flex items-center gap-1 text-zinc-300">
                    <Calendar className="w-2.5 h-2.5 text-zinc-500" />
                    {snap.formattedTime.split(' ')[1] || snap.formattedTime}
                  </span>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onDownloadSnapshot(snap)}
                      className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded border border-emerald-500/30 transition-colors cursor-pointer"
                      title="Download image"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1 text-white bg-red-600 hover:bg-red-500 rounded border border-red-500 shadow-sm shadow-red-600/30 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
