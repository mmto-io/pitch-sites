
// The walk works without JavaScript. Animation is an optional layer.
window.addEventListener('DOMContentLoaded',()=>{
 const viewport=window.matchMedia('(max-width: 700px)');
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 let cleanup=()=>{};
 function start(){
  cleanup();
  if(preference.matches || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const mobile=viewport.matches;
  let lenis, tick;
  if(window.Lenis){
   lenis=new Lenis({duration:1.05,smoothWheel:true,syncTouch:false});
   lenis.on('scroll',ScrollTrigger.update);
   tick=time=>lenis.raf(time*1000);
   gsap.ticker.add(tick);
  }
  const context=gsap.context(()=>{
   // Only animate elements below the viewport: nothing starts hidden.
   document.querySelectorAll('.reveal').forEach((element,i)=>{
    if(element.getBoundingClientRect().top<window.innerHeight) return;
    gsap.from(element,{y:mobile?18:30,duration:.85,delay:(i%3)*.05,ease:'power2.out',scrollTrigger:{trigger:element,start:'top 95%',once:true}});
   });
   if(!mobile && document.querySelector('.hero-photo')) gsap.to('.hero-photo',{y:32,rotation:1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
   document.querySelectorAll('.trail-active').forEach(path=>{
    if(mobile) return;
    // A mask reveals the dotted line, preserving the footsteps of the trail.
    const ns='http://www.w3.org/2000/svg',svg=path.ownerSVGElement;
    const defs=document.createElementNS(ns,'defs'),mask=document.createElementNS(ns,'mask'),line=path.cloneNode();
    const id='trail-mask-'+Math.random().toString(36).slice(2);
    const bounds=svg.viewBox.baseVal;
    mask.id=id;mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x',bounds.x-20);mask.setAttribute('y',bounds.y-100);mask.setAttribute('width',bounds.width+40);mask.setAttribute('height',bounds.height+200);
    line.removeAttribute('class');line.setAttribute('fill','none');line.setAttribute('stroke','white');line.setAttribute('stroke-width','8');
    const length=path.getTotalLength();line.style.strokeDasharray=length;line.style.strokeDashoffset=length;
    mask.append(line);defs.append(mask);svg.append(defs);path.setAttribute('mask','url(#'+id+')');
    gsap.to(line,{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:svg.closest('section'),start:'top 65%',end:'bottom 60%',scrub:1}});
   });
   if(!mobile) document.querySelectorAll('.trail-paw').forEach(paw=>gsap.from(paw,{opacity:0,ease:'none',scrollTrigger:{trigger:paw,start:'top 85%',end:'top 60%',scrub:1}}));
   if(document.querySelector('.contact .gate-art .paw')) gsap.from('.gate-art .paw',{opacity:0,ease:'none',scrollTrigger:{trigger:'.contact',start:'top 75%',end:'center 65%',scrub:1}});
  });
  cleanup=()=>{context.revert();if(tick)gsap.ticker.remove(tick);if(lenis)lenis.destroy();document.querySelectorAll('.trail-active').forEach(p=>p.removeAttribute('mask'));document.querySelectorAll('mask[id^="trail-mask-"]').forEach(m=>m.parentNode.remove());};
  window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
 }
 start();preference.addEventListener('change',start);viewport.addEventListener('change',start);
});

// Keep the requested placeholder reviewable without sending personal details to an unconfigured endpoint.
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.querySelector('.contact-form');
 if(form && form.action.endsWith('/YOUR_FORM_ID')) form.addEventListener('submit',event=>{
  event.preventDefault();
  document.getElementById('form-status').textContent='The form is not connected yet. Please text 604 722 7162 or email info@poochpositive.ca.';
 });
});
