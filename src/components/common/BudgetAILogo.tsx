import React from 'react';

interface BudgetAILogoProps {
  /** Size variant or pixel dimension */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show text ("BudgetAI Gov") or just the emblem */
  showText?: boolean;
  /** Optional custom CSS classes */
  className?: string;
  /** Optional subtitle override (default: "Gov") */
  subtitle?: string;
  /** Optional click handler */
  onClick?: () => void;
}

export const BudgetAIMark: React.FC<{ size?: number | string; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      aria-label="BudgetAI Emblem"
    >
      {/* Rounded Shield Outline */}
      <path
        d="M 50 12
           C 67 12 79 15 84 26
           C 88 38 87 56 77 72
           C 67 86 56 91 50 92
           C 44 91 33 86 23 72
           C 13 56 12 38 16 26
           C 21 15 33 12 50 12 Z"
        stroke="#00C9C8"
        strokeWidth="7.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Circular Dial Arc with Opening at 2-4 o'clock */}
      <path
        d="M 64.5 35.5
           A 20.5 20.5 0 1 0 64.5 64.5"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Compass Needle pointing to upper-right */}
      <polygon
        points="64,36 51.5,54.5 37.5,62.5 45.5,48.5"
        fill="#00C9C8"
      />
    </svg>
  );
};

export const BudgetAILogo: React.FC<BudgetAILogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  subtitle = 'Gov',
  onClick,
}) => {
  const sizeConfigs = {
    sm: { markSize: 28, textClass: 'text-sm', subClass: 'text-[10px]' },
    md: { markSize: 38, textClass: 'text-lg', subClass: 'text-[11px]' },
    lg: { markSize: 48, textClass: 'text-2xl', subClass: 'text-xs' },
    xl: { markSize: 64, textClass: 'text-3xl', subClass: 'text-sm' },
  };

  const config = sizeConfigs[size] || sizeConfigs.md;

  return (
    <div
      id="brand-logo-budgetai"
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <BudgetAIMark size={config.markSize} />
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className={`font-bold tracking-tight text-white ${config.textClass}`}>
            Budget<span className="text-white">AI</span>
          </span>
          {subtitle && (
            <span
              className={`font-bold text-[#00C9C8] tracking-normal mt-0.5 ${config.subClass}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
