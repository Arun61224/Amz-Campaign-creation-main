import React from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { AdGroupArchitecture } from '../types';

interface AdGroupWarningBannerProps {
  architecture: AdGroupArchitecture;
  collisionCount: number;
  onSwitchArchitecture: (arch: AdGroupArchitecture) => void;
  isDark?: boolean;
}

export const AdGroupWarningBanner: React.FC<AdGroupWarningBannerProps> = ({
  architecture,
  collisionCount,
  onSwitchArchitecture,
  isDark = false,
}) => {
  if (architecture === 'SEPARATE_PER_SIZE') {
    return (
      <div className={`rounded-xl p-3.5 mb-5 flex items-start gap-3 shadow-xs border transition-colors ${
        isDark 
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200/90' 
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
      }`}>
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs leading-relaxed flex-1">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-0.5">
            Ad Group Isolation Active: Protected Against Cross-Size Mismatches
          </p>
          <p className={isDark ? 'text-emerald-300/80' : 'text-emerald-700'}>
            Each size SKU has its own dedicated ad group. Amazon will never serve a 5–6Y product ad for an 18–24M or 13–14Y search term query.
          </p>
        </div>
        <button
          onClick={() => onSwitchArchitecture('SINGLE_PER_DESIGN')}
          className={`text-xs underline whitespace-nowrap self-center ${
            isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Change to Shared
        </button>
      </div>
    );
  }

  // If SINGLE_PER_DESIGN and collisionCount > 0
  return (
    <div className={`rounded-xl p-4 mb-5 shadow-xs border transition-colors ${
      isDark 
        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200/90' 
        : 'bg-amber-50 border-amber-300 text-amber-900'
    }`}>
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              Cross-Size Advertising Risk Detected ({collisionCount} Size-Specific Keywords Affected)
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full uppercase">
              Action Recommended
            </span>
          </div>

          <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-amber-200/90' : 'text-amber-800'}`}>
            Because your current architecture places <em>all size variants of a design inside the same Ad Group</em>, Amazon will randomly serve <strong>any</strong> size SKU when a keyword triggers. A shopper searching for a specific size can be served a completely different size variant!
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSwitchArchitecture('SEPARATE_PER_SIZE')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-colors"
            >
              Switch to 'Separate Ad Groups per Size SKU' (Eliminates Risk)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <span className={`text-xs italic flex items-center gap-1 ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
              <Info className="w-3.5 h-3.5" />
              Keeps size variants in separate, tightly targeted Ad Groups.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
