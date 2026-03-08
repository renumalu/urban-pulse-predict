import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    } else {
      if (!displayName.trim()) {
        setError('Display name is required');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName.trim());
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a verification link before signing in.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center glow-blue">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-widest text-primary text-glow-blue">URBANPULSE</h1>
            <p className="text-xs text-muted-foreground font-mono-tech">India Digital Twin</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 border-glow">
          {/* Tab toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-md p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className={`flex-1 py-2 rounded text-sm font-mono-tech transition-colors ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              className={`flex-1 py-2 rounded text-sm font-mono-tech transition-colors ${mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-muted-foreground font-mono-tech block mb-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-secondary text-foreground text-sm font-mono-tech rounded-md pl-10 pr-3 py-2.5 border border-border focus:border-primary outline-none"
                    maxLength={100}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground font-mono-tech block mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-secondary text-foreground text-sm font-mono-tech rounded-md pl-10 pr-3 py-2.5 border border-border focus:border-primary outline-none"
                  maxLength={255}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-mono-tech block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-secondary text-foreground text-sm font-mono-tech rounded-md pl-10 pr-10 py-2.5 border border-border focus:border-primary outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive font-mono-tech">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-neon-green/10 border border-neon-green/30 rounded-md p-3 text-sm text-neon-green font-mono-tech">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono-tech text-sm py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
