import React, { useState, useMemo, useEffect } from 'react';
import { Workout } from '../types.js';
import { ChevronRight, Plus, Clock, LogOut, Activity } from 'lucide-react';
import { format, isThisWeek } from 'date-fns';
import { Button } from './ui/Button.js';
import { AlphabetKeypad } from './ui/AlphabetKeypad.js';
import { cn } from '../lib/utils.js';
import { useAuth } from '../context/AuthContext.js';
import { useWorkouts, useCreateWorkout } from '../features/workouts/api.js';

interface DashboardProps {
  userId: string;
  onStartWorkout: (workout: Workout) => void;
  onViewWorkout: (workout: Workout) => void;
  onViewHistory: () => void;
}

export function Dashboard({ onStartWorkout, onViewWorkout, onViewHistory }: DashboardProps) {
  const { signOut } = useAuth();
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const { data: workoutsData, isLoading: loading } = useWorkouts({ limit: 5 });
  const createWorkoutMutation = useCreateWorkout();

  const workouts = React.useMemo(() => {
    if (!workoutsData) return [];
    return workoutsData.map((w: { exercises?: { name: string }[] }) => {
      const exerciseNames = w.exercises?.map((e: { name: string }) => e.name) || [];
      const exerciseCount = new Set(exerciseNames).size;
      return {
        ...w,
        exercise_count: exerciseCount,
      };
    });
  }, [workoutsData]);

  // Sessions this week for streak indicator
  const sessionsThisWeek = useMemo(() => {
    if (!workoutsData) return 0;
    return workoutsData.filter((w: { created_at: string }) => 
      isThisWeek(new Date(w.created_at), { weekStartsOn: 1 })
    ).length;
  }, [workoutsData]);

  const handleCreateWorkoutClick = async () => {
    if (!newWorkoutName.trim() || createWorkoutMutation.isPending) return;

    try {
      const workout = await createWorkoutMutation.mutateAsync({
        name: newWorkoutName,
      });
      onStartWorkout(workout);
    } catch (error) {
      console.error('Error creating workout:', error);
    }
  };

  // Handle physical keyboard input for desktop users
  useEffect(() => {
    if (!isCreating) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Backspace') {
        setNewWorkoutName(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (newWorkoutName.trim() && !createWorkoutMutation.isPending) {
          handleCreateWorkoutClick();
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setNewWorkoutName(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, newWorkoutName, createWorkoutMutation.isPending]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-text-secondary tracking-wide mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-[28px] font-bold text-text-primary leading-tight">
              Gym Log
            </h1>
          </div>
          <button 
            onClick={signOut}
            title="Sign out"
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/10 active:scale-95 transition-all duration-150"
          >
            <LogOut size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 pb-6 space-y-8 overflow-y-auto">
        {/* Start Session */}
        <div>
          {!isCreating ? (
            <div className="space-y-3">
              <Button 
                onClick={() => setIsCreating(true)}
                className="w-full py-4 text-[15px]"
                size="lg"
              >
                <Plus size={18} className="mr-2" strokeWidth={2.5} />
                Start session
              </Button>
              {sessionsThisWeek > 0 && (
                <p className="text-center text-[12px] text-text-secondary">
                  {sessionsThisWeek} {sessionsThisWeek === 1 ? 'session' : 'sessions'} this week
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <div className="space-y-1.5 relative">
                <label className="text-[12px] font-medium text-text-secondary ml-0.5">Session name</label>
                <div 
                  className="w-full flex items-center bg-surface-raised border border-accent ring-1 ring-accent/30 rounded-[12px] px-4 py-3.5 min-h-[52px]"
                >
                  <span className={cn("text-[16px]", newWorkoutName ? "text-text-primary" : "text-text-secondary/50")}>
                    {newWorkoutName || "e.g. Push Day"}
                  </span>
                  <span className="w-0.5 h-5 bg-accent animate-pulse ml-0.5" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setIsCreating(false);
                    setNewWorkoutName('');
                  }}
                >
                  Cancel
                </Button>
                {!isMobile && (
                  <Button 
                    type="button"
                    className="flex-1"
                    onClick={handleCreateWorkoutClick}
                    disabled={!newWorkoutName.trim() || createWorkoutMutation.isPending}
                  >
                    Start
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Workouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-text-secondary tracking-wide">Recent</h2>
            {workouts.length > 0 && (
              <button 
                onClick={onViewHistory}
                className="text-[13px] text-accent font-medium hover:text-accent/80 transition-colors duration-100 min-h-[44px] flex items-center"
              >
                View all
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : workouts.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center text-text-secondary mb-4 shadow-sm">
                <Activity size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-[16px] font-semibold text-text-primary mb-1.5">No sessions yet</h3>
              <p className="text-[14px] text-text-secondary max-w-[240px]">
                Your training journal starts with your first session. Click the start button above to begin.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-[var(--radius)] overflow-hidden divide-y divide-border">
              {workouts.map((workout: { id: string; user_id: string; name: string; exercise_count: number; created_at: string }) => (
                <button 
                  key={workout.id}
                  onClick={() => onViewWorkout(workout as Workout)}
                  className="w-full px-4 py-3.5 flex items-center justify-between transition-colors duration-100 active:bg-surface-raised group"
                >
                  <div className="text-left min-w-0 flex-1">
                    <h3 className="text-[15px] font-medium text-text-primary truncate">{workout.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-text-secondary nums">
                        {workout.exercise_count} {workout.exercise_count === 1 ? 'exercise' : 'exercises'}
                      </span>
                      <span className="text-text-secondary/30">·</span>
                      <span className="text-[12px] text-text-secondary nums flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(workout.created_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-secondary/40 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCreating && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.3)] safe-pb">
          <AlphabetKeypad 
            onKeyPress={(key) => setNewWorkoutName(prev => prev + key)}
            onDelete={() => setNewWorkoutName(prev => prev.slice(0, -1))}
            onNext={handleCreateWorkoutClick}
            nextLabel="Start"
            nextDisabled={!newWorkoutName.trim() || createWorkoutMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
