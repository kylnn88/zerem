'use client';
import { useState } from 'react';
import { supabase } from './supabase';

export default function Onboard({ user, profile, onComplete }) {
  const [step, setStep] = useState(profile ? 3 : 1);
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [orgId, setOrgId] = useState(profile?.org_id || null);
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [industry, setIndustry] = useState('Apparel');
  const [deptSetup, setDeptSetup] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinSent, setJoinSent] = useState(false);

  async function handleCreateOrg(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Generate org code
      const code = orgName.replace(/\s+/g, '').toUpperCase().slice(0, 4) + '-' + Math.floor(1000 + Math.random() * 9000);

      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert({ name: orgName, industry, org_code: code })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          role: 'admin',
          org_id: org.id,
          setup_complete: false,
        });

      if (profileError) throw profileError;

      setOrgId(org.id);
      setStep(3);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleJoinOrg(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Find org by code
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .select('*')
        .eq('org_code', orgCode.trim().toUpperCase())
        .single();

      if (orgError || !org) {
        setError('Organisation code not found. Please check and try again.');
        setLoading(false);
        return;
      }

      // Create profile with pending status
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          role: 'member',
          org_id: org.id,
          setup_complete: false,
        });

      if (profileError) throw profileError;

      // Create join request
      const { error: reqError } = await supabase
        .from('join_requests')
        .insert({
          org_id: org.id,
          user_id: user.id,
          full_name: fullName,
          email: user.email,
          role: 'member',
          status: 'pending',
        });

      if (reqError) throw reqError;

      setJoinSent(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleFinishSetup() {
    setLoading(true);
    setError('');
    try {
      const currentOrgId = orgId || profile?.org_id;

      if (deptSetup.length > 0) {
        for (const d of deptSetup) {
          const colors = { Operations: '#1B3A6B', HR: '#C94B2C', Accounts: '#534AB7', Marketing: '#087A6B', Logistics: '#B87316' };
          const color = colors[d.name] || '#1B3A6B';
          const type = d.name === 'Operations' ? 'operations' : 'general';

          const { data: dept, error: deptError } = await supabase
            .from('departments')
            .insert({
              org_id: currentOrgId,
              name: d.name,
              type,
              color,
              icon: d.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3),
              description: '',
            })
            .select()
            .single();

          if (deptError) throw deptError;

          await supabase.from('department_members').insert({
            department_id: dept.id,
            user_id: user.id,
            role: 'admin',
          });
        }
      }

      await supabase
        .from('profiles')
        .update({ setup_complete: true })
        .eq('id', user.id);

      onComplete();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function addDept() {
    if (!newDept.trim()) return;
    setDeptSetup([...deptSetup, { name: newDept.trim() }]);
    setNewDept('');
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 13px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    fontSize: '14px',
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

  const totalSteps = mode === 'join' ? 2 : 3;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #091529 0%, #0D1B3E 50%, #1B3A6B 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: '480px', padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: '#1B3A6B', border: '1px solid #2456A4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '800', color: '#fff',
            margin: '0 auto 14px',
          }}>Z</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>Welcome to Zerem</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
            {joinSent ? 'Request sent!' : step === 3 ? 'Set up your workspace' : "Let's get you started"}
          </div>
        </div>

        {/* Steps indicator */}
        {!joinSent && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} style={{
                width: step >= i + 1 ? '24px' : '8px',
                height: '8px', borderRadius: '4px',
                background: step >= i + 1 ? '#3B7DD8' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '28px',
        }}>

          {/* Join request sent */}
          {joinSent && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Request sent!</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '20px' }}>
                Your request to join the organisation has been sent to the admin. You will be able to access Zerem once they approve your request.
              </div>
              <div style={{ padding: '12px', background: 'rgba(59,125,216,0.15)', border: '1px solid rgba(59,125,216,0.3)', borderRadius: '8px', fontSize: '12px', color: '#7EB8FF' }}>
                You can close this window and come back after you receive approval.
              </div>
            </div>
          )}

          {/* Step 1 — Name */}
          {!joinSent && step === 1 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Your details</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Tell us your name to get started</div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Your full name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle} />
              </div>
              <button onClick={() => setStep(2)} disabled={!fullName.trim()} style={{
                width: '100%', padding: '11px',
                background: fullName.trim() ? '#2456A4' : 'rgba(255,255,255,0.1)',
                color: '#fff', border: 'none', borderRadius: '9px',
                fontSize: '14px', fontWeight: '600',
                cursor: fullName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Create or Join */}
          {!joinSent && step === 2 && !mode && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Your organisation</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Are you setting up a new workspace or joining an existing one?</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div onClick={() => setMode('create')} style={{
                  padding: '16px', background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '10px',
                  cursor: 'pointer', transition: 'all .15s',
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B7DD8'; e.currentTarget.style.background = 'rgba(59,125,216,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>🏢 Create new organisation</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Set up a new workspace for your team</div>
                </div>

                <div onClick={() => setMode('join')} style={{
                  padding: '16px', background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '10px',
                  cursor: 'pointer', transition: 'all .15s',
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B7DD8'; e.currentTarget.style.background = 'rgba(59,125,216,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>🔗 Join existing organisation</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Enter an organisation code to request access</div>
                </div>
              </div>

              <button onClick={() => setStep(1)} style={{
                width: '100%', padding: '10px', background: 'transparent',
                color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '9px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
              }}>← Back</button>
            </div>
          )}

          {/* Step 2 — Create org form */}
          {!joinSent && step === 2 && mode === 'create' && (
            <form onSubmit={handleCreateOrg}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Create organisation</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Set up your new workspace on Zerem</div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Organisation name</label>
                <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Acme Corp" required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Industry</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Apparel', 'Manufacturing', 'Retail', 'Logistics', 'Other'].map(i => (
                    <option key={i} value={i} style={{ background: '#0D1B3E' }}>{i}</option>
                  ))}
                </select>
              </div>

              {error && <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(201,75,44,0.15)', border: '1px solid rgba(201,75,44,0.4)', borderRadius: '8px', fontSize: '13px', color: '#FF8A70' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setMode(null)} style={{ padding: '11px 20px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
                <button type="submit" disabled={loading || !orgName.trim()} style={{ flex: 1, padding: '11px', background: orgName.trim() ? '#2456A4' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: loading || !orgName.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Setting up...' : 'Continue →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2 — Join org form */}
          {!joinSent && step === 2 && mode === 'join' && (
            <form onSubmit={handleJoinOrg}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Join organisation</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Enter the organisation code shared by your admin</div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Organisation code</label>
                <input
                  value={orgCode}
                  onChange={e => setOrgCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ACME-1234"
                  required
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '16px', fontWeight: '600' }}
                />
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>Ask your admin for the organisation code</div>
              </div>

              {error && <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(201,75,44,0.15)', border: '1px solid rgba(201,75,44,0.4)', borderRadius: '8px', fontSize: '13px', color: '#FF8A70' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setMode(null)} style={{ padding: '11px 20px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
                <button type="submit" disabled={loading || !orgCode.trim()} style={{ flex: 1, padding: '11px', background: orgCode.trim() ? '#2456A4' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: loading || !orgCode.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Sending request...' : 'Request to join →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3 — Department setup */}
          {!joinSent && step === 3 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Add your departments</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px' }}>
                Add the departments in your organisation. You can set up sub-departments inside the app.
              </div>

              {deptSetup.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  {deptSetup.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B7DD8', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', color: '#fff', fontWeight: '500' }}>{d.name}</span>
                      <button onClick={() => setDeptSetup(deptSetup.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Quick add</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Operations', 'HR', 'Accounts', 'Marketing', 'Logistics'].filter(n => !deptSetup.find(d => d.name === n)).map(name => (
                    <button key={name} onClick={() => setDeptSetup([...deptSetup, { name }])} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      + {name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                  value={newDept}
                  onChange={e => setNewDept(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDept(); } }}
                  placeholder="Or type a custom department..."
                  style={{ flex: 1, padding: '9px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '13px', color: '#fff', fontFamily: 'inherit', outline: 'none' }}
                />
                <button onClick={addDept} style={{ padding: '9px 16px', background: '#2456A4', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
              </div>

              {error && <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(201,75,44,0.15)', border: '1px solid rgba(201,75,44,0.4)', borderRadius: '8px', fontSize: '13px', color: '#FF8A70' }}>{error}</div>}

              <button onClick={handleFinishSetup} disabled={loading} style={{
                width: '100%', padding: '11px', background: '#2456A4',
                color: '#fff', border: 'none', borderRadius: '9px',
                fontSize: '14px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Setting up...' : deptSetup.length > 0 ? 'Launch Zerem →' : 'Skip for now →'}
              </button>
            </div>
          )}
        </div>

        {!joinSent && (
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
            Step {step} of {totalSteps}
          </div>
        )}
      </div>
    </div>
  );
}
