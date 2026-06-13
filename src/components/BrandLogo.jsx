export function BrandLogo({ variant = 'color', className = '' }) {
  const style = variant === 'white'
    ? { filter: 'brightness(0) invert(1)' }
    : undefined;

  return (
    <img
      src="/sg-logo.svg"
      alt="Sportograf"
      className={`object-contain my-auto ${className}`}
      style={style}
    />
  );
}
