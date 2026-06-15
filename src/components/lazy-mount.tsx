"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Defers mounting its children until they scroll near the viewport. Children
 * own their own data queries, so not mounting them keeps their requests from
 * firing on page load — collapsing the dashboard's simultaneous-request storm.
 *
 * `minHeight` reserves space while unmounted so the scrollbar doesn't jump;
 * once mounted the reservation is dropped and content sizes naturally.
 */
export function LazyMount({
  minHeight,
  rootMargin = "200px",
  className,
  children,
}: {
  minHeight: number;
  rootMargin?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, rootMargin]);

  return (
    <div
      ref={ref}
      className={shown ? className : undefined}
      style={shown ? undefined : { minHeight }}
    >
      {shown ? children : null}
    </div>
  );
}
