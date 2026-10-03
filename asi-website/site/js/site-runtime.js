(function () {
  const c = window.ASI_CONFIG || {};

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(el => {
      if (value !== undefined && value !== null) el.textContent = value;
    });
  }

  setText("[data-asi-company]", c.companyName);
  setText("[data-asi-phone]", c.phoneDisplay);
  setText("[data-asi-email]", c.email);
  setText("[data-asi-service-area]", c.serviceArea);
  setText("[data-asi-credential-summary]", c.credentialSummary);

  document.querySelectorAll("[data-asi-phone-link]").forEach(el => {
    el.textContent = c.phoneDisplay || "[BUSINESS PHONE]";
    if (c.phoneHref) el.setAttribute("href", c.phoneHref);
    else el.removeAttribute("href");
  });

  document.querySelectorAll("[data-asi-email-link]").forEach(el => {
    el.textContent = c.email || "[BUSINESS EMAIL]";
    if (c.email && !c.email.startsWith("[")) el.setAttribute("href", "mailto:" + c.email);
    else el.removeAttribute("href");
  });

  // Config is text, never HTML. Preserve inherited structure and class names.
  function fill(container, rows, className, fields) {
    container.replaceChildren();
    rows.forEach(row => {
      const item = document.createElement('div'); item.className = className;
      fields.forEach(([tag, key]) => { const el = document.createElement(tag); el.textContent = row[key] || ''; item.appendChild(el); });
      container.appendChild(item);
    });
  }
  document.querySelectorAll('[data-credential-list]').forEach(el => fill(el, Array.isArray(c.credentials) ? c.credentials : [], 'configCredential', [['small','label'],['b','value']]));
  document.querySelectorAll('[data-proof-points]').forEach(el => fill(el, Array.isArray(c.proofPoints) ? c.proofPoints : [], 'metric', [['strong','value'],['b','label'],['span','detail']]));

  // Lightweight analytics hooks, disabled unless configured.
  if (c.analytics && c.analytics.plausibleDomain) {
    const s = document.createElement("script");
    s.defer = true;
    s.dataset.domain = c.analytics.plausibleDomain;
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }
})();