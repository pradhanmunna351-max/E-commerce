
import React from 'react';
import { Level, Region, ReverseLogisticsMode, ArticleType, BusinessBuffers, Marketplace, Brand } from '../types';
import { ARTICLE_SPECIFICATIONS } from '../constants';

interface CalculatorFormProps {
  marketplace: Marketplace;
  setMarketplace: (val: Marketplace) => void;
  brand: Brand;
  setBrand: (val: Brand) => void;
  articleType: ArticleType;
  setArticleType: (val: ArticleType) => void;
  tpPrice: number;
  setTpPrice: (val: number) => void;
  targetSettlement: number;
  setTargetSettlement: (val: number) => void;
  level: Level;
  setLevel: (val: Level) => void;
  isReverse: boolean;
  setIsReverse: (val: boolean) => void;
  reverseRegion: Region;
  setReverseRegion: (val: Region) => void;
  reverseMode: ReverseLogisticsMode;
  setReverseMode: (val: ReverseLogisticsMode) => void;
  reversePercent: number;
  setReversePercent: (val: number) => void;
  buffers: BusinessBuffers;
  setBuffers: (val: BusinessBuffers) => void;
  ajioTradeDiscount: number;
  setAjioTradeDiscount: (val: number) => void;
  ajioMargin: number;
  setAjioMargin: (val: number) => void;
  manualRateCardActive?: boolean;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({
  marketplace,
  setMarketplace,
  brand,
  setBrand,
  articleType,
  setArticleType,
  tpPrice,
  setTpPrice,
  targetSettlement,
  setTargetSettlement,
  level,
  setLevel,
  buffers,
  setBuffers,
  ajioTradeDiscount,
  setAjioTradeDiscount,
  ajioMargin,
  setAjioMargin,
  manualRateCardActive
}) => {
  const handleArticleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ArticleType;
    setArticleType(newType);
    const spec = ARTICLE_SPECIFICATIONS[newType];
    if (spec) setLevel(spec.defaultLevel);
  };

