import React, { useState } from 'react';
import { Delete, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils.js';

interface AlphabetKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

type KeyboardMode = 'lowercase' | 'uppercase' | 'numbers' | 'symbols';

function KeyButton({ 
  keyChar, 
  onPress, 
  isSpecial = false,
  className = ""
}: { 
  keyChar: string | React.ReactNode, 
  onPress: () => void, 
  isSpecial?: boolean,
  className?: string 
}) {
  const [isActive, setIsActive] = useState(false);
  const isString = typeof keyChar === 'string';
  
  // The popover should only show for actual text characters, not space or special keys
  const showPopover = isActive && isString && keyChar !== ' ' && keyChar !== 'ABC' && keyChar !== '123' && keyChar !== '#+=';

  return (
    <div className={cn("relative flex-1 min-w-0 flex items-end justify-center", className)}>
      <AnimatePresence>
        {showPopover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.2 }}
            className="absolute -top-[120%] left-1/2 -translate-x-1/2 w-[160%] h-[140%] bg-surface-raised rounded-[12px] shadow-[0_10px_20px_rgba(0,0,0,0.3)] border border-border flex items-start pt-2 justify-center text-[28px] font-medium text-text-primary z-50 overflow-hidden pointer-events-none"
          >
            <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-black/20 to-transparent" />
            {keyChar}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          setIsActive(true);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          setIsActive(false);
          onPress();
        }}
        onPointerLeave={() => setIsActive(false)}
        onPointerCancel={() => setIsActive(false)}
        whileTap={{ 
          y: 2, 
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 rgba(0,0,0,0)",
          backgroundColor: isSpecial ? "var(--color-surface-raised)" : "rgba(255,255,255,0.15)"
        }}
        className={cn(
          "w-full h-11 sm:h-12 rounded-[6px] sm:rounded-[8px] flex items-center justify-center transition-colors font-medium text-text-primary select-none touch-manipulation shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_1px_1px_rgba(0,0,0,0.2)]",
          isSpecial ? "bg-surface-raised/80 text-[14px]" : "bg-surface-raised text-[20px]"
        )}
      >
        {keyChar === ' ' ? <span className="text-[14px] opacity-40">space</span> : keyChar}
      </motion.button>
    </div>
  );
}

export function AlphabetKeypad({ 
  onKeyPress, 
  onDelete, 
  onNext, 
  nextLabel = 'Next', 
  nextDisabled = false 
}: AlphabetKeypadProps) {
  const [mode, setMode] = useState<KeyboardMode>('uppercase');

  const layouts = {
    lowercase: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ],
    uppercase: [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ],
    numbers: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
      ['.', ',', '?', '!', '\'']
    ],
    symbols: [
      ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
      ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
      ['.', ',', '?', '!', '\'']
    ]
  };

  const currentLayout = layouts[mode];

  const handleKeyPress = (key: string) => {
    onKeyPress(key);
    if (mode === 'uppercase') {
      setMode('lowercase');
    }
  };

  const toggleShift = () => {
    if (mode === 'lowercase') setMode('uppercase');
    else if (mode === 'uppercase') setMode('lowercase');
    else if (mode === 'numbers') setMode('symbols');
    else if (mode === 'symbols') setMode('numbers');
  };

  const toggleNumbers = () => {
    if (mode === 'lowercase' || mode === 'uppercase') setMode('numbers');
    else setMode('lowercase');
  };

  return (
    <div className="w-full bg-[#111113] border-t border-border p-1.5 pb-8 sm:pb-2 select-none touch-manipulation">
      <div className="max-w-[480px] mx-auto flex flex-col gap-1.5 sm:gap-2 relative z-10">
        
        {/* Row 1 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 w-full">
          {currentLayout[0].map((key) => (
            <KeyButton key={key} keyChar={key} onPress={() => handleKeyPress(key)} />
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 w-full px-[5%]">
          {currentLayout[1].map((key) => (
            <KeyButton key={key} keyChar={key} onPress={() => handleKeyPress(key)} />
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 w-full">
          <KeyButton 
            keyChar={mode === 'lowercase' || mode === 'uppercase' ? <ArrowUp size={20} className={mode === 'uppercase' ? "text-background" : ""} /> : "#+="}
            onPress={toggleShift}
            isSpecial
            className={cn("w-[12%] flex-none", mode === 'uppercase' ? "[&>button]:bg-text-primary" : "")}
          />
          
          <div className="flex flex-1 justify-center gap-1 sm:gap-1.5">
            {currentLayout[2].map((key) => (
              <KeyButton key={key} keyChar={key} onPress={() => handleKeyPress(key)} />
            ))}
          </div>

          <KeyButton 
            keyChar={<Delete size={20} />}
            onPress={onDelete}
            isSpecial
            className="w-[12%] flex-none"
          />
        </div>

        {/* Row 4 (Space bar & Submit) */}
        <div className="flex justify-center gap-1 sm:gap-1.5 w-full">
          <KeyButton 
            keyChar={mode === 'numbers' || mode === 'symbols' ? 'ABC' : '123'}
            onPress={toggleNumbers}
            isSpecial
            className="w-[20%] flex-none"
          />
          
          <KeyButton 
            keyChar=" "
            onPress={() => handleKeyPress(' ')}
            className="flex-1"
          />

          <motion.button
            type="button"
            whileTap={!nextDisabled ? { 
              y: 2, 
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 rgba(0,0,0,0)"
            } : {}}
            onClick={(e) => { e.preventDefault(); if(!nextDisabled) onNext(); }}
            disabled={nextDisabled}
            className={cn(
              "w-[24%] flex-none h-11 sm:h-12 rounded-[6px] sm:rounded-[8px] flex items-center justify-center text-[15px] font-bold transition-all duration-200 select-none touch-manipulation shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_1px_1px_rgba(0,0,0,0.2)]",
              nextDisabled 
                ? "bg-surface-raised/50 text-text-secondary/30" 
                : "bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),_0_0_12px_rgba(79,70,229,0.4)]"
            )}
          >
            {nextLabel}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
