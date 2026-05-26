import requests

from db.supabase import supabase

from crypto.signature import (
    sign_payload
)

from crypto.enclave import (
    decrypt_private_key
)

# =========================================================
# AGENT ID
# =========================================================

agent_id = input(
    "Agent ID: "
)

# =========================================================
# FETCH AGENT
# =========================================================

result = (

    supabase
    .table("agents")
    .select("*")
    .eq("agent_id", agent_id)
    .execute()
)

if not result.data:

    print("\nAGENT NOT FOUND\n")
    exit()

agent = result.data[0]

# =========================================================
# PRIVATE KEY
# =========================================================

private_key = decrypt_private_key(
    agent["dilithium_private_key"]
)

# =========================================================
# PAYLOAD
# =========================================================

payload = {

    "payload":
        "transfer_funds"
}

# =========================================================
# SIGN PAYLOAD
# =========================================================

signature = sign_payload(
    private_key,
    payload
)

print("\n==============================")
print(" SIGNATURE GENERATED ")
print("==============================")

print(signature[:80] + "...")

print("==============================\n")

# =========================================================
# SEND REQUEST
# =========================================================

response = requests.post(

    "http://127.0.0.1:8000/secure-action",

    headers={

        "x-agent-id":
            agent_id,

        "x-signature":
            signature,

        "x-payload":
            payload["payload"],
    }
)

# =========================================================
# OUTPUT
# =========================================================

print("\n==============================")
print(" GATEWAY RESPONSE ")
print("==============================")

print(f"STATUS: {response.status_code}")

print("\nRAW RESPONSE:")

print(response.text)

print("==============================\n")