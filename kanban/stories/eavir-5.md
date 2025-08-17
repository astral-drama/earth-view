# Story: eavir-5 - Satellite and ISS Tracking

## Overview
Add real-time satellite tracking overlay showing International Space Station, major satellites, and orbital paths.

## Acceptance Criteria
- [ ] ISS real-time position and orbital path
- [ ] Major satellite constellation tracking (Starlink, GPS, etc.)
- [ ] Orbital mechanics visualization
- [ ] Ground track projections
- [ ] Satellite info panels on hover/click
- [ ] Toggle satellite categories on/off

## Technical Details
- TLE (Two-Line Element) data integration
- SGP4/SDP4 orbital propagation algorithms
- Real-time satellite position APIs
- 3D orbital path rendering
- Ground station visibility calculations

## Data Sources
- NASA TLE data
- CelesTrak satellite database
- Space-Track.org API