interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
}: CircularProgressProps) {
  // Clamp percentage between 1 and 100
  const clampedPercentage = Math.max(1, Math.min(100, percentage));

  // Calculate total shares (12 shares for 6 segments, 2 shares per segment)
  const totalShares = 12;
  const filledShares = Math.round((clampedPercentage / 100) * totalShares);

  // Calculate center and radius
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  // Create 6 segments
  const segments = [];
  const segmentAngle = 60; // 360 degrees / 6 segments

  // Calculate proportional gap based on stroke width and radius
  // This ensures gaps are visible even at small sizes
  const circumference = 2 * Math.PI * radius;
  const segmentArcLength = circumference / 6;
  const gapLength = strokeWidth * 1.5; // Gap length proportional to stroke width
  const gapAngle = (gapLength / circumference) * 360; // Convert gap length to angle
  const actualSegmentAngle = segmentAngle - gapAngle;

  for (let i = 0; i < 6; i++) {
    // Calculate how many shares this segment should have (0, 1, or 2)
    // Start filling from the top segment (index 0)
    const segmentStartShare = i * 2;
    const segmentShares = Math.max(
      0,
      Math.min(2, filledShares - segmentStartShare),
    );

    // Determine segment state
    let segmentColor: string;
    let segmentOpacity: number;

    if (segmentShares === 0) {
      segmentColor = "#e5e7eb"; // gray-200
      segmentOpacity = 1;
    } else if (segmentShares === 1) {
      segmentColor = "#22c55e"; // green-500
      segmentOpacity = 0.4;
    } else {
      segmentColor = "#22c55e"; // green-500
      segmentOpacity = 1;
    }

    // Calculate start angle (starting from top, going clockwise)
    const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
    const endAngle =
      (i * segmentAngle + actualSegmentAngle - 90) * (Math.PI / 180);

    // Calculate arc path
    const startX = center + radius * Math.cos(startAngle);
    const startY = center + radius * Math.sin(startAngle);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);

    const largeArcFlag = actualSegmentAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    ].join(" ");

    segments.push(
      <path
        key={i}
        d={pathData}
        stroke={segmentColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        opacity={segmentOpacity}
      />,
    );
  }

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {segments}
    </svg>
  );
}
