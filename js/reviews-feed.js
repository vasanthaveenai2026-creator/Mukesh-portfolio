/* =========================================================
   Landing page – Audience Reviews (reads from Firestore)
   Uses the same "reviews" collection that review.js writes to.
   Email addresses are never read here (they live in
   "reviewContacts", which the public cannot access).
   ========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDKoGQD_qpWaU3cks16Eracac-Xz4-nBU",
  authDomain: "mukesh-portfolio-2c577.firebaseapp.com",
  projectId: "mukesh-portfolio-2c577",
  storageBucket: "mukesh-portfolio-2c577.firebasestorage.app",
  messagingSenderId: "271773015655",
  appId: "1:271773015655:web:4a034b93c560f99634bec2",
  measurementId: "G-24PVL3W6NL"
};

const MAX_REVIEWS = 30;

const grid = document.getElementById("reviewsGrid");
const summary = document.getElementById("reviewsSummary");
const avgEl = document.getElementById("reviewsAvg");
const avgStarsEl = document.getElementById("reviewsAvgStars");
const countEl = document.getElementById("reviewsCount");

function starsEl(rating, className) {
  const wrap = document.createElement("span");
  wrap.className = className;
  wrap.setAttribute("aria-hidden", "true");
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement("span");
    s.className = i <= Math.round(rating) ? "rv-star-on" : "rv-star-off";
    s.textContent = "★";
    wrap.appendChild(s);
  }
  return wrap;
}

function div(className, text) {
  const d = document.createElement("div");
  d.className = className;
  if (text !== undefined) d.textContent = text; // textContent: safe against HTML injection
  return d;
}

function renderCard(r) {
  const rating = Math.min(5, Math.max(1, Number(r.rating) || 0));
  const card = document.createElement("article");
  card.className = "glass-card review-card";
  card.setAttribute("aria-label", `${rating} out of 5 stars`);

  card.appendChild(starsEl(rating, "rv-stars"));
  card.appendChild(div("rv-text", r.text || ""));

  const meta = div("rv-meta");
  meta.appendChild(div("rv-name", r.name || "Guest"));
  const sub = [r.concert, r.date].filter(Boolean).join(" · ");
  if (sub) meta.appendChild(div("rv-sub", sub));
  card.appendChild(meta);
  return card;
}

function setStatus(message) {
  grid.replaceChildren();
  const p = document.createElement("p");
  p.className = "reviews-status";
  p.textContent = message;
  grid.appendChild(p);
}

async function loadReviews() {
  if (!grid) return;
  try {
    const db = getFirestore(initializeApp(firebaseConfig));
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(MAX_REVIEWS));
    const snap = await getDocs(q);

    if (snap.empty) {
      setStatus("No reviews yet. Be the first to share your experience!");
      return;
    }

    const reviews = snap.docs.map((d) => d.data());
    grid.replaceChildren(...reviews.map(renderCard));

    const avg = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length;
    avgEl.textContent = avg.toFixed(1);
    avgStarsEl.replaceChildren(...starsEl(avg, "x").children);
    countEl.textContent = `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`;
    summary.hidden = false;
  } catch (err) {
    console.error("Could not load reviews:", err);
    setStatus("Reviews can't be loaded right now. Please try again later.");
  } finally {
    // Content height changed, so recalculate scroll animation positions
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
}

loadReviews();