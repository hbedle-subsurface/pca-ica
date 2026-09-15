/* harness-08.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-08.js                                                  */

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

const file = path.join(__dirname, 'modules', 'ica.html');
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
    const M = win.__M08;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }

    ['logcosh','kurtosis'].forEach((con)=>{
      console.log('\n=== components, contrast '+con+', six retained');
      M.components(con,6).forEach(c=>console.log('  IC'+c.ic+
        '   young '+c.young.toFixed(3).padStart(8)+'   old '+c.old.toFixed(3).padStart(8)+
        '   kurt '+c.kurt.toFixed(2).padStart(7)+'   neg '+c.neg.toExponential(2)+
        '   var '+c.variance.toFixed(4)+'   fp '+c.foot.toFixed(3)+'   iters '+c.iters));
    });

    console.log('\n=== EXERCISE 1: set against everything measured');
    M.set('con','logcosh'); M.set('k',6); M.set('tgt','young');
    let cmp = M.comparison();
    console.log('  best IC '+cmp.bestIC.value.toFixed(3)+' (IC'+(cmp.bestIC.index+1)+')');
    console.log('  best PC '+cmp.bestPC.value.toFixed(3));
    console.log('  best attribute '+cmp.bestAttr.value.toFixed(3));
    console.log('  ceiling '+cmp.ceiling.toFixed(3)+'   fraction recovered '+
      (100*cmp.bestIC.value/cmp.ceiling).toFixed(1)+'%');
    M.set('tgt','old'); cmp = M.comparison();
    console.log('  older channel: best IC '+cmp.bestIC.value.toFixed(3)+
      '   best PC '+cmp.bestPC.value.toFixed(3)+'   ceiling '+cmp.ceiling.toFixed(3));
    M.set('tgt','young');

    console.log('\n=== EXERCISE 3: four seeded starts against the reference run');
    M.starts().forEach(s=>console.log('  start '+s.seed+':  '+
      s.row.map(r=>'found'+r.found+'->IC'+r.matches+' |r|='+r.r.toFixed(3)).join('  ')));

    console.log('\n=== EXERCISE 5: the two choices');
    M.curve().forEach(c=>console.log('  '+c.contrast.padEnd(9)+' k='+c.k+'   best '+c.best.toFixed(3)));
    console.log('  contrast agreement (logcosh against kurtosis):');
    M.contrastAgreement().forEach(a=>console.log('    logcosh IC'+a.logcosh+' -> kurtosis IC'+a.kurtosis+
      '   |r| = '+a.r.toFixed(4)));


    console.log('\n=== THE SCORE BAR: the ten parameter combinations');
    ['logcosh','kurtosis'].forEach(function(con){
      M.set('con',con);
      let row=[];
      for(let k=2;k<=6;k++){ M.set('k',k); const s=M.score();
        row.push('k='+k+' '+s.now.toFixed(2)+' ('+s.pct.toFixed(0)+'%'+(s.pct>=99?' WIN':'')+')'); }
      console.log('  '+con.padEnd(9)+' '+row.join('   '));
    });
    M.set('con','logcosh'); M.set('k',6);

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(x=>names.add(x.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 2500);
}).catch((e) => { console.error(e); process.exit(1); });
