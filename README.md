# Earth View - WebGL Earth Simulator

A real-time 3D Earth simulator running in the browser using WebGL. Features realistic Earth rendering with day/night cycles, atmospheric effects, cloud layers, and city lights.

## Features

- **Realistic Earth Rendering**: High-resolution Earth textures with bump mapping
- **Day/Night Cycle**: Automatic day/night transitions with city lights
- **Atmospheric Effects**: Realistic atmosphere scattering and glow
- **Cloud Layer**: Animated cloud cover with transparency
- **Interactive Controls**: Mouse controls for rotation and zoom
- **Real-time Performance**: 60 FPS WebGL rendering
- **Customizable**: Adjustable rotation speed, zoom, and visual effects

## Live Demo

🌍 **[View Live Demo](https://lakowske.github.io/earth-view/)**

## Getting Started

### Prerequisites

- Modern web browser with WebGL support
- Local web server (for development)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/lakowske/earth-view.git
cd earth-view
```

2. Start a local web server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to `http://localhost:8000`

## Controls

- **Mouse Drag**: Rotate the Earth
- **Mouse Wheel**: Zoom in/out
- **Control Panel**: Adjust rotation speed, zoom level, and visual effects

## Project Structure

```
earth-view/
├── index.html          # Main HTML file
├── js/
│   ├── main.js          # Application entry point
│   ├── earth-renderer.js # WebGL Earth rendering engine
│   └── gl-matrix.min.js  # Matrix math library
├── css/
│   └── styles.css       # Additional styles
├── assets/
│   └── textures/        # Earth texture maps
│       ├── earth-day.jpg
│       ├── earth-night.jpg
│       ├── earth-clouds.jpg
│       └── earth-bump.jpg
└── README.md
```

## Development

### Building from Source

The project uses vanilla JavaScript and WebGL - no build process required. Simply edit the files and refresh your browser.

### Adding New Features

1. **New Visual Effects**: Modify `js/earth-renderer.js`
2. **UI Controls**: Update `index.html` and `js/main.js`
3. **Textures**: Add new texture maps to `assets/textures/`

### Texture Requirements

- **Earth Day**: Color map of Earth's surface (2048x1024 recommended)
- **Earth Night**: City lights/night view (same resolution)
- **Earth Clouds**: Cloud cover with alpha channel (same resolution)
- **Earth Bump**: Height/normal map for surface detail (same resolution)

## Technology Stack

- **WebGL**: 3D graphics rendering
- **JavaScript ES6**: Modern JavaScript features
- **gl-matrix**: Matrix and vector math library
- **HTML5 Canvas**: WebGL context

## Performance Optimization

- Efficient sphere tessellation (configurable detail levels)
- Texture compression support
- Frustum culling for large datasets
- Optimized shader programs
- 60 FPS target on modern hardware

## Browser Compatibility

- Chrome 56+
- Firefox 51+
- Safari 10+
- Edge 79+

WebGL 1.0 minimum, WebGL 2.0 preferred for enhanced features.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] **Phase 1**: Basic Earth rendering with textures
- [ ] **Phase 2**: Day/night cycle and city lights
- [ ] **Phase 3**: Atmospheric scattering
- [ ] **Phase 4**: Animated cloud layer
- [ ] **Phase 5**: Satellite tracking
- [ ] **Phase 6**: Weather data integration
- [ ] **Phase 7**: Real-time lighting from sun position

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- NASA for Earth texture resources
- WebGL community for tutorials and examples
- gl-matrix library contributors

## Resources

- [WebGL Fundamentals](https://webglfundamentals.org/)
- [NASA Visible Earth](https://visibleearth.nasa.gov/)
- [Three.js Earth Examples](https://threejs.org/examples/)

---

**Created with ❤️ and WebGL**