/* harness-09.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-09.js                                                  */

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

const file = path.join(__dirname, 'modules', 'sidebyside.html');
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
    const M = win.__M09;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }

    console.log('\n=== the sources');
    ['chan','gauss'].forEach((s)=>{ M.set('src',s); const q=M.sourceStats();
      console.log('  '+s.padEnd(6)+' kurtosis '+q.k1.toFixed(2)+' / '+q.k2.toFixed(2)+
        '   correlation between them '+q.r.toFixed(4)); });
    M.set('src','chan');

    console.log('\n=== EXERCISE 1: recovery against the mixing angle');
    M.curve().forEach(function(c){
      console.log('  '+String(c.ang).padStart(3)+' deg   PCA '+c.pca.toFixed(3)+'   ICA '+c.ica.toFixed(3));
    });
    const C=M.curve();
    const bp=C.reduce((a,b)=>b.pca>a.pca?b:a), wp=C.reduce((a,b)=>b.pca<a.pca?b:a);
    console.log('  PCA best '+bp.pca.toFixed(3)+' at '+bp.ang+' deg   worst '+wp.pca.toFixed(3)+' at '+wp.ang+' deg');

    console.log('\n=== EXERCISE 2: the strength slider');
    M.set('ang',45);
    [0,4,8,12].forEach((r)=>{ M.set('ratio',r); const q=M.recovery();
      console.log('  '+q.gain.toFixed(1).padStart(5)+'x   PCA '+q.pca.map(v=>v.toFixed(3)).join('/')+
        '   ICA '+q.ica.map(v=>v.toFixed(3)).join('/')); });
    M.set('ratio',0);

    console.log('\n=== EXERCISE 3: repeatability, the test that needs no truth');
    ['chan','gauss'].forEach((s)=>{ M.set('src',s); const q=M.recovery();
      console.log('  '+s.padEnd(6)+' ICA recovery '+q.ica.map(v=>v.toFixed(3)).join(' / ')+
        '   four starts agree at '+M.starts().map(v=>v.toFixed(3)).join(', ')); });
    M.set('src','chan');

    console.log('\n=== EXERCISE 4: noise');
    [0,20,40,60].forEach((n)=>{ M.set('noise',n); const q=M.recovery();
      console.log('  '+String(n).padStart(3)+'%   PCA '+q.pca.map(v=>v.toFixed(3)).join('/')+
        '   ICA '+q.ica.map(v=>v.toFixed(3)).join('/')); });
    M.set('noise',0);

    console.log('\n=== THE SCORE BAR');
    [45,60,75,40,85].forEach((a)=>{ M.set('ang',a); const s=M.score();
      console.log('  '+String(a).padStart(3)+' deg   PCA '+s.now.toFixed(3)+
        '   '+s.pct.toFixed(1)+'% of its own best'+(s.pct>=99?'   WIN':'')); });

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(x=>names.add(x.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms');

    dom.window.close();
  }, 2500);
}).catch((e) => { console.error(e); process.exit(1); });
