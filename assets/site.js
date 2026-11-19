/* 에너지참견시점 수업 웹 — 공통 동작 (의존성 없음)
   - .intro      : 전체 화면 장면 시퀀스(영상·사진·자막, 자동 진행, 섬광 전환, 빛 입자)
   - .reveal     : 스크롤하면 나타남      - [data-count-to] : 숫자 올라가기
   - .tabs       : 차시 탭                - .runner : 단계 진행기(← → 키)
   - .timer      : 활동 타이머            - .deck   : PPT 슬라이드 뷰어
   - .vframe     : 유튜브 지연 로딩       - textarea.pad[data-key] : 브라우저에 임시 저장
   - ul.checks   : 누르면 체크(저장)      - .tdock : 진행 중 타이머를 화면 구석에 계속 표시
   - 교사 모드 / 프로젝터 모드 / 전체 화면 버튼 */
(function(){
"use strict";
var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

/* ── 진행 막대 ── */
var pb=document.createElement("div");pb.className="progress";document.body.appendChild(pb);
function onScroll(){var h=document.documentElement;var m=h.scrollHeight-h.clientHeight;pb.style.width=(m>0?h.scrollTop/m*100:0)+"%"}
addEventListener("scroll",onScroll,{passive:true});onScroll();

/* ── 나타나기 + 숫자 ── */
function countUp(el){
  var to=parseFloat(el.getAttribute("data-count-to")),dec=(el.getAttribute("data-count-to").split(".")[1]||"").length;
  var pre=el.getAttribute("data-pre")||"",suf=el.getAttribute("data-suf")||"",dur=+el.getAttribute("data-dur")||1600,t0=null;
  function fmt(v){return pre+v.toLocaleString("ko-KR",{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf}
  if(RM){el.textContent=fmt(to);return}
  function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(to*e);if(p<1)requestAnimationFrame(f)}
  requestAnimationFrame(f);
}
var io="IntersectionObserver" in window?new IntersectionObserver(function(es){es.forEach(function(e){
  if(!e.isIntersecting)return;var el=e.target;el.classList.add("in");
  if(el.hasAttribute("data-count-to"))countUp(el);
  $$("[data-count-to]",el).forEach(function(c){if(!c._done){c._done=1;countUp(c)}});
  io.unobserve(el);
})},{threshold:.18,rootMargin:"0px 0px -6% 0px"}):null;
$$(".reveal,[data-count-to],.inview").forEach(function(el){if(io)io.observe(el);else{el.classList.add("in")}});

/* ── 빛 입자 캔버스 ── */
function motes(cv){
  var ctx=cv.getContext("2d"),W,H,ps=[],mode=cv.getAttribute("data-mode")||"rise",n=+cv.getAttribute("data-n")||70,raf;
  function size(){var r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=cv.width=r.width*d;H=cv.height=r.height*d}
  function mk(){return{x:Math.random()*W,y:mode==="rise"?H+Math.random()*H*.5:Math.random()*H,r:(Math.random()*1.8+.5)*(devicePixelRatio||1),v:Math.random()*.5+.15,a:Math.random()*.6+.2,w:Math.random()*Math.PI*2}}
  size();for(var i=0;i<n;i++){var p=mk();p.y=Math.random()*H;ps.push(p)}
  addEventListener("resize",size);
  function draw(){
    ctx.clearRect(0,0,W,H);
    ps.forEach(function(p,i){
      p.w+=.02;p.y-=p.v*(devicePixelRatio||1);p.x+=Math.sin(p.w)*.3;
      if(p.y<-10)ps[i]=mk();
      var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
      g.addColorStop(0,"rgba(255,252,225,"+p.a+")");g.addColorStop(1,"rgba(214,232,150,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r*4,0,7);ctx.fill();
    });
    raf=requestAnimationFrame(draw);
  }
  if(!RM)draw();
}
$$("canvas.motes").forEach(motes);

/* ── 인트로 장면 시퀀스 ── */
$$(".intro").forEach(function(box){
  var sc=$$(".scene",box),i=-1,timer=null,paused=RM;
  var ui=$(".intro-ui",box),dots=$(".dots",box),flash=$(".flash",box);
  if(dots){sc.forEach(function(_,k){var b=document.createElement("button");b.setAttribute("aria-label","장면 "+(k+1));b.onclick=function(){go(k,true)};dots.appendChild(b)})}
  function go(k,manual){
    if(k===i)return;
    var prev=sc[i];i=(k+sc.length)%sc.length;var s=sc[i];
    if(prev){prev.classList.remove("on");var pv=$("video",prev);if(pv){pv.pause()}}
    if(flash&&s.hasAttribute("data-flash")&&!RM){flash.classList.remove("go");void flash.offsetWidth;flash.classList.add("go")}
    s.classList.add("on");
    var v=$("video",s);if(v&&!RM){try{v.currentTime=0;var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}catch(e){}}
    if(dots)$$("button",dots).forEach(function(b,n){b.classList.toggle("on",n===i)});
    clearTimeout(timer);
    var last=i===sc.length-1;
    if(!paused&&!(last&&box.hasAttribute("data-hold-last"))){
      var d=+s.getAttribute("data-dur")||5200;
      if(v&&s.hasAttribute("data-until-end")){v.onended=function(){if(!paused)go(i+1)}}
      else timer=setTimeout(function(){go(i+1)},d);
    }
  }
  var bp=$("[data-intro=prev]",box),bn=$("[data-intro=next]",box),bpause=$("[data-intro=pause]",box);
  if(bp)bp.onclick=function(){go(i-1,true)};
  if(bn)bn.onclick=function(){go(i+1,true)};
  if(bpause)bpause.onclick=function(){paused=!paused;bpause.setAttribute("aria-pressed",paused);bpause.textContent=paused?"재생":"일시정지";if(!paused)go(i+1);else clearTimeout(timer)};
  box.tabIndex=-1;
  if(RM&&bpause){bpause.setAttribute("aria-pressed","true");bpause.textContent="재생"}
  if($("video[src*='assets/video/M'], video source[src*='assets/video/M']",box)&&!$(".ai-badge",box)){var ab=document.createElement("span");ab.className="ai-badge";ab.textContent="AI 생성 영상 포함";box.appendChild(ab)}
  box.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){go(i+1,true)}if(e.key==="ArrowLeft"){go(i-1,true)}});
  /* 화면 밖이면 멈춤 */
  var seen=false;
  if("IntersectionObserver" in window){new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting){clearTimeout(timer);$$("video",box).forEach(function(v){v.pause()});return}
    if(!seen){seen=true;go(RM?sc.length-1:0);return}
    if(paused||i<0)return;
    var s=sc[i],v=$("video",s);
    if(v&&v.paused&&!v.ended){v.play().catch(function(){})}
    clearTimeout(timer);
    if(!(i===sc.length-1&&box.hasAttribute("data-hold-last"))&&!(v&&s.hasAttribute("data-until-end")))timer=setTimeout(function(){go(i+1)},+s.getAttribute("data-dur")||5200);
  })},{threshold:.3}).observe(box)}else go(RM?sc.length-1:0);
});

