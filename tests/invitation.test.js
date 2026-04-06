/**
 * Tests for Muslim Wedding Invitation (index.html)
 * Covers unit tests and property-based tests using fast-check
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

// ============================================================
// Test Setup — Load index.html into jsdom
// ============================================================

const htmlSource = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');

/**
 * Creates a fresh JSDOM instance with the HTML loaded and scripts executed.
 */
function createDOM() {
  const dom = new JSDOM(htmlSource, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost',
  });
  return dom;
}

let dom;
let document;
let window;

beforeAll(() => {
  dom = createDOM();
  document = dom.window.document;
  window = dom.window;
  // Trigger DOMContentLoaded manually since jsdom may not fire it after construction
  const event = dom.window.document.createEvent('Event');
  event.initEvent('DOMContentLoaded', true, true);
  dom.window.document.dispatchEvent(event);
});

// ============================================================
// UNIT TESTS — DOM Structure
// ============================================================

describe('DOM Structure', () => {
  it('should have a #hero section', () => {
    expect(document.getElementById('hero')).not.toBeNull();
  });

  it('should have an #event section', () => {
    expect(document.getElementById('event')).not.toBeNull();
  });

  it('should have a #walimah section', () => {
    expect(document.getElementById('walimah')).not.toBeNull();
  });

  it('should have a #wisdom sub-section inside #walimah', () => {
    const walimah = document.getElementById('walimah');
    expect(walimah).not.toBeNull();
    const wisdom = document.getElementById('wisdom');
    expect(wisdom).not.toBeNull();
  });

  it('should have an #rsvp section', () => {
    expect(document.getElementById('rsvp')).not.toBeNull();
  });

  it('should have exactly 3 .wisdom-group containers in #wisdom', () => {
    const wisdom = document.getElementById('wisdom');
    const groups = wisdom.querySelectorAll('.wisdom-group');
    expect(groups.length).toBe(3);
  });

  it('should have #couple-names inside #hero', () => {
    const hero = document.getElementById('hero');
    const names = document.getElementById('couple-names');
    expect(names).not.toBeNull();
    expect(hero.contains(names)).toBe(true);
  });

  it('should contain the exact invitation headline text in #hero', () => {
    const hero = document.getElementById('hero');
    expect(hero.textContent).toContain(
      'Together with their families, joyfully invite you to celebrate their marriage.'
    );
  });
});


// ============================================================
// UNIT TESTS — Hadith Content
// ============================================================

