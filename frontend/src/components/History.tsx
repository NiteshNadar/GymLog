import { useState } from 'react';
import { WorkoutSession } from '../types.js';
import { format } from 'date-fns';
import { Edit2, Trash2, ChevronLeft, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmModal } from './modals/ConfirmModal.js';
import { EditWorkoutModal } from './modals/EditWorkoutModal.js';
import { useWorkouts, useDeleteWorkout, useClearAllWorkouts } from '../features/workouts/api.js';

interface HistoryProps {
  onBack: () => void;
}

export function History({ onBack }: HistoryProps) {
  const { data: workoutsData, isLoading: loading, refetch: refetchHistory } = useWorkouts({ ended: true });
  
  const deleteWorkoutMutation = useDeleteWorkout();
  const clearAllWorkoutsMutation = useClearAllWorkouts();

  const workouts: WorkoutSession[] = workoutsData || [];

  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<WorkoutSession | null>(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleDelete = async () => {
    if (!workoutToDelete) return;
    setIsActionLoading(true);
    try {
      await deleteWorkoutMutation.mutateAsync(workoutToDelete);
      toast.success('Workout deleted');
      setWorkoutToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete workout');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsActionLoading(true);
    try {
      await clearAllWorkoutsMutation.mutateAsync();
      toast.success('All history cleared');
      setIsClearAllOpen(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center text-accent font-medium text-[15px] active:opacity-50 transition-opacity duration-100 min-h-[44px]"
          >
            <ChevronLeft size={20} className="-ml-1" />
            Back
          </button>
          {workouts.length > 0 && (
            <button 
              onClick={() => setIsClearAllOpen(true)}
              className="text-danger font-medium text-[15px] active:opacity-50 transition-opacity duration-100 min-h-[44px] px-2"
            >
              Clear all
            </button>
          )}
        </div>
        <h1 className="text-[22px] font-bold text-text-primary mt-2">History</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : workouts.length === 0 ? (
          <div className="py-24 px-5 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center text-text-secondary mb-4 shadow-sm">
              <Clock size={28} strokeWidth={1.5} />
            </div>
            <h3 className="text-[16px] font-semibold text-text-primary mb-1.5">No history yet</h3>
            <p className="text-[14px] text-text-secondary max-w-[240px]">
              Sessions you record will appear here so you can track your progress.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="sync">
            {workouts.map((workout) => (
              <motion.div
                key={workout.id}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="border-b border-border"
              >
                <div className="px-5 py-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-3">
                      <h3 className="text-[16px] font-semibold text-text-primary truncate">{workout.name}</h3>
                      <p className="text-[12px] text-text-secondary mt-0.5 nums">
                        {format(new Date(workout.created_at), 'EEEE, MMM d · h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setWorkoutToEdit(workout)}
                        className="h-[44px] min-w-[44px] px-3 flex items-center justify-center gap-1.5 rounded-[12px] bg-surface-raised border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all duration-150 active:scale-95 shadow-sm"
                        title="Edit session"
                      >
                        <Edit2 size={16} strokeWidth={2} />
                        <span className="text-[13px] font-medium hidden sm:inline pr-1">Edit</span>
                      </button>
                      <button
                        onClick={() => setWorkoutToDelete(workout.id)}
                        className="h-[44px] min-w-[44px] px-3 flex items-center justify-center gap-1.5 rounded-[12px] bg-surface-raised border border-border text-text-secondary hover:text-danger hover:bg-danger/5 hover:border-danger/30 transition-all duration-150 active:scale-95 shadow-sm"
                        title="Delete session"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                        <span className="text-[13px] font-medium hidden sm:inline pr-1">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Exercise summary */}
                  {(() => {
                    const uniqueNames = Array.from(new Set(workout.exercises?.map(e => e.name) || []));
                    if (uniqueNames.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {uniqueNames.slice(0, 4).map(name => (
                          <span 
                            key={name} 
                            className="inline-flex items-center px-2 py-1 rounded-md bg-surface-raised text-[11px] font-medium text-text-secondary"
                          >
                            {name}
                          </span>
                        ))}
                        {uniqueNames.length > 4 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-raised text-[11px] text-text-secondary/60 nums">
                            +{uniqueNames.length - 4}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <ConfirmModal
        isOpen={!!workoutToDelete}
        onClose={() => setWorkoutToDelete(null)}
        onConfirm={handleDelete}
        title="Delete workout"
        description="This action cannot be undone."
        confirmText="Delete"
        isLoading={isActionLoading}
      />

      <ConfirmModal
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleClearAll}
        title="Clear all history"
        description="This will permanently delete all your workouts."
        confirmText="Clear all"
        isLoading={isActionLoading}
      />

      <EditWorkoutModal
        isOpen={!!workoutToEdit}
        onClose={() => setWorkoutToEdit(null)}
        workout={workoutToEdit || { id: '', name: '', created_at: '', user_id: '' }}
        onUpdate={refetchHistory}
      />
    </div>
  );
}
