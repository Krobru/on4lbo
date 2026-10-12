/* ON4LBO — JS vanilla, aucune dépendance, aucun appel réseau */
(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function p2(n){return (n<10?'0':'')+n}
function toast(t){var e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show')},1800)}
function fr(n,d){return n.toFixed(d).replace('.',',')}

/* ---------- Locator ---------- */
function loc2ll(l){
  l=(l||'').trim().toUpperCase();
  if(!/^[A-R]{2}[0-9]{2}([A-X]{2})?$/.test(l))return null;
  var lon=(l.charCodeAt(0)-65)*20-180+(+l[2])*2, lat=(l.charCodeAt(1)-65)*10-90+(+l[3]);
  if(l.length===6){lon+=(l.charCodeAt(4)-65)*5/60+2.5/60;lat+=(l.charCodeAt(5)-65)*2.5/60+1.25/60}else{lon+=1;lat+=.5}
  return {lat:lat,lon:lon};
}
function ll2loc(lat,lon){
  lon+=180;lat+=90;var A=65;
  var s=String.fromCharCode(A+Math.floor(lon/20),A+Math.floor(lat/10));
  s+=Math.floor((lon%20)/2)+''+Math.floor(lat%10);
  s+=String.fromCharCode(A+Math.floor((lon%2)*12),A+Math.floor((lat%1)*24)).toLowerCase();
  return s.slice(0,4)+s.slice(4).toUpperCase();
}
var HOME=loc2ll('JO20GQ');
function distBear(a,b){
  var R=6371,r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r;
  var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)*Math.sin(dLon/2);
  var d=2*R*Math.asin(Math.min(1,Math.sqrt(h)));
  var y=Math.sin(dLon)*Math.cos(b.lat*r),x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos(dLon);
  var br=(Math.atan2(y,x)/r+360)%360;return {d:d,b:br};
}
function cardinal(b){return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'][Math.round(b/22.5)%16]}

/* ---------- Soleil (algorithme NOAA simplifié) ---------- */
function sun(date,lat,lon){
  var r=Math.PI/180,start=Date.UTC(date.getUTCFullYear(),0,1),doy=Math.floor((date-start)/864e5)+1;
  var mins=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60;
  var g=2*Math.PI/365*(doy-1+(mins/60-12)/24);
  var eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
  var dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
  var tst=mins+eq+4*lon,ha=(tst/4-180)*r;
  var el=Math.asin(Math.sin(lat*r)*Math.sin(dec)+Math.cos(lat*r)*Math.cos(dec)*Math.cos(ha))/r;
  var c=Math.cos(90.833*r)/(Math.cos(lat*r)*Math.cos(dec))-Math.tan(lat*r)*Math.tan(dec),rise=null,set=null;
  if(c>=-1&&c<=1){var h0=Math.acos(c)/r;rise=720-4*(lon+h0)-eq;set=720-4*(lon-h0)-eq}
  return {el:el,rise:rise,set:set,noon:720-4*lon-eq,mins:mins};
}
function hm(m){m=((m%1440)+1440)%1440;return p2(Math.floor(m/60))+':'+p2(Math.floor(m%60))}

/* ---------- Horloges ---------- */
function tick(){
  var d=new Date();
  $('#utc').textContent=p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds());
  try{$('#local').textContent=d.toLocaleTimeString('fr-BE',{timeZone:'Europe/Brussels',hour12:false})}catch(e){$('#local').textContent=d.toLocaleTimeString()}
  if(d.getSeconds()%10===0||!tick.done){
    var s=sun(d,HOME.lat,HOME.lon),st;
    if(s.el>6)st='☀️ Jour';else if(s.el>-6)st='🌗 Ligne grise';else st='🌙 Nuit';
    $('#sunstate').textContent=st+' · '+fr(s.el,1)+'°';
    if(s.rise!==null)$('#suntimes').textContent='Lever '+hm(s.rise)+' · Coucher '+hm(s.set)+' UTC';
    var x=0.5+((s.mins-s.noon+2160)%1440-720)/1440;$('#sunmark').style.left=(Math.max(0,Math.min(1,x))*100)+'%';
    tick.done=true;
  }
}
tick();setInterval(tick,1000);
$('#yr').textContent=new Date().getFullYear();

/* ---------- Navigation ---------- */
var burger=$('#burger'),menu=$('#menu');
function setMenu(o){menu.classList.toggle('open',o);burger.setAttribute('aria-expanded',o);burger.textContent=o?'✕':'☰';burger.setAttribute('aria-label',o?'Fermer le menu':'Ouvrir le menu')}
burger.addEventListener('click',function(){setMenu(!menu.classList.contains('open'))});
$$('#menu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
var links={};$$('#menu a').forEach(function(a){links[a.getAttribute('href').slice(1)]=a});
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){$$('#menu a').forEach(function(a){a.classList.remove('active');a.removeAttribute('aria-current')});var l=links[e.target.id];if(l){l.classList.add('active');l.setAttribute('aria-current','true')}}})},{rootMargin:'-45% 0px -50% 0px'});
  $$('main section[id]').forEach(function(s){io.observe(s)});
  var rv=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rv.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.reveal').forEach(function(el,i){el.style.transitionDelay=(reduce?0:(i%4)*60)+'ms';rv.observe(el)});
}else{$$('.reveal').forEach(function(el){el.classList.add('in')})}

