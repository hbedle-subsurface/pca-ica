# Module plan

The spine: **dimension reduction is a rule for choosing a direction.** Every
module either builds that picture, gives a rule, or shows what a rule cannot
know. Seismic is what the demonstrations are made of; the set is not about
seismic PCA programs.

Each module depends only on those before it. The question each one answers is
written here before any of it is built.

## Fundamentals — no method named

**00 · Looking at it from the right direction.** *You know what an aeroplane looks
like. What happens when you do not?* **Built**, and rebuilt around Heather's
aeroplane intuition rather than the original "too many measurements" framing.

The spine of the module: a view IS a projection, and the view that shows the
most of an aeroplane is a mixture of all three axes rather than any one of them.
Three axis views give spreads of 0.4540 (front), 0.5730 (side) and 0.6178
(top); the widest available is 0.6659, at azimuth -61.2 and elevation -32.5.
Its two picture axes are 0.840x + 0.533y - 0.097z across and 0.359x - 0.412y +
0.837z up — every one of the six weights non-zero. The two kept directions hold
81.0% and the discarded one 19.0%.

CRITICAL BUILD DETAIL. The aeroplane is rotated by a fixed 34/27/19 degrees before
anything is measured. Without the tilt the spout and handle lie in a coordinate
plane, that plane IS the plane of greatest spread, and the best view comes out
as exactly the side view — which would teach that the answer is an axis after
all. An attribute space is an arbitrary coordinate system in the same way, so
the oblique orientation is the honest case. This was caught by measuring before
writing: the first build returned azimuth -90, elevation 0.

Step 4 repeats the identical arithmetic on three amplitude attributes (RMS,
peak envelope, peak absolute amplitude) as a cloud of 5184 points in three
dimensions: the widest view holds 93.89% against 76.9%, 54.4% and 68.7% for the
axis views, with PC1 = 0.393 RMS + 0.735 envelope + 0.553 peak — a mixture
again. Step 5 makes the leap explicit: twelve attributes, 66 pairs, 5 above
|r| = 0.7, best three holding 74.28%, and 180^11 = 6.4e24 directions to sweep.
Three things stop working (turning by hand, recognizing a good view, getting
away with two) and one keeps working (all the arithmetic).

The honest caveat is in Why it matters: an aeroplane's best view is obviously its
best view because you know what an aeroplane is, and that coincidence does not
survive the move to attributes. Modules 05 and 06 are where that bill comes
due.

assets/shape3d.js builds the aeroplane from equations — surfaces of revolution for
the body and lid, swept tubes for the spout and handle — so nothing is a stored
model.

**01 · A direction through a cloud.** *What is the best single number to
replace two attributes with?* Crossplot, a rotating line, the projected
histogram, and the variance-against-angle curve. The first principal component
found by hand. **Built.**

**02 · Spread, and the shape of the cloud.** *Is this attribute adding
anything?* Covariance from the products of deviations, the gain test that
separates covariance from correlation, the ellipse, a correlation matrix for
eleven attributes, and two cases where one number misleads. **Built.**

Two findings recorded here because later modules reuse them. First, the
crossplot convention has to change between modules 01 and 02: module 01 draws
both axes in matched amplitude units into a square box so the angle on screen
is the angle in the data, and module 02 draws each axis in its own standard
deviations so any pair can be shown. In the second convention the ellipse ratio
is sqrt((1+|r|)/(1-|r|)) and depends on r alone, so no angle read off it means
anything. Both modules say which convention they are using.

Second, amplitude against true bed thickness inside the young channel gives a
clean tuning arch: the binned mean rises from 71.4 to a maximum of 104.4 at
12.7 ms and falls to about 74 at 26 ms. Correlation over the whole range is
-0.667, +0.866 below 13 ms and -0.777 above it. That is the non-monotonic case
for step 5 and it is real physics rather than a constructed example.

**03 · Units, and why they decide the answer.** *Why is my first component the
loudest attribute?* The covariance route against the correlation route on six
attributes, the rescaling test, the variance auction, the two-attribute
degeneracy, and what an equal share costs. **Built.**

