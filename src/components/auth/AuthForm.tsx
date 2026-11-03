import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { authErrorMessage, requestPasswordReset, signIn, signUp, updatePassword } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

type Mode = 'signin' | 'signup' | 'reset';
export function AuthForm() {
  const { recovery, finishRecovery } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.slice(1));
    return query.has('error') || hash.has('error') ? 'This sign-in link is invalid or expired. Please request a new link.' : null;
  });
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(false);
  const submitting = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const switchMode = (next: Mode) => { setMode(next); setError(null); setNotice(null); setPassword(''); setConfirmation(''); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    setError(null); setNotice(null);
    if ((mode === 'signup' || recovery) && password !== confirmation) { setError('Passwords do not match.'); return; }
    submitting.current = true; setBusy(true);
    try {
      if (recovery) {
        await updatePassword(password);
        finishRecovery();
        if (mounted.current) setNotice('Password updated. You are signed in.');
      } else if (mode === 'reset') {
        await requestPasswordReset(email);
        if (mounted.current) setNotice('If an account exists for this email, a password reset link will arrive shortly. Open it in this browser.');
      } else if (mode === 'signup') {
        const signedIn = await signUp(name, email, password);
        if (mounted.current && !signedIn) setNotice('Check your inbox for a confirmation link. Open it in this browser, then sign in.');
      } else { await signIn(email, password); }
      if (mounted.current) { setPassword(''); setConfirmation(''); }
    } catch (failure) { if (mounted.current) setError(authErrorMessage(failure)); }
    finally { submitting.current = false; if (mounted.current) setBusy(false); }
  };
  const input = 'w-full min-h-12 px-4 rounded-xl border border-[#DDE0E8] dark:border-white/15 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] transition';
  const title = recovery ? 'Set a new password' : mode === 'signup' ? 'Start building with us.' : mode === 'reset' ? 'Forgot your password?' : 'Welcome back.';
  return <div>
    <div className="w-11 h-11 rounded-2xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center mb-6"><LockKeyhole size={21} /></div>
    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] mb-3">{title}</h1>
    <p className="text-sm text-[#636875] dark:text-gray-400 mb-7">{recovery ? 'Choose a strong password for your Workify account.' : mode === 'signup' ? 'Create an account to register for live workshops.' : mode === 'reset' ? 'We’ll email you a link to get back into your account.' : 'Sign in to your workshops and keep learning.'}</p>
    {!recovery && mode !== 'reset' && <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3F4F7] dark:bg-white/5 mb-7" aria-label="Account options">
      {(['signin', 'signup'] as const).map(option => <button key={option} type="button" disabled={busy} aria-pressed={mode === option} onClick={() => switchMode(option)} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === option ? 'bg-white dark:bg-[#172142] shadow-sm text-[#2F6BFF]' : 'text-[#636875] dark:text-gray-400'}`}>{option === 'signin' ? 'Sign in' : 'Create account'}</button>)}
    </div>}
    <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
      {mode === 'signup' && !recovery && <label className="block text-sm font-semibold">Full name<input className={`${input} mt-2`} name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} disabled={busy} /></label>}
      {!recovery && <label className="block text-sm font-semibold">Email address<input className={`${input} mt-2`} type="email" name="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} disabled={busy} /></label>}
      {(mode !== 'reset' || recovery) && <div>
        <div className="flex justify-between gap-2 items-center mb-2"><label htmlFor="auth-password" className="text-sm font-semibold">{recovery ? 'New password' : 'Password'}</label>{mode === 'signin' && !recovery && <button type="button" disabled={busy} onClick={() => switchMode('reset')} className="text-xs font-semibold text-[#2F6BFF]">Forgot password?</button>}</div>
        <div className="relative"><input id="auth-password" className={`${input} pr-12`} type={visible ? 'text' : 'password'} name="password" autoComplete={mode === 'signup' || recovery ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'signup' || recovery ? 12 : 1} maxLength={128} disabled={busy} /><button type="button" disabled={busy} aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v => !v)} className="absolute right-3 top-3.5 text-[#636875]">{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
        {(mode === 'signup' || recovery) && <p className="text-xs text-[#636875] dark:text-gray-400 mt-2">Use at least 12 characters.</p>}
      </div>}
      {(mode === 'signup' || recovery) && <label className="block text-sm font-semibold">Confirm password<input className={`${input} mt-2`} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={12} disabled={busy} /></label>}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-xl p-3">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3">{notice}</p>}
      <button disabled={busy} className="w-full min-h-12 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-60">{busy ? <><Loader2 size={18} className="animate-spin" /> Please wait…</> : <>{recovery ? 'Update password' : mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Send reset link' : 'Sign in to Workify'}<ArrowRight size={17} /></>}</button>
      {mode === 'reset' && !recovery && <button type="button" disabled={busy} onClick={() => switchMode('signin')} className="w-full text-sm font-semibold text-[#2F6BFF]">Back to sign in</button>}
    </form>
    <p className="text-xs leading-relaxed text-[#636875] dark:text-gray-400 mt-6">Workshop publishing is managed by the Workify admin. Member accounts are for learning and registration.</p>
  </div>;
}
