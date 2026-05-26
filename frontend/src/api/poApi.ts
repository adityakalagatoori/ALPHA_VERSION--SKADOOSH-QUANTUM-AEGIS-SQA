import { API_BASE } from '../lib/api'

// ========================================================
// DASHBOARD
// ========================================================

export async function fetchDashboardOverview() {

  const res = await fetch(
    `${API_BASE}/po/dashboard/overview`
  );

  return await res.json();
}

export async function fetchLiveDashboard() {

  const res = await fetch(
    `${API_BASE}/po/dashboard/live`
  );

  return await res.json();
}

export async function fetchLiveRiskFeed() {

  const res = await fetch(
    `${API_BASE}/po/dashboard/risk/live`
  );

  return await res.json();
}

export async function fetchPipelineFeed() {

  const res = await fetch(
    `${API_BASE}/po/dashboard/pipeline/live`
  );

  return await res.json();
}

export async function fetchLiveAlerts() {

  const res = await fetch(
    `${API_BASE}/po/dashboard/alerts/live`
  );

  return await res.json();
}

export async function fetchHoneypotFeed() {

  const res = await fetch(
    `${API_BASE}/po/dashboard/honeypot`
  );

  return await res.json();
}

// ========================================================
// TRUST NETWORK
// ========================================================

export async function fetchTrustScores() {

  const res = await fetch(
    `${API_BASE}/po/trust/all`
  );

  return await res.json();
}

// ========================================================
// BFT
// ========================================================

export async function fetchBFTRequests() {

  const res = await fetch(
    `${API_BASE}/po/bft/all`
  );

  return await res.json();
}

export async function approveValidator(
  requestId: string,
  validatorId: string
) {

  const res = await fetch(

    `${API_BASE}/po/bft/${requestId}/sign`,

    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        validator_id: validatorId,
      }),
    }
  );

  return await res.json();
}

// ========================================================
// FINANCE
// ========================================================

export async function fetchFinanceRequests() {

  const res = await fetch(
    `${API_BASE}/po/finance/all`
  );

  return await res.json();
}

export async function approveFinanceRequest(
  transactionId: string,
  validatorId: string
) {

  const res = await fetch(

    `${API_BASE}/po/finance/${transactionId}/approve`,

    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        validator_id: validatorId,
      }),
    }
  );

  return await res.json();
}

export async function executeFinanceRequest(
  transactionId: string
) {

  const res = await fetch(

    `${API_BASE}/po/finance/${transactionId}/execute`,

    {
      method: "POST",
    }
  );

  return await res.json();
}

// ========================================================
// AUDIT CHAIN
// ========================================================

export async function fetchAuditChain() {

  const res = await fetch(
    `${API_BASE}/po/dashboard/audit-chain`
  );

  return await res.json();
}

export async function verifyAuditLog(
  logId: string
) {

  const res = await fetch(

    `${API_BASE}/po/dashboard/verify-chain/${logId}`
  );

  return await res.json();
}

export async function tamperAuditLog(
  logId: string
) {

  const res = await fetch(

    `${API_BASE}/po/dashboard/tamper/${logId}`,

    {
      method: "POST",
    }
  );

  return await res.json();
}