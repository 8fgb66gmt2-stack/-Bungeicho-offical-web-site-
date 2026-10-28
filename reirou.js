/* 玲瓏浪漫 UI enhancement layer — progressive enhancement, no content rewriting */
(()=> {
 "use strict";
 const STORAGE={intro:"bungeicho.rr.intro.seen.v1",bookmarks:"bungeicho.rr.bookmarks.v1",font:"bungeicho.rr.font.v1"};
 const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const safeRead=(key,fallback)=>{try{const v=localStorage.getItem(key);return v===null?fallback:v}catch{return fallback}};
 const safeWrite=(key,value)=>{try{localStorage.setItem(key,value);return true}catch{return false}};
 const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const $=(s,root=document)=>root.querySelector(s);
 const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
 let noticeTimer;
 function notify(message,stamp=false){
  let el=$("#rr-notice");
  if(!el){el=document.createElement("div");el.id="rr-notice";el.className="rr-notice";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.append(el)}
  el.textContent=message;el.classList.toggle("rr-stamp",stamp);el.classList.remove("is-visible","is-stamped");void el.offsetWidth;el.classList.add("is-visible");if(stamp)el.classList.add("is-stamped");
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove("is-visible"),2600);
 }
 function readBookmarks(){try{const data=JSON.parse(safeRead(STORAGE.bookmarks,"[]"));return Array.isArray(data)?data.filter(x=>x&&typeof x.url==="string"&&typeof x.title==="string"):[]}catch{return[]}}
 function writeBookmarks(list){return safeWrite(STORAGE.bookmarks,JSON.stringify(list))}
 function canonicalUrl(url){const u=new URL(url,location.href);return u.origin===location.origin?u.pathname+u.search+u.hash:u.href}
 function getTitle(){const h=$("h1");return (h&&h.textContent.trim())||document.title||location.pathname}
 function addBookmark(){
  const url=canonicalUrl(location.href),title=getTitle();let list=readBookmarks();
  if(list.some(x=>x.url===url)){list=list.filter(x=>x.url!==url);writeBookmarks(list);notify("栞を取り外しました");return}
  list.unshift({url,title,addedAt:new Date().toISOString()});list=list.slice(0,100);
  if(!writeBookmarks(list)){notify("このブラウザでは栞を保存できませんでした");return}
  notify("文藝廳の栞に記録しました",true);
 }
 function openBookmarks(){
  let back=$("#rr-bookmarks-dialog");
  if(!back){
   back=document.createElement("div");back.id="rr-bookmarks-dialog";back.className="rr-dialog-backdrop";back.hidden=true;
   back.innerHTML='<section class="rr-dialog" role="dialog" aria-modal="true" aria-labelledby="rr-bookmarks-title"><div class="rr-dialog-head"><h2 id="rr-bookmarks-title">文藝廳の栞</h2><button type="button" data-rr-close aria-label="閉じる">閉じる ×</button></div><p class="rr-dialog-intro">このブラウザに保存したページです。端末間の同期は行われません。</p><div data-rr-bookmark-content></div><div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap;margin-top:1rem"><button type="button" data-rr-clear>栞をすべて消去</button></div></section>';
   document.body.append(back);
   back.addEventListener("click",e=>{if(e.target===back||e.target.closest("[data-rr-close]"))back.hidden=true});
   back.querySelector("[data-rr-clear]").addEventListener("click",()=>{if(confirm("保存した栞をすべて消去しますか？")){writeBookmarks([]);renderBookmarks();notify("栞をすべて消去しました")}});
   document.addEventListener("keydown",e=>{if(e.key==="Escape"&&back&&!back.hidden)back.hidden=true});
  }
  function renderBookmarks(){
   const target=back.querySelector("[data-rr-bookmark-content]"),list=readBookmarks();
   if(!list.length){target.innerHTML='<p class="rr-empty">まだ栞はありません。ページ右下の「栞」を押して保存できます。</p>';return}
   target.innerHTML='<ul class="rr-bookmark-list">'+list.map((item,i)=>'<li class="rr-bookmark-item"><a href="'+esc(item.url)+'">'+esc(item.title)+'</a><button type="button" data-rr-remove="'+i+'">解除</button></li>').join("")+'</ul>';
   $$("[data-rr-remove]",target).forEach(btn=>btn.addEventListener("click",()=>{const next=readBookmarks();next.splice(Number(btn.dataset.rrRemove),1);writeBookmarks(next);renderBookmarks();notify("栞を取り外しました")}));
  }
  renderBookmarks();back.hidden=false;const close=$("[data-rr-close]",back);if(close)close.focus();
 }
 function setFontSize(size,silent=false){
  const allowed=["small","normal","large"].includes(size)?size:"normal";
  document.body.classList.remove("rr-font-small","rr-font-normal","rr-font-large");document.body.classList.add("rr-font-"+allowed);
  safeWrite(STORAGE.font,allowed);
  $$("[data-rr-font]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.rrFont===allowed))});
  if(!silent)notify(({small:"本文を小さくしました",normal:"本文を標準サイズにしました",large:"本文を大きくしました"})[allowed]);
 }
 function injectToolbar(){
  if($("#rr-toolbar"))return;
  const bar=document.createElement("nav");bar.id="rr-toolbar";bar.className="rr-toolbar";bar.setAttribute("aria-label","閲覧補助");
  bar.innerHTML='<button type="button" data-rr-bookmark aria-label="このページを栞に保存">栞</button><button type="button" data-rr-open-bookmarks aria-label="保存した栞を開く">一覧</button><button type="button" data-rr-font="small" aria-label="本文を小さく" title="文字を小さく">A−</button><button type="button" data-rr-font="normal" aria-label="本文を標準サイズ" title="標準サイズ">A</button><button type="button" data-rr-font="large" aria-label="本文を大きく" title="文字を大きく">A＋</button>';
  document.body.append(bar);
  $("[data-rr-bookmark]",bar).addEventListener("click",addBookmark);
  $("[data-rr-open-bookmarks]",bar).addEventListener("click",openBookmarks);
  $$("[data-rr-font]",bar).forEach(b=>b.addEventListener("click",()=>setFontSize(b.dataset.rrFont)));
  setFontSize(safeRead(STORAGE.font,"normal"),true);
 }
 function injectClock(){
  if($("#rr-clock"))return;
  const line=$(".worldline")||$(".topline");
  const clock=document.createElement("aside");clock.id="rr-clock";clock.className="rr-clock";clock.setAttribute("aria-label","時報と帝國暦");
  const source=(line&&line.textContent)||document.body.textContent||"";
  const era=source.match(/玲瓏\s*[0-9０-９一二三四五六七八九十百千]+\s*年/);
  const imperial=source.match(/帝國暦\s*[0-9０-９一二三四五六七八九十百千]+\s*年/);
  clock.innerHTML='<span class="rr-clock-seal" aria-hidden="true">文</span><strong>文藝廳時報</strong><span class="rr-clock-era">'+esc(era?era[0]:"玲瓏時代")+'</span><span aria-hidden="true">／</span><span class="rr-clock-imperial">'+esc(imperial?imperial[0]:"帝國暦")+'</span><span class="rr-clock-time" aria-live="off"></span>';
  if(line)line.insertAdjacentElement("afterend",clock);else document.body.insertAdjacentElement("afterbegin",clock);
  const update=()=>{const now=new Date();const time=now.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});const el=$(".rr-clock-time",clock);if(el)el.textContent="現在時刻 "+time};
  update();window.setInterval(update,1000);
 }
 function injectCalendar(){
  if($("#rr-calendar"))return;
  const host=document.createElement("section");host.id="rr-calendar-slot";host.className="rr-calendar-slot";
  const now=new Date(),year=now.getFullYear(),month=now.getMonth(),today=now.getDate();
  const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
  const weekdays=["日","月","火","水","木","金","土"];
  let cells=weekdays.map(d=>'<span class="rr-weekday">'+d+'</span>').join("");
  for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';
  for(let d=1;d<=days;d++)cells+='<span'+(d===today?' class="rr-today" aria-current="date"':'')+'>'+d+'</span>';
  const label=now.toLocaleDateString("ja-JP",{year:"numeric",month:"long"});
  host.innerHTML='<section class="rr-calendar" id="rr-calendar" aria-label="文藝廳の小さな暦"><div class="rr-calendar-head"><h2>文藝廳の小さな暦</h2><span>THE MONTHLY ALMANAC</span></div><div class="rr-calendar-grid" aria-label="'+esc(label)+'">'+cells+'</div><p class="rr-calendar-foot">端末の暦に基づく月間表示。帝國暦の換算・記念日設定は行っていません。</p></section>';
  const main=$("#main")||$("main");
  if(main)main.insertAdjacentElement("afterend",host);else document.body.append(host);
 }
 function addPetals(parent,count=18){
  if(reduced||!parent)return;
  const layer=document.createElement("div");layer.className="rr-petal-layer";layer.setAttribute("aria-hidden","true");parent.append(layer);
  for(let i=0;i<count;i++){const p=document.createElement("i");p.className="rr-petal";p.style.left=(Math.random()*100)+"%";p.style.setProperty("--duration",(3.2+Math.random()*2.8)+"s");p.style.setProperty("--rotation",(Math.random()*180)+"deg");p.style.setProperty("--drift",(-70+Math.random()*140)+"px");p.style.animationDelay=(Math.random()*.7)+"s";layer.append(p)}
  window.setTimeout(()=>layer.remove(),7000);
 }
 function injectIntro(){
  if(!document.body.classList.contains("revolution-home")||reduced||safeRead(STORAGE.intro,""))return;
  const intro=document.createElement("div");intro.id="rr-intro";intro.className="rr-intro";intro.setAttribute("role","dialog");intro.setAttribute("aria-label","文藝廳");
  intro.innerHTML='<div class="rr-intro-inner"><p class="rr-intro-kicker">THE IMPERIAL BUREAU OF LITERATURE</p><h1 class="rr-intro-title">文藝廳</h1><div class="rr-intro-rule"></div><p class="rr-intro-sub">文ヲ興シ、思想ヲ遺ス。</p><button class="rr-intro-skip" type="button">閲覧を開始する</button></div>';
  document.body.append(intro);addPetals(intro,22);
  let finished=false;
  const finish=()=>{if(finished)return;finished=true;safeWrite(STORAGE.intro,"1");try{sessionStorage.setItem("rr-intro-session","1")}catch{}intro.classList.add("is-leaving");setTimeout(()=>intro.remove(),600)};
  $(".rr-intro-skip",intro).addEventListener("click",finish);
  const timer=setTimeout(finish,2200);intro.addEventListener("click",e=>{if(e.target===intro){clearTimeout(timer);finish()}});
 }
 function setupTransitions(){
  if(reduced)return;
  const overlay=document.createElement("div");overlay.className="rr-transition";overlay.setAttribute("aria-hidden","true");document.body.append(overlay);
  document.addEventListener("click",e=>{
   const a=e.target.closest("a[href]");if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
   if(a.target&&a.target!=="_self"||a.hasAttribute("download")||a.hasAttribute("data-no-transition"))return;
   const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
   if(url.pathname===location.pathname&&url.search===location.search)return;
   e.preventDefault();overlay.classList.add("is-active");window.setTimeout(()=>{location.href=url.href},240);
  });
 }
 function setupReveal(){
  const candidates=$$("main h1,main h2,.section-heading,.section-heading h2,.opening-title-wrap,.card,.jr-person");
  const unique=[...new Set(candidates)].filter(el=>!el.closest(".rr-dialog")&&!el.classList.contains("rr-calendar"));
  unique.forEach(el=>{el.classList.add("rr-reveal");const rule=document.createElement("span");rule.className="rr-gold-rule";rule.setAttribute("aria-hidden","true");if(/^H[12]$/.test(el.tagName))el.insertAdjacentElement("afterend",rule)});
  if(reduced||!("IntersectionObserver"in window)){unique.forEach(el=>el.classList.add("rr-visible"));$$(".rr-gold-rule").forEach(el=>el.classList.add("rr-visible"));return}
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("rr-visible");io.unobserve(entry.target)}}),{threshold:.08,rootMargin:"0px 0px -24px 0px"});
  unique.forEach(el=>io.observe(el));
  const rules=$$(".rr-gold-rule");const rio=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("rr-visible");rio.unobserve(entry.target)}}),{threshold:.1});rules.forEach(el=>rio.observe(el));
 }
 function setupToc(){
  const main=$("#main")||$("main");if(!main||$("#rr-toc"))return;
  const headings=$$("h2, h3",main).filter(h=>h.id&&h.textContent.trim()&&!h.closest("nav")&&!h.closest(".rr-calendar"));
  if(headings.length<4)return;
  const toc=document.createElement("details");toc.id="rr-toc";toc.className="rr-toc";toc.open=true;
  const summary=document.createElement("summary");summary.textContent="本頁の目次";toc.append(summary);
  const list=document.createElement("ol");
  headings.forEach(h=>{const li=document.createElement("li");if(h.tagName==="H3")li.style.marginLeft="1rem";const a=document.createElement("a");a.href="#"+h.id;a.textContent=h.textContent.trim();li.append(a);list.append(li)});
  toc.append(list);
  const firstSection=$("main > .section, main > section",main);if(firstSection)main.insertBefore(toc,firstSection);else main.insertBefore(toc,main.firstChild);
 }
 function setupPersonIndex(){
  if(!document.body.classList.contains("jinbutsu-page"))return;
  const cards=$$(".jr-person");if(!cards.length)return;
  const search=$("#person-search");if(!search)return;
  const wrap=search.closest(".jr-search")||search;
  const heading=document.createElement("p");heading.className="rr-index-heading";heading.textContent="REGISTER INDEX / 見出し字索引";
  const area=document.createElement("nav");area.className="rr-index";area.setAttribute("aria-label","人物名の頭文字索引");
  const all=document.createElement("button");all.type="button";all.textContent="全";all.className="is-active";all.dataset.rrInitial="all";all.setAttribute("aria-pressed","true");area.append(all);
  function firstChar(card){
    const title=$("h2,h3,.jr-person-name",card);
    const reading=(card.dataset.kana||card.dataset.reading||"").trim();
    const text=(reading||(title&&title.textContent)||"").trim().replace(/^[「『【（\s]+/,"");
    return text.charAt(0).toLocaleUpperCase("ja-JP");
  }
  const initials=[...new Set(cards.map(firstChar).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ja"));
  initials.forEach(initial=>{
    const button=document.createElement("button");button.type="button";button.textContent=initial;
    button.dataset.rrInitial=initial;button.setAttribute("aria-pressed","false");area.append(button);
  });
  wrap.insertAdjacentElement("afterend",heading);heading.insertAdjacentElement("afterend",area);
  area.addEventListener("click",event=>{
    const button=event.target.closest("button[data-rr-initial]");if(!button)return;
    $$("button[data-rr-initial]",area).forEach(item=>{
      const active=item===button;item.classList.toggle("is-active",active);item.setAttribute("aria-pressed",String(active));
    });
    document.dispatchEvent(new CustomEvent("bungeicho:person-index-change",{detail:{initial:button.dataset.rrInitial||"all"}}));
  });
 }

 function setupArchiveSearch(){
  const path=location.pathname.split("/").pop();
  if(path!=="archive.html")return;
  const main=$("#main")||$("main");if(!main||$("#rr-archive-search"))return;
  const cards=$$(".grid .card",main);if(!cards.length)return;
  const controls=document.createElement("section");controls.id="rr-archive-search";controls.className="rr-toc";
  const options=[...new Set(cards.map(card=>{
    const section=card.closest(".section"),heading=section&&$("h2",section);
    return heading?heading.textContent.trim():"資料";
  }))];
  controls.innerHTML='<label for="rr-archive-query" style="display:block;font-weight:600;margin-bottom:.5rem">資料室を検索</label><div class="rr-archive-controls"><input id="rr-archive-query" type="search" placeholder="資料名・説明文で検索" autocomplete="off"><select id="rr-archive-category" aria-label="資料分類で絞り込む"><option value="">すべての分類</option>'+options.map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join("")+'</select><button id="rr-archive-reset" type="button">解除</button></div><p id="rr-archive-count" aria-live="polite"></p>';
  const first=$(".section",main);if(first)main.insertBefore(controls,first);else main.prepend(controls);
  const query=$("#rr-archive-query",controls),select=$("#rr-archive-category",controls),count=$("#rr-archive-count",controls);
  function update(){
    const q=query.value.trim().toLocaleLowerCase("ja"),category=select.value;let visible=0;
    cards.forEach(card=>{
      const section=card.closest(".section"),heading=section&&$("h2",section),cat=heading?heading.textContent.trim():"資料";
      const okText=!q||card.textContent.toLocaleLowerCase("ja").includes(q);
      const okCategory=!category||cat===category;
      card.hidden=!(okText&&okCategory);if(!card.hidden)visible++;
    });
    count.textContent="表示中："+visible+" / "+cards.length+" 件";
  }
  query.addEventListener("input",update);select.addEventListener("change",update);
  $("#rr-archive-reset",controls).addEventListener("click",()=>{query.value="";select.value="";update();query.focus()});
  update();
 }

 function setupSealActions(){
  document.addEventListener("click",e=>{
   const button=e.target.closest("button");if(!button||button.closest("#rr-toolbar")||button.closest("#rr-bookmarks-dialog"))return;
   if(button.matches("[data-filter],[data-open-index],[data-close-index]")){notify("閲覧状態を更新しました",true)}
  });
 }
 document.addEventListener("DOMContentLoaded",()=>{
  if(reduced)document.documentElement.classList.add("rr-no-motion");
  injectToolbar();injectClock();injectCalendar();injectIntro();setupTransitions();setupReveal();setupToc();setupPersonIndex();setupArchiveSearch();setupSealActions();
 });
})();