/* ---------- Oscilloscope du héros ---------- */
var cv=$('#scope'),cx=cv.getContext('2d'),W=0,H=0,dpr=Math.min(2,window.devicePixelRatio||1),t0=performance.now(),running=true;
function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0)}
function draw(now){
  var t=(now-t0)/1000;cx.clearRect(0,0,W,H);
  cx.strokeStyle='rgba(90,180,255,.06)';cx.lineWidth=1;var gs=48;
  for(var gx=0;gx<W;gx+=gs){cx.beginPath();cx.moveTo(gx,0);cx.lineTo(gx,H);cx.stroke()}
  for(var gy=0;gy<H;gy+=gs){cx.beginPath();cx.moveTo(0,gy);cx.lineTo(W,gy);cx.stroke()}
  var waves=[{c:'255,176,32',a:.55,f:1.6,s:1.2,amp:.11,y:.62,w:2},{c:'62,230,176',a:.35,f:2.7,s:-.8,amp:.06,y:.66,w:1.5},{c:'90,180,255',a:.25,f:.9,s:.5,amp:.15,y:.7,w:1.2}];
  waves.forEach(function(w){
    cx.beginPath();cx.lineWidth=w.w;cx.strokeStyle='rgba('+w.c+','+w.a+')';cx.shadowColor='rgba('+w.c+',.8)';cx.shadowBlur=12;
    for(var x=0;x<=W;x+=4){var k=x/W,env=Math.sin(Math.PI*k);var y=H*w.y+Math.sin(k*Math.PI*2*w.f*3+t*w.s*2)*Math.cos(k*Math.PI*w.f+t*w.s)*H*w.amp*env;x?cx.lineTo(x,y):cx.moveTo(x,y)}
    cx.stroke();cx.shadowBlur=0;
  });
  if(!reduce&&running)requestAnimationFrame(draw);
}
size();window.addEventListener('resize',function(){size();if(reduce||!running)draw(performance.now())});
if('IntersectionObserver' in window&&!reduce){new IntersectionObserver(function(es){var v=es[0].isIntersecting;if(v&&!running){running=true;requestAnimationFrame(draw)}running=v}).observe($('.hero'))}
requestAnimationFrame(draw);

/* ---------- Copier ---------- */
function copy(txt,btn){
  function ok(){toast('Copié : '+txt.split('\n')[0]+(txt.indexOf('\n')>0?' …':''));if(btn){btn.classList.add('ok');var o=btn.textContent;btn.textContent='✓ Copié';setTimeout(function(){btn.classList.remove('ok');btn.textContent=o},1500)}}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(txt).then(ok,fb)}else fb();
  function fb(){var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){toast('Copie impossible')}document.body.removeChild(ta)}
}
$$('[data-copy]').forEach(function(b){b.addEventListener('click',function(){copy(b.getAttribute('data-copy'),b)})});
$('#copyprog').addEventListener('click',function(){copy($('#progsheet').textContent,this)});

/* ---------- Calculateur de shift ---------- */
function offs(){
  var f=parseFloat($('#offin').value),s=parseFloat($('#offsh').value),o=$('#offout');
  if(isNaN(f)){o.textContent='Fréquence invalide.';return}
  var tx=f+s;o.textContent='RX '+f.toFixed(4)+' MHz  →  TX '+tx.toFixed(4)+' MHz'+(s?'  (shift '+(s>0?'+':'−')+Math.abs(s).toFixed(3)+')':'  (simplex)');
}
$('#offin').addEventListener('input',offs);$('#offsh').addEventListener('change',offs);offs();

