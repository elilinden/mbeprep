"use client";

import { useRef, useState } from "react";
import { AlertCircle, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

type EpisodePlayerProps = {
  playbackUrl: string;
  title: string;
};

export function EpisodePlayer({ playbackUrl, title }: EpisodePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) {
      setError("Audio is unavailable in this browser.");
      return;
    }

    setError(null);

    if (audio.paused) {
      try {
        setIsLoading(true);
        await audio.play();
        setIsPlaying(true);
      } catch {
        setError("Playback could not start. Check browser audio permissions.");
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }

  return (
    <div>
      <audio
        aria-label={`Audio player for ${title}`}
        className="w-full"
        controls
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setError("Playback failed. The signed audio URL may have expired.");
          setIsLoading(false);
          setIsPlaying(false);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onWaiting={() => setIsLoading(true)}
        preload="metadata"
        ref={audioRef}
        src={playbackUrl}
      >
        <track kind="captions" label="Manual transcript" />
      </audio>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          aria-label={isPlaying ? "Pause episode" : "Play episode"}
          disabled={isLoading}
          onClick={togglePlayback}
          type="button"
          variant="secondary"
        >
          {isPlaying ? (
            <Pause aria-hidden="true" className="size-4" />
          ) : (
            <Play aria-hidden="true" className="size-4" />
          )}
          {isLoading ? "Loading audio..." : isPlaying ? "Pause" : "Play"}
        </Button>
      </div>
      <p
        aria-live="polite"
        className={
          error
            ? "mt-3 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            : "mt-3 text-sm text-stone-700"
        }
        role="status"
      >
        {error ? (
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        ) : null}
        {error ?? (isLoading ? "Loading audio..." : "Audio ready.")}
      </p>
    </div>
  );
}
