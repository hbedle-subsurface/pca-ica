/* harness-07.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-07.js                                                  */

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

const file = path.join(__dirname, 'modules', 'independence.html');
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
    const M = win.__M07;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }

    console.log('\n=== EXERCISE 1: uncorrelated but dependent (PC2 against PC3)');
    console.log('  correlation '+M.correlation().toExponential(2));
    M.bins().forEach(b=>console.log('  PC2 in ['+b.lo+','+b.hi+')   n='+String(b.n).padStart(5)+
      (b.n>=40?('   spread of PC3 = '+b.sd.toFixed(3)):'   (too few)')));

    console.log('\n=== EXERCISE 2: variance along a direction, before and after whitening');
    M.varianceCurve().forEach(v=>console.log('  '+String(v.deg).padStart(4)+' deg   before '+
      v.before.toFixed(4)+'   after '+v.after.toFixed(6)));

    console.log('\n=== EXERCISE 3: shape statistics');
    const sh = M.shapes();
    console.log('  uniform  '+sh.uniform.toFixed(3)+'   gaussian '+sh.gaussian.toFixed(3)+
      '   laplace '+sh.laplace.toFixed(3));
    sh.scores.forEach((s,i)=>console.log('  PC'+(i+1)+'  kurtosis '+s.kurt.toFixed(3).padStart(8)+
      '   negentropy '+s.neg.toExponential(2)));

    console.log('\n=== EXERCISE 4: the central limit');
    M.sums().forEach(s=>console.log('  '+s.k+' source'+(s.k>1?'s':' ')+'   kurtosis '+
      s.kurt.toFixed(4).padStart(9)+'   -1.2/k = '+s.law.toFixed(4).padStart(8)+
      '   negentropy '+s.neg.toExponential(2)));

    console.log('\n=== EXERCISE 5: searching the whitened plane');
    const sw = M.sweep();
    sw.filter(s=>s.deg%15===0).forEach(s=>console.log('  '+String(s.deg).padStart(3)+' deg'+
      '   negentropy '+s.neg.toExponential(2)+'   kurtosis '+s.kurt.toFixed(3).padStart(7)+
      '   variance '+s.variance.toFixed(4)+'   separation '+s.sep.toFixed(3).padStart(8)));
    const bn = sw.reduce((a,b)=>b.neg>a.neg?b:a);
    const bk = sw.reduce((a,b)=>Math.abs(b.kurt)>Math.abs(a.kurt)?b:a);
    console.log('  negentropy peaks at '+bn.deg+' deg: kurtosis '+bn.kurt.toFixed(3)+
      ', separation '+bn.sep.toFixed(3));
    console.log('  kurtosis peaks at '+bk.deg+' deg');
    console.log('  at 0 deg (component 2): separation '+sw[0].sep.toFixed(3));

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(x=>names.add(x.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 1200);
}).catch((e) => { console.error(e); process.exit(1); });
