document.addEventListener("DOMContentLoaded",()=>{
  const nav=document.querySelector(".new-nav .nav")||document.querySelector(".nav");
  if(nav){
    const links=[
      ["index.html","首頁"],
      ["about.html","文藝廳について"],
      ["support.html","文藝振興・作家支援"],
      ["awards.html","文藝賞・表彰"],
      ["archive.html","文藝資料室"],
      ["jinbutsuroku.html","文學・藝術人物録"],
      ["notices.html","告示・公表資料"],
      ["staff.html","組織・人事"],
      ["links.html","関連機關"],
      ["sitemap.html","サイトマップ"]
    ];
    const current=location.pathname.split("/").pop()||"index.html";
    nav.innerHTML=links.map(([href,label])=>'<a href="'+href+'" '+(current===href?'aria-current="page"':"")+'>'+label+"</a>").join("");
  }

  const overlay=document.querySelector("#index-overlay");
  const opener=document.querySelector("[data-open-index]");
  const closer=document.querySelector("[data-close-index]");
  const search=document.querySelector("#index-search");
  const results=[...document.querySelectorAll("#index-results a")];
  let previousFocus=null;
  let emptyMessage=null;

  if(overlay&&search&&results.length){
    emptyMessage=document.createElement("p");
    emptyMessage.className="index-empty";
    emptyMessage.textContent="該當スル案内ハ見ツカリマセン。別ノ言葉デ検索シテクダサイ。";
    emptyMessage.hidden=true;
    document.querySelector("#index-results").after(emptyMessage);
  }
  const open=()=>{
    if(!overlay)return;
    previousFocus=document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
    if(search){search.value="";results.forEach(a=>a.hidden=false);if(emptyMessage)emptyMessage.hidden=true;}
    requestAnimationFrame(()=>search?search.focus():closer&&closer.focus());
  };
  const close=()=>{
    if(!overlay)return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
    if(previousFocus&&typeof previousFocus.focus==="function")previousFocus.focus();
  };
  if(opener)opener.addEventListener("click",open);
  if(closer)closer.addEventListener("click",close);
  if(overlay)overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
  if(search)search.addEventListener("input",()=>{
    const q=search.value.trim().toLocaleLowerCase();
    let visible=0;
    results.forEach(a=>{
      const haystack=(a.textContent+" "+(a.dataset.keywords||"")).toLocaleLowerCase();
      a.hidden=!!q&&!haystack.includes(q);
      if(!a.hidden)visible++;
    });
    if(emptyMessage)emptyMessage.hidden=visible!==0;
  });
  document.addEventListener("keydown",e=>{
    const isOpen=overlay&&overlay.classList.contains("is-open");
    if(!isOpen)return;
    if(e.key==="Escape"){e.preventDefault();close();return;}
    if(e.key==="Tab"){
      const focusable=[closer,search,...results.filter(a=>!a.hidden)].filter(el=>el&&!el.disabled);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  const copy=document.querySelector("[data-copy-year]");
  if(copy)copy.textContent=String(new Date().getFullYear());
});