'use strict';
document.body.classList.add('js');

const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#hovedmeny');
menuToggle.hidden = false;
function closeMenu() {
  menu.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('span').textContent = '+';
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.querySelector('span').textContent = open ? '×' : '+';
  menu.classList.toggle('is-open', open);
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); }
});
window.matchMedia('(min-width:801px)').addEventListener('change', closeMenu);

const dialog = document.querySelector('#contact-dialog');
const form = document.querySelector('#contact-form');
const formResult = document.querySelector('#form-result');
let contactTrigger;
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  contactTrigger = menu.contains(button) && menuToggle.offsetParent !== null ? menuToggle : button;
  closeMenu();
  dialog.showModal();
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener('close', () => { form.reset(); formResult.hidden = true; contactTrigger?.focus(); });
form.addEventListener('submit', event => { event.preventDefault(); formResult.hidden = false; });

const stages = [
  {phase:'Før samtalen', title:'Vit hva du må<br> finne ut.', description:'Før du ringer, vet du hvilke spørsmål som må være avklart før et møte er verdt å booke.', label:'FØR SAMTALEN / 01', kicker:'Det du må få svar på', quote:'«Hvem tar beslutningen,<br> og når må det være på plass?»', note:'BraveCoach holder oversikt over hvilke spørsmål som er besvart, og hvilke som mangler.', outcome:'Du ringer med en klar plan.'},
  {phase:'Under samtalen', title:'Hjelp mens du<br> snakker med kunden.', description:'BraveCoach transkriberer samtalen og viser hva som fortsatt mangler, så du ikke legger på uten svarene du trenger.', label:'UNDER SAMTALEN / 02', kicker:'Fra transkriberingen · Eksempel', quote:'«Vi har prøvd noe lignende før,<br> men det som skjedde var …»', note:'Kunden er på vei til å fortelle noe viktig. La dem snakke ferdig før du stiller neste spørsmål.', outcome:'Støtte basert på det som blir sagt, mens det blir sagt.'},
  {phase:'Etter samtalen', title:'Oppsummert når<br> du legger på.', description:'BraveCoach lager en oppsummering av samtalen: hva kunden sa, hva som er avklart og hva som må følges opp.', label:'ETTER SAMTALEN / 03', kicker:'Oppsummering · Eksempel', quote:'«Behov avklart. Daglig leder bestemmer.<br> Møte booket, neste uke.»', note:'Oppsummeringen er klar når du skal forberede møtet. Du slipper å starte på nytt.', outcome:'Alt du fikk vite, samlet på ett sted.'}
];
const liveExamples = [
  {quote:'«Vi har prøvd noe lignende før,<br> men det som skjedde var …»', advice:'La kunden snakke ferdig.', note:'Kunden er på vei til å fortelle noe viktig. La dem snakke ferdig før du stiller neste spørsmål.'},
  {quote:'«Høres interessant ut.<br> Kan du sende noe på e-post?»', advice:'Du vet ikke hvem som bestemmer ennå.', note:'Spør hvem som bør være med i et møte før dere avslutter samtalen.'},
  {quote:'«Ja, det passer fint<br> med et møte neste uke.»', advice:'Book møtet nå.', note:'Behov og beslutningstaker er avklart. Foreslå et tidspunkt mens dere fortsatt snakker.'}
];
const stageButtons = [...document.querySelectorAll('[data-step]')];
const scene = document.querySelector('#workflow-scene');
const track = document.querySelector('.journey-track');
const sticky = document.querySelector('.journey-sticky');
const progressBar = document.querySelector('.journey-progress>span');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopStory = window.matchMedia('(min-width:1001px) and (min-height:650px), (min-width:601px) and (max-width:1000px) and (min-height:850px)');
const motionToggle = document.querySelector('.motion-toggle');
let currentStage = -1;
let motionPaused = false;
let rafPending = false;
let clickScrollPosition = null;
let clickScrollTimer;
let sceneTimer;

