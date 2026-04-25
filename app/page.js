'use client';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Onboard from './onboard';

export default function Home() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile(session.user);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkProfile(user) {
    const { data } = await supabase
      .from('profiles')
      .select('*, organisations(name)')
      .eq('id', user.id)
      .single();
    setProfile(data);
    setLoading(false);
  }

  if (loading) return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#091529',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontFamily: 'sans-serif' }}>
        Loading...
      </div>
    </div>
  );

  if (!session) return <AuthPage />;

  if (!profile) return (
    <Onboard
      user={session.user}
      onComplete={() => checkProfile(session.user)}
    />
  );

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams({
      user_id: session.user.id,
      org_id: profile.org_id,
      full_name: profile.full_name || '',
      role: profile.role || 'member',
      org_name: profile.organisations?.name || '',
      email: session.user.email || '',
    });
    window.location.replace('/zerem.html?' + params.toString());
  }
  return null;
}

function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, org_name: orgName }
      }
    });
    if (error) setError(error.message);
    else setMessage('Account created! You can now log in.');
    setLoading(false);
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 13px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #091529 0%, #0D1B3E 50%, #1B3A6B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: '420px', padding: '0 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: '#1B3A6B', border: '1px solid #2456A4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '800', color: '#fff',
            margin: '0 auto 14px', letterSpacing: '-1px',
          }}>Z</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>Zerem</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>Operations, organised.</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px',
        }}>

          <div style={{
            display: 'flex', marginBottom: '24px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '3px',
          }}>
            <button
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit',
                background: mode === 'login' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: mode === 'login' ? '#fff' : 'rgba(255,255,255,0.45)',
              }}
            >
              Log in
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit',
                background: mode === 'signup' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: mode === 'signup' ? '#fff' : 'rgba(255,255,255,0.45)',
              }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>

            {mode === 'signup' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Full name</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Sarah Chen"
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Organisation name</label>
                  <input
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: '14px', padding: '10px 12px',
                background: 'rgba(201,75,44,0.15)',
                border: '1px solid rgba(201,75,44,0.4)',
                borderRadius: '8px', fontSize: '13px', color: '#FF8A70',
              }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{
                marginBottom: '14px', padding: '10px 12px',
                background: 'rgba(59,125,216,0.15)',
                border: '1px solid rgba(59,125,216,0.4)',
                borderRadius: '8px', fontSize: '13px', color: '#7EB8FF',
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                background: '#2456A4',
                color: '#fff', border: 'none', borderRadius: '9px',
                fontSize: '14px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in to Zerem' : 'Create account'}
            </button>

          </form>
        </div>

        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '12px', color: 'rgba(255,255,255,0.25)',
        }}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </div>

      </div>
    </div>
  );
}
