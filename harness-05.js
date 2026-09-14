/* harness-05.js — open modules/directions.html headless, drive every control,
   and print what the page reports. Every number quoted in the module's prose
   and exercises has to come out of here.

   Run: node harness-05.js                                                  */

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

const file = path.join(__dirname, 'modules', 'howmany.html');
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
    const M = win.__M05;
    if (!M) { console.error('module did not expose its state'); process.exit(1); }
    const sc = M.scree();

    console.log('\n=== EXERCISE 1: the scree and the five rules');
    sc.values.forEach((v,i)=>console.log('  PC'+(i+1)+'  eig '+v.toFixed(4)+'   '+
      (sc.explained[i]*100).toFixed(2)+'%   cumulative '+(sc.cumulative[i]*100).toFixed(2)+
      '%   broken-stick expectation '+(sc.stick[i]*100).toFixed(2)+'%'));
    M.rules().forEach(r=>console.log('  '+r.label.padEnd(14)+' keeps '+r.k+'   retaining '+(r.retained*100).toFixed(2)+'%'));

    console.log('\n=== EXERCISE 3: residual per attribute, by cut');
    const N=['rms','envelope','peakfreq','bandwidth','coherence','glcmcon'];
    for(let k=1;k<=6;k++){
      console.log('  k='+k+'  '+M.residuals(k).map((v,i)=>N[i].slice(0,5)+' '+v.toFixed(3)).join('  '));
    }

    console.log('\n=== EXERCISE 4 and 5: variance ranking against usefulness');
    ['sep','foot'].forEach((w)=>{
      const j=M.judgement(w);
      console.log('  measuring '+(w==='sep'?'channel separation':'acquisition footprint'));
      console.log('    components  '+j.components.map((v,i)=>'PC'+(i+1)+' '+v.toFixed(3)+' ('+(j.explained[i]*100).toFixed(1)+'%)').join('  '));
      console.log('    attributes  '+j.attributes.map((v,i)=>N[i].slice(0,5)+' '+v.toFixed(3)).join('  '));
      const bc=j.components.indexOf(Math.max(...j.components));
      const ba=j.attributes.indexOf(Math.max(...j.attributes));
      console.log('    best component PC'+(bc+1)+' at '+j.components[bc].toFixed(3)+
        '   best attribute '+N[ba]+' at '+j.attributes[ba].toFixed(3));
    });

    console.log('\n=== GLOSSARY');
    const marked=win.document.querySelectorAll('button.gterm');
    const names=new Set(); marked.forEach(x=>names.add(x.getAttribute('data-term')));
    console.log('  '+marked.length+' marks, '+names.size+' terms: '+Array.from(names).sort().join(', '));

    dom.window.close();
  }, 900);
}).catch((e) => { console.error(e); process.exit(1); });
