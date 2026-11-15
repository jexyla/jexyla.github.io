// Password dialog for locked case studies (projects with `locked: true` in data/projects.js).
// Checks the password by decrypting the locked page's payload; on success it hands the password to that page
// (sessionStorage, same tab) and opens it already unlocked.
const STORE = 'deel-case-pass';   // the key the locked page reads (see private/deel/shell.html)
const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

async function check(url, password) {
  const html = await (await fetch(url, { cache: 'no-cache' })).text();
  const json = new DOMParser().parseFromString(html, 'text/html').getElementById('payload')?.textContent;
  if (!json) throw new Error('No payload');
  const p = JSON.parse(json);
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(p.salt), iterations: p.iterations, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(p.iv) }, key, bytes(p.ct));   // throws if the password is wrong
}

const dialog = document.getElementById('lock-dialog');
const form = document.getElementById('lock-dialog-form');
const input = document.getElementById('lock-dialog-pass');
const error = document.getElementById('lock-dialog-error');
const title = document.getElementById('lock-dialog-title');
let target = null;

export function openLockDialog(project) {
  target = project.url;
  title.textContent = project.title.replace(/:.*$/, '');   // "Engage Canvas"
  error.textContent = '';
  input.value = '';
  dialog.showModal();
  input.focus();
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const button = form.querySelector('button[type=submit]');
  button.disabled = true; error.textContent = '';
  try {
    await check(target, input.value);
    try { sessionStorage.setItem(STORE, input.value); } catch {}
    location.href = target;
  } catch {
    error.textContent = 'That password isn’t right. Please try again.';
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    input.select();
    button.disabled = false;
  }
});
dialog.querySelector('.lock-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });   // click on the backdrop
