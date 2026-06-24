import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { Exercise } from '../../types.js';
import { client } from '../../lib/api/client.js';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

const exerciseSchema = z.object({
  dbId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  weight: z.preprocess((val) => Number(val), z.number().min(0)),
  reps: z.preprocess((val) => Number(val), z.number().min(0)),
  sets: z.preprocess((val) => Number(val), z.number().min(0)),
});

const formSchema = z.object({
  exercises: z.array(exerciseSchema),
});

type FormData = z.infer<typeof formSchema>;

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  exercises: Exercise[];
  workoutId: string;
  userId: string;
  onUpdate: () => void;
}

export function EditExerciseModal({ 
  isOpen, 
  onClose, 
  exerciseName, 
  exercises, 
  workoutId,
  onUpdate 
}: EditExerciseModalProps) {
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { exercises: [] }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises"
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ 
        exercises: exercises.map(ex => ({
          dbId: ex.id,
          name: ex.name,
          weight: ex.weight,
          reps: ex.reps,
          sets: ex.sets
        })) 
      });
      setConfirmingDelete(false);
    }
  }, [isOpen, exercises, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const updates = [];
      
      for (const ex of data.exercises) {
        if (ex.dbId) {
          updates.push(
            client.patch(`/exercises/${ex.dbId}`, {
              name: ex.name,
              weight: ex.weight,
              reps: ex.reps,
              sets: ex.sets
            })
          );
        } else {
          updates.push(
            client.post('/exercises', {
              workout_id: workoutId,
              name: ex.name,
              weight: ex.weight,
              reps: ex.reps,
              sets: ex.sets
            })
          );
        }
      }

      await Promise.all(updates);
      
      toast.success("Exercises updated");
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update exercises");
    }
  };

  const handleDeleteSet = async (index: number) => {
    try {
      const dbId = form.getValues(`exercises.${index}.dbId`);
      if (dbId) {
        await client.delete(`/exercises/${dbId}`);
      }
      remove(index);
      toast.success("Set removed");
      onUpdate(); 
    } catch (error) {
      console.error('Error deleting set:', error);
      toast.error("Failed to remove set");
    }
  };

  const handleDeleteEntireExercise = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    
    setIsDeletingGroup(true);
    try {
      // Delete all sets for this exercise name in this workout
      const deletePromises = exercises
        .filter(ex => ex.name === exerciseName)
        .map(ex => client.delete(`/exercises/${ex.id}`));

      await Promise.all(deletePromises);

      toast.success(`Deleted ${exerciseName}`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete exercise");
    } finally {
      setIsDeletingGroup(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${exerciseName}`}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-surface-raised rounded-lg border border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-text-secondary">Set {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSet(index)}
                  className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors duration-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <input type="hidden" {...form.register(`exercises.${index}.dbId`)} />
              <input type="hidden" {...form.register(`exercises.${index}.name`)} />

              <div className="grid grid-cols-3 gap-2">
                <Input
                  {...form.register(`exercises.${index}.weight`)}
                  type="number"
                  label="Kg"
                  step="0.5"
                  className="text-center font-medium nums"
                />
                <Input
                  {...form.register(`exercises.${index}.reps`)}
                  type="number"
                  label="Reps"
                  className="text-center font-medium nums"
                />
                <Input
                  {...form.register(`exercises.${index}.sets`)}
                  type="number"
                  label="Sets"
                  className="text-center font-medium nums"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const currentExercises = form.getValues('exercises');
              const lastSet = currentExercises[currentExercises.length - 1];
              append({
                name: exerciseName,
                weight: lastSet?.weight || 0,
                reps: lastSet?.reps || 0,
                sets: 1
              });
            }}
            className="w-full py-3 border-dashed border-border"
          >
            <Plus size={16} className="mr-2" /> Add set
          </Button>

          {fields.length > 0 && (
             <div className="pt-4 mt-4 border-t border-border">
               <button
                 type="button"
                 onClick={handleDeleteEntireExercise}
                 disabled={isDeletingGroup}
                 className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-colors text-[13px] font-medium min-h-[44px] ${
                   confirmingDelete
                     ? 'bg-danger/15 text-danger border border-danger/30'
                     : 'text-danger hover:bg-danger/10'
                 }`}
               >
                 <Trash2 size={16} />
                 {confirmingDelete
                   ? 'Tap again to confirm'
                   : `Delete all ${fields.length} sets`}
               </button>
             </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={form.formState.isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
