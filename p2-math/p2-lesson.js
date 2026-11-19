/* 프로그램 2 차시 페이지 전용 동작 (index.html과 같은 계산 로직)
   a23 찾기 · 크기 조건 판별기 · 전환점 그래프 · 전략 계산기 */
(function(){
"use strict";
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function n0(v){return Math.abs(v).toLocaleString("ko-KR")}
function sgn(v){return v>0?"+":v<0?"−":""}
function won(v){var a=Math.abs(v),s=sgn(v);if(a===0)return "0원";
  if(a>=1e8){var e=a/1e8;return s+(+e.toFixed(4)).toString()+"억 원"}
  return s+(+(a/1e4).toFixed(1)).toLocaleString("ko-KR")+"만 원"}

/* a23 찾기 */
$$("[data-agrid]").forEach(function(g){
  var fb=g.parentNode.querySelector(".fb");
  $$("button",g).forEach(function(b){b.type="button";b.onclick=function(){
    var i=b.getAttribute("data-i"),j=b.getAttribute("data-j");
    $$("button",g).forEach(function(x){x.className="";x.innerHTML=""});
    b.innerHTML="a<sub>"+i+j+"</sub>";
    if(i==="2"&&j==="3"){b.className="ok";fb.innerHTML="정답! <b>2행</b>(가로줄)과 <b>3열</b>(세로줄)이 만나는 칸이에요."}
    else{b.className="no";fb.innerHTML="이 칸은 <b>a<sub>"+i+j+"</sub></b> ("+i+"행 "+j+"열). a<sub>23</sub>은 행이 먼저, 열이 나중이에요 — 2행에서 3번째 칸을 찾아보세요."}
  }});
});

/* 크기 조건 판별기 */
$$("[data-szc]").forEach(function(box){
  var step=box.parentNode,out=$(".szout",step),sel={};
  $$("select",box).forEach(function(s){sel[s.getAttribute("data-v")]=s;s.onchange=draw});
  function draw(){var m=+sel.m.value,n=+sel.n.value,n2=+sel.n2.value,p=+sel.p.value;
    if(n===n2){out.className="szout ok";out.textContent="가운데 수 "+n+" = "+n2+" → 곱할 수 있어요. 결과는 "+m+" × "+p+" 행렬"}
    else{out.className="szout no";out.textContent="가운데 수 "+n+" ≠ "+n2+" → 곱할 수 없어요. (앞 행렬의 열 수 = 뒤 행렬의 행 수여야 해요)"}}
  $$("[data-pre]",step).forEach(function(b){b.onclick=function(){var v=b.getAttribute("data-pre").split(",");sel.m.value=v[0];sel.n.value=v[1];sel.n2.value=v[2];sel.p.value=v[3];draw()}});
  draw();
});

/* 전환점 */
$$("[data-turn]").forEach(function(box){
  var sl=$("input",box),price=30000,dot=$(".tx-dot",box),guide=$(".tx-guide",box);
  var pb=$$("[data-price]",box);
  pb.forEach(function(b){b.onclick=function(){price=+b.getAttribute("data-price");pb.forEach(function(x){x.setAttribute("aria-pressed",x===b)});draw()}});
  function draw(){var x=+sl.value,y=58000-850*x,d=y-40000,m=-price*d;
    $(".tx-v",box).textContent=x;
    $(".tx-mix",box).textContent="석탄 "+(50-x)+" · 가스 30 · 신재생 "+(20+x)+" GWh";
    $(".tx-y",box).textContent=n0(y)+" tCO₂";
    $(".tx-d",box).textContent=sgn(d)+n0(d)+(d>0?" (초과 → 구매)":d<0?" (잉여 → 판매)":"");
    var md=$(".tx-m",box);md.textContent=won(m);md.classList.toggle("neg",m<0);
    var cx=46+x*6,cy=196-y*0.003;dot.setAttribute("cx",cx);dot.setAttribute("cy",cy);guide.setAttribute("x1",cx);guide.setAttribute("x2",cx);guide.setAttribute("y1",cy);
  }
  sl.addEventListener("input",draw);draw();
});

/* 전략 계산기 */
(function(){
  var sc=$("#sc"),sg=$("#sg");if(!sc)return;
  function draw(e){
    var c=+sc.value,g=+sg.value;
    if(c+g>100){if(e&&e.target===sc){g=100-c;sg.value=g}else{c=100-g;sc.value=c}}
    var r=100-c-g,y=c*900+g*400+r*50,d=y-40000,m3=-30000*d,m6=-60000*d;
    $("#scv").textContent=c;$("#sgv").textContent=g;$("#srv").textContent=r;
    $("#sCalc").innerHTML="P′E = "+c+"×900 + "+g+"×400 + "+r+"×50 = <b>"+n0(y)+"</b> tCO₂";
    $("#sY").textContent=n0(y);
    var D=$("#sD");D.textContent=sgn(d)+n0(d);D.className=d>0?"neg":"pos";
    var M3=$("#sM3"),M6=$("#sM6");M3.textContent=won(m3);M6.textContent=won(m6);
    M3.className=m3<0?"neg":"pos";M6.className=m6<0?"neg":"pos";
    var sp=$("#sSpeech"),B='<span class="blank">직접 쓰기</span>';
    if(c===50&&g===30){sp.innerHTML="“우리 A기업은 석탄 <span class=\"blank\">__</span> GWh를 … ” — 석탄·가스 막대를 움직이면 숫자 칸이 채워져요. 문장의 이유와 조건은 모둠이 써요."}
    else{sp.innerHTML="“우리 A기업은 발전량을 석탄 <u>"+c+"</u> · 가스 <u>"+g+"</u> · 신재생 <u>"+r+"</u> GWh로 바꾸어 배출량을 <u>58,000</u> → <u>"+n0(y)+"</u> tCO<sub>2</sub>로, 손익을 <u>−5.4억 원</u> → <u>"+won(m3)+"</u>으로 바꾸겠습니다. 이 전략은 "+B+" 측면에서 "+B+" 가치가 있습니다. 그 이유는 "+B+"이고, 아직 따지지 못한 조건은 "+B+"입니다.”"}
  }
  sc.addEventListener("input",draw);sg.addEventListener("input",draw);draw();
})();
})();
