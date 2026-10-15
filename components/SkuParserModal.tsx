import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Check, 
  Plus, 
  Trash2, 
  Sliders, 
  Code2, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Upload
} from 'lucide-react';
import { ProductSKU, SkuParserSettings } from '../types';
import { extractRawSuffix, parseAndNormalizeSize } from '../utils/skuParser';

interface SkuParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  parserSettings: SkuParserSettings;
  onSaveParserSettings: (settings: SkuParserSettings) => void;
  catalog: ProductSKU[];
  onAddSku: (sku: ProductSKU) => void;
  onDeleteSku: (id: string) => void;
  onOpenUploadModal: () => void;
}

export const SkuParserModal: React.FC<SkuParserModalProps> = ({
  isOpen,
  onClose,
  parserSettings,
  onSaveParserSettings,
  catalog,
  onAddSku,
  onDeleteSku,
  onOpenUploadModal,
}) => {
  const [localSettings, setLocalSettings] = useState<SkuParserSettings>({ ...parserSettings });
  const [testSkuInput, setTestSkuInput] = useState<string>('KUC-HOD-242--13 to 14Years');
  
  // New SKU quick add form state
  const [newSku, setNewSku] = useState('');
  const [newBrand, setNewBrand] = useState('KUCHIPOO');
  const [newProductType, setNewProductType] = useState('hoodie');
  const [newAudience, setNewAudience] = useState<'Boys' | 'Girls' | 'Unisex Baby' | 'Kids' | 'Toddler' | 'Men' | 'Women'>('Boys');
  const [newCharacter, setNewCharacter] = useState('');
  const [newSynonyms, setNewSynonyms] = useState('sweatshirt, pullover');

  if (!isOpen) return null;

  // Live test preview
  const testExtraction = extractRawSuffix(testSkuInput, localSettings);
  const testParsed = parseAndNormalizeSize(testExtraction.suffix);

  const handleSaveSettings = () => {
    onSaveParserSettings(localSettings);
    onClose();
  };

  const handleCreateSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim()) return;

    const { prefix, suffix } = extractRawSuffix(newSku, localSettings);
    const parsedSize = parseAndNormalizeSize(suffix);
    const designId = prefix || newSku.split('--')[0] || 'DESIGN-01';

    const item: ProductSKU = {
      id: `sku-custom-${Date.now()}`,
      sku: newSku.trim(),
      designId,
      brand: newBrand.trim() || 'BRAND',
      productType: newProductType.trim() || 'item',
      productSynonyms: newSynonyms.split(',').map((s) => s.trim()).filter(Boolean),
      audience: newAudience,
      characterFranchise: newCharacter.trim() || undefined,
      parsedSize,
      targetProductGroup: 'Custom Imports',
      basePrice: 19.99,
    };

    onAddSku(item);
    setNewSku('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Configurable SKU Parser & Size Normalizer
              </h2>
              <p className="text-xs text-slate-400">
                Rule-based extraction of age, months, and sizing suffixes from product SKUs
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Parser Configuration & Live Interactive Sandbox */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            {/* Parser Config */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                Delimiter Rules
              </h3>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Primary SKU Delimiter (e.g. <code className="text-orange-400">--</code>)
                </label>
                <input
                  type="text"
                  value={localSettings.delimiter}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, delimiter: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono"
                  placeholder="--"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Example: <code className="text-slate-300">KUC-HOD-242--13 to 14Years</code> splits at <code className="text-orange-400 font-bold">--</code>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useFallbackDelimiters"
                  checked={localSettings.useFallbackDelimiters}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      useFallbackDelimiters: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 text-orange-500 bg-slate-900"
                />
                <label htmlFor="useFallbackDelimiters" className="text-xs text-slate-300 cursor-pointer">
                  Use fallback size detectors (<code className="text-slate-400">__</code>, <code className="text-slate-400">_</code>, <code className="text-slate-400">-</code>) if primary delimiter is missing
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Custom Suffix Regex (Optional)
                </label>
                <input
                  type="text"
                  value={localSettings.customRegex || ''}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, customRegex: e.target.value })
                  }
                  placeholder="--([A-Za-z0-9\s]+)$"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            {/* Live Interactive Parser Sandbox */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Live SKU Parser Tester
              </h3>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Type any SKU format to test parsing:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testSkuInput}
                    onChange={(e) => setTestSkuInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                    placeholder="Enter SKU..."
                  />
                </div>
              </div>

              {/* Parsed Output Details */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Extracted Raw Suffix:</span>
                  <span className="font-mono font-bold text-amber-400">
                    "{testExtraction.suffix || 'None'}"
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Normalized Display:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {testParsed.normalizedDisplay}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Canonical Form:</span>
                  <span className="font-mono text-blue-400">
                    "{testParsed.canonicalForm}"
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Detected Age Range / Unit:</span>
                  <span className="font-mono text-purple-300">
                    {testParsed.minAge} to {testParsed.maxAge} {testParsed.unit} (Infant: {testParsed.isInfant ? 'Yes' : 'No'})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Normalized Alternates:</span>
                  <div className="flex flex-wrap gap-1">
                    {testParsed.alternateForms.map((alt, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick sample chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-400">
                <span>Presets:</span>
                {[
                  'KUC-HOD-242--13 to 14Years',
                  'KUC-BSUT-101--0 to 3Months',
                  'KUC-PSUT-291--5 to 6Years',
                  'KUC-TSH-900--2T',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTestSkuInput(s)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 transition-colors"
                  >
                    {s.split('--')[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Manage Active Catalog SKUs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Active Catalog SKUs ({catalog.length})
              </h3>
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload SKU File (CSV/TXT)
              </button>
            </div>

            {/* Add New SKU Form */}
            <form
              onSubmit={handleCreateSku}
              className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 mb-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end"
            >
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-300 block mb-1">
                  New SKU (Include <code className="text-orange-400">--Size</code>)
                </label>
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="KUC-HOD-242--9 to 10Years"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Brand</label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Product Type</label>
                <input
                  type="text"
                  value={newProductType}
                  onChange={(e) => setNewProductType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Audience</label>
                <select
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100"
                >
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Unisex Baby">Unisex Baby</option>
                  <option value="Kids">Kids</option>
                  <option value="Toddler">Toddler</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add SKU
                </button>
              </div>
            </form>

            {/* Catalog Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Original SKU</th>
                    <th className="px-3 py-2">Design ID</th>
                    <th className="px-3 py-2">Audience & Type</th>
                    <th className="px-3 py-2">Parsed Size</th>
                    <th className="px-3 py-2">Character</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
                  {catalog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2 text-slate-200 font-semibold">{item.sku}</td>
                      <td className="px-3 py-2 text-orange-400">{item.designId}</td>
                      <td className="px-3 py-2 font-sans text-slate-300">
                        {item.audience} {item.productType}
                      </td>
                      <td className="px-3 py-2 text-emerald-400">
                        {item.parsedSize.normalizedDisplay}
                      </td>
                      <td className="px-3 py-2 font-sans text-slate-400">
                        {item.characterFranchise || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => onDeleteSku(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <span className="text-xs text-slate-400">
            Rules apply immediately across all size keyword generation templates.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Apply Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