Measured results this module rests on. Native units, covariance route: PC1 is
0.950 bandwidth, -0.274 GLCM contrast, -0.150 peak frequency, and -0.001,
-0.001 and 0.006 on RMS, envelope and coherence — three of six attributes
absent. Standardized: all six present, largest loading 0.509 on RMS, the
attribute the other route ignored. Variances span 1.05e-4 to 74.4, a factor of
709,700.

Rescaling RMS alone: covariance-route loading goes -0.001, -0.008, -0.083,
0.768 at 1x, 10x, 100x, 1000x, and PC1's share moves 69.55% to 72.84%.
Correlation route: 0.509 and 52.19% at every stop.

The two-attribute degeneracy is taught here: standardized, the angle is 45 or
135 for every pair (measured across four pairs with r from -0.72 to +0.65),
while native angles run 58.99, 93.65, 99.45, 90.85. This is why module 01 works
in matched amplitude units instead of standardizing.

The weak attribute (RMS on samples 2-16, above the target; mean 0.04559 in the
channel against 0.04660 in the background, versus 0.08126 and 0.05571 for the
same attribute on the target) takes over PC2 outright once standardized, with a
loading of 0.528, and drags PC1 from 52.19% to 44.83% and the 90% component
count from 4 to 5. The covariance route gives it loading 0.000 on PC1 and does
not move at all; it lands alone on PC7 with a loading of 0.993.

Note on internal consistency: this module computes in native units, because the
x1000 display gain modules 01 and 02 apply to amplitude attributes would itself
change the covariance-route answer. With that gain applied to RMS and envelope,
PC1 becomes 0.776 envelope and 0.507 RMS — a third distinct answer from the
same rocks. The Method tab says so.

**04 · Eigenvectors, loadings and scores.** *Is the principal component the
weights or the volume?* The sweep against the solved answer, the direction
sphere for three attributes, deflation, loadings against scores, and the sign
ambiguity. **Built.**

Identities verified in the running page, all to machine precision: the six
standardized eigenvalues sum to 6.000000; each eigenvalue equals the variance
of its score (agreement to about 1e-14); the residual on Cv - lambda*v is
around 1e-16 for every component; and the score vectors are mutually orthogonal
at about 1e-15. That last one is the measured refutation of the claim in
real_pca_waveform and pca_waveform_classification that the principal components
are not orthogonal.

Deflation: the original eigenvalues 3.1317, 1.2860, 0.7386, 0.4476, 0.2649,
0.1313 become, after removing one component, the same list shifted one place
with a zero at the end, and the residual's first eigenvector matches the
original second to 0.0000 degrees. The residual is divided by the ORIGINAL
standard deviations rather than re-standardized, because re-standardizing
rescales each attribute by whatever survived and is not what deflation means.

Step 2's direction sphere uses u'Cu rather than projecting all 5184 traces per
direction, which makes a 180x90 grid cheap. The counting argument the module
quotes: two attributes need 180 directions swept, three need 32,400, six need
five angles and about 1.9e11.

## PCA

**05 · How many components to keep.** *Ninety percent. Is that enough?* Scree,
five competing rules, the residual as a set of maps, per-attribute shortfall,
and the variance ranking set against a usefulness ranking. **Built.**

The five rules return five different answers on the same six attributes:
broken stick 1 (52.19% retained), Kaiser 2 (73.63%), 80% rule 3 (85.94%), 90%
rule 4 (93.40%), 95% rule 5 (97.81%). The eigenvalues are 3.13, 1.29, 0.74,
0.45, 0.26, 0.13 with no break in them.

At the 90% cut the shortfall is very unevenly distributed: residual as a
fraction of each attribute's own spread reads 0.289 RMS, 0.194 envelope, 0.114
peak frequency, 0.088 bandwidth, 0.348 coherence, 0.365 GLCM contrast. Two
attributes are more than a third missing inside a reconstruction reported as
93.40% complete. Going to five collapses GLCM contrast to 0.005, because the
fifth component is largely that attribute.

