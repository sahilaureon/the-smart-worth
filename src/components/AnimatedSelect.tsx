import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const AnimatedSelect = ({ 
  label, 
  value, 
  options, 
  onSelect, 
  placeholder,
  subTitle,
  isOpen,
  onOpen,
  onClose,
  loading = false,
  disabled = false,
  error = false,
  errorMessage,
  size = 'md'
}: { 
  label: string, 
  value: string, 
  options: { label: string, value: string }[], 
  onSelect: (val: string) => void,
  placeholder: string,
  subTitle?: string,
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
  loading?: boolean,
  disabled?: boolean,
  error?: boolean,
  errorMessage?: string,
  size?: 'sm' | 'md'
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset search when closed
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <div className={cn("space-y-1.5", size === 'sm' && "space-y-1")}>
      {label && (
        <label className={cn(
          "text-xs font-black text-[#0A0E27] uppercase tracking-wider ml-1",
          size === 'sm' && "text-[10px]"
        )}>{label}</label>
      )}
      <button
        type="button"
        onClick={onOpen}
        disabled={loading || disabled}
        className={cn(
          "w-full px-4 py-3 rounded-xl bg-[#F8FAFF] border flex items-center justify-between transition-all text-sm font-medium",
          size === 'sm' && "py-2 px-3 rounded-lg text-xs",
          error ? "border-red-500" : "border-gray-100",
          value ? "text-[#0A0E27]" : "text-gray-400",
          (loading || disabled) && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2">
          {loading && (
            <div className={cn("w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin", size === 'sm' && "w-3 h-3 border-[1.5px]")} />
          )}
          <span>{loading ? "Loading..." : (selectedOption ? selectedOption.label : placeholder)}</span>
        </div>
        <ChevronRight size={size === 'sm' ? 14 : 16} className={cn("transition-transform duration-300", isOpen ? "rotate-90" : "rotate-0")} />
      </button>

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={cn(
            "field-error-message flex items-center space-x-1 mt-1.5 text-red-500 text-[11px] font-bold ml-1",
            size === 'sm' && "mt-1 text-[10px]"
          )}
        >
          <AlertCircle size={size === 'sm' ? 10 : 12} className="shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]"
            />
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[1001] h-[85vh] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
            >
              <div className="p-6 border-b border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-lg font-black text-[#0A0E27] tracking-tight">{placeholder}</h4>
                    {subTitle && (
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">{subTitle}</p>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={onClose} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={label ? `Search ${label.toLowerCase()}...` : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelect(opt.value);
                        onClose();
                      }}
                      className={cn(
                        "w-full p-4 rounded-2xl flex items-center justify-between transition-all group",
                        value === opt.value 
                          ? "bg-blue-50 text-[#0061FF]" 
                          : "hover:bg-gray-50 text-gray-600"
                      )}
                    >
                      <span className={cn("font-bold", value === opt.value ? "text-lg" : "text-base")}>
                        {opt.label}
                      </span>
                      {value === opt.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-[#0061FF] rounded-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </motion.div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-400 font-bold">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
