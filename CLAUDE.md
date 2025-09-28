# Earth View - Claude Code Development Guide

## Project Overview
Earth View is a WebGL Earth simulator that visualizes time through realistic lighting. The primary goal is to show the current time via accurate Earth day/night cycles with a prominent time display in the UI.

## Development Workflow

### Story-Based Development
Each story from `.filter/kanban/stories/` should be implemented as a separate feature branch following this workflow:

#### 1. Branch Creation
```bash
# Create feature branch from v2
git checkout v2
git pull origin v2
git checkout -b story/eavir-X-brief-description

# Example:
git checkout -b story/eavir-3-sun-position-lighting
```

#### 2. Story Implementation
- Implement the story requirements incrementally
- Follow acceptance criteria in the story markdown file
- Focus on the core goal: time visualization through lighting
- Ensure prominent time display is functional

#### 3. Testing Requirements

##### Unit Testing
Before proceeding to next task/sub-task:
```bash
# Run any existing unit tests
npm test  # if available
# Or validate core functionality manually
```

##### Functional Testing with Puppeteer
Use the Puppeteer MCP server to verify changes before proceeding:

```javascript
// Example Puppeteer verification script
await page.goto('http://localhost:3000');

// Verify Earth renders
await page.waitForSelector('canvas');

// Check time display is prominent and visible
const timeDisplay = await page.$('[data-testid="time-display"]');
expect(timeDisplay).toBeTruthy();

// Verify lighting changes with time manipulation
// ... additional functional tests
```

##### Required Verifications
For each story completion, verify:

1. **Core Functionality**:
   - Earth renders correctly
   - Time display is prominent and accurate
   - Lighting reflects current time (for stories 3+)
   - No console errors

2. **Visual Verification** (using Puppeteer screenshots):
   - Take screenshot before changes
   - Take screenshot after implementation
   - Compare for expected visual differences
   - Ensure UI elements are properly positioned

3. **Performance Verification**:
   - 60 FPS rendering maintained
   - No memory leaks during extended use
   - Responsive user interactions

#### 4. Story Completion Checklist

Before merging any story branch:

- [ ] All acceptance criteria implemented
- [ ] Unit tests pass (if available)
- [ ] Puppeteer functional tests pass
- [ ] Visual verification completed
- [ ] Performance requirements met
- [ ] No console errors or warnings
- [ ] Time display functions correctly
- [ ] Lighting accuracy verified (stories 3+)
- [ ] Cross-browser compatibility checked

#### 5. Merge Process
```bash
# Switch to v2 and update
git checkout v2
git pull origin v2

# Merge feature branch
git merge story/eavir-X-brief-description

# Push to remote
git push origin v2

# Clean up feature branch
git branch -d story/eavir-X-brief-description
```

### Puppeteer Testing Scripts

#### Basic Functionality Test
```javascript
async function testBasicFunctionality() {
  await page.goto('http://localhost:3000');

  // Wait for Earth to load
  await page.waitForSelector('canvas');
  await page.waitForTimeout(2000);

  // Check time display
  const timeText = await page.$eval('[data-testid="time-display"]',
    el => el.textContent);
  console.log('Current time display:', timeText);

  // Take screenshot for visual verification
  await page.screenshot({ path: 'test-earth-render.png' });

  return true;
}
```

#### Lighting Verification Test (for stories 3+)
```javascript
async function testLightingAccuracy() {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('canvas');

  // Get current time from display
  const displayedTime = await page.$eval('[data-testid="time-display"]',
    el => el.textContent);

  // Verify lighting matches time
  // (Implementation depends on story requirements)

  await page.screenshot({ path: 'test-lighting-verification.png' });

  return true;
}
```

### Development Commands

#### Start Development Server
```bash
npm run serve-node
# Server starts at http://localhost:3000
```

#### Run Puppeteer Tests
```bash
# Run via Claude Code with mcp__puppeteer commands
# Navigate to localhost:3000
# Take screenshots for verification
# Execute test scripts
```

### Story Priority Order

Implementation should follow this order for proper dependency management:

1. **eavir-1**: Basic Earth Rendering + Time Display UI
2. **eavir-2**: NASA Earth Textures
3. **eavir-3**: Real-time Sun Position and Lighting (CORE)
4. **eavir-4**: Time Server Foundation
5. **eavir-5**: Chrony Time Accuracy
6. **eavir-6**: Tile Server Integration
7. **eavir-7**: Advanced Chrony Analytics
8. **eavir-8**: Global Analysis

### Testing Strategy

#### Per-Story Testing
- **Story 1-2**: Visual rendering, UI components, performance
- **Story 3**: Lighting accuracy, time synchronization, visual time representation
- **Story 4-5**: Time accuracy indicators, sync status display
- **Story 6**: Enhanced visuals without breaking core functionality
- **Story 7-8**: Analytics and reporting features

#### Regression Testing
Before merging any story:
- Verify all previous story functionality still works
- Check for performance degradation
- Ensure time display accuracy maintained
- Validate lighting system integrity

### Code Quality Standards

#### Required Elements
- Clear, commented code
- Error handling for WebGL and time operations
- Responsive design for time display
- Performance optimization (60 FPS target)
- Browser compatibility (Chrome 56+, Firefox 51+, Safari 10+)

#### Prohibited Actions
- Never merge without testing
- Never break existing time display functionality
- Never introduce console errors
- Never compromise lighting accuracy (stories 3+)
- Never skip visual verification

### MCP Puppeteer Integration

Use these commands for testing:
- `mcp__puppeteer__puppeteer_navigate`: Navigate to localhost:3000
- `mcp__puppeteer__puppeteer_screenshot`: Capture visual state
- `mcp__puppeteer__puppeteer_evaluate`: Execute test scripts
- `mcp__puppeteer__puppeteer_click`: Test UI interactions

### Success Metrics

Each story must deliver:
1. **Functional**: All acceptance criteria met
2. **Visual**: Earth renders correctly with expected changes
3. **Performance**: 60 FPS maintained
4. **Time Accuracy**: Time display and lighting work correctly
5. **Quality**: No errors, clean code, proper testing

This workflow ensures each story builds incrementally toward the goal of accurate time visualization through Earth lighting while maintaining high code quality and thorough testing.