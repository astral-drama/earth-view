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

## Dependencies
- Requires eavir-2 (textures) and eavir-3 (lighting)
- Prepares foundation for time server overlay system