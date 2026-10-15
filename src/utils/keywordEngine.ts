import {
  ProductSKU,
  KeywordItem,
  StrategySettings,
  MatchType,
  DeduplicationGroup,
  STANDARD_PRODUCT_TYPES,
} from '../types';
import { normalizeAgeExpression, deriveAdGroupNameFromSku } from './skuParser';

export const DEFAULT_STRATEGY: StrategySettings = {
  currency: 'INR',
  currencySymbol: '₹',
  campaignMode: 'BOTH',
  dailyBudget: 500.0,
  adGroupDefaultBid: 5.0,
  biddingStrategy: 'Dynamic bids - down only',
  autoBids: {
    closeMatch: 16.0,
    looseMatch: 12.0,
    substitutes: 14.0,
    complements: 10.0,
  },
  adGroupArchitecture: 'SEPARATE_PER_SIZE',
  campaignPrefix: 'SP_KUCHIPOO',
  defaultBids: {
    EXACT: 18.0,
    PHRASE: 15.0,
    BROAD: 12.0,
  },
  enabledMatchTypes: {
    EXACT: true,
    PHRASE: true,
    BROAD: true,
  },
  generateSizeKeywords: true,
  includeExactAgeRange: true,
  includeAlternateAgeWording: true,
  includeMonthBasedTerms: true,
  shareDesignLevelKeywordsAcrossSizes: true,
  requireManualApproval: false,
  minRelevanceScore: 65,
  maxSizeKeywordsPerSku: 45,
  targetScope: 'ALL_SKUS',
  selectedGroups: [],
};

/**
 * STRICT FILTER: Checks if a generated keyword string contains raw internal SKU patterns
 * e.g., "DKUC-bust-168", "DKUC-BSUT-168", "KUC-HOD-242", "DKUC", "bust-168", etc.
 * Amazon shoppers never search for internal SKU codes!
 */
export function isSkuPollutedKeyword(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  
  // 1. Matches prefix patterns like "dkuc-", "kuc-", "d-", "dkuc"
  if (/\b(dkuc|kuc)[-_]?[a-z0-9]*/i.test(lower)) {
    return true;
  }

  // 2. Matches hyphenated internal code patterns like "bust-168", "bsut-168", "hod-242", "psut-291", "tpset-501"
  if (/\b(bsut|bust|hod|psut|tpset|crg|swtr|romp|blm|vlvt|jkt)[-_]\d+\b/i.test(lower)) {
    return true;
  }

  // 3. Standalone code followed by numbers (e.g. "bsut 168", "bust 168")
  if (/\b(bsut|bust|tpset)[-_ ]+\d+\b/i.test(lower)) {
    return true;
  }

  return false;
}

/**
 * Sanitizes brand name to prevent SKU strings from acting as brand
 */
export function sanitizeBrandName(brand: string): string {
  if (!brand) return 'KUCHIPOO';
  const clean = brand.replace(/^D[A-Z]{2,5}[-_]/i, '').replace(/[-_]\d+/g, '').trim();
  if (!clean || isSkuPollutedKeyword(clean)) {
    return 'KUCHIPOO';
  }
  return clean;
}

/**
 * Sanitizes and normalizes product type to ensure it is always a natural shopper category
 * Accurately supports the user's 14 exact product categories:
 * - T-shirts Set
 * - Shorts Set
 * - Cargo Pants
 * - Trackpants
 * - Pajamas
 * - Hoddies
 * - Sweaters
 * - T-Shirts and Pyjamas Set
 * - T-Shirts and Trackpants Set
 * - T-Shirts and Shorts Set
 * - Bloomer
 * - Rompers
 * - Jackets
 * - Velvet clothing Set
 */
