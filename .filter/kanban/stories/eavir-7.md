# Story: eavir-7 - Advanced Chrony NTP Analytics

## Overview
Implement advanced time synchronization analysis and visualization for NTP networks using chrony's comprehensive statistics and monitoring capabilities.

## Acceptance Criteria
- [ ] Parse chrony drift and measurement logs
- [ ] Visualize server reachability patterns
- [ ] Display frequency stability graphs
- [ ] Show offset distribution histograms
- [ ] Implement server quality ranking
- [ ] Create jitter and delay analysis
- [ ] Build stratum hierarchy visualization
- [ ] Add server selection algorithm display

## Technical Details

### Chrony Advanced Statistics
```bash
# Detailed source analysis
chronyc sourcestats -v
chronyc sources -v

# Server selection details
chronyc selectdata

# Activity monitoring
chronyc activity
chronyc clients

# Smoothing and adjustments
chronyc smoothtime
chronyc waitsync
```

### Analytics Components

#### Server Quality Metrics
```javascript
{
  serverMetrics: {
    address: "time.google.com",
    stratum: 1,
    reachability: 377,        // Octal (all 8 polls successful)
    lastSample: {
      offset: -0.000045,      // seconds
      delay: 0.012,           // RTT in seconds
      dispersion: 0.0001
    },
    statistics: {
      nSamples: 64,
      spanSeconds: 4096,
      frequency: -12.345,     // PPM
      skew: 0.234,           // PPM
      stdDev: 0.000023       // seconds
    }
  }
}
```

#### Reachability Analysis
- **Reachability Register**:
  - 8-bit shift register (octal display)
  - 377 = 11111111 (perfect reachability)
  - 375 = 11111101 (one missed poll)
  - Pattern detection for intermittent issues

- **Visualization**:
  - Timeline showing poll success/failure
  - Color-coded reachability score
  - Alert on degraded patterns

#### Frequency Stability
```javascript
calculateStability(measurements) {
  return {
    allan_deviation: calculateADEV(measurements),
    frequency_wander: calculateWander(measurements),
    time_deviation: calculateTDEV(measurements),
    stability_grade: gradeStability(metrics)
  };
}
```

### Chrony Log Analysis

#### Measurements Log Parser
```bash
# Parse measurements.log
# Format: Date Time IP N/B/L Test Offset Peer-offset Peer-dispersion
tail -f /var/log/chrony/measurements.log | parse_measurements.js
```

#### Statistics Log Parser
```bash
# Parse statistics.log
# Format: Date Time IP Freq Skew Offset Std-dev N-samples
tail -f /var/log/chrony/statistics.log | parse_statistics.js
```

### Visualization Features

#### Stratum Hierarchy Tree
- Root: Stratum 0 (atomic clocks)
- Level 1: Stratum 1 servers
- Level 2: Stratum 2 servers
- Show active sync paths
- Highlight selected source

#### Offset Distribution
- Histogram of offset measurements
- Normal distribution overlay
- Outlier detection
- 68-95-99.7 rule indicators

#### Jitter Analysis
- Allan variance plots
- Phase noise spectrum
- Wander vs averaging time
- Comparison between servers

### Server Selection Visualization
Show chrony's source selection algorithm:
1. Stratum (lowest preferred)
2. Root distance calculation
3. Clustering algorithm
4. Survivor selection
5. Combining algorithm
6. Final source selection

## Implementation Phases

### Phase 1: Basic Analytics
- Parse chrony statistics output
- Calculate basic metrics
- Simple quality scoring
- Text-based displays

### Phase 2: Visual Analytics
- Graphs and charts integration
- Real-time updating displays
- Interactive server selection
- Drill-down capabilities

### Phase 3: Advanced Analysis
- Allan deviation calculations
- Predictive drift modeling
- Anomaly pattern detection
- Performance forecasting

## Data Sources
- Chrony sourcestats and sources
- Measurement and statistics logs
- Tracking information
- Drift file history
- RTC data if available

## Testing Requirements
- Generate synthetic chrony data
- Simulate various quality scenarios
- Test with 100+ servers
- Verify calculation accuracy
- Performance with large datasets

## Dependencies
- Requires eavir-5 (Chrony Time Server) completed
- Chrony with logging enabled
- Sufficient data history (7+ days ideal)

## Future Enhancements
- Machine learning for drift prediction
- Correlation with temperature data
- Integration with SNMP monitoring
- Automated server recommendation
- Time quality SLA tracking