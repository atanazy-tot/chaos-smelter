/** Chromatic SVG icons for neobrutalist design */

export const Icons = {
  file: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="12" y="4" width="40" height="56" fill="url(#fileGrad)" stroke="#000" strokeWidth="4"/>
      <path d="M24 24H40M24 34H40M24 44H34" stroke="#000" strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <linearGradient id="fileGrad" x1="12" y1="4" x2="52" y2="60">
          <stop stopColor="#FF6B6B"/>
          <stop offset="0.5" stopColor="#FFDE59"/>
          <stop offset="1" stopColor="#E8FF8D"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  paste: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="16" width="36" height="44" fill="url(#pasteGrad)" stroke="#000" strokeWidth="4"/>
      <rect x="20" y="8" width="24" height="16" rx="2" fill="#A8E6FF" stroke="#000" strokeWidth="3"/>
      <rect x="20" y="28" width="44" height="32" fill="#C8B6FF" stroke="#000" strokeWidth="4"/>
      <path d="M28 38H56M28 46H48" stroke="#000" strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <linearGradient id="pasteGrad" x1="8" y1="16" x2="44" y2="60">
          <stop stopColor="#A8E6FF"/>
          <stop offset="1" stopColor="#C8B6FF"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  files: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="8" width="36" height="48" fill="#FFDE59" stroke="#000" strokeWidth="3"/>
      <rect x="12" y="12" width="36" height="48" fill="url(#filesGrad)" stroke="#000" strokeWidth="4"/>
      <path d="M22 28H38M22 36H38M22 44H32" stroke="#000" strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <linearGradient id="filesGrad" x1="12" y1="12" x2="48" y2="60">
          <stop stopColor="#FF6B6B"/>
          <stop offset="0.5" stopColor="#FFDE59"/>
          <stop offset="1" stopColor="#E8FF8D"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  drop: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="8" y="16" width="64" height="56" fill="url(#dropGrad)" stroke="#000" strokeWidth="4"/>
      <path d="M40 8V48M40 48L28 36M40 48L52 36" stroke="#000" strokeWidth="5" strokeLinecap="square"/>
      <defs>
        <linearGradient id="dropGrad" x1="8" y1="16" x2="72" y2="72">
          <stop stopColor="#FFDE59"/>
          <stop offset="1" stopColor="#E8FF8D"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  arrowLeft: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M20 8L12 16L20 24" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
    </svg>
  ),

  arrowRight: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M12 8L20 16L12 24" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
    </svg>
  ),

  download: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3V13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
      <path d="M3 15V17H17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
    </svg>
  ),

  copy: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="6" y="6" width="11" height="11" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 14V3H14" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
};
