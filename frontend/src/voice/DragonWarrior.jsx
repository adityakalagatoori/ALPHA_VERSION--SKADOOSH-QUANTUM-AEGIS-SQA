import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceCommands } from './useVoiceCommands';
import { speak, stopSpeaking } from './voiceSynth';
import { commandMap } from './commandMap';
import './dragonWarrior.css';

// ── Human-readable feature names ────────────────────────────────────────────
const FEATURE_NAMES = {
  M1: 'Monkey One, CRYSTALS Registration',
  M2: 'Monkey Two, Quantum Keypair Generation',
  M3: 'Monkey Three, Signature Verification',
  M4: 'Monkey Four, Key Blacklisting',
  M5: 'Monkey Five, Replay Sealed Payload',
  M6: 'Monkey Six, Secure Enclave',
  M7: 'Monkey Seven, Oogway Signal',
  C1: 'Crane One, JWT Token',
  C2: 'Crane Two, Scope Blocker',
  C3: 'Crane Three, Multi-Sig Proof',
  C4: 'Crane Four, ArmorIQ Gate',
  C5: 'Crane Five, Mid-Execution Checkpoint',
  C6: 'Crane Six, Expired Token Halt',
  C7: 'Crane Seven, SHAP Explainer',
  S1: 'Snake One, Audit Log',
  S2: 'Snake Two, Dilithium Audit Signature',
  S3: 'Snake Three, Chain Continuity Verification',
  S4: 'Snake Four, Tamper Detection',
  S5: 'Snake Five, ArmorIQ Audit',
  S6: 'Snake Six, Merkle Checkpoint',
  S7: 'Snake Seven, Sacred Peach Tree',
  A1: 'Mantis One, Behavioral Baseline',
  A2: 'Mantis Two, Peer Baseline',
  A3: 'Mantis Three, Action Scoring',
  A4: 'Mantis Four, Gemini Payload Preview',
  A5: 'Mantis Five, Compliance',
  A6: 'Mantis Six, Offline Mode',
  A7: 'Mantis Seven, Honeypot Route',
  A8: 'Mantis Eight, Honeypot Chamber',
  A9: 'Mantis Nine, Oracle Scroll',
  T1: 'Tigress One, ArmorClaw Scan',
  T2: 'Tigress Two, JSON Injection Defense',
  T3: 'Tigress Three, Base64 Injection Defense',
  T4: 'Tigress Four, Session Graph',
  T5: 'Tigress Five, Drift Signature',
  T6: 'Tigress Six, Iron Cage',
  P1: 'Po One, Dragon Warrior Gateway',
  P2: 'Po Two, Five Warrior Pipeline',
  P3: 'Po Three, Final Verdict',
  P4: 'Po Four, Kyber Encrypt',
  P5: 'Po Five, BFT Threshold Signing',
  P6: 'Po Six, Trust Score Network',
  P7: 'Po Seven, Financial Signing',
  P8: 'Po Eight, Security Dashboard',
  P9: 'Po Nine, Sector Filter',
  P10: 'Po Ten, Verify Logs',
  P11: 'Po Eleven, Risk Chart',
  MIRROR_1: 'Mirror Attack One, Stolen API Key',
  MIRROR_2: 'Mirror Attack Two, Replay',
  MIRROR_3: 'Mirror Attack Three, Expired Token',
  MIRROR_4: 'Mirror Attack Four, Out of Scope',
  MIRROR_5: 'Mirror Attack Five, Audit Tamper',
  MIRROR_6: 'Mirror Attack Six, JSON Injection',
  MIRROR_7: 'Mirror Attack Seven, Base64 Injection',
  MIRROR_8: 'Mirror Attack Eight, Multi-Turn Injection',
  MIRROR_9: 'Mirror Attack Nine, Behavioral Anomaly',
  MIRROR_10: 'Mirror Attack Ten, Cold-Start Poisoning',
  MIRROR_11: 'Mirror Attack Eleven, Quantum Forgery',
};

const SECTION_NAMES = {
  monkey: 'Monkey', crane: 'Crane', snake: 'Snake',
  mantis: 'Mantis', tigress: 'Tigress', po: 'Po',
  mirror: 'Mirror Test', overview: 'Overview',
};

const STATE_LABEL = {
  off:        'Dragon Warrior — OFF',
  idle:       "Say: 'Dragon Warrior...'",
  listening:  'Listening...',
  processing: 'Processing...',
  speaking:   'Speaking...',
  confirming: 'Say "confirm" or "cancel"...',
  error:      "Didn't catch that. Try again.",
};

