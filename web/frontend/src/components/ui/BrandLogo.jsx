export default function BrandLogo({ className = "w-10 h-10", color = "text-emerald-400" }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${color} transition-all duration-150`}
    >
      <defs>
        <mask id="wallet-clasp-mask">
          {/* Keep everything inside the white shape */}
          <rect width="100" height="100" fill="white" />
          {/* Cut out the clasp rectangle */}
          <rect x="56" y="49" width="16" height="13" rx="3.5" fill="black" />
        </mask>
      </defs>

      {/* Top flap (slanted wallet lid) */}
      <path 
        d="M36.7 32L56 26.5C57.5 26 59 27 59 28.5V32H36.7Z" 
        fill="currentColor"
      />
      
      {/* Main body of the wallet with speed streaks */}
      <path 
        d="M36.7 37H63C65.8 37 68 39.2 68 42V61C68 63.8 65.8 66 63 66H45C42.2 66 40 63.8 40 61V56H32.7C30.5 56 28.7 54.2 28.7 52C28.7 49.8 30.5 48 32.7 48H44V43H36.7C34.5 43 32.7 41.2 32.7 39C32.7 36.8 34.5 35 36.7 35V37Z" 
        fill="currentColor"
        mask="url(#wallet-clasp-mask)"
      />

      {/* Snap button on the clasp */}
      <circle 
        cx="60.5" 
        cy="55.5" 
        r="1.8" 
        fill="currentColor" 
      />
    </svg>
  );
}
