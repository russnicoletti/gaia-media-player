/**
 * Dependencies
 */

var Component = require('gaia-component');
var dom = {};

var VideoPlayer = Component.register('gaia-video-player', {

  created: function() {
    console.log('************ begin created, gaia-video-player web component ************');

    var shadowRoot = this.setupShadowRoot();

    var ids = ['mediaControlsContainer', 'media-controls', 'video-container',
               'player'
              ];

    function toCamelCase(str) {
      return str.replace(/\-(.)/g, function replacer(str, p1) {
        return p1.toUpperCase();
      });
    }

    ids.forEach(function getElementRef(name) {
      var camelName = toCamelCase(name);
      dom[toCamelCase(name)] = shadowRoot.getElementById(name);
    });

    console.log('videoContainer.clientWidth: ' + dom.videoContainer.clientWidth);  
    console.log('videoContainer.clientHeight: ' + dom.videoContainer.clientHeight);

    this.videoPlayerImpl = new VideoPlayerImpl(dom, this);
    console.log('************ end created, gaia-video-player web component ************');
  },

  getVideoContainerDimensions: function() {
    console.log('************ getVideoContainerDimensions ***********');
    console.log('videoContainer.clientWidth: ' + dom.videoContainer.clientWidth);  
    console.log('videoContainer.clientHeight: ' + dom.videoContainer.clientHeight);
    console.log('mediaControlsContainer.clientWidth: ' + dom.mediaControlsContainer.clientWidth);  
    console.log('mediaControlsContainer.clientHeight: ' + dom.mediaControlsContainer.clientHeight);
    console.log('************ getVideoContainerDimensions ***********');
  },

  initialize: function(videoTitle) {
    console.log('************* begin videoPlayerComponent initialize **************');

    // video title is owned by the app, is set by the app
    if (videoTitle) {
      dom.videoTitle = videoTitle;
    }
  },

  load: function(url) { this.videoPlayerImpl.load(url); },

  play: function() { this.videoPlayerImpl.play(); },

  pause: function() { this.videoPlayerImpl.pause(); },

  allowHidingControls: true,

  template: `

  <style>

  /*
   * while videoControls are hidden, they should stay on screen for mousedown events
   */
  #mediaControlsContainer.hidden {
    display: block;
    visibility: visible;
  }

  /*
   * TODO -- This is a comment that came from video.css:
   *
   * "In view.html (but not index.html) we put the in-use-overlay element
   * inside mediaControls. In that case there is a 5rem title bar that needs
   * to be visible, so we alter the top position. And if we're handling
   * a pick activity, we also need the title bar with the back button to show."
   *
   * We don't want the in-use-overlay in the mediaControlsContainer -- it was
   * never part of the mediaControlsContainer in index.html so I don't see why
   * it needs to be part of the mediaControlsContainer in view.html; it should
   * not be so that the css can be consistent.
   */

  /* video player controls */
  #mediaControlsContainer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    opacity: 1;
    will-change: opacity;
    -moz-transition: opacity 0.5s;
  }
  #mediaControlsContainer.hidden {
    opacity: 0;
  }

  #mediaControlsContainer.hidden > * {
    pointer-events: none;
  }

  #video-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  #player {
    /* size and position are set in JS depending on*/
    /* video size and screen orientation */
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    z-index: 10;
  }

  </style>

  <div id="video-container">
     <video src="about:blank" id="player"></video>
  </div>
  <div id="mediaControlsContainer">
    <content select="section"></content>
    <gaia-media-controls id="media-controls"></gaia-media-controls>
  </div>`
});

module.exports = VideoPlayer

function VideoPlayerImpl(dom, videoPlayerComponent) {
  console.log('VideoPlayerImpl constructor begin');
  this.dom = dom;
  this.controlFadeTimeout = null;
  this.foo = 'bar';
  this.videoPlayerComponent = videoPlayerComponent; 

  initializeMediaControls.call(this);

  console.log('VideoPlayerImpl constructor end');
}