/* ── 탭 ── */
$$(".tabs").forEach(function(tl){
  var bs=$$("button[role=tab]",tl);
  function sel(b){bs.forEach(function(x){var on=x===b;x.setAttribute("aria-selected",on);var p=document.getElementById(x.getAttribute("aria-controls"));if(p)p.hidden=!on});
    var key=tl.getAttribute("data-key");if(key)store(key,b.id)}
  bs.forEach(function(b){b.onclick=function(){sel(b)}});
  var k=tl.getAttribute("data-key"),saved=k&&store(k),sb=saved&&document.getElementById(saved);
  sel(sb&&bs.indexOf(sb)>=0?sb:bs[0]);
});

/* ── 단계 진행기 ── */
var activeRunner=null;
$$(".runner").forEach(function(r){
  var st=$$(".step",r),i=0,rail=$(".runner-rail",r),ph=$(".phase",r),tm=$(".time",r),cnt=$(".count",r);
  var prev=$("[data-run=prev]",r),next=$("[data-run=next]",r);
  if(rail){rail.innerHTML="";st.forEach(function(){rail.appendChild(document.createElement("i"))})}
  function show(k,dir){
    if(k<0||k>=st.length)return;
    st.forEach(function(s,n){s.classList.remove("on","back");if(n===k){if(dir<0)s.classList.add("back");void s.offsetWidth;s.classList.remove("back");s.classList.add("on")}});
    i=k;var s=st[k];
    if(ph)ph.textContent=s.getAttribute("data-phase")||"";
    if(tm)tm.textContent=s.getAttribute("data-time")||"";
    if(cnt)cnt.textContent=(k+1)+" / "+st.length;
    if(rail)$$("i",rail).forEach(function(b,n){b.className=n<k?"past":n===k?"now":""});
    if(prev)prev.disabled=k===0;if(next){next.disabled=k===st.length-1}
    $$(".reveal",s).forEach(function(e){e.classList.add("in")});
    $$("[data-count-to]",s).forEach(function(c){countUp(c)});
  }
  if(prev)prev.onclick=function(){show(i-1,-1)};
  if(next)next.onclick=function(){show(i+1,1)};
  r.addEventListener("pointerenter",function(){activeRunner=r});
  r._go=function(d){show(i+d,d)};
  show(0,1);
});
addEventListener("keydown",function(e){
  if(/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||""))return;
  function vis(x){if(!x||x.offsetParent===null)return false;var b=x.getBoundingClientRect();return b.height>0&&b.bottom>0&&b.top<innerHeight}
  var r=vis(activeRunner)?activeRunner:null;
  if(!r){var best=null,bd=1e9;$$(".runner").forEach(function(x){if(!vis(x))return;var b=x.getBoundingClientRect();var d=Math.abs(b.top+b.height/2-innerHeight/2);if(d<bd){bd=d;best=x}});r=best;activeRunner=r}
  if(!r||r.offsetParent===null)return;
  var b=r.getBoundingClientRect();if(b.bottom<0||b.top>innerHeight)return;
  if(e.key==="ArrowRight"||e.key==="PageDown"){r._go(1);e.preventDefault()}
  if(e.key==="ArrowLeft"||e.key==="PageUp"){r._go(-1);e.preventDefault()}
});

