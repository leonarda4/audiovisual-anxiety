import {
  BLEND_MODE_TO_INDEX,
  DEFAULT_COLOR_CONFIG,
  DEFAULT_GRADIENT_CONFIG,
  DEFAULT_NOISE_CONFIG,
  getColorStops,
  getColorwayPrimaryBias,
  GRADIENT_TYPE_TO_INDEX,
  MOVEMENT_TO_INDEX,
  NOISE_TYPE_TO_INDEX,
} from './config.ts'
import { fragmentShaderSource, vertexShaderSource } from './shaders/visualShader.ts'
import { echoFragmentShaderSource, echoVertexShaderSource } from './shaders/echoShader.js'

// The source shader is kept intact. A shared canvas needs tile-local fragment
// coordinates so its film grain matches an individual Noise Lab canvas.
const tileShader = source => source
  .replace('uniform vec2 u_resolution;', 'uniform vec2 u_resolution;\nuniform vec2 u_viewportOrigin;')
  .replaceAll('gl_FragCoord.xy', '(gl_FragCoord.xy - u_viewportOrigin)')

// Echo's newer portable renderer inserts Blob and Noise-Mapped in its enums.
// Keep both programs so the user's approved Noise Lab visuals stay unchanged.
const RENDERERS = {
  legacy: { vertex: vertexShaderSource, fragment: tileShader(fragmentShaderSource), noiseTypes: NOISE_TYPE_TO_INDEX, gradientTypes: GRADIENT_TYPE_TO_INDEX },
  echo: {
    vertex: echoVertexShaderSource, fragment: tileShader(echoFragmentShaderSource),
    noiseTypes: { white: 0, value: 1, perlin: 2, simplex: 3, fbm: 4, turbulence: 5, ridge: 6, curl: 7, domainWarp: 8, worley: 9, voronoi: 10, blob: 11, joy: 12, anger: 13, sadness: 14, serenity: 15, determination: 16, blueGrain: 17 },
    gradientTypes: { linear: 0, radial: 1, conic: 2, mesh: 3, noiseDisplaced: 4, noiseMapped: 5, fragmentedRadial: 6, band: 7 },
  },
}
const GLITCH_DEFAULTS = { enabled: 0, amount: 0.55, stripeDensity: 0.4, sliceJitter: 0.55, channelSplit: 0.28, flash: 0.16, speed: 0.7 }
const DIRECTIONAL_MOVEMENTS = new Set(['moveLeft', 'moveRight', 'moveUp', 'moveDown', 'drift'])

const NOISE_UNIFORMS = {
  scale: 'u_noiseScale',
  speed: 'u_noiseSpeed',
  intensity: 'u_noiseIntensity',
  contrast: 'u_noiseContrast',
  opacity: 'u_noiseOpacity',
  seed: 'u_noiseSeed',
  ...Object.fromEntries([
    'timeInfluence', 'grainSize', 'flickerAmount', 'threshold', 'cellSize',
    'smoothness', 'blur', 'amplitude', 'octaves', 'lacunarity', 'gain',
    'turbulenceStrength', 'sharpness', 'ridgeSharpness', 'compression',
    'flowStrength', 'particleDistortionStrength', 'swirlAmount',
    'directionInstability', 'baseScale', 'warpScale', 'warpStrength',
    'warpSpeed', 'iterations', 'cellDensity', 'edgeSoftness', 'jitter',
    'invert', 'borderThickness', 'fragmentation', 'grainDensity', 'ditherStrength',
  ].map((key) => [key, `u_${key}`])),
}

const GRADIENT_UNIFORMS = [
  'gradientScale', 'movementSpeed', 'displacementStrength', 'rotation',
  'softness', 'bandCount', 'meshWarp', 'fragmentAmount',
]
const COLOR_UNIFORMS = ['blendStrength', 'saturation', 'brightness']

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Unable to allocate the Noise Lab shader.')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.'
    gl.deleteShader(shader)
    throw new Error(`Noise Lab shader: ${message}`)
  }
  return shader
}

