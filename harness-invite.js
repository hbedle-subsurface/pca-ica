/* Does the invitation actually move the control, and does it stop on touch? */
const fs=require('fs'), path=require('path'), {JSDOM,VirtualConsole}=require('jsdom');
function stub(win){
  const noop=()=>{};
  const ctx=new Proxy({},{get(t,k){
    if(k==='measureText')return()=>({width:40});
    if(k==='createLinearGradient'||k==='createPattern')return()=>({addColorStop:noop});
    if(k==='canvas')return{width:800,height:400};
    if(k==='getImageData')return()=>({data:new Uint8ClampedArray(4)});
    if(typeof k==='string'&&/^(font|fillStyle|strokeStyle|lineWidth|textAlign|textBaseline|globalAlpha|lineCap|lineJoin|miterLimit|shadowBlur|shadowColor)$/.test(k))return t[k];
    return noop;},set(t,k,v){t[k]=v;return true;}});
  win.HTMLCanvasElement.prototype.getContext=()=>ctx;
  Object.defineProperty(win.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:{clientWidth:900};},configurable:true});
  Object.defineProperty(win.HTMLElement.prototype,'clientWidth',{get(){return 900;},configurable:true});
}
const cases=[['toomany.html','__M00','az'],['directions.html','__M01','ang'],
             ['wherepcastops.html','__M06','rot'],['independence.html','__M07','rot5'],
             ['ica.html','__M08','k']];
(async()=>{
 for(const [file,tok,key] of cases){
  const vc=new VirtualConsole();
  const dom=await JSDOM.fromFile(path.join('/home/claude/pca-ica/modules',file),
    {runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,
     beforeParse(win){stub(win);win.getComputedStyle=()=>({paddingLeft:'26px',paddingRight:'26px'});}});
  const win=dom.window;
  await new Promise(r=>setTimeout(r,900));
  const M=win[tok];
  if(!M){console.log(file,'NO MODULE');dom.window.close();continue;}
  // put it on the step that carries the challenge
  const step={'toomany.html':'p2','directions.html':'p2','wherepcastops.html':'p4',
              'independence.html':'p5','ica.html':'p5'}[file];
  // click the real tab, because that is what fires the invitation
  const btn=win.document.querySelector('#tabs button[data-tab="'+step+'"]');
  if(btn) btn.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));
  else M.set('tab',step);
  const g=(id)=>{const e=win.document.getElementById(id);return e?e.value:null;};
  const before=g(key);
  // sample repeatedly so a drift that returns to its start is still seen
  let seen=new Set([String(before)]);
  for(let n=0;n<40;n++){await new Promise(r=>setTimeout(r,60));seen.add(String(g(key)));}
  await new Promise(r=>setTimeout(r,900));
  const after=g(key);
  const moved=seen.size>1;
  const returned=String(before)===String(after);
  // now "touch" the page and confirm the drift is over
  win.document.dispatchEvent(new win.Event('pointerdown',{bubbles:true}));
  const mid=win.document.getElementById(key)?win.document.getElementById(key).value:null;
  await new Promise(r=>setTimeout(r,1400));
  const end=win.document.getElementById(key)?win.document.getElementById(key).value:null;
  const stopped=String(mid)===String(end);
  console.log(`${file.padEnd(22)} ${key}: start ${before}, saw ${seen.size} values, ended ${after}`);
  console.log(`   drifted:${moved?'yes':'NO'}   returned to start:${returned?'yes':'NO'}   stops on touch:${stopped?'yes':'NO'}`);
  console.log(`   say: "${win.document.getElementById('scoreSay').textContent}"`);
  dom.window.close();
 }
})();