The punchline for step 5, and the setup for modules 06 and 11: ranking the
components by channel separation gives 0.33, 2.81, 2.57, 0.28, 0.42, 0.99
against a variance ranking of 52.19%, 21.43%, 12.31%, 7.46%, 4.41%, 2.19%. The
largest component is the worst of the six at the job. Broken stick would keep
only that one. And peak frequency on its own separates at 5.97, twice the best
component — for this target the dimension reduction did not beat its own best
input, which the module says plainly.

Footprint goes the other way and is worth keeping straight: it enters mainly
through peak envelope (0.272) and RMS (0.140), and among the components
concentrates in PC4 (0.213), which the 90% rule keeps and the 80% rule drops.
An early draft of the exercise claimed PC4 carried the most footprint of
anything; peak envelope carries more, and the text was corrected.

**06 · Where PCA stops.** *Why does my first component look like two things?*
Both channel systems across all six components, the supervised ceiling, the
37-degree constraint, rotation inside the PC2-PC3 plane, and the non-Gaussian
structure PCA cannot see. **Built.**

The central measurement: Fisher discriminant directions for the two channel
systems sit 37.14 degrees apart in standardized attribute space. Principal
components are 90 degrees apart by construction, so no pair of them can point
along both — the geometry forbids it before any data is considered. The closest
any component comes to either target is PC3 at 36.9 degrees from the older
channel's direction and PC2 at 50.4 from the younger's; PC1, holding 52.19% of
the variance, sits at 85.4 and 87.9 degrees and shows neither.

Ceilings: the best direction for the younger channel reaches a separation of
8.973, against 2.812 for the best component and 5.972 for peak frequency alone
— the unsupervised result recovered under a third of what was available. For
the older channel the ceiling is only 1.615 against 1.030, which says the six
attributes carry little about it and no method could have fixed that.

Rotating inside the PC2-PC3 plane is the sharpest panel in the module: at 0
degrees (component 2) the younger channel separates at 2.812 with variance
1.286; at 45 degrees it separates at 7.421 with variance 1.012. The map nearly
triples while the quantity PCA ranks by falls, so the ranking points away from
the useful direction, and every one of those directions was already inside the
span of the components PCA returned. Both targets improve together rather than
trading off, which follows from the 37 degrees.

The handoff to module 07: score excess kurtosis is 5.11, 3.73, 3.85, -0.18,
5.13, 2.78 while every pair of scores is uncorrelated at about 1e-15. Second-
order statistics are exhausted and the data is still visibly structured. PC4,
at -0.18, is the one close to Gaussian, and it is also the component carrying
most of the acquisition footprint.

MV.inverse was added to the library for the discriminant, verified against
A.Ainv = I on a 4x4 and against a diagonal matrix.

## ICA

**07 · Independence is not decorrelation.** *PCA removed the correlation. What
is left?* Dependence without correlation, whitening, the shape statistics
calibrated against known distributions, the central limit, and a first
unsupervised search. **Built.**

Dependence without correlation, measured on the real scores: PC2 and PC3 are
uncorrelated at -2.2e-15 while the spread of PC3 within bins of PC2, as a
fraction of its own overall spread, runs 1.324, 2.364, 1.331, 0.675, 0.558,
0.855 — a factor of 4.24.

Whitening: variance along a direction in the PC2-PC3 plane runs 1.2860, 1.1491,
0.8754, 0.7386 before, and 1.000000 at every angle after.

Shape references from 40,000 seeded draws: uniform -1.201 (exact -1.2),
Gaussian -0.013 (exact 0), Laplace 2.935 (exact 3). Score kurtoses 5.11, 3.73,
3.85, -0.18, 5.13, 2.78 — five of six more peaked than a Laplace. PC4, the one
near Gaussian, is the footprint component from module 05.

Central limit, sum of k independent uniforms: -1.2006, -0.5895, -0.3937,
-0.2934, -0.2380, -0.2025, -0.1633, -0.1513 against the exact -1.2/k.

