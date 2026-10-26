// components/OmnidexLogo.tsx
'use client';

export default function OmnidexLogo({
  className = 'w-8 h-8',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="omniIrisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <radialGradient id="omniIrisCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </radialGradient>
      </defs>

      {/* Outer Housing Ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="#1E293B"
        strokeWidth="3.5"
        strokeOpacity="0.8"
      />

      {/* Iris Aperture Arc 1: Top Right */}
      <path
        d="M50 12A38 38 0 0 1 88 50"
        stroke="url(#omniIrisGrad)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Iris Aperture Arc 2: Bottom Right */}
      <path
        d="M88 50A38 38 0 0 1 50 88"
        stroke="url(#omniIrisGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Iris Aperture Arc 3: Bottom Left */}
      <path
        d="M50 88A38 38 0 0 1 12 50"
        stroke="url(#omniIrisGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />

      {/* Iris Aperture Arc 4: Top Left */}
      <path
        d="M12 50A38 38 0 0 1 50 12"
        stroke="url(#omniIrisGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />

      {/* Aperture Core Optical Center */}
      <circle
        cx="50"
        cy="50"
        r="14"
        fill="url(#omniIrisCore)"
      />
      <circle
        cx="50"
        cy="50"
        r="5"
        fill="#FFFFFF"
      />
    </svg>
  );
}
