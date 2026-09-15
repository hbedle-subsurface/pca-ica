/* harness-04.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-04.js                                                  */

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

const file = path.join(__dirname, 'modules', 'eigen.html');
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
    const M = win.__M04;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }
    const six = M.six();

    console.log('\n=== STEP 1: spinning the aircraft about each of its axes');
    const sp = M.spin();
    sp.axes.forEach(a=>console.log('  '+a.axis.padEnd(12)+' eigenvalue '+a.eigenvalue.toFixed(4)+
      '   seen runs '+a.lo.toFixed(4)+' to '+a.hi.toFixed(4)+
      (a.hi>=sp.best-2e-3?'   reaches the best view':'   never reaches it')));
    console.log('  best possible '+sp.best.toFixed(4)+'   worst possible '+sp.worst.toFixed(4)+
      '   total '+sp.total.toFixed(4));

    console.log('\n=== EXERCISE 1: sweep against eigenvector, two attributes');
    [['rms','coherence'],['rms','envelope'],['peakfreq','bandwidth']].forEach((p)=>{
      const c=M.pairCheck(p[0],p[1]);
      console.log('  '+(p[0]+' & '+p[1]).padEnd(24)+' angle '+c.angle.toFixed(2).padStart(7)+
        '   eigenvalues '+c.values.map(v=>v.toFixed(4)).join(' / ')+
        '   sum '+(c.values[0]+c.values[1]).toFixed(6)+
        '   residual '+c.residual.toExponential(1));
    });

    console.log('\n=== EXERCISE 3: deflation');
    console.log('  original  '+six.values.map(v=>v.toFixed(4)).join('  '));
    [1,2,3].forEach((k)=>{
      console.log('  remove '+k+'  '+M.residual(k).map(v=>v.toFixed(4)).join('  '));
    });

    console.log('\n=== EXERCISE 4: loadings of the first three components');
    const N=['rms','envelope','peakfreq','bandwidth','coherence','glcmcon'];
    for(let c=0;c<3;c++){
      console.log('  PC'+(c+1)+'  eig '+six.values[c].toFixed(4)+'  '+(six.explained[c]*100).toFixed(2)+'%   '+
        N.map((n,i)=>n.slice(0,5)+' '+six.loadings[c][i].toFixed(3)).join('  '));
    }

    console.log('\n=== IDENTITIES that have to hold');
    console.log('  sum of eigenvalues            '+six.sum.toFixed(6)+'   (attributes = 6)');
    six.values.forEach((v,i)=>{
      const d=Math.abs(v-six.scoreVar[i]);
      console.log('  PC'+(i+1)+' eigenvalue '+v.toFixed(6)+'   variance of score '+six.scoreVar[i].toFixed(6)+
        '   difference '+d.toExponential(1));
    });

    console.log('\n=== score orthogonality (the AASPI documents say otherwise)');
    M.orthogonality().forEach(o=>console.log('  score'+o.a+'.score'+o.b+'/n = '+o.dot.toExponential(2)+
      '   correlation '+o.corr.toExponential(2)));

    console.log('\n=== EXERCISE 5: sign flip leaves these alone');
    M.set('pc',1); M.set('flip',0); const a=M.six();
    M.set('flip',1); const b=M.six();
    console.log('  eigenvalue   '+a.values[1].toFixed(6)+' -> '+b.values[1].toFixed(6));
    console.log('  explained    '+(a.explained[1]*100).toFixed(4)+'% -> '+(b.explained[1]*100).toFixed(4)+'%');
    console.log('  score var    '+a.scoreVar[1].toFixed(6)+' -> '+b.scoreVar[1].toFixed(6));

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(x=>names.add(x.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 900);
}).catch((e) => { console.error(e); process.exit(1); });
