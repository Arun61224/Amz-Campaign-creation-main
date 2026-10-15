import React from 'react';
import { 
  Settings2, 
  Layers, 
  IndianRupee, 
  Zap, 
  Target
} from 'lucide-react';
import { StrategySettings, AdGroupArchitecture, CampaignMode } from '../types';

interface StrategyControlsProps {
  settings: StrategySettings;
  onChange: (updated: StrategySettings) => void;
  availableProductGroups: string[];
  isDark?: boolean;
}

export const StrategyControls: React.FC<StrategyControlsProps> = ({
  settings,
  onChange,
  availableProductGroups,
  isDark = false,
}) => {
  const updateSetting = <K extends keyof StrategySettings>(
    key: K,
    value: StrategySettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const toggleMatchType = (type: 'BROAD' | 'PHRASE' | 'EXACT') => {
    onChange({
      ...settings,
      enabledMatchTypes: {
        ...settings.enabledMatchTypes,
        [type]: !settings.enabledMatchTypes[type],
      },
    });
  };

  const updateBid = (type: 'BROAD' | 'PHRASE' | 'EXACT', bid: number) => {
    onChange({
      ...settings,
      defaultBids: {
        ...settings.defaultBids,
        [type]: Math.max(0.05, bid),
      },
    });
  };

  const updateAutoBid = (targetType: keyof StrategySettings['autoBids'], bid: number) => {
    onChange({
      ...settings,
      autoBids: {
        ...settings.autoBids,
        [targetType]: Math.max(0.05, bid),
      },
    });
  };

  return (
    <div className={`rounded-2xl p-5 mb-6 shadow-xs border transition-colors ${
      isDark 
        ? 'bg-slate-900 border-slate-800 text-slate-200' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b gap-3 ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Amazon Campaign Settings & INR (₹) Bidding Rules
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Configure Auto vs Manual targeting, daily budgets, and size keyword match types
            </p>
          </div>
        </div>

        {/* Currency Badge */}
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1 self-start sm:self-auto font-mono">
          Currency: INR (₹)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Column 1: Campaign Mode & Budget */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Campaign Type & Budget
          </h3>

          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Amazon Campaign Mode:
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'BOTH', label: 'Auto + Manual Dual Strategy', desc: 'Recommended: Auto harvests terms, Manual targets sizes' },
                { id: 'AUTO_ONLY', label: 'Auto Campaign Only', desc: 'Amazon algorithm targets customer searches' },
                { id: 'MANUAL_ONLY', label: 'Manual Size Keywords Only', desc: 'Strict size-specific keyword bids' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`block p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    settings.campaignMode === opt.id
                      ? isDark 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                      : isDark
                        ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="campaignModeRadio"
                      checked={settings.campaignMode === opt.id}
                      onChange={() => updateSetting('campaignMode', opt.id as CampaignMode)}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-bold">{opt.label}</span>
                  </div>
                  <p className={`text-[10px] pl-5 mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Daily Budget in INR (₹) */}
          <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Campaign Daily Budget (₹ INR)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">₹</span>
              <input
                type="number"
                step="50"
                min="50"
                value={settings.dailyBudget}
                onChange={(e) => updateSetting('dailyBudget', parseFloat(e.target.value) || 500.0)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg font-mono font-bold border transition-colors ${
                  isDark 
                    ? 'bg-slate-950 border-slate-700 text-slate-100' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              />
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/day</span>
            </div>
          </div>

          {/* Shared Ad Group Default Bid in INR (₹) */}
          <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Ad Group Default Bid (₹ INR)
            </label>
            <p className={`text-[10px] mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Same default bid for all Auto and Manual Ad Groups.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">₹</span>
              <input
                type="number"
                step="0.50"
                min="0.05"
                value={settings.adGroupDefaultBid}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value);
                  updateSetting('adGroupDefaultBid', Number.isFinite(value) && value >= 0.05 ? value : 0.05);
                }}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg font-mono font-bold border transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Auto Campaign Bids (INR) */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Auto Campaign Bids (₹ INR)
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { key: 'closeMatch' as const, label: 'Close-match Bid:' },
              { key: 'looseMatch' as const, label: 'Loose-match Bid:' },
              { key: 'substitutes' as const, label: 'Substitutes Bid:' },
              { key: 'complements' as const, label: 'Complements Bid:' },
            ].map(({ key, label }) => (
              <div 
                key={key}
                className={`flex items-center justify-between p-2 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
                <div className="flex items-center gap-1">
                  <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>₹</span>
                  <input
                    type="number"
                    step="0.50"
                    min="1.00"
                    value={settings.autoBids[key]}
                    onChange={(e) => updateAutoBid(key, parseFloat(e.target.value) || 10.0)}
                    className={`w-16 px-1.5 py-0.5 text-xs rounded text-right font-mono border ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-100' 
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Manual Keyword Match Types & Bids (INR) */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5" />
            Manual Match Types (₹ INR)
          </h3>

          {/* Exact Match */}
          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabledMatchTypes.EXACT}
                onChange={() => toggleMatchType('EXACT')}
                className="rounded border-slate-300 text-emerald-500"
              />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">EXACT</span>
            </label>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>₹</span>
              <input
                type="number"
                step="0.50"
                min="1.00"
                value={settings.defaultBids.EXACT}
                onChange={(e) => updateBid('EXACT', parseFloat(e.target.value) || 18.0)}
                className={`w-16 px-1.5 py-0.5 text-xs rounded text-right font-mono border ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Phrase Match */}
          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabledMatchTypes.PHRASE}
                onChange={() => toggleMatchType('PHRASE')}
                className="rounded border-slate-300 text-blue-500"
              />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">PHRASE</span>
            </label>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>₹</span>
              <input
                type="number"
                step="0.50"
                min="1.00"
                value={settings.defaultBids.PHRASE}
                onChange={(e) => updateBid('PHRASE', parseFloat(e.target.value) || 14.0)}
                className={`w-16 px-1.5 py-0.5 text-xs rounded text-right font-mono border ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Broad Match */}
          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabledMatchTypes.BROAD}
                onChange={() => toggleMatchType('BROAD')}
                className="rounded border-slate-300 text-purple-500"
              />
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">BROAD</span>
            </label>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>₹</span>
              <input
                type="number"
                step="0.50"
                min="1.00"
                value={settings.defaultBids.BROAD}
                onChange={(e) => updateBid('BROAD', parseFloat(e.target.value) || 10.0)}
                className={`w-16 px-1.5 py-0.5 text-xs rounded text-right font-mono border ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Column 4: Ad Group Structure & Size Rules */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Ad Group Topology
          </h3>

          <div className="space-y-2">
            <label
              className={`block p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                settings.adGroupArchitecture === 'SEPARATE_PER_SIZE'
                  ? isDark 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : isDark 
                    ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="adGroupArch"
                  checked={settings.adGroupArchitecture === 'SEPARATE_PER_SIZE'}
                  onChange={() => updateSetting('adGroupArchitecture', 'SEPARATE_PER_SIZE')}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <span className="font-bold">Separate Ad Group per Size</span>
              </div>
              <p className={`text-[10px] mt-1 pl-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Isolated: prevents Amazon from showing 5–6Y product for 18–24M search.
              </p>
            </label>

            <label
              className={`block p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                settings.adGroupArchitecture === 'SINGLE_PER_DESIGN'
                  ? isDark 
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                  : isDark 
                    ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="adGroupArch"
                  checked={settings.adGroupArchitecture === 'SINGLE_PER_DESIGN'}
                  onChange={() => updateSetting('adGroupArchitecture', 'SINGLE_PER_DESIGN')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span className="font-bold">Single Shared per Design</span>
              </div>
              <p className={`text-[10px] mt-1 pl-5 ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
                Shared: all sizes in 1 group (potential cross-size collision).
              </p>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
