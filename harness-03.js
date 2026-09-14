/* harness-03.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-03.js                                                  */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

/* A canvas stub. The module's drawing code must run without throwing, but
   nothing is rasterized: the harness measures the readouts, not the pixels. */
function stubCanvas(win) {
  const noop = () => {};
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k === 'measureText') return () => ({ width: 40 });
      if (k === 'createLinearGradient' || k === 'createPattern') {
        return () => ({ addColorStop: noop });
      }
      if (k === 'canvas') return { width: 800, height: 400 };
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (typeof k === 'string' && /^(font|fillStyle|strokeStyle|lineWidth|textAlign|textBaseline|globalAlpha|lineCap|lineJoin|miterLimit|shadowBlur|shadowColor)$/.test(k)) {
        return t[k];
      }
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; }
  });
  win.HTMLCanvasElement.prototype.getContext = () => ctx;
  Object.defineProperty(win.HTMLElement.prototype, 'offsetParent', {
    get() { return this.hidden ? null : { clientWidth: 900 }; },
    configurable: true
  });
  Object.defineProperty(win.HTMLElement.prototype, 'clientWidth', {
    get() { return 900; }, configurable: true
  });
}

const file = path.join(__dirname, 'modules', 'units.html');
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });

JSDOM.fromFile(file, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(win) {
    stubCanvas(win);
    win.getComputedStyle = () => ({ paddingLeft: '26px', paddingRight: '26px' });
  }
}).then((dom) => {
  const win = dom.window;
  setTimeout(() => {
    const M = win.__M03;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }

    console.log('\n=== EXERCISE 1: the two first components, six attributes, no rescaling');
    M.set('weak',0); M.set('gain',0); M.set('gt','rms');
    let o = M.read();
    o.names.forEach((n,i)=>console.log('  '+n.padEnd(11)+'  native '+o.rawLoad[i].toFixed(3).padStart(7)+
      '    standardized '+o.zLoad[i].toFixed(3).padStart(7)));
    console.log('  explained PC1   native '+(o.rawExp[0]*100).toFixed(2)+'%   standardized '+(o.zExp[0]*100).toFixed(2)+'%');

    console.log('\n=== EXERCISE 2: rescaling RMS amplitude');
    [0,10,20,30].forEach((g)=>{
      M.set('gain',g); const q=M.read();
      console.log('  gain '+String(Math.round(q.gain)).padStart(5)+'x   native loading '+q.gtRaw.toFixed(3).padStart(7)+
        '   standardized '+q.gtZ.toFixed(3).padStart(7)+'   native PC1 '+(q.rawExp[0]*100).toFixed(2)+'%'+
        '   std PC1 '+(q.zExp[0]*100).toFixed(2)+'%');
    });
    M.set('gain',0);

    console.log('\n=== EXERCISE 3: variances in native units');
    o = M.read();
    o.names.forEach((n,i)=>console.log('  '+n.padEnd(11)+' '+o.vars[i].toPrecision(3).padStart(11)+
      '    |PC1 loading| '+Math.abs(o.rawLoad[i]).toFixed(3)));
    const mx=Math.max(...o.vars), mn=Math.min(...o.vars);
    console.log('  ratio largest/smallest  '+(mx/mn).toPrecision(4));

    console.log('\n=== EXERCISE 4: two attributes, native and standardized angle');
    [['rms','envelope'],['rms','coherence'],['peakfreq','bandwidth'],['coherence','glcmcon']].forEach((p)=>{
      const a=M.angles(p[0],p[1]);
      console.log('  '+(p[0]+' & '+p[1]).padEnd(24)+' r '+a.r.toFixed(3).padStart(7)+
        '   native '+a.native.toFixed(2).padStart(7)+'   standardized '+a.z.toFixed(2).padStart(7)+
        '   std PC1 '+(a.zExp*100).toFixed(2)+'%');
    });

    console.log('\n=== EXERCISE 5: adding the attribute that misses the target');
    ['z','raw'].forEach((route)=>{
      const c=M.weakCase(route);
      console.log('  route '+(route==='z'?'standardized':'native units'));
      console.log('    six    '+c.e6.map(v=>(v*100).toFixed(2)+'%').join('  '));
      console.log('    seven  '+c.e7.map(v=>(v*100).toFixed(2)+'%').join('  '));
      console.log('    weak loading per component  '+c.wLoad.map(v=>v.toFixed(3)).join('  '));
      console.log('    components for 90%:  '+c.n6+' -> '+c.n7);
    });

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(b=>names.add(b.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 900);
}).catch((e) => { console.error(e); process.exit(1); });
