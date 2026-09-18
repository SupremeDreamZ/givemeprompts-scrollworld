
document.documentElement.classList.add('js');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll('.reveal').forEach(x=>io.observe(x));
const menu=document.querySelector('.menu'),nav=document.querySelector('.mobileNav');
if(menu&&nav){const close=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')};menu.addEventListener('click',()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}
document.querySelectorAll('.brand img,.footlogo').forEach(img=>img.addEventListener('error',()=>{img.style.display='none';const s=document.createElement('strong');s.textContent='DoorGi';s.style.fontSize='28px';img.after(s)}));