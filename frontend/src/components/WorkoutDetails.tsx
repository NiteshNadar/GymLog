import React, { useState, useMemo, useEffect } from 'react';
import { Workout, Exercise } from '../types.js';
import { ArrowLeft, Calendar, Clock, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/Button.js';
import { EditExerciseModal } from './modals/EditExerciseModal.js';
import { useWorkout, useDeleteWorkout } from '../features/workouts/api.js';

interface WorkoutDetailsProps {
  workout: Workout;
  onBack: () => void;
}

export function WorkoutDetails({ workout, onBack }: WorkoutDetailsProps) {
  const { data: workoutData, isLoading: loading, refetch: refetchWorkout } = useWorkout(workout.id);
  const deleteWorkoutMutation = useDeleteWorkout();

  const exercises = workoutData?.exercises || [];
  const hadExercises = React.useRef(false);

  const [editingGroup, setEditingGroup] = useState<{ name: string; sets: Exercise[] } | null>(null);

  useEffect(() => {
    if (exercises.length > 0) {
      hadExercises.current = true;
    } else if (hadExercises.current && exercises.length === 0) {
      deleteWorkoutMutation.mutate(workout.id, {
        onSuccess: () => onBack(),
      });
    }
  }, [exercises, workout.id]);

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

    groups.forEach(group => {
      group.sets.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return groups;
  }, [exercises]);

  // Total volume for this workout
  const totalVolume = useMemo(() => {
    return exercises.reduce((sum: number, ex: Exercise) => sum + (ex.weight * ex.reps * ex.sets), 0);
  }, [exercises]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-border sticky top-0 z-10 bg-background">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onBack}
          className="rounded-lg w-10 h-10 p-0"
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-semibold text-text-primary truncate">{workoutData?.name || workout.name}</h2>
          <div className="flex items-center gap-1.5 text-[12px] text-text-secondary mt-0.5">
            <Calendar size={11} />
            <span className="nums">{format(new Date(workout.created_at), 'MMM d, yyyy')}</span>
            <span className="text-text-secondary/30">·</span>
            <Clock size={11} />
            <span className="nums">{format(new Date(workout.created_at), 'h:mm a')}</span>
          </div>
        </div>
      </div>

      {/* Volume summary */}
      {totalVolume > 0 && (
        <div className="px-5 py-3 border-b border-border flex justify-between items-center bg-surface/30">
          <span className="text-[12px] text-text-secondary font-medium">Total volume</span>
          <span className="text-[16px] font-semibold text-accent nums">{totalVolume.toLocaleString()} kg</span>
        </div>
      )}

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : groupedExercises.length === 0 ? (
          <div className="py-12 px-5 text-center">
            <p className="text-[14px] text-text-secondary">No exercises logged for this session.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {groupedExercises.map((group) => (
              <button 
                key={group.name}
                onClick={() => setEditingGroup(group)}
                className="w-full text-left transition-colors duration-100 active:bg-surface-raised group"
              >
                <div className="px-5 py-2.5 flex justify-between items-center bg-surface/50">
                  <h3 className="text-[14px] font-semibold text-text-primary">{group.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-secondary nums">{group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}</span>
                    <Edit2 size={12} className="text-accent opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {group.sets.map((ex, idx) => (
                    <div key={ex.id} className="px-5 py-2.5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-text-secondary/50 w-4 text-right nums">{idx + 1}</span>
                        <div className="flex items-baseline gap-1 text-[15px] text-text-primary font-medium">
                          <span className="nums">{ex.weight}</span>
                          <span className="text-[12px] text-text-secondary font-normal mr-1">kg</span>
                          <span className="text-text-secondary/40 font-normal mr-1">×</span>
                          <span className="nums">{ex.reps}</span>
                          <span className="text-[12px] text-text-secondary font-normal mr-1">reps</span>
                          {ex.sets > 1 && (
                            <>
                              <span className="text-text-secondary/40 font-normal mr-1">×</span>
                              <span className="nums">{ex.sets}</span>
                              <span className="text-[12px] text-text-secondary font-normal">sets</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <EditExerciseModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        exerciseName={editingGroup?.name || ''}
        exercises={editingGroup?.sets || []}
        workoutId={workout.id}
        userId={workout.user_id}
        onUpdate={refetchWorkout}
      />
    </div>
  );
}
