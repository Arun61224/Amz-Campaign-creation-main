import { NegativeKeywordSuggestion, ProductSKU, StrategySettings } from '../types';

export interface SearchTermWasteRecord {
  query: string;
  adGroupName: string;
  sku: string;
  designId: string;
  clicks: number;
  spend: number;
  conversions: number;
  detectedWrongAge: string;
  targetSkuAge: string;
}

export const SAMPLE_SEARCH_TERM_WASTE: SearchTermWasteRecord[] = [
  {
    query: 'boys hoodie 5 to 6 years',
    adGroupName: 'AG_KUC-HOD-242_13 to 14 years',
    sku: 'KUC-HOD-242--13 to 14Years',
    designId: 'KUC-HOD-242',
    clicks: 19,
    spend: 18.25,
    conversions: 0,
    detectedWrongAge: '5–6 years',
    targetSkuAge: '13–14 years',
  },
  {
    query: 'toddler outfit 2t',
    adGroupName: 'AG_KUC-BSUT-101_0 to 3 months',
    sku: 'KUC-BSUT-101--0 to 3Months',
    designId: 'KUC-BSUT-101',
    clicks: 14,
    spend: 11.90,
    conversions: 0,
    detectedWrongAge: '2T toddler',
    targetSkuAge: '0–3 months',
  },
  {
    query: 'girls pant suit 11 12 years',
    adGroupName: 'AG_KUC-PSUT-291_5 to 6 years',
    sku: 'KUC-PSUT-291--5 to 6Years',
    designId: 'KUC-PSUT-291',
    clicks: 11,
    spend: 10.45,
    conversions: 0,
    detectedWrongAge: '11–12 years',
    targetSkuAge: '5–6 years',
  },
];

/**
 * Suggests conservative, evidence-based size negative keywords.
 * Strictly adheres to rule: Never auto-add negative keywords.
 * Requires human approval and bases suggestions only on Search Term Report waste data or explicit rules.
 */
export function generateSizeNegativeSuggestions(
  catalog: ProductSKU[],
  strategy: StrategySettings,
  searchLogs: SearchTermWasteRecord[] = SAMPLE_SEARCH_TERM_WASTE
): NegativeKeywordSuggestion[] {
  const suggestions: NegativeKeywordSuggestion[] = [];

  // 1. Suggestions from Search Term Report Evidence (Highest Confidence)
  searchLogs.forEach((log, index) => {
    // Check if the SKU is in catalog
    const matchedSku = catalog.find((c) => c.sku === log.sku);
    if (!matchedSku) return;

    // Suggest NEGATIVE_EXACT to prevent over-blocking
    suggestions.push({
      id: `neg-str-${index}-${log.sku.replace(/[^a-z0-9]/gi, '')}`,
      campaignName: `${strategy.campaignPrefix}_${log.designId}`,
      adGroupName:
        strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
          ? `AG_${log.designId}_AllSizes`
          : log.adGroupName,
      sku: log.sku,
      suggestedNegativeText: log.query.toLowerCase().trim(),
      matchType: 'NEGATIVE_EXACT',
      reason: `Search Term Report Evidence: Shoppers searched "${log.query}" on ${log.targetSkuAge} ad group generating ₹${(log.spend * 50).toFixed(0)} in spend with 0 conversions.`,
      triggerSearchTerm: log.query,
      estimatedWastedSpend: log.spend,
      impressionsBlockedWarning:
        strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
          ? 'CRITICAL WARNING: This ad group contains ALL sizes! Adding this negative keyword will also BLOCK ads for your actual 5-6Y variant. Consider isolating into separate ad groups first.'
          : 'Low risk: Scoped to isolated ad group as Negative Exact.',
      approvalStatus: 'PENDING', // NEVER automatically approved!
    });
  });

  return suggestions;
}
