import { readFileSync } from 'fs';
import path from 'path';

describe('DesktopHomePage wheel guard wiring', () => {
  it('wires hover and wheel handlers on market temp slide', () => {
    const filePath = path.resolve(__dirname, 'desktop-home-page.tsx');
    const source = readFileSync(filePath, 'utf8');

    expect(source).toContain('onMouseEnter={() => setIsMarketTempHovered(true)}');
    expect(source).toContain('onMouseLeave={() => setIsMarketTempHovered(false)}');
    expect(source).toContain('onWheelCapture={handleMarketTempWheel}');
  });

  it('delegates wheel policy to shared guard utility', () => {
    const filePath = path.resolve(__dirname, 'desktop-home-page.tsx');
    const source = readFileSync(filePath, 'utf8');

    expect(source).toContain('applyMarketTempWheelGuard(event, { slide, isMarketTempHovered });');
  });
});
