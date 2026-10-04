// Details-only adapter. Default sandbox never sends. Production needs approved configuration.
window.ASI_QUOTE_SUBMIT = async function (payload, files) {
  const c = window.ASI_CONFIG || {};
  if (files?.length) throw new Error('Document uploads are deferred. No files were sent.');
  if (c.quoteMode === 'sandbox') {
    return {ok: false, mode: 'sandbox', message: 'Sandbox preview only. Nothing was sent to ASI. Your draft remains in this browser.'};
  }
  if (c.quoteMode !== 'production' || !c.quoteEndpoint) throw new Error('Submission is unavailable. No delivery endpoint is configured.');
  const endpoint = new URL(c.quoteEndpoint, window.location.href);
  if (endpoint.origin !== window.location.origin || endpoint.protocol !== 'https:' || endpoint.search || endpoint.hash) throw new Error('An approved same-origin HTTPS endpoint is required.');
  const attemptKey = 'asiQuoteAttemptV1';
  const fingerprint = JSON.stringify(payload);
  let record;
  try { record = JSON.parse(window.localStorage.getItem(attemptKey) || 'null'); } catch (_) { throw new Error('Reliable browser storage is required to preserve your submission reference.'); }
  if (record && record.fingerprint !== fingerprint && record.attempted) { const error = new Error('An earlier submission has an uncertain outcome. Contact ASI before sending changed details.'); error.submissionId = record.submissionId; throw error; }
  if (!record || record.fingerprint !== fingerprint) record = {fingerprint, submissionId: window.crypto.randomUUID(), token: '', attempted: false};
  function persist() { try { window.localStorage.setItem(attemptKey, JSON.stringify(record)); } catch (_) { throw new Error('Your submission reference could not be saved. Nothing further was sent.'); } }
  persist();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const body = () => { const form = new FormData(); form.append('payload', JSON.stringify({...payload, submissionId: record.submissionId, token: record.token})); return form; };
  const post = url => fetch(url, {method: 'POST', body: body(), credentials: 'same-origin', signal: controller.signal, redirect: 'error'});
  try {
    if (!record.token) {
      if (record.attempted) throw new Error('Contact ASI with your existing submission reference before trying again.');
      const tokenResponse = await post(endpoint.href + '/token');
      if (!tokenResponse.ok) throw new Error('The inquiry could not be authorized. Your draft is retained.');
      const authorization = await tokenResponse.json();
      if (typeof authorization.token !== 'string' || !authorization.token || authorization.expiresIn !== 1800) throw new Error('Invalid inquiry authorization.');
      record.token = authorization.token;
      persist();
    }
    // Never refresh this token automatically after an attempt. Retries retain ID, token and exact fields.
    record.attempted = true;
    persist();
    const response = await post(endpoint.href);
    if (!response.ok) throw new Error('Delivery was not confirmed. Keep reference ' + record.submissionId + ' and contact ASI before starting another inquiry.');
    const data = await response.json();
    if (data.ok !== true || data.deliveryStage !== 'submitted_for_email_delivery' || typeof data.receiptId !== 'string' || !data.receiptId.trim() || data.receiptId !== record.submissionId) throw new Error('The server did not confirm email submission.');
    try { window.localStorage.removeItem(attemptKey); } catch (_) { /* Acceptance remains true even if browser cleanup fails. */ }
    return {ok: true, mode: 'production', receiptId: data.receiptId, message: 'Your inquiry was submitted for email delivery to ASI. Reference: ' + data.receiptId};
  } catch (error) {
    // Local request progress only; never trust a provider/proxy body for this distinction.
    error.deliveryAttempted = record.attempted === true;
    if (record.attempted) error.submissionId = record.submissionId;
    throw error;
  } finally { clearTimeout(timer); }
};