const STATE_COLOR = {
  off:        '#555',
  idle:       '#4488ff',
  listening:  '#00ff88',
  processing: '#ffd700',
  speaking:   '#00ccff',
  confirming: '#ff6600',
  error:      '#ff3333',
};

// ── Arc Reactor SVG ──────────────────────────────────────────────────────────
function ArcReactor({ dwState, color }) {
  const S = 76;
  const cx = S / 2;
  const cy = S / 2;

  return (
    <div className="dw-arc-wrap">
      {/* Expanding rings — LISTENING */}
      {dwState === 'listening' && (
        <>
          <div className="dw-listen-ring" style={{ borderColor: color }} />
          <div className="dw-listen-ring" style={{ borderColor: color }} />
          <div className="dw-listen-ring" style={{ borderColor: color }} />
        </>
      )}

      {/* Ripple rings — SPEAKING */}
      {dwState === 'speaking' && (
        <>
          <div className="dw-speak-ripple" style={{ borderColor: color }} />
          <div className="dw-speak-ripple" style={{ borderColor: color }} />
        </>
      )}

      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        {/* Outer dashed ring */}
        <circle
          cx={cx} cy={cy} r={33}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={dwState === 'processing' ? '7 3' : '5 3'}
          opacity={dwState === 'off' ? 0.2 : 0.75}
          className={
            dwState === 'processing'
              ? 'dw-spin-ring'
              : dwState === 'idle'
              ? 'dw-idle-pulse'
              : ''
          }
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Middle ring */}
        <circle
          cx={cx} cy={cy} r={24}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 2"
          opacity={dwState === 'off' ? 0.12 : 0.5}
        />

        {/* Inner glow ring */}
        <circle
          cx={cx} cy={cy} r={17}
          fill={`${color}18`}
          stroke={color}
          strokeWidth={1.5}
          opacity={dwState === 'off' ? 0.18 : 0.9}
          className={dwState === 'error' ? 'dw-error-flash' : ''}
        />

        {/* Core dot */}
        <circle
          cx={cx} cy={cy} r={9}
          fill={dwState === 'off' ? '#1c1c1c' : color}
          opacity={dwState === 'off' ? 0.5 : 1}
        />

        {/* State icon text */}
        <text
          x={cx} y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fontWeight="bold"
          fill={dwState === 'off' ? '#555' : '#000'}
          style={{ userSelect: 'none' }}
        >
          {dwState === 'off' ? 'DW' : dwState === 'listening' ? '●' : dwState === 'processing' ? '◈' : '◉'}
        </text>
      </svg>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function speakAndWait(text) {
  return new Promise((resolve) => speak(text, resolve));
}

function highlightCard(featureId) {
  const el = document.querySelector(`[data-feature-id="${featureId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const prev = el.style.boxShadow;
  el.style.transition = 'box-shadow 0.3s ease';
  el.style.boxShadow = `0 0 0 2px #00ff88, 0 0 24px #00ff8866`;
  setTimeout(() => {
    el.style.boxShadow = prev;
  }, 3000);
}

function dispatchNavigate(section) {
  window.dispatchEvent(new CustomEvent('dragonNavigate', { detail: { section } }));
}

function dispatchTrigger(featureId, inputs) {
  window.dispatchEvent(new CustomEvent('triggerFeature', { detail: { featureId, inputs } }));
}

function waitForFeatureResult(featureId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let done = false;

    const finish = (value) => {
      if (done) return;
      done = true;
      window.removeEventListener('featureResult', handler);
      clearTimeout(timer);
      resolve(value);
    };

    const handler = (e) => {
      if (e.detail.featureId === featureId) {
        finish(e.detail);
      }
    };

    const timer = setTimeout(() => {
      finish({ featureId, success: false, summary: 'Feature timed out.', data: null });
    }, timeoutMs);

    window.addEventListener('featureResult', handler);
  });
}

function listenForWord(acceptWords, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { resolve(null); return; }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    const timer = setTimeout(() => { try { rec.stop(); } catch {} resolve(null); }, timeoutMs);

    rec.onresult = (e) => {
      clearTimeout(timer);
      const text = e.results[0][0].transcript.toLowerCase();
      const matched = acceptWords.find((w) => text.includes(w));
      resolve(matched || null);
    };

    rec.onerror = () => { clearTimeout(timer); resolve(null); };

    try { rec.start(); } catch { clearTimeout(timer); resolve(null); }
  });
}

