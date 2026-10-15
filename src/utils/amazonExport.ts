import { 
  KeywordItem, 
  NegativeKeywordSuggestion, 
  ProductSKU, 
  StrategySettings,
  CampaignSummaryItem 
} from '../types';
import { deriveAdGroupNameFromSku } from './skuParser';

/**
 * Generates an Amazon Advertising Sponsored Products Bulk Template compatible CSV
 * Supports:
 * - MANUAL Campaigns (with Size-Specific & Design Keywords)
 * - AUTO Campaigns (with close-match, loose-match, substitutes, complements product targeting)
 * - BOTH Dual Strategy (Full Amazon PPC launch ready)
 */
export function generateAmazonBulkCsv(
  approvedKeywords: KeywordItem[],
  approvedNegatives: NegativeKeywordSuggestion[],
  catalog: ProductSKU[],
  strategy: StrategySettings
): string {
  // Keep this column order exactly aligned with Amazon's current
  // AdvertisingBulksheetTemplate seller workbook (Sponsored Products Campaigns).
  const headers = [
    'Product', 'Entity', 'Operation', 'Campaign ID', 'Ad Group ID', 'Portfolio ID',
    'Ad ID', 'Keyword ID', 'Product Targeting ID', 'Campaign Name', 'Ad Group Name',
    'Start Date', 'End Date', 'Targeting Type', 'State', 'Daily Budget', 'SKU',
    'Ad Group Default Bid', 'Bid', 'Keyword Text', 'Native Language Keyword',
    'Native Language Locale', 'Match Type', 'Bidding Strategy', 'Placement',
    'Percentage', 'Product Targeting Expression', 'Audience ID',
    'Shopper Cohort Percentage', 'Shopper Cohort Type', 'Sites', 'Off-Amazon ad serving',
  ];

  type Row = Record<string, string | number | undefined | null>;
  const rows: string[][] = [];
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const pushRow = (row: Row) => rows.push(headers.map((header) => {
    const value = row[header];
    return value === undefined || value === null ? '' : String(value);
  }));
  const money = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

  const designSkuMap = new Map<string, ProductSKU[]>();
  catalog.forEach((item) => {
    const list = designSkuMap.get(item.designId) || [];
    list.push(item);
    designSkuMap.set(item.designId, list);
  });

  const shouldCreateAuto = strategy.campaignMode === 'AUTO_ONLY' || strategy.campaignMode === 'BOTH';
  const shouldCreateManual = strategy.campaignMode === 'MANUAL_ONLY' || strategy.campaignMode === 'BOTH';

  // AUTO: one campaign per design, with one ad group containing all size SKUs.
  if (shouldCreateAuto) {
    designSkuMap.forEach((skus, designId) => {
      const campaignName = `${strategy.campaignPrefix}_AUTO_${designId}`;
      const adGroupName = deriveAdGroupNameFromSku(skus[0].sku);

      pushRow({
        Product: 'Sponsored Products', Entity: 'Campaign', Operation: 'Create',
        'Campaign Name': campaignName, 'Start Date': today, 'Targeting Type': 'auto',
        State: 'enabled', 'Daily Budget': money(strategy.dailyBudget),
        'Bidding Strategy': strategy.biddingStrategy,
      });
      pushRow({
        Product: 'Sponsored Products', Entity: 'Ad Group', Operation: 'Create',
        'Campaign Name': campaignName, 'Ad Group Name': adGroupName, State: 'enabled',
        'Ad Group Default Bid': money(skus[0].adGroupDefaultBid ?? strategy.adGroupDefaultBid),
      });

      skus.forEach((product) => pushRow({
        Product: 'Sponsored Products', Entity: 'Product Ad', Operation: 'Create',
        'Campaign Name': campaignName, 'Ad Group Name': adGroupName,
        State: 'enabled', SKU: product.sku,
      }));

      const autoTargets = [
        { expression: 'close-match', bid: strategy.autoBids.closeMatch },
        { expression: 'loose-match', bid: strategy.autoBids.looseMatch },
        { expression: 'substitutes', bid: strategy.autoBids.substitutes },
        { expression: 'complements', bid: strategy.autoBids.complements },
      ];
      autoTargets.forEach((target) => pushRow({
        Product: 'Sponsored Products', Entity: 'Product Targeting', Operation: 'Create',
        'Campaign Name': campaignName, 'Ad Group Name': adGroupName, State: 'enabled',
        Bid: money(target.bid), 'Product Targeting Expression': target.expression,
      }));
    });
  }

  // MANUAL: campaign/ad group names come from generated keywords. Create a
  // campaign scaffold even when no keywords have been approved yet.
  if (shouldCreateManual) {
    const campaignNames = new Set<string>();
    const adGroupPairs = new Map<string, { campaignName: string; adGroupName: string }>();

    catalog.forEach((product) => campaignNames.add(`${strategy.campaignPrefix}_${product.designId}`));
    approvedKeywords.forEach((keyword) => {
      campaignNames.add(keyword.campaignName);
      adGroupPairs.set(`${keyword.campaignName}:::${keyword.adGroupName}`, {
        campaignName: keyword.campaignName, adGroupName: keyword.adGroupName,
      });
    });

    // Ensure each catalog SKU's intended ad group exists even if there are no
    // approved keywords for that SKU yet.
    catalog.forEach((product) => {
      const campaignName = `${strategy.campaignPrefix}_${product.designId}`;
      const adGroupName = strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
        ? `${product.designId}--AllSizes`
        : deriveAdGroupNameFromSku(product.sku);
      adGroupPairs.set(`${campaignName}:::${adGroupName}`, { campaignName, adGroupName });
    });

    campaignNames.forEach((campaignName) => pushRow({
      Product: 'Sponsored Products', Entity: 'Campaign', Operation: 'Create',
      'Campaign Name': campaignName, 'Start Date': today, 'Targeting Type': 'manual',
      State: 'enabled', 'Daily Budget': money(strategy.dailyBudget),
      'Bidding Strategy': strategy.biddingStrategy,
    }));

    adGroupPairs.forEach(({ campaignName, adGroupName }) => {
      const matchingSku = catalog.find((product) => {
        const productAdGroup = strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
          ? `${product.designId}--AllSizes` : deriveAdGroupNameFromSku(product.sku);
        return productAdGroup === adGroupName && `${strategy.campaignPrefix}_${product.designId}` === campaignName;
      });
      pushRow({
        Product: 'Sponsored Products', Entity: 'Ad Group', Operation: 'Create',
        'Campaign Name': campaignName, 'Ad Group Name': adGroupName, State: 'enabled',
        'Ad Group Default Bid': money(matchingSku?.adGroupDefaultBid ?? strategy.adGroupDefaultBid),
      });
    });

    catalog.forEach((product) => {
      const campaignName = `${strategy.campaignPrefix}_${product.designId}`;
      const adGroupName = strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
        ? `${product.designId}--AllSizes` : deriveAdGroupNameFromSku(product.sku);
      pushRow({
        Product: 'Sponsored Products', Entity: 'Product Ad', Operation: 'Create',
        'Campaign Name': campaignName, 'Ad Group Name': adGroupName,
        State: 'enabled', SKU: product.sku,
      });
    });

    approvedKeywords.forEach((keyword) => pushRow({
      Product: 'Sponsored Products', Entity: 'Keyword', Operation: 'Create',
      'Campaign Name': keyword.campaignName, 'Ad Group Name': keyword.adGroupName,
      State: 'enabled', Bid: money(keyword.bid), 'Keyword Text': keyword.keywordText,
      'Match Type': keyword.matchType.toLowerCase(),
    }));

    approvedNegatives.forEach((negative) => pushRow({
      Product: 'Sponsored Products', Entity: 'Negative Keyword', Operation: 'Create',
      'Campaign Name': negative.campaignName, 'Ad Group Name': negative.adGroupName,
      State: 'enabled', 'Keyword Text': negative.suggestedNegativeText,
      'Match Type': negative.matchType === 'NEGATIVE_EXACT' ? 'negativeExact' : 'negativePhrase',
    }));
  }

  return [headers.map(escapeCsvValue).join(','), ...rows.map((row) => row.map(escapeCsvValue).join(','))].join('\r\n');
}

