import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { WorkoutSession } from '../../types.js';
import { client } from '../../lib/api/client.js';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  weight: z.preprocess((val) => Number(val), z.number().min(0)),
  reps: z.preprocess((val) => Number(val), z.number().min(0)),
  sets: z.preprocess((val) => Number(val), z.number().min(0)),
});

const formSchema = z.object({
  exercises: z.array(exerciseSchema),
});

type FormData = z.infer<typeof formSchema>;

interface EditWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutSession;
  onUpdate: () => void;
}

export function EditWorkoutModal({ isOpen, onClose, workout, onUpdate }: EditWorkoutModalProps) {
  const { control, register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { exercises: [] }
  });

  const { fields, remove } = useFieldArray({
    control,
    name: "exercises"
  });

  useEffect(() => {
    if (isOpen && workout && workout.id) {
      fetchExercises();
    }
  }, [isOpen, workout]);

  const fetchExercises = async () => {
    try {
      const { data } = await client.get(`/exercises?workout_id=${workout.id}`);
      reset({ exercises: data.data || [] });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load exercises");
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Update all exercises using Axios patch
      const updates = data.exercises.map(ex => 
        client.patch(`/exercises/${ex.id}`, {
          name: ex.name,
          weight: ex.weight,
          reps: ex.reps,
          sets: ex.sets
        })
      );

      await Promise.all(updates);
      
      toast.success("Workout updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update workout");
    }
  };

  const handleDeleteExercise = async (index: number, id: string) => {
    try {
      await client.delete(`/exercises/${id}`);
      remove(index);
      toast.success("Exercise removed");
      onUpdate();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error("Failed to remove exercise");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${workout.name}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-surface-raised rounded-lg border border-border space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    {...register(`exercises.${index}.name`)}
                    placeholder="Exercise Name"
                    label="Exercise"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteExercise(index, field.id)}
                  className="p-3 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors duration-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Remove Exercise"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  {...register(`exercises.${index}.weight`)}
                  type="number"
                  label="Kg"
                  step="0.5"
                  className="text-center font-medium nums"
                />
                <Input
                  {...register(`exercises.${index}.reps`)}
                  type="number"
                  label="Reps"
                  className="text-center font-medium nums"
                />
                <Input
                  {...register(`exercises.${index}.sets`)}
                  type="number"
                  label="Sets"
                  className="text-center font-medium nums"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