/* ── 타이머: 시작하면 단계·슬라이드를 넘기거나 다른 차시로 가도 화면 구석(.tdock)에 계속 보임 ── */
(function(){
  var SK="ecg:timer",act=null,list=[];
  function ss(v){try{if(v===undefined)return sessionStorage.getItem(SK);if(v===null)sessionStorage.removeItem(SK);else sessionStorage.setItem(SK,v)}catch(e){return null}}
  function L(s){return s.end?Math.max(0,Math.ceil((s.end-Date.now())/1000)):s.left}
  function fmt(x){var m=Math.floor(x/60),c=x%60;return m+":"+(c<10?"0":"")+c}
  function vis(el){if(!el||el.offsetParent===null)return false;var st=el.closest(".step");if(st&&!st.classList.contains("on"))return false;var b=el.getBoundingClientRect();return b.bottom>60&&b.top<innerHeight-60}
  function name(t){var s=t.closest(".step,.card,section"),h=s&&$("h2,h3",s);return ((h&&h.textContent.replace(/\s+/g," ").trim())||"활동").slice(0,40)}
  function btxt(s){return s.end?"멈춤":(s.left>0&&s.left<s.total?"계속":"시작")}
  function toggle(s){
    if(s.end){s.left=L(s);s.end=0}
    else{if(act&&act!==s&&act.end){act.left=L(act);act.end=0}act=s;if(L(s)===0)s.left=s.total;s.end=Date.now()+s.left*1000}
    draw();
  }
  function reset(s){s.end=0;s.left=s.total;if(act===s)act=null;draw()}
  $$(".timer").forEach(function(t,n){
    var s={key:location.pathname+"#"+n,total:(+t.getAttribute("data-min")||5)*60,end:0,el:t,label:name(t)};s.left=s.total;
    t.innerHTML='<span class="t"></span><span class="bar"><i></i></span><button class="tbtn" type="button">시작</button><button class="tbtn" type="button" aria-label="다시">↺</button>';
    s.out=$(".t",t);s.bar=$(".bar i",t);s.bs=$$("button",t);
    s.bs[0].onclick=function(){toggle(s)};s.bs[1].onclick=function(){reset(s)};
    list.push(s);
  });
  if(!list.length&&!ss())return;
  var dock=document.createElement("div");dock.className="tdock";dock.hidden=true;dock.setAttribute("role","timer");
  dock.innerHTML='<span class="lab"></span><span class="t"></span><span class="bar"><i></i></span><button type="button" data-d="go"></button><button type="button" data-d="re" aria-label="처음부터">↺</button><button type="button" data-d="x" aria-label="타이머 끄기">✕</button>';
  document.body.appendChild(dock);
  $("[data-d=go]",dock).onclick=function(){if(act)toggle(act)};
  $("[data-d=re]",dock).onclick=function(){if(act){act.end=0;act.left=act.total;draw()}};
  $("[data-d=x]",dock).onclick=function(){if(act)reset(act)};
  try{var o=JSON.parse(ss()||"null");if(o){var m=list.filter(function(s){return s.key===o.key})[0]||{key:o.key,el:null};m.total=o.total;m.end=o.end;m.left=o.left;m.label=o.label;act=m}}catch(e){}
  function draw(){
    if(act&&act.end&&L(act)===0){act.end=0;act.left=0}
    list.forEach(function(s){var l=L(s);s.out.textContent=fmt(l);s.bar.style.width=(l/s.total*100)+"%";s.bs[0].textContent=btxt(s);s.el.classList.toggle("done",l===0)});
    var on=!!(act&&(act.end||act.left<act.total));
    dock.hidden=!on||vis(act.el);
    if(on){var l=L(act);$(".lab",dock).textContent=act.label;$(".t",dock).textContent=l===0?"끝!":fmt(l);$(".bar i",dock).style.width=(l/act.total*100)+"%";$("[data-d=go]",dock).textContent=l===0?"다시":btxt(act);dock.classList.toggle("done",l===0)}
    if(on)ss(JSON.stringify({key:act.key,total:act.total,end:act.end,left:act.end?0:act.left,label:act.label}));else ss(null);
  }
  document.addEventListener("fullscreenchange",function(){(document.fullscreenElement||document.body).appendChild(dock)});
  addEventListener("scroll",function(){if(act)draw()},{passive:true});
  setInterval(function(){if(act)draw()},250);
  draw();
})();

