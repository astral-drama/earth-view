class EarthRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;

        this.program = null;
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;

        this.dayTexture = null;
        this.nightTexture = null;
        this.cloudTexture = null;

        // Texture loading state
        this.texturesLoaded = false;
        this.loadingProgress = { day: 0, night: 0, clouds: 0 };
        this.useProceduralFallback = false;

        // Real-time sun position and Earth rotation
        this.realTimeMode = true;
        this.currentDate = new Date();
        this.earthRotation = 0; // Real-time Earth rotation (separate from user view)
        this.userRotation = { x: 0, y: 0 }; // User camera rotation (separate from Earth)

        // Use glMatrix API
        this.mat4 = glMatrix.mat4;
        this.mat3 = glMatrix.mat3;
        this.vec3 = glMatrix.vec3;

        this.modelMatrix = this.mat4.create();
        this.viewMatrix = this.mat4.create();
        this.projectionMatrix = this.mat4.create();

        this.zoom = 3.0;
        this.rotationSpeed = 0.5;

        this.settings = {
            atmosphere: true,
            clouds: true,
            nightLights: true
        };

        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };

        this.sphereData = null;

        this.setupEventListeners();
        // Don't call init() in constructor - main.js will call it async
    }

    async init() {
        this.initGL();
        this.initShaders();
        this.initGeometry();
        this.initProceduralTextures(); // Create fallback textures first
        await this.initTextures(); // Load NASA textures async
        this.initMatrices();

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }

    initGL() {
        try {
            this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
        } catch (error) {
            console.error('WebGL initialization failed:', error);
            throw error;
        }
    }

    initShaders() {
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            attribute vec2 aUV;

            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat3 uNormalMatrix;

            varying vec3 vNormal;
            varying vec2 vUV;
            varying vec3 vPosition;

            void main() {
                vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
                gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

                vNormal = normalize(uNormalMatrix * aNormal);
                vUV = aUV;
                vPosition = worldPosition.xyz;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;

            uniform sampler2D uDayTexture;
            uniform sampler2D uNightTexture;
            uniform sampler2D uCloudTexture;

            uniform bool uShowAtmosphere;
            uniform bool uShowClouds;
            uniform bool uShowNightLights;

            uniform vec3 uSunDirection;
            uniform float uTime;

            varying vec3 vNormal;
            varying vec2 vUV;
            varying vec3 vPosition;

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 sunDir = normalize(uSunDirection);

                float sunDot = dot(normal, sunDir);
                float dayFactor = max(0.0, sunDot);
                float nightFactor = max(0.0, -sunDot);

                vec3 dayColor = texture2D(uDayTexture, vUV).rgb;
                vec3 nightColor = texture2D(uNightTexture, vUV).rgb;

                // Create clear day/night separation with smooth terminator
                vec3 color;

                // Sharp day/night boundary
                float threshold = 0.0;
                if (sunDot > threshold) {
                    // Daylight side - full day texture brightness
                    float lightIntensity = smoothstep(0.0, 0.3, sunDot);
                    color = dayColor * lightIntensity;
                } else {
                    // Night side - dark with city lights
                    color = dayColor * 0.05; // Very dark base

                    if (uShowNightLights) {
                        float nightIntensity = smoothstep(0.0, -0.3, sunDot);
                        color += nightColor * nightIntensity;
                    }
                }

                if (uShowClouds) {
                    vec4 cloudColor = texture2D(uCloudTexture, vUV);
                    if (sunDot > 0.0) {
                        // Bright clouds on day side
                        color = mix(color, vec3(1.0), cloudColor.a * 0.7);
                    } else {
                        // Darker clouds on night side
                        color = mix(color, vec3(0.3), cloudColor.a * 0.3);
                    }
                }

                if (uShowAtmosphere) {
                    float atmosFactor = 1.0 - abs(dot(normal, normalize(vPosition)));
                    if (sunDot > 0.0) {
                        color += vec3(0.3, 0.6, 1.0) * atmosFactor * atmosFactor * 0.3;
                    }
                }

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            throw new Error('Shader program linking failed: ' + this.gl.getProgramInfoLog(this.program));
        }

        this.gl.useProgram(this.program);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Shader compilation failed: ' + error);
        }

        return shader;
    }

    initGeometry() {
        const latBands = 32;
        const lonBands = 32;

        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        for (let lat = 0; lat <= latBands; lat++) {
            const theta = lat * Math.PI / latBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= lonBands; lon++) {
                const phi = lon * 2 * Math.PI / lonBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                vertices.push(x, y, z);
                normals.push(x, y, z);
                uvs.push(1.0 - (lon / lonBands), lat / latBands);
            }
        }

        for (let lat = 0; lat < latBands; lat++) {
            for (let lon = 0; lon < lonBands; lon++) {
                const first = lat * (lonBands + 1) + lon;
                const second = first + lonBands + 1;

                indices.push(first, first + 1, second);
                indices.push(second, first + 1, second + 1);
            }
        }

        this.sphereData = {
            vertexCount: indices.length
        };

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

        this.uvBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(uvs), this.gl.STATIC_DRAW);

        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
    }

    initProceduralTextures() {
        this.dayTexture = this.createProceduralTexture(this.generateDayTexture.bind(this));
        this.nightTexture = this.createProceduralTexture(this.generateNightTexture.bind(this));
        this.cloudTexture = this.createProceduralTexture(this.generateCloudTexture.bind(this));
    }

    async initTextures() {
        try {
            this.updateLoadingProgress('day', 0);
            this.updateLoadingProgress('night', 0);
            this.updateLoadingProgress('clouds', 0);

            // Load NASA textures in parallel
            const promises = [
                this.loadImageTexture('textures/earth-day.jpg', 'day'),
                this.loadImageTexture('textures/earth-night.jpg', 'night'),
                this.loadImageTexture('textures/earth-clouds.jpg', 'clouds')
            ];

            const [dayTexture, nightTexture, cloudTexture] = await Promise.all(promises);

            // Replace procedural textures with NASA textures
            if (dayTexture) {
                this.gl.deleteTexture(this.dayTexture);
                this.dayTexture = dayTexture;
            }
            if (nightTexture) {
                this.gl.deleteTexture(this.nightTexture);
                this.nightTexture = nightTexture;
            }
            if (cloudTexture) {
                this.gl.deleteTexture(this.cloudTexture);
                this.cloudTexture = cloudTexture;
            }

            this.texturesLoaded = true;
            console.log('NASA Earth textures loaded successfully');
        } catch (error) {
            console.warn('Failed to load NASA textures, using procedural fallback:', error);
            this.useProceduralFallback = true;
        }
    }

    createProceduralTexture(generator) {
        const texture = this.gl.createTexture();
        const size = 256;
        const data = generator(size);

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, size, size, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        return texture;
    }

    async loadImageTexture(url, type) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';

            image.onload = () => {
                try {
                    const texture = this.gl.createTexture();
                    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

                    // Upload the image to WebGL
                    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, image);

                    // Set texture parameters for proper mapping
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

                    this.updateLoadingProgress(type, 100);
                    console.log(`${type} texture loaded: ${image.width}x${image.height}`);
                    resolve(texture);
                } catch (error) {
                    console.error(`Failed to create ${type} texture:`, error);
                    reject(error);
                }
            };

            image.onerror = () => {
                console.error(`Failed to load ${type} texture from ${url}`);
                reject(new Error(`Failed to load ${type} texture`));
            };

            image.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    this.updateLoadingProgress(type, progress);
                }
            };

            image.src = url;
        });
    }

    updateLoadingProgress(type, progress) {
        this.loadingProgress[type] = progress;

        // Dispatch custom event for UI updates
        const event = new CustomEvent('textureLoadProgress', {
            detail: {
                type,
                progress,
                totalProgress: (this.loadingProgress.day + this.loadingProgress.night + this.loadingProgress.clouds) / 3
            }
        });
        window.dispatchEvent(event);
    }

    calculateSunPosition(date = new Date()) {
        // Use fixed sun position - sun stays at (1, 0, 0) pointing from +X direction
        // Earth rotation will create the day/night cycle
        // This is simpler and more intuitive than moving the sun
        const sunDirection = [1, 0, 0]; // Fixed sun from positive X direction

        return sunDirection;
    }

    calculateEarthRotation(date = new Date()) {
        // Calculate real-time Earth rotation relative to fixed sun
        const utcHours = date.getUTCHours();
        const utcMinutes = date.getUTCMinutes();
        const utcSeconds = date.getUTCSeconds();

        // At 12:00 UTC, longitude 0° (Greenwich) should face the sun (+X direction)
        // At other times, Earth should rotate so the correct longitude faces the sun
        const timeInHours = utcHours + utcMinutes / 60 + utcSeconds / 3600;

        // Calculate how much to rotate Earth so correct longitude faces sun
        // At 12:00 UTC (noon), longitude 0° faces sun, so rotation = 0
        // At 13:00 UTC, longitude 15°W should face sun, so rotate Earth +15°
        // At 00:00 UTC, longitude 180° should face sun, so rotate Earth +180°
        const sunLongitudeDeg = (timeInHours - 12) * 15;
        const earthRotationDeg = sunLongitudeDeg + 180; // Add 180° to flip day/night sides

        console.log(`Time: ${timeInHours.toFixed(2)}h UTC, Sun longitude: ${sunLongitudeDeg.toFixed(1)}°, Earth rotation: ${earthRotationDeg.toFixed(1)}°`);

        // Convert to radians and return
        return earthRotationDeg * Math.PI / 180;
    }

    generateDayTexture(size) {
        const data = new Uint8Array(size * size * 4);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                const lat = (y / size - 0.5) * Math.PI;
                const lon = (x / size - 0.5) * 2 * Math.PI;

                const noise = this.noise(x * 0.02, y * 0.02) * 0.5 + 0.5;
                const isLand = noise > 0.45;

                if (isLand) {
                    data[idx] = 34 + noise * 100;     // R - brown/green land
                    data[idx + 1] = 139 + noise * 80; // G
                    data[idx + 2] = 34 + noise * 50;  // B
                } else {
                    data[idx] = 30;      // R - blue ocean
                    data[idx + 1] = 144; // G
                    data[idx + 2] = 255; // B
                }
                data[idx + 3] = 255; // A
            }
        }

        return data;
    }

    generateNightTexture(size) {
        const data = new Uint8Array(size * size * 4);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                const noise = this.noise(x * 0.05, y * 0.05) * 0.5 + 0.5;
                const cityLight = noise > 0.7 ? 255 : 0;

                data[idx] = cityLight;     // R - yellow city lights
                data[idx + 1] = cityLight; // G
                data[idx + 2] = 0;         // B
                data[idx + 3] = 255;       // A
            }
        }

        return data;
    }

    generateCloudTexture(size) {
        const data = new Uint8Array(size * size * 4);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                const noise1 = this.noise(x * 0.01, y * 0.01) * 0.5 + 0.5;
                const noise2 = this.noise(x * 0.02, y * 0.02) * 0.3 + 0.3;
                const cloudDensity = Math.max(0, (noise1 + noise2 - 0.8) * 5);

                data[idx] = 255;                              // R - white clouds
                data[idx + 1] = 255;                          // G
                data[idx + 2] = 255;                          // B
                data[idx + 3] = Math.min(255, cloudDensity * 255); // A - cloud alpha
            }
        }

        return data;
    }

    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    initMatrices() {
        this.mat4.identity(this.modelMatrix);
        this.mat4.identity(this.viewMatrix);

        this.mat4.lookAt(this.viewMatrix, [0, 0, this.zoom], [0, 0, 0], [0, 1, 0]);

        const aspect = this.canvas.width / this.canvas.height;
        this.mat4.perspective(this.projectionMatrix, Math.PI / 4, aspect, 0.1, 100.0);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMousePos.x;
                const deltaY = e.clientY - this.lastMousePos.y;

                this.userRotation.y -= deltaX * 0.01;
                this.userRotation.x -= deltaY * 0.01;

                this.userRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.userRotation.x));

                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom += e.deltaY * 0.01;
            this.zoom = Math.max(1.5, Math.min(10, this.zoom));
        });
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        const aspect = this.canvas.width / this.canvas.height;
        this.mat4.perspective(this.projectionMatrix, Math.PI / 4, aspect, 0.1, 100.0);
    }

    render(time) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.useProgram(this.program);

        // Update current time for real-time calculations
        if (this.realTimeMode) {
            this.currentDate = new Date();
        }

        // Calculate real-time sun position (fixed in world space)
        const sunDirection = this.calculateSunPosition(this.currentDate);

        // Calculate real-time Earth rotation
        this.earthRotation = this.calculateEarthRotation(this.currentDate);

        // Set up Earth transformation matrix (Earth rotates relative to fixed sun)
        this.mat4.identity(this.modelMatrix);

        // Apply real-time Earth rotation (slow rotation relative to sun)
        this.mat4.rotateY(this.modelMatrix, this.modelMatrix, this.earthRotation);

        // Set up view matrix (camera rotates around Earth)
        this.mat4.identity(this.viewMatrix);

        // Calculate camera position based on user rotation
        const cameraDistance = this.zoom;
        const cameraX = cameraDistance * Math.sin(this.userRotation.y) * Math.cos(this.userRotation.x);
        const cameraY = cameraDistance * Math.sin(this.userRotation.x);
        const cameraZ = cameraDistance * Math.cos(this.userRotation.y) * Math.cos(this.userRotation.x);

        this.mat4.lookAt(this.viewMatrix, [cameraX, cameraY, cameraZ], [0, 0, 0], [0, 1, 0]);

        // Calculate normal matrix for lighting
        const normalMatrix = this.mat3.create();
        this.mat3.normalFromMat4(normalMatrix, this.modelMatrix);

        this.setUniforms(normalMatrix, sunDirection, time);
        this.bindAttributes();
        this.bindTextures();

        this.gl.drawElements(this.gl.TRIANGLES, this.sphereData.vertexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    setUniforms(normalMatrix, sunDirection, time) {
        const uModelMatrix = this.gl.getUniformLocation(this.program, 'uModelMatrix');
        const uViewMatrix = this.gl.getUniformLocation(this.program, 'uViewMatrix');
        const uProjectionMatrix = this.gl.getUniformLocation(this.program, 'uProjectionMatrix');
        const uNormalMatrix = this.gl.getUniformLocation(this.program, 'uNormalMatrix');
        const uSunDirection = this.gl.getUniformLocation(this.program, 'uSunDirection');
        const uTime = this.gl.getUniformLocation(this.program, 'uTime');

        this.gl.uniformMatrix4fv(uModelMatrix, false, this.modelMatrix);
        this.gl.uniformMatrix4fv(uViewMatrix, false, this.viewMatrix);
        this.gl.uniformMatrix4fv(uProjectionMatrix, false, this.projectionMatrix);
        this.gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
        this.gl.uniform3fv(uSunDirection, sunDirection);
        this.gl.uniform1f(uTime, time);

        const uShowAtmosphere = this.gl.getUniformLocation(this.program, 'uShowAtmosphere');
        const uShowClouds = this.gl.getUniformLocation(this.program, 'uShowClouds');
        const uShowNightLights = this.gl.getUniformLocation(this.program, 'uShowNightLights');

        this.gl.uniform1i(uShowAtmosphere, this.settings.atmosphere);
        this.gl.uniform1i(uShowClouds, this.settings.clouds);
        this.gl.uniform1i(uShowNightLights, this.settings.nightLights);
    }

    bindAttributes() {
        const aPosition = this.gl.getAttribLocation(this.program, 'aPosition');
        const aNormal = this.gl.getAttribLocation(this.program, 'aNormal');
        const aUV = this.gl.getAttribLocation(this.program, 'aUV');

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(aPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.vertexAttribPointer(aNormal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(aNormal);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
        this.gl.vertexAttribPointer(aUV, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(aUV);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }

    bindTextures() {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.dayTexture);
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'uDayTexture'), 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.nightTexture);
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'uNightTexture'), 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.cloudTexture);
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'uCloudTexture'), 2);
    }

    updateSettings(settings) {
        Object.assign(this.settings, settings);
    }

    updateZoom(zoom) {
        this.zoom = Math.max(1.5, Math.min(10, zoom));
    }

    updateRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }
}