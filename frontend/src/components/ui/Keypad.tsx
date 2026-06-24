import { Delete } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { motion } from 'framer-motion';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function Keypad({ onKeyPress, onDelete, onNext, nextLabel = 'Next', nextDisabled = false }: KeypadProps) {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '.', '0'
  ];

  return (
    <div className="w-full bg-surface-raised border-t border-border p-4 pb-8 sm:pb-4 select-none touch-manipulation">
      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {keys.map((key) => (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.92, fontWeight: 900, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              onClick={(e) => { e.preventDefault(); onKeyPress(key); }}
              className="h-14 text-2xl font-medium text-text-primary bg-surface rounded-xl flex items-center justify-center transition-colors"
            >
              <span className="nums">{key}</span>
            </motion.button>
          ))}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="h-14 text-text-secondary bg-surface rounded-xl flex items-center justify-center transition-colors"
          >
            <Delete size={24} />
          </motion.button>
        </div>
        
        <div className="col-span-1">
          <motion.button
            type="button"
            whileTap={!nextDisabled ? { scale: 0.92 } : {}}
            onClick={(e) => { e.preventDefault(); if(!nextDisabled) onNext(); }}
            disabled={nextDisabled}
            className={cn(
              "w-full h-full text-[15px] font-bold rounded-xl flex items-center justify-center transition-colors",
              nextDisabled 
                ? "bg-surface text-text-secondary/50" 
                : "bg-accent text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            )}
          >
            {nextLabel}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