/* ── 확인 목록(ul.checks): 누르면 체크, 이 기기에 저장(같은 화면의 같은 항목은 함께 바뀜) ── */
function paintChecks(){$$("ul.checks li[data-ck]").forEach(function(x){var on=store(x.getAttribute("data-ck"))==="1";x.classList.toggle("on",on);x.setAttribute("aria-checked",on)})}
$$("ul.checks").forEach(function(ul){ul.setAttribute("role","group")});
$$("ul.checks li").forEach(function(li){
  var ul=li.parentNode,k="ecg:"+location.pathname+":chk:"+(ul.getAttribute("aria-label")||"")+":"+li.textContent.trim();
  li.setAttribute("role","checkbox");li.tabIndex=0;li.setAttribute("data-ck",k);
  li.onclick=function(){store(k,store(k)==="1"?"0":"1");paintChecks()};
  li.onkeydown=function(e){if(e.key===" "||e.key==="Enter"){e.preventDefault();e.stopPropagation();li.click()}};
});
paintChecks();

/* ── 슬라이드 뷰어: <div class="deck" data-dir="../slides/p1/" data-n="47" data-from="1" data-title="..."> (data-from: 시작 장 번호) ── */
$$(".deck").forEach(function(d){
  var dir=d.getAttribute("data-dir"),n=+d.getAttribute("data-n"),ext=d.getAttribute("data-ext")||"jpg",from=(+d.getAttribute("data-from")||1)-1,i=0;
  function src(k){var s=String(k+1+from);while(s.length<3)s="0"+s;return dir+s+"."+ext}
  d.innerHTML='<div class="stage"><img alt=""></div><div class="bar"><span class="n"></span><button class="tbtn" data-a="p" type="button">◀ 이전</button><button class="tbtn" data-a="n" type="button">다음 ▶</button><button class="tbtn" data-a="f" type="button">전체 화면</button></div><div class="thumbs"></div>';
  var img=$("img",d),lab=$(".n",d),th=$(".thumbs",d);
  for(var k=0;k<n;k++){(function(k){var b=document.createElement("button");b.type="button";b.setAttribute("aria-label",(k+1)+"번 슬라이드");b.dataset.bg=src(k);b.onclick=function(){show(k)};th.appendChild(b)})(k)}
  var tio="IntersectionObserver" in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.style.backgroundImage="url('"+e.target.dataset.bg+"')";tio.unobserve(e.target)}})},{root:th}):null;
  $$("button",th).forEach(function(b){if(tio)tio.observe(b);else b.style.backgroundImage="url('"+b.dataset.bg+"')"});
  function show(k){if(k<0||k>=n)return;i=k;img.src=src(k);img.alt=(d.getAttribute("data-title")||"슬라이드")+" "+(k+1);lab.textContent=(k+1)+" / "+n;$$("button",th).forEach(function(b,m){b.classList.toggle("on",m===k)});var cb=$$("button",th)[k];if(cb&&cb.scrollIntoView&&d.matches(":hover"))cb.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"})}
  $("[data-a=p]",d).onclick=function(){show(i-1)};$("[data-a=n]",d).onclick=function(){show(i+1)};
  $("[data-a=f]",d).onclick=function(){if(document.fullscreenElement)document.exitFullscreen();else if(d.requestFullscreen)d.requestFullscreen()};
  d.tabIndex=0;d.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){show(i+1);e.stopPropagation();e.preventDefault()}if(e.key==="ArrowLeft"){show(i-1);e.stopPropagation();e.preventDefault()}});
  show(0);
});

