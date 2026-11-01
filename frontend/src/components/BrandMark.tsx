type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <img
      src="/scholarex-logo.png"
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}
