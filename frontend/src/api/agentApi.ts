
import axios from "axios";
import { API_BASE } from "../lib/api";

// =========================================================
// BASE API
// =========================================================

const API = axios.create({
  baseURL: API_BASE,
});

// =========================================================
// TYPES
// =========================================================

export interface RegisterPayload {
  name: string;
  sector: string;
  allowed_actions: string[];
}

// =========================================================
// M1 — REGISTER AGENT
// =========================================================

export async function registerAgent(
  payload: RegisterPayload
) {
  const response = await API.post(
    "/agents/register",
    payload
  );

  return response.data;
}

// =========================================================
// C1 + M3 + M5
// REAL SECURE EXECUTION
// =========================================================

export async function sendSecureRequest(
  agentId: string,
  payload: string,
  action: string,
  token: string
) {
  const nonce = crypto.randomUUID();

  const timestamp = Math.floor(
    Date.now() / 1000
  );

  const response = await API.post(
    "/secure/execute",
    {
      payload,
      action,
    },
    {
      headers: {
        "x-agent-id": agentId,
        "x-payload": payload,
        "x-action": action,
        "x-token": token,
        "x-nonce": nonce,
        "x-timestamp": timestamp,
      },
    }
  );

  return response.data;
}

// =========================================================
// M5 — REPLAY ATTACK
// =========================================================

export async function replayAttack(
  agentId: string,
  token: string
) {
  const nonce = "STATIC_ATTACK_NONCE";

  const timestamp = Math.floor(
    Date.now() / 1000
  );

  // FIRST REQUEST

  await API.post(
    "/secure/execute",
    {
      payload: "FIRST_REQUEST",
      action: "read",
    },
    {
      headers: {
        "x-agent-id": agentId,
        "x-payload": "FIRST_REQUEST",
        "x-action": "read",
        "x-token": token,
        "x-nonce": nonce,
        "x-timestamp": timestamp,
      },
    }
  );

  // SECOND REQUEST = REPLAY

  const replayResponse = await API.post(
    "/secure/execute",
    {
      payload: "SECOND_REQUEST",
      action: "read",
    },
    {
      headers: {
        "x-agent-id": agentId,
        "x-payload": "SECOND_REQUEST",
        "x-action": "read",
        "x-token": token,
        "x-nonce": nonce,
        "x-timestamp": timestamp,
      },
    }
  );

  return replayResponse.data;
}

// =========================================================
// M3 — FORGED SIGNATURE ATTACK
// =========================================================

export async function sendForgedAttack(
  agentId: string,
  token: string
) {
  const nonce = crypto.randomUUID();

  const timestamp = Math.floor(
    Date.now() / 1000
  );

  const response = await API.post(
    "/secure/execute",
    {
      payload: "FORGED_PAYLOAD",
      action: "delete",
    },
    {
      headers: {
        "x-agent-id": agentId,
        "x-payload": "FORGED_PAYLOAD",
        "x-action": "delete",
        "x-token": token,
        "x-nonce": nonce,
        "x-timestamp": timestamp,

        // INTENTIONALLY INVALID
        "x-signature": "FORGED_SIGNATURE",
      },
    }
  );

  return response.data;
}

// =========================================================
// M4 — BLACKLIST
// =========================================================

export async function revokeAgent(
  agentId: string
) {
  const response = await API.post(
    `/revoke-agent/${agentId}`
  );

  return response.data;
}

// =========================================================
// C1 — VERIFY TOKEN
// =========================================================

export async function verifyToken(
  token: string
) {
  const response = await API.post(
    "/verify-token",
    {
      token,
    }
  );

  return response.data;
}

// =========================================================
// C3 — MULTISIG
// =========================================================

export async function startMultiSigAction(
  token: string,
  action: string,
  amount: number
) {
  const response = await API.post(
    "/multisig/start-real",
    {
      token,
      action_name: action,
      amount,
    }
  );

  return response.data;
}

// =========================================================
// C3 — APPROVE MULTISIG
// =========================================================

export async function approveMultiSigAction(
  requestId: string,
  approver: string
) {
  const response = await API.post(
    "/multisig/approve",
    {
      request_id: requestId,
      approver,
    }
  );

  return response.data;
}

// =========================================================
// C5 — CHECKPOINT VALIDATION
// =========================================================

export async function validateCheckpoint(
  checkpointId: string
) {
  const response = await API.post(
    "/secure/checkpoint",
    {
      checkpoint_id: checkpointId,
    }
  );

  return response.data;
}

// =========================================================
// C6 — TOKEN EXPIRY
// =========================================================

export async function simulateExpiry(
  token: string
) {
  const response = await API.post(
    "/simulate-expiry",
    {
      token,
    }
  );

  return response.data;
}

// =========================================================
// C7 — TRIBUNAL
// =========================================================

export async function generateTribunal(
  token: string,
  action: string
) {
  const response = await API.post(
    "/tribunal-demo",
    {
      token,
      attempted_action: action,
    }
  );

  return response.data;
}

// =========================================================
// S1 S2 S3 — AUDIT CHAIN
// =========================================================

export async function getAuditChain() {
  const response = await API.get(
    "/snake/audit-chain"
  );

  return response.data;
}

// =========================================================
// S3 — VERIFY CHAIN
// =========================================================

export async function verifyAuditChain() {
  const response = await API.get(
    "/snake/verify-chain"
  );

  return response.data;
}

// =========================================================
// S6 — MERKLE ROOT
// =========================================================

export async function getMerkleRoot() {
  const response = await API.get(
    "/snake/merkle-root"
  );

  return response.data;
}

// =========================================================
// S4 — TAMPER DEMO
// =========================================================

export async function tamperAuditEntry(
  chainIndex: number
) {
  const response = await API.post(
    `/snake/tamper-demo/${chainIndex}`
  );

  return response.data;
}

// =========================================================
// S6/S7 — CHECKPOINTS
// =========================================================

export async function getCheckpoints() {
  const response = await API.get(
    "/snake/checkpoints"
  );

  return response.data;
}

// =========================================================
// M7 + S4 + S7
// REALTIME WEBSOCKET FEED
// =========================================================

export function connectSecurityFeed(
  onMessage: (data: any) => void
) {
  const socket = new WebSocket(
    "ws://127.0.0.1:8000/alerts/ws"
  );

  socket.onopen = () => {
    console.log(
      "[WS] CONNECTED"
    );
  };

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(
        event.data
      );

      onMessage(parsed);

    } catch (error) {
      console.error(
        "[WS PARSE ERROR]",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "[WS ERROR]",
      error
    );
  };

  socket.onclose = () => {
    console.warn(
      "[WS CLOSED]"
    );
  };

  return socket;
}
