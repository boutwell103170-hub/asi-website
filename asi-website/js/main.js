/* ASI homepage interactions baseline */

const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
const prog=document.getElementById('progress');
addEventListener('scroll',()=>{const m=document.documentElement.scrollHeight-innerHeight;prog.style.width=(m?scrollY/m*100:0)+'%'},{passive:true});
document.getElementById('startIntake')?.addEventListener('click',()=>location.href='quote.html');

document.querySelectorAll('.serviceTop').forEach(top=>{
  top.addEventListener('click',()=>top.closest('.serviceItem').classList.toggle('open'));
});
const mobileToggle=document.getElementById('mobileToggle');
const mobileMenu=document.getElementById('mobileMenu');
mobileToggle?.addEventListener('click',()=>mobileMenu.classList.toggle('open'));
mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mobileMenu.classList.remove('open')));
const backTop=document.getElementById('backTop');
addEventListener('scroll',()=>backTop.classList.toggle('show',scrollY>700),{passive:true});

const mt=document.getElementById('mobileToggle');
const mm=document.getElementById('mobileMenu');
if(mt&&mm){
  mt.addEventListener('click',()=>{
    const open=mm.classList.toggle('open');
    mt.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&mm.classList.contains('open')){
      mm.classList.remove('open');mt.setAttribute('aria-expanded','false');mt.focus();
    }
  });
}