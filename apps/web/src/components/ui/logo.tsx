/**
 * Slicing Edge brand logo — inline SVG with icon badge + wordmark.
 *
 * @param variant  - 'full'  = icon badge + wordmark (default)
 *                 - 'icon'  = badge only (for favicons, compact contexts)
 * @param theme    - 'dark'  = dark elements on light backgrounds (header)
 *                 - 'light' = light elements on dark backgrounds (footer)
 * @param className - additional Tailwind classes for sizing / layout
 */
interface LogoProps {
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light';
  className?: string;
}

export function Logo({ variant = 'full', theme = 'dark', className }: LogoProps) {
  const containerFill = theme === 'dark' ? '#1A3A2A' : '#3D8B4F';
  const edgeStroke    = theme === 'dark' ? '#3D8B4F' : 'rgba(255,255,255,0.65)';
  const bolsterFill   = theme === 'dark' ? '#3D8B4F' : 'rgba(255,255,255,0.88)';
  const handleFill    = theme === 'dark' ? '#2D5A3F' : '#1A3A2A';
  const labelTop      = theme === 'dark' ? '#2D5A3F' : 'rgba(255,255,255,0.70)';
  const labelBottom   = theme === 'dark' ? '#1A3A2A' : '#ffffff';
  const separatorColor = theme === 'dark' ? 'rgba(26,58,42,0.22)' : 'rgba(255,255,255,0.22)';

  /* ── shared knife paths (designed for a 52×52 coordinate space) ── */
  const blade       = 'M 4 26 L 36 14 L 36 32 Q 20 36 4 26 Z';
  const cuttingEdge = 'M 4 26 Q 20 33 36 32';

  if (variant === 'icon') {
    return (
      <svg
        width="48"
        height="48"
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Slicing Edge"
        className={className}
      >
        {/* Badge container */}
        <rect width="52" height="52" rx="10" fill={containerFill} />

        {/* Blade body */}
        <path d={blade} fill="white" />

        {/* Cutting-edge accent line */}
        <path d={cuttingEdge} stroke={edgeStroke} strokeWidth="1.5" strokeLinecap="round" />

        {/* Bolster */}
        <rect x="36" y="13" width="4" height="19" rx="1.5" fill={bolsterFill} />

        {/* Handle */}
        <rect x="40" y="17" width="10" height="12" rx="3" fill={handleFill} />

        {/* Handle rivets */}
        <circle cx="44"   cy="23" r="1.2" fill="white" opacity="0.40" />
        <circle cx="47.5" cy="23" r="1.2" fill="white" opacity="0.40" />
      </svg>
    );
  }

  /* ── full lockup: badge ─ wordmark ── */
  return (
    <svg
      width="192"
      height="52"
      viewBox="0 0 192 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Slicing Edge"
      className={className}
    >
      {/* ── ICON BADGE ── */}
      <rect width="52" height="52" rx="10" fill={containerFill} />

      {/* Blade body */}
      <path d={blade} fill="white" />

      {/* Cutting-edge accent line */}
      <path d={cuttingEdge} stroke={edgeStroke} strokeWidth="1.5" strokeLinecap="round" />

      {/* Bolster */}
      <rect x="36" y="13" width="4" height="19" rx="1.5" fill={bolsterFill} />

      {/* Handle */}
      <rect x="40" y="17" width="10" height="12" rx="3" fill={handleFill} />

      {/* Handle rivets */}
      <circle cx="44"   cy="23" r="1.2" fill="white" opacity="0.40" />
      <circle cx="47.5" cy="23" r="1.2" fill="white" opacity="0.40" />

      {/* ── SEPARATOR ── */}
      <line
        x1="64" y1="11"
        x2="64" y2="41"
        stroke={separatorColor}
        strokeWidth="1"
      />

      {/* ── WORDMARK ── */}
      {/* "SLICING" — wide tracking, lightweight */}
      <text
        x="74"
        y="23"
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize="10.5"
        fontWeight="400"
        letterSpacing="4"
        fill={labelTop}
      >
        SLICING
      </text>

      {/* "Edge" — bold italic, dominant */}
      <text
        x="73"
        y="44"
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize="23"
        fontWeight="700"
        fontStyle="italic"
        fill={labelBottom}
      >
        Edge
      </text>
    </svg>
  );
}
