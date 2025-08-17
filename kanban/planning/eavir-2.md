# Story: eavir-2 - Implement Real NASA Earth Textures

## Overview
Replace procedural textures with high-resolution NASA Earth texture maps to display accurate landmasses, oceans, city lights, and cloud patterns.

## Acceptance Criteria
- [ ] Download and integrate NASA Blue Marble Earth day texture
- [ ] Download and integrate NASA Earth night lights texture  
- [ ] Download and integrate realistic cloud texture maps
- [ ] Implement texture loading from image files (replace procedural generation)
- [ ] Add texture loading progress indicators
- [ ] Optimize texture resolution for web performance
- [ ] Ensure proper UV mapping shows correct geographic features
- [ ] Add fallback to procedural textures if image loading fails

## Technical Details

### NASA Texture Sources
- **Day Texture**: NASA Blue Marble (2048x1024 or 4096x2048)
- **Night Texture**: NASA Earth at Night - city lights data
- **Cloud Texture**: Real satellite cloud imagery with alpha channel
- **Bump/Normal**: Optional topographical height data

### Implementation Requirements
- Replace `createProceduralTexture()` with `loadImageTexture()`
- Add async texture loading with proper error handling
- Implement texture loading progress bar
- Support multiple texture resolutions (1024x512, 2048x1024, 4096x2048)
- Add texture compression for better performance
- Cache loaded textures to avoid re-downloading

### Geographic Accuracy Validation
- [ ] Africa continent visible in correct position
- [ ] North/South America continents properly positioned
- [ ] Europe and Asia landmasses accurate
- [ ] Australia and major islands visible
- [ ] Antarctica at south pole
- [ ] Major cities show up as night lights (New York, Tokyo, London, etc.)

### Performance Considerations
- Texture size vs loading time trade-offs
- WebGL texture memory limits
- Progressive loading (low-res → high-res)
- Texture compression (DXT, ETC, etc.) if supported

## Assets Needed

### Primary Textures (Required)
1. **earth-day.jpg** (2048x1024) - NASA Blue Marble day view
2. **earth-night.jpg** (2048x1024) - NASA night lights
3. **earth-clouds.jpg** (2048x1024) - Satellite cloud data with transparency

### Optional Enhancements  
4. **earth-bump.jpg** (2048x1024) - Topographical height map
5. **earth-specular.jpg** (2048x1024) - Ocean reflectivity map

### Asset Sources
- NASA Visible Earth: https://visibleearth.nasa.gov/
- NASA Blue Marble: https://visibleearth.nasa.gov/collection/1484/blue-marble
- Earth at Night: https://visibleearth.nasa.gov/collection/1657/earth-at-night
- Free alternatives: Natural Earth, OpenStreetMap data

## Implementation Plan

### Phase 1: Basic Image Loading
```javascript
async loadImageTexture(url, fallbackGenerator) {
    try {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = url;
        });
        return this.createWebGLTexture(image);
    } catch (error) {
        console.warn(`Failed to load texture: ${url}, using fallback`);
        return fallbackGenerator();
    }
}
```

### Phase 2: Progress Loading
- Add loading bar for each texture
- Show texture names during loading
- Handle loading failures gracefully

### Phase 3: Geographic Validation
- Add overlay with country borders for validation
- Test UV mapping by identifying known landmarks
- Verify night lights match major population centers

## Definition of Done
- [ ] Earth displays accurate continents and oceans
- [ ] Night mode shows realistic city light patterns
- [ ] Cloud layer shows believable weather patterns  
- [ ] No more colored blobs - recognizable Earth geography
- [ ] All major continents identifiable in correct positions
- [ ] Loading is smooth with progress indication
- [ ] Fallback works if textures fail to load
- [ ] Performance remains at 60 FPS with new textures

## Geographic Landmarks to Verify
- [ ] **Africa**: Sahara Desert, Nile River, Madagascar
- [ ] **North America**: Great Lakes, Florida, California coastline
- [ ] **South America**: Amazon rainforest, Andes mountains
- [ ] **Europe**: Mediterranean Sea, Scandinavia, British Isles
- [ ] **Asia**: India, China, Japan islands, Middle East
- [ ] **Australia**: Continent shape and surrounding islands
- [ ] **Night Lights**: Major cities (NYC, LA, London, Tokyo, Delhi, etc.)

## Next Stories (Dependencies)
- **eavir-3**: Real-time sun position and lighting
- **eavir-4**: Seasonal changes and orbital mechanics  
- **eavir-5**: Atmospheric scattering improvements
- **eavir-6**: Real-time weather data integration

## Notes
- Consider using CDN for texture hosting to improve loading speed
- Implement multiple resolution options for different device capabilities
- Add texture quality settings in UI controls
- Document texture attribution requirements for NASA data