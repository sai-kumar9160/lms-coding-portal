import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowUpRight } from 'lucide-react';
import { request } from '../api';
import { PasswordInput } from '../components/PasswordInput';

const headings = {
    register: ['Create your NextByte account.', 'Join your institute as a student or teacher.'],
    login: ['Sign in to NextByte.', 'Continue your learning journey.'],
    forgot: ['Forgot your password?', 'Enter your institute code and email. We will send you a link to choose a new password.'],
    reset: ['Choose a new password.', 'Use at least 10 characters. You will be signed out on other devices.'],
};
const submitLabels = { register: 'Create account', login: 'Sign in', forgot: 'Send reset link', reset: 'Save new password' };

// Modes: register, login, forgot (request a reset email), reset (opened from the emailed /reset-password?token= link).
export function AuthPage({ onLogin }) {
    const location = useLocation();
    const navigate = useNavigate();
    const resetToken = location.pathname === '/reset-password' ? new URLSearchParams(location.search).get('token') : null;
    const query = new URLSearchParams(location.search);
    // /login?mode=register opens the sign-up tab; /login?as=vendor is the partner sign-in (no institute code).
    const [mode, setMode] = useState(location.pathname === '/reset-password' ? 'reset' : query.get('mode') === 'register' ? 'register' : 'login');
    const vendorLogin = query.get('as') === 'vendor' && mode === 'login';
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [email, setEmail] = useState('');
    const [college, setCollege] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [branchGroupId, setBranchGroupId] = useState('');
    const [collegeLookup, setCollegeLookup] = useState({ code: '' });
    useEffect(() => {
        setBranchGroupId('');
        const code = college.trim();
        if (!code) {
            setCollegeLookup({ code: '' });
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            request(`/auth/college?code=${encodeURIComponent(code)}`).then(result => {
                if (!cancelled)
                    setCollegeLookup({ code, name: result.name, branches: result.branches ?? [] });
            }).catch(error => { if (!cancelled)
                setCollegeLookup({ code, error: error.message }); });
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [college]);
    const lookupCurrent = collegeLookup.code === college.trim();
    const collegeName = lookupCurrent ? collegeLookup.name : '';
    const lookupError = lookupCurrent ? collegeLookup.error : '';
    function switchMode(next) {
        setMode(next); setError(''); setNotice('');
    }
    async function submit(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        setError('');
        setNotice('');
        if ((mode === 'register' || mode === 'reset') && data.password !== data.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        delete data.confirmPassword;
        if (mode === 'register' && data.role === 'STUDENT') data.branchGroupId = Number(data.branchGroupId);
        setBusy(true);
        try {
            if (mode === 'forgot') {
                setNotice((await request('/auth/forgot-password', 'POST', data)).message);
            }
            else if (mode === 'reset') {
                const result = await request('/auth/reset-password', 'POST', { token: resetToken, password: data.password });
                // Drop the used token from the address bar.
                navigate('/login', { replace: true });
                setMode('login');
                setNotice(result.message);
            }
            else {
                const result = await request(`/auth/${mode}`, 'POST', data);
                if (mode === 'register') {
                    setMode('login');
                    // Teachers are told their account needs College Admin approval first.
                    setNotice(result.user.status === 'PENDING' ? result.message : 'Account created. Sign in with your email and password.');
                }
                else
                    onLogin(result.token);
            }
        }
        catch (error) {
            setError(error.message);
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="login-layout login-centered">
    <div className="auth-bg" aria-hidden="true"><span className="orb orb-1"/><span className="orb orb-2"/><span className="orb orb-3"/></div>
    <section className="login-panel"><div className="login-form auth-card">
      <div className="brand auth-brand"><GraduationCap size={30}/> NextByte<span className="brand-dot">.</span></div>
      <span className="eyebrow">WELCOME TO NEXTBYTE</span>
      {vendorLogin
        ? <button type="button" className="text-button back-link" onClick={() => navigate('/')}>← Back to NextByte</button>
        : mode === 'register'
        ? <button type="button" className="text-button back-link" disabled={busy} onClick={() => switchMode('login')}>← Already have an account? Sign in</button>
        : mode === 'login' ? null
        : <button type="button" className="text-button back-link" disabled={busy} onClick={() => { if (mode === 'reset') navigate('/', { replace: true }); switchMode('login'); }}>← Back to sign in</button>}
      <h2>{vendorLogin ? 'Vendor sign in.' : headings[mode][0]}</h2>
      <p className="muted">{vendorLogin ? 'Partner accounts are created by the platform admin. No institute code is needed.' : headings[mode][1]}</p>
      {error && <div role="alert" className="alert">{error}</div>}
      {notice && <div role="status" className="success">{notice}</div>}
      {mode === 'reset' && !resetToken && <div role="alert" className="alert">This reset link is incomplete. Request a new one.</div>}
      {/* Keyed by mode, so the fields fade in again when switching Register / Sign in / Forgot password. */}
      <form key={mode} className="auth-fields" onSubmit={submit}>
        {mode !== 'reset' && !vendorLogin && <label>Institute code<input name="college" value={college} onChange={e => setCollege(e.target.value)} required={mode === 'register'} placeholder={mode === 'register' ? 'Enter your institute code, e.g. srk123' : 'Leave empty for platform admin'}/>
          {college.trim() && <span className={`college-hint${lookupError ? ' error' : ''}`} role="status" aria-live="polite">{lookupError || collegeName || 'Looking up institute…'}</span>}
        </label>}
        {mode === 'register' && <>
          <label>Full name<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your full name"/></label>
          <div className="field-row"><label>Register as<select name="role" value={role} onChange={event => setRole(event.target.value)}><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option></select></label><label>Mobile number<input name="mobileNo" type="tel" required autoComplete="tel" maxLength={25} placeholder="e.g. +919876543210"/></label></div>
          {role === 'STUDENT' && <label>Branch<select name="branchGroupId" required value={branchGroupId} disabled={!collegeName} onChange={event => setBranchGroupId(event.target.value)}><option value="">Choose your branch</option>{(lookupCurrent ? collegeLookup.branches ?? [] : []).map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
            <span className="college-hint">{!collegeName ? 'Enter a valid institute code to load branches.' : !collegeLookup.branches?.length ? 'No branch groups are available. Ask your institute admin to create them in Academics.' : 'You will join this branch group for assessments.'}</span>
          </label>}
          <label>Email address<input name="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label>Password<PasswordInput name="password" required minLength={10} maxLength={100} autoComplete="new-password" placeholder="At least 10 characters"/></label>
          <label>Confirm password<PasswordInput name="confirmPassword" required minLength={10} maxLength={100} autoComplete="new-password" placeholder="Enter it again"/></label>
        </>}
        {(mode === 'login' || mode === 'forgot') && <label>Email address<input name="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>}
        {mode === 'login' && <label>Password<PasswordInput name="password" required minLength={1} maxLength={100} autoComplete="current-password" placeholder="Enter your password"/>
        </label>}
        {mode === 'login' && !vendorLogin && <div className="auth-links"><button type="button" className="register-link" disabled={busy} onClick={() => switchMode('register')}>New here? Register</button><button type="button" className="text-button forgot-link" disabled={busy} onClick={() => switchMode('forgot')}>Forgot password?</button></div>}
        {mode === 'login' && vendorLogin && <button type="button" className="text-button forgot-link" disabled={busy} onClick={() => switchMode('forgot')}>Forgot password?</button>}
        {mode === 'reset' && <div className="field-row"><label>New password<PasswordInput name="password" required minLength={10} maxLength={100} autoComplete="new-password" placeholder="At least 10 characters"/></label><label>Confirm password<PasswordInput name="confirmPassword" required minLength={10} maxLength={100} autoComplete="new-password" placeholder="Enter it again"/></label></div>}
        <button disabled={busy || (mode === 'reset' && !resetToken) || (mode === 'register' && role === 'STUDENT' && (!collegeName || !branchGroupId))} className="primary full">{busy ? 'Please wait...' : submitLabels[mode]}<ArrowUpRight size={18}/></button>
      </form>
    </div></section>
  </div>;
}
