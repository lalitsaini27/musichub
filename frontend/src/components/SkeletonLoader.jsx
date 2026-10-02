export function CardSkeleton({ round = false }) {
  return (
    <div style={{ width: 168, flexShrink: 0 }} className="p-2">
      <div
        className="mh-skeleton"
        style={{ width: "100%", aspectRatio: "1/1", borderRadius: round ? "50%" : "var(--mh-radius-sm)" }}
      />
      <div className="mh-skeleton mt-2" style={{ height: 14, width: "80%" }} />
      <div className="mh-skeleton mt-1" style={{ height: 11, width: "60%" }} />
    </div>
  );
}

export default function SkeletonRow({ count = 5, round = false }) {
  return (
    <div className="mh-scroll-row">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} round={round} />
      ))}
    </div>
  );
}
