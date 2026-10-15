import { SkuParsedSize, SkuParserSettings } from '../types';

export const defaultParserSettings: SkuParserSettings = {
  delimiter: '--',
  useFallbackDelimiters: true,
  fallbackDelimiters: ['__', '_', '-'],
  caseSensitive: false,
};

/**
 * Extracts size suffix from SKU using configurable delimiter
 */
export function extractRawSuffix(sku: string, settings: SkuParserSettings = defaultParserSettings): { prefix: string; suffix: string } {
  if (!sku) return { prefix: '', suffix: '' };

  // If primary delimiter exists
  if (sku.includes(settings.delimiter)) {
    const parts = sku.split(settings.delimiter);
    const prefix = parts.slice(0, -1).join(settings.delimiter);
    const suffix = parts[parts.length - 1].trim();
    return { prefix, suffix };
  }

  // Check custom regex if provided
  if (settings.customRegex) {
    try {
      const reg = new RegExp(settings.customRegex, settings.caseSensitive ? '' : 'i');
      const match = sku.match(reg);
      if (match && match[1]) {
        return {
          prefix: sku.replace(match[0], ''),
          suffix: match[1].trim(),
        };
      }
    } catch {
      // ignore invalid regex fallback
    }
  }

  // Check fallback delimiters
  if (settings.useFallbackDelimiters) {
    for (const fb of settings.fallbackDelimiters) {
      if (sku.includes(fb)) {
        const parts = sku.split(fb);
        const prefix = parts.slice(0, -1).join(fb);
        const suffix = parts[parts.length - 1].trim();
        // verify suffix looks like a size (contains numbers or size letters)
        if (/\d+|months?|years?|yrs?|infant|newborn|[SMLX]+/i.test(suffix)) {
          return { prefix, suffix };
        }
      }
    }
  }

  return { prefix: sku, suffix: '' };
}

/**
 * Normalizes size/age expressions into consistent representations
 */
export function parseAndNormalizeSize(rawSuffix: string): SkuParsedSize {
  const cleanSuffix = rawSuffix.trim();
  const lower = cleanSuffix.toLowerCase();

  // Pattern 1: Range with "to", "-", or "–", e.g. "13 to 14Years", "0 to 3Months", "5-6Y", "13 - 14 yrs"
  const rangeRegex = /(\d+)\s*(?:to|-|–|_|\s)\s*(\d+)\s*(months?|mths?|m|years?|yrs?|y)?/i;
  const rangeMatch = cleanSuffix.match(rangeRegex);

  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    const rawUnit = (rangeMatch[3] || '').toLowerCase();

    // Check if months based on unit or keyword in suffix
    const isMonths = rawUnit.startsWith('m') || lower.includes('month');
    const unit: 'years' | 'months' = isMonths ? 'months' : 'years';
    const isInfant = isMonths || (unit === 'years' && max <= 2);

    const unitSingular = unit === 'months' ? 'month' : 'year';
    const unitPlural = unit;

    // Use standard ASCII hyphen '-' to prevent Microsoft Excel 'â€“' UTF-8 encoding corruption
    const normalizedDisplay = `${min}-${max} ${max === 1 ? unitSingular : unitPlural}`;
    const canonicalForm = `${min} to ${max} ${max === 1 ? unitSingular : unitPlural}`;

    const alternateForms = [
      `${min}-${max} ${max === 1 ? unitSingular : unitPlural}`,
      `${min} ${max} ${max === 1 ? unitSingular : unitPlural}`,
      `${min} to ${max} ${unit === 'years' ? 'yrs' : 'm'}`,
      `${min}-${max}${unit === 'years' ? 'Y' : 'M'}`,
      `age ${min} ${max}`,
      `age ${min} to ${max}`,
    ];

    if (unit === 'months' && min === 0 && max <= 3) {
      alternateForms.push('newborn', '0-3m', '0 to 3 m');
    }

    return {
      rawSuffix: cleanSuffix.replace(/[\u2010-\u2015\u2212]/g, '-').replace(/â€“/g, '-'),
      normalizedDisplay,
      canonicalForm,
      alternateForms,
      minAge: min,
      maxAge: max,
      unit,
      isInfant,
    };
  }

  // Pattern 2: Single age / Toddler, e.g. "2T", "3T", "12 Years", "6 Months"
  const singleRegex = /(\d+)\s*(years?|yrs?|y|months?|m|t)?/i;
  const singleMatch = cleanSuffix.match(singleRegex);

  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    const rawUnit = (singleMatch[2] || '').toLowerCase();
    const isToddler = rawUnit === 't';
    const isMonths = rawUnit.startsWith('m') || lower.includes('month');
    const unit: 'years' | 'months' = isMonths ? 'months' : 'years';

    const normalizedDisplay = isToddler ? `${val}T` : `${val} ${unit}`;
    const canonicalForm = isToddler ? `${val}T` : `${val} ${unit}`;

    return {
      rawSuffix: cleanSuffix,
      normalizedDisplay,
      canonicalForm,
      alternateForms: [
        isToddler ? `size ${val}T` : `${val} ${unit === 'years' ? 'yrs' : 'm'}`,
        isToddler ? `toddler ${val}T` : `age ${val}`,
      ],
      minAge: val,
      maxAge: val,
      unit,
      isInfant: isMonths || (unit === 'years' && val <= 2),
    };
  }

  // Fallback for standard clothing sizes (S, M, L, XL, etc.) or free text
  return {
    rawSuffix: cleanSuffix,
    normalizedDisplay: cleanSuffix || 'Standard',
    canonicalForm: cleanSuffix.toLowerCase() || 'standard',
    alternateForms: [cleanSuffix.toUpperCase(), `size ${cleanSuffix}`],
    minAge: 0,
    maxAge: 0,
    unit: 'standard',
    isInfant: lower.includes('baby') || lower.includes('infant'),
  };
}

