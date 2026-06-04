"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export default function ReactorKnob({ initialValue = 0, onSave, loading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localDisplay, setLocalDisplay] = useState(0);
  const lastSyncedValue = useRef(initialValue);
  const svgRef = useRef(null);

  // Animate from 0 to initialValue on mount
  useEffect(() => {
    if (initialValue !== lastSyncedValue.current || initialValue >= 0) {
      let start = 0;
      const end = initialValue;
      const duration = 1000;
      const startTime = performance.now();

      const animateProgress = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutQuart)
        const ease = 1 - Math.pow(1 - progress, 4);
        
        setLocalDisplay(Math.round(start + (end - start) * ease));

        if (progress < 1) {
          requestAnimationFrame(animateProgress);
        }
      };

      requestAnimationFrame(animateProgress);
      lastSyncedValue.current = initialValue;
    }
  }, [initialValue]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updateProgressFromEvent(e);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

  const updateProgressFromEvent = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    const progress = Math.min(100, Math.max(0, Math.round((angle / 360) * 100)));
    setLocalDisplay(progress);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => updateProgressFromEvent(e);
    
    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, updateProgressFromEvent]);

  // SVG dimensions and math
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (localDisplay / 100) * circumference;

  const isDirty = localDisplay !== initialValue;

  return (
    <div className="flex flex-col gap-4">
      {/* The Compact Card matching the screenshot */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-md p-5 shadow-lg w-full max-w-sm flex flex-col justify-between relative overflow-hidden group">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={14} className="text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-400 tracking-[0.15em] uppercase">
            Progress
          </span>
        </div>

        {/* Content */}
        <div className="flex items-center gap-6">
          
          {/* Interactive Ring */}
          <div 
            className="relative w-20 h-20 flex-shrink-0 cursor-pointer"
            onPointerDown={handlePointerDown}
            title="Drag to adjust progress"
          >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <svg 
              ref={svgRef}
              width={size} 
              height={size} 
              className={cn("transform -rotate-90 transition-transform duration-200", isDragging ? "scale-105" : "hover:scale-105")}
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#27272a" // zinc-800
                strokeWidth={strokeWidth}
              />
              {/* Foreground Progress */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#a855f7" // purple-500
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-75 ease-linear"
              />
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-white tabular-nums">{localDisplay}%</span>
            </div>
          </div>

          {/* Right Text */}
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white tabular-nums leading-none tracking-tight">
              {localDisplay}%
            </span>
            <span className="text-sm text-zinc-500 font-medium mt-1">
              Complete
            </span>
          </div>
        </div>
      </div>

      {/* Save Button (Only visible when changed) */}
      <div className="h-10">
        <AnimatePresence>
          {isDirty && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={() => onSave(localDisplay)}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 active:scale-95 w-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Sync Data</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