/* ── 유튜브 지연 로딩: <div class="vframe" data-yt="ID" data-title="..."> ── */
$$(".vframe[data-yt]").forEach(function(v){
  var id=v.getAttribute("data-yt"),t=v.getAttribute("data-title")||"영상 재생",st=v.getAttribute("data-start");
  var b=document.createElement("button");b.className="poster";b.type="button";
  b.innerHTML='<img alt="" loading="lazy" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg"><b>▶</b><span></span>';
  $("span",b).textContent=t;
  b.onclick=function(){var f=document.createElement("iframe");f.src="https://www.youtube-nocookie.com/embed/"+id+"?autoplay=1&rel=0"+(st?"&start="+st:"");f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.allowFullscreen=true;f.title=t;v.innerHTML="";v.appendChild(f)};
  v.appendChild(b);
});

/* ── 학생 입력 칸 임시 저장 ── */
$$("textarea.pad[data-key],input.pad[data-key]").forEach(function(p){
  var k="ecg:"+location.pathname+":"+p.getAttribute("data-key"),v=store(k);if(v)p.value=v;
  p.addEventListener("input",function(){store(k,p.value)});
});

/* ── 교사 모드 / 프로젝터 / 전체 화면 ── */
function bindToggle(sel,cls,key){$$(sel).forEach(function(b){
  function set(on){document.body.classList.toggle(cls,on);$$(sel).forEach(function(x){x.setAttribute("aria-pressed",on)});if(key!=="ecg:tmode")store(key,on?"1":"0")}
  b.onclick=function(){set(!document.body.classList.contains(cls))};
  if(store(key)==="1")set(true);
})}
try{localStorage.removeItem("ecg:tmode")}catch(e){} /* 교사 모드는 기기에 남기지 않음(다음 반 학생 화면 보호) */
bindToggle("[data-toggle=tmode]","tmode","ecg:tmode");
bindToggle("[data-toggle=proj]","proj","ecg:proj");
$$("[data-toggle=fs]").forEach(function(b){b.onclick=function(){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()}});

/* ── 학생 기록 도구: 입력칸이 있는 화면에 '복사'·'학습지 이미지로 저장'·'지우기'
   - 차시 화면: 그 차시 기록 / 프로그램 화면: 이 프로그램의 모든 화면(차시 포함) 기록
   - 각 화면은 열릴 때 자기 입력칸 목록을 ecg:meta:<경로>에 적어 두고, 프로그램 화면은 그것을 모아 읽는다 ── */
