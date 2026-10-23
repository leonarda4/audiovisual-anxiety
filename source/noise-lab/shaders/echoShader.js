// Extracted from Echo live_screen.html, dc644d0ea4ab12b93d813a7eb7377add54b573bd.
export const echoVertexShaderSource = "\nattribute vec2 a_position;\nvarying vec2 v_uv;\n\nvoid main() {\n  v_uv = a_position * 0.5 + 0.5;\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}\n"
export const echoFragmentShaderSource = `
precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_noisePhase;
uniform float u_movementPhase;
uniform float u_gradientPhase;

uniform int u_noiseType;
uniform int u_gradientType;
uniform int u_movementType;
uniform int u_blendMode;

uniform int u_paletteCount;
uniform vec3 u_palette[7];
uniform float u_primaryColorBias;

uniform float u_noiseScale;
uniform float u_noiseSpeed;
uniform float u_noiseIntensity;
uniform float u_noiseContrast;
uniform float u_noiseOpacity;
uniform float u_noiseSeed;
uniform float u_timeInfluence;
uniform float u_grainSize;
uniform float u_flickerAmount;
uniform float u_threshold;
uniform float u_cellSize;
uniform float u_smoothness;
uniform float u_blur;
uniform float u_amplitude;
uniform float u_octaves;
uniform float u_lacunarity;
uniform float u_gain;
uniform float u_turbulenceStrength;
uniform float u_sharpness;
uniform float u_ridgeSharpness;
uniform float u_compression;
uniform float u_flowStrength;
uniform float u_particleDistortionStrength;
uniform float u_swirlAmount;
uniform float u_directionInstability;
uniform float u_baseScale;
uniform float u_warpScale;
uniform float u_warpStrength;
uniform float u_warpSpeed;
uniform float u_iterations;
uniform float u_cellDensity;
uniform float u_edgeSoftness;
uniform float u_jitter;
uniform float u_invert;
uniform float u_borderThickness;
uniform float u_fragmentation;
uniform float u_grainDensity;
uniform float u_ditherStrength;

uniform float u_gradientScale;
uniform float u_movementSpeed;
uniform float u_blendStrength;
uniform float u_displacementStrength;
uniform vec2 u_center;
uniform float u_rotation;
uniform float u_softness;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_bandCount;
uniform float u_meshWarp;
uniform float u_fragmentAmount;
uniform int u_glitchType;
uniform float u_glitchEnabled;
uniform float u_glitchAmount;
uniform float u_glitchStripeDensity;
uniform float u_glitchSliceJitter;
uniform float u_glitchChannelSplit;
uniform float u_glitchFlash;
uniform float u_glitchSpeed;

const float PI = 3.141592653589793;

float saturateFloat(float value) {
  return clamp(value, 0.0, 1.0);
}

vec3 saturateVec3(vec3 value) {
  return clamp(value, 0.0, 1.0);
}

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  float n = hash12(p);
  float m = hash12(p + 19.19);
  return vec2(n, m);
}

vec2 gradient2(vec2 p) {
  vec2 g = hash22(p) * 2.0 - 1.0;
  return normalize(g + vec2(1e-5));
}

float whiteNoise(vec2 p, float t) {
  return hash12(p + vec2(t * 0.013, t * 0.071));
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float perlinNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(gradient2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
  float b = dot(gradient2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(gradient2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(gradient2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float simplexNoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289(i);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbmBase(vec2 p, float octaves, float lacunarity, float gain) {
  float value = 0.0;
  float amplitude = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 7; i++) {
    if (float(i) >= octaves) {
      break;
    }
    value += amplitude * (0.5 + 0.5 * simplexNoise(p));
    p = p * lacunarity + shift;
    amplitude *= gain;
  }
  return value;
}

float turbulenceBase(vec2 p, float octaves, float lacunarity, float gain) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 7; i++) {
    if (float(i) >= octaves) {
      break;
    }
    value += amplitude * abs(simplexNoise(p));
    p = p * lacunarity + vec2(19.4, -7.2);
    amplitude *= gain;
  }
  return value;
}

float ridgeBase(vec2 p, float sharpness, float compression) {
  float n = 1.0 - abs(simplexNoise(p));
  n = pow(saturateFloat(n), mix(1.0, 4.5, sharpness));
  return mix(n, smoothstep(0.0, 1.0, n), compression);
}

vec3 worleyData(vec2 p, float jitter) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  float nearest = 8.0;
  float secondNearest = 8.0;
  float id = 0.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash22(cell + neighbor);
      point = 0.5 + (point - 0.5) * mix(0.2, 1.8, jitter);
      vec2 diff = neighbor + point - local;
      float distanceValue = dot(diff, diff);
      if (distanceValue < nearest) {
        secondNearest = nearest;
        nearest = distanceValue;
        id = hash12(cell + neighbor + 31.7);
      } else if (distanceValue < secondNearest) {
        secondNearest = distanceValue;
      }
    }
  }

  return vec3(sqrt(nearest), sqrt(secondNearest), id);
}

vec2 flowCurl(vec2 p) {
  float e = 0.12;
  float n1 = simplexNoise(p + vec2(0.0, e));
  float n2 = simplexNoise(p - vec2(0.0, e));
  float n3 = simplexNoise(p + vec2(e, 0.0));
  float n4 = simplexNoise(p - vec2(e, 0.0));
  vec2 curl = vec2(n1 - n2, -(n3 - n4));
  return normalize(curl + vec2(1e-5));
}

vec2 noiseGradient(vec2 p) {
  float e = 0.06;
  float center = simplexNoise(p);
  return vec2(
    simplexNoise(p + vec2(e, 0.0)) - center,
    simplexNoise(p + vec2(0.0, e)) - center
  ) / e;
}

float blueNoiseStyle(vec2 pixel) {
  float fine = fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
  float coarse = fract(52.9829189 * fract(dot(floor(pixel * 0.5), vec2(0.031, 0.017))));
  float distributed = fine - coarse * 0.45 + 0.35;
  return saturateFloat(distributed);
}

vec3 paletteAt(int index) {
  if (index <= 0) {
    return u_palette[0];
  }
  if (index == 1) {
    return u_palette[1];
  }
  if (index == 2) {
    return u_palette[2];
  }
  if (index == 3) {
    return u_palette[3];
  }
  if (index == 4) {
    return u_palette[4];
  }
  if (index == 5) {
    return u_palette[5];
  }
  return u_palette[6];
}

int clampPaletteIndex(int index) {
  int last = u_paletteCount - 1;
  if (last < 0) {
    last = 0;
  }
  if (index < 0) {
    return 0;
  }
  if (index > last) {
    return last;
  }
  return index;
}

vec3 samplePalette(float t) {
  float clamped = clamp(t, 0.0, 0.9999);
  int segmentCount = u_paletteCount - 1;
  if (segmentCount < 1) {
    segmentCount = 1;
  }
  float scaled = clamped * float(segmentCount);
  int index = int(floor(scaled));
  float local = fract(scaled);
  int nextIndex = clampPaletteIndex(index + 1);
  return mix(
    paletteAt(clampPaletteIndex(index)),
    paletteAt(nextIndex),
    smoothstep(0.0, 1.0, local)
  );
}

vec3 applyColorAdjustments(vec3 color) {
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luminance), color, u_saturation);
  color *= u_brightness;
  return saturateVec3(color);
}

vec3 biasTowardPrimaryColor(vec3 color, float noiseValue) {
  float bias = saturateFloat(u_primaryColorBias);
  if (bias <= 0.0) {
    return color;
  }

  float tintStrength = bias * (0.55 + noiseValue * 0.2);
  vec3 primaryTint = mix(color, paletteAt(0), 0.78);
  return mix(color, primaryTint, tintStrength);
}

vec2 applyMovement(vec2 p, float phase) {
  if (u_movementType == 1) {
    p *= 0.88 + sin(phase) * 0.14;
  } else if (u_movementType == 2) {
    p *= 1.12 - sin(phase) * 0.14;
  } else if (u_movementType == 3) {
    p += vec2(-phase * 0.08, 0.0);
  } else if (u_movementType == 4) {
    p += vec2(phase * 0.08, 0.0);
  } else if (u_movementType == 5) {
    p += vec2(0.0, -phase * 0.08);
  } else if (u_movementType == 6) {
    p += vec2(0.0, phase * 0.08);
  } else if (u_movementType == 7) {
    p = rotate2d(phase * 0.75) * p;
  } else if (u_movementType == 8) {
    p = rotate2d(-phase * 0.75) * p;
  } else if (u_movementType == 9) {
    p *= 1.0 + sin(phase * 2.0) * 0.12;
  } else if (u_movementType == 10) {
    p += vec2(
      sin(phase * 0.9),
      cos(phase * 0.75)
    ) * 0.1;
  }
  return p;
}

vec2 organicOrbit(float time) {
  return vec2(
    sin(time * 0.63 + u_noiseSeed * 0.11) + 0.5 * cos(time * 0.27 - u_noiseSeed * 0.05),
    cos(time * 0.51 - u_noiseSeed * 0.09) + 0.5 * sin(time * 0.31 + u_noiseSeed * 0.04)
  ) * 0.18;
}

vec2 evolveField(vec2 p, float time, float strength) {
  vec2 orbit = organicOrbit(time);
  vec2 warp = vec2(
    simplexNoise(p * 0.62 + vec2(time * 0.23, -time * 0.17) + 11.4),
    simplexNoise(p * 0.58 + vec2(-time * 0.19, time * 0.21) - 7.8)
  );
  p += orbit + warp * strength;
  float turn = simplexNoise(p * 0.24 + vec2(time * 0.08, -time * 0.06) + 2.3) * 0.45 * strength;
  p = rotate2d(turn) * p;
  p *= 1.0 + sin(time * 0.41 + dot(p, vec2(0.7, -0.4))) * 0.04 * strength;
  return p;
}

vec3 sampleNoise(vec2 local, vec2 uv, float aspect, float time, float noisePhase) {
  float motionTime = noisePhase;
  float evolutionStrength = 0.14 + u_timeInfluence * 0.32 + u_noiseSpeed * 0.08;
  vec2 p = local * (2.5 + u_noiseScale * 2.0);
  p += vec2(u_noiseSeed * 0.071, u_noiseSeed * 0.113);
  p = evolveField(p, motionTime, evolutionStrength);

  float n = 0.5;
  vec2 v = vec2(0.0);

  if (u_noiseType == 0) {
    float grains = mix(24.0, 220.0, u_grainSize);
    vec2 grid = floor((uv + p * 0.02) * grains + time * u_flickerAmount * 2.0);
    n = whiteNoise(grid, time * (1.0 + u_flickerAmount * 6.0));
    n = smoothstep(u_threshold - 0.2, u_threshold + 0.2, n);
    v = hash22(grid + 8.7) - 0.5;
  } else if (u_noiseType == 1) {
    vec2 q = p * mix(0.4, 2.4, u_cellSize);
    float base = valueNoise(q);
    n = mix(base, smoothstep(0.1, 0.9, base), u_smoothness);
    n = mix(n, 0.5 + (n - 0.5) * 0.6, u_blur);
    v = vec2(valueNoise(q + 11.0), valueNoise(q - 9.0)) - 0.5;
  } else if (u_noiseType == 2) {
    vec2 q = p * 1.3;
    float base = perlinNoise(q);
    n = 0.5 + 0.5 * base * (0.6 + u_amplitude);
    v = noiseGradient(q) * (0.25 + u_amplitude);
  } else if (u_noiseType == 3) {
    vec2 q = p * 1.35;
    float base = simplexNoise(q);
    n = 0.5 + 0.5 * base * (0.6 + u_amplitude);
    v = noiseGradient(q + 13.1) * (0.24 + u_amplitude);
  } else if (u_noiseType == 4) {
    vec2 q = p * 1.1;
    float base = fbmBase(q, u_octaves, u_lacunarity, u_gain);
    n = saturateFloat(base * (0.65 + u_amplitude * 0.8));
    v = vec2(
      fbmBase(q + vec2(3.7, 0.0), u_octaves, u_lacunarity, u_gain),
      fbmBase(q + vec2(0.0, 5.1), u_octaves, u_lacunarity, u_gain)
    ) - 0.5;
  } else if (u_noiseType == 5) {
    vec2 q = p * 1.25;
    float base = turbulenceBase(q, u_octaves, u_lacunarity, u_gain);
    float shaped = pow(base, mix(0.8, 3.5, u_sharpness));
    n = mix(base, shaped, u_sharpness);
    n = smoothstep(u_threshold - 0.25, u_threshold + 0.25, n * (0.7 + u_turbulenceStrength));
    v = noiseGradient(q) * (0.2 + u_turbulenceStrength);
  } else if (u_noiseType == 6) {
    vec2 q = p * 1.35;
    n = ridgeBase(q, u_ridgeSharpness, u_compression);
    v = noiseGradient(q + 9.5) * (0.15 + u_ridgeSharpness);
  } else if (u_noiseType == 7) {
    vec2 q = evolveField(
      local * (2.0 + u_flowStrength * 2.8),
      motionTime * 0.95,
      0.2 + u_directionInstability * 0.35
    );
    vec2 curl = flowCurl(q + organicOrbit(motionTime * 0.8) * 2.2);
    float swirl = simplexNoise(q + curl * (0.5 + u_swirlAmount));
    float drift = sin((q.x + q.y) * 5.0 + motionTime * 2.0) * 0.5 + 0.5;
    n = mix(0.5 + 0.5 * swirl, drift, u_particleDistortionStrength * 0.35);
    v = curl * (0.24 + u_flowStrength) +
      (hash22(q * 2.5 + 4.0) - 0.5) * u_directionInstability * 0.25;
  } else if (u_noiseType == 8) {
    float warpTime = motionTime * (0.35 + u_warpSpeed * 1.8);
    vec2 q = evolveField(
      local * (2.0 + u_baseScale * 2.5),
      motionTime * 0.75,
      0.16 + u_warpStrength * 0.22
    );
    vec2 warp = vec2(
      fbmBase(q * (0.6 + u_warpScale * 2.0) + vec2(warpTime, 0.0), 4.0, u_lacunarity, u_gain),
      fbmBase(q * (0.6 + u_warpScale * 2.0) + vec2(7.1, warpTime), 4.0, u_lacunarity, u_gain)
    );
    warp = (warp * 2.0 - 1.0) * u_warpStrength;
    vec2 warped = q;
    for (int i = 0; i < 5; i++) {
      if (float(i) >= u_iterations) {
        break;
      }
      warped += warp * (0.45 + float(i) * 0.12);
    }
    n = fbmBase(warped, u_octaves, u_lacunarity, u_gain);
    v = warp;
  } else if (u_noiseType == 9) {
    vec2 q = evolveField(
      local * (2.0 + u_cellDensity * 7.0),
      motionTime * 0.65,
      0.1 + u_jitter * 0.28
    );
    vec3 cell = worleyData(q, u_jitter);
    float edgeScale = mix(0.55, 2.2, 1.0 - u_edgeSoftness);
    n = 1.0 - smoothstep(0.0, 1.1, cell.x * edgeScale);
    n = mix(n, 1.0 - n, step(0.5, u_invert));
    v = hash22(floor(q) + cell.z * 13.0) - 0.5;
  } else if (u_noiseType == 10) {
    vec2 q = evolveField(
      local * (2.0 + u_cellDensity * 7.0),
      motionTime * 0.58,
      0.12 + u_fragmentation * 0.24
    );
    vec3 cell = worleyData(q, u_jitter);
    float edge = smoothstep(
      max(0.01, u_borderThickness * 0.2),
      max(0.04, u_borderThickness * 0.9 + 0.04),
      cell.y - cell.x
    );
    float fragments = fbmBase(
      q * (1.0 + u_fragmentation * 2.5) + cell.z * 18.0,
      4.0,
      2.0,
      0.5
    );
    n = mix(edge, fragments, u_fragmentation * 0.7);
    v = (hash22(floor(q) + cell.z * 31.0) - 0.5) * (0.3 + u_fragmentation);
  } else if (u_noiseType == 11) {
    vec2 q = local * (0.45 + u_noiseScale * 1.25);
    float blobTime = motionTime * (0.18 + u_noiseSpeed * 0.55);
    vec2 wobble = vec2(
      simplexNoise(
        q * 0.85 + vec2(blobTime * 0.52, -blobTime * 0.33) + u_noiseSeed * 0.07
      ),
      simplexNoise(
        q * 0.82 + vec2(-blobTime * 0.41, blobTime * 0.47) - u_noiseSeed * 0.05
      )
    ) * (0.08 + u_turbulenceStrength * 0.18);
    vec2 warped = q + wobble;
    float radius = length(warped);
    float angle = atan(warped.y, warped.x);
    float edgeNoise = fbmBase(
      vec2(cos(angle), sin(angle)) * (1.5 + u_turbulenceStrength * 1.2) +
        vec2(blobTime * 0.18, u_noiseSeed * 0.01),
      4.0,
      2.0,
      0.55
    );
    float blobRadius = mix(0.88, 0.34, saturateFloat(u_amplitude / 1.5));
    blobRadius += (edgeNoise - 0.5) * (0.08 + u_turbulenceStrength * 0.16);
    float edgeSoftness = mix(0.34, 0.04, u_sharpness) + u_blur * 0.28;
    n = 1.0 - smoothstep(blobRadius, blobRadius + edgeSoftness, radius);
    float interior = fbmBase(
      warped * (1.1 + u_turbulenceStrength) + vec2(blobTime * 0.1, -blobTime * 0.08),
      3.0,
      2.0,
      0.55
    );
    n = mix(n, n * (0.78 + interior * 0.28), 0.35 + u_timeInfluence * 0.15);
    v = normalize(warped + vec2(1e-5)) * (0.18 + n * 0.14) +
      noiseGradient(warped * 1.2 + 5.4) * (0.04 + u_turbulenceStrength * 0.06);
  } else if (u_noiseType == 12) {
    vec2 q = evolveField(
      local * (1.4 + u_noiseScale * 2.6),
      motionTime * 0.55,
      0.08 + u_timeInfluence * 0.18
    );
    float r = length(q);
    float rings = sin(r * (10.0 + u_sharpness * 18.0) - motionTime * (0.6 + u_noiseSpeed * 1.8));
    rings = 0.5 + 0.5 * rings;
    float bloom = saturateFloat(1.0 - r * mix(1.8, 0.78, saturateFloat(u_amplitude / 1.5)));
    float texture = fbmBase(
      q * (0.9 + u_smoothness * 1.6) + vec2(motionTime * 0.08, -motionTime * 0.05),
      min(u_octaves, 5.0),
      u_lacunarity,
      u_gain
    );
    n = clamp(rings * 0.56 + bloom * (0.34 + u_amplitude * 0.18) + texture * 0.18, 0.0, 1.0);
    float softened = mix(n, smoothstep(0.0, 1.0, n), u_blur);
    n = mix(n, softened, 0.45 + u_blur * 0.35);
    vec2 radial = normalize(q + vec2(1e-5));
    v = radial * (bloom - 0.35) * (0.16 + u_amplitude * 0.14)
      + noiseGradient(q * 0.7 + 4.2) * 0.05;
  } else if (u_noiseType == 13) {
    vec2 q = evolveField(
      local * (1.6 + u_noiseScale * 2.8),
      motionTime * 0.9,
      0.1 + u_turbulenceStrength * 0.22
    );
    float spin = motionTime * (0.35 + u_swirlAmount * 1.45);
    vec2 rotated = rotate2d(spin) * q;
    float xWeight = mix(0.24, 0.08, u_compression);
    float yWeight = mix(1.8, 4.4, u_compression);
    float ellD = sqrt(rotated.x * rotated.x * xWeight + rotated.y * rotated.y * yWeight);
    float ellRings = sin(ellD * (6.0 + u_sharpness * 14.0) - motionTime * (1.0 + u_noiseSpeed * 2.2));
    ellRings = 0.5 + 0.5 * ellRings;
    float spokeCount = floor(mix(4.0, 12.0, u_turbulenceStrength) + 0.5);
    float spines = pow(
      abs(sin(atan(q.y, q.x) * max(1.0, spokeCount) + motionTime * (0.8 + u_swirlAmount * 1.4))),
      mix(2.0, 10.0, u_sharpness)
    );
    float texture = fbmBase(
      q * (1.1 + u_turbulenceStrength * 1.6) + vec2(motionTime * 0.18, motionTime * 0.11),
      min(u_octaves, 5.0),
      u_lacunarity,
      u_gain
    );
    float center = saturateFloat(1.0 - length(q) * 0.55);
    n = clamp(ellRings * 0.48 + spines * 0.38 + texture * 0.2 + center * 0.16, 0.0, 1.0);
    n = mix(n, pow(n, mix(1.0, 0.5, u_sharpness)), u_sharpness * 0.55);
    vec2 radial = normalize(q + vec2(1e-5));
    v = radial * (spines - 0.4) * (0.14 + u_swirlAmount * 0.16)
      + noiseGradient(rotated * 0.8 + 8.6) * (0.08 + u_turbulenceStrength * 0.08);
  } else if (u_noiseType == 14) {
    vec2 q = local * (1.25 + u_noiseScale * 1.9);
    float sag = sin(q.x * 1.7) * mix(0.04, 0.32, saturateFloat(u_flowStrength / 1.5));
    float drift = fbmBase(
      vec2(q.x * 0.9 + motionTime * 0.04, q.y * 0.65 - motionTime * 0.02),
      min(u_octaves, 5.0),
      u_lacunarity,
      u_gain
    );
    float yw = q.y - sag + (drift - 0.5) * mix(0.04, 0.28, u_blur);
    float bands = sin(yw * (6.0 + u_smoothness * 12.0) - motionTime * (0.25 + u_noiseSpeed * 0.7));
    bands = 0.5 + 0.5 * bands;
    float gravity = pow(saturateFloat(uv.y), mix(1.25, 0.7, saturateFloat(u_amplitude / 1.5)));
    n = clamp(bands * 0.48 + gravity * (0.28 + u_amplitude * 0.18) + drift * 0.24, 0.0, 1.0);
    n = mix(n, smoothstep(0.06, 0.92, n), 0.35 + u_smoothness * 0.45);
    v = vec2((drift - 0.5) * 0.08, gravity * (0.08 + u_flowStrength * 0.08));
  } else if (u_noiseType == 15) {
    vec2 q = local * (0.9 + u_noiseScale * 1.35);
    float horizon = fbmBase(
      vec2(q.x * 0.6 + motionTime * 0.02, q.y * 0.12),
      max(2.0, min(u_octaves, 4.0)),
      1.9,
      0.52
    );
    float lineSpan = mix(12.0, 4.0, u_compression);
    float wave = sin(q.y * lineSpan + horizon * (0.6 + u_amplitude * 1.8) - motionTime * (0.12 + u_noiseSpeed * 0.45));
    wave = 0.5 + 0.5 * wave;
    n = clamp(wave * 0.72 + horizon * 0.28, 0.0, 1.0);
    n = mix(n, smoothstep(0.0, 1.0, n), 0.45 + u_smoothness * 0.35);
    n = mix(n, 0.5 + (n - 0.5) * 0.65, u_blur);
    v = vec2((horizon - 0.5) * 0.1, sin(q.y + motionTime * 0.2) * 0.02);
  } else if (u_noiseType == 16) {
    vec2 q = local * (1.35 + u_noiseScale * 2.2);
    float guide = fbmBase(
      vec2(q.x * 0.16 + motionTime * 0.03, q.y * 1.35 + motionTime * 0.09),
      3.0,
      u_lacunarity,
      u_gain
    );
    float order = saturateFloat(u_compression);
    float spacing = mix(0.9, 1.25, order);
    float wobble = guide * mix(1.3, 0.18, order) * (0.4 + u_directionInstability * 1.6);
    float columns = sin(q.x * spacing * (8.0 + u_sharpness * 20.0) + wobble);
    columns = 0.5 + 0.5 * columns;
    float upward = pow(saturateFloat(1.0 - uv.y), mix(1.2, 0.65, saturateFloat(u_flowStrength / 1.5)));
    float detail = fbmBase(
      vec2(q.x * 1.6 + motionTime * 0.05, q.y * 0.55 - motionTime * 0.02),
      2.0,
      u_lacunarity,
      u_gain
    );
    n = clamp(columns * 0.56 + upward * (0.28 + u_flowStrength * 0.18) + detail * 0.16, 0.0, 1.0);
    n = mix(n, smoothstep(0.08, 0.94, n), 0.42 + u_sharpness * 0.35);
    v = vec2((columns - 0.5) * 0.1, -upward * (0.06 + u_flowStrength * 0.1));
  } else {
    vec2 pixel = uv * u_resolution * mix(0.3, 1.8, u_grainSize);
    float dither = blueNoiseStyle(pixel + u_noiseSeed * 13.0 + time * u_flickerAmount * 30.0);
    float sparkle = whiteNoise(pixel * 0.15 + 7.3, time * 0.8);
    n = mix(dither, smoothstep(0.2, 0.85, dither), u_ditherStrength);
    n = mix(n, sparkle, u_grainDensity * 0.35);
    v = hash22(pixel + 9.0) - 0.5;
  }

  n = clamp(0.5 + (n - 0.5) * (0.25 + u_noiseContrast * 1.7), 0.0, 1.0);
  n = mix(0.5, n, saturateFloat(u_noiseIntensity));
  v *= (0.15 + u_noiseIntensity * 0.85) * (0.4 + u_noiseOpacity);

  return vec3(n, v);
}

vec3 sampleMeshGradient(vec2 p, float time, float noiseValue) {
  vec2 c0 = vec2(-0.42, -0.22) + vec2(sin(time * 0.32), cos(time * 0.26)) * 0.1;
  vec2 c1 = vec2(0.38, -0.15) + vec2(cos(time * 0.21), sin(time * 0.18)) * 0.1;
  vec2 c2 = vec2(-0.18, 0.34) + vec2(sin(time * 0.14), sin(time * 0.3)) * 0.09;
  vec2 c3 = vec2(0.36, 0.28) + vec2(cos(time * 0.17), cos(time * 0.25)) * 0.09;
  float w0 = 1.0 / (0.12 + length(p - c0));
  float w1 = 1.0 / (0.12 + length(p - c1));
  float w2 = 1.0 / (0.12 + length(p - c2));
  float w3 = 1.0 / (0.12 + length(p - c3));
  float total = w0 + w1 + w2 + w3;
  int color1 = clampPaletteIndex(1);
  int color2 = clampPaletteIndex(2);
  int color3 = clampPaletteIndex(3);
  vec3 color =
    paletteAt(0) * w0 +
    paletteAt(color1) * w1 +
    paletteAt(color2) * w2 +
    paletteAt(color3) * w3;
  color /= total;
  return mix(color, samplePalette(noiseValue), u_meshWarp * 0.18);
}

vec3 sampleGradient(
  vec2 p,
  float time,
  float gradientPhase,
  float noiseValue,
  vec2 noiseVector
) {
  vec3 color;
  float softness = mix(0.12, 1.2, u_softness);

  if (u_gradientType == 0) {
    float t = smoothstep(-softness, 1.0 + softness, 0.5 + p.x + noiseValue * 0.12);
    color = samplePalette(t);
  } else if (u_gradientType == 1) {
    float r = length(p) * mix(1.65, 0.85, u_softness);
    float t = 1.0 - smoothstep(0.0, 0.95 + softness * 0.6, r);
    color = samplePalette(t);
  } else if (u_gradientType == 2) {
    float angle = atan(p.y, p.x) / (PI * 2.0) + 0.5;
    float t = fract(angle + noiseValue * 0.08 + gradientPhase);
    color = samplePalette(t);
  } else if (u_gradientType == 3) {
    color = sampleMeshGradient(p, time, noiseValue);
  } else if (u_gradientType == 4) {
    vec2 warped = p + noiseVector * (0.35 + u_meshWarp * 0.55);
    float t = fbmBase(warped * 3.2 + vec2(time * 0.06, 0.0), 4.0, 2.0, 0.5);
    color = samplePalette(t);
  } else if (u_gradientType == 5) {
    float vectorAngle = atan(noiseVector.y, noiseVector.x) / (PI * 2.0) + 0.5;
    float vectorStrength = saturateFloat(length(noiseVector) * (1.8 + u_meshWarp * 1.6));
    float structure = fbmBase(
      p * (1.8 + u_meshWarp * 1.6) +
        noiseVector * (3.2 + u_displacementStrength * 2.4) +
        vec2(time * 0.07, -time * 0.05),
      4.0,
      2.0,
      0.5
    );
    float mapped = clamp(
      noiseValue * mix(0.78, 1.18, u_softness) +
        (structure - 0.5) * (0.4 + u_displacementStrength * 0.28) +
        (vectorAngle - 0.5) * (0.16 + u_meshWarp * 0.22) +
        (vectorStrength - 0.5) * 0.18,
      0.0,
      1.0
    );
    vec3 baseColor = samplePalette(smoothstep(0.0, 1.0, mapped));
    vec3 accent = samplePalette(
      fract(mapped + 0.18 + vectorStrength * 0.12 + gradientPhase * 0.08)
    );
    float accentMix = smoothstep(0.22, 0.88, structure + noiseValue * 0.18) *
      (0.12 + u_meshWarp * 0.18);
    color = mix(baseColor, accent, accentMix);
  } else if (u_gradientType == 6) {
    float radius = length(p);
    float angle = atan(p.y, p.x) / (PI * 2.0) + 0.5;
    float segments = 12.0;
    float fragmentStrength = saturateFloat(u_fragmentAmount / 1.5);
    float sector = fract(angle * segments);
    float t = clamp(
      (1.0 - radius * 1.55)
        + sector * mix(0.16, 0.35, fragmentStrength)
        + noiseValue * mix(0.02, 0.08, fragmentStrength),
      0.0,
      1.0
    );
    color = samplePalette(t);
  } else {
    float bands = max(2.0, floor(u_bandCount));
    float stripe = 0.5 + p.y * 1.2 + noiseValue * 0.08;
    float hard = floor(stripe * bands) / max(1.0, bands - 1.0);
    float smoothBand = smoothstep(-softness, 1.0 + softness, stripe);
    color = samplePalette(mix(hard, smoothBand, u_softness));
  }

  return color;
}

vec3 blendOverlay(vec3 base, vec3 layer) {
  vec3 low = 2.0 * base * layer;
  vec3 high = 1.0 - 2.0 * (1.0 - base) * (1.0 - layer);
  return mix(low, high, step(0.5, base));
}

vec3 applyBlendMode(vec3 base, vec3 layer, float mask) {
  float amount = clamp(u_blendStrength, 0.0, 1.4);
  vec3 result = base;

  if (u_blendMode == 0) {
    result = mix(base, layer, amount * 0.55);
  } else if (u_blendMode == 1) {
    result = mix(base, base * layer, amount);
  } else if (u_blendMode == 2) {
    result = mix(base, 1.0 - (1.0 - base) * (1.0 - layer), amount);
  } else if (u_blendMode == 3) {
    result = mix(base, blendOverlay(base, layer), amount);
  } else if (u_blendMode == 4) {
    result = mix(base, abs(base - layer), amount);
  } else if (u_blendMode == 5) {
    result = base * mix(vec3(0.16), vec3(1.0), smoothstep(0.25, 0.8, mask));
  } else if (u_blendMode == 6) {
    result = mix(base, layer, amount * 0.35 + abs(mask - 0.5));
  }

  return result;
}

vec3 renderSceneColor(
  vec2 uv,
  float time,
  float noisePhase,
  float movementPhase,
  float gradientPhase
) {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 local = uv - u_center;
  local.x *= aspect;
  local = applyMovement(local, movementPhase);
  local /= max(0.25, u_gradientScale);
  local = rotate2d(u_rotation) * local;

  vec3 noiseSampleValue = sampleNoise(local, uv, aspect, time, noisePhase);
  float noiseValue = noiseSampleValue.x;
  vec2 noiseVector = noiseSampleValue.yz;

  vec2 gradientLocal = local + noiseVector * (u_displacementStrength * 0.42);
  vec3 primary = sampleGradient(
    gradientLocal,
    time,
    gradientPhase,
    noiseValue,
    noiseVector
  );
  vec3 echo = sampleGradient(
    gradientLocal + noiseVector * (0.18 + u_meshWarp * 0.14),
    time + 0.7,
    gradientPhase + u_movementSpeed * 0.014,
    1.0 - noiseValue,
    -noiseVector
  );

  vec3 noiseLayer = mix(vec3(noiseValue), echo, 0.72);
  if (u_gradientType == 5) {
    float fieldAccent = saturateFloat(
      noiseValue +
        dot(noiseVector, vec2(0.85, -0.55)) * (0.38 + u_displacementStrength * 0.22) +
        (length(noiseVector) - 0.1) * (0.34 + u_meshWarp * 0.16)
    );
    vec3 fieldTint = samplePalette(fract(fieldAccent + gradientPhase * 0.06 + 0.14));
    noiseLayer = mix(fieldTint, echo, 0.58);
  }
  vec3 color = applyBlendMode(primary, noiseLayer, noiseValue);
  color = biasTowardPrimaryColor(color, noiseValue);
  color = applyColorAdjustments(color);

  float glow = pow(noiseValue, 1.8) * 0.12;
  color += glow * samplePalette(fract(noiseValue + time * 0.03));

  float vignette = 1.0 - smoothstep(0.55, 1.45, length(local));
  color = color * mix(0.65, 1.0, vignette);

  return color;
}

vec3 applySteppedGlitch(
  vec3 color,
  vec2 uv,
  float time,
  float noisePhase,
  float movementPhase,
  float gradientPhase,
  float glitchStrength
) {
  float glitchTime = floor(time * (4.0 + u_glitchSpeed * 14.0));
  float stripeCount = mix(18.0, 260.0, saturateFloat(u_glitchStripeDensity / 1.5));
  float stripeIndex = floor(uv.y * stripeCount);
  float sliceY = (stripeIndex + 0.5) / stripeCount;
  float stripeSeed = stripeIndex * 17.13 + glitchTime * 3.7 + u_noiseSeed * 0.23;

  float diagonalCoord = uv.x * 0.72 + (1.0 - uv.y) * 0.58;
  float diagonalCenter = mix(
    0.08,
    1.22,
    hash11(glitchTime * 0.17 + u_noiseSeed * 0.03)
  );
  float diagonalWidth = mix(0.09, 0.42, glitchStrength);
  float diagonalMask = 1.0 - smoothstep(
    diagonalWidth * 0.42,
    diagonalWidth,
    abs(diagonalCoord - diagonalCenter)
  );

  float stripeMask = smoothstep(
    0.66,
    0.995,
    hash11(stripeSeed) + diagonalMask * 0.45
  );
  float activeMask = max(stripeMask * 0.82, diagonalMask * 0.92) * glitchStrength;

  float xBlockCount = mix(
    180.0,
    34.0,
    clamp(glitchStrength * 0.85 + u_glitchSliceJitter * 0.25, 0.0, 1.0)
  );
  float offsetUnits = floor(
    (hash11(stripeSeed + 9.17) * 2.0 - 1.0) * (4.0 + u_glitchSliceJitter * 18.0)
  );
  float stripeOffset = offsetUnits / xBlockCount;
  vec2 steppedUv = vec2(
    clamp(floor((uv.x + stripeOffset) * xBlockCount) / xBlockCount, 0.0, 1.0),
    sliceY
  );
  vec3 shiftedColor = renderSceneColor(
    steppedUv,
    time,
    noisePhase,
    movementPhase,
    gradientPhase
  );
  float tearMix = activeMask * (0.34 + diagonalMask * 0.4);
  color = mix(color, shiftedColor, tearMix);

  float echoMask = activeMask * smoothstep(
    0.14,
    0.82,
    abs(shiftedColor.r - color.r) + abs(shiftedColor.b - color.b)
  );
  vec3 echoTint = vec3(1.0, 0.42, 0.1) * shiftedColor.r +
    vec3(0.9, 0.18, 0.55) * shiftedColor.b;
  color = mix(
    color,
    color + echoTint * 0.22,
    echoMask * (0.18 + u_glitchChannelSplit * 0.32)
  );

  float splitAmount = u_glitchChannelSplit * activeMask;
  color.r = mix(color.r, shiftedColor.r, splitAmount * 0.85);
  color.b = mix(color.b, shiftedColor.b, splitAmount * 0.6);

  float columnCount = mix(10.0, 74.0, saturateFloat(u_glitchStripeDensity / 1.5));
  float columnIndex = floor(uv.x * columnCount);
  float columnSeed = columnIndex * 11.31 + glitchTime * 0.73 + u_noiseSeed * 0.19;
  float verticalMask = smoothstep(0.84, 0.995, hash11(columnSeed) + diagonalMask * 0.2);
  float thinBar = step(fract(uv.x * columnCount * 2.4 + hash11(columnSeed + 4.1)), 0.16);
  float barMix = verticalMask * thinBar * (0.16 + activeMask * 0.72);
  color *= 1.0 - barMix;
  color += vec3(0.05, 0.1, 0.12) * barMix * 0.32;

  float scanBreak = step(0.9, fract(uv.y * stripeCount * 0.55 + hash11(stripeSeed + 1.7)));
  color *= 1.0 - scanBreak * activeMask * 0.08;

  float flashSeed = hash11(stripeSeed + 23.7 + floor(time * (10.0 + u_glitchSpeed * 8.0)));
  float flash = smoothstep(0.84, 1.0, flashSeed) * activeMask * u_glitchFlash;
  return mix(color, vec3(max(max(color.r, color.g), color.b)), flash * 0.28);
}

vec3 applyTearGlitch(
  vec3 color,
  vec2 uv,
  float time,
  float noisePhase,
  float movementPhase,
  float gradientPhase,
  float glitchStrength
) {
  float glitchTime = floor(time * (6.0 + u_glitchSpeed * 18.0));
  float burst = step(0.48, hash11(glitchTime + u_noiseSeed * 0.13));
  float stripeCount = mix(8.0, 180.0, saturateFloat(u_glitchStripeDensity / 1.5));
  float stripeIndex = floor(uv.y * stripeCount);
  float stripeSeed = stripeIndex * 17.13 + glitchTime * 3.7 + u_noiseSeed * 0.23;
  float stripeMask = smoothstep(
    0.78,
    0.995,
    hash11(stripeSeed) + burst * 0.22
  );
  float stripeOffset = (
    hash11(stripeSeed + 9.17) * 2.0 - 1.0
  ) * (0.015 + u_glitchSliceJitter * 0.09) * glitchStrength * stripeMask;
  vec2 shiftedUv = vec2(clamp(uv.x + stripeOffset, 0.0, 1.0), uv.y);
  vec3 shiftedColor = renderSceneColor(
    shiftedUv,
    time,
    noisePhase,
    movementPhase,
    gradientPhase
  );
  float tearMix = stripeMask * (0.3 + glitchStrength * 0.6);
  color = mix(color, shiftedColor, tearMix);

  float splitAmount = u_glitchChannelSplit * stripeMask * glitchStrength;
  color.rb += vec2(splitAmount * 0.13, -splitAmount * 0.08);

  float flashSeed = hash11(stripeSeed + 23.7 + floor(time * (14.0 + u_glitchSpeed * 10.0)));
  float flash = smoothstep(0.82, 1.0, flashSeed) * stripeMask * u_glitchFlash;
  return mix(color, vec3(max(max(color.r, color.g), color.b)), flash * 0.28);
}

void main() {
  float time = u_time;
  float noisePhase = u_noisePhase;
  float movementPhase = u_movementPhase;
  float gradientPhase = u_gradientPhase;
  vec2 uv = v_uv;

  vec3 color = renderSceneColor(
    uv,
    time,
    noisePhase,
    movementPhase,
    gradientPhase
  );

  float glitchStrength = saturateFloat(u_glitchEnabled) * saturateFloat(u_glitchAmount);
  if (glitchStrength > 0.001) {
    if (u_glitchType == 1) {
      color = applyTearGlitch(
        color,
        uv,
        time,
        noisePhase,
        movementPhase,
        gradientPhase,
        glitchStrength
      );
    } else {
      color = applySteppedGlitch(
        color,
        uv,
        time,
        noisePhase,
        movementPhase,
        gradientPhase,
        glitchStrength
      );
    }
  }

  float filmGrain = whiteNoise(gl_FragCoord.xy + time * 1.7, time) * 0.035;
  color += filmGrain * (0.18 + u_noiseOpacity * 0.18);

  gl_FragColor = vec4(saturateVec3(color), 1.0);
}
`
