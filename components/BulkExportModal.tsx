import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Layers, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { KeywordItem, NegativeKeywordSuggestion, ProductSKU, StrategySettings } from '../types';
import { generateAmazonBulkCsv, generateReportingCsv, downloadBlob } from '../utils/amazonExport';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  keywords: KeywordItem[];
  negatives: NegativeKeywordSuggestion[];
  catalog: ProductSKU[];
  strategy: StrategySettings;
}

export const BulkExportModal: React.FC<BulkExportModalProps> = ({
  isOpen,
  onClose,
  keywords,
  negatives,
  catalog,
  strategy,
}) => {
  const [copiedBulk, setCopiedBulk] = useState(false);
  const [copiedReporting, setCopiedReporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'AMAZON_BULK' | 'REPORTING_CSV'>('AMAZON_BULK');

  if (!isOpen) return null;

  // Filter approved keywords and negatives
  const approvedKeywords = keywords.filter((k) => k.approvalStatus === 'APPROVED');
  const approvedNegatives = negatives.filter((n) => n.approvalStatus === 'APPROVED');

  const amazonBulkContent = generateAmazonBulkCsv(
    approvedKeywords,
    approvedNegatives,
    catalog,
    strategy
  );

  const reportingContent = generateReportingCsv(keywords);

  const handleDownloadBulk = () => {
    downloadBlob(
      amazonBulkContent,
      `amazon_sp_bulk_upload_${strategy.campaignPrefix}_${Date.now()}.csv`
    );
  };

  const handleDownloadReporting = () => {
    downloadBlob(
      reportingContent,
      `size_keyword_reporting_${Date.now()}.csv`
    );
  };

  const handleCopyBulk = () => {
    navigator.clipboard.writeText(amazonBulkContent);
    setCopiedBulk(true);
    setTimeout(() => setCopiedBulk(false), 2000);
  };

  const handleCopyReporting = () => {
    navigator.clipboard.writeText(reportingContent);
    setCopiedReporting(true);
    setTimeout(() => setCopiedReporting(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Amazon Sponsored Products Bulk Export
              </h2>
              <p className="text-xs text-slate-400">
                Ready for 1-click import into Amazon Advertising Campaign Manager Bulk Operations
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

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('AMAZON_BULK')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'AMAZON_BULK'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Amazon Sponsored Products Bulk File ({approvedKeywords.length} Keywords, {approvedNegatives.length} Negatives)
          </button>

          <button
            onClick={() => setActiveTab('REPORTING_CSV')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'REPORTING_CSV'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Keyword Reporting Breakdown Table ({keywords.length} Rows)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'AMAZON_BULK' ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Ad Group Topology:</span>
                  <span className="font-semibold text-emerald-400">
                    {strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
                      ? 'Single per Design (Shared)'
                      : 'Separate per Size SKU (Isolated)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Campaign Strategy:</span>
                  <span className="font-semibold text-amber-400 font-mono">
                    {strategy.campaignMode === 'BOTH'
                      ? 'AUTO + MANUAL DUAL'
                      : strategy.campaignMode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Approved Keywords:</span>
                  <span className="font-bold text-orange-400 font-mono">{approvedKeywords.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Approved Negatives:</span>
                  <span className="font-bold text-rose-400 font-mono">{approvedNegatives.length}</span>
                </div>
              </div>

              {/* Warnings if any pending keywords */}
              {keywords.length > approvedKeywords.length && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Note: {keywords.length - approvedKeywords.length} keywords are currently in <strong>Pending</strong> or <strong>Rejected</strong> status and will NOT be exported. Only Approved items are bundled.
                  </span>
                </div>
              )}

              {/* Code Preview */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-mono text-slate-400">Preview: bulk_upload.csv</span>
                  <button
                    onClick={handleCopyBulk}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                  >
                    {copiedBulk ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy CSV</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                  {amazonBulkContent.split('\r\n').slice(0, 30).join('\n')}
                  {amazonBulkContent.split('\r\n').length > 30 && '\n... [additional rows truncated for preview]'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Contains comprehensive columns requested in Section 7: SKU, Design/serial, Product type, Audience, Size/age range, Keyword text, Match type, Bid, Source, Relevance/confidence, Approval status, Ad Group, and Cross-Size warnings.
              </p>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-mono text-slate-400">Preview: keyword_reporting.csv</span>
                  <button
                    onClick={handleCopyReporting}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                  >
                    {copiedReporting ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy CSV</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                  {reportingContent.split('\r\n').slice(0, 30).join('\n')}
                  {reportingContent.split('\r\n').length > 30 && '\n... [additional rows truncated for preview]'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <span className="text-xs text-slate-400">
            Compliant with Amazon Advertising Bulk Operations 2.0 specs.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
            {activeTab === 'AMAZON_BULK' ? (
              <button
                onClick={handleDownloadBulk}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download Amazon Bulk File (.csv)
              </button>
            ) : (
              <button
                onClick={handleDownloadReporting}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download Full Reporting CSV (.csv)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
