import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Dashboard } from './Dashboard.js';
import { ActiveSession } from './ActiveSession.js';
import { WorkoutDetails } from './WorkoutDetails.js';
import { History } from './History.js';
import { AuthForm } from './auth/AuthForm.js';
import { Workout } from '../types.js';
import { client } from '../lib/api/client.js';
import { AnimatePresence, motion } from 'framer-motion';

export function GymLog() {
  const { user, loading: authLoading, isRecoveryMode, setIsRecoveryMode } = useAuth();
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');

  useEffect(() => {
    if (user) {
      checkActiveWorkout();
    }
  }, [user]);

  const checkActiveWorkout = async () => {
    try {
      const { data } = await client.get('/workouts?ended=false');
      const activeList = data.data || [];
      
      if (activeList.length > 0) {
        const latest = activeList[0];
        const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
        
        if (new Date(latest.created_at).getTime() > twelveHoursAgo) {
          setActiveWorkout(latest);
        }
      }
    } catch {
      // No active workout found
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user || isRecoveryMode) {
    return <AuthForm isRecovery={isRecoveryMode} onRecoveryComplete={() => setIsRecoveryMode(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-background text-text-primary font-sans overflow-hidden">
      <div className="mx-auto max-w-lg h-full relative flex flex-col bg-background overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {activeWorkout ? (
            <motion.div 
              key="active"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute inset-0 z-40 bg-background"
            >
              <ActiveSession 
                userId={user.id} 
                workout={activeWorkout} 
                onFinish={() => setActiveWorkout(null)} 
              />
            </motion.div>
          ) : viewingWorkout ? (
            <motion.div 
              key="details"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute inset-0 z-40 bg-background"
            >
              <WorkoutDetails 
                workout={viewingWorkout} 
                onBack={() => setViewingWorkout(null)} 
              />
            </motion.div>
          ) : view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute inset-0 z-40 bg-background"
            >
              <History onBack={() => setView('dashboard')} />
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="h-full flex flex-col bg-background"
            >
              <Dashboard 
                userId={user.id} 
                onStartWorkout={(workout) => setActiveWorkout(workout)}
                onViewWorkout={(workout) => setViewingWorkout(workout)}
                onViewHistory={() => setView('history')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