THE RESULT THE SET HAS BEEN BUILDING TO. Inside the whitened PC2-PC3 plane,
negentropy peaks at 40 degrees where the excess kurtosis is 8.37. The channel
separation there is 7.327 — against the supervised ceiling of 7.421 that module
06 obtained with the channel positions in hand, and against 2.812 at component
2 where PCA left the direction. An unsupervised criterion that was told nothing
except "look as un-Gaussian as possible" landed within about one percent of a
direction chosen while looking at the answer. Maximum kurtosis peaks at 45
rather than 40, which is a real if small disagreement between two defensible
contrasts and is flagged for module 08.

Note: three sets of quoted numbers had to be corrected against the running page
— the bin spreads are normalized on the page and were not in the draft, and the
source sums use a different random stream than the scratch measurement did.

**08 · ICA: whiten, then rotate.** *Why did my components come back in a
different order?* The three moves, the result against every earlier
measurement, the ambiguities, convergence as a diagnostic, and the two
parameters. **Built.**

The result: with log cosh and six directions retained, IC2 separates the
younger channel at 6.473, against 2.812 for the best principal component, 5.972
for peak frequency alone, and the supervised ceiling of 8.973 — 72% of what was
available, from a method never shown the channel. On the older channel, 1.351
against a ceiling of 1.615.

Order is genuinely undetermined and the module demonstrates it hard. IC1 has
the HIGHEST negentropy (1.45e-2) and kurtosis (14.24) of the six and separates
the channel at 0.246 — so even ranking by the quantity the algorithm maximizes
puts the wrong component first. Four seeded starts all return the same six
directions (|r| 0.93 to 0.98) in the same permuted order relative to the
deterministic run. Every component has variance exactly 1.0000; there is no
ranking to be had.

Convergence as a diagnostic: with log cosh the iteration counts are 11, 14, 15,
the 300 cap, 6 and 2. IC4 hit the cap and is nearly Gaussian (kurtosis -0.29,
negentropy 2.6e-5) — exactly module 07's prediction that a Gaussian direction
gives the search nothing to climb. IC6 converged in 2 and carries the most
footprint of the six at 0.322. The useful component took 14, which is
unremarkable: convergence speed identifies what is empty, not what is good.

CORRECTION DURING THE BUILD, and the more interesting lesson. The draft claimed
log cosh is simply the better contrast. It is not. Measured across retained
counts 2 to 6: log cosh gives 2.72, 6.33, 6.10, 6.18, 6.47; kurtosis gives
2.69, 6.60, 5.91, 5.48, 4.04. At three retained, kurtosis produces the best
figure anywhere in the module. Both fall off a cliff below three. Above three,
log cosh varies by 0.38 and kurtosis by 2.56. Robustness here means insensitivity
to the OTHER parameter, not a uniformly better number, and the module now says
that. The iteration readout also had to be fixed: it displayed the cap as 301.

**09 · The two, side by side.** *Which should I run?* Two known sources mixed
on purpose, both methods on the same mixtures, the mixing where PCA looks
perfect, the sources where ICA lies, and the comparison tables. **Built.**

Design constraint found while verifying: whether PCA appears to unmix is a
property of the mixing matrix, not of PCA. Sources of unequal variance let PCA
reach |r| = 0.98 against them; a badly chosen equal-variance mixture still
reached 0.96. The demonstration mixture has to put the direction of greatest
variance away from any source direction, which A = diag(a,b) · R(45 degrees)
does: the mixtures have clearly unequal variances so PCA is decisive, and its
answer sits 45 degrees from both sources, capping it at 1/sqrt(2) = 0.707.
The teaching text has to carry that qualification rather than claim PCA simply
cannot unmix.

## Into seismic

**10 · What counts as a dimension.** *Waveform PCA and attribute PCA are the
same method. Why do they look nothing alike?* **Built.**

**11 · Components are not geology.** *Which component is the reservoir?*
**Built.** The set is complete.

## References the set is built on

- Pearson (1901); Hotelling (1933); Jolliffe (2002) — PCA
- Hyvärinen and Oja (2000) — FastICA, negentropy approximation
- Guo, Marfurt and Liu (2009) — principal component spectral analysis
- Lubo-Robles and Marfurt (2019) — ICA on seismic attributes, Taranaki Basin
- Lubo-Robles, Bedle, Marfurt and Pranter (2023) — PCA for attribute selection

## Errors found in the AASPI documentation supplied as source material

