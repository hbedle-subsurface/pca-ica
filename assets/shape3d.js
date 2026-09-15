/* ===========================================================================
   shape3d.js — a teapot, built from equations, as a cloud of points
   Heather Bedle and April Moreno-Ward / University of Oklahoma

   Module 00 needs an object that everybody recognizes from some directions and
   not from others. A teapot is the standard one in computer graphics for
   exactly that reason: it has a body, a lid, a spout and a handle, and no two
   of those four are visible together from any axis view.

   The point of putting it in a teaching set on dimension reduction is that
   choosing a view IS a projection. A viewing direction is three numbers, the
   picture on screen is what is left after projecting a three-dimensional
   object onto a two-dimensional plane, and the view that shows the most of the
   object is almost never along one of the axes. That is principal component
   analysis, on an object the reader can already see.

   Nothing here is a stored model. The surfaces are surfaces of revolution and
   swept tubes evaluated from their own equations, so the teapot can be
   restated at any point density and the arithmetic behind the projection is
   visible in the same file.

   License: CC BY-SA 4.0.
   =========================================================================== */

var SHAPE = (function () {
  'use strict';

  /* Deterministic jitter, so the cloud looks like a sampled surface rather
     than a wireframe, and looks the same every time the page opens. */
  function lcg(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* The body profile: radius as a function of height, from the foot of the pot
     to the rim. A cubic-ish bulge, pinched at the base and the neck. */
  function bodyRadius(u) {
    // u from 0 at the base to 1 at the rim
    return 0.42 + 0.52 * Math.sin(Math.PI * (0.12 + 0.80 * u)) - 0.22 * u * u;
  }

  /* The spout centerline, from the shoulder of the body outward and upward. */
  function spoutPath(t) {
    return {
      x: 0.62 + 1.05 * t + 0.20 * t * t,
      y: 0,
      z: 0.34 + 0.78 * t * t - 0.10 * t
    };
  }
  function spoutRadius(t) { return 0.26 - 0.15 * t; }

  /* The handle: a curve whose two ends sit on the body surface, so that it
     reads as attached rather than floating beside the pot. The endpoints are
     taken from the body profile itself at two heights, and the curve bulges
     outward between them as a quadratic Bezier. Drawn in the plane opposite
     the spout. */
  var H_TOP = 0.88, H_BOT = 0.18;              // where it meets the body
  function handleEnds() {
    return {
      top: { x: -bodyRadius(H_TOP) * 0.94, z: 0.10 + 1.18 * H_TOP },
      bot: { x: -bodyRadius(H_BOT) * 0.94, z: 0.10 + 1.18 * H_BOT }
    };
  }
  function handlePath(t) {
    var e = handleEnds();
    var cx = -1.95, cz = 0.5 * (e.top.z + e.bot.z);   // control point, well outboard
    var u = 1 - t;
    return {
      x: u * u * e.top.x + 2 * u * t * cx + t * t * e.bot.x,
      y: 0,
      z: u * u * e.top.z + 2 * u * t * cz + t * t * e.bot.z
    };
  }
  /* Thicker in the middle of the span and thinner where it joins the pot, so
     the junction does not read as a butt weld. */
  function handleRadius(t) { return 0.075 + 0.055 * Math.sin(Math.PI * t); }

  /* A ring of points around a path point, in the plane perpendicular to the
     path's local direction. */
  function tube(pts, path, radius, nAlong, nAround, rnd, tag) {
    var i, j;
    for (i = 0; i < nAlong; i++) {
      var t = i / (nAlong - 1);
      var p = path(t);
      var q = path(Math.min(1, t + 0.01));
      var dx = q.x - p.x, dz = q.z - p.z;
      var len = Math.hypot(dx, dz) || 1;
      // perpendicular in the x-z plane, and the y axis is already perpendicular
      var px = -dz / len, pz = dx / len;
      var r = radius(t);
      for (j = 0; j < nAround; j++) {
        var a = 2 * Math.PI * (j + 0.5 * (i % 2)) / nAround;
        var ca = Math.cos(a), sa = Math.sin(a);
        var jr = r * (1 + 0.02 * (rnd() - 0.5));
        pts.push({
          x: p.x + jr * ca * px,
          y: p.y + jr * sa,
          z: p.z + jr * ca * pz,
          nx: ca * px, ny: sa, nz: ca * pz,
          part: tag, pat: 0
        });
      }
    }
  }

  /* =====================================================================
     BUILD

     opt.density scales the number of points. The default gives a cloud that
     draws in a few milliseconds and still reads as a teapot at 300 pixels.
     ===================================================================== */

  function teapot(opt) {
    opt = opt || {};
    var d = opt.density || 1;
    var rnd = lcg(opt.seed || 90210);
    var pts = [], i, j;

    // body: a surface of revolution about the vertical axis
    var nu = Math.round(34 * d), nv = Math.round(46 * d);
    for (i = 0; i < nu; i++) {
      var u = i / (nu - 1);
      var r = bodyRadius(u);
      var z = 0.10 + 1.18 * u;
      /* Outward normal of a surface of revolution: radial, tilted by how fast
         the radius is changing with height. Needed so that points on the far
         side can be dropped rather than drawn through the pot. */
      var dr = (bodyRadius(Math.min(1, u + 0.01)) - bodyRadius(Math.max(0, u - 0.01)));
      var dz = 1.18 * (Math.min(1, u + 0.01) - Math.max(0, u - 0.01));
      var slope = dr / (dz || 1);
      for (j = 0; j < nv; j++) {
        var a = 2 * Math.PI * (j + 0.5 * (i % 2)) / nv;
        var jr = r * (1 + 0.015 * (rnd() - 0.5));
        var nL = Math.hypot(1, slope) || 1;
        /* Two different markings on the two sides of the pot, so that turning
           it changes which pattern you are looking at and a student can see
           directly that one side has gone. Bands on one side, stripes on the
           other. */
        /* Two markings that cannot be confused with each other from any
           distance: round spots on one half, vertical stripes on the other.
           Bands and stripes were too alike once the pot was turned. */
        var side = Math.cos(a) >= 0 ? 0 : 1;
        var pat = side === 0
          ? (Math.cos(a * 4.5) * Math.cos((z - 0.1) * 7.5) > 0.30 ? 1 : 0)   // spots
          : (Math.sin(a * 7) > 0.15 ? 1 : 0);                                // stripes
        pts.push({
          x: jr * Math.cos(a), y: jr * Math.sin(a), z: z,
          nx: Math.cos(a) / nL, ny: Math.sin(a) / nL, nz: -slope / nL,
          part: 'body', side: side, pat: pat
        });
      }
    }

    // lid: a shallow dome sitting on the rim, plus a knob
    var nl = Math.round(12 * d);
    for (i = 0; i < nl; i++) {
      var ul = i / (nl - 1);
      var rl = bodyRadius(1) * Math.cos(ul * Math.PI / 2.35);
      var zl = 1.28 + 0.24 * Math.sin(ul * Math.PI / 2.1);
      for (j = 0; j < nv; j++) {
        var al = 2 * Math.PI * j / nv;
        // a dome: the normal leans outward at the rim and upward at the top
        var lean = Math.cos(ul * Math.PI / 2.35);
        // named dnorm, not nl: nl is the dome's point count in the loop above
        var dnorm = Math.hypot(lean, 1 - lean + 0.35) || 1;
        pts.push({ x: rl * Math.cos(al), y: rl * Math.sin(al), z: zl,
          nx: lean * Math.cos(al) / dnorm, ny: lean * Math.sin(al) / dnorm,
          nz: (1 - lean + 0.35) / dnorm, part: 'lid', pat: 0 });
      }
    }
    var nk = Math.round(8 * d);
    for (i = 0; i < nk; i++) {
      var uk = i / (nk - 1);
      var rk = 0.16 * Math.sin(Math.PI * (0.25 + 0.7 * uk));
      for (j = 0; j < Math.round(14 * d); j++) {
        var ak = 2 * Math.PI * j / Math.round(14 * d);
        pts.push({ x: rk * Math.cos(ak), y: rk * Math.sin(ak),
                   z: 1.50 + 0.22 * uk,
                   nx: Math.cos(ak) * 0.7, ny: Math.sin(ak) * 0.7, nz: 0.7,
                   part: 'lid', pat: 0 });
      }
    }

    // base: a flat foot, so the pot does not look open underneath
    var nb = Math.round(7 * d);
    for (i = 0; i < nb; i++) {
      var rb = bodyRadius(0) * i / (nb - 1);
      var around = Math.max(6, Math.round(nv * i / (nb - 1)));
      for (j = 0; j < around; j++) {
        var ab = 2 * Math.PI * j / around;
        pts.push({ x: rb * Math.cos(ab), y: rb * Math.sin(ab), z: 0.10,
                   nx: 0, ny: 0, nz: -1, part: 'body', side: 2, pat: 0 });
      }
    }

    tube(pts, spoutPath, spoutRadius, Math.round(22 * d), Math.round(16 * d), rnd, 'spout');
    tube(pts, handlePath, handleRadius, Math.round(30 * d), Math.round(14 * d), rnd, 'handle');

    /* Tilt the whole teapot inside the coordinate system.

       Without this the pot's own structure lines up with the axes it is
       described in: the spout and handle lie in the x-z plane, so the plane of
       greatest spread IS the x-z plane and the best view turns out to be the
       side view exactly. That would teach the wrong thing. A set of seismic
       attributes is an arbitrary coordinate system too — nothing arranged
       coherence and peak frequency to line up with the geology — so the
       teapot is tilted into a general orientation and none of the three axis
       views is the good one. The rotation is fixed and is applied here rather
       than to the view, so the object really is oblique in the space rather
       than being looked at obliquely. */
    var TILT = opt.tilt === undefined ? [34, 27, 19] : opt.tilt;
    (function () {
      var rz = TILT[0] * Math.PI / 180, rx = TILT[1] * Math.PI / 180,
          ry = TILT[2] * Math.PI / 180, q;
      function turn(o, kx, ky, kz) {
        var c, s, X, Y, Z;
        c = Math.cos(rz); s = Math.sin(rz);
        X = o[kx] * c - o[ky] * s; Y = o[kx] * s + o[ky] * c; o[kx] = X; o[ky] = Y;
        c = Math.cos(rx); s = Math.sin(rx);
        Y = o[ky] * c - o[kz] * s; Z = o[ky] * s + o[kz] * c; o[ky] = Y; o[kz] = Z;
        c = Math.cos(ry); s = Math.sin(ry);
        Z = o[kz] * c - o[kx] * s; X = o[kz] * s + o[kx] * c; o[kz] = Z; o[kx] = X;
      }
      for (q = 0; q < pts.length; q++) {
        turn(pts[q], 'x', 'y', 'z');
        turn(pts[q], 'nx', 'ny', 'nz');
      }
    })();

    // center the cloud on its own mean, which is where every projection in
    // the module is taken from
    var n = pts.length, mx = 0, my = 0, mz = 0;
    for (i = 0; i < n; i++) { mx += pts[i].x; my += pts[i].y; mz += pts[i].z; }
    mx /= n; my /= n; mz /= n;
    for (i = 0; i < n; i++) { pts[i].x -= mx; pts[i].y -= my; pts[i].z -= mz; }

    return pts;
  }


  /* =====================================================================
     AN AEROPLANE

     Replaces the teapot. Same job, done better: the three extents are clearly
     ordered and clearly different (wingspan, then length, then height), every
     axis view loses something a reader can name, and the view that shows the
     most is the three-quarter view everybody has seen on a departures board.

     Built from equations like everything else here. The fuselage is a surface
     of revolution about the long axis; the wings, tailplane and fin are thin
     slabs sampled on both faces; the engines are short tubes. Every point
     carries the outward normal of the surface it sits on, so the far side can
     be dropped and the thing drawn solid.
     ===================================================================== */

  function fuseRadius(u) {
    // u runs 0 at the tail to 1 at the nose; tapered at both ends
    var s = Math.max(0.001, Math.min(0.999, 0.06 + 0.90 * u));
    return 0.30 * Math.pow(Math.sin(Math.PI * s), 0.55);
  }

  /* A flat slab: a wing, a tailplane or a fin. Sampled on its two faces so
     that the normals point in opposite directions and one face is always
     hidden. `axis` is 'z' for a horizontal surface and 'y' for a vertical
     one. */
  function slab(pts, opt, d, rnd) {
    var nS = Math.max(4, Math.round(opt.nSpan * d));
    var nC = Math.max(3, Math.round(opt.nChord * d));
    var i, j, f;
    for (i = 0; i < nS; i++) {
      var ts = i / (nS - 1);
      var s = opt.root + (opt.tip - opt.root) * ts;         // along the span
      var chord = opt.chordRoot + (opt.chordTip - opt.chordRoot) * ts;
      var lead = opt.leadRoot + (opt.leadTip - opt.leadRoot) * ts;
      var rise = opt.riseRoot + (opt.riseTip - opt.riseRoot) * ts;
      for (j = 0; j < nC; j++) {
        var tc = j / (nC - 1);
        var x = lead - chord * tc;
        var jit = 1 + 0.01 * (rnd() - 0.5);
        for (f = -1; f <= 1; f += 2) {
          var half = opt.thick * 0.5 * Math.sin(Math.PI * Math.max(0.05, Math.min(0.95, tc)));
          var pt = { part: opt.part, pat: 0, side: opt.side === undefined ? 2 : opt.side };
          if (opt.axis === 'y') {           // a vertical surface: the fin
            pt.x = x * jit; pt.y = f * half; pt.z = rise + s;
            pt.nx = 0; pt.ny = f; pt.nz = 0;
          } else {                          // a horizontal surface
            pt.x = x * jit; pt.y = opt.mirror * s; pt.z = rise + f * half;
            pt.nx = 0; pt.ny = 0; pt.nz = f;
          }
          if (opt.mark) pt.pat = opt.mark(s, tc);
          pts.push(pt);
        }
      }
    }
  }

  function plane(opt) {
    opt = opt || {};
    var d = opt.density || 1;
    var rnd = lcg(opt.seed || 4321);
    var pts = [], i, j;

    /* fuselage */
    var nL = Math.round(46 * d), nA = Math.round(22 * d);
    for (i = 0; i < nL; i++) {
      var u = i / (nL - 1);
      var x = -1.45 + 3.05 * u;
      var r = fuseRadius(u);
      var dr = fuseRadius(Math.min(1, u + 0.01)) - fuseRadius(Math.max(0, u - 0.01));
      var slope = dr / (3.05 * 0.02);
      var nrm = Math.hypot(1, slope) || 1;
      for (j = 0; j < nA; j++) {
        var a = 2 * Math.PI * (j + 0.5 * (i % 2)) / nA;
        var jr = r * (1 + 0.012 * (rnd() - 0.5));
        /* Two markings, one per side of the aircraft, so that turning it
           swaps which one you can see. Spots to port, stripes to starboard. */
        var side = Math.sin(a) >= 0 ? 0 : 1;
        var pat = side === 0
          ? (Math.cos(a * 5) * Math.cos(x * 6.5) > 0.32 ? 1 : 0)
          : (Math.sin(x * 7.5) > 0.15 ? 1 : 0);
        pts.push({
          x: x, y: jr * Math.cos(a), z: jr * Math.sin(a),
          nx: -slope / nrm, ny: Math.cos(a) / nrm, nz: Math.sin(a) / nrm,
          part: 'fuselage', side: side, pat: pat
        });
      }
    }

    /* wings, one each side, swept and with a little dihedral */
    [1, -1].forEach(function (m) {
      slab(pts, {
        part: 'wing', axis: 'z', mirror: m,
        root: 0.24, tip: 2.30, nSpan: 30, nChord: 13,
        chordRoot: 1.15, chordTip: 0.40,
        leadRoot: 0.62, leadTip: -0.30,
        riseRoot: -0.02, riseTip: 0.16, thick: 0.10,
        side: m > 0 ? 0 : 1,
        /* One wing banded across the span, the other spotted. In a plan view
           the two are impossible to confuse, so a reader can see directly
           which half of the aircraft a given view has kept. */
        mark: m > 0
          ? function (s, tc) { return Math.sin(s * 4.4) > 0.05 ? 1 : 0; }
          : function (s, tc) {
              return Math.cos(s * 6.5) * Math.cos((tc - 0.5) * 5.0) > 0.42 ? 1 : 0;
            }
      }, d, rnd);
    });

    /* tailplane */
    [1, -1].forEach(function (m) {
      slab(pts, {
        part: 'tail', axis: 'z', mirror: m,
        root: 0.16, tip: 0.92, nSpan: 12, nChord: 6,
        chordRoot: 0.52, chordTip: 0.24,
        leadRoot: -0.92, leadTip: -1.16,
        riseRoot: 0.10, riseTip: 0.14, thick: 0.07
      }, d, rnd);
    });

    /* fin */
    slab(pts, {
      part: 'fin', axis: 'y', mirror: 1,
      root: 0.12, tip: 0.98, nSpan: 16, nChord: 8,
      chordRoot: 0.72, chordTip: 0.34,
      leadRoot: -0.72, leadTip: -1.06,
      riseRoot: 0.14, riseTip: 0.14, thick: 0.08
    }, d, rnd);

    /* two engines, slung under the wings */
    [1, -1].forEach(function (m) {
      var nE = Math.round(12 * d), nR = Math.round(14 * d);
      for (i = 0; i < nE; i++) {
        var te = i / (nE - 1);
        var ex = 0.42 - 0.62 * te;
        for (j = 0; j < nR; j++) {
          var ae = 2 * Math.PI * j / nR;
          pts.push({
            x: ex, y: m * 1.02 + 0.17 * Math.cos(ae), z: -0.16 + 0.17 * Math.sin(ae),
            nx: 0, ny: Math.cos(ae), nz: Math.sin(ae),
            part: 'engine', side: m > 0 ? 0 : 1, pat: 0
          });
        }
      }
    });

    /* Tilt it inside the coordinate system, for the same reason the teapot
       was tilted: an object lined up with its own axes would make the best
       view come out as an axis view, and attribute spaces are never lined up
       with anything. */
    var TILT = opt.tilt === undefined ? [28, 22, 15] : opt.tilt;
    (function () {
      var rz = TILT[0] * Math.PI / 180, rx = TILT[1] * Math.PI / 180,
          ry = TILT[2] * Math.PI / 180, q;
      function turn(o, kx, ky, kz) {
        var c, s, X, Y, Z;
        c = Math.cos(rz); s = Math.sin(rz);
        X = o[kx] * c - o[ky] * s; Y = o[kx] * s + o[ky] * c; o[kx] = X; o[ky] = Y;
        c = Math.cos(rx); s = Math.sin(rx);
        Y = o[ky] * c - o[kz] * s; Z = o[ky] * s + o[kz] * c; o[ky] = Y; o[kz] = Z;
        c = Math.cos(ry); s = Math.sin(ry);
        Z = o[kz] * c - o[kx] * s; X = o[kz] * s + o[kx] * c; o[kz] = Z; o[kx] = X;
      }
      for (q = 0; q < pts.length; q++) {
        turn(pts[q], 'x', 'y', 'z');
        turn(pts[q], 'nx', 'ny', 'nz');
      }
    })();

    var n = pts.length, mx = 0, my = 0, mz = 0;
    for (i = 0; i < n; i++) { mx += pts[i].x; my += pts[i].y; mz += pts[i].z; }
    mx /= n; my /= n; mz /= n;
    for (i = 0; i < n; i++) { pts[i].x -= mx; pts[i].y -= my; pts[i].z -= mz; }
    return pts;
  }

  /* =====================================================================
     VIEWING

     A view is two perpendicular unit directions in three-dimensional space:
     one that becomes the horizontal axis of the picture and one that becomes
     the vertical. Everything along the third direction is discarded, which is
     the whole of what a projection does.
     ===================================================================== */

  function normalize(v) {
    var L = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / L, v[1] / L, v[2] / L];
  }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /* A viewing direction from two angles, and the two picture axes that go with
     it. `az` turns around the vertical axis, `el` tilts up from the equator,
     both in degrees. */
  function viewFromAngles(az, el) {
    var a = az * Math.PI / 180, e = el * Math.PI / 180;
    var look = normalize([Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)]);
    var up = Math.abs(look[2]) > 0.995 ? [1, 0, 0] : [0, 0, 1];
    var right = normalize(cross(up, look));
    var vert = cross(look, right);
    return { look: look, right: right, up: vert };
  }

  /* Project the cloud onto a view. Returns picture coordinates and a depth,
     so nearer points can be drawn darker. */
  function project(pts, view) {
    var out = new Array(pts.length), i;
    for (i = 0; i < pts.length; i++) {
      var p = pts[i];
      out[i] = {
        u: p.x * view.right[0] + p.y * view.right[1] + p.z * view.right[2],
        v: p.x * view.up[0] + p.y * view.up[1] + p.z * view.up[2],
        d: p.x * view.look[0] + p.y * view.look[1] + p.z * view.look[2],
        /* How squarely this bit of surface faces the viewer. Positive means it
           is on the near side and should be drawn; negative means it is round
           the back and is hidden by the pot itself. */
        face: (p.nx === undefined) ? 1
          : p.nx * view.look[0] + p.ny * view.look[1] + p.nz * view.look[2],
        part: p.part, side: p.side, pat: p.pat
      };
    }
    return out;
  }

  /* How much of the object a view shows, measured as the total spread of the
     projected picture: the variance along the horizontal plus the variance
     along the vertical. It is the quantity principal component analysis
     maximizes, applied to an object rather than to a set of attributes. */
  function spread(pts, view) {
    var pr = project(pts, view), n = pr.length, i;
    var mu = 0, mv = 0;
    for (i = 0; i < n; i++) { mu += pr[i].u; mv += pr[i].v; }
    mu /= n; mv /= n;
    var su = 0, sv = 0;
    for (i = 0; i < n; i++) {
      var du = pr[i].u - mu, dv = pr[i].v - mv;
      su += du * du; sv += dv * dv;
    }
    return { u: su / n, v: sv / n, total: (su + sv) / n };
  }

  /* The covariance matrix of the cloud's coordinates. Three features — x, y
     and z — and one sample per point, which is exactly the layout module 02
     used for attributes. */
  function covariance(pts) {
    var n = pts.length, i;
    var mx = 0, my = 0, mz = 0;
    for (i = 0; i < n; i++) { mx += pts[i].x; my += pts[i].y; mz += pts[i].z; }
    mx /= n; my /= n; mz /= n;
    var cxx = 0, cyy = 0, czz = 0, cxy = 0, cxz = 0, cyz = 0;
    for (i = 0; i < n; i++) {
      var dx = pts[i].x - mx, dy = pts[i].y - my, dz = pts[i].z - mz;
      cxx += dx * dx; cyy += dy * dy; czz += dz * dz;
      cxy += dx * dy; cxz += dx * dz; cyz += dy * dz;
    }
    return [
      [cxx / n, cxy / n, cxz / n],
      [cxy / n, cyy / n, cyz / n],
      [cxz / n, cyz / n, czz / n]
    ];
  }

  /* The view that shows the most: the first two eigenvectors of the cloud's
     covariance matrix. Needs MV.jacobi from multivar.js. */
  function bestView(pts) {
    if (typeof MV === 'undefined') return viewFromAngles(0, 0);
    var e = MV.jacobi(covariance(pts));
    var right = normalize([e.vectors[0][0], e.vectors[0][1], e.vectors[0][2]]);
    var up = normalize([e.vectors[1][0], e.vectors[1][1], e.vectors[1][2]]);
    return {
      right: right, up: up, look: cross(right, up),
      values: e.values.slice(), vectors: e.vectors
    };
  }

  /* The angles that reproduce a given view, so a slider can be moved to it. */
  function anglesOfView(view) {
    var l = view.look;
    var el = Math.asin(Math.max(-1, Math.min(1, l[2]))) * 180 / Math.PI;
    var az = Math.atan2(l[1], l[0]) * 180 / Math.PI;
    return { az: az, el: el };
  }

  var AXIS_VIEWS = {
    front: { az: 0, el: 0, label: 'from the front' },
    side: { az: 90, el: 0, label: 'from the side' },
    top: { az: 0, el: 89.9, label: 'from above' }
  };

  /* Points to actually draw, in the order to draw them: the far side dropped,
     and what is left sorted back to front so that nearer points paint over
     farther ones. That is what makes the pot look solid instead of made of
     glass, which matters here because the whole point of the module is that a
     view HIDES things. */
  function visible(pr) {
    var out = [], i;
    for (i = 0; i < pr.length; i++) if (pr[i].face > 0) out.push(pr[i]);
    out.sort(function (a, b) { return a.d - b.d; });
    return out;
  }

  return {
    plane: plane, teapot: teapot, viewFromAngles: viewFromAngles, project: project,
    visible: visible,
    spread: spread, covariance: covariance, bestView: bestView,
    anglesOfView: anglesOfView, AXIS_VIEWS: AXIS_VIEWS,
    normalize: normalize, cross: cross
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SHAPE;