export function sanitizeProductType(rawType: string, sku: string = ''): string {
  const lower = (rawType || '').toLowerCase().trim();
  const skuLower = (sku || '').toLowerCase().trim();

  // Check against STANDARD_PRODUCT_TYPES exact match case-insensitively first
  const exactStandard = STANDARD_PRODUCT_TYPES.find((pt) => pt.toLowerCase() === lower);
  if (exactStandard) return exactStandard;

  // Specific Velvet subcategories
  if ((lower.includes('velve') || skuLower.includes('vlvt')) && lower.includes('zip') && (lower.includes('hod') || lower.includes('hoodie'))) {
    return 'Velve ZIP HODDIE AND PYJAMAS set';
  }
  if ((lower.includes('velve') || skuLower.includes('vlvt')) && (lower.includes('hod') || lower.includes('hoodie')) && (lower.includes('pyjama') || lower.includes('pajama'))) {
    return 'Velvel HODDE AND PYJAMAS';
  }
  if ((lower.includes('velve') || skuLower.includes('vlvt')) && (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('tee')) && (lower.includes('pyjama') || lower.includes('pajama'))) {
    return 'Velvet T-Shirts and Pyjamas Set';
  }
  if (lower.includes('velvet') || skuLower.includes('vlvt') || skuLower.includes('velour')) {
    return 'Velvet clothing Set';
  }

  // T-Shirts and Pyjamas Set
  if (
    (lower.includes('pyjama') || lower.includes('pajama') || lower.includes('night suit') || skuLower.includes('tpset')) &&
    (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('tee') || skuLower.includes('tpset'))
  ) {
    return 'T-Shirts and Pyjamas Set';
  }

  // T-Shirts and Trackpants Set
  if (
    (lower.includes('track') || lower.includes('trackpant') || lower.includes('pant')) &&
    (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('tee'))
  ) {
    return 'T-Shirts and Trackpants Set';
  }

  // T-Shirts and Shorts Set
  if (
    lower.includes('shorts set') ||
    lower.includes('t-shirts and shorts') ||
    (lower.includes('short') && (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('tee')))
  ) {
    return 'T-Shirts and Shorts Set';
  }

  // Standalone Shorts Set
  if (lower.includes('shorts set') || skuLower.includes('sset') || (lower.includes('short') && lower.includes('set'))) {
    return 'Shorts Set';
  }

  // T-shirts Set
  if (lower.includes('t-shirts set') || lower.includes('tshirts set') || lower.includes('t-shirt set') || lower.includes('tshirt pack')) {
    return 'T-shirts Set';
  }

  // Cargo Pants
  if (lower.includes('cargo') || skuLower.includes('crg')) {
    return 'Cargo Pants';
  }

  // Trackpants
  if (lower.includes('trackpant') || lower.includes('track pant') || lower.includes('jogger') || skuLower.includes('trk') || skuLower.includes('psut')) {
    return 'Trackpants';
  }

  // Pajamas
  if (lower.includes('pajama') || lower.includes('pyjama') || lower.includes('night suit') || skuLower.includes('pjm')) {
    return 'Pajamas';
  }

  // Hoddies (Hoodies)
  if (lower.includes('hod') || lower.includes('hoodie') || lower.includes('hoddie') || skuLower.includes('hod')) {
    return 'Hoddies';
  }

  // Sweaters
  if (lower.includes('sweater') || lower.includes('cardigan') || skuLower.includes('swtr')) {
    return 'Sweaters';
  }

  // Bloomer
  if (lower.includes('bloomer') || skuLower.includes('blm')) {
    return 'Bloomer';
  }

  // Rompers
  if (lower.includes('romper') || lower.includes('baby suit') || skuLower.includes('bsut') || skuLower.includes('bust') || skuLower.includes('romp')) {
    return 'Rompers';
  }

  // Jackets
  if (lower.includes('jacket') || skuLower.includes('jkt')) {
    return 'Jackets';
  }

  // Clean fallback
  const stripped = lower.replace(/\b[a-z]{2,5}[-_]\d+\b/gi, '').replace(/[-_]\d+/g, '').trim();
  if (!stripped || stripped === 'apparel' || isSkuPollutedKeyword(stripped)) {
    return skuLower.includes('baby') || skuLower.includes('infant') ? 'Rompers' : 'T-Shirts and Pyjamas Set';
  }
  return stripped;
}

/**
 * Returns clean franchise status: 'Disney', 'Marvel', 'Disney & Marvel', or 'None'
 */
export function getProductFranchise(product: ProductSKU): 'Disney' | 'Marvel' | 'Disney & Marvel' | 'None' {
  const f = (product.franchise || product.characterFranchise || '').trim().toLowerCase();
  const b = (product.brand || '').trim().toLowerCase();
  const s = (product.sku || '').trim().toLowerCase();

  const isMarvel = f.includes('marvel') || b.includes('marvel') || s.includes('marvel');
  const isDisney = f.includes('disney') || b.includes('disney') || s.includes('disney');

  if (isMarvel && isDisney) return 'Disney & Marvel';
  if (isMarvel) return 'Marvel';
  if (isDisney) return 'Disney';
  return 'None';
}

/**
 * Expands character name into popular Amazon search variations (e.g. Spider-Man -> spiderman, spider-man)
 */
export function getCharacterAliases(character?: string): string[] {
  if (!character || character === 'None' || character.toLowerCase() === 'none') {
    return [];
  }

  const clean = character.trim();
  const lower = clean.toLowerCase();
  const aliases = new Set<string>();

  if (lower.includes('spider') || lower.includes('spiderman')) {
    aliases.add('spiderman');
    aliases.add('spider-man');
    aliases.add('spider man');
  } else if (lower.includes('iron') || lower.includes('ironman')) {
    aliases.add('iron man');
    aliases.add('ironman');
  } else if (lower.includes('captain')) {
    aliases.add('captain america');
  } else if (lower.includes('hulk')) {
    aliases.add('hulk');
    aliases.add('incredible hulk');
  } else if (lower.includes('avenger')) {
    aliases.add('avengers');
  } else if (lower.includes('thor')) {
    aliases.add('thor');
  } else if (lower.includes('black panther')) {
    aliases.add('black panther');
  } else if (lower.includes('mickey')) {
    aliases.add('mickey mouse');
    aliases.add('mickey');
  } else if (lower.includes('minnie')) {
    aliases.add('minnie mouse');
  } else if (lower.includes('donald')) {
    aliases.add('donald duck');
  } else if (lower.includes('frozen') || lower.includes('elsa')) {
    aliases.add('frozen');
    aliases.add('elsa');
    aliases.add('frozen elsa');
  } else if (lower.includes('simba') || lower.includes('lion king')) {
    aliases.add('lion king');
    aliases.add('simba');
  } else if (lower.includes('princess')) {
    aliases.add('disney princess');
  } else if (lower.includes('cars') || lower.includes('mcqueen')) {
    aliases.add('lightning mcqueen');
    aliases.add('disney cars');
  } else if (lower.includes('pooh')) {
    aliases.add('winnie the pooh');
  } else {
    aliases.add(lower);
  }

  return Array.from(aliases);
}

