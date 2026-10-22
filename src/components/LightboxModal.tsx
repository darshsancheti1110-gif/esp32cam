import React from 'react';
import { X, Download, Trash2, Calendar, HardDrive, Maximize } from 'lucide-react';
import { Snapshot } from '../types/camera';

interface LightboxModalProps {
  snapshot: Snapshot | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (snapshot: Snapshot) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  snapshot,
  onClose,
  onDelete,
  onDownload,
}) => {
  if (!snapshot) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Maximize className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Snapshot Details</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-teal-400">
                  {snapshot.resolution}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  {snapshot.formattedTime}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-zinc-500" />
                  Source: {snapshot.source}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(snapshot)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(snapshot.id);
                onClose();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              title="Delete Snapshot"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Preview */}
        <div className="relative bg-zinc-950 flex items-center justify-center p-2 min-h-[300px] max-h-[70vh] overflow-hidden">
          <img
            src={snapshot.dataUrl}
            alt={`Snapshot ${snapshot.formattedTime}`}
            className="max-w-full max-h-[68vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
