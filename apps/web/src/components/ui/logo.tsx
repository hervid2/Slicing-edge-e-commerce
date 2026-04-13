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

  /*
   * Knife geometry — badge space: 68 × 52 px
   *
   * Blade  : tip at x=3, heel at x=47  →  44 px long  (was 32 px, +38 %)
   * Bolster: x=47–51  (4 px wide)
   * Handle : x=51–66  →  15 px long    (was 10 px, +50 %)
   *
   * Blade height at heel: 20 px  (y=13 … y=33, center y=26)
   */
  const blade       = 'M 3 26 L 47 13 L 47 33 Q 25 37 3 26 Z';
  const cuttingEdge = 'M 3 26 Q 25 34 47 33';

  if (variant === 'icon') {
    return (
      <svg
        width="52"
        height="40"
        viewBox="0 0 68 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Slicing Edge"
        className={className}
      >
        {/* Badge container — landscape rectangle */}
        <rect width="68" height="52" rx="10" fill={containerFill} />

        {/* Blade body */}
        <path d={blade} fill="white" />

        {/* Cutting-edge accent line */}
        <path d={cuttingEdge} stroke={edgeStroke} strokeWidth="1.5" strokeLinecap="round" />

        {/* Bolster */}
        <rect x="47" y="12" width="4" height="21" rx="1.5" fill={bolsterFill} />

        {/* Handle */}
        <rect x="51" y="16" width="15" height="14" rx="3" fill={handleFill} />

        {/* Handle rivets — evenly spaced */}
        <circle cx="57"   cy="23" r="1.2" fill="white" opacity="0.40" />
        <circle cx="62.5" cy="23" r="1.2" fill="white" opacity="0.40" />
      </svg>
    );
  }

  /* ── full lockup: badge (68×52) ─ separator ─ wordmark ── */
  return (
    <svg
      width="218"
      height="52"
      viewBox="0 0 218 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Slicing Edge"
      className={className}
    >
      {/* ── ICON BADGE ── */}
      <rect width="68" height="52" rx="10" fill={containerFill} />

      {/* Blade body */}
      <path d={blade} fill="white" />

      {/* Cutting-edge accent line */}
      <path d={cuttingEdge} stroke={edgeStroke} strokeWidth="1.5" strokeLinecap="round" />

      {/* Bolster */}
      <rect x="47" y="12" width="4" height="21" rx="1.5" fill={bolsterFill} />

      {/* Handle */}
      <rect x="51" y="16" width="15" height="14" rx="3" fill={handleFill} />

      {/* Handle rivets — evenly spaced */}
      <circle cx="57"   cy="23" r="1.2" fill="white" opacity="0.40" />
      <circle cx="62.5" cy="23" r="1.2" fill="white" opacity="0.40" />

      {/* ── SEPARATOR ── */}
      <line
        x1="80" y1="11"
        x2="80" y2="41"
        stroke={separatorColor}
        strokeWidth="1"
      />

      {/* ── WORDMARK ── */}
      {/* "SLICING" — wide tracking, lightweight */}
      <text
        x="90"
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
        x="89"
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
