import * as Tone from "tone";
import { SOUNDSCAPES } from "./data.js";

// Original instruments, harmony, rhythms, and ranges:
// https://github.com/leonarda4/Atmospheric-Soundscapes
const TRANSPORT_BPM = 76;
const START_DELAY = "+0.05";

function ramp(signal, value, seconds = 0.2) {
  signal.rampTo(value, seconds);
}

function stopLoop(loop) {
  loop.stop(0);
}

function releaseVoice(voice) {
  if (typeof voice.releaseAll === "function") {
    voice.releaseAll();
  } else if (typeof voice.triggerRelease === "function") {
    voice.triggerRelease();
  }
}

function randomItem(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function createSession(destination, onDispose) {
  const context = destination.context;
  const output = new Tone.Gain({ context, gain: 0 }).connect(destination);
  const nodes = [output];
  const parts = new Map();
  const cleanup = [];
  let stopped = false;
  let disposed = false;
  let disposeTimer;

  const session = {
    output,
    add(node) {
      nodes.push(node);
      return node;
    },
    addCleanup(task) {
      cleanup.push(task);
    },
    createPart(id, destinationNode) {
      const gate = session.add(new Tone.Gain({ context, gain: 1 }).connect(destinationNode));
      const controls = new Map();
      const part = {
        id,
        gate,
        enabled: true,
        onDisable() {},
        bindControl(controlId, apply) {
          controls.set(controlId, apply);
          return this;
        },
        setControlValue(controlId, value) {
          controls.get(controlId)?.(value);
        },
      };
      parts.set(id, part);
      return part;
    },
    fadeIn() {
      ramp(output.gain, 1, 0.45);
    },
    setPartEnabled(id, enabled) {
      const part = parts.get(id);
      if (!part || stopped || disposed) return;
      part.enabled = enabled;
      ramp(part.gate.gain, enabled ? 1 : 0, 0.12);
      if (!enabled) part.onDisable();
    },
    setPartControlValue(id, controlId, value) {
      if (!stopped && !disposed) parts.get(id)?.setControlValue(controlId, value);
    },
    stop() {
      if (stopped || disposed) return;
      stopped = true;
      cleanup.forEach((task) => task());
      parts.forEach((part) => {
        part.enabled = false;
        part.onDisable();
      });
      ramp(output.gain, 0, 0.45);
      disposeTimer = setTimeout(() => session.dispose(), 900);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(disposeTimer);
      parts.forEach((part) => { part.enabled = false; });
      [...nodes].reverse().forEach((node) => node.dispose());
      onDispose(session);
    },
  };
  return session;
}

function setToneOptions(node, options) {
  node.set(options);
}

function bindEnvelopeControl(part, controlId, node, parameter) {
  part.bindControl(controlId, (value) => {
    setToneOptions(node, { envelope: { [parameter]: value } });
  });
}

function bindFilterEnvelopeControl(part, controlId, node, parameter) {
  part.bindControl(controlId, (value) => {
    setToneOptions(node, { filterEnvelope: { [parameter]: value } });
  });
}

function bindVolumeControl(part, controlId, node, seconds = 0.12) {
  part.bindControl(controlId, (value) => ramp(node.volume, value, seconds));
}

function bindSignalControl(part, controlId, signal, seconds = 0.12) {
  part.bindControl(controlId, (value) => ramp(signal, value, seconds));
}

function buildJoyful(destination, makeSession) {
  const context = destination.context;
  const session = makeSession(destination);
  const reverb = session.add(new Tone.Reverb({ context, decay: 3.8, wet: 0.42 }).connect(session.output));
  const chorus = session.add(new Tone.Chorus({ context, frequency: 3.5, delayTime: 2.5, depth: 0.32 }).connect(reverb));
  chorus.start();

  const leadPart = session.createPart("lead", chorus);
  const padPart = session.createPart("pad", reverb);

  const lead = session.add(
    new Tone.PolySynth({ context, voice: Tone.Synth, options: {
      oscillator: { type: "triangle8" },
      envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 1.2 },
      volume: -12,
    } }).connect(leadPart.gate),
  );

  const pad = session.add(
    new Tone.PolySynth({ context, voice: Tone.Synth, options: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.9, decay: 0.6, sustain: 0.65, release: 3.5 },
      volume: -17,
    } }).connect(padPart.gate),
  );

  bindEnvelopeControl(leadPart, "attack", lead, "attack");
  bindEnvelopeControl(leadPart, "release", lead, "release");
  bindSignalControl(leadPart, "shimmer", chorus.wet);
  bindEnvelopeControl(padPart, "attack", pad, "attack");
  bindEnvelopeControl(padPart, "release", pad, "release");
  bindVolumeControl(padPart, "level", pad);

  const arpNotes = ["C5", "E5", "G5", "E5", "A4", "C5", "E5", "C5", "F4", "A4", "C5", "A4", "G4", "B4", "D5", "B4"];
  const padChords = [
    ["C3", "G3", "E4", "B4"],
    ["A2", "E3", "C4", "G4"],
    ["F2", "C3", "A3", "E4"],
    ["G2", "D3", "B3", "F4"],
  ];

  let arpStep = 0;
  let padStep = 0;

  const leadLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!leadPart.enabled) {
        return;
      }

      lead.triggerAttackRelease(arpNotes[arpStep % arpNotes.length], "8n", time, 0.9);
      arpStep += 1;
    }, interval: "8n" }),
  );

  const padLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!padPart.enabled) {
        return;
      }

      pad.triggerAttackRelease(padChords[padStep % padChords.length], "2m", time, 0.5);
      padStep += 1;
    }, interval: "1m" }),
  );

  leadPart.onDisable = () => releaseVoice(lead);
  padPart.onDisable = () => releaseVoice(pad);

  leadLoop.start(START_DELAY);
  padLoop.start(START_DELAY);
  session.addCleanup(() => stopLoop(leadLoop));
  session.addCleanup(() => stopLoop(padLoop));

  return session;
}

