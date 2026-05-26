type Props = {
  requests: any[];
};

export default function BFTConsensusPanel({
  requests,
}: Props) {

  return (

    <div className="rounded-2xl border border-cyan-500/20 bg-[#071224] p-6">

      <div className="mb-5">

        <h2 className="text-xl font-bold">

          BFT Consensus Board

        </h2>

        <p className="mt-1 text-sm text-gray-400">

          3-of-5 Dilithium validator approvals

        </p>

      </div>

      <div className="space-y-4">

        {requests.map((req, idx) => (

          <div
            key={idx}
            className="rounded-xl border border-white/5 bg-[#0f172a] p-4"
          >

            <div className="flex items-center justify-between">

              <div>

                <div className="font-semibold">

                  {req.action}

                </div>

                <div className="text-xs text-gray-500">

                  {req.request_id}

                </div>

              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs ${
                  req.approved
                    ? "bg-green-500/20 text-green-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >

                {req.validator_signatures.length}
                /3

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}