function setStage(index) {
  if (index === currentStage) return;
  currentStage = index;
  const stage = stages[index];
  stageButtons.forEach((button, i) => {
    button.classList.toggle('is-active', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  });
  document.querySelector('[data-phase]').textContent = stage.phase;
  document.querySelector('[data-step-title]').innerHTML = stage.title;
  document.querySelector('[data-step-description]').textContent = stage.description;
  document.querySelector('[data-work-label]').textContent = stage.label;
  document.querySelector('[data-scene-kicker]').textContent = stage.kicker;
  document.querySelector('[data-scene-quote]').innerHTML = stage.quote;
  document.querySelector('[data-coach-note]').textContent = stage.note;
  document.querySelector('[data-coach-label]').textContent = index === 1 ? 'BraveCoach · Under samtalen' : 'BraveCoach';
  document.querySelector('[data-live-advice]').hidden = index !== 1;
  document.querySelector('.live-situations').hidden = index !== 1;
  if (index === 1) setLiveExample(1);
  document.querySelector('[data-outcome]').textContent = stage.outcome;
  document.querySelector('[data-current-step]').textContent = String(index + 1).padStart(2, '0');
  progressBar.style.width = `${((index + 1) / stages.length) * 100}%`;
  scene.dataset.stage = String(index);
  if (!reducedMotion.matches && !motionPaused) {
    scene.classList.remove('scene-changing');
    void scene.offsetWidth;
    scene.classList.add('scene-changing');
    clearTimeout(sceneTimer);
    sceneTimer = setTimeout(() => scene.classList.remove('scene-changing'), 500);
  }
}

function setLiveExample(index) {
  const example = liveExamples[index];
  document.querySelector('[data-scene-quote]').innerHTML = example.quote;
  document.querySelector('[data-live-advice]').textContent = example.advice;
  document.querySelector('[data-coach-note]').textContent = example.note;
  document.querySelectorAll('[data-live-example]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
}
document.querySelectorAll('[data-live-example]').forEach(button => button.addEventListener('click', () => setLiveExample(Number(button.dataset.liveExample))));

function scrollMetrics() {
  const top = track.getBoundingClientRect().top + window.scrollY;
  const stickyTop = parseFloat(getComputedStyle(sticky).top) || 110;
  return {start:top - stickyTop, range:Math.max(1, track.offsetHeight - (window.innerHeight - stickyTop - 24))};
}
function scrollStoryEnabled() { return desktopStory.matches && !reducedMotion.matches && !motionPaused; }
function updateScroll() {
  rafPending = false;
  if (!scrollStoryEnabled()) return;
  if (clickScrollPosition !== null) {
    if (Math.abs(window.scrollY - clickScrollPosition) > 4) return;
    clickScrollPosition = null;
    clearTimeout(clickScrollTimer);
  }
  const {start,range} = scrollMetrics();
  const fraction = Math.min(1, Math.max(0, (window.scrollY - start) / range));
  setStage(Math.min(stages.length - 1, Math.floor(fraction * stages.length)));
}
function requestScrollUpdate() { if (!rafPending) { rafPending = true; requestAnimationFrame(updateScroll); } }
stageButtons.forEach((button, index) => button.addEventListener('click', () => {
  setStage(index);
  if (scrollStoryEnabled()) {
    const {start,range} = scrollMetrics();
    clickScrollPosition = Math.max(0, start + range * ((index + .35) / stages.length));
    window.scrollTo({top:clickScrollPosition, behavior:'smooth'});
    clearTimeout(clickScrollTimer);
    clickScrollTimer = setTimeout(() => { clickScrollPosition = null; requestScrollUpdate(); }, 1500);
  }
}));
window.addEventListener('wheel', () => { clickScrollPosition = null; }, {passive:true});
window.addEventListener('scroll', requestScrollUpdate, {passive:true});
window.addEventListener('resize', requestScrollUpdate, {passive:true});

function syncMotion() {
  document.body.classList.toggle('motion-paused', motionPaused || reducedMotion.matches);
  document.body.classList.toggle('scroll-story', scrollStoryEnabled());
  motionToggle.hidden = reducedMotion.matches || !desktopStory.matches;
  document.querySelector('.journey-hint').textContent = scrollStoryEnabled() ? 'Scroll eller velg et steg.' : 'Velg et steg.';
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  motionToggle.setAttribute('aria-label', motionPaused ? 'Bruk scrollanimasjon' : 'Vis uten scrollanimasjon');
  motionToggle.querySelector('span').textContent = motionPaused ? '▷' : 'Ⅱ';
  motionToggle.querySelector('.motion-toggle-label').textContent = motionPaused ? 'Bruk scrollanimasjon' : 'Vis uten scrollanimasjon';
  requestScrollUpdate();
}
motionToggle.addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
reducedMotion.addEventListener('change', syncMotion);
desktopStory.addEventListener('change', syncMotion);
setStage(0);
syncMotion();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, {threshold:.08,rootMargin:'0px 0px -20px 0px'});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  const heroObserver = new IntersectionObserver(([entry]) => document.body.classList.toggle('hero-offscreen', !entry.isIntersecting));
  heroObserver.observe(document.querySelector('.hero'));
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
}
document.addEventListener('visibilitychange', () => document.body.classList.toggle('page-hidden', document.hidden));
