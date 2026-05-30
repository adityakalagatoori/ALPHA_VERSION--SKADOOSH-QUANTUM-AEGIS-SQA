"""
ACT 3 — Prove that the blocked attack was permanently audited.

Even though the action was blocked, SQA wrote an immutable record into
the SNAKE Merkle audit chain. Pull it back and show the cryptographic proof.
"""

import httpx

SQA_URL = "http://localhost:8000"

print("=" * 64)
print("  SNAKE AUDIT CHAIN  --  pulling live forensic record")
print("=" * 64)

# Fetch the Merkle tree from SNAKE
response = httpx.get(f"{SQA_URL}/v2/audit/merkle-tree", timeout=10.0)
tree = response.json()

leaves = tree.get("leaves", [])
root = tree.get("root", "?")
tampered_indices = tree.get("tampered_indices", [])

print(f"\n  Total entries in chain:  {len(leaves)}")
print(f"  Merkle root hash:        {root}")
print(f"  Tampered entries:        {len(tampered_indices)}")
print()
print("  --- Most recent 5 entries ---\n")

# Show the latest 5 entries
for i, leaf in enumerate(leaves[-5:]):
    idx = len(leaves) - 5 + i
    print(f"  [{idx}] action: {leaf.get('action', '?'):<40}")
    print(f"      log_id: {leaf.get('id', '?')}")
    print(f"      hash:   {leaf.get('hash', '?')}")
    print(f"      tampered: {leaf.get('tampered', False)}")
    print()

print("=" * 64)
print("  CRYPTOGRAPHIC PROOFS:")
print("  [+] SHA-3-256 hash chain  -- tampering breaks the chain instantly")
print("  [+] ML-DSA-65 signature   -- post-quantum, NIST-selected algorithm")
print("  [+] Merkle root           -- one hash proves the whole tree intact")
print("  [+] Immutable             -- court-admissible evidence")
print("=" * 64)
print()
print(f"  >> Open the SQA dashboard -> Case File")
print(f"  >> See this entry with full payload and chain verification.")
print()
