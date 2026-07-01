
import React from 'react';
import { Icons } from '../constants';
import Logo from './Logo';
import { Category } from '../types';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (cat: Category) => void;
  onAdminClick: () => void;
  activeCategory: Category;
}

const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose, onCategorySelect, onAdminClick, activeCategory }) => {
  return (
    <>
      {/* Overlay - Z-index below header */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer - responsive width - Z-index below header (70 vs 80) */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] xs:w-[320px] sm:w-[380px] bg-white z-[70] shadow-2xl transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col pt-[85px] md:pt-[110px]">
          {/* Header area is empty because it's now covered by the main App header */}

          <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-6">
            {/* Search (Mobile Only) */}
            <div className="md:hidden mb-8">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">बातम्या शोधा</h4>
               <div className="relative">
                 <input 
                  type="text" 
                  placeholder="येथे शोधा..." 
                  className="w-full bg-gray-50 border border-gray-100 rounded-sm py-3 px-4 text-sm outline-none focus:border-[#E31E24]"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                   <Icons.Search />
                 </div>
               </div>
            </div>

            {/* Categories Grid - Better Auto-fit */}
            <div className="mb-10">
              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-3 h-[2px] bg-[#E31E24]"></span>
                श्रेणी (Categories)
              </h4>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {Object.values(Category).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                        onCategorySelect(cat);
                        onClose();
                    }}
                    className={`group flex items-center py-3 px-3 rounded-sm border transition-all text-left ${
                      activeCategory === cat 
                      ? 'bg-[#E31E24] border-[#E31E24] text-white shadow-md' 
                      : 'bg-gray-50 border-gray-50 hover:border-[#E31E24] text-gray-700'
                    }`}
                  >
                    <span className="text-[11px] md:text-[12px] font-extrabold uppercase tracking-tight leading-tight">
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="mb-10">
              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-3 h-[2px] bg-[#E31E24]"></span>
                इतर दुवे
              </h4>
              <div className="space-y-1.5">
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-sm transition-all group">
                   <span className="text-[10px] font-bold uppercase tracking-widest italic">माझे खाते</span>
                   <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
                <button 
                  onClick={onAdminClick}
                  className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-[#E31E24] hover:text-white rounded-sm transition-all group"
                >
                   <span className="text-[10px] font-bold uppercase tracking-widest italic text-[#E31E24] group-hover:text-white">Admin Portal</span>
                   <span className="opacity-0 group-hover:opacity-100 transition-opacity">🔐</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-sm transition-all group">
                   <span className="text-[10px] font-bold uppercase tracking-widest italic">संपर्क</span>
                   <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarDrawer;