/**
 * Get comprehensive product synonyms tailored for each of the 14 product categories
 */
export function getShopperSynonymsForType(type: string): string[] {
  const t = type.toLowerCase();

  // 1a. Velvet ZIP HODDIE AND PYJAMAS set
  if ((t.includes('velve') || t.includes('velour')) && t.includes('zip') && (t.includes('hod') || t.includes('hoodie'))) {
    return [
      'velvet zip hoodie and pyjamas set',
      'velvet zip hoodie set',
      'velvet zipper hoodie with pyjama',
      'velvet hoodie and pyjama set',
      'velvet tracksuit',
      'velvet winter night suit',
      'zipper hoodie and track pants set',
      'warm velvet winter set',
      'hooded velvet co-ord set',
      'velvet jacket and pyjama set',
    ];
  }

  // 1b. Velvet HODDE AND PYJAMAS
  if ((t.includes('velve') || t.includes('velour')) && (t.includes('hod') || t.includes('hoodie')) && (t.includes('pyjama') || t.includes('pajama'))) {
    return [
      'velvet hoodie and pyjamas set',
      'velvet hoodie and pyjama',
      'velvet hoodie set',
      'velvet pullover hoodie and pyjama',
      'velvet winter night suit',
      'velvet tracksuit',
      'warm velvet sleepwear set',
      'velvet co-ord set',
      'hooded velvet pyjama set',
    ];
  }

  // 1c. Velvet T-Shirts and Pyjamas Set
  if ((t.includes('velve') || t.includes('velour')) && (t.includes('t-shirt') || t.includes('tshirt') || t.includes('tee')) && (t.includes('pyjama') || t.includes('pajama'))) {
    return [
      'velvet t-shirt and pyjamas set',
      'velvet tshirt and pyjama set',
      'velvet night suit',
      'velvet pyjama set',
      'velvet sleepwear set',
      'velvet loungewear set',
      'velvet winter night dress',
      'warm velvet pj set',
      'velvet clothing set',
    ];
  }

  // 1d. Velvet clothing Set (General)
  if (t.includes('velvet') || t.includes('velour')) {
    return [
      'velvet clothing set',
      'velvet dress',
      'velvet co-ord set',
      'velour set',
      'velvet winter set',
      'party wear velvet dress',
      'velvet tracksuit',
    ];
  }

  // 2. T-Shirts and Pyjamas Set
  if (t.includes('pyjama') && (t.includes('t-shirt') || t.includes('tshirt') || t.includes('set'))) {
    return [
      't-shirt and pyjama set',
      'tshirt and pajama set',
      'night suit',
      'pyjama set',
      'sleepwear',
      'loungewear set',
      'pj set',
      'cotton pyjama set',
      'clothing set',
    ];
  }

  // 3. T-Shirts and Trackpants Set
  if (t.includes('trackpant') && (t.includes('t-shirt') || t.includes('tshirt') || t.includes('set'))) {
    return [
      't-shirt and track pants set',
      'tshirt and trackpants set',
      'tracksuit',
      'co-ord set',
      'activewear set',
      't-shirt and pant set',
      'cotton track set',
    ];
  }

  // 4. T-Shirts and Shorts Set
  if (t.includes('shorts') && (t.includes('t-shirt') || t.includes('tshirt') || t.includes('set'))) {
    return [
      't-shirt and shorts set',
      'tshirt and shorts set',
      'tee and shorts set',
      'summer set',
      'half pant and t-shirt set',
      'cotton shorts set',
    ];
  }

  // 5. Shorts Set
  if (t === 'shorts set' || (t.includes('shorts') && t.includes('set'))) {
    return [
      'shorts set',
      'summer shorts set',
      'cotton shorts set',
      'half pant set',
      'shorts and top set',
    ];
  }

  // 6. T-shirts Set
  if (t.includes('t-shirts set') || t.includes('t-shirt') || t.includes('tshirt')) {
    return [
      't-shirt set',
      'tshirt pack',
      'tee set',
      'cotton t-shirts set',
      'half sleeve t-shirt pack',
      'printed t-shirts set',
    ];
  }

  // 7. Cargo Pants
  if (t.includes('cargo')) {
    return [
      'cargo pants',
      'cargo trousers',
      'cargo joggers',
      'kids cargo pants',
      'cotton cargo pants',
      'combat trousers',
    ];
  }

  // 8. Trackpants
  if (t.includes('trackpant') || t.includes('track pant')) {
    return [
      'track pants',
      'joggers',
      'sweatpants',
      'cotton trackpants',
      'running pants',
      'lower',
    ];
  }

  // 9. Pajamas
  if (t.includes('pajama') || t.includes('pyjama')) {
    return [
      'pyjamas',
      'pajama pants',
      'sleep pants',
      'night pyjamas',
      'cotton pajamas',
      'lounge pants',
    ];
  }

  // 10. Hoddies (Hoodies)
  if (t.includes('hoddie') || t.includes('hoodie')) {
    return [
      'hoodie',
      'sweatshirt',
      'pullover',
      'hooded sweatshirt',
      'winter hoodie',
      'fleece hoodie',
    ];
  }

  // 11. Sweaters
  if (t.includes('sweater')) {
    return [
      'sweater',
      'cardigan',
      'pullover sweater',
      'woolen sweater',
      'winter knitwear',
      'warm sweater',
    ];
  }

  // 12. Bloomer
  if (t.includes('bloomer')) {
    return [
      'bloomer',
      'bloomers for baby',
      'baby bloomers',
      'nappy cover bloomers',
      'cotton baby bloomers',
      'infant bloomers',
    ];
  }

  // 13. Rompers
  if (t.includes('romper')) {
    return [
      'romper',
      'baby romper',
      'sleepsuit',
      'baby jumpsuit',
      'onesie',
      'cotton romper',
      'baby clothes',
    ];
  }

  // 14. Jackets
  if (t.includes('jacket')) {
    return [
      'jacket',
      'winter jacket',
      'bomber jacket',
      'padded jacket',
      'hooded jacket',
      'windcheater',
      'warm coat',
    ];
  }

  return ['clothing set', 'cotton outfit', 'wear'];
}

