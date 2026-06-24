export interface Exercise {
  id: string;
  user_id: string;
  workout_id: string;
  name: string;
  weight: number;
  reps: number;
  sets: number;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  ended_at?: string;
}

export interface WorkoutSession extends Workout {
  exercises?: Exercise[];
}