function buildSerene(destination, makeSession) {
  const context = destination.context;
  const session = makeSession(destination);
  const reverb = session.add(new Tone.Reverb({ context, decay: 6.2, wet: 0.7 }).connect(session.output));
  const delay = session.add(new Tone.FeedbackDelay({ context, delayTime: "4n", feedback: 0.28 }).connect(reverb));
  delay.wet.value = 0.25;

  const dronePart = session.createPart("drone", reverb);
  const motionPart = session.createPart("motion", delay);

  const drone = session.add(
    new Tone.PolySynth({ context, voice: Tone.Synth, options: {
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4.5 },
      volume: -20,
    } }).connect(dronePart.gate),
  );

  const motion = session.add(
    new Tone.PolySynth({ context, voice: Tone.Synth, options: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.35, decay: 0.2, sustain: 0.3, release: 2.2 },
      volume: -23,
    } }).connect(motionPart.gate),
  );

  bindEnvelopeControl(dronePart, "attack", drone, "attack");
  bindEnvelopeControl(dronePart, "release", drone, "release");
  bindVolumeControl(dronePart, "depth", drone);
  bindEnvelopeControl(motionPart, "attack", motion, "attack");
  bindSignalControl(motionPart, "echo", delay.feedback);
  bindSignalControl(motionPart, "trail", delay.wet);

  const droneChords = [
    ["C3", "G3", "D4"],
    ["A2", "E3", "B3"],
    ["F2", "C3", "G3"],
    ["G2", "D3", "A3"],
  ];

  const motionNotes = ["G4", "A4", "C5", "E5", "D5", "C5", "A4", "G4"];

  let droneStep = 0;
  let motionStep = 0;

  const droneLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!dronePart.enabled) {
        return;
      }

      drone.triggerAttackRelease(droneChords[droneStep % droneChords.length], "3m", time, 0.45);
      droneStep += 1;
    }, interval: "2m" }),
  );

  const motionLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!motionPart.enabled) {
        return;
      }

      motion.triggerAttackRelease(motionNotes[motionStep % motionNotes.length], "1n", time, 0.34);
      motionStep += 1;
    }, interval: "2n" }),
  );

  dronePart.onDisable = () => releaseVoice(drone);
  motionPart.onDisable = () => releaseVoice(motion);

  droneLoop.start(START_DELAY);
  motionLoop.start(START_DELAY);
  session.addCleanup(() => stopLoop(droneLoop));
  session.addCleanup(() => stopLoop(motionLoop));

  return session;
}

