import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  Layers, 
  Info, 
  Check, 
  Sparkles, 
  GitMerge, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { DeduplicationGroup, KeywordItem } from '../types';

interface DeduplicationInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  groups: DeduplicationGroup[];
  allKeywords: KeywordItem[];
  onRemoveKeywordIds: (ids: string[]) => void;
}

export const DeduplicationInspector: React.FC<DeduplicationInspectorProps> = ({
  isOpen,
  onClose,
  groups,
  allKeywords,
  onRemoveKeywordIds,
}) => {
  const [selectedCanonical, setSelectedCanonical] = useState<string | null>(
    groups.length > 0 ? groups[0].canonicalKeyword : null
  );

  if (!isOpen) return null;

  const currentGroup = groups.find((g) => g.canonicalKeyword === selectedCanonical) || groups[0];

  const handleMergeAllAlternates = () => {
    // Collect all alternate variant item IDs across groups and remove them
    const idsToRemove: string[] = [];
    groups.forEach((g) => {
      g.variants.forEach((v) => {
        if (v.isAlternate) {
          idsToRemove.push(...v.itemIds);
        }
      });
    });
    onRemoveKeywordIds(idsToRemove);
  };

  const handleMergeSingleGroup = (group: DeduplicationGroup) => {
    const idsToRemove: string[] = [];
    group.variants.forEach((v) => {
      if (v.isAlternate) {
        idsToRemove.push(...v.itemIds);
      }
    });
    onRemoveKeywordIds(idsToRemove);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Keyword Deduplication & Age Expression Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Normalize variations ("13 to 14 years", "13-14 years", "13–14Y", "13 14 years")
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search volume warning notice */}
        <div className="px-6 py-3 bg-amber-950/30 border-b border-amber-500/20 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <strong>Amazon Search Volume Protocol:</strong> Do not assume these alternate phrases have identical search volume. Amazon shoppers search natural phrasing differently (e.g. "13-14 years" vs "13 14 years"). We retain alternate wording for discovery while enabling consolidation to prevent redundant bidding.
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Canonical Groups List */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 p-3 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Canonical Clusters ({groups.length})
              </span>
            </div>

            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {groups.map((grp) => {
                const isSelected = grp.canonicalKeyword === selectedCanonical;
                const totalVariants = grp.variants.length;
                return (
                  <button
                    key={grp.canonicalKeyword}
                    onClick={() => setSelectedCanonical(grp.canonicalKeyword)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-200'
                        : 'bg-slate-900 hover:bg-slate-800/80 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold truncate">{grp.canonicalKeyword}</div>
                      <span className="text-[10px] text-slate-400">
                        {grp.category.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 shrink-0 font-mono">
                      {totalVariants} forms
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Variants Inspector */}
          <div className="md:col-span-2 border border-slate-800 rounded-xl bg-slate-950/60 p-4 flex flex-col h-[400px]">
            {currentGroup ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                      Canonical Keyword Root
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono">
                      "{currentGroup.canonicalKeyword}"
                    </h3>
                  </div>

                  <button
                    onClick={() => handleMergeSingleGroup(currentGroup)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    Consolidate Group to Canonical
                  </button>
                </div>

                <div className="text-xs text-slate-400 mb-2">
                  Observed expression variants mapped to this root:
                </div>

                <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                  {currentGroup.variants.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-slate-200">
                            "{v.keywordText}"
                          </span>
                          {v.isAlternate ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Alternate Wording
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              Canonical Standard
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Appears in {v.itemIds.length} keyword instances • Size Variant: {v.ageExpression}
                        </p>
                      </div>

                      {v.isAlternate && (
                        <button
                          onClick={() => onRemoveKeywordIds(v.itemIds)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium"
                        >
                          Remove Variant
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Select a cluster to inspect variants.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <span className="text-xs text-slate-400">
            Deduplication guarantees clean bids without cannibalizing search impressions.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMergeAllAlternates}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
              Consolidate All to Canonical
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
