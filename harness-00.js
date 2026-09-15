/* harness-00.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-00.js                                                  */

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

const file = path.join(__dirname, 'modules', 'toomany.html');
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
    const M = win.__M00;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }

    console.log('\n=== EXERCISE 1 and 2: the aeroplane views');
    const p = M.potViews();
    console.log('  points '+p.points);
    console.log('  front '+p.front.toFixed(4)+'   side '+p.side.toFixed(4)+
      '   top '+p.top.toFixed(4)+'   widest '+p.best.toFixed(4));
    console.log('  widest at azimuth '+p.angles.az.toFixed(1)+', elevation '+p.angles.el.toFixed(1));
    console.log('  gain over the best axis view: '+(100*(p.best/p.top-1)).toFixed(1)+'%');

    console.log('\n=== EXERCISE 3: the recipes');
    console.log('  across  '+p.right.map(v=>v.toFixed(3)).join('  '));
    console.log('  up      '+p.up.map(v=>v.toFixed(3)).join('  '));
    const n1=p.right.reduce((a,b)=>a+b*b,0), n2=p.up.reduce((a,b)=>a+b*b,0);
    console.log('  squares add to '+n1.toFixed(6)+' and '+n2.toFixed(6));
    const tot=p.values[0]+p.values[1]+p.values[2];
    console.log('  the two kept hold '+(100*(p.values[0]+p.values[1])/tot).toFixed(1)+
      '%, the discarded one '+(100*p.values[2]/tot).toFixed(1)+'%');

    console.log('\n=== EXERCISE 4: three attributes');
    const tr = M.trio();
    console.log('  explained '+tr.explained.map(v=>(v*100).toFixed(2)+'%').join('  '));
    console.log('  best two hold '+((tr.explained[0]+tr.explained[1])*100).toFixed(2)+'%');
    console.log('  axis views as a fraction of the total: front '+(100*tr.front/(tr.best/((tr.explained[0]+tr.explained[1])))).toFixed(1)+
      '%  side '+(100*tr.side/(tr.best/((tr.explained[0]+tr.explained[1])))).toFixed(1)+
      '%  top '+(100*tr.top/(tr.best/((tr.explained[0]+tr.explained[1])))).toFixed(1)+'%');
    console.log('  PC1 = '+tr.pc1.map(v=>v.toFixed(3)).join(', ')+'  (RMS, envelope, peak)');

    console.log('\n=== EXERCISE 5: twelve attributes');
    const tw = M.twelve();
    console.log('  pairs '+tw.pairs+'   above 0.7: '+tw.strong+
      '   best three hold '+(tw.three*100).toFixed(2)+'%');

    console.log('\n=== THE SCORE BAR: what a reader sees as they drag');
    [[0,0],[90,0],[0,89],[-30,-15],[-50,-25],[-61,-33],[-61,-32]].forEach(function(v){
      M.set('az',v[0]); M.set('el',v[1]);
      const s=M.score();
      console.log('  az '+String(v[0]).padStart(4)+'  el '+String(v[1]).padStart(4)+
        '   spread '+s.now.toFixed(4)+'   '+s.pct.toFixed(1)+'% of best   bar '+
        (s.frac*100).toFixed(0)+'%'+(s.pct>=99?'   WIN':''));
    });

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(x=>names.add(x.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 1500);
}).catch((e) => { console.error(e); process.exit(1); });