  const updateBuffer = (key: keyof BusinessBuffers, val: number) => {
    setBuffers({ ...buffers, [key]: val });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-forest-accent shadow-lg ring-1 ring-inset ring-white/60 space-y-4 dark:bg-forest-pine/40 dark:border-forest-leaf/30 relative overflow-hidden group">
      <div className="relative z-10 flex items-center justify-between border-b border-forest-accent/50 pb-3 dark:border-forest-leaf/20">
        <h2 className="text-[9px] font-black text-forest-pine uppercase tracking-widest dark:text-forest-mint">Configuration</h2>
        <div className="flex bg-forest-accent/30 p-0.5 rounded-lg shadow-inner dark:bg-forest-leaf/20">
          {[Marketplace.MYNTRA, Marketplace.AJIO].map(m => (
            <button 
              key={m}
              onClick={() => setMarketplace(m)}
              className={`px-3 py-1 text-[8px] font-black uppercase rounded transition-all ${marketplace === m ? 'bg-forest-pine text-white shadow-sm dark:bg-forest-leaf' : 'text-forest-pine/40 hover:text-forest-pine dark:text-forest-sage/60'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      
      {manualRateCardActive && marketplace === Marketplace.MYNTRA && (
        <div className="relative z-10 px-2 py-1 bg-amber-50 border border-amber-200 rounded flex items-center gap-1.5 dark:bg-amber-900/20 dark:border-amber-800/40">
          <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
          <span className="text-[7px] font-black text-amber-700 uppercase dark:text-amber-400">Manual Card Active</span>
        </div>
      )}

      <div className="relative z-10 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {marketplace === Marketplace.MYNTRA && (
            <div className="space-y-1">
              <label className="text-[8px] font-black text-forest-leaf uppercase block dark:text-forest-sage">Partner Brand</label>
              <div className="relative">
                <select 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as Brand)}
                  className="w-full pl-2 pr-6 py-1.5 bg-white border border-forest-accent rounded-lg font-bold text-xs text-gray-900 outline-none focus:border-forest-leaf appearance-none cursor-pointer dark:bg-white dark:border-forest-leaf/40 shadow-sm"
                >
                  {Object.values(Brand).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-forest-leaf opacity-40">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          )}

          <div className={`space-y-1 ${marketplace !== Marketplace.MYNTRA ? 'col-span-2' : ''}`}>
            <label className="text-[8px] font-black text-forest-leaf uppercase block dark:text-forest-sage">Article Type</label>
            <div className="relative">
              <select 
                value={articleType}
                onChange={handleArticleChange}
                disabled={marketplace === Marketplace.AJIO}
                className="w-full pl-2 pr-6 py-1.5 bg-white border border-forest-accent rounded-lg font-bold text-xs text-gray-900 outline-none focus:border-forest-leaf disabled:opacity-40 appearance-none cursor-pointer dark:bg-white dark:border-forest-leaf/40 shadow-sm"
              >
                {Object.values(ArticleType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-forest-leaf opacity-40">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {marketplace === Marketplace.AJIO && (
          <div className="grid grid-cols-2 gap-3 bg-forest-accent/5 p-3 rounded-xl border border-forest-accent/30 dark:bg-forest-leaf/5 shadow-inner">
             <div className="space-y-0.5">
              <label className="text-[7px] font-black text-forest-leaf uppercase block dark:text-forest-sage opacity-60">Trade %</label>
              <input
                type="number"
                value={ajioTradeDiscount}
                onChange={(e) => setAjioTradeDiscount(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-forest-accent rounded font-black text-xs text-forest-pine outline-none focus:border-forest-leaf dark:bg-forest-pine/60 dark:text-forest-mint shadow-inner"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[7px] font-black text-forest-leaf uppercase block dark:text-forest-sage opacity-60">Margin %</label>
              <input
                type="number"
                value={ajioMargin}
                onChange={(e) => setAjioMargin(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-forest-accent rounded font-black text-xs text-forest-pine outline-none focus:border-forest-leaf dark:bg-forest-pine/60 dark:text-forest-mint shadow-inner"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[8px] font-black text-forest-leaf uppercase tracking-widest block dark:text-forest-sage">Manufacturing Cost (TP)</label>
          <div className="relative group/input">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-pine font-black text-lg opacity-20 dark:text-forest-mint">₹</span>
            <input
              type="number"
              value={tpPrice || ''}
              onChange={(e) => setTpPrice(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2 bg-white border border-forest-accent rounded-xl font-black text-xl text-forest-pine outline-none focus:border-forest-leaf transition-all shadow-inner dark:bg-forest-pine/60 dark:border-forest-leaf/40 dark:text-forest-mint"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="p-4 bg-forest-accent/10 rounded-xl border border-forest-accent/30 space-y-3 dark:bg-forest-leaf/10 dark:border-forest-leaf/20 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-forest-leaf rounded-full shadow-sm"></span>
            <h3 className="text-[8px] font-black text-forest-leaf uppercase tracking-widest dark:text-forest-sage">Margin Buffers</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(buffers).map((key) => (
              <div key={key} className="space-y-0.5">
                <label className="text-[7px] font-black text-forest-leaf/40 uppercase dark:text-forest-sage/40">{key.replace('Percent','').replace('Margin',' MARGIN')}</label>
                <div className="relative">
                   <input 
                    type="number" 
                    value={(buffers as any)[key]} 
                    onChange={(e) => updateBuffer(key as keyof BusinessBuffers, Number(e.target.value))} 
                    className="w-full px-2 py-1 bg-white border border-forest-accent rounded font-black text-xs text-forest-pine outline-none focus:border-forest-leaf shadow-sm dark:bg-forest-pine/60 dark:border-forest-leaf/40 dark:text-forest-mint" 
                  />
                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-leaf/20 font-black text-[8px]">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-forest-pine p-4 rounded-2xl flex flex-col gap-1 shadow-lg border border-white/20 dark:bg-forest-leaf/80 relative overflow-hidden">
          <label className="text-[7px] font-black text-forest-accent uppercase tracking-widest opacity-60">Global Settlement Goal</label>
          <div className="relative flex items-center">
            <span className="text-white/40 font-black text-lg mr-1">₹</span>
            <input
              type="number"
              value={targetSettlement}
              onChange={(e) => setTargetSettlement(Number(e.target.value))}
              className="bg-transparent border-none outline-none text-2xl font-black text-white tracking-tighter italic w-full"
              placeholder="0.00"
            />
            <div className="bg-white/10 px-2 py-1 rounded-lg border border-white/10">
              <span className="text-[7px] font-black text-white uppercase">Target</span>
            </div>
          </div>
        </div>

        {marketplace === Marketplace.MYNTRA && (
          <div className="space-y-2 pt-1 border-t border-forest-accent/20 dark:border-forest-leaf/20">
            <label className="text-[8px] font-black text-forest-leaf uppercase block tracking-widest dark:text-forest-sage">Logistics Tier</label>
            <div className={`grid grid-cols-5 gap-1.5 transition-all ${manualRateCardActive ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
              {Object.values(Level).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`py-1.5 text-[9px] font-black rounded border transition-all ${
                    level === l ? 'bg-forest-leaf text-white border-forest-leaf shadow-sm' : 'bg-white text-forest-pine/40 border-forest-accent dark:bg-forest-pine/40 dark:border-forest-leaf/20'
                  }`}
                >
                  {l.replace('Level ', 'L')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorForm;