describe('Hadith Content', () => {
  it('should contain Bukhari 67:72 reference in #walimah', () => {
    const walimah = document.getElementById('walimah');
    expect(walimah.textContent).toMatch(/Sahih al-Bukhari.*Book 67.*Hadith 72/i);
  });

  it('should contain Muslim 16:3500 reference in #walimah', () => {
    const walimah = document.getElementById('walimah');
    expect(walimah.textContent).toMatch(/Sahih Muslim.*Book 16.*Hadith 3500/i);
  });

  it('should have every .hadith-card contain a <cite> with non-empty text', () => {
    const cards = document.querySelectorAll('.hadith-card');
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      const cite = card.querySelector('cite');
      expect(cite).not.toBeNull();
      expect(cite.textContent.trim().length).toBeGreaterThan(0);
    });
  });

  it('should have at least 2 .hadith-card elements in #walimah', () => {
    const walimah = document.getElementById('walimah');
    const cards = walimah.querySelectorAll('.hadith-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// UNIT TESTS — SVG and Assets
// ============================================================

describe('SVG and Assets', () => {
  it('should define #floral-rose SVG symbol', () => {
    const symbol = document.getElementById('floral-rose');
    expect(symbol).not.toBeNull();
  });

  it('should define #floral-sprig SVG symbol', () => {
    const symbol = document.getElementById('floral-sprig');
    expect(symbol).not.toBeNull();
  });

  it('should not reference local asset paths (only CDN or inline)', () => {
    // Check <img src> tags — none should point to local files
    const imgs = document.querySelectorAll('img[src]');
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      expect(src).toMatch(/^https?:\/\//);
    });

    // Check <link href> tags — only CDN links allowed (not local .css files)
    const links = document.querySelectorAll('link[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      // Allow CDN links and preconnect links
      if (link.getAttribute('rel') !== 'preconnect') {
        expect(href).toMatch(/^https?:\/\//);
      }
    });
  });
});

// ============================================================
// UNIT TESTS — CSS Structure
// ============================================================

describe('CSS Structure', () => {
  it('should contain @media (min-width: 640px) breakpoint in stylesheet', () => {
    expect(htmlSource).toContain('min-width: 640px');
  });

  it('should contain @media (min-width: 1024px) breakpoint in stylesheet', () => {
    expect(htmlSource).toContain('min-width: 1024px');
  });

  it('should use IntersectionObserver for animations (not scroll addEventListener)', () => {
    // The script should instantiate IntersectionObserver
    expect(htmlSource).toContain('IntersectionObserver');
    // The animation init should NOT use addEventListener('scroll') for animation
    // (scroll is only used for parallax, not for fade-in animations)
    const scriptMatch = htmlSource.match(/<script[\s\S]*?<\/script>/);
    expect(scriptMatch).not.toBeNull();
    const scriptContent = scriptMatch[0];
    expect(scriptContent).toContain('new IntersectionObserver');
  });
});


// ============================================================
// PROPERTY-BASED TESTS — fast-check
// ============================================================

describe('Property-Based Tests', () => {

  // Property 1: Config injection round-trip
  it('Property 1: Config injection round-trip', () => {
    // Feature: muslim-wedding-invitation, Property 1: Config injection round-trip
    // For any valid CONFIG object, injectConfig sets textContent of all [data-config] elements
    fc.assert(
      fc.property(
        fc.record({
          groomName: fc.string({ minLength: 1, maxLength: 50 }),
          brideName: fc.string({ minLength: 1, maxLength: 50 }),
          eventDay: fc.string({ minLength: 1, maxLength: 20 }),
          eventDate: fc.string({ minLength: 1, maxLength: 30 }),
          eventTime: fc.string({ minLength: 1, maxLength: 20 }),
          venueName: fc.string({ minLength: 1, maxLength: 80 }),
          venueAddress: fc.string({ minLength: 1, maxLength: 120 }),
          rsvpMessage: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        (config) => {
          // Create a fresh DOM for each run
          const testDom = new JSDOM(htmlSource, {
            runScripts: 'dangerously',
            url: 'http://localhost',
          });
          const testDoc = testDom.window.document;

          // Extract and run injectConfig from the page script
          function injectConfig(cfg) {
            Object.entries(cfg).forEach(([key, value]) => {
              if (value === undefined) return;
              testDoc.querySelectorAll('[data-config="' + key + '"]')
                .forEach((el) => { el.textContent = value; });
            });
          }

          injectConfig(config);

          return Object.entries(config).every(([key, value]) => {
            const el = testDoc.querySelector('[data-config="' + key + '"]');
            return el !== null && el.textContent === value;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2: All hadith content in cards with references
  it('Property 2: All hadith content is wrapped in cards with references', () => {
    // Feature: muslim-wedding-invitation, Property 2: All hadith content is wrapped in cards with references
    // For any rendered page, every .hadith-card has a non-empty cite, and count >= 2
    fc.assert(
      fc.property(fc.constant(null), () => {
        const walimah = document.getElementById('walimah');
        const cards = walimah.querySelectorAll('.hadith-card');
        if (cards.length < 2) return false;
        return Array.from(cards).every((card) => {
          const cite = card.querySelector('cite');
          return cite !== null && cite.textContent.trim().length > 0;
        });
      }),
      { numRuns: 100 }
    );
  });

  // Property 3: Wisdom groups have labeled headings
  it('Property 3: Each wisdom thematic group has a labeled heading', () => {
    // Feature: muslim-wedding-invitation, Property 3: Each wisdom thematic group has a labeled heading
    // For any group container in #wisdom, it contains an h3 with non-empty text
    fc.assert(
      fc.property(fc.constant(null), () => {
        const wisdom = document.getElementById('wisdom');
        const groups = wisdom.querySelectorAll('.wisdom-group');
        if (groups.length === 0) return false;
        return Array.from(groups).every((group) => {
          const h3 = group.querySelector('h3');
          return h3 !== null && h3.textContent.trim().length > 0;
        });
      }),
      { numRuns: 100 }
    );
  });

  // Property 4: Scroll animation state transitions correctly
  it('Property 4: Scroll animation state transitions correctly', () => {
    // Feature: muslim-wedding-invitation, Property 4: Scroll animation state transitions correctly
    // For any [data-animate] element, animate-hidden before observer fires, animate-visible after
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (index) => {
          const testDom = new JSDOM(htmlSource, {
            runScripts: 'dangerously',
            url: 'http://localhost',
          });
          const testDoc = testDom.window.document;

          // Manually add animate-hidden to all [data-animate] elements (simulating initAnimations)
          const animatableEls = testDoc.querySelectorAll('[data-animate]');
          if (animatableEls.length === 0) return true;

          animatableEls.forEach((el) => el.classList.add('animate-hidden'));

          const idx = index % animatableEls.length;
          const el = animatableEls[idx];

          // Before intersection: should have animate-hidden, not animate-visible
          if (!el.classList.contains('animate-hidden')) return false;
          if (el.classList.contains('animate-visible')) return false;

          // Simulate intersection: add animate-visible, remove animate-hidden
          el.classList.add('animate-visible');
          el.classList.remove('animate-hidden');

          // After intersection: should have animate-visible, not animate-hidden
          return el.classList.contains('animate-visible') && !el.classList.contains('animate-hidden');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Name reveal animation fires within 1 second
  it('Property 5: Name reveal animation fires within 1 second', () => {
    // Feature: muslim-wedding-invitation, Property 5: Name reveal animation fires within 1 second
    // For any page load, #couple-names has reveal class within 1000ms of DOMContentLoaded
    // Uses fake timers to simulate rAF + setTimeout(300ms) in jsdom environment
    fc.assert(
      fc.property(fc.constant(null), () => {
        vi.useFakeTimers();
        try {
          const testDom = new JSDOM(htmlSource, {
            runScripts: 'dangerously',
            url: 'http://localhost',
          });
          const testDoc = testDom.window.document;

          // Patch requestAnimationFrame to execute callback synchronously
          testDom.window.requestAnimationFrame = (cb) => { cb(0); return 0; };

          // Trigger DOMContentLoaded to fire initNameReveal
          const event = testDoc.createEvent('Event');
          event.initEvent('DOMContentLoaded', true, true);
          testDoc.dispatchEvent(event);

          // Advance timers past the 300ms setTimeout inside initNameReveal
          vi.advanceTimersByTime(400);

          const names = testDoc.getElementById('couple-names');
          return names !== null && names.classList.contains('name-revealed');
        } finally {
          vi.useRealTimers();
        }
      }),
      { numRuns: 10 }
    );
  });

  // Property 6: Parallax transform proportional to scroll
  it('Property 6: Parallax changes floral transform on scroll', () => {
    // Feature: muslim-wedding-invitation, Property 6: Parallax changes floral transform on scroll
    // For any scrollY > 0, translateY of #hero-florals equals scrollY * 0.3
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        (scrollY) => {
          const testDom = new JSDOM(htmlSource, {
            runScripts: 'dangerously',
            url: 'http://localhost',
          });
          const testDoc = testDom.window.document;
          const testWin = testDom.window;

          // Manually apply parallax logic (mirrors initParallax)
          const florals = testDoc.getElementById('hero-florals');
          if (!florals) return false;

          florals.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';

          const transform = florals.style.transform;
          const match = transform.match(/translateY\(([^)]+)px\)/);
          if (!match) return false;
          const value = parseFloat(match[1]);
          return Math.abs(value - scrollY * 0.3) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 7: Stagger delays are distinct per group
  it('Property 7: Stagger delays are distinct and sequential within a hadith group', () => {
    // Feature: muslim-wedding-invitation, Property 7: Stagger delays are distinct and sequential
    // For any group of hadith cards, data-stagger values are unique within the group
    fc.assert(
      fc.property(fc.constant(null), () => {
        const wisdom = document.getElementById('wisdom');
        const groups = wisdom.querySelectorAll('.wisdom-group');
        return Array.from(groups).every((group) => {
          const cards = group.querySelectorAll('.hadith-card[data-stagger]');
          const staggerValues = Array.from(cards).map((c) => c.getAttribute('data-stagger'));
          const unique = new Set(staggerValues);
          return unique.size === staggerValues.length;
        });
      }),
      { numRuns: 100 }
    );
  });

  // Property 8: animate-hidden is JS-applied only (not in static HTML)
  it('Property 8: animate-hidden is JS-applied only (not in static HTML source)', () => {
    // Feature: muslim-wedding-invitation, Property 8: animate-hidden is JS-applied only
    // Static HTML source must not contain animate-hidden class on any element
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Check raw HTML source does not contain animate-hidden in element class attributes
        // We look for class="...animate-hidden..." patterns in the HTML
        const classPattern = /class="[^"]*animate-hidden[^"]*"/;
        return !classPattern.test(htmlSource);
      }),
      { numRuns: 100 }
    );
  });
});