/**
 * Returns normalized Season string: 'Summer' | 'Winter' | 'All Season'
 */
export function getProductSeason(season?: string): 'Summer' | 'Winter' | 'All Season' {
  if (!season) return 'All Season';
  const lower = season.toLowerCase().trim();
  if (lower.includes('summer')) return 'Summer';
  if (lower.includes('winter')) return 'Winter';
  return 'All Season';
}

/**
 * Generate complete keyword set according to strategy, catalog, 14 Product Types, and Season
 */
export function generateKeywordsForCatalog(
  catalog: ProductSKU[],
  strategy: StrategySettings
): {
  keywords: KeywordItem[];
  duplicatesCount: number;
  crossSizeWarningCount: number;
} {
  const allKeywords: KeywordItem[] = [];
  let kwSeqId = 1;

  // Group catalog by designId to detect multi-size ad group collisions
  const designSkuMap = new Map<string, ProductSKU[]>();
  catalog.forEach((item) => {
    const list = designSkuMap.get(item.designId) || [];
    list.push(item);
    designSkuMap.set(item.designId, list);
  });

  // Track canonical texts for deduplication
  const seenKeywordKeys = new Set<string>();
  let duplicatesCount = 0;
  let crossSizeWarningCount = 0;

  catalog.forEach((product) => {
    // Check if included in scope
    if (
      strategy.targetScope === 'SELECTED_GROUPS' &&
      strategy.selectedGroups.length > 0 &&
      product.targetProductGroup &&
      !strategy.selectedGroups.includes(product.targetProductGroup)
    ) {
      return;
    }

    const designSkus = designSkuMap.get(product.designId) || [product];
    const uniqueSizesInDesign = Array.from(
      new Set(designSkus.map((s) => s.parsedSize.normalizedDisplay))
    );
    const hasMultipleSizesInDesign = uniqueSizesInDesign.length > 1;

    // Determine Campaign & Ad Group naming
    const campaignName = `${strategy.campaignPrefix}_${product.designId}`;
    const cleanAdGroupName = deriveAdGroupNameFromSku(product.sku);
    const adGroupName =
      strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
        ? `${product.designId}--AllSizes`
        : cleanAdGroupName;

    // Cross-size risk flag
    const hasAdGroupCrossSizeRisk =
      strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN' && hasMultipleSizesInDesign;

    const skuKeywords: KeywordItem[] = [];

    const audienceLower = product.audience.toLowerCase();
    const typeLower = sanitizeProductType(product.productType, product.sku).toLowerCase();
    const brandLower = sanitizeBrandName(product.brand).toLowerCase();
    const franchise = getProductFranchise(product);
    const season = getProductSeason(product.season);
    const charAliases = getCharacterAliases(product.character);

    // Dynamic shopper synonyms for this product type
    const dynamicSynonyms = getShopperSynonymsForType(typeLower);
    const combinedSynonyms = Array.from(new Set([...(product.productSynonyms || []), ...dynamicSynonyms]))
      .map((s) => sanitizeProductType(s, product.sku).toLowerCase())
      .filter((s) => !isSkuPollutedKeyword(s));

    // Core product noun variations
    const rawProductTypes = [typeLower, ...combinedSynonyms];
    const productTypes = Array.from(new Set(rawProductTypes)).filter((t) => !isSkuPollutedKeyword(t));

    // ==========================================
    // 1. SIZE-SPECIFIC KEYWORDS (STRICTLY FOR THIS SIZE)
    // ==========================================
    if (strategy.generateSizeKeywords) {
      const sizeVariantsToUse: { text: string; isAlt: boolean }[] = [];

      if (strategy.includeExactAgeRange) {
        sizeVariantsToUse.push({
          text: product.parsedSize.canonicalForm,
          isAlt: false,
        });
      }

      if (strategy.includeAlternateAgeWording) {
        product.parsedSize.alternateForms.forEach((alt) => {
          if (!strategy.includeMonthBasedTerms && product.parsedSize.isInfant) {
            return;
          }
          sizeVariantsToUse.push({ text: alt, isAlt: true });
        });
      }

      // Generate combinations
      sizeVariantsToUse.forEach(({ text: ageText, isAlt }) => {
        productTypes.forEach((pType, pIndex) => {
          // Standard Shopper Combinations
          const kw1 = `${audienceLower} ${pType} ${ageText}`.trim();
          const kw2 = `${pType} for ${audienceLower} ${ageText}`.trim();
          const kw3 = `${brandLower} ${audienceLower} ${pType} ${ageText}`.trim();
          const kw4 = `kids ${pType} ${ageText}`.trim();

          const candidates: { text: string; score: number; source: string }[] = [
            { text: kw1, score: pIndex === 0 ? 98 : 88, source: 'Size Engine [Audience + Product + Age]' },
            { text: kw2, score: pIndex === 0 ? 94 : 85, source: 'Size Engine [Preposition + Age]' },
            { text: kw3, score: pIndex === 0 ? 96 : 89, source: 'Size Engine [Brand + Audience + Age]' },
            { text: kw4, score: pIndex === 0 ? 89 : 80, source: 'Size Engine [Kids Synonym + Age]' },
          ];

          // SEASON-SPECIFIC SIZE TERMS
          if (season === 'Summer') {
            candidates.push(
              {
                text: `${audienceLower} summer ${pType} ${ageText}`,
                score: 96,
                source: 'Size Engine [Summer + Size]',
              },
              {
                text: `cotton summer ${pType} ${ageText}`,
                score: 94,
                source: 'Size Engine [Summer Cotton + Size]',
              },
              {
                text: `summer wear for ${audienceLower} ${ageText}`,
                score: 93,
                source: 'Size Engine [Summer Wear + Age]',
              }
            );
          } else if (season === 'Winter') {
            candidates.push(
              {
                text: `${audienceLower} winter ${pType} ${ageText}`,
                score: 97,
                source: 'Size Engine [Winter + Size]',
              },
              {
                text: `warm ${pType} for ${audienceLower} ${ageText}`,
                score: 95,
                source: 'Size Engine [Warm Winter + Size]',
              },
              {
                text: `winter wear for ${audienceLower} ${ageText}`,
                score: 94,
                source: 'Size Engine [Winter Wear + Age]',
              }
            );
          }

          // For infant products, add specific infant wording
          if (product.parsedSize.isInfant && strategy.includeMonthBasedTerms) {
            candidates.push(
              {
                text: `newborn baby clothes ${ageText}`,
                score: 93,
                source: 'Size Engine [Infant Specialized]',
              },
              {
                text: `baby outfit ${ageText}`,
                score: 91,
                source: 'Size Engine [Infant Specialized]',
              }
            );
          }

          // FRANCHISE KEYWORDS: If Marvel is selected
          if (franchise === 'Marvel' || franchise === 'Disney & Marvel') {
            candidates.push(
              {
                text: `marvel ${audienceLower} ${pType} ${ageText}`,
                score: 97,
                source: 'Size Engine [Marvel Collaboration + Age]',
              },
              {
                text: `kuchipoo marvel ${pType} ${ageText}`,
                score: 95,
                source: 'Size Engine [Kuchipoo x Marvel]',
              },
              {
                text: `marvel kids ${pType} ${ageText}`,
                score: 93,
                source: 'Size Engine [Marvel Kids + Age]',
              }
            );
          }

          // FRANCHISE KEYWORDS: If Disney is selected
          if (franchise === 'Disney' || franchise === 'Disney & Marvel') {
            candidates.push(
              {
                text: `disney ${audienceLower} ${pType} ${ageText}`,
                score: 97,
                source: 'Size Engine [Disney Collaboration + Age]',
              },
              {
                text: `kuchipoo disney ${pType} ${ageText}`,
                score: 95,
                source: 'Size Engine [Kuchipoo x Disney]',
              },
              {
                text: `disney kids ${pType} ${ageText}`,
                score: 93,
                source: 'Size Engine [Disney Kids + Age]',
              }
            );
          }

          // CHARACTER KEYWORDS: If specific character is selected
          if (charAliases.length > 0 && pIndex <= 2) {
            charAliases.slice(0, 2).forEach((charName) => {
              candidates.push(
                {
                  text: `${charName} ${audienceLower} ${pType} ${ageText}`,
                  score: 99,
                  source: `Size Engine [Character: ${charName} + Size]`,
                },
                {
                  text: `${charName} ${pType} ${ageText}`,
                  score: 98,
                  source: `Size Engine [Character: ${charName} + Age]`,
                }
              );
              if (season === 'Winter') {
                candidates.push({
                  text: `${charName} winter wear ${ageText}`,
                  score: 96,
                  source: `Size Engine [Character Winter + Age]`,
                });
              } else if (season === 'Summer') {
                candidates.push({
                  text: `${charName} summer clothes ${ageText}`,
                  score: 96,
                  source: `Size Engine [Character Summer + Age]`,
                });
              }
            });
          }

          candidates.forEach((cand) => {
            // STRICT FILTER: Discard SKU patterns like DKUC-bust-168
            if (isSkuPollutedKeyword(cand.text)) {
              return;
            }

            const cleaned = cand.text.toLowerCase().replace(/\s+/g, ' ').trim();
            const canonicalClean = normalizeAgeExpression(cleaned);

            const finalScore = isAlt ? Math.max(cand.score - 4, 60) : cand.score;
            if (finalScore < strategy.minRelevanceScore) return;

            // Generate enabled match types
            const matchTypes: MatchType[] = [];
            if (strategy.enabledMatchTypes.EXACT) matchTypes.push('EXACT');
            if (strategy.enabledMatchTypes.PHRASE) matchTypes.push('PHRASE');
            if (strategy.enabledMatchTypes.BROAD) matchTypes.push('BROAD');

            matchTypes.forEach((matchType) => {
              const dedupeKey = `${product.sku}::${matchType}::${canonicalClean}`;
              if (seenKeywordKeys.has(dedupeKey)) {
                duplicatesCount++;
                return;
              }

              seenKeywordKeys.add(dedupeKey);

              const kwItem: KeywordItem = {
                id: `kw-${product.id}-${kwSeqId++}-${matchType}`,
                sku: product.sku,
                designId: product.designId,
                productType: typeLower,
                audience: product.audience,
                sizeDisplay: product.parsedSize.normalizedDisplay,
                keywordText: cleaned,
                canonicalKeywordText: canonicalClean,
                matchType,
                bid: strategy.defaultBids[matchType],
                category: 'SIZE_SPECIFIC',
                source: cand.source,
                relevanceScore: finalScore,
                approvalStatus: strategy.requireManualApproval ? 'PENDING' : 'APPROVED',
                adGroupName,
                campaignName,
                hasAdGroupCrossSizeRisk,
                conflictDetails: hasAdGroupCrossSizeRisk
                  ? `Single Ad Group contains multiple sizes (${uniqueSizesInDesign.join(', ')}). This ${product.parsedSize.normalizedDisplay} keyword can display ads for other sizes!`
                  : undefined,
                isAlternateAgeWording: isAlt,
              };

              skuKeywords.push(kwItem);
            });
          });
        });
      });

      // Cap per-SKU keyword volume
      const sortedSkuKeywords = skuKeywords
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, strategy.maxSizeKeywordsPerSku);

      allKeywords.push(...sortedSkuKeywords);
    }
  });

  // ==========================================
  // 2. DESIGN-LEVEL / PRODUCT-LEVEL KEYWORDS
  // ==========================================
  if (strategy.shareDesignLevelKeywordsAcrossSizes) {
    designSkuMap.forEach((skus, designId) => {
      const sample = skus[0];
      const audienceLower = sample.audience.toLowerCase();
      const typeLower = sanitizeProductType(sample.productType, sample.sku).toLowerCase();
      const brandLower = sanitizeBrandName(sample.brand).toLowerCase();
      const franchise = getProductFranchise(sample);
      const season = getProductSeason(sample.season);

      const campaignName = `${strategy.campaignPrefix}_${designId}`;

      const designTemplates: { text: string; score: number; source: string }[] = [
        { text: `${brandLower} ${audienceLower} ${typeLower}`, score: 95, source: 'Design Engine [Brand + Core]' },
        { text: `${audienceLower} ${typeLower}`, score: 92, source: 'Design Engine [Audience + Type]' },
        { text: `kids ${typeLower}`, score: 87, source: 'Design Engine [Generic Kids]' },
        { text: `${brandLower} ${typeLower}`, score: 90, source: 'Design Engine [Brand Direct]' },
        { text: `comfortable ${audienceLower} ${typeLower}`, score: 82, source: 'Design Engine [Feature Modifier]' },
      ];

      // Seasonal Design-Level Keywords
      if (season === 'Summer') {
        designTemplates.push(
          { text: `summer wear for ${audienceLower}`, score: 96, source: 'Seasonal [Summer Wear]' },
          { text: `${audienceLower} summer clothes`, score: 95, source: 'Seasonal [Summer Clothes]' },
          { text: `cotton summer ${typeLower}`, score: 93, source: 'Seasonal [Cotton Summer]' },
          { text: `summer collection for kids`, score: 91, source: 'Seasonal [Summer Collection]' },
          { text: `${brandLower} kids summer wear`, score: 94, source: 'Seasonal [Brand Summer]' }
        );
      } else if (season === 'Winter') {
        designTemplates.push(
          { text: `winter wear for ${audienceLower}`, score: 97, source: 'Seasonal [Winter Wear]' },
          { text: `${audienceLower} winter clothes`, score: 96, source: 'Seasonal [Winter Clothes]' },
          { text: `warm ${typeLower} for kids`, score: 94, source: 'Seasonal [Warm Kids]' },
          { text: `winter collection for kids`, score: 92, source: 'Seasonal [Winter Collection]' },
          { text: `${brandLower} kids winter clothes`, score: 95, source: 'Seasonal [Brand Winter]' }
        );
      }

      // Add product synonyms
      const dynamicSynonyms = getShopperSynonymsForType(typeLower);
      const allSyns = Array.from(new Set([...(sample.productSynonyms || []), ...dynamicSynonyms]));
      allSyns.forEach((rawSyn) => {
        const syn = sanitizeProductType(rawSyn, sample.sku).toLowerCase();
        if (!isSkuPollutedKeyword(syn)) {
          designTemplates.push({
            text: `${audienceLower} ${syn}`,
            score: 88,
            source: 'Design Engine [Synonym Modifier]',
          });
          designTemplates.push({
            text: `kids ${syn}`,
            score: 85,
            source: 'Design Engine [Kids Synonym]',
          });
        }
      });

      // MARVEL COLLABORATION KEYWORDS
      if (franchise === 'Marvel' || franchise === 'Disney & Marvel') {
        designTemplates.push(
          { text: `kuchipoo marvel ${typeLower}`, score: 97, source: 'Franchise [Kuchipoo x Marvel]' },
          { text: `marvel ${audienceLower} ${typeLower}`, score: 96, source: 'Franchise [Marvel Kids Apparel]' },
          { text: `marvel kids ${typeLower}`, score: 94, source: 'Franchise [Marvel Kids Set]' },
          { text: `marvel ${typeLower} for ${audienceLower}`, score: 93, source: 'Franchise [Marvel Target]' },
          { text: `official marvel kids clothing`, score: 90, source: 'Franchise [Official Merch]' },
          { text: `marvel avengers ${typeLower}`, score: 92, source: 'Franchise [Avengers]' }
        );
      }

      // DISNEY COLLABORATION KEYWORDS
      if (franchise === 'Disney' || franchise === 'Disney & Marvel') {
        designTemplates.push(
          { text: `kuchipoo disney ${typeLower}`, score: 97, source: 'Franchise [Kuchipoo x Disney]' },
          { text: `disney ${audienceLower} ${typeLower}`, score: 96, source: 'Franchise [Disney Kids Apparel]' },
          { text: `disney kids ${typeLower}`, score: 94, source: 'Franchise [Disney Kids Set]' },
          { text: `disney ${typeLower} for ${audienceLower}`, score: 93, source: 'Franchise [Disney Target]' },
          { text: `official disney kids clothes`, score: 90, source: 'Franchise [Official Merch]' }
        );
      }

      designTemplates.forEach((dt) => {
        // STRICT FILTER: Discard SKU patterns
        if (isSkuPollutedKeyword(dt.text)) {
          return;
        }

        if (dt.score >= strategy.minRelevanceScore) {
          const matchTypes: MatchType[] = [];
          if (strategy.enabledMatchTypes.BROAD) matchTypes.push('BROAD');
          if (strategy.enabledMatchTypes.PHRASE) matchTypes.push('PHRASE');
          if (strategy.enabledMatchTypes.EXACT) matchTypes.push('EXACT');

          matchTypes.forEach((matchType) => {
            // Put each design-level keyword into each SKU's normal size-specific ad group.
            // Do not create a shared AG_<designId>_Shared_DesignLevel group.
            skus.forEach((skuProduct) => {
              const key = `DESIGN::${skuProduct.sku}::${matchType}::${dt.text}`;
              if (!seenKeywordKeys.has(key)) {
                seenKeywordKeys.add(key);
                allKeywords.push({
                  id: `kw-design-${skuProduct.id}-${kwSeqId++}-${matchType}`,
                  sku: skuProduct.sku,
                  designId,
                  productType: typeLower,
                  audience: skuProduct.audience,
                  sizeDisplay: skuProduct.parsedSize.normalizedDisplay,
                  keywordText: dt.text,
                  canonicalKeywordText: dt.text,
                  matchType,
                  bid: Number((strategy.defaultBids[matchType] * 0.95).toFixed(2)),
                  category: 'DESIGN_LEVEL',
                  source: dt.source,
                  relevanceScore: dt.score,
                  approvalStatus: strategy.requireManualApproval ? 'PENDING' : 'APPROVED',
                  adGroupName: deriveAdGroupNameFromSku(skuProduct.sku),
                  campaignName,
                  hasAdGroupCrossSizeRisk: false,
                  conflictDetails: undefined,
                });
              } else {
                duplicatesCount++;
              }
            });
          });
        }
      });
    });
  }

  // ==========================================
  // 3. PRECISE CHARACTER-SPECIFIC KEYWORDS
  // ==========================================
  catalog.forEach((product) => {
    const charAliases = getCharacterAliases(product.character);
    const franchise = getProductFranchise(product);
    const season = getProductSeason(product.season);
    const audLower = product.audience.toLowerCase();
    const typeLower = sanitizeProductType(product.productType, product.sku).toLowerCase();
    const brandLower = sanitizeBrandName(product.brand).toLowerCase();

    if (charAliases.length > 0) {
      const campaignName = `${strategy.campaignPrefix}_${product.designId}`;
      const cleanAg = deriveAdGroupNameFromSku(product.sku);
      const adGroupName =
        strategy.adGroupArchitecture === 'SINGLE_PER_DESIGN'
          ? `AG_${product.designId}_AllSizes`
          : cleanAg;

      const charTemplates: { text: string; score: number; source: string }[] = [];

      charAliases.forEach((charName) => {
        // High-intent Amazon search phrases for character kids apparel
        charTemplates.push(
          { text: `${charName} ${typeLower}`, score: 99, source: `Character Engine [${charName} + Type]` },
          { text: `${charName} ${audLower} ${typeLower}`, score: 98, source: `Character Engine [${charName} + Audience]` },
          { text: `${charName} ${typeLower} for ${audLower}`, score: 95, source: `Character Engine [${charName} for ${audLower}]` },
          { text: `${charName} kids dress`, score: 91, source: `Character Engine [${charName} Dress]` },
          { text: `${brandLower} ${charName} ${typeLower}`, score: 96, source: `Character Engine [Brand + ${charName}]` }
        );

        if (season === 'Winter') {
          charTemplates.push(
            { text: `${charName} winter wear for kids`, score: 97, source: `Character Engine [${charName} Winter]` },
            { text: `${charName} warm ${typeLower}`, score: 95, source: `Character Engine [${charName} Warm]` }
          );
        } else if (season === 'Summer') {
          charTemplates.push(
            { text: `${charName} summer wear for kids`, score: 97, source: `Character Engine [${charName} Summer]` },
            { text: `${charName} cotton summer clothes`, score: 94, source: `Character Engine [${charName} Cotton Summer]` }
          );
        }

        if (franchise === 'Marvel' || franchise === 'Disney & Marvel') {
          charTemplates.push(
            { text: `marvel ${charName} ${typeLower}`, score: 98, source: `Character Engine [Marvel + ${charName}]` },
            { text: `official marvel ${charName} kids clothes`, score: 90, source: `Character Engine [Marvel Official]` }
          );
        }

        if (franchise === 'Disney' || franchise === 'Disney & Marvel') {
          charTemplates.push(
            { text: `disney ${charName} ${typeLower}`, score: 98, source: `Character Engine [Disney + ${charName}]` },
            { text: `official disney ${charName} kids clothes`, score: 90, source: `Character Engine [Disney Official]` }
          );
        }
      });

      charTemplates.forEach((ct) => {
        // STRICT FILTER: Discard SKU patterns
        if (isSkuPollutedKeyword(ct.text)) {
          return;
        }
        if (ct.score >= strategy.minRelevanceScore) {
          const matchTypes: MatchType[] = [];
          if (strategy.enabledMatchTypes.BROAD) matchTypes.push('BROAD');
          if (strategy.enabledMatchTypes.PHRASE) matchTypes.push('PHRASE');
          if (strategy.enabledMatchTypes.EXACT) matchTypes.push('EXACT');

          matchTypes.forEach((mt) => {
            const key = `CHAR::${product.sku}::${mt}::${ct.text}`;
            if (!seenKeywordKeys.has(key)) {
              seenKeywordKeys.add(key);
              allKeywords.push({
                id: `kw-char-${product.id}-${kwSeqId++}-${mt}`,
                sku: product.sku,
                designId: product.designId,
                productType: typeLower,
                audience: product.audience,
                sizeDisplay: product.parsedSize.normalizedDisplay,
                keywordText: ct.text,
                canonicalKeywordText: ct.text,
                matchType: mt,
                bid: strategy.defaultBids[mt],
                category: 'CHARACTER_SPECIFIC',
                source: ct.source,
                relevanceScore: ct.score,
                approvalStatus: strategy.requireManualApproval ? 'PENDING' : 'APPROVED',
                adGroupName,
                campaignName,
                hasAdGroupCrossSizeRisk: false,
              });
            }
          });
        }
      });
    }
  });

  // Calculate stats
  crossSizeWarningCount = allKeywords.filter((k) => k.hasAdGroupCrossSizeRisk).length;

  return {
    keywords: allKeywords,
    duplicatesCount,
    crossSizeWarningCount,
  };
}

/**
 * Deduplication Analyzer: Groups keywords by their canonical representation
 * to show users how alternate age expressions map together.
 */
export function analyzeDeduplication(keywords: KeywordItem[]): DeduplicationGroup[] {
  const groupMap = new Map<string, DeduplicationGroup>();

  keywords.forEach((item) => {
    const canonical = item.canonicalKeywordText;
    let group = groupMap.get(canonical);

    if (!group) {
      group = {
        canonicalKeyword: canonical,
        category: item.category,
        variants: [],
      };
      groupMap.set(canonical, group);
    }

    let variant = group.variants.find((v) => v.keywordText === item.keywordText);
    if (!variant) {
      variant = {
        keywordText: item.keywordText,
        itemIds: [item.id],
        isAlternate: item.isAlternateAgeWording || false,
        ageExpression: item.sizeDisplay,
      };
      group.variants.push(variant);
    } else {
      variant.itemIds.push(item.id);
    }
  });

  // Return groups that have more than 1 variant or represent age expressions
  return Array.from(groupMap.values()).filter((g) => g.variants.length > 0);
}
