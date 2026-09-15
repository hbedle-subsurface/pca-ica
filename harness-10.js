/* harness-10.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-10.js                                                  */

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

const file = path.join(__dirname, 'modules', 'dimensions.html');
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
    const M = win.__M10;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }
    const F = M.spaces();
    const lab={attr:'attributes',wave:'time samples',spec:'frequencies'};
    console.log('\n=== the three framings');
    F.forEach(f=>{
      console.log('  '+lab[f.space].padEnd(13)+f.dims+' dims   90% at '+f.k90+
        '   explained '+f.explained.map(v=>(v*100).toFixed(1)+'%').join(' '));
      console.log('     channel separation '+f.seps.map(v=>v.toFixed(2)).join('  '));
      console.log('     zero crossings     '+f.crossings.join('  '));
    });
    const all=[]; F.forEach(f=>f.seps.forEach((s,i)=>all.push({sp:f.space,pc:i+1,s:Math.abs(s)})));
    const b=all.reduce((a,c)=>c.s>a.s?c:a);
    const P=M.prior();
    console.log('\n=== EXERCISE 4: the framing against the method');
    console.log('  best anywhere: '+lab[b.sp]+' component '+b.pc+' at '+b.s.toFixed(2));
    console.log('  attribute PCA '+P.pca.toFixed(2)+'   attribute ICA '+P.ica.toFixed(2)+
      '   best raw attribute '+P.attr.toFixed(2)+'   ceiling '+P.ceiling.toFixed(2));
    console.log('  framing beat the method: '+(b.s>P.ica?'yes':'no'));
    console.log('\n=== spectral loadings');
    [0,1,2].forEach(c=>console.log('  component '+(c+1)+': '+
      M.loadings('spec',c).map(v=>v.toFixed(2)).join(' ')));
    console.log('\n=== THE SCORE BAR');
    ['attr','wave','spec'].forEach(sp=>{ M.set('space',sp);
      let row=[]; for(let p=1;p<=6;p++){ M.set('pc',p); const s=M.score();
        row.push(p+':'+s.pct.toFixed(0)+'%'+(s.pct>=99?'WIN':'')); }
      console.log('  '+lab[sp].padEnd(13)+row.join('  '));
    });
    dom.window.close();
  }, 2500);
}).catch((e) => { console.error(e); process.exit(1); });
