# Story: eavir-5 - Chrony Time Accuracy for Lighting Precision

## Overview
Integrate chrony NTP client to ensure maximum time accuracy for the Earth lighting system, providing real-time time server monitoring and time quality indicators to support precise time visualization.

## Acceptance Criteria
- [ ] Integrate chrony for system time accuracy monitoring
- [ ] Display time sync status in UI (affects lighting accuracy)
- [ ] Parse chrony time offset data to show sync quality
- [ ] Add time accuracy indicator next to main time display
- [ ] Show NTP server locations as optional overlay
- [ ] Provide time quality metrics for lighting validation
- [ ] Alert if time drift affects lighting accuracy (>1 second)
- [ ] Display chrony tracking status and current time source

## Technical Details

### Primary Goal: Lighting Time Accuracy
The main purpose is ensuring the Earth lighting accurately represents real time:
- Monitor system time accuracy via chrony
- Provide visual feedback about time sync quality
- Alert users if lighting may be inaccurate due to time drift
- Support the primary time visualization goal

### Time Accuracy Monitoring
```javascript
// Time accuracy status for lighting system
{
  timeAccuracy: {
    offset: 0.000045,        // Current offset in seconds
    syncStatus: "synced",    // synced, drifting, unsynchronized
    lastUpdate: "2024-01-15T12:34:56Z",
    source: "time.google.com",
    stratum: 2,
    quality: "excellent"     // excellent, good, fair, poor
  },
  uiIndicator: {
    position: "top-right",   // Near main time display
    color: "green",          // green, yellow, red
    tooltip: "Time synced with time.google.com (±45µs)"
  }
}
```

### Chrony Integration for Time Quality
```bash
# Essential chrony commands for time accuracy
chronyc tracking          # System clock performance
chronyc sources -v        # Current time sources
chronyc sourcestats       # Source quality metrics
chronyc serverstats       # Network performance
```

### UI Integration with Main Time Display
- **Time Accuracy Badge**: Small indicator next to main time display
- **Color Coding**:
  - Green: Time accurate (< 100ms offset)
  - Yellow: Minor drift (100ms - 1s offset)
  - Red: Significant drift (> 1s offset, affects lighting)
- **Click Details**: Show full chrony status panel

### Time Quality Thresholds for Lighting
```javascript
const timeQualityLevels = {
  excellent: { maxOffset: 0.001, color: "green" },    // ±1ms
  good:      { maxOffset: 0.1,   color: "green" },    // ±100ms
  fair:      { maxOffset: 1.0,   color: "yellow" },   // ±1s
  poor:      { maxOffset: Infinity, color: "red" }     // >1s
};
```

### Optional NTP Server Visualization
When enabled, show:
- Current sync source highlighted
- Basic server locations (not the main focus)
- Connection lines to active sources
- Simple quality indicators

### Chrony Output Parsing (Minimal)
Focus only on data needed for time accuracy:
- **System Offset**: Current time difference
- **Sync Source**: Which server is being used
- **Last Update**: When last synchronized
- **Stratum Level**: Time source quality indicator

### Error Handling
- **No Chrony**: Fall back to system time with warning
- **Connection Loss**: Show "Time sync unavailable" status
- **Large Drift**: Prominent warning that lighting may be inaccurate

## Implementation Phases

### Phase 1: Basic Time Monitoring
- Parse `chronyc tracking` output
- Display simple sync status indicator
- Show current time source in tooltip

### Phase 2: Quality Integration
- Implement time quality thresholds
- Add visual warnings for poor time sync
- Connect time accuracy to lighting system

### Phase 3: Optional Visualization
- Add NTP server overlay (toggleable)
- Show connection to current sync source
- Basic geographic server display

## Dependencies
- Requires eavir-3 (Time Lighting) for integration
- Chrony installed on host system (optional, graceful fallback)
- System time access for fallback mode

## Success Metrics
- Users can see if Earth lighting reflects accurate time
- Time sync issues are immediately visible
- System provides confidence in time visualization accuracy
- Lighting system can adjust for known time offsets

## Future Enhancements
- Historical time accuracy graphs
- Time server performance comparison
- Network latency correlation with time accuracy
- Integration with system monitoring tools