VideoPlayerImpl.prototype.load = function(options) {

  for (var key in options) {
    console.log('options[' + key + ']: ' + options[key]);
  }

  var url = options.url;
  var mediaFile = options.mediaFile;
  var showControls = options.showControls;
  var keepControls = options.keepControls;
  var restoreTime = options.restoreTime;

  function doneSeeking() {
    console.log('doneSeeking');
    this.dom.player.onseeked = null;

    // show video player after seeking is done
    this.dom.player.hidden = false;

    if (showControls) {
      setControlsVisibility.call(this, true);

      if (!keepControls) {
        //scheduleVideoControlsAutoHiding.call(this);
      }
    }

    this.videoPlayerComponent.dispatchEvent(
      new CustomEvent('media-loaded'));
  }

  function handleLoadedMetadata() {
    console.log('handleLoadedMetadata, mediaFile: ' + mediaFile);

    // We only want the 'loadedmetadata' handler to execute when a video
    // is explicitly loaded. To prevent unwanted side affects, for
    // example, when the video app is sent to the background and then to the
    // foreground, where gecko sends a 'loadedmetadata' event (among others),
    // we clear the 'loadedmetadata' event handler after the event fires.
    this.dom.player.onloadedmetadata = null;

    var rotation;
    if ('metadata' in mediaFile) {
      if (mediaFile.metadata.currentTime === this.dom.player.duration) {
        mediaFile.metadata.currentTime = 0;
      }

      if (this.dom.videoTitle) {
        this.dom.videoTitle.textContent = mediaFile.metadata.title;
      }

      // restoreTime takes precedence
      this.dom.player.currentTime = restoreTime || mediaFile.metadata.currentTime || 0;
      rotation = mediaFile.metadata.rotation;
    } else {
      this.dom.videoTitle.textContent = mediaFile.title || '';
      this.dom.player.currentTime = restoreTime || 0;
      rotation = 0;
    }

    fitContainer(this.dom.videoContainer, this.dom.player,
                 rotation || 0);

    if (this.dom.player.seeking) {
      this.dom.player.onseeked = doneSeeking.bind(this);
    } else {
      doneSeeking.call(this);
    }
  }

  //loadingChecker.ensureVideoLoads(handleLoadedMetadata);
  this.dom.player.onloadedmetadata = handleLoadedMetadata.bind(this);
  this.dom.player.hidden = true;
  this.dom.player.preload = 'metadata';
  this.dom.player.src = url;
};

VideoPlayerImpl.prototype.play = function() {
  console.log('playing video...');
  this.dom.player.play();
};

VideoPlayerImpl.prototype.pause = function() {
  console.log('pausing video...');
  this.dom.player.pause();
};

function initializeMediaControls() {

  console.log('before mediaControls.initialize, mediaControls: ' + this.dom.mediaControls);
  this.dom.mediaControls.initialize(this.dom.player);
  console.log('after mediaControls.initialize');

  this.dom.mediaControlsContainer.addEventListener(
    'click', toggleVideoControls.bind(this), true);

  // Add listeners for video controls web component
  //
  // play, pause
  this.dom.mediaControls.addEventListener('play-button-click',
    handlePlayButtonClick.bind(this));

  // Fullscreen button (tablet only)
  this.dom.mediaControls.addEventListener('fullscreen-button-click',
    toggleFullscreenPlayer);

  /* 
  this.dom.playerHeader.addEventListener('action', handleCloseButtonClick);
  this.dom.pickerDone.addEventListener('click', postPickResult);
  this.dom.options.addEventListener('click', showOptionsView);
  */
  console.log('videoPlayerImpl initializeMediaControls done!!!!!!!!!!!!!!!!!!');
}

