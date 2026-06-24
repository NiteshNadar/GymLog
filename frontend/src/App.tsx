import { GymLog } from './components/GymLog';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GymLog />
        <Toaster 
          position="top-center" 
          toastOptions={{
            className: '!bg-surface !text-text-primary !border !border-border !rounded-[var(--radius)] !shadow-lg',
            style: {
              fontFamily: "'Geist', system-ui, sans-serif",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
