type Props = {
  logs: any[];
};

export default function AuditChainPanel({
  logs,
}: Props) {

  return (

    <div className="rounded-2xl border border-purple-500/20 bg-[#071224] p-6">

      <div className="mb-5">

        <h2 className="text-xl font-bold">

          Tamper-Proof Audit Chain

        </h2>

        <p className="mt-1 text-sm text-gray-400">

          SHA3 immutable security logs

        </p>

      </div>

      <div className="space-y-3">

        {logs.map((log, idx) => (

          <div
            key={idx}
            className="rounded-xl border border-white/5 bg-[#0f172a] p-4"
          >

            <div className="flex items-center justify-between">

              <div>

                <div className="font-semibold">

                  {log.log_id}

                </div>

                <div className="mt-1 text-xs text-gray-500">

                  {log.hash?.slice(0, 20)}
                  ...

                </div>

              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs ${
                  log.tampered
                    ? "bg-red-500/20 text-red-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >

                {log.tampered
                  ? "TAMPERED"
                  : "VERIFIED"}

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}