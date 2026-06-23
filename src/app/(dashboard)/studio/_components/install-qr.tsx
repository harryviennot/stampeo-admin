"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function InstallQR({ url, size = 180 }: { url: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: Math.round(size * 1.3), margin: 1 })
      .then((d) => {
        if (active) setDataUrl(d);
      })
      .catch(() => {
        if (active) setDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center rounded bg-muted text-xs text-muted-foreground"
        style={{ width: size, height: size }}
      >
        Generating…
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Install QR code"
      width={size}
      height={size}
      className="rounded bg-white p-2"
    />
  );
}
