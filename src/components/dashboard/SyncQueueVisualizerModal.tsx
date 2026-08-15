import React, { useState } from 'react';
import { RefreshCw, Trash2, X, Eye, ChevronDown, ChevronUp, Database, Clock, Layers, Filter } from 'lucide-react';
import { SyncQueueItem, storageManager } from '../../storage';

interface SyncQueueVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: SyncQueueItem[];
  onQueueUpdated: () => void;
  darkMode: boolean;
  isRtl: boolean;
}

const ENTITY_NAMES_FA: Record<string, string> = {
  product: 'کالا / محصول',
  category: 'دسته‌بندی',
  inventory: 'موجودی انبار',
  size_template: 'قالب راهنمای سایز',
  color: 'رنگ',
  size: 'سایز',
  order: 'سفارش'
};

const OPERATION_LABELS_FA: Record<string, { label: string; color: string }> = {
  create: { label: 'ایجاد جدید', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  update: { label: 'ویرایش', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  delete: { label: 'حذف', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' }
};

export const SyncQueueVisualizerModal: React.FC<SyncQueueVisualizerModalProps> = ({
  isOpen,
  onClose,
  queue,
  onQueueUpdated,
  darkMode,
  isRtl
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredQueue = queue.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.entityType === selectedFilter;
  });

  const handleRemoveSingleItem = (id: string) => {
    storageManager.removeSyncQueueItem(id);
    onQueueUpdated();
  };

  const handleClearAll = () => {
    if (window.confirm(isRtl ? 'آیا از پاکسازی تمامی تغییرات معوق صف همگام‌سازی اطمینان دارید؟' : 'Clear all pending sync queue items?')) {
      storageManager.clearPendingSyncQueue();
      onQueueUpdated();
    }
  };

  const formatTimestamp = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString('fa-IR');
    } catch {
      return new Date(ts).toLocaleString();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-4xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${darkMode ? 'border-neutral-800 bg-neutral-950/50' : 'border-neutral-200 bg-neutral-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>{isRtl ? 'صف تغییرات معوق همگام‌سازی' : 'Sync Queue Visualizer'}</span>
                <span className="px-2 py-0.5 text-xs font-black rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  {queue.length} {isRtl ? 'تغییر معوق' : 'items'}
                </span>
              </h3>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {isRtl
                  ? 'مشاهده و مدیریت تغییراتی که در حالت آفلاین ثبت شده و منتظر ارسال به سرور هستند.'
                  : 'Inspect and manage offline local updates pending sync to Directus server.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title={isRtl ? 'پاکسازی کامل صف' : 'Clear All'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRtl ? 'پاکسازی صف' : 'Clear Queue'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                darkMode ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-800 text-white' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`px-5 py-3 border-b flex items-center gap-2 overflow-x-auto ${darkMode ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-neutral-50/50'}`}>
          <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-xs font-bold text-neutral-400 shrink-0">{isRtl ? 'فیلتر موجودیت:' : 'Filter:'}</span>

          {[
            { id: 'all', label: isRtl ? 'همه موارد' : 'All' },
            { id: 'product', label: isRtl ? 'محصولات' : 'Products' },
            { id: 'inventory', label: isRtl ? 'انبار' : 'Inventory' },
            { id: 'order', label: isRtl ? 'سفارشات' : 'Orders' },
            { id: 'category', label: isRtl ? 'دسته‌بندی' : 'Categories' },
            { id: 'size_template', label: isRtl ? 'قالب سایز' : 'Templates' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === f.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : darkMode
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  : 'bg-neutral-200/70 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content Queue List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-neutral-300">
                {isRtl ? 'صف همگام‌سازی خالی است!' : 'Sync Queue is Empty!'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {isRtl
                  ? 'تمامی تغییرات با موفقیت در دیتابیس ابری ثبت شده‌اند و هیچ تغییر معوقی وجود ندارد.'
                  : 'All local changes are fully synced with the cloud server.'}
              </p>
            </div>
          ) : (
            filteredQueue.map(item => {
              const isExpanded = expandedItemId === item.id;
              const op = OPERATION_LABELS_FA[item.operation] || { label: item.operation, color: 'bg-neutral-800 text-neutral-300' };

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    darkMode ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${op.color}`}>
                        {op.label}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-sky-400">
                            {ENTITY_NAMES_FA[item.entityType] || item.entityType}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-500">#{item.entityId}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{formatTimestamp(item.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                          darkMode ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300' : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isRtl ? 'جزئیات' : 'Inspect'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleRemoveSingleItem(item.id)}
                        className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                        title={isRtl ? 'حذف این تغییر از صف' : 'Remove item'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Payload Inspector */}
                  {isExpanded && (
                    <div className={`p-3.5 border-t text-xs font-mono overflow-x-auto ${darkMode ? 'bg-black/50 border-neutral-800 text-emerald-400' : 'bg-neutral-900 border-neutral-200 text-emerald-300'}`}>
                      <p className="text-[10px] text-neutral-400 mb-1 font-sans font-bold">
                        {isRtl ? 'داده‌های ارسالی (Payload):' : 'Payload JSON:'}
                      </p>
                      <pre className="text-[11px] leading-relaxed whitespace-pre-wrap dir-ltr">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
