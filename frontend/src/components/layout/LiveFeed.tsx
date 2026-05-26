const logs = [
  "[MONKEY] Signature verified",
  "[CRANE] Scope verified",
  "[SNAKE] Audit chain intact",
  "[MANTIS] Risk score updated",
  "[TIGRESS] Injection blocked",
  "[PO] Request delivered",
];

export default function LiveFeed() {
  return (
    <div className="w-[340px] border-l border-white/10 bg-[#111318] p-4 overflow-y-auto">

      <h2 className="text-xl font-bold mb-4">
        LIVE FEED
      </h2>

      <div className="flex flex-col gap-3">

        {logs.map((log, index) => (
          <div
            key={index}
            className="bg-[#1a1e26] border border-white/5 rounded-xl p-3 text-sm font-mono"
          >
            {log}
          </div>
        ))}

      </div>
    </div>
  );
}