function fitContainer(container, player, videoRotation) {
  console.log('fitContainer');

  var containerWidth = container.clientWidth;
  var containerHeight = container.clientHeight;

  console.log('containerWidth: ' + containerWidth);  
  console.log('containerHeight: ' + containerHeight);  

  // Don't do anything if we don't know our size.
  // This could happen if we get a resize event before our metadata loads
  if (!player.videoWidth || !player.videoHeight)
    return;

  var width, height; // The size the video will appear, after rotation
  var rotation = videoRotation || 0;

  switch (rotation) {
  case 0:
  case 180:
    width = player.videoWidth;
    height = player.videoHeight;
    break;
  case 90:
  case 270:
    width = player.videoHeight;
    height = player.videoWidth;
  }

  var xscale = containerWidth / width;
  var yscale = containerHeight / height;
  var scale = Math.min(xscale, yscale);

  // scale large videos down and scale small videos up
  // this might result in lower image quality for small videos
  width *= scale;
  height *= scale;

  var left = ((containerWidth - width) / 2);
  var top = ((containerHeight - height) / 2);

  /*
   * The translate and scale only takes a number + length unit. According to
   * MDN's number definition, the scientific notation, 2.1234e-14, is not a
   * valid value. To prevent that, we use toFixed(4) to round at the 4th
   * digits after decimal point.
   */
  var transform;
  switch (rotation) {
  case 0:
    transform = 'translate(' + left.toFixed(4) + 'px,' +
                               top.toFixed(4) + 'px)';
    break;
  case 90:
    transform =
      'translate(' + (left + width).toFixed(4) + 'px,' +
                     top.toFixed(4) + 'px) ' +
      'rotate(90deg)';
    break;
  case 180:
    transform =
      'translate(' + (left + width).toFixed(4) + 'px,' +
                     (top + height).toFixed(4) + 'px) ' +
      'rotate(180deg)';
    break;
  case 270:
    transform =
      'translate(' + left.toFixed(4) + 'px,' +
                     (top + height).toFixed(4) + 'px) ' +
      'rotate(270deg)';
    break;
  }

  player.style.transform = transform;
}

function handlePlayButtonClick() {
  console.log('play video!!');
  // TODO add code from video.js play/pause function
  if (this.dom.player.paused) {
    this.dom.player.play();
  }
  else {
    this.dom.player.pause();
  }
}

function toggleFullscreenPlayer() {
}

function scheduleVideoControlsAutoHiding() {
  console.log('scheduleVideoControlsAutoHiding: ' + scheduleVideoControlsAutoHiding);

  this.controlFadeTimeout = setTimeout(function() {
    console.log('controlFadeTimeout, calling setContronsVisibility');
    setControlsVisibility.call(this, false);
  }, 250);
}

function toggleVideoControls(e) {
  // When we change the visibility state of video controls, we need to check the
  // timeout of auto hiding.
  if (this.controlFadeTimeout) {
    clearTimeout(this.controlFadeTimeout);
    this.controlFadeTimeout = null;
  }
  // We cannot change the visibility state of video controls when we are in
  // picking mode.
  if (!this.videoPlayerComponent.pendingPick) {
    if (this.dom.mediaControls.hidden) {
      // If control not shown, tap any place to show it.
      setControlsVisibility.call(this, true);
      e.cancelBubble = true;
    } else if (e.originalTarget === this.dom.mediaControlsContainer) {
      // If control is shown, only tap the empty area should show it.
      setControlsVisibility.call(this, false);
    }
  }
}

function setControlsVisibility(visible) {

  console.log('setControlsVisibility, visible: ' + visible);

  // Respect if app indicates the media controls should not be hidden
  // (as the video app does when on tablet in landscape mode showing
  // the list view).
  if (this.videoPlayerComponent.allowHidingControls) {
    this.dom.mediaControlsContainer.classList[visible ? 'remove' : 'add']('hidden');

    // Let the media controls know whether it is visible
    this.dom.mediaControls.hidden = !visible;

  } else {
    this.dom.mediaControls.hidden = false;
  }
}

module.exports = VideoPlayerImpl;


