let voicesLoaded = false;

function waitForVoices() {
  return new Promise((resolve) => {
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve();
      return;
    }
    const handler = () => {
      voicesLoaded = true;
      resolve();
    };
    window.speechSynthesis.onvoiceschanged = handler;
    setTimeout(resolve, 1200);
  });
}

export async function speak(text, onEnd) {
  window.speechSynthesis.cancel();

  if (!voicesLoaded) {
    await waitForVoices();
    voicesLoaded = true;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.05;
  utterance.pitch = 0.9;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.includes('Google UK English Male') ||
      v.name.includes('Daniel') ||
      v.name.includes('Alex') ||
      (v.lang.startsWith('en') && v.name.toLowerCase().includes('male'))
  );
  if (preferred) utterance.voice = preferred;

  if (onEnd) utterance.onend = onEnd;

  // Chrome bug workaround: resume if paused
  if (window.speechSynthesis.paused) window.speechSynthesis.resume();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis.cancel();
}
