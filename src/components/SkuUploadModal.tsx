import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Download, 
  Sparkles, 
  ClipboardList,
  RotateCcw,
  Sun,
  Snowflake,
  Calendar
} from 'lucide-react';
import { ProductSKU, SkuParserSettings, STANDARD_PRODUCT_TYPES, SeasonType } from '../types';
import { extractRawSuffix, parseAndNormalizeSize, deriveAdGroupNameFromSku } from '../utils/skuParser';
import { downloadExcelTemplate, downloadCsvTemplate, parseExcelFileToLines } from '../utils/templateGenerator';
import { sanitizeBrandName, sanitizeProductType } from '../utils/keywordEngine';

interface SkuUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSkus: (importedSkus: ProductSKU[], mode: 'REPLACE' | 'APPEND') => void;
  parserSettings: SkuParserSettings;
}

const FRANCHISE_OPTIONS = [
  { value: 'None', label: 'None (Only Kuchipoo)' },
  { value: 'Disney', label: 'Disney (Kuchipoo x Disney)' },
  { value: 'Marvel', label: 'Marvel (Kuchipoo x Marvel)' },
  { value: 'Disney & Marvel', label: 'Disney & Marvel (Dual)' },
];

const CHARACTER_OPTIONS = [
  'None',
  'Spider-Man',
  'Mickey Mouse',
  'Iron Man',
  'Captain America',
  'Hulk',
  'Avengers',
  'Frozen / Elsa',
  'Minnie Mouse',
  'Donald Duck',
  'Simba / Lion King',
  'Disney Princess',
  'Cars / Lightning McQueen',
  'Thor',
  'Black Panther',
  'Winnie the Pooh',
];

const PRODUCT_TYPE_OPTIONS = [...STANDARD_PRODUCT_TYPES];

const SEASON_OPTIONS: SeasonType[] = ['All Season', 'Summer', 'Winter'];

