export type MatchType = 'EXACT' | 'PHRASE' | 'BROAD';

export type KeywordCategory = 
  | 'SIZE_SPECIFIC'
  | 'DESIGN_LEVEL'
  | 'CHARACTER_SPECIFIC'
  | 'GENERIC';

export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export type AdGroupArchitecture = 'SINGLE_PER_DESIGN' | 'SEPARATE_PER_SIZE';

export type CampaignMode = 'MANUAL_ONLY' | 'AUTO_ONLY' | 'BOTH';

export interface SkuParsedSize {
  rawSuffix: string;
  normalizedDisplay: string; // e.g. "13–14 years"
  canonicalForm: string; // e.g. "13 to 14 years"
  alternateForms: string[]; // e.g. ["13-14 years", "13 14 years", "13 to 14 yrs", "13-14Y"]
  minAge: number;
  maxAge: number;
  unit: 'years' | 'months' | 'standard';
  isInfant: boolean;
}

export type SeasonType = 'All Season' | 'Summer' | 'Winter';

export const STANDARD_PRODUCT_TYPES = [
  'T-shirts Set',
  'Shorts Set',
  'Cargo Pants',
  'Trackpants',
  'Pajamas',
  'Hoddies',
  'Sweaters',
  'T-Shirts and Pyjamas Set',
  'T-Shirts and Trackpants Set',
  'T-Shirts and Shorts Set',
  'Bloomer',
  'Rompers',
  'Jackets',
  'Velvet clothing Set',
  'Velvet T-Shirts and Pyjamas Set',
  'Velve ZIP HODDIE AND PYJAMAS set',
  'Velvel HODDE AND PYJAMAS',
] as const;

export type StandardProductType = (typeof STANDARD_PRODUCT_TYPES)[number];

export interface ProductSKU {
  id: string;
  sku: string;
  designId: string; // e.g. "KUC-HOD-242"
  brand: string; // e.g. "KUCHIPOO"
  productType: string; // e.g. "T-Shirts and Pyjamas Set", "Hoddies", "Cargo Pants"
  productSynonyms: string[]; // e.g. ["night suit", "pyjama set"]
  audience: 'Boys' | 'Girls' | 'Unisex Baby' | 'Kids' | 'Toddler' | 'Men' | 'Women';
  season?: SeasonType | string; // 'All Season' | 'Summer' | 'Winter'
  franchise?: 'None' | 'Disney' | 'Marvel' | 'Disney & Marvel' | string;
  character?: string; // e.g. "Spider-Man", "Iron Man", "Mickey Mouse"
  characterFranchise?: string; // e.g. "Marvel", "Disney", or undefined
  parsedSize: SkuParsedSize;
  currentAsin?: string;
  targetProductGroup?: string; // e.g. "Winter Wear"
  basePrice?: number; // In INR (₹)
  dailyBudget?: number; // In INR (₹)
  adGroupDefaultBid?: number; // Optional per-SKU Ad Group Default Bid override in INR (₹)
  campaignPreference?: 'AUTO' | 'MANUAL' | 'BOTH';
}

export interface KeywordItem {
  id: string;
  sku: string;
  designId: string;
  productType: string;
  audience: string;
  sizeDisplay: string;
  keywordText: string;
  canonicalKeywordText: string;
  matchType: MatchType;
  bid: number; // In INR (₹)
  category: KeywordCategory;
  source: string;
  relevanceScore: number; // 0 to 100
  approvalStatus: ApprovalStatus;
  adGroupName: string;
  campaignName: string;
  hasAdGroupCrossSizeRisk: boolean;
  conflictDetails?: string;
  isAlternateAgeWording?: boolean;
}

export interface AutoTargetItem {
  id: string;
  sku: string;
  designId: string;
  campaignName: string;
  adGroupName: string;
  targetType: 'close-match' | 'loose-match' | 'substitutes' | 'complements';
  bid: number; // In INR (₹)
  state: 'enabled' | 'paused';
}

export interface CampaignSummaryItem {
  id: string;
  campaignName: string;
  targetingType: 'AUTO' | 'MANUAL';
  dailyBudget: number; // In INR (₹)
  biddingStrategy: 'Dynamic bids - down only' | 'Dynamic bids - up and down' | 'Fixed bids';
  adGroupsCount: number;
  skusCount: number;
  keywordsOrTargetsCount: number;
  state: 'enabled';
}

export interface NegativeKeywordSuggestion {
  id: string;
  campaignName: string;
  adGroupName: string;
  sku: string;
  suggestedNegativeText: string;
  matchType: 'NEGATIVE_EXACT' | 'NEGATIVE_PHRASE';
  reason: string;
  triggerSearchTerm?: string;
  estimatedWastedSpend?: number; // In INR (₹)
  impressionsBlockedWarning?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface SkuParserSettings {
  delimiter: string; // e.g. "--"
  useFallbackDelimiters: boolean;
  fallbackDelimiters: string[]; // e.g. ["_", "-"]
  caseSensitive: boolean;
  customRegex?: string;
}

export interface StrategySettings {
  // Currency Settings: Default INR (₹)
  currency: 'INR' | 'USD';
  currencySymbol: string; // '₹' or '$'

  // Campaign Mode: Auto, Manual, or Both Dual Strategy
  campaignMode: CampaignMode;
  dailyBudget: number; // In INR (₹), default ₹500.00
  adGroupDefaultBid: number; // Shared Ad Group Default Bid for Auto and Manual groups (INR ₹)
  biddingStrategy: 'Dynamic bids - down only' | 'Dynamic bids - up and down' | 'Fixed bids';
  
  // Auto Campaign Default Bids (INR ₹)
  autoBids: {
    closeMatch: number;
    looseMatch: number;
    substitutes: number;
    complements: number;
  };

  // Size-specific controls
  generateSizeKeywords: boolean;
  includeExactAgeRange: boolean;
  includeAlternateAgeWording: boolean;
  includeMonthBasedTerms: boolean;
  
  // Match types
  enabledMatchTypes: {
    BROAD: boolean;
    PHRASE: boolean;
    EXACT: boolean;
  };
  
  // Manual Bidding in INR (₹)
  defaultBids: {
    BROAD: number;
    PHRASE: number;
    EXACT: number;
  };

  // Thresholds & limits
  maxSizeKeywordsPerSku: number;
  minRelevanceScore: number;
  requireManualApproval: boolean;
  
  // Scope
  targetScope: 'ALL_SKUS' | 'SELECTED_GROUPS';
  selectedGroups: string[];

  // Ad Group Architecture
  adGroupArchitecture: AdGroupArchitecture;
  campaignPrefix: string;
  
  // Sharing options
  shareDesignLevelKeywordsAcrossSizes: boolean;
}

export interface DeduplicationGroup {
  canonicalKeyword: string;
  category: KeywordCategory;
  variants: {
    keywordText: string;
    itemIds: string[];
    isAlternate: boolean;
    ageExpression: string;
  }[];
}