/**
 * Deduplication helper to identify canonical age phrases
 */
export function normalizeAgeExpression(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/â€“/g, '-')
    .replace(/(\d+)\s*[-–_]\s*(\d+)/g, '$1 to $2')
    .replace(/(\d+)\s*y(?:ears?|rs?)?/gi, '$1 years')
    .replace(/(\d+)\s*m(?:onths?|ths?)?/gi, '$1 months')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Derives a clean Ad Group Name and Ad Group ID directly from the SKU,
 * as requested:
 * e.g., "DKUC-BSUT-168--18-24 months" -> "BSUT-168--18-24 months"
 * e.g., "KUC-BSUT-168--18-24 months" -> "BSUT-168--18-24 months"
 * e.g., "KUC-HOD-242--13 to 14Years" -> "HOD-242--13 to 14Years"
 * Eliminates all corrupted symbols (â€“), unicode dashes, non-breaking spaces, and weird prefixes.
 */
export function deriveAdGroupNameFromSku(sku: string): string {
  if (!sku) return 'AdGroup_1';

  // 1. Normalize all unicode dashes/spaces/mojibake into standard ASCII
  let clean = sku
    .replace(/[\u2010-\u2015\u2212\u00A0\uFEFF]/g, '-')
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Strip leading distributor/brand prefix if present:
  // Matches e.g. DKUC-, DAMZ-, DFBA-, D- followed by the core product code
  if (/^D[A-Z]{2,5}[-_]/i.test(clean)) {
    const stripped = clean.replace(/^D[A-Z]{2,5}[-_]/i, '');
    if (stripped.length >= 3) {
      return stripped;
    }
  }

  // 3. Strip standalone D- or D_ prefix
  if (/^D[-_]/i.test(clean)) {
    const stripped = clean.replace(/^D[-_]/i, '');
    if (stripped.length >= 3) {
      return stripped;
    }
  }

  // 4. Strip brand prefixes like KUC- when followed by design/product identifier
  // e.g. "KUC-BSUT-168--18-24 months" -> "BSUT-168--18-24 months"
  // e.g. "KUC-HOD-242--13 to 14Years" -> "HOD-242--13 to 14Years"
  if (/^[A-Z]{3,4}[-_](?=[A-Z0-9]+[-_])/i.test(clean)) {
    const stripped = clean.replace(/^[A-Z]{3,4}[-_]/i, '');
    if (stripped.length >= 3) {
      return stripped;
    }
  }

  return clean;
}

