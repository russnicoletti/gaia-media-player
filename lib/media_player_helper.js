'use strict';

function MediaPlayerHelper(dom) {
  console.log('MediaPlayerHelper constructor begin');
  this.dom = dom;
  this.mediaPlayer = null;
  this.controlFadeTimeout = null; 
  console.log('MediaPlayerHelper constructor end');
}

MediaPlayerHelper.prototype = {

  initialize: function(mediaPlayer) {
  
    console.log('mediaPlayerHelper initialize begin!!!!!!!!!!!!!!!!!!');

    this.mediaPlayer = mediaPlayer;

    console.log('before mediaControls.initialize, mediaControls: ' + this.dom.mediaControls);
    this.dom.mediaControls.initialize(mediaPlayer);
    console.log('after mediaControls.initialize');

    this.dom.mediaControlsContainer.addEventListener(
      'click', toggleVideoControls.bind(this), true);

    // Add listeners for video controls web component
    //
    // play, pause
    this.dom.mediaControls.addEventListener('play-button-click',
      handlePlayButtonClick);

    // Fullscreen button (tablet only)
    this.dom.mediaControls.addEventListener('fullscreen-button-click',
      toggleFullscreenPlayer);
 
    /* 
    this.dom.playerHeader.addEventListener('action', handleCloseButtonClick);
    this.dom.pickerDone.addEventListener('click', postPickResult);
    this.dom.options.addEventListener('click', showOptionsView);
    */
    console.log('mediaPlayerHelper initialize done!!!!!!!!!!!!!!!!!!');
  }
};

function handlePlayButtonClick() {
}

function toggleFullscreenPlayer() {
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
  if (!this.dom.mediaPlayerComponent.pendingPick) {
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

  // Respect if app indicates the media controls should not be hidden
  // (as the video app does when on tablet in landscape mode showing
  // the list view).
  if (this.dom.mediaPlayerComponent.allowHidingControls) {
    this.dom.mediaControlsContainer.classList[visible ? 'remove' : 'add']('hidden');

    // Let the media controls know whether it is visible
    this.dom.mediaControls.hidden = !visible;

  } else {
    this.dom.mediaControls.hidden = false;
  }
}

module.exports = MediaPlayerHelper;

