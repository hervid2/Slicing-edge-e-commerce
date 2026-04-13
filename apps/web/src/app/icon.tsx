import { ImageResponse } from 'next/og';

export const size = { width: 68, height: 52 };
export const contentType = 'image/png';

/**
 * App icon — rendered by Next.js as /icon.png and linked automatically
 * as the browser tab favicon and PWA shortcut icon.
 *
 * Uses the Slicing Edge knife badge (icon variant of the Logo component).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <svg
        width="68"
        height="52"
        viewBox="0 0 68 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Badge container */}
        <rect width="68" height="52" rx="10" fill="#1A3A2A" />

        {/* Blade body */}
        <path d="M 3 26 L 47 13 L 47 33 Q 25 37 3 26 Z" fill="white" />

        {/* Cutting-edge accent line */}
        <path
          d="M 3 26 Q 25 34 47 33"
          stroke="#3D8B4F"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Bolster */}
        <rect x="47" y="12" width="4" height="21" rx="1.5" fill="#3D8B4F" />

        {/* Handle */}
        <rect x="51" y="16" width="15" height="14" rx="3" fill="#2D5A3F" />

        {/* Handle rivets */}
        <circle cx="57" cy="23" r="1.2" fill="white" opacity="0.40" />
        <circle cx="62.5" cy="23" r="1.2" fill="white" opacity="0.40" />
      </svg>
    ),
    { ...size },
  );
}
