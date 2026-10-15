import React, { useState, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  Search, 
  ExternalLink, 
  Plus, 
  Check, 
  Sparkles, 
  Flame, 
  IndianRupee, 
  BarChart3, 
  Layers, 
  Tag, 
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { 
  TrendingSearchKeyword, 
  queryTrendingKeywords, 
  openGoogleTrendsIndia 
} from '../utils/googleTrends';
import { KeywordItem, MatchType } from '../types';

interface GoogleTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKeywords: (keywords: Partial<KeywordItem>[]) => void;
  defaultCategory?: string;
  isDark?: boolean;
}

export const GoogleTrendsModal: React.FC<GoogleTrendsModalProps> = ({
  isOpen,
  onClose,
  onAddKeywords,
  defaultCategory = 'ALL',
  isDark = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Filtered trending results
  const results = useMemo(() => {
    return queryTrendingKeywords(searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'Baby Suit & Romper', label: 'Baby Suit & Romper (18-24m)' },
    { id: 'Hoodies & Sweatshirts', label: 'Hoodies & Sweatshirts' },
    { id: 'Pant Suit & Tracksuits', label: 'Pant Suit & Tracksuits' },
    { id: 'T-Shirts & Daily Wear', label: 'T-Shirts & Daily Wear' },
  ];

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((r) => r.id)));
    }
  };

  const handleAddSelected = () => {
    const toAdd = results.filter((r) => selectedIds.has(r.id) && !addedIds.has(r.id));
    if (toAdd.length === 0) return;

    const formatted: Partial<KeywordItem>[] = toAdd.map((item) => ({
      keywordText: item.keyword,
      canonicalKeywordText: item.keyword,
      matchType: item.recommendedMatchType,
      bid: item.recommendedBidINR,
      category: 'GENERIC',
      source: `Google Trends [${item.growthRate}]`,
      relevanceScore: item.relevanceScore,
      approvalStatus: 'APPROVED',
      hasAdGroupCrossSizeRisk: false,
    }));

    onAddKeywords(formatted);
    setAddedIds((prev) => new Set([...prev, ...toAdd.map((t) => t.id)]));
    setSelectedIds(new Set());
  };

  const handleAddSingle = (item: TrendingSearchKeyword) => {
    if (addedIds.has(item.id)) return;

    const formatted: Partial<KeywordItem>[] = [
      {
        keywordText: item.keyword,
        canonicalKeywordText: item.keyword,
        matchType: item.recommendedMatchType,
        bid: item.recommendedBidINR,
        category: 'GENERIC',
        source: `Google Trends [${item.growthRate}]`,
        relevanceScore: item.relevanceScore,
        approvalStatus: 'APPROVED',
        hasAdGroupCrossSizeRisk: false,
      },
    ];

    onAddKeywords(formatted);
    setAddedIds((prev) => new Set([...prev, item.id]));
  };

  const handleAddAllBreakouts = () => {
    const breakouts = results.filter((r) => r.isBreakout && !addedIds.has(r.id));
    if (breakouts.length === 0) return;

    const formatted: Partial<KeywordItem>[] = breakouts.map((item) => ({
      keywordText: item.keyword,
      canonicalKeywordText: item.keyword,
      matchType: item.recommendedMatchType,
      bid: item.recommendedBidINR,
      category: 'GENERIC',
      source: `Google Trends [Breakout Surge]`,
      relevanceScore: item.relevanceScore,
      approvalStatus: 'APPROVED',
      hasAdGroupCrossSizeRisk: false,
    }));

    onAddKeywords(formatted);
    setAddedIds((prev) => new Set([...prev, ...breakouts.map((b) => b.id)]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${
          isDark 
            ? 'bg-slate-900 border-slate-700 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
        } rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Google Trends & Trending Search Keywords
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  0% SKU Code Pollution • Real Shopper Terms Only
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Fetch breakout shopper queries, Google Trends India volume index, and 1-click import into Amazon Ads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className={`p-4 border-b space-y-3 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search trending terms (e.g., baby boy dress, rompers, hoodies, 18-24 months)..."
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border transition-colors outline-none ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-amber-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {searchTerm && (
                <button
                  onClick={() => openGoogleTrendsIndia(searchTerm)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-blue-400' 
                      : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
                  }`}
                  title="Open query directly on Google Trends India"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Explore on Google Trends (IN)
                </button>
              )}

              <button
                onClick={handleAddAllBreakouts}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xs transition-all whitespace-nowrap"
              >
                <Flame className="w-3.5 h-3.5" />
                Add All Breakouts
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className={`text-[11px] font-medium mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 mx-auto text-slate-400/60 mb-2" />
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                No trending keywords found for this search
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for "baby clothes", "romper", "hoodie", or "18-24 months"
              </p>
            </div>
          ) : (
            <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs">
                <thead className={`font-semibold border-b ${
                  isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === results.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                    </th>
                    <th className="py-2.5 px-3">Trending Shopper Query</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Google Interest Index</th>
                    <th className="py-2.5 px-3 text-center">Growth Velocity</th>
                    <th className="py-2.5 px-3">Est. Monthly Search</th>
                    <th className="py-2.5 px-3">Rec. Bid (₹)</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isAdded = addedIds.has(item.id);

                    return (
                      <tr 
                        key={item.id}
                        className={`transition-colors ${
                          isSelected 
                            ? isDark ? 'bg-amber-500/10' : 'bg-amber-50/70' 
                            : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAdded}
                            onChange={() => handleToggleSelect(item.id)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              "{item.keyword}"
                            </span>
                            {item.isBreakout && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
                                <Flame className="w-2.5 h-2.5" /> Breakout
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.seasonality}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-amber-500 h-1.5 rounded-full" 
                                style={{ width: `${item.relativeInterest}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {item.relativeInterest}/100
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.isBreakout 
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {item.growthRate}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                          {item.monthlySearchesEstimate}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{item.recommendedBidINR.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openGoogleTrendsIndia(item.keyword)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-blue-400' : 'hover:bg-slate-200 text-slate-500 hover:text-blue-600'
                              }`}
                              title="View official Google Trends India data"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            <button
                              disabled={isAdded}
                              onClick={() => handleAddSingle(item)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                isAdded
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3 h-3" /> Added
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" /> Add
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/90'
        } rounded-b-2xl`}>
          <div className="flex items-center gap-2 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Selected for Import:</span>
            <strong className="font-mono text-amber-500">{selectedIds.size} terms</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className={`px-4 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Done
            </button>

            <button
              disabled={selectedIds.size === 0}
              onClick={handleAddSelected}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedIds.size > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add {selectedIds.size} Selected to Campaign Keywords
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