export const SkuUploadModal: React.FC<SkuUploadModalProps> = ({
  isOpen,
  onClose,
  onImportSkus,
  parserSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'FILE_UPLOAD' | 'PASTE_SKUS'>('FILE_UPLOAD');
  const [pasteText, setPasteText] = useState('');
  const [defaultBrand, setDefaultBrand] = useState('KUCHIPOO');
  const [defaultProductType, setDefaultProductType] = useState<string>('T-Shirts and Pyjamas Set');
  const [defaultSeason, setDefaultSeason] = useState<SeasonType>('All Season');
  const [defaultFranchise, setDefaultFranchise] = useState('None');
  const [defaultCharacter, setDefaultCharacter] = useState('None');
  const [defaultCampaignPref, setDefaultCampaignPref] = useState<'BOTH' | 'AUTO' | 'MANUAL'>('BOTH');
  const [defaultBudget, setDefaultBudget] = useState('500.00');

  const [parsedPreview, setParsedPreview] = useState<ProductSKU[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'REPLACE' | 'APPEND'>('REPLACE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Clear all inputs in modal
  const handleClearModalInputs = () => {
    setPasteText('');
    setParsedPreview([]);
    setFileName('');
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadExcel = async () => {
    try {
      setIsGeneratingTemplate(true);
      await downloadExcelTemplate();
    } catch (err: any) {
      setErrorMsg(`Failed to generate Excel template: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleDownloadCsv = () => {
    downloadCsvTemplate();
  };

  const parseLinesToSkus = (lines: string[]): ProductSKU[] => {
    if (lines.length === 0) return [];

    const firstLine = lines[0].toLowerCase();
    const hasCsvHeader =
      firstLine.includes('sku') ||
      firstLine.includes('seller-sku') ||
      firstLine.includes('campaign');

    const items: ProductSKU[] = [];
    const dataRows = hasCsvHeader ? lines.slice(1) : lines;

    let skuIdx = 0;
    let campIdx = -1;
    let budgetIdx = -1;
    let bidIdx = -1;
    let adGroupBidIdx = -1;
    let brandIdx = -1;
    let typeIdx = -1;
    let seasonIdx = -1;
    let franchiseIdx = -1;
    let charIdx = -1;
    let audIdx = -1;
    let asinIdx = -1;

    if (hasCsvHeader) {
      const headerCols = lines[0].split(/[,;\t]/).map((c) => c.trim().toLowerCase().replace(/['"]/g, ''));
      headerCols.forEach((col, idx) => {
        if (col === 'sku' || col === 'sellersku' || col.includes('sku')) skuIdx = idx;
        else if (col.includes('campaign') || col.includes('type_campaign')) campIdx = idx;
        else if (col.includes('budget')) budgetIdx = idx;
        else if (col.includes('ad_group_default_bid') || col.includes('ad group default bid') || col.includes('adgroupdefaultbid')) adGroupBidIdx = idx;
        else if (col === 'default_bid' || col === 'default bid' || col === 'bid') bidIdx = idx;
        else if (col.includes('brand')) brandIdx = idx;
        else if (col.includes('season') || col.includes('weather') || col.includes('mausam')) seasonIdx = idx;
        else if (col.includes('franchise') || col.includes('collab') || col.includes('license') || col.includes('universe')) franchiseIdx = idx;
        else if (col.includes('character') || col.includes('char')) charIdx = idx;
        else if (col.includes('product') || col.includes('type')) typeIdx = idx;
        else if (col.includes('audience') || col.includes('gender')) audIdx = idx;
        else if (col.includes('asin')) asinIdx = idx;
      });
    }

    dataRows.forEach((row, rowIdx) => {
      if (!row.trim()) return;
      const cols = row.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const rawSku = cols[skuIdx] || cols[0];
      if (!rawSku) return;

      const { prefix, suffix } = extractRawSuffix(rawSku, parserSettings);
      const parsedSize = parseAndNormalizeSize(suffix);
      // Clean design ID: e.g. "DKUC-BSUT-168" -> "BSUT-168", "DKUC-TPSET-501" -> "TPSET-501"
      const rawDesignPrefix = prefix || rawSku.split(parserSettings.delimiter)[0] || `DESIGN-${rowIdx + 1}`;
      const designId = rawDesignPrefix.replace(/^D[A-Z]{2,5}[-_]/i, '').replace(/^D[-_]/i, '') || rawDesignPrefix;

      let rawBrandCol = brandIdx >= 0 && cols[brandIdx] ? cols[brandIdx] : defaultBrand || 'KUCHIPOO';
      let brand = sanitizeBrandName(rawBrandCol);

      // Product Type detection - prioritize matching one of 14 exact user types
      let rawTypeCol = typeIdx >= 0 && cols[typeIdx] ? cols[typeIdx].trim() : '';
      let productType = defaultProductType || 'T-Shirts and Pyjamas Set';
      if (rawTypeCol) {
        productType = sanitizeProductType(rawTypeCol, rawSku);
      } else {
        productType = sanitizeProductType(defaultProductType, rawSku);
      }

      // Season detection: Summer / Winter / All Season
      let rawSeasonCol = seasonIdx >= 0 && cols[seasonIdx] ? cols[seasonIdx].trim() : '';
      let season: SeasonType = defaultSeason || 'All Season';
      if (rawSeasonCol) {
        const sLower = rawSeasonCol.toLowerCase();
        if (sLower.includes('summer')) season = 'Summer';
        else if (sLower.includes('winter')) season = 'Winter';
        else season = 'All Season';
      }

      // Franchise Collaboration detection (Disney / Marvel / None)
      let rawFranchiseCol = franchiseIdx >= 0 && cols[franchiseIdx] ? cols[franchiseIdx].trim() : '';
      let franchise = 'None';
      const franLower = (rawFranchiseCol || defaultFranchise || '').toLowerCase();
      const skuLower = rawSku.toLowerCase();

      if (franLower.includes('marvel') && franLower.includes('disney')) {
        franchise = 'Disney & Marvel';
      } else if (franLower.includes('marvel')) {
        franchise = 'Marvel';
      } else if (franLower.includes('disney')) {
        franchise = 'Disney';
      } else if (skuLower.includes('marvel')) {
        franchise = 'Marvel';
      } else if (skuLower.includes('disney')) {
        franchise = 'Disney';
      } else {
        franchise = defaultFranchise || 'None';
      }

      // Character detection (Spider-Man, Mickey Mouse, Iron Man, etc.)
      let rawCharCol = charIdx >= 0 && cols[charIdx] ? cols[charIdx].trim() : '';
      let character = '';
      if (rawCharCol && !/^none$/i.test(rawCharCol)) {
        character = rawCharCol;
      } else if (defaultCharacter && defaultCharacter !== 'None') {
        character = defaultCharacter;
      } else {
        // Auto-detect from SKU text if present
        if (skuLower.includes('spiderman') || skuLower.includes('spider-man')) character = 'Spider-Man';
        else if (skuLower.includes('mickey')) character = 'Mickey Mouse';
        else if (skuLower.includes('minnie')) character = 'Minnie Mouse';
        else if (skuLower.includes('ironman') || skuLower.includes('iron-man')) character = 'Iron Man';
        else if (skuLower.includes('hulk')) character = 'Hulk';
        else if (skuLower.includes('frozen') || skuLower.includes('elsa')) character = 'Frozen / Elsa';
        else if (skuLower.includes('donald')) character = 'Donald Duck';
        else if (skuLower.includes('avenger')) character = 'Avengers';
      }

      let audience: ProductSKU['audience'] = 'Kids';
      let currentAsin = asinIdx >= 0 && cols[asinIdx] ? cols[asinIdx] : undefined;
      let dailyBudget = budgetIdx >= 0 && !isNaN(parseFloat(cols[budgetIdx])) ? parseFloat(cols[budgetIdx]) : parseFloat(defaultBudget) || 500.0;
      const parsedAdGroupDefaultBid = adGroupBidIdx >= 0 ? Number.parseFloat(cols[adGroupBidIdx]) : Number.NaN;
      const adGroupDefaultBid = Number.isFinite(parsedAdGroupDefaultBid) && parsedAdGroupDefaultBid >= 0.05
        ? parsedAdGroupDefaultBid
        : undefined;
      
      let campaignPreference: 'BOTH' | 'AUTO' | 'MANUAL' = defaultCampaignPref;
      if (campIdx >= 0 && cols[campIdx]) {
        const val = cols[campIdx].toUpperCase();
        if (val.includes('AUTO')) campaignPreference = 'AUTO';
        else if (val.includes('MANUAL')) campaignPreference = 'MANUAL';
        else if (val.includes('BOTH')) campaignPreference = 'BOTH';
      }

      if (audIdx >= 0 && cols[audIdx]) {
        const aVal = cols[audIdx].toLowerCase();
        if (aVal.includes('boy')) audience = 'Boys';
        else if (aVal.includes('girl')) audience = 'Girls';
        else if (aVal.includes('baby') || aVal.includes('infant')) audience = 'Unisex Baby';
        else if (aVal.includes('toddler')) audience = 'Toddler';
      } else if (parsedSize.isInfant) {
        audience = 'Unisex Baby';
      }

      const item: ProductSKU = {
        id: `sku-imported-${Date.now()}-${rowIdx}`,
        sku: rawSku,
        designId,
        brand,
        productType,
        season,
        productSynonyms: [],
        audience,
        franchise: franchise as any,
        character: character || undefined,
        characterFranchise: franchise !== 'None' ? franchise : undefined,
        parsedSize,
        dailyBudget,
        adGroupDefaultBid,
        campaignPreference,
        currentAsin,
      };

      items.push(item);
    });

    return items;
  };

  const processFileContent = (content: string, name: string) => {
    try {
      setErrorMsg(null);
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setErrorMsg('The file appears to be empty.');
        return;
      }
      const parsed = parseLinesToSkus(lines);
      if (parsed.length === 0) {
        setErrorMsg('Could not find any valid SKUs in file. Please verify format.');
        return;
      }
      setParsedPreview(parsed);
      setFileName(name);
    } catch (err: any) {
      setErrorMsg(`Error processing file: ${err.message || 'Unknown error'}`);
    }
  };

  const handleProcessPastedSkus = () => {
    setErrorMsg(null);
    if (!pasteText.trim()) {
      setErrorMsg('Please paste at least one SKU to parse.');
      return;
    }
    const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = parseLinesToSkus(lines);
    if (parsed.length === 0) {
      setErrorMsg('No valid SKUs detected.');
      return;
    }
    setParsedPreview(parsed);
    setFileName('Pasted SKUs');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      if (isExcel) {
        try {
          setIsGeneratingTemplate(true);
          const lines = await parseExcelFileToLines(file);
          processFileContent(lines.join('\n'), file.name);
        } catch (err: any) {
          setErrorMsg(`Error reading Excel file: ${err.message || 'Invalid format'}`);
        } finally {
          setIsGeneratingTemplate(false);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          processFileContent(text, file.name);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportSkus(parsedPreview, importMode);
    onClose();
  };

  // Row update handlers
  const handleUpdateRowCampaignType = (idx: number, newPref: 'BOTH' | 'AUTO' | 'MANUAL') => {
    setParsedPreview((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, campaignPreference: newPref } : item))
    );
  };

  const handleUpdateRowProductType = (idx: number, newType: string) => {
    setParsedPreview((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, productType: newType } : item))
    );
  };

  const handleUpdateRowSeason = (idx: number, newSeason: SeasonType) => {
    setParsedPreview((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, season: newSeason } : item))
    );
  };

  const handleUpdateRowFranchise = (idx: number, newFranchise: string) => {
    setParsedPreview((prev) =>
      prev.map((item, i) => (i === idx ? { 
        ...item, 
        franchise: newFranchise,
        characterFranchise: newFranchise !== 'None' ? newFranchise : undefined 
      } : item))
    );
  };

  const handleUpdateRowCharacter = (idx: number, newChar: string) => {
    setParsedPreview((prev) =>
      prev.map((item, i) => (i === idx ? { 
        ...item, 
        character: newChar === 'None' ? undefined : newChar 
      } : item))
    );
  };

  const handleUpdateRowBudget = (idx: number, newBudget: number) => {
    setParsedPreview((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, dailyBudget: newBudget } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Upload Inventory SKUs & Generate Amazon Campaigns</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  14 Product Types + Seasons
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Supports Season (Summer / Winter), 14 Product Types, Franchise (Disney / Marvel), and Characters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearModalInputs}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Clear all text, uploaded files, and parsed rows"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Clear Inputs
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('FILE_UPLOAD')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'FILE_UPLOAD'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Option 1: Upload Excel (.xlsx) / CSV File
          </button>

          <button
            onClick={() => setActiveTab('PASTE_SKUS')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'PASTE_SKUS'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Option 2: Direct Paste SKUs (Fastest)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'FILE_UPLOAD' ? (
            /* Upload File Box */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt,.tsv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Click to select Excel (.xlsx) or CSV file or drag and drop here
                </h3>
                <p className="text-xs text-slate-400 max-w-xl mx-auto">
                  Supports <strong>.xlsx</strong> and <strong>.csv</strong> files with columns: SKU, Campaign_Type, Product_Type, Season, Franchise_Collab, Character, Daily_Budget, Ad_Group_Default_Bid (optional).
                </p>

                {/* Download Template Buttons with Dropdowns */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={isGeneratingTemplate}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadExcel();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Download Excel Template (.xlsx)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 font-normal">
                      Dropdowns for 17 Product Types, Season, Franchise & Characters
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadCsv();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Download CSV Template
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Direct Paste Box */
            <div className="space-y-4">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Paste SKUs (One SKU per line):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Example: <code className="text-amber-400">DKUC-TPSET-501--4-5 years</code>
                  </span>
                </div>

                <textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`DKUC-TPSET-501--4-5 years\nDKUC-SSET-502--3-4 years\nDKUC-HOD-242--13 to 14Years\nDKUC-SWTR-301--5-6 years\nDKUC-CRG-168--6-7 years`}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:border-amber-500"
                />

                {/* Quick Defaults for Pasted Items: Product Type, Season, Franchise, Character */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Product Type</label>
                    <select
                      value={defaultProductType}
                      onChange={(e) => setDefaultProductType(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 font-medium"
                    >
                      {PRODUCT_TYPE_OPTIONS.map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Season</label>
                    <select
                      value={defaultSeason}
                      onChange={(e) => setDefaultSeason(e.target.value as SeasonType)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-cyan-500/50 rounded text-cyan-300 font-medium"
                    >
                      {SEASON_OPTIONS.map((so) => (
                        <option key={so} value={so}>{so}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Franchise Collab</label>
                    <select
                      value={defaultFranchise}
                      onChange={(e) => setDefaultFranchise(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-amber-500/50 rounded text-amber-300 font-medium"
                    >
                      {FRANCHISE_OPTIONS.map((fo) => (
                        <option key={fo.value} value={fo.value}>{fo.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Character</label>
                    <select
                      value={defaultCharacter}
                      onChange={(e) => setDefaultCharacter(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 font-medium"
                    >
                      {CHARACTER_OPTIONS.map((co) => (
                        <option key={co} value={co}>{co}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Campaign Type</label>
                    <select
                      value={defaultCampaignPref}
                      onChange={(e) => setDefaultCampaignPref(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-amber-300 font-bold"
                    >
                      <option value="BOTH">Auto + Manual</option>
                      <option value="AUTO">Auto Only</option>
                      <option value="MANUAL">Manual Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleProcessPastedSkus}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Parse SKUs & Preview Ad Groups
                  </button>
                  <button
                    type="button"
                    onClick={handleClearModalInputs}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors border border-slate-800 flex items-center gap-1"
                    title="Clear pasted text"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Preview Table with Campaign Type, Product Type, Season, Franchise, and Character Dropdowns */}
          {parsedPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Detected {parsedPreview.length} SKUs ({fileName || 'Ready'})
                  </span>
                </div>

                {/* Import Mode Selector */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Dashboard Action:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'REPLACE'}
                        onChange={() => setImportMode('REPLACE')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-slate-200">Replace Current</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'APPEND'}
                        onChange={() => setImportMode('APPEND')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-slate-200">Append New</span>
                    </label>
                  </div>

                  <button
                    onClick={handleClearModalInputs}
                    className="px-2 py-1 text-[11px] text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 rounded border border-rose-500/30 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset List
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40 max-h-80">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">Original SKU</th>
                      <th className="px-3 py-2.5">Ad Group ID (Cleaned)</th>
                      <th className="px-3 py-2.5">Campaign Type</th>
                      <th className="px-3 py-2.5">Product Type</th>
                      <th className="px-3 py-2.5">Season</th>
                      <th className="px-3 py-2.5">Franchise</th>
                      <th className="px-3 py-2.5">Character</th>
                      <th className="px-3 py-2.5">Size / Age</th>
                      <th className="px-3 py-2.5">Daily Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {parsedPreview.map((item, idx) => {
                      const cleanAdGroupId = deriveAdGroupNameFromSku(item.sku);
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                          {/* 1. Original SKU */}
                          <td className="px-3 py-2 font-bold text-white whitespace-nowrap">
                            {item.sku}
                          </td>

                          {/* 2. Clean Derived Ad Group ID */}
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              {cleanAdGroupId}
                            </span>
                          </td>

                          {/* 3. Campaign Type Dropdown */}
                          <td className="px-3 py-2 font-sans">
                            <select
                              value={item.campaignPreference || 'BOTH'}
                              onChange={(e) =>
                                handleUpdateRowCampaignType(idx, e.target.value as 'BOTH' | 'AUTO' | 'MANUAL')
                              }
                              className="px-2 py-1 bg-slate-950 border border-amber-500/50 rounded text-[11px] font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                            >
                              <option value="BOTH">BOTH (Auto+Manual)</option>
                              <option value="AUTO">AUTO Only</option>
                              <option value="MANUAL">MANUAL Only</option>
                            </select>
                          </td>

                          {/* 4. Product Type Dropdown (17 exact types) */}
                          <td className="px-3 py-2 font-sans">
                            <select
                              value={item.productType}
                              onChange={(e) => handleUpdateRowProductType(idx, e.target.value)}
                              className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none cursor-pointer"
                            >
                              {PRODUCT_TYPE_OPTIONS.map((pt) => (
                                <option key={pt} value={pt}>{pt}</option>
                              ))}
                              {!PRODUCT_TYPE_OPTIONS.includes(item.productType as any) && (
                                <option value={item.productType}>{item.productType}</option>
                              )}
                            </select>
                          </td>

                          {/* 5. Season Dropdown (Summer / Winter / All Season) */}
                          <td className="px-3 py-2 font-sans">
                            <select
                              value={item.season || 'All Season'}
                              onChange={(e) => handleUpdateRowSeason(idx, e.target.value as SeasonType)}
                              className={`px-2 py-1 bg-slate-950 border rounded text-[11px] font-bold cursor-pointer ${
                                item.season === 'Summer'
                                  ? 'border-amber-500/60 text-amber-300'
                                  : item.season === 'Winter'
                                  ? 'border-cyan-500/60 text-cyan-300'
                                  : 'border-slate-700 text-slate-300'
                              }`}
                            >
                              {SEASON_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>

                          {/* 6. Franchise Collab Dropdown (None, Disney, Marvel) */}
                          <td className="px-3 py-2 font-sans">
                            <select
                              value={item.franchise || 'None'}
                              onChange={(e) => handleUpdateRowFranchise(idx, e.target.value)}
                              className={`px-2 py-1 bg-slate-950 border rounded text-[11px] font-bold cursor-pointer ${
                                item.franchise === 'Marvel'
                                  ? 'border-rose-500/60 text-rose-300'
                                  : item.franchise === 'Disney'
                                  ? 'border-blue-500/60 text-blue-300'
                                  : 'border-slate-700 text-slate-400'
                              }`}
                            >
                              {FRANCHISE_OPTIONS.map((fo) => (
                                <option key={fo.value} value={fo.value}>{fo.label}</option>
                              ))}
                            </select>
                          </td>

                          {/* 7. Character Dropdown */}
                          <td className="px-3 py-2 font-sans">
                            <select
                              value={item.character || 'None'}
                              onChange={(e) => handleUpdateRowCharacter(idx, e.target.value)}
                              className={`px-2 py-1 bg-slate-950 border rounded text-[11px] cursor-pointer ${
                                item.character && item.character !== 'None'
                                  ? 'border-purple-500/60 text-purple-300 font-bold'
                                  : 'border-slate-700 text-slate-400'
                              }`}
                            >
                              {CHARACTER_OPTIONS.map((co) => (
                                <option key={co} value={co}>{co}</option>
                              ))}
                              {item.character && !CHARACTER_OPTIONS.includes(item.character) && (
                                <option value={item.character}>{item.character}</option>
                              )}
                            </select>
                          </td>

                          {/* 8. Parsed Age / Size */}
                          <td className="px-3 py-2 text-emerald-400 font-bold text-[11px]">
                            {item.parsedSize.normalizedDisplay}
                          </td>

                          {/* 9. Daily Budget */}
                          <td className="px-3 py-2 text-slate-200 font-bold font-mono">
                            <div className="flex items-center gap-1">
                              <span>₹</span>
                              <input
                                type="number"
                                step="25"
                                value={item.dailyBudget || 500}
                                onChange={(e) => handleUpdateRowBudget(idx, parseFloat(e.target.value) || 500)}
                                className="w-16 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>
              Configured: <strong>{parsedPreview.length}</strong> SKUs
            </span>
            {parsedPreview.length > 0 && (
              <span className="text-amber-400 font-semibold">
                Ready to generate size keywords and clean Ad Group IDs
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={parsedPreview.length === 0}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-white shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Import to Dashboard ({parsedPreview.length} SKUs)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
