/* ===========================================================================
   glossary.js — click a term in the prose and read what it means
   Heather Bedle and April Moreno-Ward / University of Oklahoma

   The same file is used unchanged by every teaching repository that carries
   the matching term list below. This copy holds the vocabulary of dimension
   reduction and unsupervised learning.

   Why this set exists: a geologist opening a machine learning paper meets
   feature, sample, dimension, loading, score, embedding, whitening, latent
   variable and explained variance in the first two pages, and none of them
   are defined there. Every one of them is defined here, at the word.

   Each entry is written in two parts, in this order:

     what   — what the quantity is, arithmetically. No geology.
     earth  — what it corresponds to when the features are seismic
              attributes, and what it does not.

   Keeping them apart is deliberate. The arithmetic is always true. The
   association with the subsurface is a common case with exceptions, and the
   two are different kinds of statement.

   License: CC BY-SA 4.0.
   =========================================================================== */

(function () {
  'use strict';

  var TERMS = {
    'feature': {
      aka: ['features'], mod: 'directions', title: 'Module 01',
      what: 'One of the measurements making up a dataset. If four attributes have been computed over the same survey, the dataset has four features.',
      earth: 'A seismic attribute volume is one feature. The word is used in the machine learning literature where an interpreter would say attribute, and the two mean the same thing in this context. Papers also use variable, channel and input for the same idea.'
    },
    'sample': {
      aka: ['samples'], mod: 'directions', title: 'Module 01',
      what: 'One observation, carrying a value for every feature. A dataset of four features and ten thousand samples is a table with four columns and ten thousand rows.',
      earth: 'On a stratal slice each trace position contributes one sample. On a whole volume each voxel does. The count runs into millions quickly, which is why implementations often compute their answer on a decimated subset and then apply it to everything.'
    },
    'dimension': {
      aka: ['dimensions', 'dimensionality'], mod: 'directions', title: 'Module 01',
      what: 'The number of features. A dataset of twelve attributes is twelve-dimensional, whatever its number of samples.',
      earth: 'Nothing about the survey geometry is involved. A 3D seismic survey carrying twelve attributes is a twelve-dimensional dataset, and a 2D line carrying the same twelve is also twelve-dimensional.'
    },
    'feature space': {
      aka: ['attribute space'], mod: 'directions', title: 'Module 01',
      what: 'The space whose axes are the features, in which every sample is a point. Two features give a plane, three give a volume, twelve give a space that cannot be drawn but behaves the same way.',
      earth: 'A crossplot of two attributes is a picture of a two-dimensional feature space. Everything dimension reduction does is a rearrangement of the points in this space, and none of it knows where in the survey any point came from.'
    },
    'dimension reduction': {
      aka: ['dimensionality reduction'], mod: 'directions', title: 'Module 01',
      what: 'Replacing a set of features with a smaller set that keeps as much of the structure as possible, under some definition of structure.',
      earth: 'The practical reason for it is that a display has three color channels and a survey may carry twenty attributes. The definition of structure is what separates one method from another.'
    },
    'projection': {
      aka: ['project', 'projected', 'projections'], mod: 'directions', title: 'Module 01',
      what: 'The position of a sample along a chosen direction, computed as the dot product of the sample with a unit vector pointing that way. One number per sample.',
      earth: 'Projecting a crossplot onto a direction is the same operation as computing a weighted sum of two attribute volumes. The weights are the components of the direction.'
    },
    'variance': {
      aka: ['variances'], mod: 'directions', title: 'Module 01',
      what: 'The average squared distance of the values from their mean. It measures how spread out a set of numbers is, in the square of whatever units they are in.',
      earth: 'A high-variance attribute map has strong contrasts somewhere in it. It does not follow that those contrasts are geological: footprint and noise raise variance exactly as a channel does.'
    },
    'covariance': {
      aka: ['covariance matrix'], mod: 'spread', title: 'Module 02',
      what: 'The average product of two features after both have had their means removed. Positive when they rise together, negative when one rises as the other falls, zero when there is no linear relationship. Collected for every pair, it forms the covariance matrix, which is square and symmetric with the variances on its diagonal.',
      earth: 'Two attributes measuring nearly the same property of the wavelet have a large covariance, and the pair then occupies a thin sliver of the feature space rather than filling it.'
    },
    'correlation': {
      aka: ['correlation matrix', 'correlated', 'uncorrelated'], mod: 'spread', title: 'Module 02',
      what: 'Covariance with each feature divided by its own standard deviation first, giving a number between minus one and one that does not depend on the units. Zero correlation means no linear relationship and does not mean the features are unrelated.',
      earth: 'A correlation matrix is the fastest way to see redundancy in an attribute set before any method is run. Values above about 0.9 between two attributes mean the second is adding very little the first did not already carry.'
    },
    'standardization': {
      aka: ['standardize', 'standardized', 'z-score', 'z-scoring', 'Z-score'], mod: 'units', title: 'Module 03',
      what: 'Subtracting the mean of a feature and dividing by its standard deviation, so that every feature has mean zero and unit variance.',
      earth: 'Without it, an attribute measured in thousands dominates one measured between zero and one, and the first component is simply the loudest attribute. Applying it treats every attribute as equally important, which is a decision rather than a neutral act.'
    },
    'eigenvector': {
      aka: ['eigenvectors'], mod: 'eigen', title: 'Module 04',
      what: 'A direction that a matrix does not rotate, only stretches. For a covariance matrix the eigenvectors are the axes of the cloud, and the amount of stretch along each is its eigenvalue.',
      earth: 'The eigenvectors of an attribute covariance matrix say which weighted combinations of attributes vary most across the survey. They say nothing about which of those combinations corresponds to a rock.'
    },
    'eigenvalue': {
      aka: ['eigenvalues'], mod: 'eigen', title: 'Module 04',
      what: 'The variance of the data along its eigenvector. Eigenvalues are conventionally listed in descending order, so the first is the largest.',
      earth: 'Plotted in order, the eigenvalues form the scree plot, which is what a decision about how many components to keep is usually read from.'
    },
    'loading': {
      aka: ['loadings'], mod: 'eigen', title: 'Module 04',
      what: 'The weights making up one component: how much of each original feature it contains. For PCA the loadings are the eigenvectors.',
      earth: 'Reading the loadings is the only way to know what a component is made of. A component with a large loading on coherence and a small one on amplitude is mostly a coherence image whatever it is called.'
    },
    'score': {
      aka: ['scores'], mod: 'eigen', title: 'Module 04',
      what: 'The value of one component at one sample: the projection of that sample onto the loading vector. The scores are what gets written out as a volume.',
      earth: 'This is where the naming is genuinely ambiguous. Some sources call the loadings the principal components and others call the scores the principal components. Both usages are common and neither is wrong, so the safe question to ask of any figure is which of the two it is showing.'
    },
    'explained variance': {
      aka: ['retained variance', 'variance explained'], mod: 'howmany', title: 'Module 05',
      what: 'The fraction of the total variance carried by a component, equal to its eigenvalue divided by the sum of all of them. The fractions sum to one across all components.',
      earth: 'A common convention is to keep enough components to reach ninety or ninety-five percent. The threshold is a convention and not a result, and a feature occupying a small part of the survey can be geologically important while contributing almost nothing to the total.'
    },
    'scree plot': {
      mod: 'howmany', title: 'Module 05',
      what: 'The eigenvalues plotted in descending order. The name comes from the loose rubble at the foot of a cliff, which the shape of the curve resembles.',
      earth: 'It is read for the point where the curve flattens, on the argument that components past that point are noise. Real scree plots often have no clear break, and the choice is then made on other grounds.'
    },
    'reconstruction': {
      aka: ['reconstruct', 'reconstructed'], mod: 'howmany', title: 'Module 05',
      what: 'Rebuilding the original features from a chosen number of components, by adding back each component multiplied by its loadings. Using all components returns the input exactly.',
      earth: 'The difference between the input and a reconstruction from the first few components is the residual, and looking at the residual as an image is the most direct check on whether anything of interest was discarded.'
    },
    'whitening': {
      aka: ['whiten', 'whitened', 'sphering'], mod: 'independence', title: 'Module 07',
      what: 'Projecting onto the eigenvectors and then dividing each projection by the square root of its eigenvalue, so the data have unit variance in every direction and no correlation between any pair. The cloud becomes a round ball.',
      earth: 'It is the step that makes ICA possible. Once every direction carries the same variance, variance can no longer be used to choose between directions, and the only thing left to distinguish one rotation from another is the shape of the distributions.'
    },
    'higher-order statistics': {
      aka: ['higher order statistics'], mod: 'independence', title: 'Module 07',
      what: 'Statistics beyond the mean and the variance, involving third and fourth powers. They describe the shape of a distribution rather than its position or its width.',
      earth: 'PCA uses second-order statistics only and is therefore blind to shape. Two attribute sets with identical covariance matrices can have completely different distributions, and ICA is a method for telling them apart.'
    },
    'kurtosis': {
      mod: 'independence', title: 'Module 07',
      what: 'A fourth-order statistic measuring how peaked a distribution is and how heavy its tails are. Excess kurtosis is zero for a Gaussian, positive for a sharply peaked distribution, and negative for a flat-topped one.',
      earth: 'It is cheap to compute and sensitive to outliers, because a fourth power gives a single extreme sample a large influence. A few bad traces can dominate it.'
    },
    'negentropy': {
      mod: 'independence', title: 'Module 07',
      what: 'A measure of how far a distribution is from the Gaussian of the same variance. It is never negative and is exactly zero only for a Gaussian.',
      earth: 'Estimating it directly requires the whole distribution, so implementations use an approximation built from one or two simple functions. It is more robust to outliers than kurtosis and is what most seismic ICA implementations maximize.'
    },
    'non-Gaussian': {
      aka: ['non-gaussian', 'Gaussian', 'gaussian', 'normal distribution'], mod: 'independence', title: 'Module 07',
      what: 'A distribution whose shape differs from the bell curve. The Gaussian is the distribution of maximum entropy for a given variance, which makes it the least structured shape a set of numbers can have.',
      earth: 'A sum of many independent contributions tends toward a Gaussian, so a mixture of sources looks more Gaussian than the sources did. Undoing that is what ICA searches for, and it also means the method has nothing to work with when the sources themselves are Gaussian.'
    },
    'independence': {
      aka: ['independent', 'statistically independent'], mod: 'independence', title: 'Module 07',
      what: 'Two features are independent when knowing one tells you nothing about the other, at any order. This is stronger than being uncorrelated, which only requires that knowing one tells you nothing about the other on average and in a straight line.',
      earth: 'Decorrelation is what PCA delivers. Independence is what ICA aims at. Uncorrelated features can still be strongly dependent, and a crossplot of two such features shows a structure that has no tilt to it.'
    },
    'mixing matrix': {
      aka: ['unmixing matrix'], mod: 'ica', title: 'Module 08',
      what: 'The set of weights by which underlying sources are assumed to have been combined into the measured features. The unmixing matrix is its inverse, and recovering it is the goal of ICA.',
      earth: 'The assumption that the mixing is linear and constant across the survey is a strong one. Where two geological effects combine in a way that varies laterally, no single unmixing matrix describes the whole area.'
    },
    'latent variable': {
      aka: ['latent variables'], mod: 'ica', title: 'Module 08',
      what: 'A quantity that is not measured directly but is assumed to underlie what was measured. Dimension reduction methods differ in what they assume about them.',
      earth: 'A thickness, a fluid fill and a degree of cementation are latent variables behind an attribute set. Nothing guarantees that a recovered component corresponds to one of them, and checking whether it does is interpretation rather than arithmetic.'
    },
    'embedding': {
      mod: 'notgeology', title: 'Module 11',
      what: 'The set of coordinates a method assigns to each sample in its reduced space. A two-dimensional embedding gives each sample two numbers.',
      earth: 'The word is used for the output of nonlinear methods where component would be misleading. The axes of a nonlinear embedding usually have no consistent meaning across the plot, which is why distances in one are read with more caution than distances in a PCA plot.'
    },
    'unsupervised': {
      aka: ['unsupervised learning', 'supervised'], mod: 'notgeology', title: 'Module 11',
      what: 'A method that works from the data alone, with no labeled examples of what the right answer looks like. Supervised methods are given labeled examples and learn to reproduce them.',
      earth: 'Everything in this module set is unsupervised, which is why nothing in it can tell you that a component is a channel. It has never been shown one.'
    },
    /* ===================================================================
       SEISMIC TERMS

       This set is about dimension reduction, not about seismic attributes,
       and it runs on attributes a student may not have met. Rather than
       explaining each one in the prose and slowing down a reader who already
       knows them, they are defined here and each entry points at the module
       set where the attribute itself is taught properly.

       Same two-part structure as everything above: what the quantity is
       arithmetically, then what it tends to correspond to in the earth.
       =================================================================== */

    'seismic trace': {
      aka: ['trace', 'traces'], url: 'https://hbedle-subsurface.github.io/seismic_resolution',
      title: 'the seismic resolution modules',
      what: 'The recorded amplitude at one surface location as a function of time. One trace is one column of numbers.',
      earth: 'Each trace in this set contributes one sample to every cloud of points: its attributes are its coordinates. A survey of 5184 traces is a cloud of 5184 points.'
    },
    'wavelet': {
      aka: ['wavelets', 'Ricker'], url: 'https://hbedle-subsurface.github.io/seismic_resolution',
      title: 'the seismic resolution modules',
      what: 'The short oscillating pulse the source puts into the ground, as it appears after processing. A Ricker wavelet is a common idealized form, described by its peak frequency.',
      earth: 'The earth reflects at every impedance contrast, and what is recorded is a wavelet at each one, summed. Everything an attribute measures is measured on that sum rather than on the reflectivity itself.'
    },
    'acoustic impedance': {
      aka: ['impedance'], url: 'https://hbedle-subsurface.github.io/avo-basics',
      title: 'the AVO and rock physics modules',
      what: 'Density multiplied by velocity, for a given rock. It is a property of the rock rather than of the seismic data.',
      earth: 'Reflections occur where impedance changes. A sand filled with hydrocarbon generally has lower density and often lower velocity than the shale around it, so its impedance is lower and the reflection at its top is negative.'
    },
    'reflection coefficient': {
      aka: ['reflectivity'], url: 'https://hbedle-subsurface.github.io/avo-basics',
      title: 'the AVO and rock physics modules',
      what: 'The fraction of energy returned at an interface, for normal incidence the difference in impedance across it divided by the sum.',
      earth: 'The channel sand in this set is given a lower impedance than the shale enclosing it, so the top of the channel is a negative reflection and its base a positive one.'
    },
    'two-way time': {
      aka: ['TWT', 'travel time'], url: 'https://hbedle-subsurface.github.io/seismic_resolution',
      title: 'the seismic resolution modules',
      what: 'The time for energy to travel down to a reflector and back. Seismic data are recorded in it, so a thickness measured on a trace is in milliseconds rather than metres.',
      earth: 'Converting it to thickness needs a velocity. The bed thicknesses quoted in module 02 are in two-way time for that reason.'
    },
    'thin bed': {
      aka: ['thin beds', 'tuning', 'tuning thickness'],
      url: 'https://hbedle-subsurface.github.io/seismic_resolution',
      title: 'the seismic resolution modules',
      what: 'A layer thin enough that the reflections from its top and base overlap in time instead of arriving separately.',
      earth: 'As the bed thins toward that point the two reflections reinforce and the amplitude rises; below it they begin to cancel and the amplitude falls again. The thickness at the maximum is the tuning thickness. This is why amplitude is not a monotonic measure of thickness, which is the subject of module 02 step 5.'
    },
    'stratal slice': {
      aka: ['stratal slab', 'horizon slice', 'time slice'],
      url: 'https://hbedle-subsurface.github.io/geometric-attributes',
      title: 'the geometric attributes modules',
      what: 'A map extracted from a seismic volume along a surface, rather than at a fixed time. Attributes in this set are computed in a window and displayed as one value per trace, which is a map of that kind.',
      earth: 'Following a depositional surface keeps the same geological interval in the window across the survey. A flat window across dipping strata mixes different intervals together, which is a simplification this set makes and states.'
    },
    'analytic trace': {
      aka: ['complex trace', 'Hilbert transform'],
      url: 'https://hbedle-subsurface.github.io/single-trace',
      title: 'the single-trace attributes modules',
      what: 'The trace paired with a copy of itself shifted ninety degrees in phase, treated as one complex signal. Its magnitude is the envelope and the rate of change of its phase is the instantaneous frequency.',
      earth: 'It is the machinery behind most of the attributes computed from a single trace, and it is how the envelope in this set is calculated.'
    },
    'envelope': {
      aka: ['peak envelope', 'instantaneous amplitude', 'reflection strength'],
      url: 'https://hbedle-subsurface.github.io/single-trace',
      title: 'the single-trace attributes modules',
      what: 'The magnitude of the analytic trace: a smooth positive curve tracing the outline of the wiggle, independent of where the peaks and troughs happen to fall.',
      earth: 'It responds to the strength of a reflection without being sensitive to its polarity or to small shifts in phase, so a bright event is bright in the envelope whichever way up it is. In this set the attribute used is the largest envelope value in the analysis window.'
    },
    'RMS amplitude': {
      aka: ['root mean square amplitude', 'RMS'],
      url: 'https://hbedle-subsurface.github.io/single-trace',
      title: 'the single-trace attributes modules',
      what: 'The square root of the mean of the squared samples in a window. Squaring first means large samples count for much more than small ones and the sign is discarded.',
      earth: 'A standard measure of how strong the reflections are over an interval. It rises where impedance contrasts are large, and also where a bed is near its tuning thickness, so a bright RMS map has more than one possible cause.'
    },
    'mean absolute amplitude': {
      aka: ['mean absolute'], url: 'https://hbedle-subsurface.github.io/single-trace',
      title: 'the single-trace attributes modules',
      what: 'The average of the absolute values in a window. The same idea as RMS amplitude without the squaring, so extreme samples carry less weight.',
      earth: 'It correlates with RMS amplitude at 0.96 on this survey, which is why module 02 uses the pair as its example of two attributes that are almost the same measurement.'
    },
    'peak frequency': {
      aka: ['dominant frequency'], url: 'https://hbedle-subsurface.github.io/spectral-attributes',
      title: 'the spectral attributes modules',
      what: 'The frequency at which the magnitude spectrum of a windowed piece of trace is largest.',
      earth: 'A thin bed reinforces some frequencies and cancels others, so tuning shifts the peak frequency as well as changing the amplitude. That is why it separates the channel in this set better than any other single attribute.'
    },
    'spectral bandwidth': {
      aka: ['bandwidth'], url: 'https://hbedle-subsurface.github.io/spectral-attributes',
      title: 'the spectral attributes modules',
      what: 'How spread out the magnitude spectrum is about its own mean frequency, computed as an amplitude-weighted standard deviation.',
      earth: 'A single clean reflection has a broad spectrum resembling the wavelet. Interference between closely spaced reflections narrows it or notches it, so bandwidth carries information about layering that amplitude alone does not.'
    },
    'spectral decomposition': {
      aka: ['spectral magnitude', 'magnitude spectrum'],
      url: 'https://hbedle-subsurface.github.io/spectral-attributes',
      title: 'the spectral attributes modules',
      what: 'Breaking each trace into its frequency components and producing a volume for each frequency, rather than one volume of broadband amplitude.',
      earth: 'It generally produces ten or more volumes from one, which is exactly the situation this module set exists for. Module 10 treats those frequencies as the dimensions and reduces them.'
    },
    'sweetness': {
      url: 'https://hbedle-subsurface.github.io/single-trace',
      title: 'the single-trace attributes modules',
      what: 'The envelope divided by the square root of the peak frequency.',
      earth: 'Introduced by Radovich and Oliveros (1998) on the argument that a clean sand in a shale section tends to be both brighter and lower in frequency than its surroundings, so dividing one by the other emphasizes it. It combines two attributes already in the set, which is a form of redundancy worth noticing in a correlation matrix.'
    },
    'coherence': {
      aka: ['semblance', 'similarity', 'discontinuity'],
      url: 'https://hbedle-subsurface.github.io/geometric-attributes',
      title: 'the geometric attributes modules',
      what: 'How similar neighbouring traces are to each other over a window. The version used here is the semblance of a three-by-three group: the energy of the summed traces divided by the summed energy of the traces, which is one where they agree exactly and lower where they disagree.',
      earth: 'It is low where waveforms change laterally, which happens at faults, at channel margins and at any abrupt change of facies. It is also low where strata dip steeply, unless the calculation follows the dip, and the version in this set does not.'
    },
    'amplitude gradient': {
      aka: ['edge detection', 'Sobel'], url: 'https://hbedle-subsurface.github.io/geometric-attributes',
      title: 'the geometric attributes modules',
      what: 'The size of the lateral rate of change of an attribute map, computed here with a Sobel stencil on the RMS amplitude map.',
      earth: 'It is large wherever a map changes quickly from place to place, which for a channel is its margin rather than its axis. It correlates with coherence at minus 0.79 on this survey, since both respond to lateral change.'
    },
    'GLCM': {
      aka: ['GLCM contrast', 'GLCM homogeneity', 'texture attribute', 'grey-level co-occurrence'],
      url: 'https://hbedle-subsurface.github.io/geometric-attributes',
      title: 'the geometric attributes modules',
      what: 'A texture measure. The map is quantized into a small number of levels, how often each pair of levels occurs side by side is counted in a moving window, and statistics are formed from those counts. Contrast is large where neighbouring values differ; homogeneity is large where they agree.',
      earth: 'Texture attributes respond to the character of a reflection pattern rather than to its strength, so they can separate a chaotic facies from a well layered one at the same amplitude. Haralick et al. (1973) defined the standard set.'
    },
    'acquisition footprint': {
      aka: ['footprint'], url: 'https://hbedle-subsurface.github.io/geometric-attributes',
      title: 'the geometric attributes modules',
      what: 'A regular pattern in a seismic volume that follows the geometry of the survey rather than the geology, usually periodic along the shooting and receiver directions.',
      earth: 'It is strong, consistent across the whole survey and periodic, which makes it exactly the kind of thing a variance-maximizing method collects and ranks. Module 11 finds it arriving as a component under both methods.'
    },
    'seismic facies': {
      aka: ['facies', 'facies classification'], mod: 'notgeology', title: 'Module 11',
      what: 'A grouping of the seismic response into classes intended to correspond to depositional or lithological units.',
      earth: 'Unsupervised classification of attributes into facies is the usual destination of the components this set produces. Which components are fed in decides what the classifier can possibly separate.'
    },
    'multi-attribute analysis': {
      aka: ['multi-dimensional attribute analysis', 'attribute selection'],
      mod: 'toomany', title: 'Module 00',
      what: 'Interpreting several seismic attribute volumes together rather than one at a time, on the argument that a geological feature may be clear in a combination of attributes while being ambiguous in each one separately.',
      earth: 'It is the practical reason this module set exists. An interpreter can readily end up with ten or more attribute volumes over one interval, most of them partly redundant, and no way to display or interpret them at once.'
    }

  };

  /* =====================================================================
     MARKING THE TEXT
     ===================================================================== */

  /* Where a module lives, seen from the page doing the asking. */
  var PREFIX = /\/modules\//.test(location.pathname) ? '' : 'modules/';

  /* One flat list of every spelling, longest first, so that "peak frequency"
     is matched before "frequency" would be. */
  var INDEX = [];
  (function () {
    for (var key in TERMS) {
      if (!Object.prototype.hasOwnProperty.call(TERMS, key)) continue;
      INDEX.push({ text: key, key: key });
      var aka = TERMS[key].aka || [];
      for (var i = 0; i < aka.length; i++) INDEX.push({ text: aka[i], key: key });
    }
    INDEX.sort(function (a, b) { return b.text.length - a.text.length; });
  })();

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* Text worth marking: the explanatory prose of each step. Headings, labels,
     controls, references and the term list itself are left alone. */
  var SCOPE_SEL = '.tabpane p.lede, .tabpane p.qbox, .tabpane .legend span, .tabpane li';
  var SKIP_TAGS = { A: 1, BUTTON: 1, CODE: 1, LABEL: 1, H1: 1, H2: 1, H3: 1, H4: 1, SUMMARY: 1 };

  function markScope(root, seen) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      var bad = false, p = n.parentNode;
      while (p && p !== root) {
        if (SKIP_TAGS[p.tagName] || (p.className && String(p.className).indexOf('gterm') >= 0)) {
          bad = true; break;
        }
        p = p.parentNode;
      }
      if (!bad && n.nodeValue && n.nodeValue.trim()) nodes.push(n);
    }

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      for (var j = 0; j < INDEX.length; j++) {
        var entry = INDEX[j];
        if (seen[entry.key]) continue;
        var re = new RegExp('(^|[^A-Za-z-])(' + escapeRe(entry.text) + ')(?![A-Za-z-])', 'i');
        var m = re.exec(node.nodeValue);
        if (!m) continue;
        var at = m.index + m[1].length;
        var after = node.splitText(at);
        after.splitText(m[2].length);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gterm';
        btn.setAttribute('data-term', entry.key);
        btn.textContent = after.nodeValue;
        after.parentNode.replaceChild(btn, after);
        seen[entry.key] = true;
        break;   // one node, one mark; the rest of it is left as it was
      }
    }
  }

  function markAll() {
    var panes = document.querySelectorAll('.tabpane');
    for (var i = 0; i < panes.length; i++) {
      if (panes[i].id === 'pk' || panes[i].id === 'pm') continue;  // definitions, references
      var seen = {};
      var scopes = panes[i].querySelectorAll(SCOPE_SEL);
      for (var j = 0; j < scopes.length; j++) markScope(scopes[j], seen);
    }
  }

  /* =====================================================================
     THE CARD
     ===================================================================== */

  var CSS = [
    '.gterm { font: inherit; color: inherit; background: none; padding: 0;',
    '  border: 0; border-bottom: 1px dotted var(--crimson,#841617); cursor: help; }',
    '.gterm:hover, .gterm:focus { background: rgba(132,22,23,.07); outline: none; }',
    '.gcard { position: absolute; z-index: 60; max-width: 380px;',
    '  background: var(--paper,#fff); border: 1px solid var(--rule,#C9CDD2);',
    '  box-shadow: 0 10px 26px -12px rgba(22,25,28,.5); padding: 14px 16px 12px; }',
    '.gcard h4 { font-family: var(--display,Archivo,sans-serif); font-size: 14.5px;',
    '  margin: 0 0 8px; color: var(--ink,#16191C); }',
    '.gcard p { font-size: 13px; line-height: 1.62; margin: 0 0 8px;',
    '  color: var(--ink,#16191C); }',
    '.gcard p.g-earth { color: var(--slate,#5C6670); }',
    '.gcard .g-tag { font-family: var(--mono,monospace); font-size: 9.5px;',
    '  letter-spacing: .1em; text-transform: uppercase;',
    '  color: var(--crimson,#841617); display: block; margin-bottom: 3px; }',
    '.gcard .g-foot { display: flex; gap: 10px; align-items: center;',
    '  justify-content: space-between; margin-top: 10px; padding-top: 9px;',
    '  border-top: 1px solid var(--rule,#C9CDD2); font-size: 12px; }',
    '.gcard button.g-x { border: 0; background: none; cursor: pointer;',
    '  font: inherit; color: var(--slate,#5C6670); text-decoration: underline; }'
  ].join('\n');

  var card = null;

  function injectStyle() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function entryHtml(key) {
    var t = TERMS[key];
    return '<h4>' + key.replace(/^./, function (c) { return c.toUpperCase(); }) + '</h4>' +
      '<p><span class="g-tag">What it is</span>' + t.what + '</p>' +
      '<p class="g-earth"><span class="g-tag">In the rocks</span>' + t.earth + '</p>';
  }

  function closeCard() {
    if (card && card.parentNode) card.parentNode.removeChild(card);
    card = null;
  }

  function showCard(btn) {
    closeCard();
    var key = btn.getAttribute('data-term');
    var t = TERMS[key];
    if (!t) return;

    card = document.createElement('div');
    card.className = 'gcard';
    card.innerHTML = entryHtml(key) +
      '<div class="g-foot">' +
        '<a href="' + (t.url ? t.url : PREFIX + t.mod + '.html') + '"' +
          (t.url ? ' target="_blank" rel="noopener"' : '') + '>' +
          (t.url ? 'Covered in ' : 'Introduced in ') + t.title + '</a>' +
        '<span><button type="button" class="g-x" data-act="keep">Keep in a window</button> ' +
        '<button type="button" class="g-x" data-act="close">Close</button></span>' +
      '</div>';
    document.body.appendChild(card);

    var r = btn.getBoundingClientRect();
    var top = r.bottom + window.pageYOffset + 8;
    var left = r.left + window.pageXOffset;
    var overflow = (left + card.offsetWidth) - (window.pageXOffset + document.documentElement.clientWidth - 16);
    if (overflow > 0) left -= overflow;
    card.style.top = top + 'px';
    card.style.left = Math.max(8, left) + 'px';

    card.addEventListener('click', function (ev) {
      var act = ev.target.getAttribute && ev.target.getAttribute('data-act');
      if (act === 'close') closeCard();
      if (act === 'keep') { keep(key); closeCard(); }
    });
  }

  /* =====================================================================
     THE REFERENCE WINDOW

     One window per module, and terms accumulate in it, so a reader working
     through a step can collect the four words they did not know and keep
     them side by side with the module.
     ===================================================================== */

  var ref = null;

  function headLinks() {
    var out = '';
    var links = document.querySelectorAll('head link[rel="stylesheet"], head link[rel="preconnect"]');
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      out += '<link rel="' + l.rel + '" href="' + l.href + '"' +
             (l.crossOrigin ? ' crossorigin' : '') + '>\n';
    }
    return out;
  }

  function keep(key) {
    if (!ref || ref.closed) {
      var name = 'glossary_' + (location.pathname || 'm').replace(/[^A-Za-z0-9]+/g, '_');
      try {
        ref = window.open('', name, 'width=460,height=680,scrollbars=yes,resizable=yes');
      } catch (e) { ref = null; }
      if (!ref) return;
      ref.document.open();
      ref.document.write('<!doctype html>\n<html lang="en">\n<head>\n' +
        '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
        '<title>Terms</title>\n' + headLinks() +
        '<style>\nbody { margin:0; padding:20px; background:var(--paper,#fff); }\n' + CSS +
        '\n.gcard { position:static; max-width:none; box-shadow:none; margin:0 0 14px; }\n' +
        '.g-foot { display:none; }\n' +
        'h1 { font-family:var(--display,Archivo,sans-serif); font-size:16px; margin:0 0 14px;\n' +
        '  padding-bottom:10px; border-bottom:1px solid var(--rule,#d8d8d8); }\n</style>\n' +
        '</head>\n<body>\n<h1>Terms from this module</h1>\n<div id="gList"></div>\n</body>\n</html>');
      ref.document.close();
    }
    var list = ref.document.getElementById('gList');
    if (!list) return;
    if (list.querySelector('[data-key="' + key + '"]')) { ref.focus(); return; }
    var d = ref.document.createElement('div');
    d.className = 'gcard';
    d.setAttribute('data-key', key);
    d.innerHTML = entryHtml(key);
    list.appendChild(d);
    ref.focus();
  }

  /* =====================================================================
     WIRING
     ===================================================================== */

  function init() {
    if (!document.querySelector('.tabpane')) return;
    injectStyle();
    markAll();

    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t && t.classList && t.classList.contains('gterm')) { showCard(t); return; }
      if (card && !card.contains(t)) closeCard();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeCard();
    });
    window.addEventListener('resize', closeCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
