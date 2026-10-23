// Soundscape layers and parameter ranges from leonarda4/Atmospheric-Soundscapes.
export const SOUNDSCAPES = [
  {
    id: "joyful",
    name: "Joyful",
    emoji: "☀️",
    description: "Bright major arpeggios with shimmering chorus and warm reverb",
    bar: "linear-gradient(90deg, #fac775, #ef9f27)",
    dot: "#ba7517",
    parts: [
      {
        id: "lead",
        label: "Lead",
        controls: [
          { id: "attack", label: "Attack", min: 0.01, max: 0.18, step: 0.005, default: 0.03, unit: "seconds" },
          { id: "release", label: "Release", min: 0.4, max: 2.4, step: 0.05, default: 1.2, unit: "seconds" },
          { id: "shimmer", label: "Shimmer", min: 0.08, max: 0.6, step: 0.01, default: 0.32, unit: "percent" },
        ],
      },
      {
        id: "pad",
        label: "Pad",
        controls: [
          { id: "attack", label: "Attack", min: 0.2, max: 2.8, step: 0.05, default: 0.9, unit: "seconds" },
          { id: "release", label: "Release", min: 1.4, max: 5.5, step: 0.1, default: 3.5, unit: "seconds" },
          { id: "level", label: "Level", min: -28, max: -8, step: 1, default: -17, unit: "db" },
        ],
      },
    ],
  },
  {
    id: "serene",
    name: "Serene",
    emoji: "🌊",
    description: "Slow-breathing pads with long reverb tails and gentle detuning",
    bar: "linear-gradient(90deg, #9fe1cb, #1d9e75)",
    dot: "#0f6e56",
    parts: [
      {
        id: "drone",
        label: "Drone",
        controls: [
          { id: "attack", label: "Attack", min: 0.4, max: 3.5, step: 0.05, default: 2, unit: "seconds" },
          { id: "release", label: "Release", min: 2, max: 7, step: 0.1, default: 4.5, unit: "seconds" },
          { id: "depth", label: "Depth", min: -30, max: -12, step: 1, default: -20, unit: "db" },
        ],
      },
      {
        id: "motion",
        label: "Motion",
        controls: [
          { id: "attack", label: "Attack", min: 0.05, max: 1.2, step: 0.01, default: 0.35, unit: "seconds" },
          { id: "echo", label: "Echo", min: 0.05, max: 0.6, step: 0.01, default: 0.28, unit: "percent" },
          { id: "trail", label: "Trail", min: 0.05, max: 0.6, step: 0.01, default: 0.25, unit: "percent" },
        ],
      },
    ],
  },
  {
    id: "sad",
    name: "Sad",
    emoji: "🌧️",
    description: "Minor key descending lines, warm tape delay, and slow vibrato",
    bar: "linear-gradient(90deg, #b5d4f4, #378add)",
    dot: "#185fa5",
    parts: [
      {
        id: "melody",
        label: "Melody",
        controls: [
          { id: "attack", label: "Attack", min: 0.02, max: 0.4, step: 0.01, default: 0.12, unit: "seconds" },
          { id: "wobble", label: "Wobble", min: 0, max: 0.5, step: 0.01, default: 0.15, unit: "percent" },
          { id: "echo", label: "Echo", min: 0.05, max: 0.6, step: 0.01, default: 0.34, unit: "percent" },
        ],
      },
      {
        id: "pad",
        label: "Pad",
        controls: [
          { id: "attack", label: "Attack", min: 0.3, max: 2.2, step: 0.05, default: 1.2, unit: "seconds" },
          { id: "release", label: "Release", min: 1.5, max: 6, step: 0.1, default: 4, unit: "seconds" },
          { id: "warmth", label: "Warmth", min: -28, max: -10, step: 1, default: -18, unit: "db" },
        ],
      },
    ],
  },
  {
    id: "determined",
    name: "Determined",
    emoji: "⚡",
    description: "Driving ostinato, stacked fifths, and percussive pulse",
    bar: "linear-gradient(90deg, #c0dd97, #639922)",
    dot: "#3b6d11",
    parts: [
      {
        id: "bass",
        label: "Bass",
        controls: [
          { id: "attack", label: "Attack", min: 0.001, max: 0.08, step: 0.001, default: 0.01, unit: "seconds" },
          { id: "punch", label: "Punch", min: 1.5, max: 5, step: 0.1, default: 3, unit: "octaves" },
          { id: "release", label: "Release", min: 0.15, max: 0.9, step: 0.01, default: 0.45, unit: "seconds" },
        ],
      },
      {
        id: "lead",
        label: "Lead",
        controls: [
          { id: "attack", label: "Attack", min: 0.005, max: 0.12, step: 0.005, default: 0.02, unit: "seconds" },
          { id: "sustain", label: "Sustain", min: 0.1, max: 0.55, step: 0.01, default: 0.35, unit: "percent" },
          { id: "release", label: "Release", min: 0.2, max: 1.5, step: 0.05, default: 0.7, unit: "seconds" },
        ],
      },
      {
        id: "percussion",
        label: "Perc",
        controls: [
          { id: "kickDecay", label: "Kick decay", min: 0.12, max: 0.6, step: 0.01, default: 0.3, unit: "seconds" },
          { id: "snareDecay", label: "Snare decay", min: 0.05, max: 0.28, step: 0.01, default: 0.12, unit: "seconds" },
          { id: "hatTone", label: "Hat tone", min: 140, max: 420, step: 1, default: 220, unit: "hz" },
        ],
      },
    ],
  },
  {
    id: "angry",
    name: "Angry",
    emoji: "🔥",
    description: "Distorted tritones, aggressive attack, and industrial noise",
    bar: "linear-gradient(90deg, #f7c1c1, #e24b4a)",
    dot: "#a32d2d",
    parts: [
      {
        id: "riff",
        label: "Riff",
        controls: [
          { id: "attack", label: "Attack", min: 0.001, max: 0.05, step: 0.001, default: 0.01, unit: "seconds" },
          { id: "bite", label: "Bite", min: 2, max: 6, step: 0.1, default: 4.5, unit: "octaves" },
          { id: "release", label: "Release", min: 0.08, max: 0.5, step: 0.01, default: 0.25, unit: "seconds" },
        ],
      },
      {
        id: "noise",
        label: "Noise",
        controls: [
          { id: "attack", label: "Attack", min: 0.001, max: 0.08, step: 0.001, default: 0.001, unit: "seconds" },
          { id: "decay", label: "Decay", min: 0.05, max: 0.45, step: 0.01, default: 0.18, unit: "seconds" },
          { id: "level", label: "Level", min: -32, max: -10, step: 1, default: -22, unit: "db" },
        ],
      },
    ],
  },
  {
    id: "fearful",
    name: "Fearful",
    emoji: "🌑",
    description: "Dissonant clusters, unpredictable tremolo, and deep sub bass",
    bar: "linear-gradient(90deg, #cecbf6, #534ab7)",
    dot: "#3c3489",
    parts: [
      {
        id: "cluster",
        label: "Cluster",
        controls: [
          { id: "attack", label: "Attack", min: 0.05, max: 0.8, step: 0.01, default: 0.3, unit: "seconds" },
          { id: "release", label: "Release", min: 1.4, max: 5.5, step: 0.1, default: 3.4, unit: "seconds" },
          { id: "tremolo", label: "Tremolo", min: 0.1, max: 0.9, step: 0.01, default: 0.5, unit: "percent" },
        ],
      },
      {
        id: "sub",
        label: "Sub",
        controls: [
          { id: "attack", label: "Attack", min: 0.01, max: 0.2, step: 0.005, default: 0.05, unit: "seconds" },
          { id: "sweep", label: "Sweep", min: 0.5, max: 3, step: 0.1, default: 1.5, unit: "octaves" },
          { id: "release", label: "Release", min: 0.5, max: 2.5, step: 0.05, default: 1.6, unit: "seconds" },
        ],
      },
      {
        id: "stabs",
        label: "Stabs",
        controls: [
          { id: "attack", label: "Attack", min: 0.001, max: 0.08, step: 0.001, default: 0.01, unit: "seconds" },
          { id: "release", label: "Release", min: 0.4, max: 1.8, step: 0.05, default: 1.1, unit: "seconds" },
          { id: "chance", label: "Chance", min: 0.15, max: 0.95, step: 0.01, default: 0.65, unit: "percent" },
        ],
      },
    ],
  },
];

export function formatControlValue(control, value) {
  switch (control.unit) {
    case "seconds":
      return `${value < 0.01 ? value.toFixed(3) : value < 1 ? value.toFixed(2) : value.toFixed(1)}s`;
    case "percent":
      return `${Math.round(value * 100)}%`;
    case "db":
      return `${Math.round(value)} dB`;
    case "hz":
      return `${Math.round(value)} Hz`;
    case "octaves":
      return `${value.toFixed(1)} oct`;
    default:
      return String(value);
  }
}

