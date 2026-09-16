/* ===========================================================================
   score.js — the bar that says how close you are to the answer
   Heather Bedle and April Moreno-Ward / University of Oklahoma

   Several modules ask the reader to find, by hand, something the arithmetic
   already knows: the widest view of a teapot, the widest direction through a
   cloud, the rotation that shows a channel, the settings that give the best
   component. Asking somebody to hunt for a number and then not showing them
   how close they are is a poor deal, so this puts the distance on screen and
   fills it in as they drag.

   The bar runs from the WORST value available to the best, not from zero.
   That matters: if it ran from zero, most of it would already be full before
   the reader touched anything and there would be nothing to chase. Scaled
   between the extremes that actually exist, the starting position on module
   00 reads 26% and there is real ground to cover.

   The percentage quoted beside the bar is a different quantity: the current
   value as a fraction of the best. That is the honest thing to report — "you
   are at 96% of the widest view" — while the bar is what makes the hunt feel
   like it is going somewhere.

   USAGE. One markup block per module:

     <div class="score" id="score">
       <span class="say" id="scoreSay">drag it around</span>
       <span class="track"><span class="fill" id="scoreFill"></span>
                           <span class="target" id="scoreTgt"></span></span>
       <span class="pct" id="scorePct">&mdash;</span>
     </div>

   and one call per redraw:

     SCORE.set({ now: v, best: b, worst: w, verb: 'drag the line around' });

   License: CC BY-SA 4.0.
   =========================================================================== */

