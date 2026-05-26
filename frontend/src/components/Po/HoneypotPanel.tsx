type Props = {
  events: any[];
};

export default function HoneypotPanel({
  events,
}: Props) {

  return (

    <div className="rounded-2xl border border-red-500/20 bg-[#071224] p-6">

      <div className="mb-5">

        <h2 className="text-xl font-bold">

          Honeypot Isolation Feed

        </h2>

        <p className="mt-1 text-sm text-gray-400">

          Redirected hostile agents

        </p>

      </div>

      <div className="space-y-3">

        {events.map((event, idx) => (

          <div
            key={idx}
            className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
          >

            <div className="flex items-center justify-between">

              <div>

                <div className="font-semibold text-red-400">

                  {event.event_type}

                </div>

                <div className="mt-1 text-xs text-gray-400">

                  {event.reason ||
                    event.message}

                </div>

              </div>

              <div className="text-xs text-gray-500">

                {event.agent_id ||
                  "UNKNOWN"}

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}