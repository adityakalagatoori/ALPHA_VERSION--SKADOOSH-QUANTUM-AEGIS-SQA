type Props = {
  pipeline: any[];
};

export default function PipelineVisualizer({
  pipeline,
}: Props) {

  const warriors = [

    "TIGRESS",

    "MONKEY",

    "CRANE",

    "SNAKE",

    "MANTIS",
  ];

  return (

    <div className="rounded-2xl border border-cyan-500/20 bg-[#071224] p-6">

      <div className="mb-6">

        <h2 className="text-xl font-bold">

          Dragon Warrior Pipeline

        </h2>

        <p className="mt-1 text-sm text-gray-400">

          Live request orchestration sequence

        </p>

      </div>

      <div className="flex flex-wrap items-center gap-4">

        {warriors.map((warrior, idx) => {

          const latest = pipeline.find(
            (p) => p.module === warrior
          );

          const passed =
            latest?.passed;

          return (

            <div
              key={idx}
              className={`rounded-2xl border px-6 py-5 ${
                passed
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >

              <div className="text-lg font-bold">

                {warrior}

              </div>

              <div className="mt-2 text-xs text-gray-400">

                {latest?.reason ||
                  "Awaiting"}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}