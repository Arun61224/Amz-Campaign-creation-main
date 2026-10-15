import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  IndianRupee, 
  Plus, 
  Check 
} from 'lucide-react';
import { NegativeKeywordSuggestion, StrategySettings } from '../types';

interface NegativesQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: NegativeKeywordSuggestion[];
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onBulkUpdateStatus: (ids: string[], status: 'APPROVED' | 'REJECTED') => void;
  onAddManualNegative: (neg: NegativeKeywordSuggestion) => void;
  strategy: StrategySettings;
}

export const NegativesQueueModal: React.FC<NegativesQueueModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  onUpdateStatus,
  onBulkUpdateStatus,
  onAddManualNegative,
  strategy,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newAdGroup, setNewAdGroup] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newMatchType, setNewMatchType] = useState<'NEGATIVE_EXACT' | 'NEGATIVE_PHRASE'>('NEGATIVE_EXACT');

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === suggestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(suggestions.map((s) => s.id));
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newReason.trim()) return;

    onAddManualNegative({
      id: `manual-neg-${Date.now()}`,
      campaignName: `${strategy.campaignPrefix}_CUSTOM`,
      adGroupName: newAdGroup.trim() || 'AG_Target_AdGroup',
      sku: 'MANUAL_RULE',
      suggestedNegativeText: newKeyword.toLowerCase().trim(),
      matchType: newMatchType,
      reason: `User Explicit Rule: ${newReason.trim()}`,
      approvalStatus: 'PENDING',
      impressionsBlockedWarning:
        newMatchType === 'NEGATIVE_PHRASE'
          ? 'CAUTION: Phrase negative may block broad related searches.'
          : undefined,
    });

    setNewKeyword('');
    setNewAdGroup('');
    setNewReason('');
  };

  const approvedCount = suggestions.filter((s) => s.approvalStatus === 'APPROVED').length;
  const pendingCount = suggestions.filter((s) => s.approvalStatus === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Size-Based Negative Keywords Approval Queue
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-full">
                  Zero Auto-Add Policy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ground suggestions in Search Term Reports. Human approval strictly required before export.
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

        {/* Protection policy callout */}
        <div className="px-6 py-3 bg-rose-950/20 border-b border-rose-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs text-rose-200/90 leading-relaxed">
            <p className="font-semibold text-rose-300">
              Why Amazon PPC Never Auto-Adds Other Age Ranges as Negatives:
            </p>
            <p>
              Different sizes are relevant to the same design. Adding broad or phrase negative keywords like "5 years" can block high-converting shopper discovery. Negatives are suggested <strong>only</strong> when verified search term traffic exhibits zero-conversion spend, and must be approved manually.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Bulk Action Bar */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === suggestions.length}
                  onChange={selectAll}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/40 bg-slate-900"
                />
                <span>Select All ({selectedIds.length} selected)</span>
              </label>

              <span className="text-xs text-slate-500">|</span>

              <span className="text-xs text-slate-400">
                Approved for Export: <strong className="text-emerald-400">{approvedCount}</strong> • Pending Review: <strong className="text-amber-400">{pendingCount}</strong>
              </span>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBulkUpdateStatus(selectedIds, 'APPROVED')}
                  className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Selected
                </button>
                <button
                  onClick={() => onBulkUpdateStatus(selectedIds, 'REJECTED')}
                  className="px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Selected
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 w-10"></th>
                  <th className="px-3 py-2.5">Suggested Negative Term</th>
                  <th className="px-3 py-2.5">Match Type</th>
                  <th className="px-3 py-2.5">Target Ad Group & SKU</th>
                  <th className="px-3 py-2.5">Search Term Evidence & Spend</th>
                  <th className="px-3 py-2.5">Collision / Over-Block Risk</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-sans">
                {suggestions.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.approvalStatus === 'APPROVED' ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-700 text-rose-500 bg-slate-900"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-mono font-bold text-white text-xs">
                          "{item.suggestedNegativeText}"
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                          {item.matchType}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-mono text-slate-300 text-[11px] truncate max-w-[160px]">
                          {item.adGroupName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                          {item.sku}
                        </div>
                      </td>

                      <td className="px-3 py-3 max-w-[220px]">
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {item.reason}
                        </p>
                        {item.estimatedWastedSpend && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            ₹{(item.estimatedWastedSpend * 50).toFixed(0)} Wasted Spend
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 max-w-[180px]">
                        {item.impressionsBlockedWarning ? (
                          <div className="flex items-start gap-1.5 text-[11px] text-amber-300 bg-amber-950/30 p-1.5 rounded border border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="text-[10px]">{item.impressionsBlockedWarning}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Safe isolation</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {item.approvalStatus === 'APPROVED' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {item.approvalStatus === 'PENDING' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending Approval
                          </span>
                        )}
                        {item.approvalStatus === 'REJECTED' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onUpdateStatus(item.id, 'APPROVED')}
                            className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Approve Negative Keyword"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateStatus(item.id, 'REJECTED')}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                            title="Reject Negative Keyword"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Manual Negative Rule */}
          <form
            onSubmit={handleAddManual}
            className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              Add Explicit User Negative Rule (Requires Reason)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Negative Keyword Term
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g. boys hoodie 5 to 6 years"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Ad Group</label>
                <input
                  type="text"
                  value={newAdGroup}
                  onChange={(e) => setNewAdGroup(e.target.value)}
                  placeholder="AG_KUC-HOD-242_13 to 14 years"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Match Type</label>
                <select
                  value={newMatchType}
                  onChange={(e) => setNewMatchType(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                >
                  <option value="NEGATIVE_EXACT">Negative Exact (Safest)</option>
                  <option value="NEGATIVE_PHRASE">Negative Phrase (High Risk)</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
                >
                  Queue for Review
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Evidence / Rationale (Mandatory)
              </label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Explain why this search query is confirmed irrelevant to this specific ad group..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200"
                required
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <span className="text-xs text-slate-400">
            Only <strong>Approved</strong> negative keywords will be included in the Amazon bulk upload file.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
