import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, Globe } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const scheduleButtonVariants = cva(
  'relative isolate inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 focus:outline-none disabled:pointer-events-none disabled:opacity-50 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900/40 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/50',
        selected: 'text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const getWeekDays = (startDate) => {
  const days = [];
  const startOfWeek = new Date(startDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  for (let i = 0; i < 6; i++) {
    const nextDay = new Date(startOfWeek);
    nextDay.setDate(startOfWeek.getDate() + i);
    days.push(nextDay);
  }
  return days;
};

export const DeliveryScheduler = ({
  initialDate = new Date(),
  timeSlots = [],
  timeZone = "GMT +0",
  onSchedule,
  onCancel,
  className,
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(null);
  
  const weekDays = getWeekDays(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };
  
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const changeWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };
  
  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      onSchedule({ date: selectedDate, time: selectedTime });
    }
  };

  return (
    <div className={cn('w-full rounded-[2.5rem] border border-zinc-800/50 bg-zinc-950/40 backdrop-blur-2xl p-7 text-zinc-100 shadow-2xl overflow-hidden relative group', className)}>
      {/* Dynamic Background Accents */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 blur-[120px] pointer-events-none group-hover:bg-indigo-600/15 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 blur-[120px] pointer-events-none group-hover:bg-purple-600/15 transition-all duration-700" />

      <div className="space-y-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 ml-1">
            <Calendar size={12} className="animate-pulse" />
            <span>Select Delivery Window</span>
          </div>
          <div className="flex items-center justify-between">
            <motion.h3 
              key={monthYear}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-black bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
            >
              {monthYear}
            </motion.h3>
            <div className="flex items-center p-1.5 bg-zinc-900/80 border border-zinc-800/50 rounded-2xl shadow-inner">
              <button type="button" onClick={() => changeWeek('prev')} className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all duration-300 active:scale-90">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="w-[1px] h-4 bg-zinc-800/50 mx-1.5" />
              <button type="button" onClick={() => changeWeek('next')} className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all duration-300 active:scale-90">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Day Selection Grid */}
        <div className="grid grid-cols-6 gap-4">
          {weekDays.map((day) => {
            const isSelected = selectedDate.toDateString() === day.toDateString();
            const isToday = new Date().toDateString() === day.toDateString();
            
            return (
              <div key={day.toISOString()} className="flex flex-col items-center gap-4">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <button
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    scheduleButtonVariants({ variant: isSelected ? 'selected' : 'default' }),
                    'h-14 w-14 flex-shrink-0 group/day',
                    isToday && !isSelected && 'border-indigo-500/40 text-indigo-400'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="date-highlight"
                      className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-[0_8px_20px_rgba(79,70,229,0.4)]"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 text-sm font-black transition-transform duration-300 group-active/day:scale-90">{day.getDate()}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Time Selection Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between ml-1">
             <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
               <Clock size={12} />
               <span>Available Slots</span>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 px-3 py-1.5 bg-zinc-900/60 rounded-full border border-zinc-800/50 backdrop-blur-sm">
               <Globe size={10} className="text-indigo-400" />
               <span>{timeZone}</span>
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <button
                  type="button"
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={cn(
                    scheduleButtonVariants({ variant: isSelected ? 'selected' : 'default' }), 
                    'py-4 group/time'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="time-highlight"
                      className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-[0_8px_15px_rgba(79,70,229,0.3)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 text-xs font-black tracking-widest uppercase transition-transform duration-300 group-active/time:scale-95">{time}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-5 pt-8 border-t border-zinc-800/50">
           <button 
             type="button" 
             onClick={onCancel} 
             className="px-6 py-3 text-xs font-black text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
           >
             Cancel
           </button>
           <button 
             type="button" 
             onClick={handleSchedule} 
             disabled={!selectedTime}
             className="group/btn relative px-8 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-black rounded-2xl transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_35px_rgba(255,255,255,0.2)] disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.2em] overflow-hidden"
           >
             <span className="relative z-10">Select Slot</span>
             <motion.div 
               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"
               style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
             />
           </button>
        </div>
      </div>
    </div>
  );
};
