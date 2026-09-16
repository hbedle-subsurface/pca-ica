/* small, meaningful thumbnails for the index cards — generated, not drawn */
var MV=require('/home/claude/pca-ica/assets/multivar.js');
var SHAPE=require('/home/claude/pca-ica/assets/shape3d.js');
global.MV=MV;
var W=300,H=96,BG='#F6F4EE',INK='#16191C',CRIM='#841617',TEAL='#0B7285',GRAY='#9AA3AA';
function open_(){return '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false"><rect width="'+W+'" height="'+H+'" fill="'+BG+'"/>';}
function dot(x,y,r,c,o){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" fill="'+c+'"'+(o?' opacity="'+o+'"':'')+'/>';}
function line(x1,y1,x2,y2,c,w,d){return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="'+c+'" stroke-width="'+(w||1.4)+'"'+(d?' stroke-dasharray="'+d+'"':'')+'/>';}
function rect(x,y,w,h,c,o){return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" fill="'+c+'"'+(o?' opacity="'+o+'"':'')+'/>';}
function lcg(s){return function(){s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
function gauss(r){var u=Math.max(r(),1e-9),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
var T={};

// 00 — three teapot silhouettes
(function(){
  var pts=SHAPE.plane({density:1});
  var keep=[]; for(var q=0;q<pts.length;q+=11) keep.push(pts[q]);
  var s=open_();
  [[0,0],[141,-61]].forEach(function(v,k){
    var view=SHAPE.viewFromAngles(v[0],v[1]);
    var pr=SHAPE.project(keep,view);
    var cx=78+k*146, cy=H/2, sc=20;
    pr.forEach(function(p){
      var c=p.part==='fin'?CRIM:(p.part==='tail'?TEAL:(p.part==='engine'?'#B07C2E':GRAY));
      s+=dot(cx+p.u*sc,cy-p.v*sc,1,c);
    });
  });
  s+=line(0,H-3,W,H-3,k=CRIM,0); T['00']=s+'</svg>';
})();

// 01 — tilted cloud with a direction line
(function(){
  var r=lcg(7),s=open_();
  for(var i=0;i<170;i++){var a=gauss(r)*26,b=gauss(r)*9,th=59*Math.PI/180;
    var x=W/2+a*Math.cos(th)-b*Math.sin(th), y=H/2-(a*Math.sin(th)+b*Math.cos(th));
    s+=dot(x,y,1,INK,0.4);}
  var th=59*Math.PI/180,L=60;
  s+=line(W/2-Math.cos(th)*L,H/2+Math.sin(th)*L,W/2+Math.cos(th)*L,H/2-Math.sin(th)*L,CRIM,2);
  T['01']=s+'</svg>';
})();

// 02 — cloud with an ellipse
(function(){
  var r=lcg(11),s=open_();
  for(var i=0;i<160;i++){var a=gauss(r)*24,b=gauss(r)*11,th=35*Math.PI/180;
    s+=dot(W/2+a*Math.cos(th)-b*Math.sin(th),H/2-(a*Math.sin(th)+b*Math.cos(th)),1,INK,0.35);}
  var pth='';
  for(var t=0;t<=48;t++){var u=t/48*2*Math.PI,A=48,B=22,th2=35*Math.PI/180;
    var ex=A*Math.cos(u),ey=B*Math.sin(u);
    var X=W/2+ex*Math.cos(th2)-ey*Math.sin(th2), Y=H/2-(ex*Math.sin(th2)+ey*Math.cos(th2));
    pth+=(t?'L':'M')+X.toFixed(1)+' '+Y.toFixed(1);}
  s+='<path d="'+pth+'Z" fill="none" stroke="'+TEAL+'" stroke-width="2"/>';
  T['02']=s+'</svg>';
})();

// 03 — two bar sets, native vs standardized
(function(){
  var s=open_(),vals=[[0.001,0.001,0.15,0.95,0.006,0.27],[0.51,0.38,0.26,0.44,0.44,0.38]];
  for(var g=0;g<2;g++){for(var i=0;i<6;i++){
    var x=18+g*150+i*20, h=vals[g][i]*70;
    s+=rect(x,H-16-h,13,h,g?TEAL:CRIM,0.85);}}
  s+=line(W/2,8,W/2,H-8,GRAY,1,'3 3');
  T['03']=s+'</svg>';
})();

// 04 — a sweep curve with the eigen answer marked
(function(){
  var s=open_(),pth='';
  for(var a=0;a<=180;a+=3){var v=1+0.62*Math.cos(2*(a-135)*Math.PI/180);
    var X=14+a/180*(W-28), Y=H-12-(v/2)*(H-26);pth+=(a?'L':'M')+X.toFixed(1)+' '+Y.toFixed(1);}
  s+='<path d="'+pth+'" fill="none" stroke="'+INK+'" stroke-width="2"/>';
  var X=14+135/180*(W-28),Y=H-12-(1.62/2)*(H-26);
  s+=line(X,10,X,H-10,TEAL,1.4,'5 3')+dot(X,Y,4,TEAL);
  T['04']=s+'</svg>';
})();

// 05 — scree bars with a cut
(function(){
  var s=open_(),v=[3.13,1.29,0.74,0.45,0.26,0.13];
  for(var i=0;i<6;i++){var x=24+i*44,h=v[i]/3.4*70;
    s+=rect(x,H-16-h,26,h,i<3?CRIM:GRAY,i<3?0.9:0.4);}
  s+=line(24+3*44-6,8,24+3*44-6,H-10,INK,1.6);
  T['05']=s+'</svg>';
})();

// 06 — two directions 37 degrees apart against a perpendicular pair
(function(){
  var s=open_(),cx=W/2,cy=H/2,L=44;
  [[0,GRAY],[90,GRAY]].forEach(function(q){var a=q[0]*Math.PI/180;
    s+=line(cx-Math.cos(a)*L,cy+Math.sin(a)*L,cx+Math.cos(a)*L,cy-Math.sin(a)*L,q[1],1.6,'4 3');});
  [[24,CRIM],[61,TEAL]].forEach(function(q){var a=q[0]*Math.PI/180;
    s+=line(cx-Math.cos(a)*L,cy+Math.sin(a)*L,cx+Math.cos(a)*L,cy-Math.sin(a)*L,q[1],2.4);});
  T['06']=s+'</svg>';
})();

// 07 — a peaked histogram against a bell
(function(){
  var s=open_(),NB=34;
  for(var i=0;i<NB;i++){var z=-4+8*(i+0.5)/NB;
    var d=Math.exp(-Math.abs(z)*1.55)*0.72;
    var x=14+i*(W-28)/NB,h=Math.min(1,d/0.45)*72;
    s+=rect(x,H-12-h,(W-28)/NB-1.2,h,CRIM,0.8);}
  var pth='';
  for(i=0;i<=60;i++){var z2=-4+8*i/60,g=Math.exp(-z2*z2/2)/Math.sqrt(2*Math.PI);
    var X=14+(z2+4)/8*(W-28),Y=H-12-Math.min(1,g/0.45)*72;pth+=(i?'L':'M')+X.toFixed(1)+' '+Y.toFixed(1);}
  s+='<path d="'+pth+'" fill="none" stroke="'+TEAL+'" stroke-width="2"/>';
  T['07']=s+'</svg>';
})();

// 08 — a round whitened ball with one direction picked out
(function(){
  var r=lcg(19),s=open_();
  for(var i=0;i<190;i++){var a=gauss(r)*17,b=gauss(r)*17;
    s+=dot(W/2+a,H/2-b,1,INK,0.32);}
  var a2=40*Math.PI/180,L=46;
  s+=line(W/2-Math.cos(a2)*L,H/2+Math.sin(a2)*L,W/2+Math.cos(a2)*L,H/2-Math.sin(a2)*L,CRIM,2.4);
  s+=line(W/2,H/2-46,W/2,H/2+46,GRAY,1.4,'4 3');
  s+=line(W/2-46,H/2,W/2+46,H/2,GRAY,1.4,'4 3');
  T['08']=s+'</svg>';
})();

// 09/10/11 — simple placeholders with distinct character
(function(){
  var s=open_();
  for(var g=0;g<2;g++){var r=lcg(23+g);
    for(var i=0;i<95;i++){var a=gauss(r)*(g?16:24),b=gauss(r)*(g?16:8),th=(g?40:0)*Math.PI/180;
      s+=dot(78+g*146+a*Math.cos(th)-b*Math.sin(th),H/2-(a*Math.sin(th)+b*Math.cos(th)),1,g?TEAL:CRIM,0.4);}}
  s+=line(W/2,8,W/2,H-8,GRAY,1,'3 3');
  T['09']=s+'</svg>';
})();
(function(){
  var s=open_();
  for(var k=0;k<3;k++){var x=18+k*96;
    s+='<rect x="'+x+'" y="14" width="84" height="68" fill="none" stroke="'+GRAY+'" stroke-width="1"/>';
    for(var i=0;i<40;i++){var t=i/39;
      if(k===0) s+=rect(x+6+i*1.8,48-Math.sin(t*9)*22,1.5,2,INK,0.8);
      if(k===1) s+=rect(x+6+i*1.8,48-Math.exp(-Math.pow((t-0.4)*4,2))*26,1.5,2,CRIM,0.85);
      if(k===2) s+=dot(x+6+i*1.8,48-Math.cos(t*7)*20,1.2,TEAL,0.8);}}
  T['10']=s+'</svg>';
})();
(function(){
  var r=lcg(31),s=open_();
  for(var ix=0;ix<24;ix++)for(var iy=0;iy<8;iy++){
    var v=Math.cos(2*Math.PI*ix/4)*Math.cos(2*Math.PI*iy/4);
    s+=rect(14+ix*(W-28)/24,16+iy*8,(W-28)/24-0.8,7.2,v>0?CRIM:TEAL,0.15+0.5*Math.abs(v));}
  T['11']=s+'</svg>';
})();

require('fs').writeFileSync('/tmp/thumbs.json',JSON.stringify(T));
console.log('thumbs generated:',Object.keys(T).join(' '),' sizes:',Object.keys(T).map(k=>T[k].length).join(','));
