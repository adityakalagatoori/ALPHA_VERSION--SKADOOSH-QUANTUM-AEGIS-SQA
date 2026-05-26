type Props = {
  requests: any[];
};

export default function FinanceApprovalPanel({
  requests,
}: Props) {

  return (

    <div className="rounded-2xl border border-green-500/20 bg-[#071224] p-6">

      <div className="mb-5">

        <h2 className="text-xl font-bold">

          Financial Multi-Approval

        </h2>

        <p className="mt-1 text-sm text-gray-400">

          Dilithium-secured financial execution

        </p>

      </div>

      <div className="space-y-4">

        {requests.map((tx, idx) => (

          <div
            key={idx}
            className="rounded-xl border border-white/5 bg-[#0f172a] p-4"
          >

            <div className="flex items-center justify-between">

              <div>

                <div className="font-semibold">

                  {tx.from_account}
                  {" → "}
                  {tx.to_account}

                </div>

                <div className="mt-1 text-xs text-gray-500">

                  {tx.transaction_id}

                </div>

              </div>

              <div className="text-right">

                <div className="font-bold text-green-400">

                  ${tx.amount}

                </div>

                <div
                  className={`mt-1 rounded-full px-3 py-1 text-xs ${
                    tx.executed
                      ? "bg-green-500/20 text-green-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}
                >

                  {tx.executed
                    ? "EXECUTED"
                    : "PENDING"}

                </div>

              </div>

            </div>

            <div className="mt-4 flex items-center justify-between">

              <div className="text-sm text-gray-400">

                Approvals:
                {" "}
                {tx.approvals_received.length}
                /
                {tx.approvals_required}

              </div>

              <div className="flex gap-2">

                {tx.approvals_received.map(
                  (sig: any, sigIdx: number) => (

                    <div
                      key={sigIdx}
                      className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400"
                    >

                      {sig.validator_id}

                    </div>
                  )
                )}

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}