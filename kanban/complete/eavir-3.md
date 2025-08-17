# Story: eavir-3 - Real-time Sun Position and Lighting

## Overview
Implement accurate sun position calculation based on real-time date/time to create realistic day/night cycles and lighting effects.

## Acceptance Criteria
- [ ] Calculate sun position based on current date/time
- [ ] Implement realistic directional lighting from sun position
- [ ] Create smooth day/night terminator line across Earth
- [ ] Add realistic lighting gradients (dawn/dusk effects)
- [ ] Show seasonal lighting variations (solstices/equinoxes)
- [ ] Add time controls to simulate different times/dates
- [ ] Implement subsolar point visualization

## Technical Details

### Sun Position Calculation
- Use astronomical algorithms for precise sun coordinates
- Account for Earth's axial tilt (23.5°) and orbital position
- Calculate solar declination and hour angle
- Convert to 3D directional vector for WebGL lighting

## Essential Implementation Tips

**Solar Declination Formula**: Calculate seasonal sun position using: declination = 23.45° × sin((360 × (284 + dayOfYear) / 365)). Pay attention to the sign - Northern Hemisphere summer requires positive declination.

**Sun Longitude Calculation**: At 12:00 UTC, sun is at 0° (Greenwich). Sun moves 15° per hour westward. Calculate as: sunLongitude = (hours - 12) × 15°. Getting this sign wrong puts daylight on wrong side of Earth.

**Time Source**: Always use actual UTC time from Date object. Avoid manual time calculations that drift from real world. Use getUTCHours(), getUTCMinutes(), getUTCSeconds() for accuracy.

**Coordinate System Alignment**: Sun direction vector should use: X for East-West, Y for North-South (seasonal), Z for additional dimension. Normalize the vector after calculation.

**Day of Year**: Calculate accurately accounting for leap years. Use: dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000).

**Testing Verification**: At 03:00 UTC, Americas should be dark, Asia/Pacific in daylight. At 15:00 UTC, Europe/Africa lit, Americas getting morning sun. If backwards, check longitude calculation sign.

### Shader Enhancements
- Implement realistic atmospheric scattering
- Add terminator line smoothing
- Create dawn/dusk color gradients
- Enhance night lighting transitions

### Time Controls
- Date/time picker for any moment in history/future
- Time speed controls (1x to 10000x speed)
- Preset buttons for solstices, equinoxes
- Current UTC time as default

## Dependencies
- Requires eavir-2 (real Earth textures) for accurate lighting