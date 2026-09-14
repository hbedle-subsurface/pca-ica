/* harness-02.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-02.js                                                  */

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

const file = path.join(__dirname, 'modules', 'spread.html');
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
    const M = win.__M02;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }

    console.log('\n=== EXERCISE 1: gain on the second attribute (RMS & peak envelope)');
    M.set('fx','rms'); M.set('fy','envelope');
    [0,3,7,10].forEach((g)=>{
      M.set('gain',g);
      const o=M.read();
      console.log('  gain '+o.gain.toFixed(2).padStart(6)+'x   cov '+o.cov.toFixed(2).padStart(10)+
        '   var(y) '+o.vary.toFixed(1).padStart(10)+'   r '+o.r.toFixed(4));
    });
    M.set('gain',0);

    console.log('\n=== EXERCISE 2: quadrant contributions');
    const q=M.read();
    ['above in both','above x below y','below in both','below x above y'].forEach((l,k)=>{
      console.log('  '+l.padEnd(17)+' '+String(q.qn[k]).padStart(5)+' traces   '+q.q[k].toFixed(2).padStart(8));
    });
    console.log('  sum = covariance  '+q.q.reduce((a,b)=>a+b,0).toFixed(2));

    console.log('\n=== EXERCISE 3: pairs surviving a threshold');
    const R=M.matrix(), N=M.names;
    const pairs=[];
    for(let i=0;i<N.length;i++) for(let j=i+1;j<N.length;j++) pairs.push([Math.abs(R[i][j]),R[i][j],N[i],N[j]]);
    pairs.sort((a,b)=>b[0]-a[0]);
    [0.75,0.60].forEach((t)=>{
      const keep=pairs.filter(p=>p[0]>=t);
      console.log('  threshold '+t.toFixed(2)+':  '+keep.length+' of '+pairs.length+' pairs');
      keep.forEach(p=>console.log('     '+(p[2]+' & '+p[3]).padEnd(26)+p[1].toFixed(3)));
    });

    console.log('\n=== EXERCISE 4: the bend');
    M.set('kase','bend');
    [[2,26],[2,13],[13,26]].forEach((w)=>{
      M.set('tlo',w[0]); M.set('thi',w[1]);
      const o=M.read();
      console.log('  '+String(w[0]).padStart(3)+'-'+String(w[1]).padStart(2)+' ms   r = '+
        o.caseR.toFixed(3).padStart(7)+'   '+o.caseN+' traces');
    });
    M.set('tlo',2); M.set('thi',26);

    console.log('\n=== EXERCISE 5: two populations');
    M.set('kase','pop');
    [['rms','coherence'],['envelope','coherence'],['rms','glcmcon']].forEach((pr)=>{
      M.set('fx',pr[0]); M.set('fy',pr[1]);
      const row=['all','bg','ch'].map((p)=>{ M.set('pop',p); const o=M.read(); return o.caseR.toFixed(3).padStart(7)+' ('+o.caseN+')'; });
      console.log('  '+(pr[0]+' vs '+pr[1]).padEnd(24)+' all '+row[0]+'   background '+row[1]+'   channel '+row[2]);
    });
    M.set('fx','rms'); M.set('pop','all');

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(b=>names.add(b.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 900);
}).catch((e) => { console.error(e); process.exit(1); });
