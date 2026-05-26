import { useState, useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Copy, Check } from "lucide-react";

export interface EmbeddedTerminalProps {
  featureId: string;
  title: string;
  getCommand: () => string;
  height?: number;
}

export function EmbeddedTerminal({
  featureId,
  title,
  getCommand,
  height = 280,
}: EmbeddedTerminalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const termDivRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef(
    featureId + "-" + crypto.randomUUID().slice(0, 8)
  );

  const theme = {
    background: "#0a0f1a",
    foreground: "#d4d4d4",
    cursor: "#00bcd4",
    selectionBackground: "#264f78",
    black: "#1e1e1e",
    green: "#4ec9b0",
    cyan: "#9cdcfe",
  };

  const suggestedCommand = getCommand();

  const copyCommandToClipboard = () => {
    navigator.clipboard.writeText(suggestedCommand).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!termDivRef.current) return;

      const term = new Terminal({
        theme,
        fontFamily: "'Courier New', monospace",
        fontSize: 12,
        cursorBlink: true,
        convertEol: true,
        rows: Math.floor(height / 17),
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(termDivRef.current);
      fit.fit();
      termRef.current = term;

      const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProto}//127.0.0.1:8000/terminal/ws/${sessionRef.current}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        term.write("\x1b[36mPS SQA> \x1b[0m");
      };

      ws.onmessage = (e) => {
        term.write(e.data);
      };

      ws.onerror = () => {
        term.write(`\r\n\x1b[31m[WebSocket Error]\x1b[0m\r\n`);
      };

      ws.onclose = () => {
        term.write(`\r\n\x1b[33m[Connection Closed]\x1b[0m\r\n`);
      };

      let line = "";

      term.onData((data) => {
        if (data === "\r" || data === "\n") {
          term.write("\r\n");
          if (line.trim()) {
            ws.send(line);
          }
          line = "";
          term.write("\x1b[36mPS SQA> \x1b[0m");
        } else if (data === "\x7f") {
          if (line.length > 0) {
            line = line.slice(0, -1);
            term.write("\b \b");
          }
        } else if (data.charCodeAt(0) >= 32) {
          line += data;
          term.write(data);
        }
      });

      return () => {
        if (termRef.current) {
          termRef.current.dispose();
        }
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/20 overflow-hidden bg-[#0a0f1a]">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-[#111827] text-cyan-400 font-mono text-sm hover:bg-cyan-500/10 transition-colors border-b border-cyan-500/10"
      >
        <span className="text-lg">{isOpen ? "▼" : "▶"}</span>
        <span className="text-gray-500">$</span>
        <span className="font-bold">{title}</span>
        <span className="ml-auto text-xs text-gray-600">
          {isOpen ? "Interactive terminal" : "Click to open"}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Command hint */}
          <div className="border-b border-cyan-500/10 bg-[#111827] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">Suggested command (copy and paste):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 block text-xs bg-black/50 border border-white/10 rounded px-3 py-2 text-cyan-300 overflow-auto max-h-20 break-all">
                    {suggestedCommand}
                  </code>
                  <button
                    onClick={copyCommandToClipboard}
                    className="flex-shrink-0 p-2 hover:bg-cyan-500/10 rounded transition-colors"
                    title="Copy command"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-cyan-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div
            ref={termDivRef}
            style={{
              height: `${height}px`,
              backgroundColor: "#0a0f1a",
            }}
            className="overflow-hidden"
          />
        </>
      )}
    </div>
  );
}
