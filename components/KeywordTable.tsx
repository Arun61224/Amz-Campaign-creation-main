import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  IndianRupee, 
  Check, 
  X, 
  ShieldAlert, 
  Info,
  ChevronDown,
  Sparkles,
  Flame
} from 'lucide-react';
import { KeywordItem, KeywordCategory, MatchType, ApprovalStatus } from '../types';

interface KeywordTableProps {
  keywords: KeywordItem[];
  onUpdateApproval: (id: string, status: ApprovalStatus) => void;
  onBulkUpdateApproval: (ids: string[], status: ApprovalStatus) => void;
  onUpdateBid: (id: string, newBid: number) => void;
  onBulkAdjustBids: (ids: string[], factorOrFixed: { type: 'PERCENT' | 'FIXED'; value: number }) => void;
  onOpenNegativesQueue: () => void;
  pendingNegativesCount: number;
  onOpenGoogleTrends?: () => void;
  isDark?: boolean;
}

export const KeywordTable: React.FC<KeywordTableProps> = ({
  keywords,
  onUpdateApproval,
  onBulkUpdateApproval,
  onUpdateBid,
  onBulkAdjustBids,
  onOpenNegativesQueue,
  pendingNegativesCount,
  onOpenGoogleTrends,
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState<KeywordCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchTypeFilter, setMatchTypeFilter] = useState<'ALL' | MatchType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');
  const [onlyRiskWarnings, setOnlyRiskWarnings] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBidInput, setBulkBidInput] = useState<string>('14.00'); // Default ₹14.00 INR
  const [showBulkBidMenu, setShowBulkBidMenu] = useState(false);

  // Tab counts
  const counts = useMemo(() => {
    return {
      SIZE_SPECIFIC: keywords.filter((k) => k.category === 'SIZE_SPECIFIC').length,
      DESIGN_LEVEL: keywords.filter((k) => k.category === 'DESIGN_LEVEL').length,
      CHARACTER_SPECIFIC: keywords.filter((k) => k.category === 'CHARACTER_SPECIFIC').length,
      GENERIC: keywords.filter((k) => k.category === 'GENERIC').length,
      ALL: keywords.length,
      RISK: keywords.filter((k) => k.hasAdGroupCrossSizeRisk).length,
    };
  }, [keywords]);

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    return keywords.filter((k) => {
      // Tab filter
      if (activeTab !== 'ALL' && k.category !== activeTab) {
        return false;
      }

      // Match type filter
      if (matchTypeFilter !== 'ALL' && k.matchType !== matchTypeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && k.approvalStatus !== statusFilter) {
        return false;
      }

      // Cross-size risk filter
      if (onlyRiskWarnings && !k.hasAdGroupCrossSizeRisk) {
        return false;
      }

      // Search query (keyword text, SKU, design, size, or audience)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = k.keywordText.toLowerCase().includes(q);
        const matchesSku = k.sku.toLowerCase().includes(q);
        const matchesDesign = k.designId.toLowerCase().includes(q);
        const matchesSize = k.sizeDisplay.toLowerCase().includes(q);
        const matchesAudience = k.audience.toLowerCase().includes(q);
        return matchesText || matchesSku || matchesDesign || matchesSize || matchesAudience;
      }

      return true;
    });
  }, [keywords, activeTab, matchTypeFilter, statusFilter, onlyRiskWarnings, searchQuery]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredKeywords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredKeywords.map((k) => k.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    onBulkUpdateApproval(selectedIds, 'APPROVED');
    setSelectedIds([]);
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    onBulkUpdateApproval(selectedIds, 'REJECTED');
    setSelectedIds([]);
  };

  const handleApplyFixedBid = () => {
    const val = parseFloat(bulkBidInput);
    if (!isNaN(val) && val > 0) {
      onBulkAdjustBids(selectedIds, { type: 'FIXED', value: val });
      setShowBulkBidMenu(false);
    }
  };

  const handleAdjustBidPercent = (percent: number) => {
    onBulkAdjustBids(selectedIds, { type: 'PERCENT', value: percent });
    setShowBulkBidMenu(false);
  };

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xs border transition-colors ${
      isDark 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Category Tabs */}
      <div className={`flex border-b overflow-x-auto ${
        isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50/70'
      }`}>
        <button
          onClick={() => {
            setActiveTab('SIZE_SPECIFIC');
            setSelectedIds([]);
          }}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'SIZE_SPECIFIC'
              ? isDark 
                ? 'border-amber-500 text-amber-400 bg-slate-900/40' 
                : 'border-amber-500 text-amber-700 bg-white'
              : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Size-Specific Keywords
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
            {counts.SIZE_SPECIFIC}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('DESIGN_LEVEL');
            setSelectedIds([]);
          }}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'DESIGN_LEVEL'
              ? isDark 
                ? 'border-purple-500 text-purple-400 bg-slate-900/40' 
                : 'border-purple-500 text-purple-700 bg-white'
              : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          Design-Level (Shared)
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
            {counts.DESIGN_LEVEL}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('GENERIC');
            setSelectedIds([]);
          }}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'GENERIC'
              ? isDark 
                ? 'border-orange-500 text-orange-400 bg-slate-900/40' 
                : 'border-orange-500 text-orange-700 bg-white'
              : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame className="w-3 h-3 text-orange-500" />
          Google Trends & Trending
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono">
            {counts.GENERIC}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('CHARACTER_SPECIFIC');
            setSelectedIds([]);
          }}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'CHARACTER_SPECIFIC'
              ? isDark 
                ? 'border-blue-500 text-blue-400 bg-slate-900/40' 
                : 'border-blue-500 text-blue-700 bg-white'
              : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Character / Franchise
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
            {counts.CHARACTER_SPECIFIC}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ALL');
            setSelectedIds([]);
          }}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'ALL'
              ? isDark 
                ? 'border-slate-400 text-slate-100 bg-slate-900/40' 
                : 'border-slate-800 text-slate-900 bg-white'
              : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Keywords
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {counts.ALL}
          </span>
        </button>
      </div>

      {/* Suggestion Disclosure Notice */}
      <div className={`px-5 py-2.5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-amber-50/40 border-amber-100'
      }`}>
        <div className={`flex items-center gap-2 italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            <strong>Amazon Ads Clean Guard:</strong> Natural shopper search queries generated. Zero SKU codes or internal tags.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGoogleTrends && (
            <button
              onClick={onOpenGoogleTrends}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                isDark 
                  ? 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20' 
                  : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50 shadow-2xs'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              Explore Google Trends
            </button>
          )}

          {counts.RISK > 0 && (
            <button
              onClick={() => setOnlyRiskWarnings(!onlyRiskWarnings)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                onlyRiskWarnings
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {counts.RISK} Cross-Size Ad Group Risks {onlyRiskWarnings ? '(Filtered)' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Bulk Actions Toolbar */}
      <div className={`p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        {/* Search & Quick Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword text, SKU, design..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-colors ${
                isDark 
                  ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white'
              }`}
            />
          </div>

          {/* Match type filter */}
          <div className="flex items-center gap-1">
            {(['ALL', 'EXACT', 'PHRASE', 'BROAD'] as const).map((mt) => (
              <button
                key={mt}
                onClick={() => setMatchTypeFilter(mt)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  matchTypeFilter === mt
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : isDark
                    ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mt}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className={`flex items-center gap-1 border-l pl-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                  statusFilter === st
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold'
                    : isDark
                    ? 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs font-semibold px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {selectedIds.length} selected
            </span>

            <button
              onClick={handleBulkApprove}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </button>

            <button
              onClick={handleBulkReject}
              className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>

            {/* Bulk Bid Adjustment Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkBidMenu(!showBulkBidMenu)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
                Adjust Bids
                <ChevronDown className="w-3 h-3" />
              </button>

              {showBulkBidMenu && (
                <div className={`absolute right-0 mt-1 w-56 rounded-2xl p-3 shadow-xl z-20 space-y-2.5 border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Bulk Bid Adjustments (₹ INR)
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAdjustBidPercent(10)}
                      className={`flex-1 py-1 text-xs font-medium rounded-lg border ${
                        isDark ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      +10%
                    </button>
                    <button
                      onClick={() => handleAdjustBidPercent(-10)}
                      className={`flex-1 py-1 text-xs font-medium rounded-lg border ${
                        isDark ? 'bg-slate-800 text-rose-400 border-slate-700' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      -10%
                    </button>
                  </div>

                  <div>
                    <label className={`text-[10px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Set Fixed Bid (₹ INR)
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.50"
                        value={bulkBidInput}
                        onChange={(e) => setBulkBidInput(e.target.value)}
                        className={`w-full px-2 py-1 rounded-lg text-xs font-mono border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <button
                        onClick={handleApplyFixedBid}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-2xs"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className={`font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b ${
            isDark 
              ? 'bg-slate-950 text-slate-400 border-slate-800' 
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <tr>
              <th className="px-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    filteredKeywords.length > 0 &&
                    selectedIds.length === filteredKeywords.length
                  }
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-amber-500 cursor-pointer"
                />
              </th>
              <th className="px-3 py-3">Shopper Keyword & Ad Group</th>
              <th className="px-3 py-3">Match</th>
              <th className="px-3 py-3">Bid (₹)</th>
              <th className="px-3 py-3">SKU & Design</th>
              <th className="px-3 py-3">Product & Audience</th>
              <th className="px-3 py-3">Size / Age Range</th>
              <th className="px-3 py-3">Source & Relevance</th>
              <th className="px-3 py-3 text-center">Approval Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDark ? 'divide-slate-800/80 bg-slate-900/40' : 'divide-slate-100 bg-white'
          }`}>
            {filteredKeywords.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                  No keywords match current filters.
                </td>
              </tr>
            ) : (
              filteredKeywords.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isSelected 
                        ? isDark ? 'bg-amber-500/10' : 'bg-amber-50/70'
                        : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    } ${item.hasAdGroupCrossSizeRisk ? 'border-l-4 border-l-rose-500' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded border-slate-300 text-amber-500 cursor-pointer"
                      />
                    </td>

                    {/* Keyword text & Ad Group info */}
                    <td className="px-3 py-3 min-w-[220px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.keywordText}
                        </span>
                        {item.category === 'GENERIC' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                            Trending
                          </span>
                        )}
                        {item.category === 'CHARACTER_SPECIFIC' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Character
                          </span>
                        )}
                        {item.keywordText.includes('marvel') && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Marvel
                          </span>
                        )}
                        {item.keywordText.includes('disney') && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Disney
                          </span>
                        )}
                        {item.keywordText.includes('summer') && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ☀️ Summer
                          </span>
                        )}
                        {item.keywordText.includes('winter') && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                            ❄️ Winter
                          </span>
                        )}
                        {item.isAlternateAgeWording && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                            isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                          } border`}>
                            Alt wording
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center gap-1 mt-1 text-[10px] font-mono truncate max-w-[260px] ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span>AdGroup: {item.adGroupName}</span>
                      </div>

                      {/* Cross-Advertising Conflict Warning */}
                      {item.hasAdGroupCrossSizeRisk && (
                        <div
                          className="mt-1 flex items-start gap-1 text-[10px] text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 px-2 py-1 rounded-lg"
                          title={item.conflictDetails}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>Cross-Size Ad Risk:</strong> Amazon may serve other sizes in this ad group!
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Match Type */}
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono ${
                          item.matchType === 'EXACT'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : item.matchType === 'PHRASE'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {item.matchType}
                      </span>
                    </td>

                    {/* Bid */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        <span className={`font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>₹</span>
                        <input
                          type="number"
                          step="0.50"
                          min="1.00"
                          value={item.bid}
                          onChange={(e) =>
                            onUpdateBid(item.id, parseFloat(e.target.value) || 1.0)
                          }
                          className={`w-16 px-1.5 py-0.5 text-xs rounded font-mono border ${
                            isDark 
                              ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-amber-500' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'
                          }`}
                        />
                      </div>
                    </td>

                    {/* SKU & Design */}
                    <td className="px-3 py-3 min-w-[170px]">
                      <div className={`font-mono font-medium truncate max-w-[200px] ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`} title={item.sku}>
                        {item.sku}
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                        Design: {item.designId}
                      </div>
                    </td>

                    {/* Product type & Audience */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {item.audience}
                      </div>
                      <div className={`text-[11px] capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.productType}
                      </div>
                    </td>

                    {/* Size / Age range */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        isDark 
                          ? 'bg-slate-800 text-emerald-300 border-slate-700' 
                          : 'bg-slate-50 text-emerald-700 border-slate-200'
                      }`}>
                        {item.sizeDisplay}
                      </span>
                    </td>

                    {/* Source & Relevance */}
                    <td className="px-3 py-3 min-w-[150px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`truncate max-w-[120px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`} title={item.source}>
                          {item.source}
                        </span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                          {item.relevanceScore}%
                        </span>
                      </div>
                      <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${item.relevanceScore}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {item.approvalStatus === 'APPROVED' ? (
                          <button
                            onClick={() => onUpdateApproval(item.id, 'PENDING')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                            title="Click to revert to Pending"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </button>
                        ) : item.approvalStatus === 'PENDING' ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => onUpdateApproval(item.id, 'APPROVED')}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-emerald-500/20 text-amber-700 dark:text-amber-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-amber-500/30 transition-colors"
                              title="Approve this keyword"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onUpdateApproval(item.id, 'REJECTED')}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                              title="Reject keyword"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onUpdateApproval(item.id, 'PENDING')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                            title="Re-open keyword"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Rejected
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info bar */}
      <div className={`p-3.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${
        isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-100'
      }`}>
        <div>
          Showing <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{filteredKeywords.length}</strong> of{' '}
          <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{keywords.length}</strong> keywords
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNegativesQueue}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Review Negative Keywords Suggestions ({pendingNegativesCount} Pending)
          </button>
        </div>
      </div>
    </div>
  );
};
