interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dark?: boolean;
}

export default function Logo({ className = '', size = 'md', dark = false }: LogoProps) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  const textColor = dark ? 'text-gray-900' : 'text-white';
  const accentColor = dark ? 'text-blue-600' : 'text-[#EFA498]';

  return (
    <div className={`font-logo ${sizes[size]} tracking-tighter ${className}`} style={{ fontWeight: 800 }}>
      <span className={textColor}>INVOIS</span>
      <span className={textColor}>A</span>
      <span className={accentColor}>\</span>
      <span className={textColor}>C</span>
      <span className={accentColor} style={{ marginLeft: '0.15em' }}>.</span>
    </div>
  );
}