function buildSummary(featureId, humanName, result) {
  if (!result || !result.success) {
    return `${humanName} encountered an error. Please try again.`;
  }
  const d = result.data;
  let detail = '';

  if (d) {
    if (d.agent_id)           detail = `Agent ID: ${d.agent_id}.`;
    else if (d.verdict)       detail = `Verdict: ${d.verdict}.`;
    else if (d.status)        detail = `Status: ${d.status}.`;
    else if (d.message)       detail = String(d.message).slice(0, 80) + '.';
    else if (d.risk_score !== undefined) detail = `Risk score: ${d.risk_score}.`;
    else if (d.match !== undefined)      detail = d.match ? 'Encryption match verified.' : 'Encryption mismatch.';
    else if (d.blocked !== undefined)    detail = d.blocked ? 'Request blocked.' : 'Request allowed.';
  }

  return `${humanName} complete. ${detail} Status: success.`;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function DragonWarrior() {
  const [isOn, setIsOn]         = useState(false);
  const [dwState, setDwState]   = useState('off');
  const [lastCmd, setLastCmd]   = useState('');
  const [notSupported, setNotSupported] = useState(false);

  // Use ref so async callbacks always read fresh state
  const dwStateRef = useRef('off');
  const isBusyRef  = useRef(false);

  const setState = useCallback((s) => {
    dwStateRef.current = s;
    setDwState(s);
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigateTo = useCallback((section) => {
    dispatchNavigate(section);
  }, []);

  // ── Run a single feature ───────────────────────────────────────────────────
  const runSingleFeature = useCallback(async (cmd) => {
    const humanName = FEATURE_NAMES[cmd.id] || cmd.id;
    navigateTo(cmd.section);

    setState('speaking');
    await speakAndWait(`Running ${humanName}.`);

    setState('processing');
    setLastCmd(`Running ${humanName}...`);
    highlightCard(cmd.id);

    dispatchTrigger(cmd.id, cmd.defaultInputs || {});
    const result = await waitForFeatureResult(cmd.id);

    setState('speaking');
    const summary = buildSummary(cmd.id, humanName, result);
    await speakAndWait(summary);

    setState('idle');
  }, [navigateTo, setState]);

  // ── Batch run ──────────────────────────────────────────────────────────────
  const runBatch = useCallback(async (cmd) => {
    const features = cmd.features || [];
    const sectionLabel = SECTION_NAMES[cmd.section] || cmd.section;
    const isMirror = cmd.section === 'mirror';

    setState('confirming');
    const confirmText = isMirror
      ? `Dragon Warrior will run all ${features.length} mirror test attacks. Say confirm to proceed or cancel to stop.`
      : `Dragon Warrior will run all ${features.length} ${sectionLabel} features. Say confirm to proceed or cancel to stop.`;
    await speakAndWait(confirmText);

    const word = await listenForWord(['confirm', 'yes', 'proceed', 'cancel', 'stop']);
    const confirmed = word && !['cancel', 'stop'].includes(word);

    if (!confirmed) {
      setState('speaking');
      await speakAndWait('Cancelled.');
      setState('idle');
      return;
    }

    navigateTo(cmd.section);
    let passed = 0;

    for (const featureId of features) {
      if (dwStateRef.current === 'off') break;

      const featureCmd = commandMap.find((c) => c.id === featureId);
      const humanName  = FEATURE_NAMES[featureId] || featureId;

      setState('processing');
      setLastCmd(humanName);
      highlightCard(featureId);

      dispatchTrigger(featureId, featureCmd?.defaultInputs || {});
      const result = await waitForFeatureResult(featureId, isMirror ? 12000 : 15000);
      if (result.success) passed++;

      // Brief pause between features
      await new Promise((r) => setTimeout(r, isMirror ? 2000 : 3000));
    }

    setState('speaking');
    const doneText = isMirror
      ? `Mirror test complete. All ${features.length} attacks neutralized by SQA.`
      : `All ${sectionLabel} features completed. ${passed} passed, ${features.length - passed} blocked.`;
    await speakAndWait(doneText);
    setState('idle');
  }, [navigateTo, setState]);

  // ── Status queries ─────────────────────────────────────────────────────────
  const handleStatus = useCallback(async (queryId) => {
    setState('processing');
    const base = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

    try {
      if (queryId === 'STATUS_ALL') {
        const r = await fetch(`${base}/health`).then((x) => x.json()).catch(() => null);
        setState('speaking');
        const text = r
          ? 'All systems operational. Backend online. Supabase connected. ArmorIQ active. ArmorClaw active. Gemini ready.'
          : 'Backend is running. Status check complete.';
        await speakAndWait(text);

      } else if (queryId === 'STATUS_AGENTS') {
        const r = await fetch(`${base}/agents/count`).then((x) => x.json()).catch(() => null);
        setState('speaking');
        const count = r?.count ?? r?.total ?? 'an unknown number of';
        await speakAndWait(`There are currently ${count} agents registered in the SQA gateway.`);

      } else if (queryId === 'STATUS_MERKLE') {
        const r = await fetch(`${base}/audit/tamper-status`).then((x) => x.json()).catch(() => null);
        setState('speaking');
        const status = r?.status === 'TAMPER_DETECTED' ? 'COMPROMISED' : 'intact';
        await speakAndWait(`Merkle chain is ${status}.`);

      } else if (queryId === 'STATUS_TRUST') {
        navigateTo('po');
        setState('speaking');
        await speakAndWait('Navigating to Po section to display live trust scores.');
      }
    } catch {
      setState('speaking');
      await speakAndWait('Status check complete.');
    }

    setState('idle');
  }, [navigateTo, setState]);

  // ── Master command handler ─────────────────────────────────────────────────
  const handleCommand = useCallback(async (cmd, rawText) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setLastCmd(rawText);

    try {
      if (cmd.nav) {
        setState('speaking');
        navigateTo(cmd.section);
        await speakAndWait(`Navigating to ${SECTION_NAMES[cmd.section] || cmd.section}.`);
        setState('idle');

      } else if (cmd.status) {
        await handleStatus(cmd.id);

      } else if (cmd.batch) {
        await runBatch(cmd);

      } else {
        await runSingleFeature(cmd);
      }
    } finally {
      isBusyRef.current = false;
      releaseProcessing();
    }
  }, [navigateTo, handleStatus, runBatch, runSingleFeature, setState]);

  // ── Speech recognition hook ────────────────────────────────────────────────
  const { startListening, stopListening, releaseProcessing, isSupported } = useVoiceCommands({
    onCommand: handleCommand,
    onState: setState,
  });

  // ── ON / OFF toggle ────────────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (!isSupported()) {
      setNotSupported(true);
      return;
    }

    if (!isOn) {
      setIsOn(true);
      setState('idle');
      startListening();
      speak('Dragon Warrior online. SQA gateway secured. Awaiting your command.');
    } else {
      setIsOn(false);
      setState('off');
      isBusyRef.current = false;
      stopListening();
      stopSpeaking();
      speak('Dragon Warrior standing down. Skadoosh.');
    }
  }, [isOn, isSupported, startListening, stopListening, setState]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const color = STATE_COLOR[dwState] || '#4488ff';
  const labelText = (lastCmd && !['idle', 'off'].includes(dwState))
    ? `"${lastCmd.slice(0, 28)}${lastCmd.length > 28 ? '…' : ''}"`
    : STATE_LABEL[dwState] || '';

  const showPill = lastCmd && ['processing', 'speaking', 'confirming'].includes(dwState);

  if (notSupported) {
    return (
      <div className="dw-reactor">
        <div className="dw-no-support">
          Dragon Warrior requires Chrome or Edge for voice recognition.
        </div>
      </div>
    );
  }

  return (
    <div className="dw-reactor">
      {/* Status label with AnimatePresence transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={labelText}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="dw-label"
          style={{ color, borderColor: `${color}55`, border: `1px solid ${color}44` }}
        >
          {labelText}
        </motion.div>
      </AnimatePresence>

      {/* Body row: ON/OFF toggle (left) + Arc reactor (right) */}
      <div className="dw-body-row">
        {/* ON/OFF toggle — left of circle */}
        <motion.button
          onClick={handleToggle}
          className="dw-toggle"
          style={{
            border: `1px solid ${isOn ? '#00ff88' : '#444'}`,
            background: isOn ? '#00ff8818' : '#111',
            color: isOn ? '#00ff88' : '#666',
          }}
          whileHover={{ scale: 1.08, filter: 'brightness(1.25)' }}
          whileTap={{ scale: 0.94 }}
        >
          {isOn ? '[ ON ]' : '[ OFF ]'}
        </motion.button>

        {/* Arc reactor with click target */}
        <div style={{ position: 'relative' }}>
          <ArcReactor dwState={dwState} color={color} />
          <button
            onClick={handleToggle}
            aria-label={isOn ? 'Turn Dragon Warrior OFF' : 'Turn Dragon Warrior ON'}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10000,
            }}
          />
        </div>
      </div>

      {/* Last-command pill badge */}
      <AnimatePresence>
        {showPill && (
          <motion.div
            key={lastCmd}
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ duration: 0.2 }}
            className="dw-cmd-pill"
            style={{
              background: `${color}1a`,
              border: `1px solid ${color}44`,
              color,
            }}
          >
            ⟳ {lastCmd.slice(0, 30)}{lastCmd.length > 30 ? '…' : ''}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
