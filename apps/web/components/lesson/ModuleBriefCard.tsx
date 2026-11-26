'use client';

import { useState } from 'react';
import type { Locale, ModuleBrief } from '@speeko/core';
import { playLetsGoSound } from '@/lib/mascotVoice';
import { speak } from '@/lib/speech';
import { BookOpenIcon, PlayIcon, SpeakerIcon, XIcon } from '@/components/icons';

export interface ModuleBriefCardProps {
  brief: ModuleBrief;
  locale: Locale;
  /** 'modal' sits over the course path before entering a module; 'inline' sits non-blockingly above Q1 inside a lesson. */
  variant: 'modal' | 'inline';
  onContinue: () => void;
  onClose?: () => void;
}

/**
 * Quick pre-module orientation card displaying a note of the module's topics
 * and an upcoming answers guide. Clicking "Continue" plays the energetic
 * "Let's go!" sound clip cleanly from a genuine user gesture.
 */
export function ModuleBriefCard({
  brief,
  locale,
  variant,
  onContinue,
  onClose,
}: ModuleBriefCardProps) {
  const [expanded, setExpanded] = useState(variant === 'modal');
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  function previewItemAudio(target: string, audioUrl?: string) {
    if (audioUrl) {
      try {
        setPlayingAudioUrl(audioUrl);
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingAudioUrl(null);
        audio.onerror = () => {
          setPlayingAudioUrl(null);
          speak(target, locale);
        };
        void audio.play().catch(() => {
          setPlayingAudioUrl(null);
          speak(target, locale);
        });
        return;
      } catch {
        setPlayingAudioUrl(null);
      }
    }
    speak(target, locale);
  }

  function handleContinue() {
    playLetsGoSound();
    onContinue();
  }

  if (variant === 'inline') {
    return (
      <section
        aria-label={`Module ${brief.originalUnitNumber} topics and upcoming answers guide`}
        className="mb-4 overflow-hidden rounded-2xl border-2 border-speeko-200 bg-white shadow-card-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-speeko-700">
              Module {brief.originalUnitNumber} Guide · {brief.title}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-bark-600">
              <strong className="font-extrabold text-bark-800">Topics:</strong> {brief.topicNote}
            </p>
            {brief.answersGuide.length > 0 ? (
              <p className="mt-1 truncate text-xs font-semibold text-bark-500">
                <strong className="font-bold text-bark-700">Upcoming answers:</strong>{' '}
                {brief.answersGuide
                  .slice(0, 3)
                  .map((a) => `${a.prompt} → ${a.target}`)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              className="focus-ring inline-flex items-center gap-1 rounded-xl border-2 border-cream-200 bg-cream-50 px-3 py-1.5 font-display text-xs font-extrabold text-bark-700 hover:border-speeko-300"
            >
              <BookOpenIcon className="h-3.5 w-3.5 text-speeko-700" />
              {expanded ? 'Hide answers guide' : `Answers guide (${brief.answersGuide.length})`}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none">
                <path
                  d={expanded ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="btn-primary px-4 py-1.5 text-xs"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              Continue
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="border-t border-cream-200 bg-cream-50/70 px-4 py-3">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-bark-500">
              Upcoming answers guide ({brief.lessonCount} lessons
              {brief.listeningCount > 0 ? ` · ${brief.listeningCount} listening prompts` : ''})
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {brief.answersGuide.map((item) => (
                <div
                  key={`${item.target}-${item.prompt}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-cream-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-bark-500">{item.prompt}</p>
                    <p className="script-text font-display text-base font-extrabold text-bark-800" lang={locale}>
                      {item.target}
                      {item.romanized ? (
                        <span className="ml-2 font-sans text-xs font-semibold text-bark-400">
                          ({item.romanized})
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Listen to ${item.prompt}`}
                    onClick={() => previewItemAudio(item.target, item.audioUrl)}
                    className={`focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cream-200 transition ${
                      playingAudioUrl && playingAudioUrl === item.audioUrl
                        ? 'bg-speeko-500 text-white'
                        : 'bg-cream-50 text-speeko-700 hover:bg-speeko-100'
                    }`}
                  >
                    <SpeakerIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bark-900/45 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-brief-title"
        className="card flex max-h-[88dvh] w-full max-w-lg animate-pop flex-col overflow-hidden p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-speeko-700">
              Module {brief.originalUnitNumber} Overview
            </p>
            <h2 id="module-brief-title" className="mt-0.5 font-display text-2xl font-extrabold text-bark-800">
              {brief.title}
            </h2>
          </div>
          {onClose ? (
            <button
              type="button"
              aria-label="Close module overview"
              onClick={onClose}
              className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-bark-400 hover:bg-cream-100 hover:text-bark-700"
            >
              <XIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="rounded-2xl border-2 border-speeko-200 bg-speeko-50/80 p-3.5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-speeko-700">
              Topics note
            </p>
            <p className="mt-1 text-sm font-semibold text-bark-700">{brief.topicNote}</p>
            <p className="mt-1 text-xs font-bold text-bark-500">
              {brief.lessonCount} lessons
              {brief.listeningCount > 0 ? ` · ${brief.listeningCount} audio listening checks` : ''}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-bark-500">
              Upcoming answers guide
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {brief.answersGuide.map((item) => (
                <div
                  key={`${item.target}-${item.prompt}`}
                  className="flex items-center justify-between gap-2 rounded-2xl border-2 border-cream-200 bg-cream-50/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-bark-500">{item.prompt}</p>
                    <p className="script-text font-display text-base font-extrabold text-bark-800" lang={locale}>
                      {item.target}
                    </p>
                    {item.romanized ? (
                      <p className="text-[11px] font-semibold text-bark-400">{item.romanized}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Listen to ${item.prompt}`}
                    onClick={() => previewItemAudio(item.target, item.audioUrl)}
                    className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cream-200 bg-white text-speeko-700 hover:bg-speeko-100"
                  >
                    <SpeakerIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-cream-200 pt-3 sm:flex-row">
          <button
            type="button"
            onClick={handleContinue}
            className="btn-primary flex-1 py-3 text-base"
          >
            <PlayIcon className="h-4 w-4" />
            Continue
          </button>
          {onClose ? (
            <button type="button" onClick={onClose} className="btn-secondary">
              Back to map
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
