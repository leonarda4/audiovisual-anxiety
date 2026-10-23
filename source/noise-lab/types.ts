export type NoiseType =
  | "white"
  | "value"
  | "perlin"
  | "simplex"
  | "fbm"
  | "turbulence"
  | "ridge"
  | "curl"
  | "domainWarp"
  | "worley"
  | "voronoi"
  | "joy"
  | "anger"
  | "sadness"
  | "serenity"
  | "determination"
  | "blueGrain";

export type NoiseParamKey =
  | "scale"
  | "speed"
  | "intensity"
  | "contrast"
  | "opacity"
  | "seed"
  | "timeInfluence"
  | "grainSize"
  | "flickerAmount"
  | "threshold"
  | "cellSize"
  | "smoothness"
  | "blur"
  | "amplitude"
  | "directionX"
  | "directionY"
  | "octaves"
  | "lacunarity"
  | "gain"
  | "turbulenceStrength"
  | "sharpness"
  | "ridgeSharpness"
  | "compression"
  | "flowStrength"
  | "particleDistortionStrength"
  | "swirlAmount"
  | "directionInstability"
  | "baseScale"
  | "warpScale"
  | "warpStrength"
  | "warpSpeed"
  | "iterations"
  | "cellDensity"
  | "edgeSoftness"
  | "jitter"
  | "invert"
  | "borderThickness"
  | "fragmentation"
  | "grainDensity"
  | "ditherStrength";

export type GradientType =
  | "linear"
  | "radial"
  | "conic"
  | "mesh"
  | "noiseDisplaced"
  | "fragmentedRadial"
  | "band";

export type GradientMovement =
  | "static"
  | "expand"
  | "contract"
  | "moveLeft"
  | "moveRight"
  | "moveUp"
  | "moveDown"
  | "rotateCw"
  | "rotateCcw"
  | "pulse"
  | "drift";

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "difference"
  | "mask"
  | "displace";

export type GradientParamKey =
  | "gradientScale"
  | "movementSpeed"
  | "displacementStrength"
  | "centerX"
  | "centerY"
  | "rotation"
  | "softness"
  | "bandCount"
  | "meshWarp"
  | "fragmentAmount";

export type ColorParamKey =
  | "blendStrength"
  | "saturation"
  | "brightness";

export type ColorwayId =
  | "joy"
  | "sadness"
  | "anger"
  | "fear"
  | "determination"
  | "neutralStudy"
  | "happyJoy"
  | "sereneCalm"
  | "sadEmotion"
  | "fearEmotion"
  | "angerEmotion"
  | "determinationEmotion"
  | "custom";

export type SelectOption<T extends string | number> = {
  label: string;
  value: T;
};

export type RangeControlDefinition<TKey extends string> = {
  key: TKey;
  kind: "range";
  label: string;
  min: number;
  max: number;
  step: number;
  helperText?: string;
};

export type ToggleControlDefinition<TKey extends string> = {
  key: TKey;
  kind: "toggle";
  label: string;
  helperText?: string;
};

export type SelectControlDefinition<TKey extends string> = {
  key: TKey;
  kind: "select";
  label: string;
  options: SelectOption<string | number>[];
  helperText?: string;
};

export type ControlDefinition<TKey extends string> =
  | RangeControlDefinition<TKey>
  | ToggleControlDefinition<TKey>
  | SelectControlDefinition<TKey>;

export type NoiseParamValues = Record<NoiseParamKey, number>;
export type GradientParamValues = Record<GradientParamKey, number>;
export type ColorParamValues = Record<ColorParamKey, number>;

export interface NoiseConfig {
  type: NoiseType;
  params: NoiseParamValues;
}

export interface GradientConfig {
  type: GradientType;
  movement: GradientMovement;
  params: GradientParamValues;
}

export interface ColorConfig {
  colorwayId: ColorwayId;
  customStops: string[];
  editedStops: string[];
  blendMode: BlendMode;
  params: ColorParamValues;
}

export interface PresetTab {
  id: string;
  name: string;
  createdAt: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  createdAt: string;
  noise: NoiseConfig;
  gradient: GradientConfig;
  color: ColorConfig;
  tabId?: string;
  thumbnail?: string;
}

export interface PresetLibrary {
  tabs: PresetTab[];
  presets: SavedPreset[];
}

export interface NoiseDefinition {
  key: NoiseType;
  label: string;
  description: string;
  emotionalHint: string;
  controls: ControlDefinition<NoiseParamKey>[];
}

export interface ColorwayDefinition {
  key: ColorwayId;
  label: string;
  description: string;
  colors: string[];
  primaryBias?: number;
}

export type PhotoExportFormat = "png" | "jpeg";

export interface ExportSize {
  width: number;
  height: number;
}

export interface PhotoExportRequest extends ExportSize {
  format: PhotoExportFormat;
}

export interface VideoExportRequest extends ExportSize {
  durationSeconds: number;
}