To be reported rather than reproduced:

- `pca_waveform_classification` and `real_pca_waveform` have their GUI menu
  paths swapped, and both name their log and error files `real_pca_spectra_*`.
- `real_pca_waveform` reads "While the eigenvectors are orthogonal, the
  eigenvectors are not"; the parallel document says "the principal components
  are not". Measured: with the means removed the score vectors are orthogonal
  to machine precision, so the claim is wrong in both documents.
- `complex_pca_spectra` equation 4 writes **P** = Σ eⱼ pⱼ pⱼᵀ having already
  set **P** = **V**. That sum is C_X, not **V**. Equation 6 then truncates it
  and calls the result a partial sum of **Y**, when a truncated Σ eⱼ pⱼ pⱼᵀ
  acting on X is a filtered reconstruction of the data. The eigenvalue
  weighting does not belong in the projection.
- The 3500–4500 Hz band in the `pca_waveform_classification` example is
  implausible for a 1.2–2.2 s window, and those fields appear to belong to the
  spectral program rather than the waveform one.


## Revision pass: writing for a first encounter (September 2026)

Heather's note: these may be a student's first exposure to dimension reduction,
and the audience is used to short video and does not read. Measured before
changing anything — module 00 carried 684 words in front of its panels, module
01 carried 637.

Done in this pass:
- Module 00 and module 01 cut to 319 and 231 visible words, with everything
  removed placed behind `<details>` toggles rather than deleted. Nothing was
  lost from the page or from the companion paper.
- Drag-to-rotate on the module 00 aeroplane, replacing two angle sliders as the
  primary interaction (the sliders remain for fine adjustment and for anyone
  who cannot drag).
- A `.score` strip: the reader is asked to beat the arithmetic's own answer,
  and the answer is on screen as a filling bar with a percentage and a win
  state at 99%. Scaled from the worst available view to the best, so the front
  view reads 26%, the side 68%, the top 83%, and the answer 100%.
- The pattern is written up as section 8 of STYLE_BRIEF.md.

Second sweep, same session — all of it now done:

- Modules 02 through 08 trimmed on the same pattern. Every step pane now opens
  with one short line carrying a bolded instruction, and the ledes that were
  there are intact behind a `<details class="reveal">` labelled *The longer
  version*. Nothing was deleted from any module.
- Module 01's direction line is draggable directly on the crossplot. The
  pointer position is converted straight into an angle about the centre of the
  plot, which is the natural action for choosing a direction and is what the
  slider was a poor substitute for. The slider remains.
- The `.score` strip added to module 01 as well, on steps 2 to 4. Range across
  the swing: 0 degrees reads 39.7% of the best with the bar at 27%, 30 degrees
  80.7%, 45 degrees 95.2%, and 59 degrees — the answer — 100% and a win.

Visible words before the panels, measured after the pass, by step:

    module 00 (aeroplane)    31  56  46  75 111    total 319
    module 01             96  33  26  32  44    total 231
    module 02             68  20  22  20  44    total 174
    module 03             65  18  20  18  19    total 140
    module 04             62  24  17  17  16    total 136
    module 05             63  14  17  22  22    total 138
    module 06             59  22  18  18  22    total 139
    module 07             46  17  21  18  17    total 119
    module 08             64  16  17  15  21    total 133

Step 1 of each runs higher than the rest because it carries the `qbox`, which
is the hook that says why the step exists. That is the one place the extra
words earn their keep.

Third sweep: the score mechanic extended, and one module deliberately left out.

The strip is now shared code in `assets/score.js` rather than a private copy
per module — four modules were carrying the same thirty lines. It also owns the
pointer-drag helper, since the same two modules needed that.

Added to:

- **Module 06, step 4.** Rotating in the PC2-PC3 plane. Bar spans the worst and
  best directions in the plane for the selected target: 0 degrees (component 2
  itself) reads 37.9% of the best, 30 degrees 83.9%, 45 degrees fills it.
