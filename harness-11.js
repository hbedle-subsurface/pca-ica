/* harness-11.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-11.js                                                  */

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

const file = path.join(__dirname, 'modules', 'notgeology.html');
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
    const M = win.__M11;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }
    ['pca','ica'].forEach((meth)=>{
      console.log('\n=== '+meth.toUpperCase()+' components: what each one actually contains');
      M.components(meth).forEach(c=>console.log('  '+(meth==='pca'?'PC':'IC')+c.i+
        '  '+(c.share*100).toFixed(1).padStart(5)+'%   young '+c.young.toFixed(2).padStart(6)+
        '   old '+c.old.toFixed(2).padStart(6)+'   footprint '+c.foot.toFixed(3)+
        '   kurtosis '+c.kurt.toFixed(2)));
    });
    console.log('\n=== EXERCISE 3: both targets against the ceiling');
    const C=M.ceilings();
    ['young','old'].forEach(t2=>{const q=C[t2];
      console.log('  '+t2.padEnd(6)+' ceiling '+q.ceiling.toFixed(2)+
        '   best PC '+q.bestPC.toFixed(2)+'   best IC '+q.bestIC.toFixed(2)+
        '   best raw attribute '+q.bestAttr.toFixed(2)+
        '   raw beats both: '+(q.bestAttr>Math.max(q.bestPC,q.bestIC)?'yes':'no'));});
    console.log('\n=== EXERCISE 4: the attribute that missed the target');
    const W=M.weakCase();
    W.rows.forEach(r=>console.log('  PC'+r.pc+'  '+(r.share*100).toFixed(1).padStart(5)+
      '%   loading on it '+r.weakLoading.toFixed(3).padStart(7)+'   largest loading: '+r.largest));
    console.log('  PC1 '+(W.pc1six*100).toFixed(2)+'% -> '+(W.pc1seven*100).toFixed(2)+
      '%   components for 90%: '+W.k6+' -> '+W.k7);
    console.log('\n=== where the footprint got in');
    const F=M.footprintIn();
    console.log('  '+Object.keys(F).map(k=>k.slice(0,5)+' '+F[k].toFixed(2)).join('   '));
    dom.window.close();
  }, 2500);
}).catch((e) => { console.error(e); process.exit(1); });