/**
 * Summary breakdown of all campaigns created for easy visual review
 */
export function generateCampaignSummaries(
  catalog: ProductSKU[],
  keywords: KeywordItem[],
  strategy: StrategySettings
): CampaignSummaryItem[] {
  const summaries: CampaignSummaryItem[] = [];
  const designSkuMap = new Map<string, ProductSKU[]>();
  catalog.forEach((item) => {
    const list = designSkuMap.get(item.designId) || [];
    list.push(item);
    designSkuMap.set(item.designId, list);
  });

  const shouldCreateAuto = strategy.campaignMode === 'AUTO_ONLY' || strategy.campaignMode === 'BOTH';
  const shouldCreateManual = strategy.campaignMode === 'MANUAL_ONLY' || strategy.campaignMode === 'BOTH';

  designSkuMap.forEach((skus, designId) => {
    if (shouldCreateAuto) {
      summaries.push({
        id: `camp-auto-${designId}`,
        campaignName: `${strategy.campaignPrefix}_AUTO_${designId}`,
        targetingType: 'AUTO',
        dailyBudget: skus[0].dailyBudget || strategy.dailyBudget,
        biddingStrategy: strategy.biddingStrategy,
        adGroupsCount: 1,
        skusCount: skus.length,
        keywordsOrTargetsCount: 4, // close-match, loose-match, substitutes, complements
        state: 'enabled',
      });
    }

    if (shouldCreateManual) {
      const designKeywords = keywords.filter((k) => k.designId === designId);
      const adGroups = new Set(designKeywords.map((k) => k.adGroupName));

      summaries.push({
        id: `camp-manual-${designId}`,
        campaignName: `${strategy.campaignPrefix}_${designId}`,
        targetingType: 'MANUAL',
        dailyBudget: strategy.dailyBudget,
        biddingStrategy: strategy.biddingStrategy,
        adGroupsCount: Math.max(1, adGroups.size),
        skusCount: skus.length,
        keywordsOrTargetsCount: designKeywords.length,
        state: 'enabled',
      });
    }
  });

  return summaries;
}

