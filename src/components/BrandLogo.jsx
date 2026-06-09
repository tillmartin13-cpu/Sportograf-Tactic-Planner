export function BrandLogo({ variant = 'color', className = '' }) {
  const style = variant === 'white' ? { filter: 'brightness(0) invert(1)' } : undefined;

  return (
    <img
      src="/assets/sportograf-logo.png"
      alt="Sportograf"
      className={`object-contain ${className}`}
      style={style}
    />
  );
}
