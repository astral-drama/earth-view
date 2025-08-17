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