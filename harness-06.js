/* harness-06.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-06.js                                                  */

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

const file = path.join(__dirname, 'modules', 'wherepcastops.html');
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
    const M = win.__M06;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }

    console.log('\n=== EXERCISE 1: each target in each component');
    M.perComponent().forEach(c=>console.log('  PC'+c.pc+'  '+(c.explained*100).toFixed(2).padStart(6)+'%'+
      '   young '+c.young.toFixed(3).padStart(8)+'   old '+c.old.toFixed(3).padStart(8)+
      '   kurtosis '+c.kurtosis.toFixed(3).padStart(8)));

    const C = M.ceilings();
    console.log('\n=== EXERCISE 2 and 3: the ceilings and the constraint');
    console.log('  angle between the two target directions: '+C.angle.toFixed(2)+' degrees');
    console.log('  young: ceiling '+C.young.sep.toFixed(3)+'   that direction on the old target '+C.young.cross.toFixed(3));
    console.log('  old:   ceiling '+C.old.sep.toFixed(3)+'   that direction on the young target '+C.old.cross.toFixed(3));
    console.log('  angle from each component to the young direction: '+C.anglesYoung.map(v=>v.toFixed(1)).join('  '));
    console.log('  angle from each component to the old direction:   '+C.anglesOld.map(v=>v.toFixed(1)).join('  '));

    console.log('\n=== EXERCISE 4: rotating inside the PC2-PC3 plane');
    const sw = M.sweep();
    sw.filter(s=>s.deg%15===0).forEach(s=>console.log('  '+String(s.deg).padStart(3)+' deg'+
      '   young '+s.young.toFixed(3).padStart(8)+'   old '+s.old.toFixed(3).padStart(8)+
      '   variance '+s.variance.toFixed(3)));
    const by = sw.reduce((a,b)=>Math.abs(b.young)>Math.abs(a.young)?b:a);
    console.log('  best for the young channel: '+by.deg+' deg, separation '+by.young.toFixed(3)+
      ', variance '+by.variance.toFixed(3));


    console.log('\n=== THE SCORE BAR: rotating in the PC2-PC3 plane (younger channel)');
    M.set('tgt','young');
    [0,15,30,45,60,90,135].forEach(function(a){
      M.set('rot',a); const s=M.score();
      console.log('  '+String(a).padStart(3)+'deg   separation '+s.now.toFixed(3).padStart(7)+
        '   '+s.pct.toFixed(1)+'% of best   bar '+
        (100*(s.now-s.worst)/(s.best-s.worst)).toFixed(0)+'%'+(s.pct>=99?'   WIN':''));
    });
    M.set('rot',0);

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(x=>names.add(x.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 900);
}).catch((e) => { console.error(e); process.exit(1); });
