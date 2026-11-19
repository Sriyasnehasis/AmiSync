/**
 * SplashCursor — WebGL fluid simulation cursor effect
 * Adapted from ReactBits (reactbits.dev/animations/splash-cursor)
 * Uses WebGL2 / WebGL1 fragment shaders for real-time fluid dynamics.
 * Brand accent: AmiSync electric violet & mint teal
 */
"use client";

import { useEffect, useRef } from "react";

function pointerPrototype() {
  return {
    id: -1, texcoordX: 0, texcoordY: 0,
    prevTexcoordX: 0, prevTexcoordY: 0,
    deltaX: 0, deltaY: 0,
    down: false, moved: false,
    color: { r: 0, g: 0, b: 0 },
  };
}

type Pointer = ReturnType<typeof pointerPrototype>;

interface FBO { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texelSizeX: number; texelSizeY: number; attach: (id: number) => number; }
interface DoubleFBO { width: number; height: number; texelSizeX: number; texelSizeY: number; read: FBO; write: FBO; swap: () => void; }

export default function SplashCursor({ SIM_RESOLUTION = 128, DYE_RESOLUTION = 1440, CAPTURE_RESOLUTION = 512, DENSITY_DISSIPATION = 3.5, VELOCITY_DISSIPATION = 2, PRESSURE = 0.1, PRESSURE_ITERATIONS = 20, CURL = 3, SPLAT_RADIUS = 0.2, SPLAT_FORCE = 6000, SHADING = true, COLOR_UPDATE_SPEED = 10, BACK_COLOR = { r: 0, g: 0, b: 0 }, TRANSPARENT = true } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Resize helper ──────────────────────────────────────────────────────
    function resizeCanvas() {
      const w = canvas!.clientWidth, h = canvas!.clientHeight;
      if (canvas!.width !== w || canvas!.height !== h) { canvas!.width = w; canvas!.height = h; }
    }
    resizeCanvas();

    // ── WebGL context ──────────────────────────────────────────────────────
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
    const isWebGL2 = !!gl;
    if (!gl) gl = (canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params)) as unknown as WebGL2RenderingContext;
    if (!gl) return;

    const halfFloat = isWebGL2 ? (gl as WebGL2RenderingContext).HALF_FLOAT : (gl.getExtension("OES_texture_half_float") as OES_texture_half_float | null)?.HALF_FLOAT_OES ?? null;
    let supportLinearFiltering = isWebGL2
      ? gl.getExtension("OES_texture_float_linear")
      : gl.getExtension("OES_texture_half_float_linear");

    gl.clearColor(0, 0, 0, 1);

    const internalFormat = isWebGL2 ? (gl as WebGL2RenderingContext).RGBA16F : gl.RGBA;
    const formatRGBA = { internalFormat, format: gl.RGBA };
    const internalFormatRG = isWebGL2 ? (gl as WebGL2RenderingContext).RG16F : gl.RGBA;
    const formatRG = { internalFormat: internalFormatRG, format: isWebGL2 ? (gl as WebGL2RenderingContext).RG : gl.RGBA };
    const internalFormatR = isWebGL2 ? (gl as WebGL2RenderingContext).R16F : gl.RGBA;
    const formatR = { internalFormat: internalFormatR, format: isWebGL2 ? (gl as WebGL2RenderingContext).RED : gl.RGBA };
    const halfFloatTexType = halfFloat ?? gl.UNSIGNED_BYTE;
    const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    // ── Shader sources ─────────────────────────────────────────────────────
    const baseVertexShaderSrc = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main(){vUv=aPosition*0.5+0.5;vL=vUv-vec2(texelSize.x,0.0);vR=vUv+vec2(texelSize.x,0.0);vT=vUv+vec2(0.0,texelSize.y);vB=vUv-vec2(0.0,texelSize.y);gl_Position=vec4(aPosition,0.0,1.0);}`;

    const copyShaderSrc = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`;

    const clearShaderSrc = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`;

    const splatShaderSrc = `
      precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;
      void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;vec3 base=texture2D(uTarget,vUv).xyz;gl_FragColor=vec4(base+splat,1.0);}`;

    const advectionShaderSrc = `
      precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform vec2 dyeTexelSize;uniform float dt;uniform float dissipation;
      vec4 bilerp(sampler2D sam,vec2 uv,vec2 tSize){vec2 st=uv/tSize-0.5;vec2 iuv=floor(st);vec2 fuv=fract(st);vec4 a=texture2D(sam,(iuv+vec2(0.5,0.5))*tSize);vec4 b=texture2D(sam,(iuv+vec2(1.5,0.5))*tSize);vec4 c=texture2D(sam,(iuv+vec2(0.5,1.5))*tSize);vec4 d=texture2D(sam,(iuv+vec2(1.5,1.5))*tSize);return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);}
      void main(){vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;gl_FragColor=dissipation*bilerp(uSource,coord,dyeTexelSize);gl_FragColor.a=1.0;}`;

    const divergenceShaderSrc = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x;float R=texture2D(uVelocity,vR).x;float T=texture2D(uVelocity,vT).y;float B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;if(vL.x<0.0){L=-C.x;}if(vR.x>1.0){R=-C.x;}if(vT.y>1.0){T=-C.y;}if(vB.y<0.0){B=-C.y;}float div=0.5*(R-L+T-B);gl_FragColor=vec4(div,0.0,0.0,1.0);}`;

    const curlShaderSrc = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y;float R=texture2D(uVelocity,vR).y;float T=texture2D(uVelocity,vT).x;float B=texture2D(uVelocity,vB).x;float vorticity=R-L-T+B;gl_FragColor=vec4(0.5*vorticity,0.0,0.0,1.0);}`;

    const vorticityShaderSrc = `precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;uniform sampler2D uCurl;uniform float curl;uniform float dt;void main(){float L=texture2D(uCurl,vL).x;float R=texture2D(uCurl,vR).x;float T=texture2D(uCurl,vT).x;float B=texture2D(uCurl,vB).x;float C=texture2D(uCurl,vUv).x;vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));force/=length(force)+0.0001;force*=curl*C;force.y*=-1.0;vec2 velocity=texture2D(uVelocity,vUv).xy;velocity+=force*dt;velocity=min(max(velocity,-1000.0),1000.0);gl_FragColor=vec4(velocity,0.0,1.0);}`;

    const pressureShaderSrc = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uDivergence;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;float C=texture2D(uPressure,vUv).x;float divergence=texture2D(uDivergence,vUv).x;float pressure=(L+R+B+T-divergence)*0.25;gl_FragColor=vec4(pressure,0.0,0.0,1.0);}`;

    const gradientSubtractShaderSrc = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uVelocity;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;vec2 velocity=texture2D(uVelocity,vUv).xy;velocity.xy-=vec2(R-L,T-B);gl_FragColor=vec4(velocity,0.0,1.0);}`;

    const displayShaderSrc = SHADING
      ? `precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform vec2 texelSize;void main(){vec3 L=texture2D(uTexture,vL).rgb;vec3 R=texture2D(uTexture,vR).rgb;vec3 T=texture2D(uTexture,vT).rgb;vec3 B=texture2D(uTexture,vB).rgb;vec3 C=texture2D(uTexture,vUv).rgb;float dx=length(R)-length(L);float dy=length(T)-length(B);vec3 n=normalize(vec3(dx,dy,length(texelSize)));vec3 l=vec3(0.0,0.0,1.0);float diffuse=clamp(dot(n,l)+0.7,0.7,1.0);C*=diffuse;gl_FragColor=vec4(C,1.0);}`
      : `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTexture;void main(){vec3 C=texture2D(uTexture,vUv).rgb;float a=max(C.r,max(C.g,C.b));gl_FragColor=vec4(C,a);}`;

    // ── Helpers ────────────────────────────────────────────────────────────
    function compileShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src); gl!.compileShader(s); return s;
    }
    function createProgram(vSrc: string, fSrc: string) {
      const prog = gl!.createProgram()!;
      gl!.attachShader(prog, compileShader(gl!.VERTEX_SHADER, vSrc));
      gl!.attachShader(prog, compileShader(gl!.FRAGMENT_SHADER, fSrc));
      gl!.linkProgram(prog);
      const locs: Record<string, WebGLUniformLocation> = {};
      const n = gl!.getProgramParameter(prog, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl!.getActiveUniform(prog, i)!;
        locs[info.name] = gl!.getUniformLocation(prog, info.name)!;
      }
      return { prog, uniforms: locs, bind() { gl!.useProgram(prog); } };
    }

    type Prog = ReturnType<typeof createProgram>;

    function uniform1i(p: Prog, n: string, v: number) { gl!.uniform1i(p.uniforms[n], v); }
    function uniform1f(p: Prog, n: string, v: number) { gl!.uniform1f(p.uniforms[n], v); }
    function uniform2f(p: Prog, n: string, x: number, y: number) { gl!.uniform2f(p.uniforms[n], x, y); }
    function uniform3f(p: Prog, n: string, x: number, y: number, z: number) { gl!.uniform3f(p.uniforms[n], x, y, z); }

    function createTexture(w: number, h: number, internalFmt: number, fmt: number, type: number, filter: number): WebGLTexture {
      gl!.activeTexture(gl!.TEXTURE0);
      const tex = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFmt, w, h, 0, fmt, type, null);
      return tex;
    }

    function createFBO(w: number, h: number, internalFmt: number, fmt: number, type: number, filter: number): FBO {
      gl!.activeTexture(gl!.TEXTURE0);
      const texture = createTexture(w, h, internalFmt, fmt, type, filter);
      const fbo = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
      gl!.viewport(0, 0, w, h); gl!.clear(gl!.COLOR_BUFFER_BIT);
      const texelSizeX = 1 / w, texelSizeY = 1 / h;
      return { texture, fbo, width: w, height: h, texelSizeX, texelSizeY, attach(id) { gl!.activeTexture(gl!.TEXTURE0 + id); gl!.bindTexture(gl!.TEXTURE_2D, texture); return id; } };
    }

    function createDoubleFBO(w: number, h: number, internalFmt: number, fmt: number, type: number, filter: number): DoubleFBO {
      let read = createFBO(w, h, internalFmt, fmt, type, filter);
      let write = createFBO(w, h, internalFmt, fmt, type, filter);
      return { width: w, height: h, texelSizeX: read.texelSizeX, texelSizeY: read.texelSizeY, get read() { return read; }, get write() { return write; }, swap() { [read, write] = [write, read]; } };
    }

    function getResolution(res: number) {
      let ar = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
      if (ar < 1) ar = 1 / ar;
      const m = Math.round(res * ar), mn = Math.round(res);
      return gl!.drawingBufferWidth > gl!.drawingBufferHeight ? { width: m, height: mn } : { width: mn, height: m };
    }

    function blit(target: FBO | null) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target ? target.fbo : null);
      if (target) { gl!.viewport(0, 0, target.width, target.height); } else { gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight); }
      gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
    }

    // ── Build quad ─────────────────────────────────────────────────────────
    const buf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
    const idx = gl.createBuffer()!; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);

    // ── Compile programs ───────────────────────────────────────────────────
    const copy     = createProgram(baseVertexShaderSrc, copyShaderSrc);
    const clear2   = createProgram(baseVertexShaderSrc, clearShaderSrc);
    const splat    = createProgram(baseVertexShaderSrc, splatShaderSrc);
    const advect   = createProgram(baseVertexShaderSrc, advectionShaderSrc);
    const diverg   = createProgram(baseVertexShaderSrc, divergenceShaderSrc);
    const curlP    = createProgram(baseVertexShaderSrc, curlShaderSrc);
    const vort     = createProgram(baseVertexShaderSrc, vorticityShaderSrc);
    const pressure = createProgram(baseVertexShaderSrc, pressureShaderSrc);
    const gradSub  = createProgram(baseVertexShaderSrc, gradientSubtractShaderSrc);
    const display  = createProgram(baseVertexShaderSrc, displayShaderSrc);

    // ── FBOs ───────────────────────────────────────────────────────────────
    const simRes = getResolution(SIM_RESOLUTION);
    const dyeRes = getResolution(DYE_RESOLUTION);

    let velocity  = createDoubleFBO(simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, halfFloatTexType, filtering);
    let dye       = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, halfFloatTexType, filtering);
    let divergeFBO= createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    let curlFBO   = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    let pressureFBO = createDoubleFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);

    // ── Hue-to-RGB (brand accent tones) ───────────────────────────────────
    function HSVtoRGB(h: number, s: number, v: number) {
      let r = 0, g = 0, b = 0;
      const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
      switch (i % 6) { case 0: r=v;g=t;b=p;break; case 1: r=q;g=v;b=p;break; case 2: r=p;g=v;b=t;break; case 3: r=p;g=q;b=v;break; case 4: r=t;g=p;b=v;break; case 5: r=v;g=p;b=q;break; }
      return { r, g, b };
    }

    // Brand accent palette: AmiSync violet & mint teal tones
    function generateColor() {
      // Toggle between electric violet (~250°) and vibrant mint-teal (~165°)
      const isViolet = Math.random() > 0.45;
      const h = isViolet 
        ? 0.68 + (Math.random() - 0.5) * 0.08  // ~245°-275° violet/indigo
        : 0.44 + (Math.random() - 0.5) * 0.06; // ~155°-175° mint/teal
      const s = 0.75 + Math.random() * 0.25;
      const v = 0.7 + Math.random() * 0.3;
      return HSVtoRGB(h, s, v);
    }

    // ── Pointers ───────────────────────────────────────────────────────────
    const pointers: Pointer[] = [pointerPrototype()];
    let lastTime = Date.now();
    let colorTimer = 0;

    function correctDeltaX(d: number) { return canvas!.width < canvas!.height ? d * canvas!.height / canvas!.width : d; }
    function correctDeltaY(d: number) { return canvas!.width > canvas!.height ? d * canvas!.width / canvas!.height : d; }

    function updatePointerMoveData(ptr: Pointer, posX: number, posY: number) {
      ptr.prevTexcoordX = ptr.texcoordX; ptr.prevTexcoordY = ptr.texcoordY;
      ptr.texcoordX = posX / canvas!.width; ptr.texcoordY = 1 - posY / canvas!.height;
      ptr.deltaX = correctDeltaX(ptr.texcoordX - ptr.prevTexcoordX);
      ptr.deltaY = correctDeltaY(ptr.texcoordY - ptr.prevTexcoordY);
      ptr.moved = Math.abs(ptr.deltaX) > 0 || Math.abs(ptr.deltaY) > 0;
    }

    function splatPointer(ptr: Pointer) {
      splat.bind();
      uniform1i(splat, "uTarget", velocity.read.attach(0));
      uniform1f(splat, "aspectRatio", canvas!.width / canvas!.height);
      uniform2f(splat, "point", ptr.texcoordX, ptr.texcoordY);
      uniform3f(splat, "color", ptr.deltaX * SPLAT_FORCE, ptr.deltaY * SPLAT_FORCE, 0);
      uniform1f(splat, "radius", SPLAT_RADIUS / 100);
      blit(velocity.write); velocity.swap();

      uniform1i(splat, "uTarget", dye.read.attach(0));
      uniform3f(splat, "color", ptr.color.r * 0.3, ptr.color.g * 0.3, ptr.color.b * 0.3);
      blit(dye.write); dye.swap();
    }

    function multipleSplats(n: number) {
      for (let i = 0; i < n; i++) {
        const color = generateColor();
        const x = Math.random(), y = Math.random();
        const dx = 1000 * (Math.random() - 0.5), dy = 1000 * (Math.random() - 0.5);
        splat.bind();
        uniform1i(splat, "uTarget", velocity.read.attach(0));
        uniform1f(splat, "aspectRatio", canvas!.width / canvas!.height);
        uniform2f(splat, "point", x, y);
        uniform3f(splat, "color", dx, dy, 0);
        uniform1f(splat, "radius", SPLAT_RADIUS / 100);
        blit(velocity.write); velocity.swap();
        uniform1i(splat, "uTarget", dye.read.attach(0));
        uniform3f(splat, "color", color.r * 0.3, color.g * 0.3, color.b * 0.3);
        blit(dye.write); dye.swap();
      }
    }

    multipleSplats(Math.floor(Math.random() * 15) + 5);

    // ── Simulation step ────────────────────────────────────────────────────
    function step(dt: number) {
      gl!.disable(gl!.BLEND); gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);

      curlP.bind();
      uniform2f(curlP, "texelSize", velocity.texelSizeX, velocity.texelSizeY);
      uniform1i(curlP, "uVelocity", velocity.read.attach(0));
      blit(curlFBO);

      vort.bind();
      uniform2f(vort, "texelSize", velocity.texelSizeX, velocity.texelSizeY);
      uniform1i(vort, "uVelocity", velocity.read.attach(0));
      uniform1i(vort, "uCurl", curlFBO.attach(1));
      uniform1f(vort, "curl", CURL); uniform1f(vort, "dt", dt);
      blit(velocity.write); velocity.swap();

      diverg.bind();
      uniform2f(diverg, "texelSize", velocity.texelSizeX, velocity.texelSizeY);
      uniform1i(diverg, "uVelocity", velocity.read.attach(0));
      blit(divergeFBO);

      clear2.bind();
      uniform1i(clear2, "uTexture", pressureFBO.read.attach(0));
      uniform1f(clear2, "value", PRESSURE);
      blit(pressureFBO.write); pressureFBO.swap();

      pressure.bind();
      uniform2f(pressure, "texelSize", velocity.texelSizeX, velocity.texelSizeY);
      uniform1i(pressure, "uDivergence", divergeFBO.attach(0));
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        uniform1i(pressure, "uPressure", pressureFBO.read.attach(1));
        blit(pressureFBO.write); pressureFBO.swap();
      }

      gradSub.bind();
      uniform2f(gradSub, "texelSize", velocity.texelSizeX, velocity.texelSizeY);
      uniform1i(gradSub, "uPressure", pressureFBO.read.attach(0));
      uniform1i(gradSub, "uVelocity", velocity.read.attach(1));
      blit(velocity.write); velocity.swap();

      advect.bind();
      uniform2f(advect, "texelSize", velocity.texelSizeX, velocity.texelSizeY);
      if (!isWebGL2) uniform2f(advect, "dyeTexelSize", velocity.texelSizeX, velocity.texelSizeY);
      uniform1i(advect, "uVelocity", velocity.read.attach(0));
      uniform1i(advect, "uSource", velocity.read.attach(0));
      uniform1f(advect, "dt", dt);
      uniform1f(advect, "dissipation", VELOCITY_DISSIPATION);
      blit(velocity.write); velocity.swap();

      if (!isWebGL2) uniform2f(advect, "dyeTexelSize", dye.texelSizeX, dye.texelSizeY);
      uniform1i(advect, "uVelocity", velocity.read.attach(0));
      uniform1i(advect, "uSource", dye.read.attach(1));
      uniform1f(advect, "dissipation", DENSITY_DISSIPATION);
      blit(dye.write); dye.swap();
    }

    function render() {
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.enable(gl!.BLEND);
      display.bind();
      uniform1i(display, "uTexture", dye.read.attach(0));
      if (SHADING) uniform2f(display, "texelSize", dye.texelSizeX, dye.texelSizeY);
      blit(null);
    }

    // ── RAF loop ───────────────────────────────────────────────────────────
    let rafId: number;
    function loop() {
      rafId = requestAnimationFrame(loop);
      resizeCanvas();
      const now = Date.now(); const dt = Math.min((now - lastTime) / 1000, 0.016667); lastTime = now;
      colorTimer += dt * COLOR_UPDATE_SPEED;
      if (colorTimer >= 1) { colorTimer = 0; pointers.forEach(p => { if (p.down) p.color = generateColor(); }); }
      pointers.forEach(p => { if (p.moved) { splatPointer(p); p.moved = false; } });
      step(dt); render();
    }
    loop();

    // ── Events ─────────────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      const p = pointers[0];
      if (!p.down) p.color = generateColor();
      updatePointerMoveData(p, e.clientX, e.clientY);
    }
    function onMouseDown() { pointers[0].down = true; pointers[0].color = generateColor(); }
    function onMouseUp() { pointers[0].down = false; }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      for (const t of Array.from(e.targetTouches)) {
        let p = pointers.find(x => x.id === t.identifier);
        if (!p) { p = pointerPrototype(); pointers.push(p); }
        updatePointerMoveData(p, t.clientX, t.clientY);
      }
    }
    function onTouchStart(e: TouchEvent) {
      for (const t of Array.from(e.targetTouches)) {
        let p = pointers.find(x => x.id === t.identifier);
        if (!p) { p = pointerPrototype(); pointers.push(p); }
        p.id = t.identifier; p.down = true; p.color = generateColor();
        updatePointerMoveData(p, t.clientX, t.clientY);
      }
    }
    function onTouchEnd(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        const p = pointers.find(x => x.id === t.identifier);
        if (p) p.down = false;
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

