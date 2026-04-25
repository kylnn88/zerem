'use client';
import { useState } from 'react';
import { supabase } from './supabase';

export default function Onboard({ user, profile, onComplete }) {
  const [step, setStep] = useState(profile ? 3 : 1);
  const [orgId, setOrgId] = useState(profile?.org_id || null);
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [industry, setIndustry] = useState('Apparel');
  const [deptSetup, setDeptSetup] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create organisation
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert({ name: orgName, industry })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create profile
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

  async function handleFinishSetup() {
    setLoading(true);
    setError('');
    try {
      const currentOrgId = orgId || profile?.org_id;

      // Save departments to database
      if (deptSetup.length > 0) {
        for (const d of deptSetup) {
          const colors = { Operations: '#1B3A6B', HR: '#C94B2C', Accounts: '#534AB7' };
          const types = { Operations: 'operations' };
          const color = colors[d.name] || '#1B3A6B';
          const type = types[d.name] || 'general';

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

          // Add user as admin member of each department
          await supabase.from('department_members').insert({
            department_id: dept.id,
            user_id: user.id,
            role: 'admin',
          });

          
        }
      }

      // Mark setup as complete
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
            {step === 3 ? "Set up your workspace" : "Let's set up your organisation"}
          </div>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: step >= s ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: step >= s ? '#3B7DD8' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px',
        }}>

          {/* Step 1 — Name */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Your details</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Tell us a bit about yourself</div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Your full name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Sarah Chen" style={inputStyle} />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!fullName.trim()}
                style={{
                  width: '100%', padding: '11px',
                  background: fullName.trim() ? '#2456A4' : 'rgba(255,255,255,0.1)',
                  color: '#fff', border: 'none', borderRadius: '9px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: fullName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Organisation */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Your organisation</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Set up your workspace on Zerem</div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Organisation name</label>
                <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Corp" required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Industry</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Apparel', 'Manufacturing', 'Retail', 'Logistics', 'Other'].map(i => (
                    <option key={i} value={i} style={{ background: '#0D1B3E' }}>{i}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(201,75,44,0.15)', border: '1px solid rgba(201,75,44,0.4)', borderRadius: '8px', fontSize: '13px', color: '#FF8A70' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(1)} style={{ padding: '11px 20px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Back
                </button>
                <button type="submit" disabled={loading || !orgName.trim()} style={{ flex: 1, padding: '11px', background: orgName.trim() ? '#2456A4' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: loading || !orgName.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Setting up...' : 'Continue →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3 — Departments */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Add your departments</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px' }}>
                Add the departments in your organisation. Add the departments in your organisation. You can set up sub-departments inside the app.
              </div>

              {/* Added departments */}
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

              {/* Quick add buttons */}
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

              {/* Custom department input */}
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

              {error && (
                <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(201,75,44,0.15)', border: '1px solid rgba(201,75,44,0.4)', borderRadius: '8px', fontSize: '13px', color: '#FF8A70' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleFinishSetup}
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
                {loading ? 'Setting up...' : deptSetup.length > 0 ? 'Launch Zerem →' : 'Skip for now →'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
          Step {step} of 3
        </div>
      </div>
    </div>
  );
}