/* ---------- Locator / distance ---------- */
$('#mylatlon').textContent='Centre du carré : '+fr(HOME.lat,4)+'° N, '+fr(HOME.lon,4)+'° E';
function calcLoc(){
  var v=$('#loc').value,o=$('#locout');if(!v.trim()){o.textContent='Entrez un locator pour calculer distance et azimut.';return}
  var b=loc2ll(v);if(!b){o.textContent='Locator invalide (ex. JN18EU ou JO21).';return}
  var r=distBear(HOME,b);
  o.textContent='JO20GQ → '+v.trim().toUpperCase()+'\nDistance : '+Math.round(r.d).toLocaleString('fr-BE')+' km ('+Math.round(r.d*0.621371).toLocaleString('fr-BE')+' mi)\nAzimut depuis ON4LBO : '+Math.round(r.b)+'° ('+cardinal(r.b)+')';
}
$('#loc').addEventListener('input',calcLoc);
$('#geoloc').addEventListener('click',function(){
  if(!navigator.geolocation){toast('Géolocalisation indisponible');return}
  navigator.geolocation.getCurrentPosition(function(p){$('#loc').value=ll2loc(p.coords.latitude,p.coords.longitude);calcLoc()},function(){toast('Position refusée ou indisponible')},{timeout:10000,maximumAge:600000});
});

/* ---------- Morse / CW ---------- */
var M={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
'0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','=':'-...-','+':'.-.-.','-':'-....-','@':'.--.-.'};
function norm(s){return s.toUpperCase().normalize?s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''):s.toUpperCase()}
function enc(s){return norm(s).split(' ').map(function(w){return w.split('').map(function(c){return M[c]||''}).filter(Boolean).join(' ')}).filter(Boolean).join('  /  ')}
function showCode(){$('#cwcode').textContent=enc($('#cwtxt').value).replace(/\./g,'·').replace(/-/g,'−')}
$('#cwtxt').addEventListener('input',showCode);showCode();
$('#wpm').addEventListener('input',function(){$('#wpmv').textContent=this.value});
$('#tone').addEventListener('input',function(){$('#tonev').textContent=this.value});
var ac=null,timers=[],osc=null,led=$('#led');
function stopCW(){timers.forEach(clearTimeout);timers=[];led.classList.remove('on');if(osc){try{osc.stop()}catch(e){}osc=null}}
$('#cwstop').addEventListener('click',stopCW);
$('#cwplay').addEventListener('click',function(){
  stopCW();var AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('Audio non supporté');return}
  ac=ac||new AC();if(ac.state==='suspended')ac.resume();
  var u=1.2/(+$('#wpm').value),f=+$('#tone').value,t=ac.currentTime+0.08,start=t,ramp=0.005;
  var g=ac.createGain();g.gain.value=0;g.connect(ac.destination);
  osc=ac.createOscillator();osc.type='sine';osc.frequency.value=f;osc.connect(g);osc.start(t);
  var words=norm($('#cwtxt').value).split(/\s+/).filter(Boolean);
  words.forEach(function(w,wi){
    w.split('').forEach(function(ch,ci){
      var code=M[ch];if(!code)return;
      code.split('').forEach(function(sym,si){
        var d=(sym==='.'?1:3)*u;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+ramp);g.gain.setValueAtTime(.35,t+d-ramp);g.gain.linearRampToValueAtTime(0,t+d);
        (function(on,dur){timers.push(setTimeout(function(){led.classList.add('on')},on*1000));timers.push(setTimeout(function(){led.classList.remove('on')},(on+dur)*1000))})(t-ac.currentTime,d);
        t+=d+u;
      });
      t+=2*u;
    });
    t+=4*u;
  });
  osc.stop(t+0.05);timers.push(setTimeout(function(){osc=null},(t-ac.currentTime)*1000+100));
});

/* ---------- Filtres équipement ---------- */
$$('.chip').forEach(function(c){c.addEventListener('click',function(){
  var f=c.getAttribute('data-f');$$('.chip').forEach(function(x){x.setAttribute('aria-pressed',x===c)});
  $$('#gear .card').forEach(function(card){var show=f==='all'||(' '+card.getAttribute('data-t')+' ').indexOf(' '+f+' ')>-1;card.classList.toggle('hide',!show);if(show)card.classList.add('in')});
})});
})();
