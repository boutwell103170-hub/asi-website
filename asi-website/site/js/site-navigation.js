// Accessible controls layered onto the inherited Moonshot presentation.
(function () {
  document.querySelectorAll('.serviceTop').forEach((top, i) => {
    const item = top.closest('.serviceItem');
    const button = top.querySelector('.serviceToggle');
    const details = item.querySelector('.serviceBody');
    if (details) { details.id = 'service-details-' + i; button.setAttribute('aria-controls', details.id); }
    function setOpen(open) { item.classList.toggle('open', open); button.setAttribute('aria-expanded', String(open)); }
    setOpen(item.classList.contains('open'));
    top.addEventListener('click', e => { if (!e.target.closest('a')) setOpen(!item.classList.contains('open')); });
    item.addEventListener('keydown', e => { if (e.key === 'Escape') { setOpen(false); button.focus(); } });
  });
  const wrap = document.querySelector('.subnavWrap');
  if (!wrap) return;
  const trigger = wrap.querySelector('[aria-controls]');
  const menu = wrap.querySelector('.dropdown');
  function setOpen(open) { wrap.classList.toggle('open', open); trigger.setAttribute('aria-expanded', String(open)); }
  trigger.addEventListener('click', e => { e.preventDefault(); setOpen(!wrap.classList.contains('open')); });
  trigger.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); setOpen(true); menu.querySelector('a')?.focus(); }
  });
  wrap.addEventListener('mouseenter', () => setOpen(true));
  wrap.addEventListener('mouseleave', () => { if (!wrap.contains(document.activeElement)) setOpen(false); });
  wrap.addEventListener('focusout', e => { if (!wrap.contains(e.relatedTarget)) setOpen(false); });
  wrap.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.focus(); } });
})();
