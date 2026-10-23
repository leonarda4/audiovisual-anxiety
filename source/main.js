import groups from './noise-lab/recipes.json';
import { createNoiseRenderer } from './noise-lab/renderer.js';
import { createSoundscapeEngine } from './soundscapes/engine.js';
import { SOUNDSCAPES, formatControlValue } from './soundscapes/data.js';
const $ = s => document.querySelector(s);
const canvas = $('canvas');
let group = groups.find(g => g.id === 'fear'), selected = group.recipes[0];
let renderer, frame, elapsed = 0, last = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let engine, started = false, starting = false, muted = false;
const preview = recipe => './previews/' + recipe.preview.split('/').pop();
function draw() {
  try { renderer?.render([{recipe:selected,x:0,y:0,width:canvas.width,height:canvas.height}], elapsed); }
  catch { $('#notice').textContent = 'Live visuals unavailable. Showing the saved preview.'; renderer = null; }
}
function tick(now) {
  if (!document.hidden && !paused && now-last >= 1000/30) { elapsed += last ? Math.min((now-last)/1000, .1) : 0; last=now; draw(); }
  frame=requestAnimationFrame(tick);
}
function resize() { canvas.width=innerWidth; canvas.height=innerHeight; draw(); }
function initialize() {
  try { renderer=createNoiseRenderer(canvas); $('#notice').textContent=''; resize(); }
  catch { $('#notice').textContent='Live visuals unavailable. Showing the saved preview.'; }
}
function select(recipe, index) {
  selected=recipe;
  $('#backdrop').src=preview(recipe);
  document.querySelectorAll('.tile').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  draw();
}
function showGroup() {
  $('#options').replaceChildren(...group.recipes.map((recipe,index)=>{
    const button=document.createElement('button'); button.className='tile';
    button.innerHTML=`<img src="${preview(recipe)}" alt="">`;
    button.setAttribute('aria-label', `${group.label} visual ${index+1}`);
    button.onclick=()=>select(recipe,index); return button;
  }));
  select(group.recipes[0],0);
}
async function startAudio() {
  if(started || starting) return;
  starting=true; $('#sound').ariaLabel='Starting…';
  try {
    engine ||= createSoundscapeEngine(); engine.setVolume(Number($('#volume').value));
    started=await engine.start('fearful'); $('#enable-sound').hidden=started; $('#sound').setAttribute('aria-pressed',String(started));
    $('#sound').ariaLabel=started?'Mute sound':'Enable sound';
    $('#audio-status').textContent=started?'Playing continuously':'Click to enable background sound';
  } catch { $('#enable-sound').hidden=false; $('#enable-sound').textContent='Retry sound'; $('#sound').ariaLabel='Retry sound'; $('#audio-status').textContent='Audio could not start. Click to retry.'; }
  finally {starting=false;}
}
$('#sound').onclick=()=>{
  if(!started) return startAudio();
  muted=!muted; $('#sound').setAttribute('aria-pressed',String(!muted)); engine.setVolume(muted?0:Number($('#volume').value));
  $('#sound').ariaLabel=muted?'Unmute sound':'Mute sound';
  $('#audio-status').textContent=muted?'Muted':'Playing continuously';
};
$('#volume').oninput=e=>{ engine?.setVolume(muted?0:Number(e.target.value)); };

$('#enable-sound').onclick=startAudio;
// Unlock audio on the first interaction, while preserving explicit mute toggles.
function unlockOnInteraction(event) {
  if (!event.target.closest('#sound, #enable-sound')) startAudio();
}
document.addEventListener('pointerdown', unlockOnInteraction, {once:true});
document.addEventListener('keydown', event=>{
  if (['Enter',' '].includes(event.key) && !event.target.closest('#sound, #enable-sound')) startAudio();
});
$('#expand-audio').onclick=()=>{
  const open=$('#expand-audio').getAttribute('aria-expanded')!=='true';
  $('#expand-audio').setAttribute('aria-expanded',String(open));
  $('#expand-audio').ariaLabel=open?'Collapse sound controls':'Expand sound controls';
  $('#sound-settings').hidden=!open;
};
for(const part of SOUNDSCAPES.find(s=>s.id==='fearful').parts){
  const section=document.createElement('fieldset');
  const legend=document.createElement('legend');legend.textContent=part.label;section.append(legend);
  for(const control of part.controls){
    const label=document.createElement('label');const title=document.createElement('span');title.textContent=control.label;
    const output=document.createElement('output');output.textContent=formatControlValue(control,control.default);
    const input=document.createElement('input');input.type='range';input.min=control.min;input.max=control.max;input.step=control.step;input.value=control.default;
    input.oninput=()=>{engine ||= createSoundscapeEngine();engine.setControl('fearful',part.id,control.id,Number(input.value));output.textContent=formatControlValue(control,Number(input.value));};
    label.append(title,output,input);section.append(label);
  }
  $('#layers').append(section);
}
$('#motion').onclick=()=>{paused=!paused;$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').ariaLabel=paused?'Play motion':'Pause motion';last=0;};
$('#motion').ariaLabel=paused?'Play motion':'Pause motion';
$('#motion').setAttribute('aria-pressed',String(paused));
$('#fullscreen').onclick=async()=>{try {if(document.fullscreenElement) await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('#notice').textContent='Use your browser’s fullscreen command.';}};
document.addEventListener('fullscreenchange',()=>$('#fullscreen').ariaLabel=document.fullscreenElement?'Exit fullscreen':'Fullscreen ↗');
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer=null;$('#notice').textContent='Restoring live visuals…';});
canvas.addEventListener('webglcontextrestored',initialize);
addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{last=0;});
addEventListener('pagehide',()=>{cancelAnimationFrame(frame);renderer?.destroy();engine?.dispose();});
showGroup();initialize();frame=requestAnimationFrame(tick);
