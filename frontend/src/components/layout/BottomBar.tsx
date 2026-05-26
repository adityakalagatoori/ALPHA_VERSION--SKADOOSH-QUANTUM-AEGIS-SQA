export default function BottomBar() {
  return (
    <div className="h-[50px] border-t border-white/10 bg-[#111318] flex items-center justify-between px-6 text-sm">

      <div>
        Gateway: <span className="text-green-400">LIVE</span>
      </div>

      <div>
        Requests: 1247
      </div>

      <div>
        Blocked: 83
      </div>

      <div>
        Agents: 12
      </div>

      <div>
        Chain: <span className="text-green-400">INTACT</span>
      </div>

    </div>
  );
}