- **Module 07, step 5.** The first unsupervised hunt in the set, and the best
  place the mechanic could possibly go. The bar measures negentropy and nothing
  else — no channel is involved in computing it — and the panel underneath
  shows the channel separation coming along for the ride: 24.4% of the bar at 0
  degrees with separation 2.81, 93.5% at 30 degrees with 7.09, and the win at
  40 degrees with 7.33. A reader filling the bar has found a channel with a
  criterion that never mentioned one.
- **Module 08, step 5.** The hunt is over the two parameters rather than a
  direction. Ten combinations, and the win lands on kurtosis with three
  retained (6.60), not on the contrast the guidance calls robust. Filling the
  bar teaches the module's actual finding rather than the folklore.

NOT added to module 05, on purpose. Module 05's whole argument is that there is
no right number of components — five standard rules return one, two, three,
four and five on the same attribute set, and each is answering a different
question. Putting a bar on it that fills up at one particular cut would
contradict the module while appearing to summarise it. The mechanic is for
questions that have an answer, and "how many components should I keep" is not
one of them. Worth stating because the temptation to apply a nice interaction
uniformly is exactly how a teaching set acquires a lie.


## Fourth sweep: encouraging the fiddling (September 2026)

The score bar tells a reader how they are doing once they have started. It does
nothing to get them started, and a panel that sits still reads as a figure. So
`assets/score.js` now also carries an invitation: when a step that asks for a
hunt is first opened, its control drifts for about a second and a half and
stops.

Wired into module 00 (the aeroplane turns), module 01 (the direction line swings),
modules 06 and 07 (the rotation slider nudges) and module 08 (the retained
count steps down and back).

Three bugs found by testing it rather than by looking at it, all now fixed and
written up as rules in STYLE_BRIEF section 8:

1. The drift was relative per frame, so rounding accumulated and it walked the
   aeroplane 29 degrees from where the reader left it. Now computed from a
   remembered base, so it ends exactly where it started.
2. It drove the control through the answer and recorded a personal best of 100%
   before the reader had touched anything. Scores are no longer recorded while
   the panel is moving itself.
3. It fired on page load, by which time a reader is still on step 1 and the
   challenge steps are minutes away. Now fired from the tab handler, once per
   step.

Also added: a personal best appended to the status line once the reader has
been closer than they are now, and a specific next thing to try on the win
state rather than a dead end.

`harness-invite.js` drives all five headless, clicks into the challenge step,
samples the control forty times to catch a drift that returns to its own
starting point, then dispatches a pointer event and confirms the movement stops
and does not resume.


## Module 09 findings (September 2026)

The sources are maps of the two channel systems — sparse, excess kurtosis 6.25
and 11.15, correlating with each other at -0.091 because the channels cross.
Mixed by a rotation of chosen angle.

THE CENTRAL RESULT, and it is module 03 arriving with teeth. PCA's recovery of
the sources against mixing angle:

    0 deg  0.739     40 deg  0.991     50 deg  0.991     85 deg  0.736
    5 deg  0.736     45 deg  0.739     55 deg  0.976
   ICA: 0.996 to 1.000 at every angle.

The shape is entirely explained by the two-attribute degeneracy: with two
standardized features the principal components ALWAYS point at 45 and 135
degrees, so PCA's directions are fixed before it sees the data and the only
question is whether the mixing put the sources on them. The worst case is the
one that should be easiest — at 0 degrees the mixtures ARE the sources, already
separated, and PCA blends them back together at 0.739. That is the most
striking single fact in the module and it now leads step 2.

At exactly 45 degrees something different happens: the mixtures are exactly
uncorrelated and both eigenvalues are exactly 1.0000, so the principal
directions are genuinely undetermined and the answer is an artifact of the
solver. Module 04's Method tab lists repeated eigenvalues as not arising on
real attribute data; it arises here on constructed data, and it is left in and
explained rather than designed around.

TWO DRAFT CLAIMS CORRECTED BY MEASUREMENT.

1. I wrote that ICA holds up better than PCA under noise. The opposite: at 45
degrees PCA goes from 0.739 at no noise to 0.979 at 20%, overtaking ICA, which
falls from 0.996 to 0.976. Noise breaks the eigenvalue tie, gives PCA a
direction to prefer, and the one it prefers is a good one. Nothing about the
signal improved. The exercise is now built on that, with the general lesson: a
result that improves when you add noise is a property of the arrangement.

