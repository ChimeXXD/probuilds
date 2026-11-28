import Link from "next/link";
import { DraftTag } from "@/components/ui/DraftTag";
import { STATE_TRANSITION } from "@/components/ui/interaction";
import type { FaceCardView } from "@/lib/faces";

// Figma face card in the Faces library (333:1316, D-70 option A): a 4:5 picture with a 1 px border/subtle outline
// and 12 px corners, then the kind (Label/Caption, muted) and the plain title (Label/Default, D-69), 10 px below.
// The picture is Chime's own in-game capture (D-10), or on one of Figma's sample faces its stand-in (D-108). With
// none in the repo, the slot is drawn as the Design System's Face card (205:329) draws it: surface fill and "In-game
// screenshot" in the middle. A draft carries the Draft tag in the picture's 12 px inset (preview only, D-104), except
// a sample: Figma draws none, the library's demo note marks it instead (D-113).
// Hover (D-121 (1)): the picture's outline steps to border/strong and the picture eases 3 % larger inside its frame
// (transform, --dur-base), so the card reads as something to open without moving on the page; press 0.98.
export function FaceCard({ card, place }: { card: FaceCardView; place: number }) {
  return (
    <li data-flip={card.id}>
      <Link href={card.href} data-testid={`face-card-${place}`} className="group flex flex-col gap-2.5">
        <div
          data-testid="face-picture"
          className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-bg-surface group-hover:border-border-strong group-hover:bg-hover-fill group-active:scale-[0.98] motion-reduce:group-active:scale-100 ${STATE_TRANSITION}`}
        >
          {card.picture ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export; our own sized capture
            <img
              src={card.picture.src}
              alt={card.picture.alt}
              width={360}
              height={450}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover transition-[scale] duration-(--dur-base) ease-(--ease-out) group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            />
          ) : (
            <span aria-hidden="true" className="type-caption text-text-muted">
              In-game screenshot
            </span>
          )}
          {card.draft && !card.sample && (
            <span className="absolute top-3 left-3 flex">
              <DraftTag />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="type-caption text-text-muted">{card.kindLabel}</span>
          <h2 className="type-label break-words text-text-primary">{card.title}</h2>
        </div>
      </Link>
    </li>
  );
}
