import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-[#0b1020] text-white">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">

        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="bg-[#121a2f] rounded-2xl p-5 border border-cyan-500/20">
              <h2 className="text-lg font-semibold mb-2">
                Active Agents
              </h2>

              <p className="text-4xl font-bold text-cyan-400">
                12
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#121a2f] rounded-2xl p-5 border border-red-500/20">
              <h2 className="text-lg font-semibold mb-2">
                Threat Alerts
              </h2>

              <p className="text-4xl font-bold text-red-400">
                3
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#121a2f] rounded-2xl p-5 border border-green-500/20">
              <h2 className="text-lg font-semibold mb-2">
                Trust Score
              </h2>

              <p className="text-4xl font-bold text-green-400">
                92
              </p>
            </div>

          </div>

          {/* Feed Section */}
          <div className="mt-6 bg-[#121a2f] rounded-2xl p-5 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">
              Live Security Feed
            </h2>

            <div className="space-y-3">

              <div className="bg-black/30 p-3 rounded-lg">
                MONKEY → Agent Registered
              </div>

              <div className="bg-black/30 p-3 rounded-lg">
                TIGRESS → Prompt Injection Blocked
              </div>

              <div className="bg-black/30 p-3 rounded-lg">
                MANTIS → Risk Score Increased
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}