2. The strength slider does nothing across a sixtyfold change, because both
methods standardize. Left on the page deliberately; it is module 03 from the
other side.

The Gaussian trap works as intended: ICA reports 0.981 and 0.978 against the
true sources, looking like success, while four seeded starts agree with the
reference at only 0.805, 0.825, 0.881 and 0.962. With the channel sources the
same four agree at 1.000, 1.000, 0.997, 1.000. Repeatability is the test that
works without knowing the answer, which is the situation real data is always
in.

Score bar on step 3, inverted from the usual: the reader is asked to make the
WEAKER method look good. Starting at 45 degrees it reads 74.5%, and the win is
at 40 or 50 degrees.


## Modules 10 and 11 (September 2026) — the set is complete

### Module 10: the framing beat the method

Same window, same 5184 traces, three answers to "what is a dimension":

    attributes    6 dims   90% at 4   best channel separation 2.81
    time samples 28 dims   90% at 4   best channel separation 3.09
    frequencies  12 dims   90% at 2   best channel separation 7.95

THE HEADLINE. Plain PCA on the spectral framing reaches 7.95, against 6.47 for
ICA on attributes (module 08) and 8.97 for the supervised ceiling. Changing
what counted as a dimension did more than changing the algorithm did, on
identical data, and cost nothing but a different way of writing it down. That
is the module's argument and it was not anticipated when the plan was written.

Waveform eigenvectors come out as wavelets, with 3, 3, 4, 4, 3, 6 zero
crossings on the first six. Spectral eigenvector 1 is all one sign, peaking at
39 Hz — a brightness. Eigenvector 2 changes sign, low against high — a
frequency shift — and that is the one that finds the tuned channel at 7.95. The
reading generalizes: all-one-sign loadings measure an amount, sign-changing
loadings measure a balance, in any framing.

Note that twelve frequency dimensions carry LESS independent content than six
attributes: 2 components for 90% against 4. Neighbouring bins of a band-limited
wavelet are nearly the same number.

The AASPI documentation errors are recorded in the module's Method tab, where
an instructor will actually see them, rather than only in this file.

### Module 11: what none of it can do

Four failures, all on the same survey:

1. THE ARTIFACT RANKS. The acquisition footprint is PC4 under PCA (0.213 of the
   striping, 7.5% of the variance, excess kurtosis -0.18, separates nothing)
   and IC6 under ICA (0.322). Both methods found it, ranked it, and handed it
   over looking like a result. It entered through peak envelope (0.27) and RMS
   (0.14), so the place to have caught it was the inputs.

2. NOTHING FINDS THE OLDER CHANNEL. Ceiling 1.615, best PC 1.030, best IC
   1.351, best raw attribute 1.445 — the raw attribute beats both methods and
   everything crowds a low ceiling. When that happens the inputs are the limit
   and a third algorithm lands in the same place. Contrast the younger channel:
   ceiling 8.97, best IC 6.47, a large gap where method choice matters.

3. GARBAGE RANKS. The attribute on the wrong interval is the largest loading on
   PC2 at 0.528; its own largest loading is on PC3 at -0.672, where peak
   frequency at 0.682 is marginally larger. Module 03's claim was checked
   against this and stands — the two statements are different questions and
   both are true.

4. THE CONFESSION. Step 5 states plainly that every "channel separation" quoted
   in eleven modules was computed from the model's own record of where the
   channels are, and that no survey supplies it. The four substitutes offered —
   a well, repeatability, reading the loadings, knowing the acquisition
   geometry — share the property that none is a statistic of the components and
   every one brings information from outside the analysis.

Step 1 is a judgment test rather than a score: four unlabelled component maps,
decide which you would present, then reveal. Two of the four are not geology,
and they are the largest component and the fourth largest — neither rank nor
appearance helps. It is the one interactive in the set with no bar to fill, on
purpose.

### The set

Twelve modules, all linked, no "in preparation" cards left. 49 library checks,
twelve harnesses, one invitation test. Companion paper is the eighth in the
SSRN series.
