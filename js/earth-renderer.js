/**
 * Earth Renderer - WebGL Earth Rendering Engine
 * Handles all WebGL rendering for the Earth simulator
 */

class EarthRenderer {
    constructor(gl) {
        this.gl = gl;
        
        // Rendering state
        this.shaderProgram = null;
        this.earthGeometry = null;
        this.textures = {};
        
        // Camera and controls
        this.camera = {
            position: [0, 0, 3],
            rotation: [0, 0],
            zoom: 3.0,
            target: [0, 0, 0]
        };
        
        // Earth state
        this.earth = {
            rotation: [0, 0],
            rotationSpeed: 0.5,
            scale: 1.0
        };
        
        // Feature toggles
        this.features = {
            atmosphere: true,
            clouds: true,
            nightLights: true
        };
        
        // Matrices
        this.matrices = {
            model: mat4.create(),
            view: mat4.create(),
            projection: mat4.create(),
            mvp: mat4.create()
        };
        
        this.aspectRatio = 1.0;
    }
    
    async init() {
        try {
            await this.loadShaders();
            this.createGeometry();
            await this.loadTextures();
            this.setupUniforms();
            
            // Initialize projection matrix
            this.updateProjection(this.aspectRatio);
            
            console.log('Earth renderer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Earth renderer:', error);
            throw error;
        }
    }
    
    async loadShaders() {
        const vertexShaderSource = `
            attribute vec3 a_position;
            attribute vec3 a_normal;
            attribute vec2 a_texCoord;
            
            uniform mat4 u_mvpMatrix;
            uniform mat4 u_modelMatrix;
            uniform mat4 u_normalMatrix;
            uniform vec3 u_lightDirection;
            uniform float u_time;
            
            varying vec2 v_texCoord;
            varying vec3 v_normal;
            varying vec3 v_worldPos;
            varying float v_lightIntensity;
            
            void main() {
                gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
                
                v_texCoord = a_texCoord;
                v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);
                v_worldPos = (u_modelMatrix * vec4(a_position, 1.0)).xyz;
                
                // Simple directional lighting
                v_lightIntensity = max(dot(v_normal, -u_lightDirection), 0.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform sampler2D u_earthDay;
            uniform sampler2D u_earthNight;
            uniform sampler2D u_earthClouds;
            uniform vec3 u_lightDirection;
            uniform float u_time;
            uniform bool u_showAtmosphere;
            uniform bool u_showClouds;
            uniform bool u_showNightLights;
            
            varying vec2 v_texCoord;
            varying vec3 v_normal;
            varying vec3 v_worldPos;
            varying float v_lightIntensity;
            
            void main() {
                // Sample textures
                vec3 dayColor = texture2D(u_earthDay, v_texCoord).rgb;
                vec3 nightColor = texture2D(u_earthNight, v_texCoord).rgb;
                vec4 cloudsColor = texture2D(u_earthClouds, v_texCoord);
                
                // Mix day and night based on lighting
                vec3 earthColor = mix(
                    u_showNightLights ? nightColor * 2.0 : vec3(0.0),
                    dayColor,
                    v_lightIntensity
                );
                
                // Add clouds
                if (u_showClouds) {
                    // Animate clouds slightly
                    vec2 cloudCoord = v_texCoord + vec2(u_time * 0.00001, 0.0);
                    vec4 animatedClouds = texture2D(u_earthClouds, cloudCoord);
                    earthColor = mix(earthColor, vec3(1.0), animatedClouds.a * 0.7);
                }
                
                // Simple atmosphere effect
                if (u_showAtmosphere) {
                    vec3 viewDir = normalize(v_worldPos);
                    float fresnel = 1.0 - abs(dot(viewDir, v_normal));
                    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0) * fresnel * 0.3;
                    earthColor += atmosphereColor;
                }
                
                gl_FragColor = vec4(earthColor, 1.0);
            }
        `;
        
        this.shaderProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }
    
    createShaderProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Shader program linking failed: ' + this.gl.getProgramInfoLog(program));
        }
        
        return program;
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error('Shader compilation failed: ' + this.gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }
    
    createGeometry() {
        // Create sphere geometry
        const radius = 1.0;
        const latBands = 32;
        const lonBands = 32;
        
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const indices = [];
        
        // Generate vertices
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
                
                vertices.push(radius * x, radius * y, radius * z);
                normals.push(x, y, z);
                texCoords.push(lon / lonBands, lat / latBands);
            }
        }
        
        // Generate indices
        for (let lat = 0; lat < latBands; lat++) {
            for (let lon = 0; lon < lonBands; lon++) {
                const first = lat * (lonBands + 1) + lon;
                const second = first + lonBands + 1;
                
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
        
        // Create buffers
        this.earthGeometry = {
            vertices: this.createBuffer(new Float32Array(vertices)),
            normals: this.createBuffer(new Float32Array(normals)),
            texCoords: this.createBuffer(new Float32Array(texCoords)),
            indices: this.createIndexBuffer(new Uint16Array(indices)),
            indexCount: indices.length
        };
    }
    
    createBuffer(data) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        return buffer;
    }
    
    createIndexBuffer(data) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        return buffer;
    }
    
    async loadTextures() {
        // For now, create simple procedural textures
        // In a real implementation, you'd load actual Earth texture files
        
        this.textures.earthDay = this.createProceduralTexture('day');
        this.textures.earthNight = this.createProceduralTexture('night');
        this.textures.earthClouds = this.createProceduralTexture('clouds');
        
        console.log('Textures loaded (procedural)');
    }
    
    createProceduralTexture(type) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create different textures based on type
        if (type === 'day') {
            // Blue/green earth-like pattern
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#4169E1');
            gradient.addColorStop(0.3, '#228B22');
            gradient.addColorStop(0.6, '#8B4513');
            gradient.addColorStop(1, '#4169E1');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            
            // Add some random landmass-like patterns
            ctx.fillStyle = '#228B22';
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 20 + 10;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'night') {
            // Dark with yellow city lights
            ctx.fillStyle = '#000033';
            ctx.fillRect(0, 0, size, size);
            
            // Add city lights
            ctx.fillStyle = '#FFFF00';
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 2 + 1;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'clouds') {
            // White clouds with alpha
            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random();
                const alpha = noise > 0.7 ? (noise - 0.7) * 3 : 0;
                
                data[i] = 255;     // Red
                data[i + 1] = 255; // Green
                data[i + 2] = 255; // Blue
                data[i + 3] = alpha * 255; // Alpha
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
        
        // Create WebGL texture
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        
        return texture;
    }
    
    setupUniforms() {
        this.uniforms = {
            mvpMatrix: this.gl.getUniformLocation(this.shaderProgram, 'u_mvpMatrix'),
            modelMatrix: this.gl.getUniformLocation(this.shaderProgram, 'u_modelMatrix'),
            normalMatrix: this.gl.getUniformLocation(this.shaderProgram, 'u_normalMatrix'),
            lightDirection: this.gl.getUniformLocation(this.shaderProgram, 'u_lightDirection'),
            time: this.gl.getUniformLocation(this.shaderProgram, 'u_time'),
            earthDay: this.gl.getUniformLocation(this.shaderProgram, 'u_earthDay'),
            earthNight: this.gl.getUniformLocation(this.shaderProgram, 'u_earthNight'),
            earthClouds: this.gl.getUniformLocation(this.shaderProgram, 'u_earthClouds'),
            showAtmosphere: this.gl.getUniformLocation(this.shaderProgram, 'u_showAtmosphere'),
            showClouds: this.gl.getUniformLocation(this.shaderProgram, 'u_showClouds'),
            showNightLights: this.gl.getUniformLocation(this.shaderProgram, 'u_showNightLights')
        };
        
        this.attributes = {
            position: this.gl.getAttribLocation(this.shaderProgram, 'a_position'),
            normal: this.gl.getAttribLocation(this.shaderProgram, 'a_normal'),
            texCoord: this.gl.getAttribLocation(this.shaderProgram, 'a_texCoord')
        };
    }
    
    render(time) {
        // Update Earth rotation
        this.earth.rotation[1] += this.earth.rotationSpeed * 0.01;
        
        // Update matrices
        this.updateMatrices();
        
        // Use shader program
        this.gl.useProgram(this.shaderProgram);
        
        // Set uniforms
        this.gl.uniformMatrix4fv(this.uniforms.mvpMatrix, false, this.matrices.mvp);
        this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, this.matrices.model);
        this.gl.uniformMatrix4fv(this.uniforms.normalMatrix, false, this.matrices.model);
        this.gl.uniform3fv(this.uniforms.lightDirection, [0.5, 0.5, 0.5]);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform1i(this.uniforms.showAtmosphere, this.features.atmosphere);
        this.gl.uniform1i(this.uniforms.showClouds, this.features.clouds);
        this.gl.uniform1i(this.uniforms.showNightLights, this.features.nightLights);
        
        // Bind textures
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.earthDay);
        this.gl.uniform1i(this.uniforms.earthDay, 0);
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.earthNight);
        this.gl.uniform1i(this.uniforms.earthNight, 1);
        
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.earthClouds);
        this.gl.uniform1i(this.uniforms.earthClouds, 2);
        
        // Set vertex attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.earthGeometry.vertices);
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.vertexAttribPointer(this.attributes.position, 3, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.earthGeometry.normals);
        this.gl.enableVertexAttribArray(this.attributes.normal);
        this.gl.vertexAttribPointer(this.attributes.normal, 3, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.earthGeometry.texCoords);
        this.gl.enableVertexAttribArray(this.attributes.texCoord);
        this.gl.vertexAttribPointer(this.attributes.texCoord, 2, this.gl.FLOAT, false, 0, 0);
        
        // Draw
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.earthGeometry.indices);
        this.gl.drawElements(this.gl.TRIANGLES, this.earthGeometry.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    
    updateMatrices() {
        // Model matrix (Earth rotation)
        mat4.identity(this.matrices.model);
        mat4.rotateY(this.matrices.model, this.matrices.model, this.earth.rotation[1]);
        mat4.rotateX(this.matrices.model, this.matrices.model, this.earth.rotation[0]);
        mat4.scale(this.matrices.model, this.matrices.model, [this.earth.scale, this.earth.scale, this.earth.scale]);
        
        // View matrix (camera)
        mat4.identity(this.matrices.view);
        mat4.translate(this.matrices.view, this.matrices.view, [0, 0, -this.camera.zoom]);
        mat4.rotateX(this.matrices.view, this.matrices.view, this.camera.rotation[1]);
        mat4.rotateY(this.matrices.view, this.matrices.view, this.camera.rotation[0]);
        
        // Combined MVP matrix
        mat4.multiply(this.matrices.mvp, this.matrices.projection, this.matrices.view);
        mat4.multiply(this.matrices.mvp, this.matrices.mvp, this.matrices.model);
    }
    
    updateProjection(aspectRatio) {
        this.aspectRatio = aspectRatio;
        mat4.perspective(this.matrices.projection, Math.PI / 4, aspectRatio, 0.1, 100.0);
    }
    
    // Control methods
    rotate(deltaX, deltaY) {
        this.camera.rotation[0] += deltaX;
        this.camera.rotation[1] += deltaY;
        
        // Clamp vertical rotation
        this.camera.rotation[1] = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation[1]));
    }
    
    zoom(delta) {
        this.camera.zoom *= delta;
        this.camera.zoom = Math.max(1.5, Math.min(10, this.camera.zoom));
    }
    
    setRotationSpeed(speed) {
        this.earth.rotationSpeed = speed;
    }
    
    setZoom(zoom) {
        this.camera.zoom = zoom;
    }
    
    getZoom() {
        return this.camera.zoom;
    }
    
    setAtmosphereVisible(visible) {
        this.features.atmosphere = visible;
    }
    
    setCloudsVisible(visible) {
        this.features.clouds = visible;
    }
    
    setNightLightsVisible(visible) {
        this.features.nightLights = visible;
    }
}