function buildSad(destination, makeSession) {
  const context = destination.context;
  const session = makeSession(destination);
  const reverb = session.add(new Tone.Reverb({ context, decay: 5, wet: 0.5 }).connect(session.output));
  const delay = session.add(new Tone.FeedbackDelay({ context, delayTime: "8n", feedback: 0.34 }).connect(reverb));
  const vibrato = session.add(new Tone.Vibrato({ context, frequency: 4.5, depth: 0.15 }).connect(delay));

  delay.wet.value = 0.38;

  const melodyPart = session.createPart("melody", vibrato);
  const padPart = session.createPart("pad", reverb);

  const melody = session.add(
    new Tone.Synth({ context,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.12, decay: 0.4, sustain: 0.3, release: 1.8 },
      volume: -16,
    }).connect(melodyPart.gate),
  );

  const pad = session.add(
    new Tone.PolySynth({ context, voice: Tone.Synth, options: {
      oscillator: { type: "sine" },
      envelope: { attack: 1.2, decay: 0.5, sustain: 0.65, release: 4 },
      volume: -18,
    } }).connect(padPart.gate),
  );

  bindEnvelopeControl(melodyPart, "attack", melody, "attack");
  bindSignalControl(melodyPart, "wobble", vibrato.depth);
  bindSignalControl(melodyPart, "echo", delay.feedback);
  bindEnvelopeControl(padPart, "attack", pad, "attack");
  bindEnvelopeControl(padPart, "release", pad, "release");
  bindVolumeControl(padPart, "warmth", pad);

  const melodyNotes = ["A4", "G4", "E4", "D4", "C4", "E4", "D4", "B3"];
  const padChords = [
    ["A3", "C4", "E4"],
    ["F3", "A3", "C4"],
    ["C3", "E3", "G3"],
    ["G3", "B3", "D4"],
  ];

  let melodyStep = 0;
  let padStep = 0;

  const melodyLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!melodyPart.enabled) {
        return;
      }

      melody.triggerAttackRelease(melodyNotes[melodyStep % melodyNotes.length], "2n", time, 0.68);
      melodyStep += 1;
    }, interval: "2n" }),
  );

  const padLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!padPart.enabled) {
        return;
      }

      pad.triggerAttackRelease(padChords[padStep % padChords.length], "2m", time, 0.42);
      padStep += 1;
    }, interval: "1m" }),
  );

  melodyPart.onDisable = () => releaseVoice(melody);
  padPart.onDisable = () => releaseVoice(pad);

  melodyLoop.start(START_DELAY);
  padLoop.start(START_DELAY);
  session.addCleanup(() => stopLoop(melodyLoop));
  session.addCleanup(() => stopLoop(padLoop));

  return session;
}

function buildDetermined(destination, makeSession) {
  const context = destination.context;
  const session = makeSession(destination);
  const reverb = session.add(new Tone.Reverb({ context, decay: 2.2, wet: 0.22 }).connect(session.output));

  const bassPart = session.createPart("bass", session.output);
  const leadPart = session.createPart("lead", reverb);
  const percussionPart = session.createPart("percussion", session.output);

  const bass = session.add(
    new Tone.MonoSynth({ context,
      oscillator: { type: "square" },
      filter: { Q: 2, type: "lowpass", rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0.35, release: 0.45 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.25,
        release: 0.5,
        baseFrequency: 80,
        octaves: 3,
      },
      volume: -13,
    }).connect(bassPart.gate),
  );

  const lead = session.add(
    new Tone.PolySynth({ context, voice: Tone.Synth, options: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.02, decay: 0.14, sustain: 0.35, release: 0.7 },
      volume: -20,
    } }).connect(leadPart.gate),
  );

  const kick = session.add(
    new Tone.MembraneSynth({ context,
      volume: -16,
      octaves: 5,
      pitchDecay: 0.03,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.08 },
    }).connect(percussionPart.gate),
  );

  const snare = session.add(
    new Tone.NoiseSynth({ context,
      volume: -22,
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    }).connect(percussionPart.gate),
  );

  const hat = session.add(
    new Tone.MetalSynth({ context,
      volume: -26,
      frequency: 220,
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 4.1,
      modulationIndex: 18,
      resonance: 2000,
      octaves: 1.5,
    }).connect(percussionPart.gate),
  );

  bindEnvelopeControl(bassPart, "attack", bass, "attack");
  bindFilterEnvelopeControl(bassPart, "punch", bass, "octaves");
  bindEnvelopeControl(bassPart, "release", bass, "release");
  bindEnvelopeControl(leadPart, "attack", lead, "attack");
  bindEnvelopeControl(leadPart, "sustain", lead, "sustain");
  bindEnvelopeControl(leadPart, "release", lead, "release");
  percussionPart.bindControl("kickDecay", (value) => {
    setToneOptions(kick, { envelope: { decay: value } });
  });
  percussionPart.bindControl("snareDecay", (value) => {
    setToneOptions(snare, { envelope: { decay: value } });
  });
  percussionPart.bindControl("hatTone", (value) => {
    setToneOptions(hat, { frequency: value });
  });

  const bassNotes = ["C2", "C2", "G1", "C2", "Eb2", "Eb2", "Bb1", "C2"];
  const leadChords = [
    ["G4", "D5"],
    ["G4", "D5"],
    ["Bb4", "F5"],
    ["C5", "G5"],
  ];

  let bassStep = 0;
  let leadStep = 0;
  let percussionStep = 0;

  const bassLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!bassPart.enabled) {
        return;
      }

      bass.triggerAttackRelease(bassNotes[bassStep % bassNotes.length], "8n", time, 0.86);
      bassStep += 1;
    }, interval: "8n" }),
  );

  const leadLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!leadPart.enabled) {
        return;
      }

      lead.triggerAttackRelease(leadChords[leadStep % leadChords.length], "8n", time, 0.52);
      leadStep += 1;
    }, interval: "4n" }),
  );

  const percussionLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!percussionPart.enabled) {
        return;
      }

      const step = percussionStep % 8;

      if (step === 0 || step === 4) {
        kick.triggerAttackRelease("C1", "8n", time, 0.9);
      }

      if (step === 2 || step === 6) {
        snare.triggerAttackRelease("16n", time, 0.5);
      }

      // Tone 15 requires the hat frequency before its note duration.
      hat.triggerAttackRelease(hat.frequency.value, "32n", time, step % 2 === 0 ? 0.32 : 0.2);
      percussionStep += 1;
    }, interval: "8n" }),
  );

  bassPart.onDisable = () => releaseVoice(bass);
  leadPart.onDisable = () => releaseVoice(lead);

  bassLoop.start(START_DELAY);
  leadLoop.start(START_DELAY);
  percussionLoop.start(START_DELAY);
  session.addCleanup(() => stopLoop(bassLoop));
  session.addCleanup(() => stopLoop(leadLoop));
  session.addCleanup(() => stopLoop(percussionLoop));

  return session;
}

