/* ===========================================================================
   multivar.js — the arithmetic behind every panel in this module set
   Heather Bedle and April Moreno-Ward / University of Oklahoma

   Dimension reduction is a small amount of linear algebra applied to a table
   of numbers. This file holds that linear algebra: means and standard
   deviations, covariance and correlation, a symmetric eigensolver, whitening,
   projection, reconstruction from a subset of components, the higher-order
   statistics that separate independence from decorrelation, and FastICA.

   Nothing here is drawn. Every module computes its panels from these
   functions, so an error in the arithmetic appears in the picture rather than
   hiding behind it.

   DATA LAYOUT. A dataset is an array of FEATURES, each feature a Float64Array
   or plain array of n SAMPLES:

       X = [f0, f1, f2, ...]      X[j][i] = value of feature j at sample i

   That is the transpose of the layout used in most textbooks, where a data
   matrix has one row per sample. Features are kept together here because
   every operation in dimension reduction is applied down a feature, and
   because a seismic attribute volume arrives as a set of volumes rather than
   as a set of voxels.

   License: CC BY-SA 4.0. Free to use, adapt and share with credit; any
   adaptation must be released under the same license.
   =========================================================================== */

var MV = (function () {
  'use strict';

  /* =====================================================================
     ELEMENTARY STATISTICS
     ===================================================================== */

  function mean(x) {
    var s = 0, n = x.length;
    for (var i = 0; i < n; i++) s += x[i];
    return s / n;
  }

  /* Population standard deviation, dividing by n rather than n-1. The choice
     matters at small n and matters nowhere in this set, because every dataset
     on the page has thousands of samples. It is stated here so that a reader
     comparing a readout against their own calculation knows which one is on
     screen. */
  function std(x, mu) {
    var m = (mu === undefined) ? mean(x) : mu, s = 0, n = x.length;
    for (var i = 0; i < n; i++) { var d = x[i] - m; s += d * d; }
    return Math.sqrt(s / n);
  }

  function variance(x, mu) { var s = std(x, mu); return s * s; }

  /* =====================================================================
     STANDARDIZATION

     Two operations that are easy to confuse:

       center    subtract the mean. Changes where the cloud sits.
       zscore    subtract the mean and divide by the standard deviation.
                 Changes where the cloud sits and how wide it is in each
                 direction.

     PCA on centered data answers "which direction carries the most of the
     original units squared". PCA on z-scored data answers "which direction
     carries the most of the shared behavior". For features in unlike units
     the first question has no meaningful answer, which is the subject of
     module 03.
     ===================================================================== */

  function center(X) {
    return X.map(function (f) {
      var m = mean(f), o = new Float64Array(f.length);
      for (var i = 0; i < f.length; i++) o[i] = f[i] - m;
      return o;
    });
  }

  function zscore(X) {
    return X.map(function (f) {
      var m = mean(f), s = std(f, m) || 1, o = new Float64Array(f.length);
      for (var i = 0; i < f.length; i++) o[i] = (f[i] - m) / s;
      return o;
    });
  }


  /* =====================================================================
     SCALINGS

     Standardizing is not the only option a package offers, and the three that
     turn up most often are not equivalent. Two of them are linear: they slide
     and stretch each attribute without changing the shape of its
     distribution, so they leave every correlation exactly as it was. The
     third is not: it replaces each value by where it sits in the order, which
     changes the shape and therefore changes the correlations too.
     ===================================================================== */

  /* Map each attribute onto 0 to 1 using its own smallest and largest value.
     One extreme trace sets the range, so the bulk of the data can end up
     squeezed into a small part of it. */
  function minmax(X) {
    return X.map(function (col) {
      var lo = Infinity, hi = -Infinity, i;
      for (i = 0; i < col.length; i++) {
        if (col[i] < lo) lo = col[i];
        if (col[i] > hi) hi = col[i];
      }
      var r = (hi - lo) || 1, o = new Float64Array(col.length);
      for (i = 0; i < col.length; i++) o[i] = (col[i] - lo) / r;
      return o;
    });
  }

  /* The inverse of the standard normal distribution function, by the rational
     approximation of Acklam, accurate to about 1.15e-9 across the range. */
  function normalQuantile(p) {
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
    var lo = 0.02425, q, r;
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p < lo) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > 1 - lo) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
              ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  /* The Gaussian, or normal score, transform. Sort the values, replace each
     one by the normal quantile of its position in the sorted order, and the
     attribute comes out with a Gaussian distribution whatever shape it went
     in with. Ties are broken by position, which is what makes it exactly
     reproducible. It is monotonic, so the ORDER of the values is untouched;
     only the spacing between them changes. */
  function normalScore(X) {
    return X.map(function (col) {
      var n = col.length, idx = new Array(n), i;
      for (i = 0; i < n; i++) idx[i] = i;
      idx.sort(function (a, b) { return col[a] - col[b] || a - b; });
      var o = new Float64Array(n);
      for (i = 0; i < n; i++) o[idx[i]] = normalQuantile((i + 0.5) / n);
      return o;
    });
  }

  /* Whichever scaling a caller asks for, by name. */
  function scale(X, how) {
    if (how === 'minmax') return minmax(X);
    if (how === 'zscore') return zscore(X);
    if (how === 'gauss') return normalScore(X);
    return center(X);                                // 'none': centered only
  }

  /* =====================================================================
     COVARIANCE AND CORRELATION

     The covariance matrix is square, symmetric, with one row and column per
     feature. Element (j,k) is the average product of the two features after
     both have had their means removed. On the diagonal that product is a
     feature with itself, which is its variance.

     The correlation matrix is the same quantity with each feature divided by
     its own standard deviation first, so every diagonal element is exactly 1
     and every off-diagonal element lies between -1 and 1.
     ===================================================================== */

  function cov(X) {
    var p = X.length, n = X[0].length, i, j, k;
    var mu = X.map(mean);
    var C = [];
    for (j = 0; j < p; j++) C.push(new Float64Array(p));
    for (j = 0; j < p; j++) {
      for (k = j; k < p; k++) {
        var s = 0;
        for (i = 0; i < n; i++) s += (X[j][i] - mu[j]) * (X[k][i] - mu[k]);
        s /= n;
        C[j][k] = s; C[k][j] = s;
      }
    }
    return C;
  }

  function corr(X) {
    var C = cov(X), p = C.length, j, k;
    var sd = [];
    for (j = 0; j < p; j++) sd.push(Math.sqrt(C[j][j]) || 1);
    var R = [];
    for (j = 0; j < p; j++) R.push(new Float64Array(p));
    for (j = 0; j < p; j++) for (k = 0; k < p; k++) R[j][k] = C[j][k] / (sd[j] * sd[k]);
    return R;
  }

  /* =====================================================================
     SYMMETRIC EIGENSOLVER — CYCLIC JACOBI

     Jacobi rotates the matrix one off-diagonal element at a time, each
     rotation chosen to zero that element, until everything off the diagonal
     is negligible. What remains on the diagonal are the eigenvalues, and the
     accumulated rotations are the eigenvectors.

     It is slower than the methods used in production libraries and it is
     chosen here because it is short enough to be read, it is numerically
     sound on the small symmetric matrices this set uses, and it never
     returns a complex result for a real symmetric input.

     Returns eigenvalues in descending order with their eigenvectors, each
     eigenvector sign-fixed so that its largest-magnitude element is positive.
     Without that fix an eigenvector's sign is arbitrary and a panel would
     flip colors for no reason a reader could see.
     ===================================================================== */

  function jacobi(Ain, tol, maxSweeps) {
    var p = Ain.length, i, j, k, s;
    tol = tol || 1e-12;
    maxSweeps = maxSweeps || 100;

    var A = [];
    for (i = 0; i < p; i++) A.push(Float64Array.from(Ain[i]));
    var V = [];
    for (i = 0; i < p; i++) {
      V.push(new Float64Array(p));
      V[i][i] = 1;
    }

    function offDiagNorm() {
      var t = 0;
      for (var a = 0; a < p; a++) for (var b = a + 1; b < p; b++) t += A[a][b] * A[a][b];
      return Math.sqrt(2 * t);
    }

    var scale = 0;
    for (i = 0; i < p; i++) scale += Math.abs(A[i][i]);
    scale = scale || 1;

    for (s = 0; s < maxSweeps && offDiagNorm() > tol * scale; s++) {
      for (i = 0; i < p - 1; i++) {
        for (j = i + 1; j < p; j++) {
          if (Math.abs(A[i][j]) < 1e-300) continue;
          var theta = (A[j][j] - A[i][i]) / (2 * A[i][j]);
          var t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          var c = 1 / Math.sqrt(t * t + 1), sn = t * c;

          for (k = 0; k < p; k++) {
            var aik = A[i][k], ajk = A[j][k];
            A[i][k] = c * aik - sn * ajk;
            A[j][k] = sn * aik + c * ajk;
          }
          for (k = 0; k < p; k++) {
            var aki = A[k][i], akj = A[k][j];
            A[k][i] = c * aki - sn * akj;
            A[k][j] = sn * aki + c * akj;
          }
          for (k = 0; k < p; k++) {
            var vki = V[k][i], vkj = V[k][j];
            V[k][i] = c * vki - sn * vkj;
            V[k][j] = sn * vki + c * vkj;
          }
        }
      }
    }

    var order = [];
    for (i = 0; i < p; i++) order.push(i);
    order.sort(function (a, b) { return A[b][b] - A[a][a]; });

    var values = [], vectors = [];
    for (i = 0; i < p; i++) {
      var src = order[i];
      values.push(A[src][src]);
      var v = new Float64Array(p);
      for (k = 0; k < p; k++) v[k] = V[k][src];
      // sign convention: largest-magnitude element positive
      var big = 0;
      for (k = 0; k < p; k++) if (Math.abs(v[k]) > Math.abs(v[big])) big = k;
      if (v[big] < 0) for (k = 0; k < p; k++) v[k] = -v[k];
      vectors.push(v);
    }
    return { values: values, vectors: vectors, sweeps: s };
  }

  /* Inverse of a symmetric positive-definite matrix, from its own
     eigendecomposition: rebuild it with every eigenvalue replaced by its
     reciprocal. Eigenvalues below a floor are clamped, so a matrix that is
     singular to working precision returns a pseudo-inverse rather than
     infinities. Used for the best-separating direction in module 06. */
  function inverse(A, floor) {
    var e = jacobi(A), p = A.length, out = [], i, j, k;
    floor = floor || 1e-9;
    for (i = 0; i < p; i++) out.push(new Float64Array(p));
    for (k = 0; k < p; k++) {
      var lam = Math.max(e.values[k], floor);
      for (i = 0; i < p; i++) {
        for (j = 0; j < p; j++) out[i][j] += e.vectors[k][i] * e.vectors[k][j] / lam;
      }
    }
    return out;
  }

  /* =====================================================================
     PROJECTION

     A direction is a unit vector. The projection of a sample onto it is the
     dot product of the sample with that vector: one number per sample,
     giving the position of the sample along the direction.

     This is the single operation module 01 is built on, and every method in
     the set is a rule for choosing the vector.
     ===================================================================== */

  function unit(v) {
    var s = 0, i;
    for (i = 0; i < v.length; i++) s += v[i] * v[i];
    s = Math.sqrt(s) || 1;
    var o = new Float64Array(v.length);
    for (i = 0; i < v.length; i++) o[i] = v[i] / s;
    return o;
  }

  function project(X, v) {
    var p = X.length, n = X[0].length, o = new Float64Array(n), i, j;
    var u = unit(v);
    for (i = 0; i < n; i++) {
      var s = 0;
      for (j = 0; j < p; j++) s += X[j][i] * u[j];
      o[i] = s;
    }
    return o;
  }

  /* Direction from an angle, for the two-feature case. Zero degrees points
     along the first feature and angles increase toward the second. */
  function dirFromAngle(deg) {
    var a = deg * Math.PI / 180;
    return new Float64Array([Math.cos(a), Math.sin(a)]);
  }

  /* The angle of the first eigenvector of a two-feature cloud, in degrees,
     folded into [0,180) so that it does not jump by a half turn when the
     sign convention flips. */
  function principalAngle(X, opt) {
    var D = (opt && opt.standardize) ? zscore(X) : center(X);
    var e = jacobi(cov(D));
    var a = Math.atan2(e.vectors[0][1], e.vectors[0][0]) * 180 / Math.PI;
    while (a < 0) a += 180;
    while (a >= 180) a -= 180;
    return a;
  }

  /* =====================================================================
     PCA

     standardize: true  -> z-score each feature first (the correlation route)
                  false -> remove means only (the covariance route)

     Returns everything a panel might need, computed once:

       mu, sd        per-feature mean and standard deviation
       C             the matrix that was decomposed
       values        eigenvalues, descending
       vectors       eigenvectors, the LOADINGS
       scores        the projections of the data onto each eigenvector
       explained     fraction of total variance on each component
       cumulative    running total of explained

     On naming: some sources call the eigenvectors the principal components,
     others call the projections the principal components. Statistics calls
     the first LOADINGS and the second SCORES, and both names are used here
     so that neither convention is the only one a reader has seen.
     ===================================================================== */

  function pca(X, opt) {
    opt = opt || {};
    var mu = X.map(mean);
    var sd = X.map(function (f, j) { return std(f, mu[j]); });
    var D = opt.standardize ? zscore(X) : center(X);
    var C = cov(D);
    var e = jacobi(C);
    var tot = 0, i;
    for (i = 0; i < e.values.length; i++) tot += Math.max(0, e.values[i]);
    tot = tot || 1;

    var scores = [], explained = [], cumulative = [], run = 0;
    for (i = 0; i < e.vectors.length; i++) {
      scores.push(project(D, e.vectors[i]));
      var f = Math.max(0, e.values[i]) / tot;
      explained.push(f);
      run += f;
      cumulative.push(run);
    }
    return {
      mu: mu, sd: sd, standardized: !!opt.standardize, data: D, C: C,
      values: e.values, vectors: e.vectors, loadings: e.vectors,
      scores: scores, explained: explained, cumulative: cumulative
    };
  }

  /* How many components are needed to reach a given fraction of the variance.
     This is the criterion AASPI's ICA implementation uses at 90%, and the one
     a scree plot is usually read against. It is a convention, not a result. */
  function componentsFor(P, frac) {
    for (var i = 0; i < P.cumulative.length; i++) if (P.cumulative[i] >= frac) return i + 1;
    return P.cumulative.length;
  }

  /* Rebuild the features from the first k components only, back in the
     original units. The difference between this and the input is the
     residual, which is what module 05 puts on screen beside it. */
  function reconstruct(P, k) {
    var p = P.vectors.length, n = P.scores[0].length, j, i, c;
    var out = [];
    for (j = 0; j < p; j++) out.push(new Float64Array(n));
    for (c = 0; c < k; c++) {
      var v = P.vectors[c], s = P.scores[c];
      for (j = 0; j < p; j++) {
        var vj = v[j];
        if (vj === 0) continue;
        for (i = 0; i < n; i++) out[j][i] += s[i] * vj;
      }
    }
    for (j = 0; j < p; j++) {
      var scaleJ = P.standardized ? P.sd[j] : 1;
      for (i = 0; i < n; i++) out[j][i] = out[j][i] * scaleJ + P.mu[j];
    }
    return out;
  }

  function residual(X, R) {
    return X.map(function (f, j) {
      var o = new Float64Array(f.length);
      for (var i = 0; i < f.length; i++) o[i] = f[i] - R[j][i];
      return o;
    });
  }

  /* =====================================================================
     WHITENING

     Whitening projects onto the eigenvectors and then divides each
     projection by the square root of its eigenvalue. The result has unit
     variance in every direction and no correlation between any pair, so its
     covariance matrix is the identity and the cloud is a round ball.

     Every direction now carries the same variance, which means variance can
     no longer be used to choose between directions. That is the point: after
     whitening, the only thing left to distinguish one rotation from another
     is higher-order structure, and that is what ICA searches.
     ===================================================================== */

  function whiten(X, opt) {
    var P = pca(X, opt);
    var k = (opt && opt.k) ? Math.min(opt.k, P.values.length) : P.values.length;
    var out = [], i, c;
    for (c = 0; c < k; c++) {
      var d = Math.sqrt(Math.max(P.values[c], 1e-12));
      var s = P.scores[c], o = new Float64Array(s.length);
      for (i = 0; i < s.length; i++) o[i] = s[i] / d;
      out.push(o);
    }
    return { Z: out, pca: P, k: k };
  }

  /* =====================================================================
     HIGHER-ORDER STATISTICS

     Mean and variance are first and second order. They describe where a
     distribution sits and how wide it is, and they say nothing about its
     shape. Two distributions with identical means and variances can look
     completely different, and the difference is carried in the higher
     orders.

     kurtosis     excess kurtosis: zero for a Gaussian, positive for a
                  distribution with a sharp peak and long tails, negative for
                  a flat-topped one. Sensitive to outliers, because it
                  involves a fourth power.

     negentropy   how far a distribution is from the Gaussian of the same
                  variance, measured in the same units as entropy and never
                  negative. Exactly zero only for a Gaussian. Computed here
                  by the robust approximation of Hyvarinen and Oja (2000)
                  rather than by estimating an entropy directly.
     ===================================================================== */

  function kurtosis(x) {
    var m = mean(x), n = x.length, m2 = 0, m4 = 0, i;
    for (i = 0; i < n; i++) { var d = x[i] - m; var d2 = d * d; m2 += d2; m4 += d2 * d2; }
    m2 /= n; m4 /= n;
    if (m2 <= 0) return 0;
    return m4 / (m2 * m2) - 3;
  }

  /* Expectation of G under a standard Gaussian, needed as the reference in
     the negentropy approximation. Both constants are the standard ones. */
  var EG_LOGCOSH = 0.3745672075;          // E{log cosh(u)} for u ~ N(0,1)
  var EG_GAUSS = -1 / Math.SQRT2;          // E{-exp(-u^2/2)} for u ~ N(0,1)

  function negentropy(x, contrast) {
    var m = mean(x), s = std(x, m) || 1, n = x.length, i, acc = 0;
    if (contrast === 'gauss') {
      for (i = 0; i < n; i++) { var u = (x[i] - m) / s; acc += -Math.exp(-u * u / 2); }
      var d2 = acc / n - EG_GAUSS;
      return d2 * d2;
    }
    for (i = 0; i < n; i++) acc += Math.log(Math.cosh((x[i] - m) / s));
    var d = acc / n - EG_LOGCOSH;
    return d * d;
  }

  /* =====================================================================
     FastICA

     The algorithm of Hyvarinen and Oja (2000), deflationary form: find one
     direction at a time, each one made orthogonal to those already found.

     The input is whitened first, so the search is over rotations of a ball
     rather than over all linear transformations. Each direction is then
     driven toward maximum non-Gaussianity by a fixed-point iteration on the
     chosen contrast function.

     Two contrasts are offered because module 08 compares them:

       logcosh   the general-purpose choice, robust to outliers
       kurtosis  faster and sharper on clean data, sensitive to outliers

     The initial guess is deterministic by default — the identity rotation,
     taken one direction at a time — so that the same input returns the same
     components every time it is run. Passing `seed` starts from a different
     rotation instead, which is what published implementations usually do.

     The two starts exist so that a module can show the difference between
     them. On non-Gaussian data every start converges to the same directions,
     and a fixed start only fixes which order they arrive in. On Gaussian
     data the directions themselves depend on the start, because there is
     nothing in the data for the algorithm to lock onto. Order, sign and
     scale are never determined by the method.
     ===================================================================== */

  function fastICA(X, k, opt) {
    opt = opt || {};
    var contrast = opt.contrast || 'logcosh';
    var tol = opt.tol || 1e-9;
    var maxIter = opt.maxIter || 300;
    var rnd = null;
    if (opt.seed !== undefined && opt.seed !== null) {
      var sd = opt.seed >>> 0;
      rnd = function () { sd = (1664525 * sd + 1013904223) >>> 0; return sd / 4294967296 - 0.5; };
    }
    var W = whiten(X, { standardize: opt.standardize !== false, k: opt.k || null });
    var Z = W.Z, p = Z.length, n = Z[0].length;
    k = Math.min(k || p, p);

    var vecs = [], iters = [], i, j, c, it;

    for (c = 0; c < k; c++) {
      var w = new Float64Array(p);
      if (rnd) {
        for (j = 0; j < p; j++) w[j] = rnd();
      } else {
        w[c % p] = 1;
        // nudge off the axis so a perfectly symmetric start cannot stall
        for (j = 0; j < p; j++) w[j] += 1e-3 * Math.cos((c + 1) * (j + 1));
      }
      w = unit(w);

      for (it = 0; it < maxIter; it++) {
        var wNew = new Float64Array(p), gp = 0;
        for (i = 0; i < n; i++) {
          var u = 0;
          for (j = 0; j < p; j++) u += w[j] * Z[j][i];
          var g, dg;
          if (contrast === 'kurtosis') {
            g = u * u * u; dg = 3 * u * u;
          } else {
            g = Math.tanh(u); dg = 1 - g * g;
          }
          for (j = 0; j < p; j++) wNew[j] += Z[j][i] * g;
          gp += dg;
        }
        for (j = 0; j < p; j++) wNew[j] = wNew[j] / n - (gp / n) * w[j];

        // Gram-Schmidt against the directions already found
        for (var q = 0; q < vecs.length; q++) {
          var dot = 0;
          for (j = 0; j < p; j++) dot += wNew[j] * vecs[q][j];
          for (j = 0; j < p; j++) wNew[j] -= dot * vecs[q][j];
        }
        wNew = unit(wNew);

        var conv = 0;
        for (j = 0; j < p; j++) conv += wNew[j] * w[j];
        w = wNew;
        if (Math.abs(Math.abs(conv) - 1) < tol) break;
      }
      // sign convention, as for the eigenvectors
      var big = 0;
      for (j = 0; j < p; j++) if (Math.abs(w[j]) > Math.abs(w[big])) big = j;
      if (w[big] < 0) for (j = 0; j < p; j++) w[j] = -w[j];
      vecs.push(w);
      iters.push(it);
    }

    var S = vecs.map(function (v) { return project(Z, v); });
    return { W: vecs, S: S, whitened: Z, pca: W.pca, iters: iters, contrast: contrast };
  }

  /* =====================================================================
     HISTOGRAM

     Fixed limits, always supplied by the caller. A histogram whose axis
     follows its data hides the very change a slider is being moved to show.
     ===================================================================== */

  function hist(x, x0, x1, nbins) {
    nbins = nbins || 40;
    var h = new Float64Array(nbins), n = x.length, i;
    var w = (x1 - x0) / nbins;
    for (i = 0; i < n; i++) {
      var b = Math.floor((x[i] - x0) / w);
      if (b < 0) b = 0;
      if (b >= nbins) b = nbins - 1;
      h[b] += 1;
    }
    var mx = 0;
    for (i = 0; i < nbins; i++) if (h[i] > mx) mx = h[i];
    return { counts: h, max: mx, x0: x0, x1: x1, width: w, n: n };
  }

  /* =====================================================================
     STATE IN THE URL

     An instructor can send a link that opens a module in an exact
     configuration. Only keys that differ from the defaults are written, so
     an untouched module has a clean address.
     ===================================================================== */

  function readState(DEF) {
    var S = {}, k;
    for (k in DEF) if (Object.prototype.hasOwnProperty.call(DEF, k)) S[k] = DEF[k];
    try {
      var q = new URLSearchParams(location.search);
      q.forEach(function (v, key) {
        if (!(key in DEF)) return;
        S[key] = (typeof DEF[key] === 'number') ? parseFloat(v)
               : (typeof DEF[key] === 'boolean') ? (v === '1' || v === 'true')
               : v;
        if (typeof DEF[key] === 'number' && !isFinite(S[key])) S[key] = DEF[key];
      });
    } catch (e) { /* no query string available */ }
    return S;
  }

  function writeState(S, DEF) {
    var q = new URLSearchParams(), k;
    for (k in DEF) {
      if (!Object.prototype.hasOwnProperty.call(DEF, k)) continue;
      if (S[k] === DEF[k]) continue;
      q.set(k, (typeof DEF[k] === 'boolean') ? (S[k] ? '1' : '0') : String(S[k]));
    }
    var s = q.toString();
    history.replaceState(null, '', s ? ('?' + s) : location.pathname);
  }

  return {
    mean: mean, std: std, variance: variance,
    center: center, zscore: zscore,
    minmax: minmax, normalScore: normalScore, normalQuantile: normalQuantile, scale: scale,
    cov: cov, corr: corr, jacobi: jacobi, inverse: inverse,
    unit: unit, project: project, dirFromAngle: dirFromAngle,
    principalAngle: principalAngle,
    pca: pca, componentsFor: componentsFor, reconstruct: reconstruct,
    residual: residual, whiten: whiten,
    kurtosis: kurtosis, negentropy: negentropy, fastICA: fastICA,
    hist: hist, readState: readState, writeState: writeState
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MV;
