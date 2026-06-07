interface ComplianceRingProps {
  percentage: number
  isCompliant: boolean
  size?: number
  strokeWidth?: number
}

export default function ComplianceRing({
  percentage,
  isCompliant,
  size = 120,
  strokeWidth = 10
}: ComplianceRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  const color = percentage >= 100 ? '#22c55e' : percentage >= 75 ? '#3b82f6' : percentage >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)', filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-white leading-none">
          {percentage}%
        </span>
        <span className={`text-[10px] font-medium mt-0.5 ${isCompliant ? 'text-green-400' : 'text-red-400'}`}>
          {isCompliant ? '✓ Met' : '✗ Unmet'}
        </span>
      </div>
    </div>
  )
}
