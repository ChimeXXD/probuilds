"use client";

import { useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { PRESS_CARD, STATE_TRANSITION } from "@/components/ui/interaction";

// Figma "Embed facade" (203:346): a bg/raised card, 12 px corners; a 201 px bg/surface poster with a 56 px play icon;
// then the video's title (Label/Default) and "<channel> · Tap to play" (Label/Caption, muted), 16 px in, 2 px apart.
// Nothing loads from YouTube until the tap (rule 5, A-05, SPEC §Acceptance); then the poster becomes the
// youtube-nocookie.com player, which starts at once since the tap asked for it.
export function EmbedFacade({ embed }: { embed: { videoId: string; title: string; channelLine: string } }) {
  const [playing, setPlaying] = useState(false);
  const meta = (
    <span className="flex flex-col gap-0.5 p-4 text-left">
      <span className="type-label text-text-primary">{embed.title}</span>
      <span className="type-caption text-text-muted">{embed.channelLine}</span>
    </span>
  );
  if (playing) {
    return (
      <div data-testid="embed-facade" className="flex flex-col overflow-hidden rounded-md bg-bg-raised">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(embed.videoId)}?autoplay=1&rel=0`}
          title={embed.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="aspect-video w-full border-0 bg-bg-surface"
        />
        {meta}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-testid="embed-facade"
      aria-label={`Play ${embed.title}`}
      onClick={() => setPlaying(true)}
      className={`group flex w-full flex-col overflow-hidden rounded-md bg-bg-raised hover:bg-hover-fill-raised ${STATE_TRANSITION} ${PRESS_CARD}`}
    >
      {/* Hover (D-121 (1)): the facade's faint fills; press 0.98. */}
      <span className={`flex h-[201px] w-full items-center justify-center bg-bg-surface text-text-primary group-hover:bg-hover-fill ${STATE_TRANSITION}`}>
        <Icon name="play" size={56} />
      </span>
      {meta}
    </button>
  );
}
