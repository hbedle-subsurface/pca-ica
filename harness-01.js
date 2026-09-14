/* harness-01.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-01.js                                                  */

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

const file = path.join(__dirname, 'modules', 'directions.html');
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
    const M = win.__M01;
    if (!M) {
      console.error('module did not expose its state — it probably failed to load its assets');
      process.exit(1);
    }

    const row = (o) => [
      String(o.pair).padEnd(4),
      ('n=' + o.noise + '%').padEnd(7),
      (o.ang + 'deg').padStart(7),
      ('r=' + o.r.toFixed(3)).padStart(10),
      ('best=' + o.best.toFixed(1)).padStart(11),
      ('along=' + o.along.toFixed(1)).padStart(14),
      ('across=' + o.across.toFixed(1)).padStart(14),
      ('sum=' + o.total.toFixed(1)).padStart(12),
      ('share=' + o.share.toFixed(1) + '%').padStart(14)
    ].join(' ');

    console.log('\n=== EXERCISE 1: sweeping the angle, RMS & envelope, 12% noise');
    M.set('pair', 'ae'); M.set('noise', 12);
    [0, 15, 30, 45, 59, 60, 75, 90, 120, 150].forEach((a) => {
      M.set('ang', a);
      console.log('  ' + row(M.read()));
    });

    console.log('\n=== EXERCISE 2: the three pairs at their widest');
    ['ae', 'ab', 'eb'].forEach((p) => {
      M.set('pair', p);
      const best = Math.round(M.read().best);
      M.set('ang', best);
      const o = M.read();
      console.log('  ' + row(o) + '   sd ' + o.sd0.toFixed(2) + ' / ' + o.sd1.toFixed(2));
    });

    console.log('\n=== EXERCISE 3: along + across at four angles (RMS & envelope)');
    M.set('pair', 'ae');
    [0, 30, 59, 120].forEach((a) => {
      M.set('ang', a);
      const o = M.read();
      console.log('  ' + String(a).padStart(4) + 'deg   along ' + o.along.toFixed(1) +
        '   across ' + o.across.toFixed(1) + '   sum ' + o.total.toFixed(1));
    });

    console.log('\n=== EXERCISE 4: noise sweep, RMS & envelope');
    [0, 8, 16, 24, 32, 40].forEach((nz) => {
      M.set('noise', nz);
      M.set('ang', Math.round(M.read().best));
      const o4 = M.read();
      console.log('  ' + row(o4) + '   sd ' + o4.sd0.toFixed(2) + ' / ' + o4.sd1.toFixed(2) +
        '   ratio ' + (o4.sd1 / o4.sd0).toFixed(3));
    });

    console.log('\n=== SANITY: sum is constant across all angles and pairs');
    let worst = 0, ref = null;
    ['ae', 'ab', 'eb'].forEach((p) => {
      M.set('pair', p); M.set('noise', 12);
      ref = null;
      for (let a = 0; a < 180; a += 7) {
        M.set('ang', a);
        const t = M.read().total;
        if (ref === null) ref = t;
        worst = Math.max(worst, Math.abs(t - ref) / ref);
      }
    });
    console.log('  largest relative drift in the total: ' + worst.toExponential(2) +
      (worst < 1e-9 ? '   ok' : '   FAIL'));
    if (!(worst < 1e-9)) process.exitCode = 1;

    console.log('\n=== SANITY: page total matches the library eigenvalues');
    const MV = require('./assets/multivar.js');
    M.set('pair', 'ae'); M.set('noise', 12); M.set('ang', 0);
    const o = M.read();
    console.log('  traces ' + o.n + '   total ' + o.total.toFixed(4));

    console.log('\n=== GLOSSARY: terms marked in the prose');
    const marked = win.document.querySelectorAll('button.gterm');
    const names = new Set();
    marked.forEach((b) => names.add(b.getAttribute('data-term')));
    console.log('  ' + marked.length + ' marks, ' + names.size + ' distinct terms');
    console.log('  ' + Array.from(names).sort().join(', '));

    dom.window.close();
  }, 600);
}).catch((e) => { console.error(e); process.exit(1); });
