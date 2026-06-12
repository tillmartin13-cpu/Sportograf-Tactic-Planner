export function LsIcon({ size = 16, className = '' }) {
  const s = size;
  return (
    <svg
      width={s}
      height={Math.round(s * 0.78)}
      viewBox="0 0 18 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Remote camera"
    >
      <rect x="0.6" y="5.2" width="8.4" height="6.6" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="9,6.8 9,9.2 11.2,8" fill="currentColor" />
      <circle cx="13.2" cy="8" r="1.15" stroke="currentColor" strokeWidth="1.1" />
      <path d="M15 5.8 C16.4 7.2 16.4 9.8 15 11.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M16.6 4.2 C18.8 6.4 18.8 10.6 16.6 12.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
