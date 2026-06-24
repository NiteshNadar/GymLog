import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { error_description?: string; access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const updateSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthFormData = z.infer<typeof authSchema>;
type ForgotFormData = z.infer<typeof forgotSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

interface AuthFormProps {
  isRecovery?: boolean;
  onRecoveryComplete?: () => void;
}

export function AuthForm({ isRecovery = false, onRecoveryComplete }: AuthFormProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'update'>(
    isRecovery ? 'update' : 'login'
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isRecovery) {
      setView('update');
    }
  }, [isRecovery]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-gsi-client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const { 
    register: registerAuth, 
    handleSubmit: handleSubmitAuth, 
    formState: { errors: errorsAuth },
    reset: resetAuth
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const { 
    register: registerForgot, 
    handleSubmit: handleSubmitForgot, 
    formState: { errors: errorsForgot },
    reset: resetForgot
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const { 
    register: registerUpdate, 
    handleSubmit: handleSubmitUpdate, 
    formState: { errors: errorsUpdate },
    reset: resetUpdate
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
  });

  const onSubmitAuth = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (view === 'login') {
        await signIn(data.email, data.password);
      } else {
        await signUp(data.email, data.password);
        setView('login');
        resetAuth();
      }
    } catch {
      // AuthContext handles toasts
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForgot = async (data: ForgotFormData) => {
    void data;
    setLoading(true);
    try {
      toast.info('Password reset via Nodemailer is currently deferred in setup.');
      setView('login');
      resetForgot();
    } catch {
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitUpdate = async (data: UpdateFormData) => {
    void data;
    setLoading(true);
    try {
      toast.info('Password updates are deferred.');
      resetUpdate();
      if (onRecoveryComplete) {
        onRecoveryComplete();
      }
      setView('login');
    } catch {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!window.google) {
      toast.error('Google Sign-In script is still loading. Please try again in a moment.');
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '484070095029-1d9ksb0eu49p9smfgmtgjtqlebvrlkgm.apps.googleusercontent.com',
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.error_description) {
          toast.error(tokenResponse.error_description);
          return;
        }
        setLoading(true);
        try {
          await signInWithGoogle(tokenResponse.access_token);
        } catch {
          // Toast message is handled inside AuthContext
        } finally {
          setLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const titles: Record<string, string> = {
    login: 'Sign in',
    signup: 'Create account',
    forgot: 'Reset password',
    update: 'Set new password',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden auth-grid-bg">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-accent/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-accent/60 z-50" />
      
      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="space-y-2">
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight">
            {titles[view]}
          </h1>
          <p className="text-[14px] text-text-secondary leading-relaxed font-sans">
            {view === 'login' && 'Log in to track your training sessions and progress.'}
            {view === 'signup' && 'Sign up to start logging exercises, weights, and reps.'}
            {view === 'forgot' && 'Enter your email address to receive a secure password reset link.'}
            {view === 'update' && 'Choose a new secure password for your account.'}
          </p>
        </div>

        {view === 'forgot' ? (
          <form onSubmit={handleSubmitForgot(onSubmitForgot)} className="space-y-4">
            <div>
              <Input
                {...registerForgot('email')}
                type="email"
                placeholder="you@example.com"
                label="Email"
                className="rounded-[6px] bg-surface-raised border-border placeholder:text-text-secondary/50 text-text-primary"
              />
              {errorsForgot.email && (
                <p className="text-[12px] font-medium text-red-400 mt-1.5 ml-0.5">{errorsForgot.email.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full rounded-[6px] text-[14px] font-semibold" isLoading={loading}>
              Send reset link
            </Button>
          </form>
        ) : view === 'update' ? (
          <form onSubmit={handleSubmitUpdate(onSubmitUpdate)} className="space-y-4">
            <div>
              <Input
                {...registerUpdate('password')}
                type="password"
                placeholder="••••••••"
                label="New password"
                className="rounded-[6px] bg-surface-raised border-border placeholder:text-text-secondary/50 text-text-primary"
              />
              {errorsUpdate.password && (
                <p className="text-[12px] font-medium text-red-400 mt-1.5 ml-0.5">{errorsUpdate.password.message}</p>
              )}
            </div>

            <div>
              <Input
                {...registerUpdate('confirmPassword')}
                type="password"
                placeholder="••••••••"
                label="Confirm password"
                className="rounded-[6px] bg-surface-raised border-border placeholder:text-text-secondary/50 text-text-primary"
              />
              {errorsUpdate.confirmPassword && (
                <p className="text-[12px] font-medium text-red-400 mt-1.5 ml-0.5">{errorsUpdate.confirmPassword.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full rounded-[6px] text-[14px] font-semibold" isLoading={loading}>
              Save password
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitAuth(onSubmitAuth)} className="space-y-4">
            <div>
              <Input
                {...registerAuth('email')}
                type="email"
                placeholder="you@example.com"
                label="Email"
                className="rounded-[6px] bg-surface-raised border-border placeholder:text-text-secondary/50 text-text-primary"
              />
              {errorsAuth.email && (
                <p className="text-[12px] font-medium text-red-400 mt-1.5 ml-0.5">{errorsAuth.email.message}</p>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password-input" className="text-[13px] font-medium text-text-secondary ml-0.5">Password</label>
                {view === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      resetForgot();
                    }}
                    className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors duration-100"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <Input
                id="login-password-input"
                {...registerAuth('password')}
                type="password"
                placeholder="••••••••"
                className="rounded-[6px] bg-surface-raised border-border placeholder:text-text-secondary/50 text-text-primary"
              />
              {errorsAuth.password && (
                <p className="text-[12px] font-medium text-red-400 mt-1.5 ml-0.5">{errorsAuth.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full rounded-[6px] text-[14px] font-semibold" isLoading={loading}>
              {view === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        )}

        {(view === 'login' || view === 'signup') && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <span className="relative px-3 bg-background text-[11px] text-text-secondary font-medium uppercase tracking-wider">or</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 min-h-[44px] px-4 py-2.5 text-[14px] font-medium text-text-primary bg-surface-raised border border-border rounded-[6px] transition-colors duration-100 hover:bg-surface active:scale-[0.98] disabled:opacity-40"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="text-center">
          {view === 'login' && (
            <button
              onClick={() => { setView('signup'); resetAuth(); }}
              className="text-[12px] font-mono text-text-secondary hover:text-text-primary transition-colors duration-100 min-h-[44px] px-4"
            >
              Don't have an account? <span className="text-accent font-bold uppercase tracking-wider">Sign up</span>
            </button>
          )}
          {view === 'signup' && (
            <button
              onClick={() => { setView('login'); resetAuth(); }}
              className="text-[12px] font-mono text-text-secondary hover:text-text-primary transition-colors duration-100 min-h-[44px] px-4"
            >
              Already registered? <span className="text-accent font-bold uppercase tracking-wider">Sign in</span>
            </button>
          )}
          {(view === 'forgot' || (view === 'update' && !isRecovery)) && (
            <button
              onClick={() => { setView('login'); resetAuth(); }}
              className="text-[12px] font-mono text-text-secondary hover:text-text-primary transition-colors duration-100 min-h-[44px] px-4"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