(function(){
  var SKIP=".top,.recbar,.sheetbar";
  function fields(){return $$("textarea, input[type=text], input:not([type])").filter(function(x){return !x.closest(SKIP)})}
  var foot=$("footer.foot");if(!fields().length||!foot)return;
  var path=location.pathname,dir=path.replace(/[^\/]*$/,""),isLesson=/lesson-\d+\.html$/.test(path);
  function clean(s){return (s||"").replace(/\s+/g," ").trim()}
  function label(x){var l=x.id&&document.querySelector("label[for='"+x.id+"']");if(l)return clean(l.textContent);var f=x.closest(".field");if(f&&$("label",f))return clean($("label",f).textContent);return x.getAttribute("aria-label")||x.getAttribute("placeholder")||x.getAttribute("data-key")||"기록"}
  function group(x){var c=x.closest(".card,.step,.exit,section"),h=c&&$("h3,h2",c);return h?clean(h.textContent).replace(/^\d+\s*/,""):""}
  function pageTitle(){return clean(document.title.split("·")[0].split("|")[0])}
  function progName(){var t=document.title.split("|")[0].split("·");return clean(isLesson?t[1]:t.join("·"))||"에너지참견시점"}
  /* 이 화면의 기록 목록(화면 순서). 값은 지금 입력칸에서 읽는다 */
  function here(){
    var out=[],seen={};
    $$("textarea, input[type=text], input:not([type]), ul.checks").forEach(function(x){
      if(x.closest(SKIP))return;
      if(x.tagName==="UL"){var lis=$$("li",x),id="c:"+(x.getAttribute("aria-label")||"")+lis.map(function(l){return l.textContent}).join("|");if(seen[id])out.splice(out.indexOf(seen[id]),1);
        seen[id]={g:"",l:x.getAttribute("aria-label")||"확인",c:lis.map(function(l){return [clean(l.textContent),l.getAttribute("data-ck")]})};out.push(seen[id]);return}
      var k=x.getAttribute("data-key")?"ecg:"+path+":"+x.getAttribute("data-key"):"";
      if(k){if(seen[k])return;seen[k]=1}
      out.push({g:group(x),l:label(x),k:k,el:x});
    });
    return out;
  }
  function val(it){var v=it.el?it.el.value:store(it.k);return (v||"").trim()}
  try{store("ecg:meta:"+path,JSON.stringify({t:pageTitle(),items:here().filter(function(i){return i.k||i.c}).map(function(i){return {g:i.g,l:i.l,k:i.k,c:i.c}})}))}catch(e){}
  /* 보여 줄 묶음: [{t, items}] */
  function sections(){
    var me={t:pageTitle(),items:here()};if(isLesson)return [me];
    var pre="ecg:meta:"+dir,ks=[];
    try{for(var n=0;n<localStorage.length;n++){var k=localStorage.key(n);if(k.indexOf(pre)===0&&k!=="ecg:meta:"+path&&k.slice(pre.length).indexOf("/")<0)ks.push(k)}}catch(e){}
    ks.sort(function(a,b){return a.localeCompare(b,"en",{numeric:true})});
    var out=[me];ks.forEach(function(k){try{var m=JSON.parse(store(k));out.push({t:m.t,items:m.items})}catch(e){}});
    return out;
  }
  function filled(it){return it.c?it.c.some(function(c){return store(c[1])==="1"}):!!val(it)}
  function anyFilled(){return sections().some(function(s){return s.items.some(filled)})}
  function stamp(){return new Date().toLocaleString("ko-KR")}

  /* 버튼: 바닥글 위 + 활동지 아래 */
  var bar=document.createElement("div");bar.className="wrap recbar";
  bar.innerHTML='<button class="tbtn" type="button" data-rec="copy">내 기록 모두 복사</button><button class="tbtn" type="button" data-rec="img">학습지 이미지로 저장</button><button class="tbtn" type="button" data-rec="clear">이 기기의 수업 기록 지우기</button><small>'+(isLesson?"이 차시에 쓴 내용":"이 프로그램의 모든 차시에 쓴 내용")+'을 복사하거나 이미지로 저장해요. 입력한 내용은 이 기기의 브라우저에만 저장됩니다. 공용 기기라면 수업이 끝난 뒤 지워 주세요.</small>';
  foot.parentNode.insertBefore(bar,foot);
  $$(".lsheet").map(function(l){return l.closest(".wrap")||l.parentNode}).filter(function(w,i,a){return a.indexOf(w)===i}).forEach(function(w){
    var sb=document.createElement("div");sb.className="sheetbar";
    sb.innerHTML='<button class="tbtn" type="button" data-rec="img">학습지 이미지로 저장</button><button class="tbtn" type="button" data-rec="copy">내 기록 복사</button>';
    w.appendChild(sb);
  });
  function flash(b,t){if(b._t)clearTimeout(b._t);else b._o=b.textContent;b.textContent=t;b._t=setTimeout(function(){b.textContent=b._o;b._t=0},1800)}

  /* 복사 */
  function copyText(){
    var out=[document.title,stamp()];
    sections().forEach(function(s){
      var its=s.items.filter(filled);if(!its.length)return;
      out.push("","["+s.t+"]");var g="";
      its.forEach(function(it){
        if(it.g&&it.g!==g){out.push("","● "+it.g);g=it.g}
        if(it.c)out.push("■ "+it.l,it.c.map(function(c){return (store(c[1])==="1"?"☑ ":"☐ ")+c[0]}).join("   "));
        else out.push("■ "+it.l,val(it));
      });
    });
    return out.join("\n");
  }
  $$("[data-rec=copy]").forEach(function(b){b.onclick=function(){
    if(!anyFilled()){flash(b,"아직 쓴 기록이 없어요");return}
    var t=copyText();
    function ok(){flash(b,"복사했어요")}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,function(){prompt("아래 내용을 복사하세요",t)});else prompt("아래 내용을 복사하세요",t);
  }});

  /* 학습지 이미지 (canvas로 직접 그림 · 의존성 없음) */
  function cssv(n,d){var v=getComputedStyle(document.body).getPropertyValue(n).trim();return v||d}
  function wrapText(c,t,w){var lines=[];String(t).split("\n").forEach(function(p){var cur="";for(var i=0;i<p.length;i++){var ch=p[i];if(cur&&c.measureText(cur+ch).width>w){lines.push(cur);cur=ch===" "?"":ch}else cur+=ch}lines.push(cur)});return lines}
  function rr(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
  function render(){
    var W=1080,P=64,IW=W-P*2,fam=getComputedStyle(document.body).fontFamily;
    var prog=cssv("--prog","#3A855D"),deep=cssv("--deep","#173B2A"),ink="#1F2A24",grey="#5B6660",line="#D9D3C4",champ=cssv("--champ","#2C6A49");
    var secs=sections().filter(function(s,i){return i===0||s.items.some(filled)});
    var cv=document.createElement("canvas"),c=cv.getContext("2d");
    function F(sz,wt){c.font=(wt||400)+" "+sz+"px "+fam}
    function pass(draw){
      if(draw){c.fillStyle=deep;c.fillRect(0,0,W,214);c.fillStyle=prog;c.fillRect(0,206,W,8)}
      F(26,700);if(draw){c.fillStyle="rgba(255,255,255,.78)";c.fillText(progName(),P,72)}
      F(48,800);if(draw){c.fillStyle="#fff";c.fillText(isLesson?pageTitle()+" 학습지":"학습지 모음",P,138)}
      F(24,400);if(draw){c.fillStyle="rgba(255,255,255,.78)";c.fillText(stamp(),P,182)}
      var y=262;
      secs.forEach(function(s){
        if(!isLesson){F(34,800);if(draw){c.fillStyle=prog;c.fillText(s.t,P,y+34)}y+=66}
        var g="";
        s.items.forEach(function(it){
          if(!isLesson&&!filled(it))return;
          if(it.g&&it.g!==g){g=it.g;F(30,700);var gl=wrapText(c,it.g,IW);gl.forEach(function(t,i){if(draw){c.fillStyle=ink;c.fillText(t,P,y+30+i*40)}});y+=gl.length*40+14}
          F(23,700);var ll=wrapText(c,it.l,IW);ll.forEach(function(t,i){if(draw){c.fillStyle=champ;c.fillText(t,P,y+23+i*32)}});y+=ll.length*32+10;
          if(it.c){
            F(27,400);var x=P,yy=y;
            it.c.forEach(function(cc){var on=store(cc[1])==="1",w=48+c.measureText(cc[0]).width+32;if(x+w>W-P&&x>P){x=P;yy+=50}
              if(draw){c.lineWidth=3;c.strokeStyle=champ;c.fillStyle=on?champ:"#fff";rr(c,x,yy+4,32,32,6);c.fill();c.stroke();
                if(on){c.strokeStyle="#fff";c.lineWidth=4;c.beginPath();c.moveTo(x+7,yy+21);c.lineTo(x+14,yy+29);c.lineTo(x+26,yy+12);c.stroke()}
                c.fillStyle=ink;c.fillText(cc[0],x+48,yy+30)}
              x+=w});
            y=yy+72;
          }else{
            F(28,400);var v=val(it),vl=v?wrapText(c,v,IW-48):[],bh=Math.max(76,vl.length*42+34);
            if(draw){c.fillStyle="#fff";c.strokeStyle=line;c.lineWidth=2;rr(c,P,y,IW,bh,14);c.fill();c.stroke();
              if(v){c.fillStyle=ink;vl.forEach(function(t,i){c.fillText(t,P+24,y+48+i*42)})}else{F(24,400);c.fillStyle="#B4B9B4";c.fillText("(비어 있음)",P+24,y+48)}}
            y+=bh+26;
          }
        });
        y+=20;
      });
      F(20,400);if(draw){c.fillStyle=grey;c.fillText("에너지참견시점 수업 웹 · 이 기기에서 만든 학습지 기록",P,y+30)}
      return y+64;
    }
    cv.width=W;cv.height=400;var H=pass(false);
    cv.width=W;cv.height=H;c.fillStyle=cssv("--bg","#F2EEE6");c.fillRect(0,0,W,H);pass(true);
    return cv;
  }
  window.__ecgSheet=render; /* 검사용 */
  $$("[data-rec=img]").forEach(function(b){b.onclick=function(){
    if(!anyFilled()){flash(b,"아직 쓴 기록이 없어요");return}
    function go(){
      var cv=render(),d=new Date(),nm="학습지_"+pageTitle().replace(/[\\\/:*?"<>|\s·]+/g,"_")+"_"+(d.getMonth()+1)+"월"+d.getDate()+"일.png";
      cv.toBlob(function(bl){
        if(!bl){flash(b,"저장하지 못했어요");return}
        var u=URL.createObjectURL(bl),a=document.createElement("a");a.href=u;a.download=nm;document.body.appendChild(a);a.click();a.remove();
        setTimeout(function(){URL.revokeObjectURL(u)},4000);flash(b,"이미지를 저장했어요");
      },"image/png");
    }
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go,go);else go();
  }});

  $("[data-rec=clear]",bar).onclick=function(){
    if(!confirm("이 기기에 저장된 모든 프로그램의 수업 기록(입력칸, 체크, 선택한 탭·트랙, 별점 등)을 지울까요? 되돌릴 수 없어요."))return;
    try{var ks=[];for(var n=0;n<localStorage.length;n++)ks.push(localStorage.key(n));ks.forEach(function(k){if(k!=="ecg:proj")localStorage.removeItem(k)})}catch(e){}
    try{sessionStorage.removeItem("ecg:timer")}catch(e){}
    fields().forEach(function(x){x.value=""});
    location.reload();
  };
})();

/* ── 현재 섹션 메뉴 강조 ── */
var navs=$$(".top nav a[href^='#']");
if(navs.length&&io){
  var map={};navs.forEach(function(a){map[a.getAttribute("href").slice(1)]=a});
  var nio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){navs.forEach(function(a){a.classList.remove("on")});var a=map[e.target.id];if(a)a.classList.add("on")}})},{rootMargin:"-45% 0px -50% 0px"});
  Object.keys(map).forEach(function(id){var s=document.getElementById(id);if(s)nio.observe(s)});
}
})();
