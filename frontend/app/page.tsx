'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { Eye, EyeOff, Wallet, TrendingUp, Shield, Sparkles, Lock, CheckCircle } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { authedPost } from '@/lib/api';

function authErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';

  if (code.includes('auth/api-key-not-valid')) {
    return 'Firebase API key is invalid. Update NEXT_PUBLIC_FIREBASE_API_KEY in .env.local';
  }
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'Invalid email or password.';
  }
  if (code.includes('auth/user-not-found')) {
    return 'No account found for this email.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Password is too weak. Use at least 6 characters.';
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed before completing login.';
  }
  if (code.includes('auth/unauthorized-domain')) {
    return 'Current domain is not authorized in Firebase Authentication.';
  }

  return error instanceof Error ? error.message : 'Authentication failed';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard');
      }
    });
    return unsubscribe;
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      await authedPost('/api/users', {});
      router.replace('/dashboard');
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required');
      }

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      await authedPost('/api/users', {});
      router.replace('/dashboard');
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex flex-1">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0B1A3E 0%, #1E3A6E 50%, #4F6EF7 100%)',
          }}
        >
          {/* Subtle geometric shapes */}
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-2xl border border-white/10"
          />
          <motion.div
            animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-32 right-32 w-40 h-40 bg-white/5 rounded-2xl border border-white/10"
          />
          <motion.div
            animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-2xl border border-white/10"
          />

          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <Wallet className="w-7 h-7" />
                </div>
                <span className="text-3xl tracking-tight font-semibold">BudgetAI</span>
              </div>
              <h1 className="text-5xl mb-6 leading-tight tracking-tight font-bold">
                Smart budgeting
                <br />
                powered by AI
              </h1>
              <p className="text-lg text-white/70 mb-12 max-w-md leading-relaxed">
                Track expenses, get AI-powered insights, and take control of your financial future.
              </p>

              <div className="space-y-5">
                {[
                  { icon: Sparkles, title: 'AI Auto-categorization', desc: 'Automatically categorize expenses with machine learning', delay: 0.3 },
                  { icon: TrendingUp, title: 'Financial Analytics', desc: 'Visualize spending patterns and track your goals', delay: 0.4 },
                  { icon: Shield, title: 'Bank-level Security', desc: '256-bit AES encryption protects your financial data', delay: 0.5 },
                ].map((item) => (
                  <motion.div
                    key={item.title}
                    initial={{ x: -15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: item.delay, duration: 0.25 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-0.5">{item.title}</h3>
                      <p className="text-sm text-white/60">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="flex items-center gap-6 mt-12 pt-8 border-t border-white/10"
              >
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Shield className="w-4 h-4" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Lock className="w-4 h-4" />
                  <span>256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>GDPR Ready</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0B1A3E 0%, #4F6EF7 100%)' }}
              >
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-semibold tracking-tight">BudgetAI</span>
            </div>

            {/* Secure badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-6"
            >
              <Shield className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs text-[#10B981] font-medium">Secured with 256-bit encryption</span>
            </motion.div>

            <div className="mb-8">
              <h2 className="text-3xl mb-2 font-bold tracking-tight">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.2 }}
              >
                <label htmlFor="email" className="block text-sm mb-2 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 transition-all duration-200 outline-none"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.25 }}
              >
                <label htmlFor="password" className="block text-sm mb-2 font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-input-background border border-border focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 transition-all duration-200 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.3 }}
                className="flex items-center justify-between text-sm"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border accent-[#4F6EF7]" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="text-[#4F6EF7] hover:underline font-medium">
                  Forgot password?
                </a>
              </motion.div>

              <motion.button
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.35 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl text-white shadow-lg shadow-[#0B1A3E]/20 hover:shadow-xl hover:shadow-[#0B1A3E]/30 transition-all duration-200 font-medium"
                style={{
                  background: 'linear-gradient(135deg, #0B1A3E 0%, #1E3A6E 50%, #4F6EF7 100%)',
                }}
              >
                {isLoading ? 'Signing in...' : isSignUp ? 'Create account' : 'Sign in'}
              </motion.button>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.4 }}
                className="relative"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
                </div>
              </motion.div>

              <motion.button
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.45 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl border border-border bg-card hover:bg-accent transition-colors duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isLoading ? 'Please wait...' : 'Continue with Google'}
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.5 }}
                className="text-center text-sm text-muted-foreground"
              >
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-[#4F6EF7] hover:underline font-medium"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </motion.p>
            </form>

            {/* Data encryption note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.25 }}
              className="mt-8 pt-6 border-t border-border"
            >
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>Your data is encrypted end-to-end and never shared with third parties</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer with trust links */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.25 }}
        className="bg-background border-t border-border py-4 px-8"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">2026 BudgetAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
