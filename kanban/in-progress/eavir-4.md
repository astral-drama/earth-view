# Story: eavir-4 - Time Server Visualization Foundation

## Overview
Enhance Earth visualization for time server analysis with improved atmospheric effects, fixed time positioning, and minimal cloud interference for clear geographic visibility.

## Acceptance Criteria
- [ ] Subtle atmospheric scattering for depth without obscuring geography
- [ ] Fixed Earth position relative to sun (no auto-rotation)
- [ ] Minimal/toggleable cloud cover for clear landmass visibility
- [ ] Enhanced country/continent definition for server positioning
- [ ] Grid overlay system for coordinate reference
- [ ] Timezone boundary visualization
- [ ] Improved lighting for geographic feature clarity

## Technical Details
- Atmospheric shader with reduced intensity for clarity
- Earth rotation controlled only by user interaction
- Cloud opacity controls (0-100%)
- Timezone data integration for boundary overlays
- Coordinate grid system for precise positioning
- Enhanced landmass contrast for server placement

## Implementation Best Practices

**Real-Time Rotation Rate**: For realistic Earth rotation synchronized with actual time, use: rotationSpeed = (2π) / (24 × 60 × 60 × fps). This gives proper 24-hour rotation at your target framerate.

**Cloud Opacity Uniform**: Pass opacity as float uniform (0.0-1.0) to fragment shader. Mix cloud color using: mix(earthColor, cloudColor, cloudAlpha × opacity). This preserves underlying geography.

**Grid Overlay in Shader**: Calculate grid lines in fragment shader using modulo on texture coordinates. For 15-degree spacing: use mod(latDegrees, 15.0) < threshold. Highlight equator and prime meridian with brighter lines.

**Fixed Time Position**: For time server analysis, Earth should rotate but sun stays at current UTC position. Update sun position every frame based on real time, but allow manual Earth rotation for inspection.

**Atmosphere Subtlety**: Use fresnel effect sparingly (multiply by 0.1-0.2) to avoid washing out surface details. Calculate as: fresnel = 1.0 - abs(dot(viewDir, normal)).

**Performance Consideration**: Grid overlay and atmosphere calculations happen per fragment. Consider adding toggle uniforms to completely skip calculations when features are disabled, not just multiply by zero.

## Dependencies
- Requires eavir-2 (textures) and eavir-3 (lighting)
- Prepares foundation for time server overlay system