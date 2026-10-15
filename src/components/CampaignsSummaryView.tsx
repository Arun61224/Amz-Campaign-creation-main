import React from 'react';
import { 
  Layers, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Zap, 
  ArrowRight
} from 'lucide-react';
import { CampaignSummaryItem, StrategySettings, ProductSKU } from '../types';

interface CampaignsSummaryViewProps {
  summaries: CampaignSummaryItem[];
  strategy: StrategySettings;
  catalog: ProductSKU[];
  onOpenExportModal: () => void;
  onOpenUploadModal: () => void;
  onSwitchMode: (mode: 'BOTH' | 'AUTO_ONLY' | 'MANUAL_ONLY') => void;
  onLoadDemo?: () => void;
  isDark?: boolean;
}

export const CampaignsSummaryView: React.FC<CampaignsSummaryViewProps> = ({
  summaries,
  strategy,
  catalog,
  onOpenExportModal,
  onOpenUploadModal,
  onSwitchMode,
  onLoadDemo,
  isDark = false,
}) => {
  if (catalog.length === 0) {
    return (
      <div className={`rounded-2xl p-8 text-center mb-6 shadow-xs border transition-colors ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-300' 
          : 'bg-white border-slate-200 text-slate-700'
      }`}>
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
          <Zap className="w-7 h-7" />
        </div>
        <h3 className={`text-base font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          No SKUs Loaded Yet
        </h3>
        <p className={`text-xs max-w-lg mx-auto mb-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Upload or paste your inventory SKUs below. The studio will automatically build structured <strong>Auto Campaigns</strong>, <strong>Size-Specific Ad Groups</strong>, and ready-to-upload <strong>Amazon Bulk Files (.csv)</strong> in INR (₹).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenUploadModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Upload / Paste Product SKUs
          </button>

          {onLoadDemo && (
            <button
              onClick={onLoadDemo}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample SKUs (T-Shirts & Pyjamas, Marvel, Disney)
            </button>
          )}
        </div>
      </div>
    );
  }

  const autoCount = summaries.filter((s) => s.targetingType === 'AUTO').length;
  const manualCount = summaries.filter((s) => s.targetingType === 'MANUAL').length;

  return (
    <div className={`rounded-2xl p-5 mb-6 shadow-xs border transition-colors ${
      isDark 
        ? 'bg-slate-900 border-slate-800 text-slate-200' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* View Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Layers className="w-5 h-5 text-amber-500" />
              Generated Amazon Sponsored Products Campaigns
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {summaries.length} Campaigns Ready
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Auto & Manual campaigns structured with INR (₹) daily budgets and clean Ad Group IDs
          </p>
        </div>

        {/* Campaign Mode Switcher */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border text-xs ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => onSwitchMode('BOTH')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              strategy.campaignMode === 'BOTH'
                ? 'bg-amber-500 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto + Manual Dual ({summaries.length})
          </button>

          <button
            onClick={() => onSwitchMode('AUTO_ONLY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              strategy.campaignMode === 'AUTO_ONLY'
                ? 'bg-amber-500 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto Only ({autoCount})
          </button>

          <button
            onClick={() => onSwitchMode('MANUAL_ONLY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              strategy.campaignMode === 'MANUAL_ONLY'
                ? 'bg-amber-500 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manual Only ({manualCount})
          </button>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {summaries.map((camp) => (
          <div
            key={camp.id}
            className={`p-4 rounded-xl border transition-all ${
              isDark 
                ? camp.targetingType === 'AUTO'
                  ? 'bg-slate-950/60 border-blue-500/30 hover:border-blue-500/50'
                  : 'bg-slate-950/60 border-amber-500/30 hover:border-amber-500/50'
                : camp.targetingType === 'AUTO'
                  ? 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                  : 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  camp.targetingType === 'AUTO'
                    ? isDark 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                    : isDark 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {camp.targetingType} Campaign
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Enabled
              </span>
            </div>

            <h3 className={`text-xs font-bold font-mono truncate mb-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`} title={camp.campaignName}>
              {camp.campaignName}
            </h3>

            <div className={`grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg border mb-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
            }`}>
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Daily Budget:</span>
                <span className={`font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  ₹{camp.dailyBudget.toFixed(2)} INR
                </span>
              </div>
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bidding:</span>
                <span className={`text-[11px] truncate block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Down only</span>
              </div>
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ad Groups:</span>
                <span className={`font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{camp.adGroupsCount}</span>
              </div>
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {camp.targetingType === 'AUTO' ? 'Auto Targets:' : 'Keywords:'}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {camp.keywordsOrTargetsCount}
                </span>
              </div>
            </div>

            <div className={`text-[11px] flex items-center justify-between mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Ad Group Default Bid:</span>
              <strong className={`font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                ₹{strategy.adGroupDefaultBid.toFixed(2)} INR
              </strong>
            </div>

            <div className={`text-[11px] flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Attached SKUs: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{camp.skusCount}</strong></span>
              <span className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold">Bulk Ready</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Footer */}
      <div className={`mt-4 pt-3.5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
      }`}>
        <span>
          Auto campaigns, size ad groups, and keyword rows will be exported directly into the Amazon bulk file.
        </span>
        <button
          onClick={onOpenExportModal}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download Amazon Bulk File (.csv)
        </button>
      </div>
    </div>
  );
};
