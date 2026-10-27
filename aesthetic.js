/* 文藝廳・玲瓏浪漫演出。装飾のみを担当し、本文データには触れない。 */
(function(){
  const root=document.documentElement;
  const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!reduce)root.classList.add("aes-js");

  function init(){
    const body=document.body;
    if(!body||!body.classList.contains("revolution-home"))return;

    /* スクロール時の静かな出現 */
    if(!reduce&&"IntersectionObserver" in window){
      const targets=document.querySelectorAll("body.revolution-home main > section");
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add("aes-in");
            observer.unobserve(entry.target);
          }
        });
      },{threshold:.12,rootMargin:"0px 0px -35px 0px"});
      targets.forEach((el,i)=>{
        el.classList.add("aes-rv");
        el.style.transitionDelay=(i%2)*90+"ms";
        observer.observe(el);
      });
    }else{
      document.querySelectorAll("body.revolution-home main > section").forEach(el=>el.classList.add("aes-in"));
    }

    /* CSSだけでは描かない、ごく控えめな薔薇色の花弁 */
    if(reduce||!window.requestAnimationFrame)return;
    const canvas=document.createElement("canvas");
    canvas.id="aes-petals";
    canvas.setAttribute("aria-hidden","true");
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    body.appendChild(canvas);
    let width=0,height=0,dpr=1,petals=[],frame=0;
    const count=window.innerWidth<700?9:17;
    const resize=()=>{
      dpr=Math.min(window.devicePixelRatio||1,1.5);
      width=window.innerWidth;height=window.innerHeight;
      canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);
      canvas.style.width=width+"px";canvas.style.height=height+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      petals=Array.from({length:count},()=>({
        x:Math.random()*width,y:Math.random()*height,
        size:2+Math.random()*4,fall:.22+Math.random()*.48,
        drift:(Math.random()-.5)*.42,turn:Math.random()*Math.PI,
        spin:(Math.random()-.5)*.012,alpha:.12+Math.random()*.22
      }));
    };
    const draw=()=>{
      frame=requestAnimationFrame(draw);
      ctx.clearRect(0,0,width,height);
      for(const p of petals){
        p.y+=p.fall;p.x+=p.drift+Math.sin(p.y*.008)*.18;p.turn+=p.spin;
        if(p.y>height+12){p.y=-12;p.x=Math.random()*width;}
        if(p.x<-12)p.x=width+12;if(p.x>width+12)p.x=-12;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.turn);
        ctx.globalAlpha=p.alpha;ctx.fillStyle="#d9a3a8";
        ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*.58,0,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
    };
    resize();draw();
    window.addEventListener("resize",resize,{passive:true});
    document.addEventListener("visibilitychange",()=>{
      if(document.hidden){cancelAnimationFrame(frame);}
      else if(!reduce)draw();
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();