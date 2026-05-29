export const commandMap = [
  // ── MONKEY ───────────────────────────────────────────────────────────────
  {
    id: 'M1', section: 'monkey',
    keywords: ['register agent', 'new agent', 'create agent', 'm1', 'monkey one', 'crystals keypair', 'crystals registration'],
    defaultInputs: { name: 'VoiceAgent_' + Date.now(), sector: 'banking' },
  },
  {
    id: 'M2', section: 'monkey',
    keywords: ['generate keypair', 'quantum entropy', 'm2', 'monkey two', 'new keypair', 'entropy'],
    defaultInputs: {},
  },
  {
    id: 'M3', section: 'monkey',
    keywords: ['verify signature', 'signature check', 'm3', 'monkey three', 'signature gate', 'dilithium verify'],
    defaultInputs: { useValid: true },
  },
  {
    id: 'M4', section: 'monkey',
    keywords: ['blacklist agent', 'blacklist', 'm4', 'monkey four', 'kill key', 'key blacklist'],
    defaultInputs: { reason: 'Voice command blacklist test' },
  },
  {
    id: 'M5', section: 'monkey',
    keywords: ['replay attack', 'replay', 'm5', 'monkey five', 'nonce', 'replay sealed', 'sealed payload'],
    defaultInputs: {},
  },
  {
    id: 'M6', section: 'monkey',
    keywords: ['enclave', 'memory dump', 'm6', 'monkey six', 'secure enclave', 'enclave shield'],
    defaultInputs: {},
  },
  {
    id: 'M7', section: 'monkey',
    keywords: ['oogway signal', 'identity alert', 'm7', 'monkey seven', 'oogway', 'real time identity'],
    defaultInputs: {},
  },

  // ── CRANE ─────────────────────────────────────────────────────────────────
  {
    id: 'C1', section: 'crane',
    keywords: ['issue token', 'capability token', 'c1', 'crane one', 'jwt token', 'signed token'],
    defaultInputs: { actions: ['read', 'write'] },
  },
  {
    id: 'C2', section: 'crane',
    keywords: ['out of scope', 'scope block', 'c2', 'crane two', 'block action', 'scope violation'],
    defaultInputs: { attemptAction: 'delete' },
  },
  {
    id: 'C3', section: 'crane',
    keywords: ['multi sig', 'multisig', 'c3', 'crane three', 'dilithium proof', 'capability proof', 'multi signature'],
    defaultInputs: { action: 'transfer funds', approvers: 3 },
  },
  {
    id: 'C4', section: 'crane',
    keywords: ['armoriq gate', 'second gate', 'c4', 'crane four', 'policy gate', 'armor iq gate'],
    defaultInputs: {},
  },
  {
    id: 'C5', section: 'crane',
    keywords: ['mid execution', 'checkpoint', 'c5', 'crane five', 'token expires mid', 'mid execution checkpoint'],
    defaultInputs: { expireAt: 3 },
  },
  {
    id: 'C6', section: 'crane',
    keywords: ['expired token', 'token expired', 'c6', 'crane six', 'dead token', 'token halt'],
    defaultInputs: {},
  },
  {
    id: 'C7', section: 'crane',
    keywords: ['shap score', 'jade palace', 'explain decision', 'c7', 'crane seven', 'tribunal', 'shap explainer'],
    defaultInputs: {},
  },

  // ── SNAKE ─────────────────────────────────────────────────────────────────
  {
    id: 'S1', section: 'snake',
    keywords: ['log action', 'audit log', 's1', 'snake one', 'hash log', 'sha log', 'immutable log'],
    defaultInputs: { action: 'voice_test_action' },
  },
  {
    id: 'S2', section: 'snake',
    keywords: ['verify audit signature', 'dilithium audit', 's2', 'snake two', 'audit sig', 'audit signature'],
    defaultInputs: {},
  },
  {
    id: 'S3', section: 'snake',
    keywords: ['verify chain', 'hash chain', 's3', 'snake three', 'full chain', 'chain continuity', 'verify audit chain'],
    defaultInputs: {},
  },
  {
    id: 'S4', section: 'snake',
    keywords: ['tamper detection', 'simulate tamper', 's4', 'snake four', 'tamper detect', 'tamper'],
    defaultInputs: {},
  },
  {
    id: 'S5', section: 'snake',
    keywords: ['armoriq log', 'log via armoriq', 's5', 'snake five', 'armor iq log'],
    defaultInputs: {},
  },
  {
    id: 'S6', section: 'snake',
    keywords: ['merkle checkpoint', 'merkle tree', 's6', 'snake six', 'merkle', 'merkle hash'],
    defaultInputs: {},
  },
  {
    id: 'S7', section: 'snake',
    keywords: ['sacred peach tree', 's7', 'snake seven', 'peach tree', 'merkle visual', 'live merkle'],
    defaultInputs: {},
  },

  // ── MANTIS ────────────────────────────────────────────────────────────────
  {
    id: 'A1', section: 'mantis',
    keywords: ['build baseline', 'behavioral baseline', 'a1', 'mantis one', 'baseline', '50 action'],
    defaultInputs: {},
  },
  {
    id: 'A2', section: 'mantis',
    keywords: ['peer baseline', 'peer class', 'a2', 'mantis two', 'inherit baseline', 'lattice baseline'],
    defaultInputs: {},
  },
  {
    id: 'A3', section: 'mantis',
    keywords: ['score action', 'risk score', 'a3', 'mantis three', 'real time score', 'action score'],
    defaultInputs: { action: 'read' },
  },
  {
    id: 'A4', section: 'mantis',
    keywords: ['gemini payload', 'guardrail', 'a4', 'mantis four', 'what is sent to gemini', 'payload preview'],
    defaultInputs: {},
  },
  {
    id: 'A5', section: 'mantis',
    keywords: ['compliance', 'hipaa', 'baa', 'a5', 'mantis five', 'soc 2', 'soc2'],
    defaultInputs: {},
  },
  {
    id: 'A6', section: 'mantis',
    keywords: ['offline mode', 'ollama', 'local llm', 'a6', 'mantis six', 'fallback', 'on prem'],
    defaultInputs: {},
  },
  {
    id: 'A7', section: 'mantis',
    keywords: ['honeypot route', 'trigger honeypot', 'a7', 'mantis seven', 'route to honeypot', 'auto route'],
    defaultInputs: {},
  },
  {
    id: 'A8', section: 'mantis',
    keywords: ['honeypot chamber', 'iron cage', 'fake response', 'a8', 'mantis eight', 'isolation chamber'],
    defaultInputs: {},
  },
  {
    id: 'A9', section: 'mantis',
    keywords: ['oracle scroll', 'cve predict', 'a9', 'mantis nine', 'predict threat', 'oracle'],
    defaultInputs: {},
  },

  // ── TIGRESS ───────────────────────────────────────────────────────────────
  {
    id: 'T1', section: 'tigress',
    keywords: ['armorclaw scan', 'scan message', 't1', 'tigress one', 'full scan', 'armor claw scan', 'scan for injection'],
    defaultInputs: { message: 'Hello, please process this request.' },
  },
  {
    id: 'T2', section: 'tigress',
    keywords: ['json injection', 't2', 'tigress two', 'role override', 'json attack'],
    defaultInputs: {},
  },
  {
    id: 'T3', section: 'tigress',
    keywords: ['base64 injection', 'encoded injection', 't3', 'tigress three', 'url injection', 'base 64'],
    defaultInputs: {},
  },
  {
    id: 'T4', section: 'tigress',
    keywords: ['session graph', 'semantic hash', 't4', 'tigress four', 'multi turn', 'drift detection'],
    defaultInputs: {},
  },
  {
    id: 'T5', section: 'tigress',
    keywords: ['drift signature', 'semantic drift', 't5', 'tigress five', 'drift chart', 'session drift'],
    defaultInputs: {},
  },
  {
    id: 'T6', section: 'tigress',
    keywords: ['t6', 'tigress six', 'push honeypot', 'tigress iron cage', 'rogue agent'],
    defaultInputs: {},
  },

  // ── PO ────────────────────────────────────────────────────────────────────
  {
    id: 'P1', section: 'po',
    keywords: ['po gateway', 'central gateway', 'p1', 'po one', 'send through po', 'dragon warrior gateway'],
    defaultInputs: { message: 'voice test message' },
  },
  {
    id: 'P2', section: 'po',
    keywords: ['pipeline', 'warrior checks', 'p2', 'po two', 'five warrior pipeline', 'full pipeline'],
    defaultInputs: {},
  },
  {
    id: 'P3', section: 'po',
    keywords: ['final verdict', 'deliver or kill', 'p3', 'po three', 'verdict'],
    defaultInputs: {},
  },
  {
    id: 'P4', section: 'po',
    keywords: ['kyber encrypt', 'encrypted channel', 'p4', 'po four', 'kyber 1024', 'kyber encryption'],
    defaultInputs: { message: 'voice encrypted test' },
  },
  {
    id: 'P5', section: 'po',
    keywords: ['threshold sign', 'three of five', 'bft', 'p5', 'po five', 'validator sign', 'bft threshold'],
    defaultInputs: {},
  },
  {
    id: 'P6', section: 'po',
    keywords: ['trust score', 'trust network', 'p6', 'po six', 'agent trust', 'show trust', 'trust scores'],
    defaultInputs: {},
  },
  {
    id: 'P7', section: 'po',
    keywords: ['financial signing', 'dilithium finance', 'multi approver', 'p7', 'po seven', 'finance sign'],
    defaultInputs: {},
  },
  {
    id: 'P8', section: 'po',
    keywords: ['security command', 'command dashboard', 'p8', 'po eight', 'live security', 'security dashboard'],
    defaultInputs: {},
  },
  {
    id: 'P9', section: 'po',
    keywords: ['sector filter', 'filter sector', 'p9', 'po nine', 'banking filter', 'healthcare filter'],
    defaultInputs: { sector: 'banking' },
  },
  {
    id: 'P10', section: 'po',
    keywords: ['verify logs', 'tamper proof logs', 'p10', 'po ten', 'audit display'],
    defaultInputs: {},
  },
  {
    id: 'P11', section: 'po',
    keywords: ['risk chart', 'risk history', 'p11', 'po eleven', 'live risk', 'risk scoring chart'],
    defaultInputs: {},
  },

  // ── MIRROR ATTACKS ────────────────────────────────────────────────────────
  {
    id: 'MIRROR_ALL', section: 'mirror',
    keywords: ['run all attacks', 'mirror test', 'all eleven attacks', 'run mirror', 'eleven attacks', 'all 11', 'run all 11'],
    batch: true,
    features: ['MIRROR_1','MIRROR_2','MIRROR_3','MIRROR_4','MIRROR_5','MIRROR_6','MIRROR_7','MIRROR_8','MIRROR_9','MIRROR_10','MIRROR_11'],
  },
  { id: 'MIRROR_1',  section: 'mirror', keywords: ['attack one', 'stolen key attack', 'mirror one', 'stolen api'], defaultInputs: {} },
  { id: 'MIRROR_2',  section: 'mirror', keywords: ['attack two', 'replay attack mirror', 'mirror two'], defaultInputs: {} },
  { id: 'MIRROR_3',  section: 'mirror', keywords: ['attack three', 'expired token attack', 'mirror three'], defaultInputs: {} },
  { id: 'MIRROR_4',  section: 'mirror', keywords: ['attack four', 'scope attack', 'mirror four'], defaultInputs: {} },
  { id: 'MIRROR_5',  section: 'mirror', keywords: ['attack five', 'tamper attack', 'mirror five'], defaultInputs: {} },
  { id: 'MIRROR_6',  section: 'mirror', keywords: ['attack six', 'json attack mirror', 'mirror six'], defaultInputs: {} },
  { id: 'MIRROR_7',  section: 'mirror', keywords: ['attack seven', 'base64 attack', 'mirror seven'], defaultInputs: {} },
  { id: 'MIRROR_8',  section: 'mirror', keywords: ['attack eight', 'multi turn attack', 'mirror eight'], defaultInputs: {} },
  { id: 'MIRROR_9',  section: 'mirror', keywords: ['attack nine', 'behavioral attack', 'mirror nine'], defaultInputs: {} },
  { id: 'MIRROR_10', section: 'mirror', keywords: ['attack ten', 'cold start attack', 'mirror ten'], defaultInputs: {} },
  { id: 'MIRROR_11', section: 'mirror', keywords: ['attack eleven', 'quantum forgery', 'mirror eleven'], defaultInputs: {} },

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  { id: 'NAV_MONKEY',   section: 'monkey',   keywords: ['go to monkey',   'open monkey',   'monkey section'],           nav: true },
  { id: 'NAV_CRANE',    section: 'crane',    keywords: ['go to crane',    'open crane',    'crane section'],            nav: true },
  { id: 'NAV_SNAKE',    section: 'snake',    keywords: ['go to snake',    'open snake',    'snake section'],            nav: true },
  { id: 'NAV_MANTIS',   section: 'mantis',   keywords: ['go to mantis',   'open mantis',   'mantis section'],           nav: true },
  { id: 'NAV_TIGRESS',  section: 'tigress',  keywords: ['go to tigress',  'open tigress',  'tigress section'],          nav: true },
  { id: 'NAV_PO',       section: 'po',       keywords: ['go to po',       'open po',       'po section'],               nav: true },
  { id: 'NAV_MIRROR',   section: 'mirror',   keywords: ['go to mirror',   'open mirror test', 'mirror test section'],   nav: true },
  { id: 'NAV_OVERVIEW', section: 'overview', keywords: ['go home',        'overview',      'home', 'go to overview'],   nav: true },

  // ── BATCH SECTION COMMANDS ────────────────────────────────────────────────
  {
    id: 'BATCH_MONKEY', section: 'monkey',
    keywords: ['run all monkey', 'run monkey features', 'all monkey'],
    batch: true,
    features: ['M1','M2','M3','M4','M5','M6','M7'],
  },
  {
    id: 'BATCH_CRANE', section: 'crane',
    keywords: ['run all crane', 'run crane features', 'all crane'],
    batch: true,
    features: ['C1','C2','C3','C4','C5','C6','C7'],
  },
  {
    id: 'BATCH_SNAKE', section: 'snake',
    keywords: ['run all snake', 'run snake features', 'all snake'],
    batch: true,
    features: ['S1','S2','S3','S4','S5','S6','S7'],
  },

  // ── STATUS QUERIES ────────────────────────────────────────────────────────
  { id: 'STATUS_ALL',    keywords: ['system status', 'status check', 'are you online', 'check backend', 'all systems'],  status: true },
  { id: 'STATUS_AGENTS', keywords: ['how many agents', 'agent count', 'list agents', 'show agents'],                     status: true },
  { id: 'STATUS_MERKLE', keywords: ['merkle status', 'chain status', 'is chain intact', 'chain okay'],                   status: true },
  { id: 'STATUS_TRUST',  keywords: ['trust scores', 'agent trust scores'],                                                status: true },
];
