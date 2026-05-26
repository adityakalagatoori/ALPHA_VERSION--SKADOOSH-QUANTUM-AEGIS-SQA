import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Props = {
  data: any[];
};

export default function LiveRiskChart({
  data,
}: Props) {

  return (

    <div className="rounded-2xl border border-orange-500/20 bg-[#071224] p-6">

      <div className="mb-5">

        <h2 className="text-xl font-bold">

          Live Risk Scoring

        </h2>

        <p className="mt-1 text-sm text-gray-400">

          Realtime agent anomaly tracking

        </p>

      </div>

      <div className="h-[320px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart data={data}>

            <CartesianGrid stroke="#1e293b" />

            <XAxis dataKey="agent_id" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="risk_score"
              stroke="#f97316"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}