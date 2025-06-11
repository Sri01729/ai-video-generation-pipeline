'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// Shader sources
const fragmentShader = `
precision mediump float;
uniform float time;
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
void main() {
	vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
	vec4 offset = texture2D(uDataTexture, vUv);

	// Apply displacement based on offset
	vec2 displacedUV = newUV - 0.02 * offset.rg;
	vec4 color = texture2D(uTexture, displacedUV);

	gl_FragColor = color;
}
`;

const vertexShader = `
precision mediump float;
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

interface PixelatedImageProps {
  src: string;
  alt?: string;
  className?: string;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  style?: React.CSSProperties;
}

interface MouseState {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vX: number;
  vY: number;
}

function clamp(number: number, min: number, max: number): number {
  return Math.max(min, Math.min(number, max));
}

class PixelationEffect {
  private scene: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private material: THREE.ShaderMaterial | null = null;
  private texture: THREE.DataTexture | null = null;
  private geometry!: THREE.PlaneGeometry;
  private plane!: THREE.Mesh;
  private container: HTMLElement;
  private img: HTMLImageElement;
  private width: number;
  private height: number;
  private time: number = 0;
  private mouse: MouseState;
  private size: number;
  private isPlaying: boolean = true;
  private settings: {
    grid: number;
    mouse: number;
    strength: number;
    relaxation: number;
  };
  private imageAspect: number = 1 / 1.5;
  private animationId: number | null = null;
  private cleanupListeners: (() => void) | null = null;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, img: HTMLImageElement, options: {
    grid?: number;
    mouse?: number;
    strength?: number;
    relaxation?: number;
  } = {}) {
    this.container = container;
    this.img = img;
    this.width = container.offsetWidth || 800;
    this.height = container.offsetHeight || 600;

    this.settings = {
      grid: options.grid || 34,
      mouse: options.mouse || 0.25,
      strength: options.strength || 1,
      relaxation: options.relaxation || 0.9,
    };

    this.size = this.settings.grid;

    this.mouse = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vX: 0,
      vY: 0
    };

    this.scene = new THREE.Scene();

    // Initialize WebGL renderer with better settings for Next.js
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false, // Disable for better performance in Next.js
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0);

    // Check WebGL support
    const gl = this.renderer.getContext();
    if (!gl) {
      console.error('WebGL context not available');
      this.isDestroyed = true;
      return;
    }

    // Append canvas to container
    if (container && !this.isDestroyed) {
      container.appendChild(this.renderer.domElement);
    }

    const frustumSize = 1;
    this.camera = new THREE.OrthographicCamera(
      frustumSize / -2, frustumSize / 2,
      frustumSize / 2, frustumSize / -2,
      -1000, 1000
    );
    this.camera.position.set(0, 0, 2);

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // Initialize everything
    this.init();
  }

  private init(): void {
    if (this.isDestroyed) return;

    try {
      this.regenerateGrid();
      this.addObjects();
      this.resize();
      this.setupEventListeners();
      this.render();
    } catch (error) {
      console.error('Failed to initialize PixelationEffect:', error);
      this.isDestroyed = true;
    }
  }

  private setupEventListeners(): void {
    if (this.isDestroyed) return;

    let isMouseInside = false;
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseInside || this.isDestroyed) return;

      // Cancel previous RAF to prevent buildup
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (this.isDestroyed) return;

        const rect = this.container.getBoundingClientRect();
        const newX = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const newY = clamp((e.clientY - rect.top) / rect.height, 0, 1);

        // Store previous values before updating
        this.mouse.prevX = this.mouse.x;
        this.mouse.prevY = this.mouse.y;

        // Update current position
        this.mouse.x = newX;
        this.mouse.y = newY;

        // Calculate velocity
        this.mouse.vX = this.mouse.x - this.mouse.prevX;
        this.mouse.vY = this.mouse.y - this.mouse.prevY;
      });
    };

    const handleMouseEnter = (e: MouseEvent) => {
      if (this.isDestroyed) return;

      isMouseInside = true;
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) / rect.width;
      this.mouse.y = (e.clientY - rect.top) / rect.height;
      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;
      this.mouse.vX = 0;
      this.mouse.vY = 0;
    };

    const handleMouseLeave = () => {
      if (this.isDestroyed) return;

      isMouseInside = false;
      // Gradually reduce velocity when mouse leaves
      this.mouse.vX *= 0.3;
      this.mouse.vY *= 0.3;
    };

    const handleResize = () => {
      if (this.isDestroyed) return;

      // Debounce resize
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        if (!this.isDestroyed) {
          this.resize();
        }
      }, 100);
    };

    const handleVisibilityChange = () => {
      if (this.isDestroyed) return;

      if (document.hidden) {
        this.isPlaying = false;
      } else {
        this.isPlaying = true;
        if (!this.animationId) {
          this.render();
        }
      }
    };

    // Add event listeners with proper options
    this.container.addEventListener('mousemove', handleMouseMove, { passive: true });
    this.container.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    this.container.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    this.cleanupListeners = () => {
      if (rafId) cancelAnimationFrame(rafId);
      this.container.removeEventListener('mousemove', handleMouseMove);
      this.container.removeEventListener('mouseenter', handleMouseEnter);
      this.container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  private resizeTimeout: any = null;

  private resize(): void {
    if (this.isDestroyed) return;

    const newWidth = this.container.offsetWidth || 800;
    const newHeight = this.container.offsetHeight || 600;

    // Only resize if dimensions actually changed
    if (newWidth === this.width && newHeight === this.height) return;

    this.width = newWidth;
    this.height = newHeight;

    try {
      this.renderer.setSize(this.width, this.height);

      let a1, a2;
      if (this.height / this.width > this.imageAspect) {
        a1 = (this.width / this.height) * this.imageAspect;
        a2 = 1;
      } else {
        a1 = 1;
        a2 = (this.height / this.width) / this.imageAspect;
      }

      if (this.material && this.material.uniforms.resolution) {
        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;
        this.material.uniforms.resolution.value.z = a1;
        this.material.uniforms.resolution.value.w = a2;
      }

      this.camera.updateProjectionMatrix();
    } catch (error) {
      console.error('Resize error:', error);
    }
  }

  private regenerateGrid(): void {
    if (this.isDestroyed) return;

    this.size = this.settings.grid;
    const width = this.size;
    const height = this.size;
    const size = width * height;
    const data = new Float32Array(4 * size);

    for (let i = 0; i < size; i++) {
      const r = Math.random() * 255 - 125;
      const r1 = Math.random() * 255 - 125;
      const stride = i * 4;

      data[stride] = r;
      data[stride + 1] = r1;
      data[stride + 2] = r;
      data[stride + 3] = 255;
    }

    if (this.texture) {
      this.texture.dispose();
    }

    this.texture = new THREE.DataTexture(
      data, width, height,
      THREE.RGBAFormat, THREE.FloatType
    );
    this.texture.magFilter = this.texture.minFilter = THREE.NearestFilter;
    this.texture.needsUpdate = true;

    if (this.material && this.material.uniforms.uDataTexture) {
      this.material.uniforms.uDataTexture.value = this.texture;
      this.material.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }

  private addObjects(): void {
    if (this.isDestroyed) return;

    try {
      this.regenerateGrid();

      const texture = new THREE.Texture(this.img);
      texture.needsUpdate = true;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      texture.flipY = false;

      this.material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          time: { value: 0 },
          resolution: { value: new THREE.Vector4() },
          uTexture: { value: texture },
          uDataTexture: { value: this.texture },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
      });

      this.plane = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.plane);
    } catch (error) {
      console.error('Error adding objects:', error);
      this.isDestroyed = true;
    }
  }

  private updateDataTexture(): void {
    if (!this.texture || this.isDestroyed) return;

    try {
      const data = this.texture.image.data as Float32Array;

      // Apply relaxation to existing distortions
      for (let i = 0; i < data.length; i += 4) {
        data[i] *= this.settings.relaxation;
        data[i + 1] *= this.settings.relaxation;
      }

      // Only apply mouse effects if there's significant movement
      const mouseSpeed = Math.sqrt(this.mouse.vX * this.mouse.vX + this.mouse.vY * this.mouse.vY);
      if (mouseSpeed > 0.001) {
        const gridMouseX = this.size * this.mouse.x;
        const gridMouseY = this.size * (1 - this.mouse.y);
        const maxDist = this.size * this.settings.mouse;
        const aspect = this.height / this.width;

        for (let i = 0; i < this.size; i++) {
          for (let j = 0; j < this.size; j++) {
            const distance = ((gridMouseX - i) ** 2) / aspect + (gridMouseY - j) ** 2;
            const maxDistSq = maxDist ** 2;

            if (distance < maxDistSq) {
              const index = 4 * (i + this.size * j);
              let power = maxDist / Math.sqrt(distance);
              power = clamp(power, 0, 10);

              data[index] += this.settings.strength * 100 * this.mouse.vX * power;
              data[index + 1] -= this.settings.strength * 100 * this.mouse.vY * power;
            }
          }
        }
      }

      // Dampen velocity
      this.mouse.vX *= 0.85;
      this.mouse.vY *= 0.85;
      this.texture.needsUpdate = true;
    } catch (error) {
      console.error('Error updating data texture:', error);
    }
  }

  private render = (): void => {
    if (!this.isPlaying || this.isDestroyed) return;

    try {
      this.time += 0.05;
      this.updateDataTexture();

      if (this.material && this.material.uniforms.time) {
        this.material.uniforms.time.value = this.time;
      }

      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(this.render);
    } catch (error) {
      console.error('Render error:', error);
      this.isPlaying = false;
    }
  };

  public destroy(): void {
    this.isDestroyed = true;
    this.isPlaying = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }

    try {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }

      this.renderer.dispose();
      this.geometry.dispose();

      if (this.material) {
        // Dispose material uniforms
        if (this.material.uniforms.uTexture?.value) {
          this.material.uniforms.uTexture.value.dispose();
        }
        this.material.dispose();
      }

      if (this.texture) {
        this.texture.dispose();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  public updateSettings(newSettings: Partial<typeof this.settings>): void {
    if (this.isDestroyed) return;

    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.grid && newSettings.grid !== this.size) {
      this.regenerateGrid();
    }
  }
}

const PixelatedImage: React.FC<PixelatedImageProps> = ({
  src,
  alt = '',
  className = '',
  grid = 34,
  mouse = 0.25,
  strength = 1,
  relaxation = 0.9,
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const effectRef = useRef<PixelationEffect | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mounting in Next.js
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Create effect when everything is ready
  const createEffect = useCallback(() => {
    if (!isMounted || !isLoaded || !containerRef.current || !imgRef.current || hasError) {
      return;
    }

    // Cleanup existing effect
    if (effectRef.current) {
      effectRef.current.destroy();
      effectRef.current = null;
    }

    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (!containerRef.current || !imgRef.current || effectRef.current) return;

      try {
        effectRef.current = new PixelationEffect(
          containerRef.current,
          imgRef.current,
          { grid, mouse, strength, relaxation }
        );
      } catch (error) {
        console.error('Failed to create PixelationEffect:', error);
        setHasError(true);
      }
    });
  }, [isMounted, isLoaded, hasError, grid, mouse, strength, relaxation]);

  // Initialize effect
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(createEffect, 100);
    return () => clearTimeout(timer);
  }, [createEffect]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setHasError(false);
    // Small delay to ensure image is fully rendered
    setTimeout(() => {
      setIsLoaded(true);
    }, 50);
  }, []);

  const handleImageError = useCallback(() => {
    console.warn('Failed to load image:', src);
    setHasError(true);
    setIsLoaded(false);
  }, [src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  // Handle page focus/visibility changes
  useEffect(() => {
    if (!isMounted) return;

    const handleFocus = () => {
      if (effectRef.current && isLoaded && !hasError) {
        // Recreate effect after a delay
        setTimeout(createEffect, 200);
      }
    };

    const handleBeforeUnload = () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [createEffect, isLoaded, hasError, isMounted]);

  // Don't render until mounted (Next.js SSR compatibility)
  if (!isMounted) {
    return (
      <div
        className={`pixelated-image-container ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
          ...style
        }}
      />
    );
  }

  return (
    <div
      className={`pixelated-image-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          visibility: isLoaded && !hasError ? 'hidden' : 'visible',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      {hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0f0f0',
            color: '#666',
          }}
        >
          Failed to load image
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default PixelatedImage;