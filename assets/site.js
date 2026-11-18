/* 에너지참견시점 수업 웹 — 공통 동작 (의존성 없음)
   - .intro      : 전체 화면 장면 시퀀스(영상·사진·자막, 자동 진행, 섬광 전환, 금빛 입자)
   - .reveal     : 스크롤하면 나타남      - [data-count-to] : 숫자 올라가기
   - .tabs       : 차시 탭                - .runner : 단계 진행기(← → 키)
   - .timer      : 활동 타이머            - .deck   : PPT 슬라이드 뷰어
   - .vframe     : 유튜브 지연 로딩       - textarea.pad[data-key] : 브라우저에 임시 저장
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

/* ── 금빛 입자 캔버스 ── */
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
      g.addColorStop(0,"rgba(255,226,170,"+p.a+")");g.addColorStop(1,"rgba(242,180,90,0)");
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

/* ── 타이머 ── */
$$(".timer").forEach(function(t){
  var total=(+t.getAttribute("data-min")||5)*60,left=total,id=null;
  t.innerHTML='<span class="t"></span><span class="bar"><i></i></span><button class="tbtn" type="button">시작</button><button class="tbtn" type="button" aria-label="다시">↺</button>';
  var out=$(".t",t),bar=$(".bar i",t),bs=$$("button",t);
  function draw(){var m=Math.floor(left/60),s=left%60;out.textContent=m+":"+(s<10?"0":"")+s;bar.style.width=(left/total*100)+"%";t.classList.toggle("done",left===0)}
  bs[0].onclick=function(){if(id){clearInterval(id);id=null;bs[0].textContent="계속"}else{if(left===0)left=total;bs[0].textContent="멈춤";id=setInterval(function(){left=Math.max(0,left-1);draw();if(!left){clearInterval(id);id=null;bs[0].textContent="시작"}},1000)}};
  bs[1].onclick=function(){clearInterval(id);id=null;left=total;bs[0].textContent="시작";draw()};
  draw();
});

/* ── 슬라이드 뷰어: <div class="deck" data-dir="../slides/p1/" data-n="47" data-title="..."> ── */
$$(".deck").forEach(function(d){
  var dir=d.getAttribute("data-dir"),n=+d.getAttribute("data-n"),ext=d.getAttribute("data-ext")||"jpg",i=0;
  function src(k){var s=String(k+1);while(s.length<3)s="0"+s;return dir+s+"."+ext}
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

/* ── 학생 기록 도구: 입력칸이 있는 화면의 바닥글 위에 '복사'·'지우기' ── */
(function(){
  function fields(){return $$("textarea, input[type=text], input:not([type])").filter(function(x){return !x.closest(".top")&&!x.closest(".recbar")})}
  var foot=$("footer.foot");if(!fields().length||!foot)return;
  var bar=document.createElement("div");bar.className="wrap recbar";
  bar.innerHTML='<button class="tbtn" type="button" data-rec="copy">내 기록 모두 복사</button><button class="tbtn" type="button" data-rec="clear">이 기기의 수업 기록 지우기</button><small>입력한 내용은 이 기기의 브라우저에만 저장됩니다. 공용 기기라면 수업이 끝난 뒤 지워 주세요.</small>';
  foot.parentNode.insertBefore(bar,foot);
  function label(x){var l=x.id&&document.querySelector("label[for='"+x.id+"']");if(l)return l.textContent.trim();var f=x.closest(".field");if(f&&$("label",f))return $("label",f).textContent.trim();return x.getAttribute("aria-label")||x.getAttribute("placeholder")||x.getAttribute("data-key")||"기록"}
  $("[data-rec=copy]",bar).onclick=function(){
    var out=[document.title,new Date().toLocaleString("ko-KR"),""],b=this;
    fields().forEach(function(x){var v=(x.value||"").trim();if(v)out.push("■ "+label(x)+"\n"+v+"\n")});
    var t=out.join("\n");
    function ok(){b.textContent="복사했어요";setTimeout(function(){b.textContent="내 기록 모두 복사"},1600)}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,function(){prompt("아래 내용을 복사하세요",t)});else prompt("아래 내용을 복사하세요",t);
  };
  $("[data-rec=clear]",bar).onclick=function(){
    if(!confirm("이 기기에 저장된 모든 프로그램의 수업 기록(입력칸, 선택한 탭·트랙, 별점 등)을 지울까요? 되돌릴 수 없어요."))return;
    try{var ks=[];for(var n=0;n<localStorage.length;n++)ks.push(localStorage.key(n));ks.forEach(function(k){if(k!=="ecg:proj")localStorage.removeItem(k)})}catch(e){}
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
