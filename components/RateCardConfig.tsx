
import React, { useState, useRef } from 'react';
import { ManualRateCard, ManualRateRule, ArticleType, Brand, Gender } from '../types';

// PDF.js will be loaded from CDN
declare const pdfjsLib: any;

interface RateCardConfigProps {
  manualRateCard: ManualRateCard;
  setManualRateCard: (val: ManualRateCard) => void;
}

const RateCardConfig: React.FC<RateCardConfigProps> = ({ manualRateCard, setManualRateCard }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [brandFilter, setBrandFilter] = useState<Brand | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMMISSION' | 'FIXED_FEE'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleEnabled = () => {
    setManualRateCard({ ...manualRateCard, enabled: !manualRateCard.enabled });
  };

  const loadPdfJs = async () => {
    if (typeof pdfjsLib !== 'undefined') return pdfjsLib;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any)['pdfjs-dist/build/pdf'];
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const allNewRules: ManualRateRule[] = [];
    
    try {
      const pdfjs: any = await loadPdfJs();

      for (let f = 0; f < files.length; f++) {
        const file = files[f];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // Sort items by Y (descending) then X (ascending) to get reading order
          const items = textContent.items.sort((a: any, b: any) => {
            if (Math.abs(a.transform[5] - b.transform[5]) < 2) {
              return a.transform[4] - b.transform[4];
            }
            return b.transform[5] - a.transform[5];
          });
          const pageText = items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }

        // Helper to match brand names robustly
        const findBrand = (str: string): Brand | 'ALL' => {
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedInput = normalize(str);
          return (Object.values(Brand).find(b => normalize(b) === normalizedInput) as Brand) || 'ALL';
        };

        // 1. Extract Commission Rules
        // Look for the section starting with "Platform Commission"
        const commStartIdx = fullText.search(/Platform\s+Commission/i);
        const fixedFeeStartIdx = fullText.search(/2\.\s+Fixed\s+Fee/i);
        
        const commSection = fullText.substring(
          commStartIdx !== -1 ? commStartIdx : 0, 
          fixedFeeStartIdx !== -1 ? fixedFeeStartIdx : fullText.length
        );

        // Pattern: Brand Category Article Gender Lower Upper "Split Commission and Logistics" Value %
        // We use a more flexible regex to capture brand names and article types
        const commRegex = /([A-Z0-9\-\s]{2,30}?)\s+(Apparel|ALL)\s+(.+?)\s+(Men|Women|Unisex|ALL)\s+(\d+)\s+(\d+)\s+Split\s+Commission\s+and\s+Logistics\s+([\d.]+)\s*%/gi;
        let match;
        while ((match = commRegex.exec(commSection)) !== null) {
          const [_, brandStr, cat, articleStr, genderStr, lowerStr, upperStr, rateStr] = match;
          let lower = parseFloat(lowerStr);
          let upper = parseFloat(upperStr);
          if (upper > 0 && upper < 1000000 && (upper % 10 === 0)) {
            upper = upper - 1;
          }
          
          const brand = findBrand(brandStr);
          const articleType = (Object.values(ArticleType).find(a => a.toLowerCase() === articleStr.trim().toLowerCase()) as ArticleType) || 'ALL';
          const gender = (Object.values(Gender).find(g => g.toLowerCase() === genderStr.trim().toLowerCase()) as Gender) || 'ALL';
          const baseRate = parseFloat(rateStr);
          const rate = parseFloat((baseRate * 1.18).toFixed(2));
          allNewRules.push({ brand, articleType, gender, lowerLimit: lower, upperLimit: upper, rate, type: 'COMMISSION' });
        }

        // 2. Extract Fixed Fee Rules
        // Look for the section starting with "2. Fixed Fee"
        const fixedFeeSection = fixedFeeStartIdx !== -1 ? fullText.substring(fixedFeeStartIdx) : '';
        const marketingStartIdx = fixedFeeSection.search(/Marketing\s+Services\s+Fee/i);
        const fixedFeeTableText = marketingStartIdx !== -1 ? fixedFeeSection.substring(0, marketingStartIdx) : fixedFeeSection;
        
        // Pattern: Brand Category Article Gender Lower Upper Value
        const fixedRegex = /([A-Z0-9\-\s]{2,30}?)\s+(Apparel|ALL)\s+(.+?)\s+(Men|Women|Unisex|ALL)\s+(\d+)\s+(\d+)\s+(\d+)(?!\s*[\d.%])/gi;
        
        while ((match = fixedRegex.exec(fixedFeeTableText)) !== null) {
          const [_, brandStr, cat, articleStr, genderStr, lowerStr, upperStr, feeStr] = match;
          let lower = parseFloat(lowerStr);
          let upper = parseFloat(upperStr);
          if (upper > 0 && upper < 1000000 && (upper % 10 === 0)) {
            upper = upper - 1;
          }
          
          const brand = findBrand(brandStr);
          const articleType = (Object.values(ArticleType).find(a => a.toLowerCase() === articleStr.trim().toLowerCase()) as ArticleType) || 'ALL';
          const gender = (Object.values(Gender).find(g => g.toLowerCase() === genderStr.trim().toLowerCase()) as Gender) || 'ALL';
          const fee = parseFloat(feeStr);
          allNewRules.push({ brand, articleType, gender, lowerLimit: lower, upperLimit: upper, fee, type: 'FIXED_FEE' });
        }
      }

      if (allNewRules.length > 0) {
        setManualRateCard({
          enabled: true,
          rules: allNewRules
        });
        alert(`Successfully imported ${allNewRules.length} rules from ${files.length} PDF(s).`);
      } else {
        alert("No valid rules found in the PDF(s). Please ensure they are standard Myntra CTA documents.");
      }

    } catch (err) {
      console.error(err);
      alert("Error parsing PDF(s). Please ensure they are valid files.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearRules = () => {
    if (window.confirm("Are you sure you want to delete ALL custom rate card rules?")) {
      setManualRateCard({ enabled: false, rules: [] });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4">
      <div className="bg-white p-8 rounded-[3rem] border border-forest-accent shadow-2xl dark:bg-forest-pine/40 dark:border-forest-leaf/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-forest-leaf/5 blur-[100px] pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-forest-accent/50 dark:border-forest-leaf/20">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-forest-pine rounded-3xl flex items-center justify-center text-white shadow-xl dark:bg-forest-leaf rotate-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-forest-pine uppercase tracking-tight dark:text-forest-mint italic">Myntra Rate Card Engine</h2>
              <p className="text-[10px] text-forest-leaf/50 font-black uppercase tracking-[0.3em] mt-1">PDF Matrix Synchronization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-forest-mint/50 p-2.5 rounded-[1.5rem] border border-forest-accent dark:bg-forest-pine/60 shadow-inner">
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 ${manualRateCard.enabled ? 'text-forest-leaf' : 'text-forest-leaf/30'}`}>
                {manualRateCard.enabled ? 'MATRIX ACTIVE' : 'SYSTEM DEFAULT'}
              </span>
              <button 
                onClick={toggleEnabled}
                className={`w-14 h-8 rounded-full relative transition-all shadow-inner border border-black/5 ${manualRateCard.enabled ? 'bg-forest-leaf' : 'bg-forest-accent'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all transform shadow-lg ${manualRateCard.enabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-forest-mint/30 rounded-[2.5rem] border-2 border-dashed border-forest-leaf/30 p-10 flex flex-col items-center justify-center text-center gap-6 group hover:border-forest-leaf transition-all dark:bg-forest-pine/20">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" multiple />
            <div className="w-20 h-20 bg-forest-pine text-white rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all dark:bg-forest-leaf">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-forest-pine dark:text-forest-mint uppercase tracking-widest">Upload Myntra CTA PDF</h3>
              <p className="text-[10px] text-forest-leaf/60 font-bold uppercase tracking-widest max-w-xs mx-auto">Import Myntra Commercial Terms Agreement PDF directly. This will replace the current matrix.</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-10 py-4 bg-forest-pine text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-forest-leaf transition-all disabled:opacity-50"
            >
              {isProcessing ? 'READING PDF...' : 'SELECT PDF FILE'}
            </button>
          </div>

          <div className="bg-forest-mint/30 rounded-[2.5rem] border border-forest-accent p-8 flex flex-col justify-between dark:bg-forest-pine/20">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                <h4 className="text-[10px] font-black text-forest-pine uppercase tracking-widest dark:text-forest-mint">Danger Zone</h4>
              </div>
              <p className="text-[9px] text-forest-leaf/60 font-bold leading-relaxed">Clearing the matrix will revert the calculator to Myntra's standard default commission and fixed fee structures.</p>
            </div>
            <button 
              onClick={clearRules}
              className="w-full py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
            >
              Flush Matrix Data
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
            <h3 className="text-[11px] font-black text-forest-pine uppercase tracking-[0.3em] dark:text-forest-mint">Active Matrix Slabs ({manualRateCard.rules.length})</h3>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Brand Filter */}
              <div className="flex bg-forest-mint/50 p-1 rounded-xl border border-forest-accent dark:bg-forest-pine/60">
                <button 
                  onClick={() => setBrandFilter('ALL')}
                  className={`px-4 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${brandFilter === 'ALL' ? 'bg-forest-pine text-white shadow-md dark:bg-forest-leaf' : 'text-forest-pine/40 hover:text-forest-pine'}`}
                >
                  All Brands
                </button>
                {Object.values(Brand).filter(b => b !== Brand.OTHER).map(b => (
                  <button 
                    key={b}
                    onClick={() => setBrandFilter(b)}
                    className={`px-4 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${brandFilter === b ? 'bg-forest-pine text-white shadow-md dark:bg-forest-leaf' : 'text-forest-pine/40 hover:text-forest-pine'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex bg-forest-mint/50 p-1 rounded-xl border border-forest-accent dark:bg-forest-pine/60">
                <button 
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-4 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${typeFilter === 'ALL' ? 'bg-forest-pine text-white shadow-md dark:bg-forest-leaf' : 'text-forest-pine/40 hover:text-forest-pine'}`}
                >
                  All Types
                </button>
                <button 
                  onClick={() => setTypeFilter('COMMISSION')}
                  className={`px-4 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${typeFilter === 'COMMISSION' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600/40 hover:text-indigo-600'}`}
                >
                  Commission
                </button>
                <button 
                  onClick={() => setTypeFilter('FIXED_FEE')}
                  className={`px-4 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${typeFilter === 'FIXED_FEE' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-600/40 hover:text-emerald-600'}`}
                >
                  Fixed Fee
                </button>
              </div>

              {/* Reset Filters */}
              {(brandFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <button 
                  onClick={() => { setBrandFilter('ALL'); setTypeFilter('ALL'); }}
                  className="px-4 py-1.5 text-[8px] font-black uppercase rounded-lg bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-[2rem] border border-forest-accent dark:border-forest-leaf/20">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-forest-mint/50 dark:bg-forest-pine/60 text-[9px] font-black text-forest-leaf uppercase tracking-widest">
                  <th className="px-6 py-5 text-left">Brand</th>
                  <th className="px-6 py-5 text-left">Article / Gender</th>
                  <th className="px-6 py-5 text-left">Slab Range</th>
                  <th className="px-6 py-5 text-center">Type</th>
                  <th className="px-6 py-5 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-accent/30">
                {manualRateCard.rules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <svg className="w-16 h-16 text-forest-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Matrix Empty • Upload PDF to Begin</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  manualRateCard.rules
                    .filter(r => (brandFilter === 'ALL' || r.brand === brandFilter))
                    .filter(r => (typeFilter === 'ALL' || r.type === typeFilter))
                    .map((rule, idx) => (
                    <tr key={idx} className="group hover:bg-forest-mint/40 transition-all dark:hover:bg-forest-pine/20">
                      <td className="px-6 py-4 font-black text-xs text-forest-pine dark:text-forest-mint uppercase">{rule.brand}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-forest-pine dark:text-forest-mint uppercase">{rule.articleType}</span>
                          <span className="text-[8px] font-bold text-forest-leaf/50 uppercase">{rule.gender}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-white border border-forest-accent rounded-lg text-[10px] font-black text-forest-pine shadow-sm dark:bg-forest-pine dark:text-forest-mint">
                          ₹{rule.lowerLimit} - ₹{rule.upperLimit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${rule.type === 'COMMISSION' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {rule.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-black ${rule.type === 'COMMISSION' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                          {rule.type === 'COMMISSION' ? `${rule.rate}%` : `₹${rule.fee}`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCardConfig;
