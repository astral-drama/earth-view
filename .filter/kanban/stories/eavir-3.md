# Story: eavir-3 - Real-time Sun Position and Lighting for Time Visualization

## Overview
Implement accurate sun position calculation and Earth lighting to visually represent current time, making the Earth model act as a global clock through realistic day/night cycles.

## Acceptance Criteria
- [ ] Calculate sun position based on current date/time for accurate lighting
- [ ] Implement realistic directional lighting that shows time of day globally
- [ ] Create smooth day/night terminator line that moves with real time
- [ ] Add prominent time display in top center of UI showing current local time
- [ ] Show realistic lighting gradients (dawn/dusk effects) that indicate time
- [ ] Display seasonal lighting variations (solstices/equinoxes)
- [ ] Add time controls to simulate different times/dates
- [ ] Implement subsolar point visualization to show "noon" location
- [ ] Ensure lighting accuracy allows users to determine time from Earth appearance

## Technical Details

### Primary Goal: Time Through Lighting
The core purpose is visual time representation:
- Earth lighting should accurately reflect current time globally
- Users should be able to determine approximate time by observing which regions are lit
- Day/night boundary should move continuously with real time
- Seasonal variations should be visible and accurate

### Time Display UI
```javascript
// Prominent time display component
{
  position: "top-center",
  format: "HH:MM:SS timezone",
  timezone: "auto-detect", // User's local timezone
  fontSize: "large",
  background: "semi-transparent",
  updateFrequency: 1000 // 1 second updates
}
```

### Sun Position Calculation
- Use astronomical algorithms for precise sun coordinates
- Account for Earth's axial tilt (23.5°) and orbital position
- Calculate solar declination and hour angle
- Convert to 3D directional vector for WebGL lighting

## Essential Implementation Tips

**Solar Declination Formula**: Calculate seasonal sun position using: declination = 23.45° × sin((360 × (284 + dayOfYear) / 365)). Pay attention to the sign - Northern Hemisphere summer requires positive declination.

**Sun Longitude Calculation**: At 12:00 UTC, sun is at 0° (Greenwich). Sun moves 15° per hour westward. Calculate as: sunLongitude = (hours - 12) × 15°. Getting this sign wrong puts daylight on wrong side of Earth.

**Time Source**: Always use actual system time. For maximum accuracy, sync with chrony NTP when available. Use getUTCHours(), getUTCMinutes(), getUTCSeconds() for calculations.

**Coordinate System Alignment**: Sun direction vector should use: X for East-West, Y for North-South (seasonal), Z for additional dimension. Normalize the vector after calculation.

**Day of Year**: Calculate accurately accounting for leap years. Use: dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000).

**Testing Verification**: At 03:00 UTC, Americas should be dark, Asia/Pacific in daylight. At 15:00 UTC, Europe/Africa lit, Americas getting morning sun. If backwards, check longitude calculation sign.

### UI Components

#### Time Display
- **Location**: Top center of viewport
- **Format**: "14:23:45 EST" (local timezone)
- **Style**: Large, readable font with subtle background
- **Updates**: Real-time (1-second intervals)
- **Interaction**: Click to cycle through UTC, local, selected timezone

#### Time Accuracy Indicator
- Small indicator showing time sync status
- Green: Synced with system time
- Yellow: Minor drift detected
- Red: Significant time drift (if chrony integration available)

### Shader Enhancements
- Implement realistic atmospheric scattering
- Add terminator line smoothing for accurate day/night boundary
- Create dawn/dusk color gradients that show time transitions
- Enhance night lighting transitions for visual time continuity

### Time Controls
- Date/time picker for any moment in history/future
- Time speed controls (1x to 10000x speed) for time-lapse
- Preset buttons for solstices, equinoxes, significant dates
- "Reset to Current Time" button
- Current local time as default display

## Validation Requirements
- Verify lighting matches actual sunrise/sunset times for major cities
- Confirm subsolar point matches expected location for current time
- Test time display accuracy against system clock
- Validate seasonal changes occur at correct dates

## Dependencies
- Requires eavir-2 (real Earth textures) for accurate lighting visualization
- System time access for current time display
- Timezone database for local time conversion