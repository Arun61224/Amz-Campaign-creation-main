import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { downloadBlob } from './amazonExport';
import { STANDARD_PRODUCT_TYPES } from '../types';

/**
 * Downloads a rich Excel (.xlsx) template with built-in Data Validation dropdowns:
 * - Campaign_Type (BOTH, AUTO, MANUAL)
 * - Product_Type (All 14 exact types requested by user)
 * - Season (All Season, Summer, Winter)
 * - Franchise_Collab (None (Only Kuchipoo), Disney, Marvel, Disney & Marvel)
 * - Character (Spider-Man, Mickey Mouse, Iron Man, Elsa, etc.)
 * - Audience (Boys, Girls, Unisex Baby, Kids, Toddler)
 */
export async function downloadExcelTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amazon Ads Studio';
  workbook.created = new Date();

  // 1. Main Data Sheet
  const ws = workbook.addWorksheet('SKU_Campaign_Template', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'SKU', key: 'sku', width: 34 },
    { header: 'Campaign_Type', key: 'campaign_type', width: 18 },
    { header: 'Daily_Budget', key: 'daily_budget', width: 15 },
    { header: 'Default_Bid', key: 'default_bid', width: 14 },
    { header: 'Brand', key: 'brand', width: 16 },
    { header: 'Product_Type', key: 'product_type', width: 28 },
    { header: 'Season', key: 'season', width: 16 },
    { header: 'Franchise_Collab', key: 'franchise_collab', width: 24 },
    { header: 'Character', key: 'character', width: 26 },
    { header: 'Audience', key: 'audience', width: 16 },
    { header: 'ASIN', key: 'asin', width: 16 },
    { header: 'Ad_Group_Default_Bid', key: 'ad_group_default_bid', width: 22 },
  ];

  // Style Header Row
  const headerRow = ws.getRow(1);
  headerRow.height = 30;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark slate
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sample Rows showcasing the 14 product types, Seasons, Marvel, Disney, Characters, and standard Kuchipoo items
  const sampleData = [
    {
      sku: 'DKUC-TPSET-501--4-5 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 15.0,
      brand: 'KUCHIPOO',
      product_type: 'T-Shirts and Pyjamas Set',
      season: 'All Season',
      franchise_collab: 'Marvel',
      character: 'Spider-Man',
      audience: 'Boys',
      asin: 'B0CXYZSP501',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-SSET-502--3-4 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 14.0,
      brand: 'KUCHIPOO',
      product_type: 'Shorts Set',
      season: 'Summer',
      franchise_collab: 'Disney',
      character: 'Mickey Mouse',
      audience: 'Boys',
      asin: 'B0CXYZMK502',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-HOD-242--13 to 14Years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 15.0,
      brand: 'KUCHIPOO',
      product_type: 'Hoddies',
      season: 'Winter',
      franchise_collab: 'Marvel',
      character: 'Iron Man',
      audience: 'Boys',
      asin: 'B0CHXYZ1314',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-SWTR-301--5-6 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 15.0,
      brand: 'KUCHIPOO',
      product_type: 'Sweaters',
      season: 'Winter',
      franchise_collab: 'None (Only Kuchipoo)',
      character: 'None',
      audience: 'Girls',
      asin: 'B0CSWTR301',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-CRG-168--6-7 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 14.0,
      brand: 'KUCHIPOO',
      product_type: 'Cargo Pants',
      season: 'All Season',
      franchise_collab: 'None (Only Kuchipoo)',
      character: 'None',
      audience: 'Boys',
      asin: 'B0CCRG168',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-VLVT-801--2-3 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 16.0,
      brand: 'KUCHIPOO',
      product_type: 'Velvet clothing Set',
      season: 'Winter',
      franchise_collab: 'Disney',
      character: 'Frozen / Elsa',
      audience: 'Girls',
      asin: 'B0CVLVT801',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-VTP-802--3-4 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 16.0,
      brand: 'KUCHIPOO',
      product_type: 'Velvet T-Shirts and Pyjamas Set',
      season: 'Winter',
      franchise_collab: 'Marvel',
      character: 'Spider-Man',
      audience: 'Boys',
      asin: 'B0CVTP802',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-VZH-803--5-6 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 17.0,
      brand: 'KUCHIPOO',
      product_type: 'Velve ZIP HODDIE AND PYJAMAS set',
      season: 'Winter',
      franchise_collab: 'None (Only Kuchipoo)',
      character: 'None',
      audience: 'Boys',
      asin: 'B0CVZH803',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-VHP-804--4-5 years',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 16.0,
      brand: 'KUCHIPOO',
      product_type: 'Velvel HODDE AND PYJAMAS',
      season: 'Winter',
      franchise_collab: 'Disney',
      character: 'Mickey Mouse',
      audience: 'Boys',
      asin: 'B0CVHP804',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
    {
      sku: 'DKUC-ROMP-112--6-12 months',
      campaign_type: 'BOTH',
      daily_budget: 500.0,
      default_bid: 12.0,
      brand: 'KUCHIPOO',
      product_type: 'Rompers',
      season: 'Summer',
      franchise_collab: 'None (Only Kuchipoo)',
      character: 'None',
      audience: 'Unisex Baby',
      asin: 'B0CROMP112',
      ad_group_default_bid: null, // Optional; blank uses dashboard value
    },
  ];

  sampleData.forEach((item) => {
    ws.addRow(item);
  });

  // Prepare formula lists
  const productTypeListFormula = `"${STANDARD_PRODUCT_TYPES.join(',')}"`;

  // Apply Excel Data Validation Dropdowns (rows 2 to 500)
  for (let r = 2; r <= 500; r++) {
    // 1. Column B: Campaign_Type dropdown
    ws.getCell(`B${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"BOTH,AUTO,MANUAL"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Campaign Type',
      error: 'Please pick BOTH, AUTO, or MANUAL from the dropdown list.',
    };

    // 2. Column F: Product_Type dropdown (all 14 exact types)
    ws.getCell(`F${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [productTypeListFormula],
      showErrorMessage: false,
    };

    // 3. Column G: Season dropdown (All Season, Summer, Winter)
    ws.getCell(`G${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"All Season,Summer,Winter"'],
      showErrorMessage: true,
      errorTitle: 'Select Season',
      error: 'Select All Season, Summer, or Winter.',
    };

    // 4. Column H: Franchise_Collab dropdown (None, Disney, Marvel, Disney & Marvel)
    ws.getCell(`H${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"None (Only Kuchipoo),Disney,Marvel,Disney & Marvel"'],
      showErrorMessage: true,
      errorTitle: 'Select Franchise',
      error: 'Select None (Only Kuchipoo), Disney, Marvel, or Disney & Marvel (or leave blank).',
    };

    // 5. Column I: Character dropdown
    ws.getCell(`I${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"None,Spider-Man,Iron Man,Captain America,Hulk,Avengers,Mickey Mouse,Minnie Mouse,Donald Duck,Frozen / Elsa,Simba / Lion King,Disney Princess,Thor,Black Panther,Cars / Lightning McQueen"'],
      showErrorMessage: false,
    };

    // 6. Column J: Audience dropdown
    ws.getCell(`J${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Boys,Girls,Unisex Baby,Kids,Toddler"'],
      showErrorMessage: false,
    };
  }

  // 2. Instructions & Reference Sheet
  const infoWs = workbook.addWorksheet('Instructions_Help');
  infoWs.columns = [
    { header: 'Setting', key: 'setting', width: 24 },
    { header: 'Allowed Values', key: 'values', width: 34 },
    { header: 'Description / Behavior', key: 'desc', width: 68 },
  ];
  const infoHeader = infoWs.getRow(1);
  infoHeader.height = 24;
  infoHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  infoHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };

  infoWs.addRow({
    setting: 'Campaign_Type',
    values: 'BOTH, AUTO, MANUAL (Dropdown)',
    desc: 'Select BOTH for dual Auto+Manual launch, AUTO for auto-targeting only, or MANUAL for size keywords.',
  });
  infoWs.addRow({
    setting: 'Product_Type',
    values: '17 Types: T-shirts Set, Shorts Set, Cargo Pants, Trackpants, Pajamas, Hoddies, Sweaters, T-Shirts and Pyjamas Set, T-Shirts and Trackpants Set, T-Shirts and Shorts Set, Bloomer, Rompers, Jackets, Velvet clothing Set, Velvet T-Shirts and Pyjamas Set, Velve ZIP HODDIE AND PYJAMAS set, Velvel HODDE AND PYJAMAS',
    desc: 'Keywords are generated specifically tailored to this exact product category with Indian shopper search synonyms.',
  });
  infoWs.addRow({
    setting: 'Season',
    values: 'All Season, Summer, Winter',
    desc: 'Determines seasonal search modifiers (e.g. Summer adds "cotton summer wear", "summer clothes"; Winter adds "warm winter jacket", "winter wear", "cozy winter clothes").',
  });
  infoWs.addRow({
    setting: 'Franchise_Collab',
    values: 'None (Only Kuchipoo), Disney, Marvel, Disney & Marvel',
    desc: 'If left blank or None: pure Kuchipoo keywords only. If Disney or Marvel is chosen: generates extra Kuchipoo + Disney/Marvel official collaboration search keywords.',
  });
  infoWs.addRow({
    setting: 'Character',
    values: 'Spider-Man, Mickey Mouse, Iron Man, Donald Duck, Frozen/Elsa, Hulk, etc.',
    desc: 'Dropdown for precise character search terms (e.g. "spiderman t-shirts and pyjamas set", "disney mickey mouse night suit", "marvel spiderman boys pyjamas").',
  });
  infoWs.addRow({
    setting: 'SKU',
    values: 'Text (e.g. DKUC-BSUT-168--18-24 months)',
    desc: 'Original inventory SKU. Ad Group ID is automatically derived cleanly (e.g. BSUT-168--18-24 months).',
  });
  infoWs.addRow({
    setting: 'Daily_Budget',
    values: 'Number in INR ₹ (e.g. 500.00)',
    desc: 'Daily budget for the Amazon Sponsored Products campaign in Indian Rupees (₹).',
  });
  infoWs.addRow({
    setting: 'Default_Bid',
    values: 'Number in INR ₹ (e.g. 15.00)',
    desc: 'Default CPC bid in INR (₹) for auto targets or keyword match types.',
  });
  infoWs.addRow({
    setting: 'Ad_Group_Default_Bid',
    values: 'Optional number in INR ₹ (e.g. 7.50); leave blank to use dashboard value',
    desc: 'Optional per-SKU override for the Ad Group Default Bid. The dashboard Ad Group Default Bid is used when this column is blank. Exported Ad Group rows use the selected value.',
  });
  infoWs.addRow({
    setting: 'Ad Group ID Derivation',
    values: 'Automatic Clean Extraction',
    desc: 'Prefixes like DKUC- or D- are stripped cleanly to match Amazon SKU structure (e.g. BSUT-168--18-24 months). No weird symbols.',
  });

  // Write workbook to buffer and initiate download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amazon_sku_campaign_template_dropdown.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads standard CSV template with Season, Franchise, Character, and Product_Type columns.
 */
export function downloadCsvTemplate(): void {
  const sampleCsv = `SKU,Campaign_Type,Daily_Budget,Default_Bid,Brand,Product_Type,Season,Franchise_Collab,Character,Audience,ASIN,Ad_Group_Default_Bid
DKUC-TPSET-501--4-5 years,BOTH,500.00,15.00,KUCHIPOO,T-Shirts and Pyjamas Set,All Season,Marvel,Spider-Man,Boys,B0CXYZSP501,
DKUC-SSET-502--3-4 years,BOTH,500.00,14.00,KUCHIPOO,Shorts Set,Summer,Disney,Mickey Mouse,Boys,B0CXYZMK502,
DKUC-HOD-242--13 to 14Years,BOTH,500.00,15.00,KUCHIPOO,Hoddies,Winter,Marvel,Iron Man,Boys,B0CHXYZ1314,
DKUC-SWTR-301--5-6 years,BOTH,500.00,15.00,KUCHIPOO,Sweaters,Winter,None (Only Kuchipoo),None,Girls,B0CSWTR301,
DKUC-CRG-168--6-7 years,BOTH,500.00,14.00,KUCHIPOO,Cargo Pants,All Season,None (Only Kuchipoo),None,Boys,B0CCRG168,
DKUC-VLVT-801--2-3 years,BOTH,500.00,16.00,KUCHIPOO,Velvet clothing Set,Winter,Disney,Frozen / Elsa,Girls,B0CVLVT801,
DKUC-VTP-802--3-4 years,BOTH,500.00,16.00,KUCHIPOO,Velvet T-Shirts and Pyjamas Set,Winter,Marvel,Spider-Man,Boys,B0CVTP802,
DKUC-VZH-803--5-6 years,BOTH,500.00,17.00,KUCHIPOO,Velve ZIP HODDIE AND PYJAMAS set,Winter,None (Only Kuchipoo),None,Boys,B0CVZH803,
DKUC-VHP-804--4-5 years,BOTH,500.00,16.00,KUCHIPOO,Velvel HODDE AND PYJAMAS,Winter,Disney,Mickey Mouse,Boys,B0CVHP804,
DKUC-ROMP-112--6-12 months,BOTH,500.00,12.00,KUCHIPOO,Rompers,Summer,None (Only Kuchipoo),None,Unisex Baby,B0CROMP112,`;
  downloadBlob(sampleCsv, 'amazon_sku_campaign_template_inr.csv', 'text/csv;charset=utf-8;');
}

/**
 * Parses an Excel (.xlsx or .xls) file buffer into CSV-style line strings
 * so users can upload Excel files directly.
 */
export async function parseExcelFileToLines(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const csvText = XLSX.utils.sheet_to_csv(worksheet);
  return csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}
