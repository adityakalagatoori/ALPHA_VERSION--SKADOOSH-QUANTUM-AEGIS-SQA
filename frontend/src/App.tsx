import { useState, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import DragonWarrior from "./voice/DragonWarrior";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Overview } from "./pages/Overview";
import { Monkey } from "./pages/Monkey";
import { Crane } from "./pages/Crane";
import { Snake } from "./pages/Snake";
import { Mantis } from "./pages/Mantis";
import { Tigress } from "./pages/Tigress";
import { Po } from "./pages/Po";
import { MirrorTest } from "./pages/MirrorTest";
import { HoneypotChamber } from "./pages/HoneypotChamber";
import { CaseFile } from "./pages/CaseFile";

const PAGES: Record<string, React.ComponentType> = {
  overview: Overview,
  monkey: Monkey,
  crane: Crane,
  snake: Snake,
  mantis: Mantis,
  tigress: Tigress,
  po: Po,
  mirror: MirrorTest,
  honeypot: HoneypotChamber,
  casefile: CaseFile,
};

export default function App() {
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const Page = PAGES[section] || Overview;

  // Dragon Warrior navigation event
  useEffect(() => {
    const handler = (e: CustomEvent<{ section: string }>) => {
      if (PAGES[e.detail.section]) setSection(e.detail.section);
    };
    window.addEventListener("dragonNavigate", handler as EventListener);
    return () => window.removeEventListener("dragonNavigate", handler as EventListener);
  }, []);

  const handleSelect = (id: string) => {
    setSection(id);
    // Auto-close sidebar on mobile-ish widths
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar
        active={section}
        open={sidebarOpen}
        onSelect={handleSelect}
        onToggle={() => setSidebarOpen((v) => !v)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto">
          <Page />
        </main>
      </div>
      <DragonWarrior />
    </div>
  );
}
