import { useRef, useCallback } from 'react';
import { commandMap } from './commandMap';
import { geminiFallback } from './geminiFallback';

const WAKE_PHRASES = [
  'okay dragon warrior',
  'hey dragon warrior',
  'yo dragon warrior',
  'dragon warrior',
];

const NUMBER_MAP = {
  'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
  'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
  'eleven': '11',
};

function normalizeNumbers(text) {
  let out = text;
  for (const [word, digit] of Object.entries(NUMBER_MAP)) {
    out = out.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  return out;
}

// Extract the command part that follows the wake phrase
function extractCommand(transcript) {
  const lower = transcript.toLowerCase().trim();
  for (const phrase of WAKE_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      return lower.slice(idx + phrase.length).trim();
    }
  }
  return null;
}

async function parseCommand(rawCommand) {
  if (!rawCommand) return null;

  const normalized = normalizeNumbers(rawCommand);

  // 1. Keyword match against commandMap
  for (const cmd of commandMap) {
    if (cmd.keywords && cmd.keywords.some((kw) => normalized.includes(kw))) {
      return cmd;
    }
  }

  // 2. Fuzzy: "m1", "m 1", "m-1", "monkey 1" patterns
  const idMatch = normalized.match(/\b([mcsatp])[\s-]?(\d{1,2})\b/i);
  if (idMatch) {
    const prefix = idMatch[1].toUpperCase();
    const num = idMatch[2];
    const id = `${prefix}${num}`;
    const cmd = commandMap.find((c) => c.id === id);
    if (cmd) return cmd;
  }

  // 3. Mirror attack number pattern: "mirror 3", "attack 3"
  const mirrorMatch = normalized.match(/(?:mirror|attack)[\s-]?(\d{1,2})\b/i);
  if (mirrorMatch) {
    const id = `MIRROR_${mirrorMatch[1]}`;
    const cmd = commandMap.find((c) => c.id === id);
    if (cmd) return cmd;
  }

  // 4. Bare section name → navigate
  const sectionMap = {
    monkey: 'NAV_MONKEY',
    crane: 'NAV_CRANE',
    snake: 'NAV_SNAKE',
    mantis: 'NAV_MANTIS',
    tigress: 'NAV_TIGRESS',
    po: 'NAV_PO',
    mirror: 'NAV_MIRROR',
    overview: 'NAV_OVERVIEW',
    home: 'NAV_OVERVIEW',
  };
  for (const [word, navId] of Object.entries(sectionMap)) {
    if (normalized.includes(word)) {
      const nav = commandMap.find((c) => c.id === navId);
      if (nav) return nav;
    }
  }

  // 5. Gemini fallback
  const fallback = await geminiFallback(rawCommand);
  if (fallback?.id) {
    const match = commandMap.find((c) => c.id === fallback.id);
    if (match) return match;
    // Return the raw fallback object if the id isn't in our map (shouldn't happen)
    return fallback;
  }

  return null;
}

export function useVoiceCommands({ onCommand, onState }) {
  const recognitionRef = useRef(null);
  const isOnRef = useRef(false);
  const restartTimerRef = useRef(null);
  const processingRef = useRef(false);

  const scheduleRestart = useCallback(() => {
    clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (isOnRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // already started
        }
      }
    }, 500);
  }, []);

  const setupRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = async (event) => {
      if (!isOnRef.current || processingRef.current) return;

      const latest = event.results[event.results.length - 1];
      const transcript = latest[0].transcript;

      // Give quick listening feedback on interim wake-phrase detection
      if (!latest.isFinal) {
        if (extractCommand(transcript) !== null) {
          onState('listening');
        }
        return;
      }

      const command = extractCommand(transcript);
      if (command === null) return; // no wake phrase

      processingRef.current = true;
      onState('processing');

      const matched = await parseCommand(command);

      if (matched) {
        onCommand(matched, command);
      } else {
        onState('error');
        setTimeout(() => {
          if (isOnRef.current) onState('idle');
        }, 2000);
        processingRef.current = false;
      }
    };

    rec.onerror = (e) => {
      // Ignore harmless no-speech / audio-capture errors
      if (e.error === 'no-speech' || e.error === 'audio-capture') return;
      if (isOnRef.current) scheduleRestart();
    };

    rec.onend = () => {
      if (isOnRef.current) scheduleRestart();
    };

    return rec;
  }, [onCommand, onState, scheduleRestart]);

  const startListening = useCallback(() => {
    isOnRef.current = true;
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // already running
      }
    }
  }, [setupRecognition]);

  const stopListening = useCallback(() => {
    isOnRef.current = false;
    clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    processingRef.current = false;
  }, []);

  const releaseProcessing = useCallback(() => {
    processingRef.current = false;
  }, []);

  const isSupported = useCallback(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  return { startListening, stopListening, releaseProcessing, isSupported };
}