function createProgram(gl, definition) {
  let vertexShader
  let fragmentShader
  let program
  try {
    vertexShader = compileShader(gl, gl.VERTEX_SHADER, definition.vertex)
    fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, definition.fragment)
    program = gl.createProgram()
    if (!program) throw new Error('Unable to allocate the Noise Lab program.')
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Noise Lab program: ${gl.getProgramInfoLog(program) || 'Unable to link shaders.'}`)
    }
    return program
  } catch (error) {
    if (program) gl.deleteProgram(program)
    throw error
  } finally {
    if (vertexShader) gl.deleteShader(vertexShader)
    if (fragmentShader) gl.deleteShader(fragmentShader)
  }
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return [1, 1, 1]
  const value = Number.parseInt(normalized, 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

/**
 * Render immutable Noise Lab recipes into one WebGL canvas. Tile rectangles use
 * drawing-buffer pixels, with their origin at the top left. The caller owns
 * canvas sizing, animation timing, and context-loss recovery.
 */
export function createNoiseRenderer(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: false,
  })
  if (!gl) throw new Error('WebGL is unavailable in this browser.')

  const positionBuffer = gl.createBuffer()
  if (!positionBuffer) {
    throw new Error('Unable to allocate the Noise Lab vertex buffer.')
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

  const programs = new Map()
  function getProgram(key) {
    if (programs.has(key)) return programs.get(key)
    const definition = RENDERERS[key]
    const program = createProgram(gl, definition)
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    if (positionLocation < 0) {
      gl.deleteProgram(program)
      throw new Error('The Noise Lab position attribute was not found.')
    }
    const uniforms = Object.fromEntries(
      [...definition.fragment.matchAll(/uniform\s+\w+\s+(u_\w+)/g)].map(([, name]) => [
        name, gl.getUniformLocation(program, name === 'u_palette' ? 'u_palette[0]' : name),
      ]),
    )
    const state = { program, positionLocation, uniforms, definition }
    programs.set(key, state)
    return state
  }
  const recipeCache = new WeakMap()
  let destroyed = false

  function prepareRecipe(recipe) {
    let prepared = recipeCache.get(recipe)
    if (prepared) return prepared
    const state = getProgram(recipe.renderer || 'legacy')
    const { uniforms, definition } = state

    // Older saved recipes omit parameters introduced by later Noise Lab
    // versions; the original app fills these from its current defaults.
    const noise = {
      ...DEFAULT_NOISE_CONFIG,
      ...recipe.noise,
      params: { ...DEFAULT_NOISE_CONFIG.params, ...recipe.noise?.params },
    }
    const gradient = {
      ...DEFAULT_GRADIENT_CONFIG,
      ...recipe.gradient,
      params: { ...DEFAULT_GRADIENT_CONFIG.params, ...recipe.gradient?.params },
    }
    const color = {
      ...DEFAULT_COLOR_CONFIG,
      ...recipe.color,
      params: { ...DEFAULT_COLOR_CONFIG.params, ...recipe.color?.params },
    }
    const palette = getColorStops(color).slice(0, 7).map(hexToRgb)
    const paletteCount = palette.length
    while (palette.length < 7) palette.push(palette.at(-1) || [1, 1, 1])
    const glitch = { ...GLITCH_DEFAULTS, ...recipe.glitch?.params }

    prepared = {
      state,
      palette: new Float32Array(palette.flat()),
      paletteCount,
      center: [gradient.params.centerX, gradient.params.centerY],
      integers: [
        [uniforms.u_noiseType, definition.noiseTypes[noise.type]],
        [uniforms.u_gradientType, definition.gradientTypes[gradient.type]],
        [uniforms.u_movementType, MOVEMENT_TO_INDEX[gradient.movement]],
        [uniforms.u_blendMode, BLEND_MODE_TO_INDEX[color.blendMode]],
        ...(recipe.renderer === 'echo' ? [[uniforms.u_glitchType, recipe.glitch?.type === 'tear' ? 1 : 0]] : []),
      ],
      floats: [
        [uniforms.u_primaryColorBias, getColorwayPrimaryBias(color.colorwayId)],
        ...Object.entries(NOISE_UNIFORMS).map(([key, uniform]) => [uniforms[uniform], noise.params[key]]),
        ...GRADIENT_UNIFORMS.map((key) => [uniforms[`u_${key}`], gradient.params[key]]),
        ...COLOR_UNIFORMS.map((key) => [uniforms[`u_${key}`], color.params[key]]),
        ...(recipe.renderer === 'echo' ? Object.entries(glitch).map(([key, value]) => [uniforms[`u_glitch${key[0].toUpperCase()}${key.slice(1)}`], value]) : []),
      ],
      // These are the unchanged steady-state phase rates from VisualCanvas.tsx.
      noiseRate: Math.max(0.02, noise.params.speed) * (0.15 + (1.4 - 0.15) * noise.params.timeInfluence),
      movementRate: gradient.movement === 'static' ? 0 : (0.25 + gradient.params.movementSpeed * 0.6) * (recipe.renderer === 'echo' && DIRECTIONAL_MOVEMENTS.has(gradient.movement) ? 0.88 : 1),
      gradientRate: gradient.params.movementSpeed * 0.02,
    }
    recipeCache.set(recipe, prepared)
    return prepared
  }

  return {
    render(tiles, elapsedSeconds) {
      if (destroyed) return
      if (gl.isContextLost()) throw new Error('The Noise Lab WebGL context was lost.')
      if (!canvas.width || !canvas.height) return

      const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0
      gl.disable(gl.SCISSOR_TEST)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enable(gl.SCISSOR_TEST)
      let activeProgram = null

      for (const tile of tiles) {
        const x = Math.round(tile.x)
        const width = Math.round(tile.width)
        const height = Math.round(tile.height)
        const y = canvas.height - Math.round(tile.y) - height
        if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue

        const left = Math.max(0, x)
        const bottom = Math.max(0, y)
        const right = Math.min(canvas.width, x + width)
        const top = Math.min(canvas.height, y + height)
        if (right <= left || top <= bottom) continue

        const recipe = prepareRecipe(tile.recipe)
        const { program, positionLocation, uniforms } = recipe.state
        if (program !== activeProgram) {
          gl.useProgram(program)
          gl.enableVertexAttribArray(positionLocation)
          gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
          gl.uniform1f(uniforms.u_time, elapsed)
          activeProgram = program
        }
        gl.viewport(x, y, width, height)
        gl.scissor(left, bottom, right - left, top - bottom)
        gl.uniform2f(uniforms.u_viewportOrigin, x, y)
        gl.uniform2f(uniforms.u_resolution, width, height)
        gl.uniform2f(uniforms.u_center, recipe.center[0], recipe.center[1])
        gl.uniform1f(uniforms.u_noisePhase, elapsed * recipe.noiseRate)
        gl.uniform1f(uniforms.u_movementPhase, elapsed * recipe.movementRate)
        gl.uniform1f(uniforms.u_gradientPhase, elapsed * recipe.gradientRate)
        gl.uniform3fv(uniforms.u_palette, recipe.palette)
        gl.uniform1i(uniforms.u_paletteCount, recipe.paletteCount)
        for (const [location, value] of recipe.integers) gl.uniform1i(location, value)
        for (const [location, value] of recipe.floats) gl.uniform1f(location, value)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      gl.disable(gl.SCISSOR_TEST)
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      gl.deleteBuffer(positionBuffer)
      for (const { program } of programs.values()) gl.deleteProgram(program)
      programs.clear()
    },
  }
}
