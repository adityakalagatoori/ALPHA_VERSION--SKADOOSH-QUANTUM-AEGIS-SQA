from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from pydantic import BaseModel

from typing import List
from typing import Dict
from typing import Any

from twilio.rest import Client

from dotenv import load_dotenv

from datetime import datetime

import json
import os
import asyncio

# =========================================================
# LOAD ENV
# =========================================================

load_dotenv()

# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/alerts",
    tags=["M7 Alerts"]
)

# =========================================================
# WEBSOCKET MANAGER
# =========================================================

class ConnectionManager:

    def __init__(self):

        self.active_connections: List[
            WebSocket
        ] = []

    async def connect(
        self,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.active_connections.append(
            websocket
        )

        print(
            "[ALERT WS] CONNECTED"
        )

    def disconnect(
        self,
        websocket: WebSocket
    ):

        if websocket in self.active_connections:

            self.active_connections.remove(
                websocket
            )

        print(
            "[ALERT WS] DISCONNECTED"
        )

    async def broadcast(
        self,
        message: dict
    ):

        dead_connections = []

        for connection in self.active_connections:

            try:

                await connection.send_text(
                    json.dumps(
                        message
                    )
                )

            except Exception as ws_error:

                print(
                    "[ALERT WS ERROR]"
                )

                print(ws_error)

                dead_connections.append(
                    connection
                )

        for dead in dead_connections:

            self.disconnect(
                dead
            )

# =========================================================
# GLOBAL MANAGER
# =========================================================

manager = ConnectionManager()

# =========================================================
# ALERT MODEL
# =========================================================

class ThreatAlert(BaseModel):

    agent_id: str

    threat_type: str

    message: str

# =========================================================
# TWILIO CONFIG
# =========================================================

TWILIO_ACCOUNT_SID = os.getenv(
    "TWILIO_ACCOUNT_SID"
)

TWILIO_AUTH_TOKEN = os.getenv(
    "TWILIO_AUTH_TOKEN"
)

TWILIO_PHONE_NUMBER = os.getenv(
    "TWILIO_PHONE_NUMBER"
)

OWNER_PHONE_NUMBER = os.getenv(
    "OWNER_PHONE_NUMBER"
)

# =========================================================
# SEND SMS
# =========================================================

def send_sms_alert(
    alert: ThreatAlert
):

    try:

        if not TWILIO_ACCOUNT_SID:

            print(
                "[TWILIO] SID MISSING"
            )

            return

        client = Client(

            TWILIO_ACCOUNT_SID,

            TWILIO_AUTH_TOKEN
        )

        client.messages.create(

            body=f"""
🚨 SQA SECURITY ALERT

Agent: {alert.agent_id}

Threat: {alert.threat_type}

Message: {alert.message}
            """,

            from_=TWILIO_PHONE_NUMBER,

            to=OWNER_PHONE_NUMBER
        )

        print("\n==============================")
        print(" SMS ALERT SENT ")
        print("==============================\n")

    except Exception as e:

        print("\n==============================")
        print(" SMS ERROR ")
        print("==============================")

        print(e)

        print("==============================\n")

# =========================================================
# VOICE CALL ALERT
# =========================================================

def make_call_alert():

    try:

        if not TWILIO_ACCOUNT_SID:

            print(
                "[TWILIO] SID MISSING"
            )

            return

        client = Client(

            TWILIO_ACCOUNT_SID,

            TWILIO_AUTH_TOKEN
        )

        client.calls.create(

            twiml="""
<Response>
<Say voice="alice">
Warning.
Security threat detected in SQA system.
Immediate attention required.
</Say>
</Response>
            """,

            from_=TWILIO_PHONE_NUMBER,

            to=OWNER_PHONE_NUMBER
        )

        print("\n==============================")
        print(" CALL ALERT SENT ")
        print("==============================\n")

    except Exception as e:

        print("\n==============================")
        print(" CALL ERROR ")
        print("==============================")

        print(e)

        print("==============================\n")

# =========================================================
# GLOBAL ALERT EMITTER
# =========================================================

async def emit_security_event(

    event_type: str,

    severity: str,

    title: str,

    agent_id: str,

    message: str,

    metadata: dict = None
):

    event = {

        "event_type":
            event_type,

        "severity":
            severity,

        "title":
            title,

        "agent_id":
            agent_id,

        "message":
            message,

        "timestamp":
            datetime.utcnow().isoformat(),

        "metadata":
            metadata or {}
    }

    print("\n===================================")
    print(" LIVE SECURITY EVENT ")
    print("===================================")

    print(event)

    print("===================================\n")

    await manager.broadcast(
        event
    )

# =========================================================
# WEBSOCKET
# =========================================================

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
):

    await manager.connect(
        websocket
    )

    try:

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(
            websocket
        )