function buildAngry(destination, makeSession) {
  const context = destination.context;
  const session = makeSession(destination);
  const filter = session.add(new Tone.Filter({ context, frequency: 1600, type: "lowpass" }).connect(session.output));
  const distortion = session.add(new Tone.Distortion({ context, distortion: 0.55 }).connect(filter));
  const delay = session.add(new Tone.FeedbackDelay({ context, delayTime: "8n", feedback: 0.18 }).connect(distortion));
  delay.wet.value = 0.18;

  const riffPart = session.createPart("riff", delay);
  const noisePart = session.createPart("noise", distortion);

  const riff = session.add(
    new Tone.MonoSynth({ context,
      oscillator: { type: "sawtooth" },
      filter: { Q: 3, type: "lowpass", rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.12, sustain: 0.25, release: 0.25 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.16,
        sustain: 0.1,
        release: 0.2,
        baseFrequency: 120,
        octaves: 4.5,
      },
      volume: -18,
    }).connect(riffPart.gate),
  );

  const noise = session.add(
    new Tone.NoiseSynth({ context,
      volume: -22,
      noise: { type: "brown" },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    }).connect(noisePart.gate),
  );

  bindEnvelopeControl(riffPart, "attack", riff, "attack");
  bindFilterEnvelopeControl(riffPart, "bite", riff, "octaves");
  bindEnvelopeControl(riffPart, "release", riff, "release");
  bindEnvelopeControl(noisePart, "attack", noise, "attack");
  bindEnvelopeControl(noisePart, "decay", noise, "decay");
  bindVolumeControl(noisePart, "level", noise);

  const riffNotes = ["C3", "Gb3", "C3", "Eb3", "Gb3", "C3", "Bb2", "Gb3"];
  let riffStep = 0;
  let noiseStep = 0;

  const riffLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!riffPart.enabled) {
        return;
      }

      riff.triggerAttackRelease(riffNotes[riffStep % riffNotes.length], "8n", time, 0.82);
      riffStep += 1;
    }, interval: "8n" }),
  );

  const noiseLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!noisePart.enabled) {
        return;
      }

      noise.triggerAttackRelease(noiseStep % 2 === 0 ? "8n" : "16n", time, 0.42);
      noiseStep += 1;
    }, interval: "4n" }),
  );

  riffPart.onDisable = () => releaseVoice(riff);

  riffLoop.start(START_DELAY);
  noiseLoop.start(START_DELAY);
  session.addCleanup(() => stopLoop(riffLoop));
  session.addCleanup(() => stopLoop(noiseLoop));

  return session;
}

