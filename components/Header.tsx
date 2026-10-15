import React from 'react';
import { 
  Sliders, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw,
  RotateCcw,
  Upload,
  TrendingUp,
  Sun,
  Moon,
  Tag
} from 'lucide-react';
import { StrategySettings } from '../types';

interface HeaderProps {
  totalSkus: number;
  totalKeywords: number;
  sizeKeywordsCount: number;
  designKeywordsCount: number;
  crossSizeWarningCount: number;
  pendingApprovalsCount: number;
  onOpenUploadModal: () => void;
  onOpenParserConfig: () => void;
  onOpenExportModal: () => void;
  onOpenNegativesQueue: () => void;
  onOpenDeduplication: () => void;
  onOpenGoogleTrends: () => void;
  onRegenerate: () => void;
  strategy: StrategySettings;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalSkus,
  totalKeywords,
  sizeKeywordsCount,
  designKeywordsCount,
  crossSizeWarningCount,
  pendingApprovalsCount,
  onOpenUploadModal,
  onOpenParserConfig,
  onOpenExportModal,
  onOpenNegativesQueue,
  onOpenDeduplication,
  onOpenGoogleTrends,
  onRegenerate,
  strategy,
  isDark = false,
  onToggleTheme,
}) => {
  return (
    <header className={`sticky top-0 z-30 transition-colors border-b shadow-xs ${
      isDark 
        ? 'bg-slate-900 border-slate-800 text-white' 
        : 'bg-white border-slate-200/90 text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black text-xl tracking-tight">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Amazon Ads Size Keyword Studio
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  eCommerce v2.4
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Google Trends Explorer - Prominent */}
            <button
              onClick={onOpenGoogleTrends}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                isDark
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
              }`}
              title="Search and import trending keywords from Google Trends India"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Google Trends
            </button>

            {/* Upload SKU File */}
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-colors"
              title="Upload Excel or CSV file of SKUs"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload SKUs (Excel / CSV)
            </button>

            {/* Parser Config */}
            <button
              onClick={onOpenParserConfig}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Configure SKU Delimiters & Age Normalization"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              SKU Rules
            </button>

            {/* Deduplication Analyzer */}
            <button
              onClick={onOpenDeduplication}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Inspect & merge alternate age expressions"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Deduplication
            </button>

            {/* Negatives Queue */}
            <button
              onClick={onOpenNegativesQueue}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors relative ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Negatives
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 rounded-full">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {/* Refresh / Clear Inputs Button */}
            <button
              onClick={onRegenerate}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 shadow-2xs'
              }`}
              title="Refresh and clear all inputs, SKUs, and keywords"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              Refresh (Clear Inputs)
            </button>

            {/* Export Bulk Template */}
            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg shadow-xs border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Bulk
            </button>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title={isDark ? "Switch to Clean Modern Light Dashboard" : "Switch to Dark Studio"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Metric Bar */}
        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2.5 pt-2.5 border-t text-xs ${
          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>SKUs Parsed:</span>
            <strong className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {totalSkus}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Size Keywords:</span>
            <strong className="font-mono text-amber-600 dark:text-amber-400">
              {sizeKeywordsCount}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Design-Level:</span>
            <strong className="font-mono text-purple-600 dark:text-purple-400">
              {designKeywordsCount}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Ad Group Setup:</span>
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
                ? 'Shared (Design)'
                : 'Isolated (Per Size)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {crossSizeWarningCount > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">Collisions:</span>
                <strong className="font-mono text-rose-600 dark:text-rose-300">
                  {crossSizeWarningCount}
                </strong>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Safe Ad Group Isolation</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