var SCORE = (function () {
  'use strict';

  var WIN = 99;          // percent of the best that counts as having found it
  var PB = {};           // best reached so far, per module, this visit
  var TOUCHED = false;   // has the reader moved anything at all yet
  var ARMED = {};        // which invitations have already been offered
  var DRIFTING = false;  // the panel is moving itself, not being moved

  function el(id) { return document.getElementById(id); }

  /* opt.now     the value at the reader's current setting
     opt.best    the largest value available anywhere
     opt.worst   the smallest, which is where the bar starts
     opt.verb    what to say while they are still far away
     opt.won     what to say once they are there
     opt.digits  decimals on the percentage, default 1                    */
  function set(opt) {
    var box = el('score');
    if (!box) return null;
    var best = opt.best, worst = (opt.worst === undefined) ? 0 : opt.worst;
    var span = (best - worst) || 1;
    var pct = 100 * opt.now / (best || 1);
    var frac = Math.max(0, Math.min(1, (opt.now - worst) / span));
    var won = pct >= (opt.win || WIN);

    box.classList.toggle('win', won);
    var fill = el('scoreFill'), tgt = el('scoreTgt');
    var p = el('scorePct'), say = el('scoreSay');
    if (fill) fill.style.width = (frac * 100).toFixed(1) + '%';
    if (tgt) tgt.style.left = 'calc(100% - 1px)';
    if (p) p.textContent = pct.toFixed(opt.digits === undefined ? 1 : opt.digits) + '%';

    /* Best reached so far. It costs nothing and it turns a slider into
       something with a score attached, which is most of why anybody moves it
       a second time.

       Not recorded while the panel is drifting by itself. The invitation is
       supposed to say "this moves", not to play the game on the reader's
       behalf and hand them a hundred percent they did not find. */
    var key = opt.key || 'default';
    if (!DRIFTING && (!(key in PB) || pct > PB[key])) PB[key] = pct;
    var pb = (key in PB) ? PB[key] : 0;

    if (say) {
      var msg;
      if (won) msg = opt.won || 'that is the best there is';
      else if (pct >= 96) msg = 'very close \u2014 keep nudging';
      else if (pct >= 85) msg = 'better. keep going';
      else msg = opt.verb || 'keep looking';
      // once they have been closer than they are now, say so
      if (!won && pb > pct + 1.5) msg += '  \u00b7  best so far ' + pb.toFixed(0) + '%';
      if (won && opt.next) msg += '  \u00b7  ' + opt.next;
      say.textContent = msg;
    }
    return { pct: pct, frac: frac, won: won, best: pb };
  }

  /* Forget the running best, for when the thing being measured changes out
     from under it — a different attribute pair, a different target. */
  function reset(key) {
    if (key === undefined) PB = {}; else delete PB[key];
  }

  /* =====================================================================
     THE INVITATION

     A panel that sits still looks like a picture. The most reliable way to
     say "this moves" is to move it, so on arrival the control drifts by
     itself for a couple of seconds and then stops. It stops immediately and
     permanently the first time the reader touches anything, and it comes back
     once if they have been idle for a while without ever having touched it —
     because somebody who has not interacted after twenty seconds has probably
     decided the page is an article.

     `nudge(phase)` is supplied by the module and moves whatever its own
     control is: two angles for the teapot, one for a direction line, a
     parameter for a parameter hunt. Phase runs 0 to 1 across the drift.
     ===================================================================== */

  function invite(nudge, opt) {
    opt = opt || {};
    var key = opt.key || 'default';
    if (TOUCHED || ARMED[key]) return;
    ARMED[key] = true;
    var frames = opt.frames || 46, i = 0, timer = null, idleTimer = null;

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      DRIFTING = false;
    }
    function run() {
      stop();
      i = 0;
      DRIFTING = true;
      timer = setInterval(function () {
        if (TOUCHED) { stop(); return; }
        i++;
        /* The phase runs a whole cycle and the module is expected to set its
           control from a remembered base, so the drift ends exactly where it
           started. A drift that creeps would leave the reader somewhere they
           did not choose. */
        nudge(i / frames);
        if (i >= frames) { nudge(1); stop(); }
      }, 32);
    }

    /* Any real interaction anywhere ends it for good. */
    function touched() {
      TOUCHED = true;
      stop();
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    }
    ['pointerdown', 'keydown', 'wheel'].forEach(function (e) {
      document.addEventListener(e, touched, { once: true, passive: true });
    });
    document.addEventListener('input', touched, { once: true });

    setTimeout(run, opt.delay === undefined ? 700 : opt.delay);
    idleTimer = setTimeout(function () { if (!TOUCHED) run(); },
      opt.idle === undefined ? 20000 : opt.idle);
  }

  function touched() { return TOUCHED; }
  function drifting() { return DRIFTING; }

  /* Show or hide the strip. A challenge belongs on the steps that ask for one
     and nowhere else; a bar sitting on a step with nothing to find is noise. */
  function show(on) {
    var box = el('score');
    if (box) box.hidden = !on;
  }

  /* Turning a canvas into something you grab rather than something you set
     with a slider. `onMove(dx, dy, ev)` is called with the movement since the
     last event; `onPoint(x, y, ev)` with the position in canvas coordinates,
     which is what an angle-about-a-center needs. Pointer events cover mouse,
     pen and touch in one handler. */
  function drag(canvasId, handlers) {
    var c = el(canvasId);
    if (!c) return;
    var down = false, lx = 0, ly = 0;

    function pointIn(ev) {
      var b = c.getBoundingClientRect();
      return {
        x: (ev.clientX - b.left) * (c.clientWidth / b.width),
        y: (ev.clientY - b.top) * (c.clientHeight / b.height)
      };
    }

    c.addEventListener('pointerdown', function (ev) {
      down = true;
      lx = ev.clientX; ly = ev.clientY;
      try { c.setPointerCapture(ev.pointerId); } catch (e) { /* not captured */ }
      if (handlers.onPoint) { var q = pointIn(ev); handlers.onPoint(q.x, q.y, ev); }
      ev.preventDefault();
    });
    c.addEventListener('pointermove', function (ev) {
      if (!down) return;
      if (handlers.onMove) handlers.onMove(ev.clientX - lx, ev.clientY - ly, ev);
      lx = ev.clientX; ly = ev.clientY;
      if (handlers.onPoint) { var q = pointIn(ev); handlers.onPoint(q.x, q.y, ev); }
      ev.preventDefault();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (e) {
      c.addEventListener(e, function () {
        if (!down) return;
        down = false;
        if (handlers.onEnd) handlers.onEnd();
      });
    });
  }

  return { set: set, show: show, drag: drag, reset: reset,
           invite: invite, touched: touched, drifting: drifting, WIN: WIN };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SCORE;
