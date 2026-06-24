import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Exercise, Workout } from '../types.js';
import { Edit2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button.js';
import { Modal } from './ui/Modal.js';
import { Keypad } from './ui/Keypad.js';
import { AlphabetKeypad } from './ui/AlphabetKeypad.js';
import { NumberTicker } from './ui/NumberTicker.js';
import { EditExerciseModal } from './modals/EditExerciseModal.js';
import { useExercises, useCreateExercise } from '../features/exercises/api.js';
import { useUpdateWorkout, useDeleteWorkout } from '../features/workouts/api.js';
import { cn } from '../lib/utils.js';

interface ActiveSessionProps {
  userId: string;
  workout: Workout;
  onFinish: () => void;
}

export function ActiveSession({ userId, workout, onFinish }: ActiveSessionProps) {
  const [editingGroup, setEditingGroup] = useState<{ name: string; sets: Exercise[] } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('1');
  const [activeField, setActiveField] = useState<'name' | 'weight' | 'reps' | 'sets' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Clear weight and reps only if user changes the exercise name
  useEffect(() => {
    setWeight('');
    setReps('');
    setSets('1');
  }, [name]);

  // TanStack Query Hooks
  const { data: exercisesData, isLoading: loading, refetch: refetchExercises } = useExercises({ workout_id: workout.id });
  const { data: suggestionsData } = useExercises({ suggestions: true });
  
  const createExerciseMutation = useCreateExercise();
  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();

  const exercises = exercisesData || [];
  const suggestions = useMemo(() => {
    if (!suggestionsData) return [];
    return Array.from(new Set(suggestionsData.map((d: { name: string }) => d.name))) as string[];
  }, [suggestionsData]);

  const hadExercises = React.useRef(false);

  useEffect(() => {
    if (exercises.length > 0) {
      hadExercises.current = true;
    } else if (hadExercises.current && exercises.length === 0) {
      deleteWorkoutMutation.mutate(workout.id, {
        onSuccess: () => onFinish(),
      });
    }
  }, [exercises, workout.id]);

  // Sync editing modal
  useEffect(() => {
    if (editingGroup) {
      const updated = exercises.filter((e: Exercise) => e.name === editingGroup.name);
      if (updated.length === 0) {
        setEditingGroup(null);
      } else {
        setEditingGroup({ name: editingGroup.name, sets: updated });
      }
    }
  }, [exercises]);

  const handleSaveSet = async () => {
    if (!name || !weight || !reps || !sets) return;

    try {
      await createExerciseMutation.mutateAsync({
        workout_id: workout.id,
        name,
        weight: Number(weight),
        reps: Number(reps),
        sets: Number(sets),
      });

      // Completion pulse
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 800);

      // Keep weight and reps populated for quick successive set logging
      setActiveField(null);
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  };

  const handleKeyPress = (key: string) => {
    if (activeField === 'name') {
      setName(prev => prev + key);
    } else if (activeField === 'weight') {
      setWeight(prev => prev.includes('.') && key === '.' ? prev : prev + key);
    } else if (activeField === 'reps') {
      if (key === '.') return; // No decimals for reps
      setReps(prev => prev + key);
    } else if (activeField === 'sets') {
      if (key === '.') return; // No decimals for sets
      // Replace default '1' if typing starts
      setSets(prev => prev === '1' ? key : prev + key);
    }
  };

  const handleDelete = () => {
    if (activeField === 'name') {
      setName(prev => prev.slice(0, -1));
    } else if (activeField === 'weight') {
      setWeight(prev => prev.slice(0, -1));
    } else if (activeField === 'reps') {
      setReps(prev => prev.slice(0, -1));
    } else if (activeField === 'sets') {
      setSets(prev => prev.slice(0, -1));
    }
  };

  const handleNext = () => {
    if (activeField === 'name') {
      setActiveField('weight');
    } else if (activeField === 'weight') {
      setActiveField('reps');
    } else if (activeField === 'reps') {
      setActiveField('sets');
    } else if (activeField === 'sets') {
      handleSaveSet();
    }
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleFinishWorkout = () => {
    if (exercises.length === 0) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmFinish = async () => {
    setIsConfirmOpen(false);
    try {
      await updateWorkoutMutation.mutateAsync({
        id: workout.id,
        endedAt: new Date().toISOString(),
      });
      onFinish();
    } catch (error) {
      console.error('Error finishing workout:', error);
    }
  };

  const groupedExercises = useMemo(() => {
    const groups: { name: string; sets: Exercise[] }[] = [];
    
    exercises.forEach((ex: Exercise) => {
      const existingGroup = groups.find((g) => g.name === ex.name);
      if (existingGroup) {
        existingGroup.sets.push(ex);
      } else {
        groups.push({ name: ex.name, sets: [ex] });
      }
    });

    groups.forEach((group) => {
      group.sets.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return groups;
  }, [exercises]);

  // Running volume total
  const totalVolume = useMemo(() => {
    return exercises.reduce((sum: number, ex: Exercise) => sum + (ex.weight * ex.reps * ex.sets), 0);
  }, [exercises]);

  const formatVolume = useCallback((vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return vol.toString();
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 py-4 bg-background sticky top-0 z-30 border-b border-border flex justify-between items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold text-text-primary leading-tight truncate tracking-tight">{workout.name}</h2>
          <p className="text-[12px] text-text-secondary mt-1">
            Started at {format(new Date(workout.created_at), 'h:mm a')}
          </p>
        </div>
        <button 
          onClick={handleFinishWorkout}
          disabled={exercises.length === 0}
          className="flex-shrink-0 px-3.5 py-2 text-[13px] font-medium border border-red-500/40 hover:border-red-500/60 bg-red-950/20 hover:bg-red-950/40 text-red-200 rounded-[6px] transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          End session
        </button>
      </div>

      {/* Input Form */}
      <div className="px-5 py-4 border-b border-border">
        <div className="space-y-4">
          <div className="relative">
            <div className="space-y-1.5 cursor-pointer relative z-20" onClick={() => setActiveField('name')}>
              <label className="text-[12px] font-medium text-text-secondary ml-0.5">Exercise</label>
              <div className={cn("w-full flex items-center rounded-[12px] border bg-surface-raised px-4 py-3 min-h-[52px] transition-colors duration-100", activeField === 'name' ? 'border-accent ring-1 ring-accent/30' : 'border-border')}>
                <span className={cn("text-[16px]", name ? "text-text-primary" : "text-text-secondary/50")}>
                  {name || "Exercise name"}
                </span>
                {activeField === 'name' && <span className="w-0.5 h-5 bg-accent animate-pulse ml-0.5" />}
              </div>
            </div>
            
            {/* Custom Autocomplete Dropdown */}
            <AnimatePresence>
              {activeField === 'name' && name && suggestions.filter(s => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-30 overflow-hidden max-h-[160px] overflow-y-auto"
                >
                  {suggestions.filter(s => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setName(s); setActiveField('weight'); }}
                      className="w-full text-left px-4 py-3 border-b border-border/50 last:border-0 text-[15px] font-medium text-text-primary active:bg-surface-raised"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="grid grid-cols-3 gap-2 relative z-10">
            <div 
              onClick={() => setActiveField('weight')}
              className={`flex flex-col space-y-1.5 cursor-pointer relative`}
            >
              <label className="text-[11px] font-medium text-text-secondary tracking-wide ml-0.5">Weight</label>
              <div className={`relative flex w-full items-center justify-center rounded-[12px] border bg-surface-raised px-3 py-2 min-h-[44px] transition-colors duration-100 ${activeField === 'weight' ? 'border-transparent' : 'border-border'}`}>
                {activeField === 'weight' && (
                  <motion.div
                    layoutId="active-field-border"
                    className="absolute inset-0 rounded-[12px] border border-accent ring-1 ring-accent/30 pointer-events-none"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className={`text-[16px] font-medium nums relative z-10 ${weight ? 'text-text-primary' : 'text-text-secondary/40'}`}>
                  {weight || '0'}
                </span>
                {activeField === 'weight' && <span className="w-0.5 h-4 bg-accent animate-pulse ml-0.5 relative z-10"></span>}
              </div>
            </div>
            
            <div 
              onClick={() => setActiveField('reps')}
              className={`flex flex-col space-y-1.5 cursor-pointer relative`}
            >
              <label className="text-[11px] font-medium text-text-secondary tracking-wide ml-0.5">Reps</label>
              <div className={`relative flex w-full items-center justify-center rounded-[12px] border bg-surface-raised px-3 py-2 min-h-[44px] transition-colors duration-100 ${activeField === 'reps' ? 'border-transparent' : 'border-border'}`}>
                {activeField === 'reps' && (
                  <motion.div
                    layoutId="active-field-border"
                    className="absolute inset-0 rounded-[12px] border border-accent ring-1 ring-accent/30 pointer-events-none"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className={`text-[16px] font-medium nums relative z-10 ${reps ? 'text-text-primary' : 'text-text-secondary/40'}`}>
                  {reps || '0'}
                </span>
                {activeField === 'reps' && <span className="w-0.5 h-4 bg-accent animate-pulse ml-0.5 relative z-10"></span>}
              </div>
            </div>

            <div 
              onClick={() => setActiveField('sets')}
              className={`flex flex-col space-y-1.5 cursor-pointer relative`}
            >
              <label className="text-[11px] font-medium text-text-secondary tracking-wide ml-0.5">Sets</label>
              <div className={`relative flex w-full items-center justify-center rounded-[12px] border bg-surface-raised px-3 py-2 min-h-[44px] transition-colors duration-100 ${activeField === 'sets' ? 'border-transparent' : 'border-border'}`}>
                {activeField === 'sets' && (
                  <motion.div
                    layoutId="active-field-border"
                    className="absolute inset-0 rounded-[12px] border border-accent ring-1 ring-accent/30 pointer-events-none"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className={`text-[16px] font-medium nums relative z-10 ${sets ? 'text-text-primary' : 'text-text-secondary/40'}`}>
                  {sets || '0'}
                </span>
                {activeField === 'sets' && <span className="w-0.5 h-4 bg-accent animate-pulse ml-0.5 relative z-10"></span>}
              </div>
            </div>
          </div>
          
          {showSuccess && (
            <div className="h-10 flex items-center justify-center text-accent text-[13px] font-medium animate-in fade-in zoom-in duration-200">
              <Check size={16} className="mr-1.5" /> Set logged
            </div>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : groupedExercises.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[14px] text-text-secondary">Log your first exercise above</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {groupedExercises.map((group) => (
              <button 
                key={group.name}
                onClick={() => setEditingGroup(group)}
                className="w-full text-left transition-colors duration-100 active:bg-surface-raised group"
              >
                {/* Group header */}
                <div className="px-5 py-2.5 flex justify-between items-center bg-surface/50">
                  <h3 className="text-[14px] font-semibold text-text-primary">{group.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-secondary nums">
                      {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}
                    </span>
                    <Edit2 size={12} className="text-accent opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
                  </div>
                </div>
                {/* Sets */}
                <div className="divide-y divide-border/50">
                  <AnimatePresence initial={false}>
                  {group.sets.map((ex, index) => (
                    <motion.div 
                      key={ex.id}
                      initial={{ height: 0, opacity: 0, scale: 0.95, color: '#ffffff' }}
                      animate={{ height: 'auto', opacity: 1, scale: 1, color: '#a1a1aa' }}
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                      className="px-5 py-2.5 flex justify-between items-center overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] w-4 text-right nums">{index + 1}</span>
                        <div className="flex items-baseline gap-1 text-[15px] font-medium" style={{ color: 'inherit' }}>
                          <span className="nums text-text-primary">{ex.weight}</span>
                          <span className="text-[12px] font-normal mr-1">kg</span>
                          <span className="font-normal mr-1 opacity-40">×</span>
                          <span className="nums text-text-primary">{ex.reps}</span>
                          <span className="text-[12px] font-normal mr-1">reps</span>
                          {ex.sets > 1 && (
                            <>
                              <span className="font-normal mr-1 opacity-40">×</span>
                              <span className="nums text-text-primary">{ex.sets}</span>
                              <span className="text-[12px] font-normal">sets</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] opacity-60 nums">
                        {format(new Date(ex.created_at), 'h:mm a')}
                      </span>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Running Volume Total */}
      <AnimatePresence>
        {totalVolume > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-5 py-4 border-t border-border bg-surface-raised flex justify-between items-center"
          >
            <span className="text-[14px] text-text-secondary font-medium">Total volume</span>
            <span className="text-[18px] font-bold text-accent nums text-glow flex items-baseline">
              <NumberTicker value={totalVolume} />
              <span className="text-[14px] font-medium text-text-secondary ml-1">kg</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="End session"
      >
        <div className="space-y-4">
          <p className="text-[14px] text-text-secondary leading-relaxed">
            Save this session? You logged {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            {totalVolume > 0 && ` for ${formatVolume(totalVolume)} kg total volume`}.
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFinish}
              className="flex-1"
            >
              <Check size={16} className="mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {activeField && (
        <div className="sticky bottom-0 z-40 animate-in slide-in-from-bottom-4 duration-150 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {activeField === 'name' ? (
            <AlphabetKeypad 
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
              onNext={handleNext}
              nextLabel="Next"
              nextDisabled={!name.trim()}
            />
          ) : (
            <Keypad 
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
              onNext={handleNext}
              nextLabel={activeField === 'sets' ? 'Save' : 'Next'}
              nextDisabled={
                (activeField === 'weight' && !weight) || 
                (activeField === 'reps' && !reps) || 
                (activeField === 'sets' && (!sets || createExerciseMutation.isPending))
              }
            />
          )}
        </div>
      )}

      <EditExerciseModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        exerciseName={editingGroup?.name || ''}
        exercises={editingGroup?.sets || []}
        workoutId={workout.id}
        userId={userId}
        onUpdate={refetchExercises}
      />
    </div>
  );
}
