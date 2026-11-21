"use client";

import Image from "next/image";
import { useState } from "react";

/** Juone's calling card. Hover (or tap) to flip. */
export function CallingCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="reveal [perspective:1600px]" style={{ transitionDelay: "150ms" }}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label="Flip the calling card"
        className="group relative block aspect-[7/4] w-full max-w-xl cursor-pointer"
      >
        <div
          className={`relative h-full w-full rounded-2xl shadow-2xl shadow-black/50 transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          <Image
            src="/maker/calling-card-front.webp"
            alt="Calling card: Engr. Juone Lenard S. Susvilla, Licensed Civil Engineer, founder of J1 Digital Marketing & AI Agency. 0948 044 2196, jlsusvilla01@gmail.com"
            fill
            sizes="(min-width: 1024px) 576px, 100vw"
            className="rounded-2xl object-cover [backface-visibility:hidden]"
          />
          <Image
            src="/maker/calling-card-back.webp"
            alt="Back of the calling card: QR code to engineerjsusvilla.vercel.app"
            fill
            sizes="(min-width: 1024px) 576px, 100vw"
            className="rounded-2xl object-cover [backface-visibility:hidden] [transform:rotateY(180deg)]"
          />
        </div>
      </button>
      <p className="mt-3 text-center text-xs text-white/50">Hover or tap the card to flip it</p>
    </div>
  );
}