function buildFearful(destination, makeSession) {
  const context = destination.context;
  const session = makeSession(destination);
  const reverb = session.add(new Tone.Reverb({ context, decay: 7.2, wet: 0.78 }).connect(session.output));
  const tremolo = session.add(new Tone.Tremolo({ context, frequency: 4, depth: 0.5 }).connect(reverb));
  tremolo.start();

  const clusterPart = session.createPart("cluster", tremolo);
  const subPart = session.createPart("sub", session.output);
  const stabsPart = session.createPart("stabs", reverb);

  const cluster = session.add(
    new Tone.PolySynth({ context, voice: Tone.Synth, options: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.3, decay: 0.3, sustain: 0.45, release: 3.4 },
      volume: -24,
    } }).connect(clusterPart.gate),
  );

  const sub = session.add(
    new Tone.MonoSynth({ context,
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.25, sustain: 0.75, release: 1.6 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.2,
        release: 0.8,
        baseFrequency: 50,
        octaves: 1.5,
      },
      volume: -16,
    }).connect(subPart.gate),
  );

  const stabs = session.add(
    new Tone.Synth({ context,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 1.1 },
      volume: -20,
    }).connect(stabsPart.gate),
  );

  let stabChance = 0.65;

  bindEnvelopeControl(clusterPart, "attack", cluster, "attack");
  bindEnvelopeControl(clusterPart, "release", cluster, "release");
  bindSignalControl(clusterPart, "tremolo", tremolo.depth);
  bindEnvelopeControl(subPart, "attack", sub, "attack");
  bindFilterEnvelopeControl(subPart, "sweep", sub, "octaves");
  bindEnvelopeControl(subPart, "release", sub, "release");
  bindEnvelopeControl(stabsPart, "attack", stabs, "attack");
  bindEnvelopeControl(stabsPart, "release", stabs, "release");
  stabsPart.bindControl("chance", (value) => {
    stabChance = value;
  });

  const clusterChords = [
    ["C4", "Db4", "Gb4"],
    ["B3", "C4", "F4"],
    ["A3", "Bb3", "E4"],
    ["C4", "F#4", "B4"],
  ];

  const subNotes = ["C2", "Bb1", "Ab1", "B1"];
  const stabNotes = ["C5", "Db5", "F#5", "A4", "B4"];

  let clusterStep = 0;
  let subStep = 0;

  const clusterLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!clusterPart.enabled) {
        return;
      }

      cluster.triggerAttackRelease(clusterChords[clusterStep % clusterChords.length], "2m", time, 0.35);
      clusterStep += 1;
    }, interval: "1m" }),
  );

  const subLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!subPart.enabled) {
        return;
      }

      sub.triggerAttackRelease(subNotes[subStep % subNotes.length], "1m", time, 0.82);
      subStep += 1;
    }, interval: "1m" }),
  );

  const stabsLoop = session.add(
    new Tone.Loop({ context, callback: (time) => {
      if (!stabsPart.enabled || Math.random() > stabChance) {
        return;
      }

      stabs.triggerAttackRelease(randomItem(stabNotes), "8n", time, 0.52);
    }, interval: "2n" }),
  );

  clusterPart.onDisable = () => releaseVoice(cluster);
  subPart.onDisable = () => releaseVoice(sub);
  stabsPart.onDisable = () => releaseVoice(stabs);

  clusterLoop.start(START_DELAY);
  subLoop.start(START_DELAY);
  stabsLoop.start(START_DELAY);
  session.addCleanup(() => stopLoop(clusterLoop));
  session.addCleanup(() => stopLoop(subLoop));
  session.addCleanup(() => stopLoop(stabsLoop));

  return session;
}

const BUILDERS = {
  joyful: buildJoyful,
  serene: buildSerene,
  sad: buildSad,
  determined: buildDetermined,
  angry: buildAngry,
  fearful: buildFearful,
};