/**
 * Generates the user-requested Keyword Reporting CSV with all explicit fields:
 * SKU, Design/serial, Product type, Audience, Size/age range, Keyword text, Match type, Bid (₹), Source, Relevance/confidence, Approval status
 */
export function generateReportingCsv(keywords: KeywordItem[]): string {
  const headers = [
    'SKU',
    'Design / Serial',
    'Product Type',
    'Audience',
    'Size / Age Range',
    'Keyword Text',
    'Match Type',
    'Bid (₹ INR)',
    'Source',
    'Relevance / Confidence (%)',
    'Approval Status',
    'Ad Group Name',
    'Cross-Size Risk Warning',
  ];

  const rows = keywords.map((k) => [
    k.sku,
    k.designId,
    k.productType,
    k.audience,
    k.sizeDisplay,
    k.keywordText,
    k.matchType,
    `₹${k.bid.toFixed(2)}`,
    k.source,
    `${k.relevanceScore}%`,
    k.approvalStatus,
    k.adGroupName,
    k.hasAdGroupCrossSizeRisk ? 'YES - Cross-Size Variant Collision' : 'NO - Clean Isolation',
  ]);

  return [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\r\n');
}

function escapeCsvValue(val: string | undefined): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function downloadBlob(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  // Prepend \uFEFF UTF-8 BOM so Microsoft Excel and other spreadsheet viewers never corrupt characters (e.g. â€“)
  const prefix = mimeType.includes('csv') ? '\uFEFF' : '';
  const blob = new Blob([prefix + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
