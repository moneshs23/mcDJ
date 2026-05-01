const FX_TYPES={riser:{name:'Riser'},impact:{name:'Impact'},sweep:{name:'Sweep'},none:{name:'None'}};
const TRANS_STYLES={blend:{name:'Smooth Blend'},cut:{name:'Quick Cut'},echoOut:{name:'Echo Out'},filterSweep:{name:'Filter Sweep'},dropSwap:{name:'Drop Swap'}};
const CAMELOT=['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B','7A','7B','8A','8B','9A','9B','10A','10B','11A','11B','12A','12B'];
function camelotCompat(a,b){if(!a||!b)return true;const ia=CAMELOT.indexOf(a),ib=CAMELOT.indexOf(b);if(ia<0||ib<0)return true;const na=parseInt(a),nb=parseInt(b),la=a.slice(-1),lb=b.slice(-1);if(la===lb&&Math.abs(na-nb)<=1)return true;if(la!==lb&&na===nb)return true;return Math.abs(na-nb)<=2;}
export default class AudioEngine{
static get FX_TYPES(){return FX_TYPES;}
static get TRANS_STYLES(){return TRANS_STYLES;}
constructor(){this.ctx=null;this.masterGain=null;this.analyser=null;this.deckA=null;this.deckB=null;this.activeDeck='A';this.volume=0.85;this.isPlaying=false;this.currentTrack=null;this.onTrackEnd=null;this.isCrossfading=false;this.transitionFX='riser';this.transitionStyle='blend';this.transitionBeats=16;this.crossfaderPos=0.5;this.tempo=1.0;this.frequencyData=null;this.timeDomainData=null;this.beatCount=0;this.lastBeatTime=0;this.prevEnergy=0;this.bpmHistory=[];this.estimatedBPM=0;this.analysisCache={};this.crowdAmbience=false;this.crowdGain=null;this.crowdSource=null;this._initialized=false;}
init(){if(this._initialized)return;this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.analyser=this.ctx.createAnalyser();this.analyser.fftSize=2048;this.analyser.smoothingTimeConstant=0.82;this.masterGain=this.ctx.createGain();this.masterGain.gain.value=this.volume;this.masterGain.connect(this.analyser);this.analyser.connect(this.ctx.destination);this.frequencyData=new Uint8Array(this.analyser.frequencyBinCount);this.timeDomainData=new Uint8Array(this.analyser.frequencyBinCount);this.deckA=this._createDeck();this.deckB=this._createDeck();this._initialized=true;}
_createDeck(){const a=new Audio();a.crossOrigin='anonymous';a.preload='auto';const g=this.ctx.createGain();g.gain.value=0;const lo=this.ctx.createBiquadFilter();lo.type='lowshelf';lo.frequency.value=320;lo.gain.value=0;const mi=this.ctx.createBiquadFilter();mi.type='peaking';mi.frequency.value=1000;mi.Q.value=0.7;mi.gain.value=0;const hi=this.ctx.createBiquadFilter();hi.type='highshelf';hi.frequency.value=3200;hi.gain.value=0;const dl=this.ctx.createDelay(2);dl.delayTime.value=0;const dlGain=this.ctx.createGain();dlGain.gain.value=0;const fb=this.ctx.createGain();fb.gain.value=0;const filt=this.ctx.createBiquadFilter();filt.type='lowpass';filt.frequency.value=20000;filt.Q.value=1;const src=this.ctx.createMediaElementSource(a);src.connect(lo);lo.connect(mi);mi.connect(hi);hi.connect(filt);filt.connect(g);filt.connect(dl);dl.connect(dlGain);dlGain.connect(g);dlGain.connect(fb);fb.connect(dl);g.connect(this.masterGain);return{audio:a,source:src,gain:g,eqLow:lo,eqMid:mi,eqHigh:hi,delay:dl,delayGain:dlGain,feedback:fb,filter:filt};}
_active(){return this.activeDeck==='A'?this.deckA:this.deckB;}
_inactive(){return this.activeDeck==='A'?this.deckB:this.deckA;}
async _ensureResumed(){if(this.ctx?.state==='suspended')await this.ctx.resume();}
// Analysis
async analyzeTrack(src){if(this.analysisCache[src])return this.analysisCache[src];this.init();try{const res=await fetch(src);const buf=await res.arrayBuffer();const dec=await this.ctx.decodeAudioData(buf);const ch=dec.getChannelData(0);const sr=dec.sampleRate;const dur=ch.length/sr;
// Peaks
const np=500,bs=Math.floor(ch.length/np),peaks=[];for(let i=0;i<np;i++){let m=0;for(let j=0;j<bs;j++){const a=Math.abs(ch[i*bs+j]);if(a>m)m=a;}peaks.push(m);}
// Energy profile 0.5s windows
const ws=Math.floor(sr*0.5),ep=[];for(let i=0;i<ch.length-ws;i+=ws){let s=0;for(let j=0;j<ws;j++)s+=ch[i+j]**2;ep.push(Math.sqrt(s/ws));}
const maxE=Math.max(...ep);const thresh=maxE*0.25;let bdIdx=0;for(let i=0;i<ep.length;i++){if(ep[i]>thresh){bdIdx=i;break;}}const beatDropTime=Math.max(0,bdIdx*0.5-0.1);
// BPM via onset autocorrelation
const ow=Math.floor(sr*0.02),onsets=[];let pRMS=0;for(let i=0;i<ch.length-ow;i+=ow){let s=0;for(let j=0;j<ow;j++)s+=ch[i+j]**2;const r=Math.sqrt(s/ow);onsets.push(Math.max(0,r-pRMS));pRMS=r;}
const mnL=Math.floor(60/200/0.02),mxL=Math.floor(60/60/0.02);let bL=mnL,bC=0;for(let l=mnL;l<=mxL;l++){let c=0;for(let i=0;i<onsets.length-l;i++)c+=onsets[i]*onsets[i+l];if(c>bC){bC=c;bL=l;}}const bpm=Math.round(60/(bL*0.02));
// Beat grid
const bi=60/bpm,bg=[];let t=beatDropTime;while(t<dur){bg.push(t);t+=bi;}
// Phrases
const ph={8:[],16:[],32:[]};for(let i=0;i<bg.length;i++){if(i%8===0)ph[8].push(bg[i]);if(i%16===0)ph[16].push(bg[i]);if(i%32===0)ph[32].push(bg[i]);}
// Sections: intro, buildup, drop, outro
const avgE=ep.reduce((a,b)=>a+b,0)/ep.length;const introEnd=(ep.findIndex(e=>e>avgE*0.6)||0)*0.5;let outroStart=dur;for(let i=ep.length-1;i>=0;i--){if(ep[i]>avgE*0.6){outroStart=(i+1)*0.5;break;}}
// Drop detection (highest energy region)
let dropIdx=0,dropE=0;for(let i=0;i<ep.length;i++){if(ep[i]>dropE){dropE=ep[i];dropIdx=i;}}const dropTime=dropIdx*0.5;
// Energy level classification
const avgNorm=avgE/maxE;const energyLevel=avgNorm>0.6?'high':avgNorm>0.35?'medium':'low';
// Simple key detection via spectral centroid
const fftSize=4096;const numFrames=Math.min(20,Math.floor(ch.length/fftSize));let centroidSum=0;for(let f=0;f<numFrames;f++){const start=Math.floor((ch.length*0.3)/numFrames*f);const frame=ch.slice(start,start+fftSize);let num=0,den=0;for(let i=0;i<frame.length;i++){const v=Math.abs(frame[i]);num+=i*v;den+=v;}centroidSum+=den>0?num/den:0;}const avgCentroid=centroidSum/numFrames;const keyIdx=Math.floor(avgCentroid/100)%24;const key=CAMELOT[keyIdx]||'1A';
const analysis={bpm,beatGrid:bg,phrases:ph,energyProfile:ep,beatDropTime,peaks,introEnd,outroStart,dropTime,duration:dur,energyLevel,key};this.analysisCache[src]=analysis;return analysis;}catch(e){console.warn('Analysis failed:',e);const fb={bpm:0,beatGrid:[],phrases:{8:[],16:[],32:[]},energyProfile:[],beatDropTime:0,peaks:null,introEnd:0,outroStart:999,dropTime:0,duration:0,energyLevel:'medium',key:'1A'};this.analysisCache[src]=fb;return fb;}}
async preDecodeAll(list){this.init();for(const t of list)await this.analyzeTrack(t.src);}
getAnalysis(src){return this.analysisCache[src]||null;}
getWaveformPeaks(src){return this.analysisCache[src]?.peaks||null;}
getBeatDropTime(src){return this.analysisCache[src]?.beatDropTime||0;}
getTrackBPM(src){return this.analysisCache[src]?.bpm||0;}
getTrackKey(src){return this.analysisCache[src]?.key||null;}
getTrackEnergy(src){return this.analysisCache[src]?.energyLevel||'medium';}
// Playback
async loadAndPlay(src,info=null){this.init();await this._ensureResumed();const an=await this.analyzeTrack(src);const d=this._active();d.audio.pause();d.audio.src=src;d.gain.gain.value=1;d.eqLow.gain.value=0;d.eqMid.gain.value=0;d.eqHigh.gain.value=0;d.filter.frequency.value=20000;d.delayGain.gain.value=0;d.feedback.gain.value=0;this.currentTrack=info;this._resetBD();d.audio.onended=()=>{this.isPlaying=false;this.onTrackEnd?.();};await new Promise(r=>{d.audio.addEventListener('canplay',r,{once:true});});if(an.beatDropTime>0.5)d.audio.currentTime=an.beatDropTime;try{await d.audio.play();this.isPlaying=true;}catch(e){console.warn(e);}}
async play(){this.init();await this._ensureResumed();const d=this._active();if(d.audio.src){try{await d.audio.play();this.isPlaying=true;}catch(e){}}}
pause(){this._active().audio.pause();this.isPlaying=false;}
seek(f){const a=this._active().audio;if(a.duration&&isFinite(a.duration))a.currentTime=f*a.duration;}
setVolume(v){this.volume=Math.max(0,Math.min(1,v));if(this.masterGain)this.masterGain.gain.value=this.volume;}
setTransitionFX(t){this.transitionFX=FX_TYPES[t]?t:'none';}
getTransitionFX(){return this.transitionFX;}
setTransitionStyle(s){this.transitionStyle=TRANS_STYLES[s]?s:'blend';}
getTransitionStyle(){return this.transitionStyle;}
setTransitionBeats(b){this.transitionBeats=[8,16,32].includes(b)?b:16;}
getTransitionBeats(){return this.transitionBeats;}
setCrossfader(v){this.crossfaderPos=Math.max(0,Math.min(1,v));if(!this.isCrossfading&&this.deckA&&this.deckB){this.deckA.gain.gain.value=Math.cos(this.crossfaderPos*Math.PI/2);this.deckB.gain.gain.value=Math.sin(this.crossfaderPos*Math.PI/2);}}
setTempo(v){this.tempo=Math.max(0.8,Math.min(1.2,v));if(this._active().audio)this._active().audio.playbackRate=this.tempo;}
setEQ(band,val){const d=this._active();const v=Math.max(-12,Math.min(12,val));if(band==='low')d.eqLow.gain.value=v;if(band==='mid')d.eqMid.gain.value=v;if(band==='high')d.eqHigh.gain.value=v;}
getProgress(){const a=this._active().audio;if(!a?.duration||!isFinite(a.duration))return 0;return(a.currentTime/a.duration)*100;}
getCurrentTime(){return this._active().audio?.currentTime||0;}
getDuration(){const d=this._active().audio?.duration;return d&&isFinite(d)?d:0;}
getRemainingTime(){return Math.max(0,this.getDuration()-this.getCurrentTime());}
// Crowd ambience
toggleCrowdAmbience(){this.init();this.crowdAmbience=!this.crowdAmbience;if(this.crowdAmbience&&!this.crowdSource){const bs=this.ctx.sampleRate*10;const nb=this.ctx.createBuffer(1,bs,this.ctx.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<bs;i++)d[i]=(Math.random()*2-1)*0.015;this.crowdSource=this.ctx.createBufferSource();this.crowdSource.buffer=nb;this.crowdSource.loop=true;this.crowdGain=this.ctx.createGain();this.crowdGain.gain.value=0.03;const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=800;f.Q.value=0.5;this.crowdSource.connect(f);f.connect(this.crowdGain);this.crowdGain.connect(this.ctx.destination);this.crowdSource.start();}if(this.crowdGain)this.crowdGain.gain.value=this.crowdAmbience?0.03:0;return this.crowdAmbience;}
playApplause(){if(!this.ctx)return;const bs=this.ctx.sampleRate*2;const nb=this.ctx.createBuffer(1,bs,this.ctx.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<bs;i++){const env=1-i/bs;d[i]=(Math.random()*2-1)*0.08*env;}const s=this.ctx.createBufferSource();s.buffer=nb;const g=this.ctx.createGain();g.gain.value=0.15;const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=2000;f.Q.value=0.3;s.connect(f);f.connect(g);g.connect(this.ctx.destination);s.start();s.stop(this.ctx.currentTime+2);}
// Transition
getOptimalTransitionTime(src){const a=this.getAnalysis(src);if(!a?.phrases)return null;const dur=a.duration||0;const target=Math.max(dur*0.7,a.outroStart-10);const bds=a.phrases[this.transitionBeats]||a.phrases[16]||[];let best=dur-15,bestD=Infinity;for(const b of bds){const d=Math.abs(b-target);if(d<bestD){bestD=d;best=b;}}return best;}
shouldAutoAdvance(){if(!this.isPlaying)return false;const src=this.currentTrack?.src;if(!src)return this.getRemainingTime()>0&&this.getRemainingTime()<8;const opt=this.getOptimalTransitionTime(src);if(opt!==null){const ct=this.getCurrentTime();return ct>=opt&&ct<opt+1;}return this.getRemainingTime()>0&&this.getRemainingTime()<8;}
async crossfadeTo(src,info=null){this.init();await this._ensureResumed();this.isCrossfading=true;const outAn=this.currentTrack?.src?this.getAnalysis(this.currentTrack.src):null;const inAn=await this.analyzeTrack(src);const outD=this._active();const inD=this._inactive();const outBPM=outAn?.bpm||120;const style=this.transitionStyle;
// Transition duration
let transDur;if(style==='cut'){transDur=0.5;}else if(style==='dropSwap'){transDur=(8*60)/outBPM;}else{transDur=(this.transitionBeats*60)/outBPM;}
// Tempo sync
const inBPM=inAn.bpm||outBPM;if(inBPM>0&&outBPM>0){inD.audio.playbackRate=Math.max(0.85,Math.min(1.15,outBPM/inBPM));}
// Load incoming
inD.audio.pause();inD.audio.src=src;inD.gain.gain.value=0;inD.eqLow.gain.value=-24;inD.eqMid.gain.value=-6;inD.eqHigh.gain.value=0;inD.filter.frequency.value=20000;inD.delayGain.gain.value=0;inD.feedback.gain.value=0;this.currentTrack=info;inD.audio.onended=()=>{this.isPlaying=false;this.onTrackEnd?.();};
await new Promise(r=>{inD.audio.addEventListener('canplay',r,{once:true});});
// Start position
if(style==='dropSwap'&&inAn.dropTime>1){inD.audio.currentTime=inAn.dropTime;}else if(inAn.beatDropTime>0.5){inD.audio.currentTime=inAn.beatDropTime;}
try{await inD.audio.play();}catch(e){console.warn(e);}
this._playTransitionFX(transDur);const now=this.ctx.currentTime;const t1=transDur*0.25,t2=transDur*0.5,t3=transDur*0.75,t4=transDur;
if(style==='blend'){
inD.gain.gain.setValueAtTime(0,now);inD.gain.gain.linearRampToValueAtTime(0.3,now+t1);inD.gain.gain.linearRampToValueAtTime(0.6,now+t2);inD.gain.gain.linearRampToValueAtTime(0.85,now+t3);inD.gain.gain.linearRampToValueAtTime(1,now+t4);
inD.eqHigh.gain.setValueAtTime(0,now);inD.eqMid.gain.setValueAtTime(-6,now);inD.eqMid.gain.linearRampToValueAtTime(0,now+t2);inD.eqLow.gain.setValueAtTime(-24,now);inD.eqLow.gain.linearRampToValueAtTime(-12,now+t2);inD.eqLow.gain.linearRampToValueAtTime(0,now+t4);
outD.eqLow.gain.setValueAtTime(0,now);outD.eqLow.gain.linearRampToValueAtTime(-24,now+t2);outD.eqMid.gain.setValueAtTime(0,now);outD.eqMid.gain.linearRampToValueAtTime(-18,now+t3);outD.eqHigh.gain.setValueAtTime(0,now);outD.eqHigh.gain.linearRampToValueAtTime(-24,now+t4);
outD.gain.gain.setValueAtTime(1,now);outD.gain.gain.linearRampToValueAtTime(0,now+t4);
}else if(style==='cut'){
outD.gain.gain.setValueAtTime(1,now);outD.gain.gain.linearRampToValueAtTime(0,now+0.05);inD.gain.gain.setValueAtTime(0,now+0.04);inD.gain.gain.linearRampToValueAtTime(1,now+0.1);inD.eqLow.gain.value=0;inD.eqMid.gain.value=0;
}else if(style==='echoOut'){
outD.delay.delayTime.setValueAtTime(60/outBPM*0.75,now);outD.delayGain.gain.setValueAtTime(0.4,now);outD.feedback.gain.setValueAtTime(0.5,now);outD.gain.gain.setValueAtTime(1,now);outD.gain.gain.linearRampToValueAtTime(0,now+t4);outD.delayGain.gain.linearRampToValueAtTime(0,now+t4+1);outD.feedback.gain.linearRampToValueAtTime(0,now+t4+1);
inD.gain.gain.setValueAtTime(0,now);inD.gain.gain.linearRampToValueAtTime(1,now+t2);inD.eqLow.gain.setValueAtTime(-24,now);inD.eqLow.gain.linearRampToValueAtTime(0,now+t4);inD.eqMid.gain.value=0;
}else if(style==='filterSweep'){
outD.filter.frequency.setValueAtTime(20000,now);outD.filter.frequency.exponentialRampToValueAtTime(200,now+t3);outD.gain.gain.setValueAtTime(1,now);outD.gain.gain.linearRampToValueAtTime(0,now+t4);
inD.filter.frequency.setValueAtTime(200,now);inD.filter.frequency.exponentialRampToValueAtTime(20000,now+t3);inD.gain.gain.setValueAtTime(0.2,now);inD.gain.gain.linearRampToValueAtTime(1,now+t3);inD.eqLow.gain.value=0;inD.eqMid.gain.value=0;
}else if(style==='dropSwap'){
outD.gain.gain.setValueAtTime(1,now);outD.gain.gain.linearRampToValueAtTime(0.5,now+t2);outD.gain.gain.linearRampToValueAtTime(0,now+t2+0.05);
inD.gain.gain.setValueAtTime(0,now);inD.gain.gain.setValueAtTime(1,now+t2+0.05);inD.eqLow.gain.value=0;inD.eqMid.gain.value=0;
}
this.isPlaying=true;this._resetBD();
setTimeout(()=>{outD.audio.pause();outD.audio.currentTime=0;outD.eqLow.gain.value=0;outD.eqMid.gain.value=0;outD.eqHigh.gain.value=0;outD.filter.frequency.value=20000;outD.delayGain.gain.value=0;outD.feedback.gain.value=0;this.isCrossfading=false;this.playApplause();},transDur*1000+500);
this.activeDeck=this.activeDeck==='A'?'B':'A';}
_playTransitionFX(dur){if(!this.ctx||this.transitionFX==='none')return;const now=this.ctx.currentTime;const g=this.ctx.createGain();g.connect(this.masterGain);
if(this.transitionFX==='riser'){const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(200,now);o.frequency.exponentialRampToValueAtTime(2000,now+dur*0.8);const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(400,now);f.frequency.exponentialRampToValueAtTime(6000,now+dur*0.8);f.Q.value=5;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.1,now+dur*0.7);g.gain.linearRampToValueAtTime(0,now+dur);o.connect(f);f.connect(g);o.start(now);o.stop(now+dur);}
else if(this.transitionFX==='impact'){const mid=dur*0.5;const o=this.ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(150,now+mid);o.frequency.exponentialRampToValueAtTime(30,now+mid+0.5);g.gain.setValueAtTime(0,now);g.gain.setValueAtTime(0.2,now+mid);g.gain.exponentialRampToValueAtTime(0.001,now+mid+0.8);o.connect(g);o.start(now+mid);o.stop(now+mid+0.8);}
else if(this.transitionFX==='sweep'){const bs2=this.ctx.sampleRate*dur;const nb=this.ctx.createBuffer(1,bs2,this.ctx.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<bs2;i++)d[i]=(Math.random()*2-1)*0.4;const n=this.ctx.createBufferSource();n.buffer=nb;const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(200,now);f.frequency.exponentialRampToValueAtTime(8000,now+dur*0.5);f.frequency.exponentialRampToValueAtTime(200,now+dur);f.Q.value=3;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.07,now+dur*0.3);g.gain.linearRampToValueAtTime(0,now+dur);n.connect(f);f.connect(g);n.start(now);n.stop(now+dur);}}
// Live analysis
_resetBD(){this.beatCount=0;this.lastBeatTime=0;this.prevEnergy=0;this.bpmHistory=[];this.estimatedBPM=0;}
getFrequencyData(){if(!this.analyser||!this.frequencyData)return new Array(32).fill(0);this.analyser.getByteFrequencyData(this.frequencyData);const b=32,s=Math.floor(this.frequencyData.length/b),r=[];for(let i=0;i<b;i++){let v=0;for(let j=0;j<s;j++)v+=this.frequencyData[i*s+j];r.push((v/s)/255);}return r;}
getTimeDomainData(){if(!this.analyser||!this.timeDomainData)return new Array(120).fill(0);this.analyser.getByteTimeDomainData(this.timeDomainData);const p=120,s=Math.floor(this.timeDomainData.length/p),r=[];for(let i=0;i<p;i++)r.push((this.timeDomainData[i*s]-128)/128);return r;}
getEnergy(){if(!this.analyser||!this.frequencyData)return 0;this.analyser.getByteFrequencyData(this.frequencyData);let s=0;for(let i=0;i<this.frequencyData.length;i++){const v=this.frequencyData[i]/255;s+=v*v;}return Math.sqrt(s/this.frequencyData.length);}
detectBeat(){const e=this.getEnergy();const now=Date.now();const d=e-this.prevEnergy;this.prevEnergy=e;if(d>0.12&&(now-this.lastBeatTime)>250){if(this.lastBeatTime>0){const b=60000/(now-this.lastBeatTime);if(b>60&&b<200){this.bpmHistory.push(b);if(this.bpmHistory.length>24)this.bpmHistory.shift();this.estimatedBPM=Math.round(this.bpmHistory.reduce((a,c)=>a+c,0)/this.bpmHistory.length);}}this.lastBeatTime=now;this.beatCount++;return true;}return false;}
getBPM(){return this.estimatedBPM||0;}
getBeatCount(){return this.beatCount;}
getConfidence(){if(this.bpmHistory.length<4)return 0;const a=this.bpmHistory.reduce((x,y)=>x+y,0)/this.bpmHistory.length;const v=this.bpmHistory.reduce((s,x)=>s+(x-a)**2,0)/this.bpmHistory.length;return Math.max(0,Math.min(100,Math.round(100-Math.sqrt(v)*3)));}
destroy(){this.deckA?.audio?.pause();this.deckB?.audio?.pause();if(this.crowdSource){try{this.crowdSource.stop();}catch(e){}}if(this.ctx?.state!=='closed')this.ctx?.close().catch(()=>{});}}
