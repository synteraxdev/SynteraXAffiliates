import Image from "next/image";
import { offerPreviewSrc } from "@/lib/copy";

export function OfferPreview({
  offer,
  className = "h-[72px] w-[128px]",
}: {
  offer: { slug: string; name: string; preview_image_url?: string | null };
  className?: string;
}) {
  return (
    <Image
      src={offerPreviewSrc(offer)}
      alt={`${offer.name} page preview`}
      width={256}
      height={144}
      className={`rounded-md border border-border/70 bg-muted object-cover object-top ${className}`}
    />
  );
}
