export function getColorFromId(id: number): string {
  // Use the id as a seed for pseudo-random generation
  const seed = Math.abs(id) % 16777215; // 16777215 is FFFFFF in decimal

  // Convert to hex and pad with zeros if needed
  let color = seed.toString(16).padStart(6, "0");

  // Ensure reasonable contrast by adjusting brightness if too dark or light
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);

  // Calculate perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness < 128) {
    // Too dark, make it lighter
    color = color.replace(/./g, (c) =>
      Math.min(parseInt(c, 16) + 2, 15).toString(16),
    );
  } else if (brightness > 225) {
    // Too light, make it darker
    color = color.replace(/./g, (c) =>
      Math.max(parseInt(c, 16) - 2, 0).toString(16),
    );
  }

  return `#${color}`;
}
