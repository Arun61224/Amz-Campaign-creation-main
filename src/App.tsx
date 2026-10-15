import React, { useState, useMemo, useCallback } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  StrategyControls 
} from './components/StrategyControls';
import { 
  AdGroupWarningBanner 
} from './components/AdGroupWarningBanner';
import { 
  CampaignsSummaryView 
} from './components/CampaignsSummaryView';
import { 
  KeywordTable 
} from './components/KeywordTable';
import { 
  SkuParserModal 
} from './components/SkuParserModal';
import { 
  SkuUploadModal 
} from './components/SkuUploadModal';
import { 
  DeduplicationInspector 
} from './components/DeduplicationInspector';
import { 
  NegativesQueueModal 
} from './components/NegativesQueueModal';
import { 
  BulkExportModal 
} from './components/BulkExportModal';
import { 
  GoogleTrendsModal 
} from './components/GoogleTrendsModal';

import { INITIAL_CATALOG, DEMO_CATALOG } from './data/sampleCatalog';
import { 
  ProductSKU, 
  StrategySettings, 
  SkuParserSettings, 
  KeywordItem, 
  NegativeKeywordSuggestion, 
  ApprovalStatus,
  AdGroupArchitecture
} from './types';
import { 
  generateKeywordsForCatalog, 
  DEFAULT_STRATEGY, 
  analyzeDeduplication 
} from './utils/keywordEngine';
import { 
  defaultParserSettings 
} from './utils/skuParser';
import { 
  generateSizeNegativeSuggestions 
} from './utils/negativeEngine';
import { 
  generateCampaignSummaries 
} from './utils/amazonExport';
import { 
  Trash2, 
  Plus,
  TrendingUp,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  // Theme state: default to 'light' (clean, modern eCommerce SaaS - no "top-secret data" feel)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // 1. Core State (Empty by default: user's SKUs will populate dashboard)
  const [catalog, setCatalog] = useState<ProductSKU[]>(INITIAL_CATALOG);
  const [strategy, setStrategy] = useState<StrategySettings>(DEFAULT_STRATEGY);
  const [parserSettings, setParserSettings] = useState<SkuParserSettings>(defaultParserSettings);
  
  // Modals state
  const [isParserModalOpen, setIsParserModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeduplicationModalOpen, setIsDeduplicationModalOpen] = useState(false);
  const [isNegativesModalOpen, setIsNegativesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGoogleTrendsOpen, setIsGoogleTrendsOpen] = useState(false);

  const handleSaveParserSettings = (newSettings: SkuParserSettings) => {
    setParserSettings(newSettings);
  };

  const handleImportSkus = useCallback((imported: ProductSKU[], mode: 'REPLACE' | 'APPEND') => {
    if (mode === 'REPLACE') {
      setCatalog(imported);
    } else {
      setCatalog((prev) => {
        const existingSkus = new Set(prev.map((p) => p.sku));
        const newOnes = imported.filter((item) => !existingSkus.has(item.sku));
        return [...prev, ...newOnes];
      });
    }
  }, []);

  const [resetToast, setResetToast] = useState(false);

  const handleRefreshAndClear = () => {
    setCatalog([]);
    setWorkingKeywords([]);
    setNegatives([]);
    setGenerationKey((prev) => prev + 1);
    setResetToast(true);
    setTimeout(() => setResetToast(false), 3500);
  };

  const handleClearCatalog = () => {
    handleRefreshAndClear();
  };

  const handleLoadDemo = () => {
    setCatalog(DEMO_CATALOG);
  };

  // 2. Keyword Generation State
  const [generationKey, setGenerationKey] = useState(0);

  // Generated keywords (memoized on catalog, strategy, or manual refresh)
  const initialGenerated = useMemo(() => {
    return generateKeywordsForCatalog(catalog, strategy);
  }, [catalog, strategy, generationKey]);

  // Working keywords list (allows inline approvals, bid edits, and consolidation deletions)
  const [workingKeywords, setWorkingKeywords] = useState<KeywordItem[]>(initialGenerated.keywords);

  // Synchronize when catalog or generation changes
  React.useEffect(() => {
    setWorkingKeywords(initialGenerated.keywords);
  }, [initialGenerated]);

  // 3. Campaign Summaries State (Auto & Manual campaigns)
  const campaignSummaries = useMemo(() => {
    return generateCampaignSummaries(catalog, workingKeywords, strategy);
  }, [catalog, workingKeywords, strategy]);

  // 4. Size Negative Suggestions State
  const [negatives, setNegatives] = useState<NegativeKeywordSuggestion[]>([]);

  // Update negatives when catalog or ad group architecture changes
  React.useEffect(() => {
    if (catalog.length > 0) {
      setNegatives(generateSizeNegativeSuggestions(catalog, strategy));
    } else {
      setNegatives([]);
    }
  }, [catalog, strategy.adGroupArchitecture, strategy.campaignPrefix]);

  // Available Product Groups for Scope filtering
  const availableProductGroups = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.targetProductGroup) set.add(item.targetProductGroup);
    });
    return Array.from(set);
  }, [catalog]);

  // Deduplication Groups Analysis
  const deduplicationGroups = useMemo(() => {
    return analyzeDeduplication(workingKeywords);
  }, [workingKeywords]);

  // Metric counts
  const sizeKeywordsCount = useMemo(() => {
    return workingKeywords.filter((k) => k.category === 'SIZE_SPECIFIC').length;
  }, [workingKeywords]);

  const designKeywordsCount = useMemo(() => {
    return workingKeywords.filter((k) => k.category === 'DESIGN_LEVEL').length;
  }, [workingKeywords]);

  const crossSizeWarningCount = useMemo(() => {
    return workingKeywords.filter((k) => k.hasAdGroupCrossSizeRisk).length;
  }, [workingKeywords]);

  const pendingApprovalsCount = useMemo(() => {
    return negatives.filter((n) => n.approvalStatus === 'PENDING').length;
  }, [negatives]);

  // Keyword Table Inline Actions
  const handleUpdateApproval = (id: string, status: ApprovalStatus) => {
    setWorkingKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, approvalStatus: status } : k))
    );
  };

  const handleBulkUpdateApproval = (ids: string[], status: ApprovalStatus) => {
    const idSet = new Set(ids);
    setWorkingKeywords((prev) =>
      prev.map((k) => (idSet.has(k.id) ? { ...k, approvalStatus: status } : k))
    );
  };

  const handleUpdateBid = (id: string, newBid: number) => {
    setWorkingKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, bid: Number(newBid.toFixed(2)) } : k))
    );
  };

  const handleBulkAdjustBids = (
    ids: string[],
    action: { type: 'PERCENT' | 'FIXED'; value: number }
  ) => {
    const idSet = new Set(ids);
    setWorkingKeywords((prev) =>
      prev.map((k) => {
        if (!idSet.has(k.id)) return k;
        let updatedBid = k.bid;
        if (action.type === 'FIXED') {
          updatedBid = action.value;
        } else {
          updatedBid = k.bid * (1 + action.value / 100);
        }
        return {
          ...k,
          bid: Math.max(1.0, Number(updatedBid.toFixed(2))),
        };
      })
    );
  };

  const handleRemoveKeywordIds = (idsToRemove: string[]) => {
    const removeSet = new Set(idsToRemove);
    setWorkingKeywords((prev) => prev.filter((k) => !removeSet.has(k.id)));
  };

  // Add keywords from Google Trends
  const handleAddGoogleTrendsKeywords = (items: Partial<KeywordItem>[]) => {
    const sampleProduct = catalog[0];
    const defaultCampName = sampleProduct 
      ? `${strategy.campaignPrefix}_${sampleProduct.designId}` 
      : `${strategy.campaignPrefix}_TRENDS`;
    const defaultAgName = sampleProduct 
      ? `${sampleProduct.designId}--TrendingTerms` 
      : `AG_TrendingTerms`;

    const newKeywords: KeywordItem[] = items.map((it, idx) => ({
      id: `kw-trend-${Date.now()}-${idx}`,
      sku: sampleProduct ? sampleProduct.sku : 'TRENDING_TARGET',
      designId: sampleProduct ? sampleProduct.designId : 'TRENDS',
      productType: sampleProduct ? sampleProduct.productType : 'Apparel',
      audience: sampleProduct ? sampleProduct.audience : 'Kids',
      sizeDisplay: sampleProduct ? sampleProduct.parsedSize.normalizedDisplay : 'All Sizes',
      keywordText: it.keywordText || '',
      canonicalKeywordText: it.canonicalKeywordText || it.keywordText || '',
      matchType: it.matchType || 'PHRASE',
      bid: it.bid || 15.0,
      category: 'GENERIC',
      source: it.source || 'Google Trends India',
      relevanceScore: it.relevanceScore || 96,
      approvalStatus: 'APPROVED',
      adGroupName: defaultAgName,
      campaignName: defaultCampName,
      hasAdGroupCrossSizeRisk: false,
    }));

    setWorkingKeywords((prev) => [...prev, ...newKeywords]);
  };

  // Negative Queue Actions
  const handleUpdateNegativeStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setNegatives((prev) =>
      prev.map((n) => (n.id === id ? { ...n, approvalStatus: status } : n))
    );
  };

  const handleBulkUpdateNegativeStatus = (ids: string[], status: 'APPROVED' | 'REJECTED') => {
    const idSet = new Set(ids);
    setNegatives((prev) =>
      prev.map((n) => (idSet.has(n.id) ? { ...n, approvalStatus: status } : n))
    );
  };

  const handleAddManualNegative = (item: Omit<NegativeKeywordSuggestion, 'id' | 'approvalStatus'>) => {
    const newItem: NegativeKeywordSuggestion = {
      ...item,
      id: `neg-manual-${Date.now()}`,
      approvalStatus: 'APPROVED',
    };
    setNegatives((prev) => [newItem, ...prev]);
  };

  const handleAddSku = (item: ProductSKU) => {
    setCatalog((prev) => [...prev, item]);
  };

  const handleDeleteSku = (id: string) => {
    setCatalog((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSwitchArchitecture = (arch: AdGroupArchitecture) => {
    setStrategy((prev) => ({
      ...prev,
      adGroupArchitecture: arch,
    }));
  };

  const handleSwitchCampaignMode = (mode: 'BOTH' | 'AUTO_ONLY' | 'MANUAL_ONLY') => {
    setStrategy((prev) => ({
      ...prev,
      campaignMode: mode,
    }));
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark 
        ? 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950' 
        : 'bg-slate-100/70 text-slate-800 selection:bg-amber-400 selection:text-slate-950'
    }`}>
      {/* 1. Header */}
      <Header
        totalSkus={catalog.length}
        totalKeywords={workingKeywords.length}
        sizeKeywordsCount={sizeKeywordsCount}
        designKeywordsCount={designKeywordsCount}
        crossSizeWarningCount={crossSizeWarningCount}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenParserConfig={() => setIsParserModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenNegativesQueue={() => setIsNegativesModalOpen(true)}
        onOpenDeduplication={() => setIsDeduplicationModalOpen(true)}
        onOpenGoogleTrends={() => setIsGoogleTrendsOpen(true)}
        onRegenerate={handleRefreshAndClear}
        strategy={strategy}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Catalog Control Bar (If SKUs are loaded) */}
        {catalog.length > 0 && (
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 rounded-2xl mb-5 text-xs border shadow-2xs transition-colors gap-2.5 ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-300' 
              : 'bg-white border-slate-200/90 text-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Catalog:</span>
              <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {catalog.length} SKUs Loaded
              </strong>
              <span className="text-slate-400">•</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Currency: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">INR (₹)</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsGoogleTrendsOpen(true)}
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline transition-colors flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Fetch Trends
              </button>
              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>|</span>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add More SKUs
              </button>
              <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>|</span>
              <button
                onClick={handleClearCatalog}
                className={`text-xs font-medium hover:text-rose-500 transition-colors flex items-center gap-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
                title="Clear current catalog to start fresh"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Section A: Generated Amazon Campaigns View (Auto & Manual) */}
        <CampaignsSummaryView
          summaries={campaignSummaries}
          strategy={strategy}
          catalog={catalog}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onSwitchMode={handleSwitchCampaignMode}
          onLoadDemo={handleLoadDemo}
          isDark={isDark}
        />

        {catalog.length > 0 && (
          <>
            {/* Section B: Ad Group Collision Alert Banner */}
            <AdGroupWarningBanner
              architecture={strategy.adGroupArchitecture}
              collisionCount={crossSizeWarningCount}
              onSwitchArchitecture={handleSwitchArchitecture}
              isDark={isDark}
            />

            {/* Section C: Size Keyword Strategy Dashboard Controls */}
            <StrategyControls
              settings={strategy}
              onChange={setStrategy}
              availableProductGroups={availableProductGroups}
              isDark={isDark}
            />

            {/* Section D: Reporting & Keyword Management Matrix */}
            <KeywordTable
              keywords={workingKeywords}
              onUpdateApproval={handleUpdateApproval}
              onBulkUpdateApproval={handleBulkUpdateApproval}
              onUpdateBid={handleUpdateBid}
              onBulkAdjustBids={handleBulkAdjustBids}
              onOpenNegativesQueue={() => setIsNegativesModalOpen(true)}
              pendingNegativesCount={pendingApprovalsCount}
              onOpenGoogleTrends={() => setIsGoogleTrendsOpen(true)}
              isDark={isDark}
            />
          </>
        )}

        {/* If empty, show optional load demo helper */}
        {catalog.length === 0 && (
          <div className="text-center text-xs text-slate-500 mt-4">
            Want to test with sample inventory data?{' '}
            <button
              onClick={handleLoadDemo}
              className="text-amber-600 dark:text-amber-400 hover:underline font-semibold ml-1"
            >
              Load Demo SKUs
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors ${
        isDark 
          ? 'border-slate-900 bg-slate-950/80 text-slate-500' 
          : 'border-slate-200 bg-white text-slate-500'
      }`}>
        Amazon Sponsored Products • Auto & Manual Campaign Operations Studio • Currency: INR (₹)
      </footer>

      {/* 3. Modals */}
      <GoogleTrendsModal
        isOpen={isGoogleTrendsOpen}
        onClose={() => setIsGoogleTrendsOpen(false)}
        onAddKeywords={handleAddGoogleTrendsKeywords}
        isDark={isDark}
      />

      <SkuParserModal
        isOpen={isParserModalOpen}
        onClose={() => setIsParserModalOpen(false)}
        parserSettings={parserSettings}
        onSaveParserSettings={handleSaveParserSettings}
        catalog={catalog}
        onAddSku={handleAddSku}
        onDeleteSku={handleDeleteSku}
        onOpenUploadModal={() => {
          setIsParserModalOpen(false);
          setIsUploadModalOpen(true);
        }}
      />

      <SkuUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportSkus={handleImportSkus}
        parserSettings={parserSettings}
      />

      <DeduplicationInspector
        isOpen={isDeduplicationModalOpen}
        onClose={() => setIsDeduplicationModalOpen(false)}
        groups={deduplicationGroups}
        allKeywords={workingKeywords}
        onRemoveKeywordIds={handleRemoveKeywordIds}
      />

      <NegativesQueueModal
        isOpen={isNegativesModalOpen}
        onClose={() => setIsNegativesModalOpen(false)}
        suggestions={negatives}
        onUpdateStatus={handleUpdateNegativeStatus}
        onBulkUpdateStatus={handleBulkUpdateNegativeStatus}
        onAddManualNegative={handleAddManualNegative}
        strategy={strategy}
      />

      <BulkExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        keywords={workingKeywords}
        negatives={negatives}
        catalog={catalog}
        strategy={strategy}
      />

      {/* Inputs & Dashboard Reset Notification */}
      {resetToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Dashboard & all inputs have been refreshed and cleared!</span>
        </div>
      )}
    </div>
  );
}
