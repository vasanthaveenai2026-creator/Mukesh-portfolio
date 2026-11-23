/* =========================================================
   Mukesh – Write a Review (Firestore Cloud Storage)
   - Star rating + validated form
   - Saves each review to Firestore ("reviews" collection)
   - Email (optional) goes to a separate private collection
     ("reviewContacts") that the public can never read
   ========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

/* ---------------- FIREBASE CONFIG (paste yours) ----------------
   Firebase console → Project settings → Your apps → Web app → firebaseConfig */
const firebaseConfig = {
  apiKey: "AIzaSyBDKoGQD_qpWaU3cks16Eracac-Xz4-nBU",
  authDomain: "mukesh-portfolio-2c577.firebaseapp.com",
  projectId: "mukesh-portfolio-2c577",
  storageBucket: "mukesh-portfolio-2c577.firebasestorage.app",
  messagingSenderId: "271773015655",
  appId: "1:271773015655:web:4a034b93c560f99634bec2",
  measurementId: "G-24PVL3W6NL"
};

const db = getFirestore(initializeApp(firebaseConfig));

(() => {
  'use strict';

  /* ---------------- CONFIG ---------------- */
  const CONFIG = {
    CONCERTS: [
      'Live in Concert – Latest Show',
      'Acoustic Evening',
      'Charity Concert',
      'College / Festival Performance',
      'Other'
    ],
    MIN_TEXT: 20,
    MAX_TEXT: 600,
    COOLDOWN_MS: 30 * 1000,
    COOLDOWN_KEY: 'mukesh_last_submit_v1'
  };

  const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  /* ---------------- Helpers ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    }
  };

  const clean = (str, max) =>
    String(str ?? '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .trim()
      .slice(0, max);

  /* ---------------- DOM ---------------- */
  const els = {
    form: $('#reviewForm'),
    name: $('#name'),
    email: $('#email'),
    concert: $('#concert'),
    text: $('#text'),
    website: $('#website'),
    submitBtn: $('#submitBtn'),
    charCount: $('#charCount'),
    charMax: $('#charMax'),
    ratingText: $('#ratingText'),
    ratingError: $('#ratingError'),
    success: $('#success'),
    successTitle: $('#successTitle'),
    successStars: $('#successStars'),
    another: $('#anotherBtn'),
    toast: $('#toast'),
    year: $('#year')
  };

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(message, type = 'success') {
    els.toast.textContent = message;
    els.toast.classList.toggle('error', type === 'error');
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 3500);
  }

  /* ---------------- Validation ---------------- */
  function setError(field, message) {
    const wrap = field.closest('.field');
    const err = $(`#${field.name || field.id}Error`);
    wrap?.classList.toggle('invalid', !!message);
    if (err) err.textContent = message || '';
  }

  function validate() {
    let valid = true;
    let firstInvalid = null;
    const fail = (el, msg) => { setError(el, msg); valid = false; firstInvalid ||= el; };

    const rating = els.form.querySelector('input[name="rating"]:checked');
    if (!rating) {
      els.ratingError.textContent = 'Please select a star rating.';
      valid = false;
      firstInvalid ||= $('#star5');
    } else {
      els.ratingError.textContent = '';
    }

    const name = clean(els.name.value, 50);
    if (name.length < 2) fail(els.name, 'Please enter your name (min 2 characters).');
    else setError(els.name, '');

    if (!els.concert.value) fail(els.concert, 'Please choose the concert you attended.');
    else setError(els.concert, '');

    const email = els.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail(els.email, 'Please enter a valid email address.');
    else setError(els.email, '');

    const text = clean(els.text.value, CONFIG.MAX_TEXT);
    if (text.length < CONFIG.MIN_TEXT) fail(els.text, `Please write at least ${CONFIG.MIN_TEXT} characters.`);
    else setError(els.text, '');

    firstInvalid?.focus();

    return valid
      ? { rating: +rating.value, name, concert: els.concert.value, email, text }
      : null;
  }

  /* ---------------- Sending (Firestore) ---------------- */
  async function sendReview(data) {
    const now = new Date();

    // Public review (this is what the home page will display)
    const review = {
      name: data.name,
      concert: data.concert,
      rating: data.rating,
      text: data.text,
      date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: now.toISOString()
    };

    try {
      // Success is reported only after Firestore confirms the write
      await addDoc(collection(db, 'reviews'), review);

      // Email is kept in a separate collection nobody can read publicly
      if (data.email) {
        try {
          await addDoc(collection(db, 'reviewContacts'), {
            email: data.email,
            createdAt: review.createdAt
          });
        } catch (err) {
          console.warn('Could not save contact email:', err);
        }
      }
      return true;
    } catch (err) {
      console.error('Error saving review to Firestore:', err);
      return false;
    }
  }

  /* ---------------- Submit ---------------- */
  async function onSubmit(e) {
    e.preventDefault();

    // Honeypot – silently ignore bots
    if (els.website.value) return;

    // Cooldown
    const last = +store.get(CONFIG.COOLDOWN_KEY, 0);
    const wait = CONFIG.COOLDOWN_MS - (Date.now() - last);
    if (wait > 0) {
      toast(`Please wait ${Math.ceil(wait / 1000)}s before posting another review.`, 'error');
      return;
    }

    const data = validate();
    if (!data) return;

    els.submitBtn.disabled = true;
    els.submitBtn.textContent = 'Submitting…';

    const ok = await sendReview(data);

    els.submitBtn.disabled = false;
    els.submitBtn.textContent = 'Submit review';

    if (!ok) {
      toast('Failed to submit review. Please check your connection and try again.', 'error');
      return;
    }

    store.set(CONFIG.COOLDOWN_KEY, Date.now());
    showSuccess(data.rating);
  }

  /* ---------------- Success / reset ---------------- */
  function showSuccess(rating) {
    els.successStars.replaceChildren(
      ...[1, 2, 3, 4, 5].map(i => {
        const s = document.createElement('span');
        s.className = i <= rating ? 'on' : 'off';
        s.textContent = '★';
        return s;
      })
    );
    els.form.hidden = true;
    $('.form-title').hidden = true;
    els.success.hidden = false;
    els.successTitle.focus();
    resetForm();
  }

  function showForm() {
    els.success.hidden = true;
    els.form.hidden = false;
    $('.form-title').hidden = false;
    $('#star5').focus();
  }

  function resetForm() {
    els.form.reset();
    els.charCount.textContent = '0';
    updateRatingText();
    $$('.field.invalid').forEach(f => f.classList.remove('invalid'));
    $$('.error').forEach(e => (e.textContent = ''));
  }

  /* ---------------- UI wiring ---------------- */
  function updateRatingText() {
    const checked = els.form.querySelector('input[name="rating"]:checked');
    const value = checked ? +checked.value : 0;
    els.ratingText.textContent = value ? `${value}/5 – ${RATING_LABELS[value]}` : 'Select a rating';
    els.ratingText.classList.toggle('active', !!value);
  }

  function init() {
    els.year.textContent = new Date().getFullYear();
    els.charMax.textContent = CONFIG.MAX_TEXT;
    els.text.maxLength = CONFIG.MAX_TEXT;

    CONFIG.CONCERTS.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      els.concert.appendChild(opt);
    });

    els.form.addEventListener('submit', onSubmit);
    els.another.addEventListener('click', showForm);

    $$('input[name="rating"]').forEach(r =>
      r.addEventListener('change', () => {
        updateRatingText();
        els.ratingError.textContent = '';
      })
    );

    els.text.addEventListener('input', () => {
      els.charCount.textContent = els.text.value.length;
      if (els.text.value.trim().length >= CONFIG.MIN_TEXT) setError(els.text, '');
    });

    [els.name, els.concert, els.email].forEach(el =>
      el.addEventListener('input', () => setError(el, ''))
    );

    updateRatingText();
  }

  // Module scripts are deferred, so the DOM may already be ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();