/** Owns its audio graph and optional native context, unlocked on the play gesture. */
export function createSoundscapeEngine(audioContext) {
  const context = audioContext
    ? new Tone.Context({ context: audioContext })
    : new Tone.Context();
  const transport = context.transport;
  transport.bpm.value = TRANSPORT_BPM;
  const limiter = new Tone.Limiter({ context, threshold: -2 }).connect(context.destination);
  const output = new Tone.Gain({ context, gain: 0.9 }).connect(limiter);
  const active = new Map();
  const sessions = new Set();
  const pending = new Map();
  let disposed = false;

  const preferencesById = new Map(SOUNDSCAPES.map((sound) => [sound.id, {
    enabled: Object.fromEntries(sound.parts.map((part) => [part.id, true])),
    controls: Object.fromEntries(sound.parts.map((part) => [part.id,
      Object.fromEntries(part.controls.map((control) => [control.id, control.default])),
    ])),
  }]));

  function controlDefinition(soundId, partId, controlId) {
    return SOUNDSCAPES.find((sound) => sound.id === soundId)?.parts
      .find((part) => part.id === partId)?.controls.find((control) => control.id === controlId);
  }

  function applyPreferences(soundId, session) {
    const preferences = preferencesById.get(soundId);
    Object.entries(preferences.enabled).forEach(([partId, enabled]) => {
      session.setPartEnabled(partId, enabled);
    });
    Object.entries(preferences.controls).forEach(([partId, controls]) => {
      Object.entries(controls).forEach(([controlId, value]) => {
        session.setPartControlValue(partId, controlId, value);
      });
    });
  }

  const engine = {
    async start(soundId, preferences = {}) {
      if (disposed) return false;
      const build = Object.hasOwn(BUILDERS, soundId) ? BUILDERS[soundId] : null;
      if (!build) throw new RangeError(`Unknown soundscape: ${soundId}`);
      Object.entries(preferences.enabled ?? {}).forEach(([partId, enabled]) => {
        engine.setPartEnabled(soundId, partId, enabled);
      });
      Object.entries(preferences.controls ?? {}).forEach(([partId, controls]) => {
        Object.entries(controls).forEach(([controlId, value]) => {
          engine.setControl(soundId, partId, controlId, value);
        });
      });
      // A newer play gesture supersedes every pending atmosphere, including
      // requests still waiting for the browser to unlock its audio context.
      pending.clear();
      if (active.has(soundId)) return true;

      engine.stopAll();
      // Disconnect the previous atmosphere and any fading tails before the
      // next one starts so switching never layers two soundscapes together.
      [...sessions].forEach((previous) => previous.dispose());

      const request = Symbol(soundId);
      pending.set(soundId, request);
      let session;
      try {
        await context.resume();
        if (disposed || pending.get(soundId) !== request) return false;
        session = build(output, (destination) => {
          session = createSession(destination, (ended) => sessions.delete(ended));
          sessions.add(session);
          return session;
        });
        applyPreferences(soundId, session);
        active.set(soundId, session);
        if (transport.state !== "started") transport.start();
        session.fadeIn();
        return true;
      } catch (error) {
        session?.dispose();
        if (active.get(soundId) === session) active.delete(soundId);
        if (disposed || pending.get(soundId) !== request) return false;
        throw error;
      } finally {
        if (pending.get(soundId) === request) pending.delete(soundId);
      }
    },
    stop(soundId) {
      pending.delete(soundId);
      active.get(soundId)?.stop();
      active.delete(soundId);
      if (!disposed && active.size === 0) transport.stop();
    },
    setPartEnabled(soundId, partId, enabled) {
      if (disposed) return;
      const preferences = preferencesById.get(soundId);
      if (!preferences || !(partId in preferences.enabled)) return;
      preferences.enabled[partId] = Boolean(enabled);
      active.get(soundId)?.setPartEnabled(partId, Boolean(enabled));
    },
    setControl(soundId, partId, controlId, value) {
      if (disposed || !Number.isFinite(value)) return;
      const control = controlDefinition(soundId, partId, controlId);
      if (!control) return;
      const clamped = Math.min(control.max, Math.max(control.min, value));
      preferencesById.get(soundId).controls[partId][controlId] = clamped;
      active.get(soundId)?.setPartControlValue(partId, controlId, clamped);
    },
    setVolume(value) {
      if (!disposed && Number.isFinite(value)) {
        ramp(output.gain, 0.9 * Math.min(1, Math.max(0, value)), 0.12);
      }
    },
    stopAll() {
      pending.clear();
      active.forEach((session) => session.stop());
      active.clear();
      if (!disposed) transport.stop();
    },
    dispose() {
      if (disposed) return;
      engine.stopAll();
      disposed = true;
      [...sessions].forEach((session) => session.dispose());
      output.dispose();
      limiter.dispose();
      // Tone disposes its ticker, timeout queue, transport, and browser context.
      context.dispose();
    },
  };
  return engine;
}
