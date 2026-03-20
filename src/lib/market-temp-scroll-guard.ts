interface MarketTempScrollGuardInput {
  slide: number;
  isMarketTempHovered: boolean;
}

interface WheelGuardEvent {
  preventDefault: () => void;
  stopPropagation: () => void;
}

export function shouldBlockMarketTempWheel({
  slide,
  isMarketTempHovered,
}: MarketTempScrollGuardInput): boolean {
  return slide === 0 && isMarketTempHovered;
}

export function applyMarketTempWheelGuard(
  event: WheelGuardEvent,
  input: MarketTempScrollGuardInput,
): boolean {
  if (!shouldBlockMarketTempWheel(input)) return false;

  event.preventDefault();
  event.stopPropagation();
  return true;
}
