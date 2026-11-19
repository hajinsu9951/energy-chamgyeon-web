/* 프로그램 5 기술 · 차시 페이지 활동 (의존성 없음, site.js 다음에 불러온다)
   - [data-pickto]   : 의뢰 고르기 버튼 → 입력칸(input.pad)에 넣기
   - .quiz           : 해결책 문장 / 불편 문장 분류 연습
   - .builder        : 문제 정의 한 문장 만들기 미리보기
   - .mxl            : 평가 행렬(현실성·경제성·적정성 각 10점)
   - .det            : 회로 오류 탐정 카드
   - .ts             : 작동하지 않을 때 점검 순서 */
(function(){
"use strict";
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function sget(k){try{return localStorage.getItem(k)}catch(e){return null}}
function sset(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function esc(s){return s.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

/* 의뢰 고르기 */
$$("[data-pickto]").forEach(function(box){
  var inp=document.getElementById(box.getAttribute("data-pickto"));if(!inp)return;
  var bs=$$("button",box);
  function paint(){bs.forEach(function(b){b.setAttribute("aria-pressed",inp.value.trim()===b.getAttribute("data-v"))})}
  bs.forEach(function(b){b.onclick=function(){inp.value=b.getAttribute("data-v");inp.dispatchEvent(new Event("input"));paint()}});
  inp.addEventListener("input",paint);setTimeout(paint,0);
});

/* 문장 분류 연습 */
$$(".quiz").forEach(function(box){
  var Q=JSON.parse(box.getAttribute("data-q")),i=0,ok=0;
  var qn=$(".qn",box),qt=$(".qt",box),fb=$(".qfb",box),sc=$(".score",box),bs=$$("[data-pick]",box);
  function show(){
    if(i>=Q.length){qn.textContent="끝!";qt.textContent=ok===Q.length?"모두 맞혔어요. 이제 내 문장을 써 볼까요?":"다 했어요. 틀린 문장은 사용자·상황·불편이 보이는지 다시 읽어 봐요.";bs.forEach(function(b){b.disabled=true});return}
    qn.textContent=(i+1)+" / "+Q.length;qt.textContent=Q[i][0];bs.forEach(function(b){b.disabled=false});
  }
  bs.forEach(function(b){b.onclick=function(){
    if(i>=Q.length)return;var q=Q[i],right=b.getAttribute("data-pick")===q[1];if(right)ok++;
    fb.textContent=(right?"맞아요! ":"다시 볼까요? ")+q[2];fb.classList.toggle("bad",!right);
    i++;sc.textContent=ok+" / "+i;show();
  }});
  $("[data-reset]",box).onclick=function(){i=0;ok=0;fb.textContent="";sc.textContent="0 / 0";show()};
  show();
});

/* 문제 정의 한 문장 만들기 */
$$(".builder").forEach(function(bx){
  var f=$$("input",bx),out=document.getElementById(bx.getAttribute("data-out")),w=document.getElementById(bx.getAttribute("data-warn"));if(!out)return;
  var SOL=/필요|설치|만들어|만든다|개발|보급|건조기|정수기|발전기|가로등|태양광 ?패널|스마트팜|기계|장치|제품/;
  var ph=["[사용자]","[상황]","[문제]","[불편]"];
  function upd(){
    var v=f.map(function(x){return x.value.trim()});
    function p(k){return v[k]?esc(v[k]):'<span class="ph">'+ph[k]+'</span>'}
    out.innerHTML=p(0)+"는 "+p(1)+"에서 "+p(2)+" 때문에 "+p(3)+"을 겪고 있다.";
    if(w)w.textContent=SOL.test(v.join(" "))?"해결책(제품 이름이나 ‘~이 필요하다’)이 들어간 것 같아요. 사용자가 겪는 불편으로 바꿔 써 볼까요?":"";
  }
  f.forEach(function(x){x.addEventListener("input",upd)});setTimeout(upd,0);
});

/* 평가 행렬 */
$$(".mxl").forEach(function(box){
  var KEY="ecg:"+location.pathname+":"+box.getAttribute("data-key"),rows=$$(".row",box),note=document.getElementById(box.getAttribute("data-note"));
  var saved;try{saved=JSON.parse(sget(KEY))}catch(e){saved=null}
  rows.forEach(function(r,k){$$("input[type=range]",r).forEach(function(s,j){if(saved&&saved[k])s.value=saved[k][j];s.nextElementSibling.textContent=s.value;s.addEventListener("input",upd)})});
  function upd(){
    var data=rows.map(function(r){return $$("input[type=range]",r).map(function(s){s.nextElementSibling.textContent=s.value;return +s.value})});
    sset(KEY,JSON.stringify(data));
    var t=data.map(function(d){return d[0]+d[1]+d[2]}),top=Math.max.apply(null,t),ties=t.filter(function(x){return x===top}).length;
    rows.forEach(function(r,k){$(".tot span",r).innerHTML=t[k]+"<small>/30</small>"+(t[k]===top&&ties===1?'<span class="badge">선정 후보</span>':"");r.classList.toggle("win",t[k]===top&&ties===1)});
    if(note)note.textContent=ties>1?"동점이에요! 점수만으로 정하지 말고, 사용자의 불편을 더 잘 줄이는 쪽을 이유와 함께 골라요.":"점수는 판단의 근거예요. 선정한 이유와 남은 약점도 꼭 써요.";
  }
  var ex=$("[data-mx=ex]",box.parentNode),cl=$("[data-mx=clr]",box.parentNode);
  function setAll(arr){rows.forEach(function(r,k){var nm=$("input.pad",r);if(nm){nm.value=arr[k][0];nm.dispatchEvent(new Event("input"))}$$("input[type=range]",r).forEach(function(s,j){s.value=arr[k][j+1]})});upd()}
  if(ex)ex.onclick=function(){setAll([["태양광 환풍기",8,7,8],["햇빛 세기 알림 선풍기",9,8,8],["태양광 자동 차양",6,5,6]])};
  if(cl)cl.onclick=function(){setAll([["",5,5,5],["",5,5,5],["",5,5,5]])};
  upd();
});

/* 회로 오류 탐정 */
$$(".det button").forEach(function(b){b.onclick=function(){b.classList.toggle("shown");$(".ans",b).textContent=b.classList.contains("shown")?b.getAttribute("data-a"):""}});

/* 고장 점검 순서 */
$$(".ts").forEach(function(ts){
  var qs=$$(".q",ts);
  function reset(){ts.classList.remove("fin");qs.forEach(function(q,k){q.className="q"+(k===0?" act":"")})}
  qs.forEach(function(q,k){
    $("[data-y]",q).onclick=function(){if(!q.classList.contains("act"))return;q.className="q ok";if(qs[k+1])qs[k+1].classList.add("act");else ts.classList.add("fin")};
    $("[data-n]",q).onclick=function(){if(!q.classList.contains("act"))return;q.classList.add("no")};
  });
  $("[data-reset]",ts).onclick=reset;reset();
});
})();