# =========================================================
# MANUAL TRIGGER ALERT
# =========================================================

@router.post("/trigger")
async def trigger_alert(
    alert: ThreatAlert
):

    alert_data = {

        "event":
            "SECURITY_ALERT",

        "agent_id":
            alert.agent_id,

        "threat_type":
            alert.threat_type,

        "message":
            alert.message,

        "timestamp":
            datetime.utcnow().isoformat()
    }

    print("\n==============================")
    print(" M7 LIVE ALERT ")
    print("==============================")

    print(alert_data)

    print("==============================\n")

    # =====================================================
    # LIVE DASHBOARD ALERT
    # =====================================================

    await manager.broadcast(
        alert_data
    )

    # =====================================================
    # SMS ALERT
    # =====================================================

    send_sms_alert(
        alert
    )

    # =====================================================
    # VOICE CALL ALERT
    # =====================================================

    make_call_alert()

    return {

        "status":
            "ALERT_TRIGGERED",

        "data":
            alert_data
    }

# =========================================================
# REPLAY ATTACK ALERT
# =========================================================

@router.post("/replay-attack")
async def replay_attack_alert(
    payload: dict
):

    await emit_security_event(

        event_type=
            "REPLAY_ATTACK",

        severity=
            "HIGH",

        title=
            "Replay Attack Blocked",

        agent_id=
            payload.get(
                "agent_id",
                "UNKNOWN"
            ),

        message=
            "Replay attack detected and blocked",

        metadata=payload
    )

    return {

        "status":
            "REPLAY_ALERT_BROADCASTED"
    }

# =========================================================
# SIGNATURE FAILURE ALERT
# =========================================================

@router.post("/signature-failure")
async def signature_failure_alert(
    payload: dict
):

    await emit_security_event(

        event_type=
            "SIGNATURE_FAILURE",

        severity=
            "CRITICAL",

        title=
            "Invalid Signature Detected",

        agent_id=
            payload.get(
                "agent_id",
                "UNKNOWN"
            ),

        message=
            "Dilithium signature verification failed",

        metadata=payload
    )

    return {

        "status":
            "SIGNATURE_ALERT_BROADCASTED"
    }

# =========================================================
# BLACKLIST ALERT
# =========================================================

@router.post("/blacklist")
async def blacklist_alert(
    payload: dict
):

    await emit_security_event(

        event_type=
            "BLACKLIST_TRIGGERED",

        severity=
            "HIGH",

        title=
            "Blacklisted Agent Blocked",

        agent_id=
            payload.get(
                "agent_id",
                "UNKNOWN"
            ),

        message=
            "Blacklisted agent attempted execution",

        metadata=payload
    )

    return {

        "status":
            "BLACKLIST_ALERT_BROADCASTED"
    }

# =========================================================
# SNAKE TAMPER ALERT
# =========================================================

@router.post("/tamper-detected")
async def tamper_alert(
    payload: dict
):

    await emit_security_event(

        event_type=
            "AUDIT_TAMPER_DETECTED",

        severity=
            "CRITICAL",

        title=
            "Audit Chain Corruption",

        agent_id=
            payload.get(
                "agent_id",
                "SYSTEM"
            ),

        message=
            "Immutable audit chain integrity failed",

        metadata=payload
    )

    return {

        "status":
            "TAMPER_ALERT_BROADCASTED"
    }

# =========================================================
# MERKLE ROOT ALERT
# =========================================================

@router.post("/merkle-alert")
async def merkle_alert(
    payload: dict
):

    await emit_security_event(

        event_type=
            "MERKLE_ROOT_CHANGED",

        severity=
            "MEDIUM",

        title=
            "Merkle Root Updated",

        agent_id=
            payload.get(
                "agent_id",
                "SYSTEM"
            ),

        message=
            "Sacred Peach Tree root updated",

        metadata=payload
    )

    return {

        "status":
            "MERKLE_ALERT_BROADCASTED"
    }

# =========================================================
# HEALTH CHECK
# =========================================================

@router.get("/health")
async def alert_health():

    return {

        "status":
            "ONLINE",

        "service":
            "M7_ALERT_BUS",

        "active_connections":
            len(
                manager.active_connections
            ),

        "features": [

            "Realtime Threat Feed",

            "Replay Attack Alerts",

            "Blacklist Alerts",

            "Signature Failure Alerts",

            "Tamper Detection Alerts",

            "Merkle Tree Events",

            "Sacred Peach Tree Broadcast"
        ]
    }