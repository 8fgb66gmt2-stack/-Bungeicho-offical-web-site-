document.addEventListener("DOMContentLoaded",()=>{
 const cards=[...document.querySelectorAll(".jr-person")];
 const search=document.querySelector("#person-search");
 const buttons=[...document.querySelectorAll("[data-filter]")];
 const count=document.querySelector("#visible-count");
 const summary=document.querySelector("#result-summary");
 const empty=document.querySelector("#no-results");
 let active="all";
 let activeInitial="all";

 const firstChar=card=>{
  const title=card.querySelector("h2,h3,.jr-person-name");
  const reading=(card.dataset.kana||card.dataset.reading||"").trim();
  const name=(reading||(title&&title.textContent)||"").trim().replace(/^[「『【（\s]+/,"");
  return name.charAt(0).toLocaleUpperCase("ja-JP");
 };

 const update=()=>{
  const q=(search?.value||"").trim().toLocaleLowerCase("ja");
  let shown=0;
  cards.forEach(card=>{
   const category=(card.dataset.category||"").split(/\s+/);
   const hay=((card.dataset.search||"")+" "+card.textContent).toLocaleLowerCase("ja");
   const okCategory=active==="all"||category.includes(active);
   const okSearch=!q||hay.includes(q);
   const okInitial=activeInitial==="all"||firstChar(card)===activeInitial;
   card.hidden=!(okCategory&&okSearch&&okInitial);
   if(!card.hidden)shown++;
  });
  if(count)count.textContent=String(shown);
  if(summary){
   const descriptors=[];
   if(q)descriptors.push("検索結果");
   if(active!=="all")descriptors.push(buttons.find(b=>b.dataset.filter===active)?.textContent||"分類");
   if(activeInitial!=="all")descriptors.push("頭文字「"+activeInitial+"」");
   summary.textContent=descriptors.length?descriptors.join("／")+"："+shown+"名を表示中":"全"+shown+"名を表示中";
  }
  if(empty)empty.hidden=shown!==0;
 };

 buttons.forEach(button=>button.addEventListener("click",()=>{
  active=button.dataset.filter||"all";
  buttons.forEach(b=>{
   const selected=b===button;b.classList.toggle("is-active",selected);b.setAttribute("aria-pressed",String(selected));
  });
  update();
 }));
 if(search)search.addEventListener("input",update);
 document.addEventListener("bungeicho:person-index-change",event=>{
  activeInitial=event.detail&&typeof event.detail.initial==="string"?event.detail.initial:"all";
  update();
 });
 update();
});
