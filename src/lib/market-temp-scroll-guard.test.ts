import {
  applyMarketTempWheelGuard,
  shouldBlockMarketTempWheel,
} from '@/lib/market-temp-scroll-guard';

describe('shouldBlockMarketTempWheel', () => {
  it('blocks wheel when slide is market temperature and hover is active', () => {
    expect(shouldBlockMarketTempWheel({ slide: 0, isMarketTempHovered: true })).toBe(true);
  });

  it('does not block wheel when hover is inactive', () => {
    expect(shouldBlockMarketTempWheel({ slide: 0, isMarketTempHovered: false })).toBe(false);
  });

  it('does not block wheel on non-market-temperature slide', () => {
    expect(shouldBlockMarketTempWheel({ slide: 1, isMarketTempHovered: true })).toBe(false);
  });

  it('does not block wheel on any slide except market temperature', () => {
    expect(shouldBlockMarketTempWheel({ slide: 2, isMarketTempHovered: true })).toBe(false);
    expect(shouldBlockMarketTempWheel({ slide: -1, isMarketTempHovered: true })).toBe(false);
  });
});

describe('applyMarketTempWheelGuard', () => {
  it('calls preventDefault and stopPropagation when guard condition is met', () => {
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    const blocked = applyMarketTempWheelGuard(event, {
      slide: 0,
      isMarketTempHovered: true,
    });

    expect(blocked).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('does not touch event when hover is inactive', () => {
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    const blocked = applyMarketTempWheelGuard(event, {
      slide: 0,
      isMarketTempHovered: false,
    });

    expect(blocked).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  it('keeps the same policy on non-market-temperature slide', () => {
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    const blocked = applyMarketTempWheelGuard(event, {
      slide: 1,
      isMarketTempHovered: true,
    });

    expect(blocked).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});
