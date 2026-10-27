document.addEventListener("DOMContentLoaded",()=>{
 const cards=[...document.querySelectorAll(".jr-person")];
 const search=document.querySelector("#person-search");
 const buttons=[...document.querySelectorAll("[data-filter]")];
 const count=document.querySelector("#visible-count");
 const summary=document.querySelector("#result-summary");
 const empty=document.querySelector("#no-results");
 let active="all";
 const update=()=>{
  const q=(search?.value||"").trim().toLocaleLowerCase();let shown=0;
  cards.forEach(card=>{
   const category=(card.dataset.category||"").split(/\\s+/);
   const hay=(card.dataset.search+" "+card.textContent).toLocaleLowerCase();
   const okCategory=active==="all"||category.includes(active);
   const okSearch=!q||hay.includes(q);
   card.hidden=!(okCategory&&okSearch);if(!card.hidden)shown++;
  });
  if(count)count.textContent=String(shown);
  if(summary)summary.textContent=(q?"検索結果":"")+(active==="all"?"":(q?"・":"")+buttons.find(b=>b.dataset.filter===active)?.textContent)+(q||active!=="all"?"：":"")+"全"+shown+"名を表示中";
  if(empty)empty.hidden=shown!==0;
 };
 buttons.forEach(button=>button.addEventListener("click",()=>{
  active=button.dataset.filter||"all";
  buttons.forEach(b=>{const selected=b===button;b.classList.toggle("is-active",selected);b.setAttribute("aria-pressed",String(selected));});update();
 }));
 if(search)search.addEventListener("input",update);
 update();
});