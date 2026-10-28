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
 let bookmarkReturnFocus=null;
 let bookmarkPreviousOverflow="";
 function notify(message,stamp=false){
  let el=$("#rr-notice");
  if(!el){el=document.createElement("div");el.id="rr-notice";el.className="rr-notice";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.append(el)}
  el.textContent=message;el.classList.toggle("rr-stamp",stamp);el.classList.remove("is-visible","is-stamped");void el.offsetWidth;el.classList.add("is-visible");if(stamp)el.classList.add("is-stamped");
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove("is-visible"),2600);
 }
 function readBookmarks(){try{const data=JSON.parse(safeRead(STORAGE.bookmarks,"[]"));if(!Array.isArray(data))return[];return data.map(item=>{if(!item||typeof item.url!=="string"||typeof item.title!=="string")return null;try{const url=new URL(item.url,location.href);if(url.origin!==location.origin||!/^https?:$/.test(url.protocol))return null;return{url:url.pathname+url.search+url.hash,title:item.title.slice(0,240)}}catch{return null}}).filter(Boolean)}catch{return[]}}
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

 function closeBookmarks(back){
  if(!back||back.hidden)return;
  back.hidden=true;
  document.body.style.overflow=bookmarkPreviousOverflow;
  if(bookmarkReturnFocus&&typeof bookmarkReturnFocus.focus==="function")bookmarkReturnFocus.focus();
  bookmarkReturnFocus=null;
 }
 function renderBookmarks(back){
  const target=$("[data-rr-bookmark-content]",back),list=readBookmarks();
  if(!target)return;
  if(!list.length){
   target.innerHTML='<p class="rr-empty">まだ栞はありません。ページ右下の「栞」を押して保存できます。</p>';
   return;
  }
  target.innerHTML='<ul class="rr-bookmark-list">'+list.map((item,i)=>'<li class="rr-bookmark-item"><a href="'+esc(item.url)+'">'+esc(item.title)+'</a><button type="button" data-rr-remove="'+i+'">解除</button></li>').join("")+'</ul>';
  $$("[data-rr-remove]",target).forEach(button=>button.addEventListener("click",()=>{
   const next=readBookmarks();next.splice(Number(button.dataset.rrRemove),1);
   if(!writeBookmarks(next)){notify("このブラウザでは栞を更新できませんでした");return}
   renderBookmarks(back);notify("栞を取り外しました");
  }));
 }
 function openBookmarks(){
  let back=$("#rr-bookmarks-dialog");
  if(!back){
   back=document.createElement("div");back.id="rr-bookmarks-dialog";back.className="rr-dialog-backdrop";back.hidden=true;
   back.innerHTML='<section class="rr-dialog" role="dialog" aria-modal="true" aria-labelledby="rr-bookmarks-title" tabindex="-1"><div class="rr-dialog-head"><h2 id="rr-bookmarks-title">文藝廳の栞</h2><button type="button" data-rr-close aria-label="閉じる">閉じる ×</button></div><p class="rr-dialog-intro">このブラウザに保存したページです。端末間の同期は行われません。</p><div data-rr-bookmark-content></div><div class="rr-dialog-actions"><button type="button" data-rr-clear>栞をすべて消去</button></div></section>';
   document.body.append(back);
   back.addEventListener("click",event=>{
    if(event.target===back||event.target instanceof Element&&event.target.closest("[data-rr-close]"))closeBookmarks(back);
   });
   back.addEventListener("keydown",event=>{
    if(back.hidden)return;
    if(event.key==="Escape"){event.preventDefault();closeBookmarks(back);return}
    if(event.key!=="Tab")return;
    const focusable=$$("a[href]:not([hidden]),button:not([disabled]):not([hidden]),input:not([disabled]):not([hidden]),select:not([disabled]):not([hidden]),[tabindex]:not([tabindex='-1']):not([hidden])",back).filter(el=>el.getClientRects().length>0);
    if(!focusable.length){event.preventDefault();return}
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   });
   $("[data-rr-clear]",back).addEventListener("click",()=>{
    if(!confirm("保存した栞をすべて消去しますか？"))return;
    if(!writeBookmarks([])){notify("このブラウザでは栞を消去できませんでした");return}
    renderBookmarks(back);notify("栞をすべて消去しました");
   });
  }
  bookmarkReturnFocus=document.activeElement;
  bookmarkPreviousOverflow=document.body.style.overflow;
  renderBookmarks(back);
  back.hidden=false;
  document.body.style.overflow="hidden";
  const close=$("[data-rr-close]",back);if(close)close.focus();
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
  bar.innerHTML='<button type="button" data-rr-command aria-label="文藝廳全文索引を開く" title="全文索引（Ctrl/⌘+K）">⌕ 索引</button><button type="button" data-rr-focus aria-pressed="false" aria-label="閱讀集中モード" title="閱讀集中モード">集中</button><button type="button" data-rr-bookmark aria-label="このページを栞に保存">栞</button><button type="button" data-rr-open-bookmarks aria-label="保存した栞を開く">一覧</button><button type="button" data-rr-font="small" aria-label="本文を小さく" title="文字を小さく">A−</button><button type="button" data-rr-font="normal" aria-label="本文を標準サイズ" title="標準サイズ">A</button><button type="button" data-rr-font="large" aria-label="本文を大きく" title="文字を大きく">A＋</button>';
  document.body.append(bar);
  $("[data-rr-command]",bar).addEventListener("click",openQuickSearch);
  $("[data-rr-focus]",bar).addEventListener("click",toggleFocusMode);
  $("[data-rr-bookmark]",bar).addEventListener("click",addBookmark);
  $("[data-rr-open-bookmarks]",bar).addEventListener("click",openBookmarks);
  $$("[data-rr-font]",bar).forEach(b=>b.addEventListener("click",()=>setFontSize(b.dataset.rrFont)));
  setFontSize(safeRead(STORAGE.font,"normal"),true);
 }

 function injectClock(){
  if($("#rr-clock"))return;
  const line=$(".worldline")||$(".topline");
  const footerEra=$(".footer-bottom")||$(".footer-small");
  const source=[line&&line.textContent,footerEra&&footerEra.textContent].filter(Boolean).join(" ");
  const era=source.match(/玲瓏\s*[0-9０-９一二三四五六七八九十百千]+\s*年/);
  const imperial=source.match(/帝國暦\s*[0-9０-９一二三四五六七八九十百千]+\s*年/);
  const clock=document.createElement("aside");clock.id="rr-clock";clock.className="rr-clock";
  clock.setAttribute("aria-label","時報と帝國暦");
  clock.innerHTML='<span class="rr-clock-seal" aria-hidden="true">文</span><strong>文藝廳時報</strong><span class="rr-clock-era">'+esc(era?era[0]:"玲瓏時代")+'</span><span aria-hidden="true">／</span><span class="rr-clock-imperial">'+esc(imperial?imperial[0]:"帝國暦")+'</span><time class="rr-clock-time"></time>';
  if(line)line.insertAdjacentElement("afterend",clock);else document.body.insertAdjacentElement("afterbegin",clock);
  const update=()=>{
   const now=new Date(),time=now.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
   const el=$(".rr-clock-time",clock);if(el){el.textContent="現在時刻 "+time;el.dateTime=now.toISOString();}
  };
  update();window.setInterval(update,1000);
 }

 function injectCalendar(){
  if(!document.body.classList.contains("revolution-home")||$("#rr-calendar"))return;
  const host=document.createElement("div");host.id="rr-calendar-slot";host.className="rr-calendar-slot";
  const now=new Date(),year=now.getFullYear(),month=now.getMonth(),today=now.getDate();
  const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
  const weekdays=["日","月","火","水","木","金","土"];
  let cells=weekdays.map(day=>'<span class="rr-weekday">'+day+'</span>').join("");
  for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';
  for(let day=1;day<=days;day++)cells+='<span'+(day===today?' class="rr-today" aria-current="date"':'')+'>'+day+'</span>';
  const label=now.toLocaleDateString("ja-JP",{year:"numeric",month:"long"});
  host.innerHTML='<section class="rr-calendar" id="rr-calendar" aria-label="文藝廳の小さな暦"><div class="rr-calendar-head"><h2>文藝廳の小さな暦</h2><span>THE MONTHLY ALMANAC</span></div><div class="rr-calendar-grid" role="group" aria-label="'+esc(label)+'">'+cells+'</div><p class="rr-calendar-foot">端末の暦に基づく月間表示。帝國暦の換算・記念日設定は行っていません。</p></section>';
  const main=$("#main")||$("main"),related=main&&$(".related-section",main);
  if(related)main.insertBefore(host,related);else if(main)main.insertAdjacentElement("afterend",host);else document.body.append(host);
 }
 function addPetals(parent,count=18){
  if(reduced||!parent)return;
  const layer=document.createElement("div");layer.className="rr-petal-layer";layer.setAttribute("aria-hidden","true");parent.append(layer);
  for(let i=0;i<count;i++){const p=document.createElement("i");p.className="rr-petal";p.style.left=(Math.random()*100)+"%";p.style.setProperty("--duration",(3.2+Math.random()*2.8)+"s");p.style.setProperty("--rotation",(Math.random()*180)+"deg");p.style.setProperty("--drift",(-70+Math.random()*140)+"px");p.style.animationDelay=(Math.random()*.7)+"s";layer.append(p)}
  window.setTimeout(()=>layer.remove(),7000);
 }

 function injectIntro(){
  if(!document.body.classList.contains("revolution-home")||reduced||safeRead(STORAGE.intro,""))return;
  const intro=document.createElement("div");intro.id="rr-intro";intro.className="rr-intro";
  intro.setAttribute("role","dialog");intro.setAttribute("aria-modal","true");intro.setAttribute("aria-label","文藝廳");
  intro.innerHTML='<div class="rr-intro-inner"><p class="rr-intro-kicker">THE IMPERIAL BUREAU OF LITERATURE</p><p class="rr-intro-title" aria-hidden="true">文藝廳</p><div class="rr-intro-rule"></div><p class="rr-intro-sub">文ヲ興シ、思想ヲ遺ス。</p><button class="rr-intro-skip" type="button">閲覧を開始する</button></div>';
  const priorOverflow=document.body.style.overflow;
  document.body.append(intro);document.body.style.overflow="hidden";addPetals(intro,18);
  const button=$(".rr-intro-skip",intro),title=$("#opening-title");
  let finished=false,timer=0;
  const finish=()=>{
   if(finished)return;finished=true;window.clearTimeout(timer);document.removeEventListener("keydown",onKeydown);
   safeWrite(STORAGE.intro,"1");document.body.style.overflow=priorOverflow;
   intro.classList.add("is-leaving");
   window.setTimeout(()=>{intro.remove();if(title){title.setAttribute("tabindex","-1");title.focus({preventScroll:true})}},320);
  };
  const onKeydown=event=>{
   if(event.key==="Escape"){event.preventDefault();finish();return}
   if(event.key==="Tab"){event.preventDefault();button.focus({preventScroll:true})}
  };
  button.addEventListener("click",finish);
  intro.addEventListener("click",event=>{if(event.target===intro)finish()});
  document.addEventListener("keydown",onKeydown);
  button.focus({preventScroll:true});
  timer=window.setTimeout(finish,1800);
 }

 function setupTransitions(){
  if(reduced)return;
  const overlay=document.createElement("div");overlay.className="rr-transition";overlay.setAttribute("aria-hidden","true");document.body.append(overlay);
  document.addEventListener("click",event=>{
   if(!(event.target instanceof Element))return;
   const anchor=event.target.closest("a[href]");
   if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   if(anchor.target&&anchor.target!=="_self"||anchor.hasAttribute("download")||anchor.hasAttribute("data-no-transition"))return;
   const url=new URL(anchor.href,location.href);
   if(url.origin!==location.origin)return;
   if(url.pathname===location.pathname&&url.search===location.search)return;
   event.preventDefault();overlay.classList.add("is-active");
   window.setTimeout(()=>{location.href=url.href},300);
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
  headings.forEach(h=>{const li=document.createElement("li");if(h.tagName==="H3")li.classList.add("rr-toc-subitem");const a=document.createElement("a");a.href="#"+h.id;a.textContent=h.textContent.trim();li.append(a);list.append(li)});
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
  if(location.pathname.split("/").pop()!=="archive.html")return;
  const main=$("#main")||$("main");if(!main||$("#rr-archive-search"))return;
  const cards=$$(".grid .card",main);if(!cards.length)return;
  const archiveKinds=new Map([
   ["文藝年鑑・統計","年鑑・統計"],["作家・作品資料","人物・書誌"],["文藝雑誌・新聞","定期刊行物"],
   ["調査・研究報告","調査・研究"],["告示・制度史","行政・制度史"],["特別資料","特別資料"],
   ["B-01","刊行文藝"],["B-02","創作過程資料"],["B-03","作家関係資料"],
   ["B-04","批評・研究資料"],["B-05","口承・上演記録"],["B-06","行政・事業記録"]
  ]);
  const categoryFor=card=>{
   const label=$(".lr-card-label",card),title=$("h3",card);
   const key=(label&&label.textContent.trim())||(title&&title.textContent.trim())||"";
   if(archiveKinds.has(key))return archiveKinds.get(key);
   const name=title&&title.textContent.trim();
   return (name&&archiveKinds.get(name))||"その他";
  };
  const categories=[...new Set(cards.map(categoryFor))].sort((a,b)=>a.localeCompare(b,"ja"));
  const controls=document.createElement("section");controls.id="rr-archive-search";controls.className="rr-toc";
  controls.setAttribute("aria-label","資料室の検索と絞り込み");
  controls.innerHTML='<label class="rr-archive-label" for="rr-archive-query">資料室を検索</label><div class="rr-archive-controls"><input id="rr-archive-query" type="search" placeholder="資料名・説明文・分類コードで検索" autocomplete="off"><select id="rr-archive-category" aria-label="資料分類で絞り込む"><option value="">すべての分類</option>'+categories.map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join("")+'</select><button id="rr-archive-reset" type="button">解除</button></div><p id="rr-archive-count" class="rr-archive-count" aria-live="polite"></p>';
  const first=$(".section",main);if(first)main.insertBefore(controls,first);else main.prepend(controls);
  const query=$("#rr-archive-query",controls),select=$("#rr-archive-category",controls),count=$("#rr-archive-count",controls);
  function update(){
   const q=query.value.normalize("NFKC").trim().toLocaleLowerCase("ja-JP"),category=select.value;let visible=0;
   cards.forEach(card=>{
    const hay=card.textContent.normalize("NFKC").toLocaleLowerCase("ja-JP");
    const matchesText=!q||hay.includes(q),matchesCategory=!category||categoryFor(card)===category;
    card.hidden=!(matchesText&&matchesCategory);if(!card.hidden)visible++;
   });
   count.textContent=visible===0?"該當する資料はありません。":"表示中："+visible+" / "+cards.length+" 件";
  }
  query.addEventListener("input",update);select.addEventListener("change",update);
  $("#rr-archive-reset",controls).addEventListener("click",()=>{query.value="";select.value="";update();query.focus()});
  update();
 }

 
 // 全文索引：既存の公開ページを同一オリジンから読み、見出し・本文を横断検索する。
 const SITE_PAGES=[
  ["index.html","首頁"],["about.html","文藝廳について"],["support.html","文藝振興・作家支援"],
  ["awards.html","文藝賞・表彰"],["archive.html","文藝資料室"],["jinbutsuroku.html","文學・藝術人物録"],
  ["notices.html","告示・公表資料"],["staff.html","組織・人事"],["links.html","関連機關"],["sitemap.html","サイトマップ"]
 ];
 let quickSearchBack=null,quickSearchInput=null,quickSearchResults=null,quickSearchStatus=null;
 let quickSearchItems=[],quickSearchCursor=0,quickSearchIndexPromise=null,quickSearchReturnFocus=null;
 const quickActions=[
  {title:"首頁へ戻る",subtitle:"文藝廳公式情報網",href:"index.html",keywords:"ホーム トップ"},
  {title:"本頁の先頭へ",subtitle:"ページ上部へ移動",action:"top",keywords:"上 スクロール"},
  {title:"閱讀集中モードを切り替える",subtitle:"余白のある読書画面",action:"focus",keywords:"集中 フォーカス"},
  {title:"栞を開く",subtitle:"保存したページを一覧",action:"bookmarks",keywords:"ブックマーク"},
  {title:"本文を大きくする",subtitle:"表示補助",action:"font-large",keywords:"文字 拡大"},
  {title:"本文を標準サイズに戻す",subtitle:"表示補助",action:"font-normal",keywords:"文字 標準"},
  {title:"本文を小さくする",subtitle:"表示補助",action:"font-small",keywords:"文字 縮小"}
 ];
 function normSearch(s){return String(s||"").normalize("NFKC").toLocaleLowerCase("ja-JP").trim()}
 function buildQuickSearchIndex(){
  if(quickSearchIndexPromise)return quickSearchIndexPromise;
  quickSearchIndexPromise=Promise.all(SITE_PAGES.map(async([path,section])=>{
   try{
    const response=await fetch(new URL(path,location.href).href,{credentials:"same-origin",cache:"force-cache"});
    if(!response.ok)return[];
    const html=await response.text(),doc=new DOMParser().parseFromString(html,"text/html");
    const pageTitle=(doc.querySelector("h1")?.textContent||doc.title||section).trim();
    const nodes=Array.from(doc.querySelectorAll("main h1,main h2,main h3,main p,main .card h3,main .card p,main li,main blockquote"));
    const seen=new Set(),entries=[];
    for(const node of nodes){
     if(node.closest("nav,script,style,[aria-hidden='true']"))continue;
     const title=(node.textContent||"").replace(/\s+/g," ").trim();
     if(title.length<2||title.length>600)continue;
     const key=title.slice(0,240);if(seen.has(key))continue;seen.add(key);
     const anchor=node.closest("[id]")||node;
     const id=anchor.id||node.id||"";
     const href=path+(id?"#"+encodeURIComponent(id):"");
     entries.push({title:title.slice(0,115),subtitle:pageTitle+" ／ "+section,href,haystack:normSearch(title+" "+pageTitle+" "+section),type:"content"});
     if(entries.length>=180)break;
    }
    return entries;
   }catch{return[]}
  })).then(groups=>groups.flat());
  return quickSearchIndexPromise;
 }
 function currentPageItems(){
  const main=$("#main")||$("main"),items=[];
  if(!main)return items;
  $("h1[id],h2[id],h3[id]",main).forEach(node=>{
   const title=(node.textContent||"").trim();if(title)items.push({title,subtitle:"このページ内の見出し",href:"#"+encodeURIComponent(node.id),haystack:normSearch(title+" "+getTitle()),type:"heading"});
  });
  return items;
 }
 function quickSearchCatalog(query){
  const q=normSearch(query),base=[];
  SITE_PAGES.forEach(([href,label])=>{
   base.push({title:label,subtitle:"文藝廳公式情報網 ／ ページを開く",href,haystack:normSearch(label+" "+href),type:"page"});
  });
  quickActions.forEach(item=>base.push({...item,haystack:normSearch(item.title+" "+item.subtitle+" "+(item.keywords||"")),type:"action"}));
  const local=currentPageItems();
  const source=q.length>=2?base.concat(local,quickSearchItems):base.concat(local.slice(0,5));
  if(q.length<2)return source.slice(0,14);
  return source.filter(item=>item.haystack.includes(q)||normSearch(item.title+" "+item.subtitle).includes(q)).slice(0,16);
 }
 function renderQuickSearch(){
  if(!quickSearchResults||!quickSearchInput)return;
  const query=quickSearchInput.value;
  const results=quickSearchCatalog(query);quickSearchCursor=Math.max(0,Math.min(quickSearchCursor,Math.max(0,results.length-1)));
  quickSearchResults.replaceChildren();
  if(!results.length){
   const empty=document.createElement("p");empty.className="rr-command-empty";empty.textContent="該當する記録は見つかりません。語句を短くするか、別の表記をお試しください。";quickSearchResults.append(empty);
   quickSearchStatus.textContent="0 件";return;
  }
  results.forEach((item,index)=>{
   const button=document.createElement("button");button.type="button";button.className="rr-command-result"+(index===quickSearchCursor?" is-selected":"");button.setAttribute("role","option");button.setAttribute("aria-selected",String(index===quickSearchCursor));button.dataset.rrResult=String(index);
   const title=document.createElement("span");title.className="rr-command-result-title";title.textContent=item.title;
   const subtitle=document.createElement("span");subtitle.className="rr-command-result-subtitle";subtitle.textContent=item.subtitle||"";
   button.append(title,subtitle);button.addEventListener("mouseenter",()=>{quickSearchCursor=index;syncQuickSearchSelection()});button.addEventListener("click",()=>runQuickSearchItem(item));quickSearchResults.append(button);
  });
  quickSearchStatus.textContent=query.trim()?results.length+" 件を表示":"索引・操作 "+results.length+" 件 ／ 全文検索は語句を入力";
  quickSearchResults.dataset.count=String(results.length);
  syncQuickSearchSelection();
 }
 function syncQuickSearchSelection(){
  if(!quickSearchResults)return;
  $(".rr-command-result",quickSearchResults).forEach((button,index)=>{
   const active=index===quickSearchCursor;button.classList.toggle("is-selected",active);button.setAttribute("aria-selected",String(active));
  });
 }
 function closeQuickSearch(){
  if(!quickSearchBack||quickSearchBack.hidden)return;
  quickSearchBack.hidden=true;document.body.classList.remove("rr-command-open");document.body.style.overflow=quickSearchBack.dataset.previousOverflow||"";
  if(quickSearchReturnFocus&&quickSearchReturnFocus.isConnected)quickSearchReturnFocus.focus({preventScroll:true});
  quickSearchReturnFocus=null;
 }
 function openQuickSearch(){
  if(!quickSearchBack){
   quickSearchBack=document.createElement("div");quickSearchBack.id="rr-command-palette";quickSearchBack.className="rr-command-backdrop";quickSearchBack.hidden=true;
   quickSearchBack.innerHTML='<section class="rr-command-panel" role="dialog" aria-modal="true" aria-labelledby="rr-command-title" aria-describedby="rr-command-help" tabindex="-1"><div class="rr-command-head"><div><p class="rr-command-eyebrow">BUNGEICHO / ARCHIVAL INDEX</p><h2 id="rr-command-title">文藝廳・全文索引</h2></div><button type="button" class="rr-command-close" data-rr-command-close>閉じる <kbd>Esc</kbd></button></div><label class="rr-command-input-wrap"><span aria-hidden="true">⌕</span><input type="search" id="rr-command-input" placeholder="人物・資料・制度・見出しを検索…" autocomplete="off" spellcheck="false" aria-label="文藝廳の全文検索"></label><p id="rr-command-help" class="rr-command-help">公開ページを横断検索。 <kbd>↑</kbd><kbd>↓</kbd> で選択、<kbd>Enter</kbd> で開く。</p><div class="rr-command-results" role="listbox" aria-label="検索結果"></div><div class="rr-command-foot"><span class="rr-command-status" aria-live="polite"></span><span>文ヲ興シ、思想ヲ遺ス。</span></div></section>';
   document.body.append(quickSearchBack);
   quickSearchInput=$("#rr-command-input",quickSearchBack);quickSearchResults=$(".rr-command-results",quickSearchBack);quickSearchStatus=$(".rr-command-status",quickSearchBack);
   quickSearchInput.addEventListener("input",()=>{quickSearchCursor=0;renderQuickSearch();});
   quickSearchBack.addEventListener("click",event=>{if(event.target===quickSearchBack||event.target.closest("[data-rr-command-close]"))closeQuickSearch()});
   quickSearchBack.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();closeQuickSearch();return}
    if(event.key==="ArrowDown"||event.key==="ArrowUp"){
     const results=quickSearchCatalog(quickSearchInput.value);if(!results.length)return;
     event.preventDefault();quickSearchCursor=(quickSearchCursor+(event.key==="ArrowDown"?1:-1)+results.length)%results.length;syncQuickSearchSelection();
     const selected=$(".rr-command-result.is-selected",quickSearchResults);if(selected)selected.scrollIntoView({block:"nearest"});
    }else if(event.key==="Enter"){
     event.preventDefault();const item=quickSearchCatalog(quickSearchInput.value)[quickSearchCursor];if(item)runQuickSearchItem(item);
    }else if(event.key==="Tab"){
     const focusables=$("input,button",quickSearchBack).filter(el=>!el.disabled&&el.getClientRects().length);
     if(event.shiftKey&&document.activeElement===focusables[0]){event.preventDefault();focusables[focusables.length-1].focus()}
     else if(!event.shiftKey&&document.activeElement===focusables[focusables.length-1]){event.preventDefault();focusables[0].focus()}
    }
   });
  }
  quickSearchReturnFocus=document.activeElement;quickSearchBack.dataset.previousOverflow=document.body.style.overflow;
  quickSearchBack.hidden=false;document.body.classList.add("rr-command-open");document.body.style.overflow="hidden";
  quickSearchInput.value="";quickSearchCursor=0;renderQuickSearch();quickSearchInput.focus({preventScroll:true});
  buildQuickSearchIndex().then(items=>{quickSearchItems=items;if(quickSearchBack&&!quickSearchBack.hidden)renderQuickSearch()});
 }
 function runQuickSearchItem(item){
  closeQuickSearch();
  if(item.action==="top"){window.scrollTo({top:0,behavior:reduced?"auto":"smooth"});return}
  if(item.action==="focus"){toggleFocusMode();return}
  if(item.action==="bookmarks"){openBookmarks();return}
  if(item.action==="font-large"){setFontSize("large");return}
  if(item.action==="font-normal"){setFontSize("normal");return}
  if(item.action==="font-small"){setFontSize("small");return}
  if(item.href){
   if(item.href.startsWith("#")){const target=document.getElementById(decodeURIComponent(item.href.slice(1)));if(target)target.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});return}
   const url=new URL(item.href,location.href);if(url.href!==location.href)location.href=url.href;
  }
 }
 function toggleFocusMode(){
  const active=document.body.classList.toggle("rr-focus-mode");
  const button=$("[data-rr-focus]");if(button)button.setAttribute("aria-pressed",String(active));
  notify(active?"閱讀集中モード：開啟":"閱讀集中モード：解除",true);
 }
 function injectReadingProgress(){
  if($("#rr-progress-track"))return;
  const track=document.createElement("div");track.id="rr-progress-track";track.className="rr-progress-track";track.setAttribute("role","progressbar");track.setAttribute("aria-label","本文の讀了進度");track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax","100");
  const bar=document.createElement("span");bar.className="rr-progress-bar";track.append(bar);document.body.append(track);
  const top=document.createElement("button");top.id="rr-top-button";top.className="rr-top-button";top.type="button";top.innerHTML='<span aria-hidden="true">↑</span><span>頁首</span>';top.setAttribute("aria-label","ページの先頭へ戻る");top.hidden=true;document.body.append(top);
  top.addEventListener("click",()=>window.scrollTo({top:0,behavior:reduced?"auto":"smooth"}));
  let scheduled=false;
  const update=()=>{
   const max=document.documentElement.scrollHeight-window.innerHeight,progress=max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0;
   bar.style.width=progress+"%";track.setAttribute("aria-valuenow",String(Math.round(progress)));top.hidden=window.scrollY<420;
   scheduled=false;
  };
  const requestUpdate=()=>{if(!scheduled){scheduled=true;window.requestAnimationFrame(update)}};
  window.addEventListener("scroll",requestUpdate,{passive:true});window.addEventListener("resize",requestUpdate,{passive:true});update();
 }
 function installQuickShortcuts(){
  document.addEventListener("keydown",event=>{
   const target=event.target;
   const typing=target instanceof Element&&(target.matches("input,textarea,select,[contenteditable='true']")||target.closest("[role='dialog']"));
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();openQuickSearch();return}
   if(!typing&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key==="/"){event.preventDefault();openQuickSearch()}
  });
 }

 function setupSealActions(){
  document.addEventListener("click",e=>{
   const button=e.target.closest("button");if(!button||button.closest("#rr-toolbar")||button.closest("#rr-bookmarks-dialog"))return;
   if(button.matches("[data-filter],[data-open-index],[data-close-index]")){notify("閲覧状態を更新しました",true)}
  });
 }
 document.addEventListener("DOMContentLoaded",()=>{
  if(reduced)document.documentElement.classList.add("rr-no-motion");
  injectToolbar();injectClock();injectCalendar();injectReadingProgress();installQuickShortcuts();injectIntro();setupTransitions();setupReveal();setupToc();setupPersonIndex();setupArchiveSearch();setupSealActions();
 });
})();