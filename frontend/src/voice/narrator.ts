// Voice narrator interface contract for spoken walkthroughs.
// Implemented by SpeechSynthesisNarrator, AudioFileNarrator, and SilentNarrator.

export interface VoiceNarrator {
  speak(text: string, rate?: number): Promise<void>;
  cancel(): void;
  pause(): void;
  resume(): void;
  isAvailable(): boolean;
  setVolume?(volume: number): void;
  setVoice?(voiceName: string): void;
}
