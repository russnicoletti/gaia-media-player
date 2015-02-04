/**
 * Dependencies
 */

var MediaPlayerHelper = require('./lib/media_player_helper');
  
function registerComponent(name, props) {
  console.log(Date.now() + '-- registering element ' + name);

  var baseElement = Object.create(HTMLElement.prototype);
  var elemProto = Object.assign(baseElement, props);
  
  var elem = document.registerElement(name, { prototype: elemProto });

  console.log('registered element ' + name);

  return elem;
}

var gaiaMediaPlayer = registerComponent('gaia-media-player', {
  /**
   * 'createdCallback' is called when the element is first created.
   */
  createdCallback: function() {
    console.log(Date.now() + '-- createdCallback, gaia-media-player web component, begin');

    var shadowRoot = this.createShadowRoot();
    shadowRoot.innerHTML = this.template;

    var dom = {};
    var ids = ['mediaControlsContainer', 'media-controls'
              ];

    function toCamelCase(str) {
      return str.replace(/\-(.)/g, function replacer(str, p1) {
        return p1.toUpperCase();
      });
    }

    ids.forEach(function createElementRef(name) {
      //var camelName = toCamelCase(name);
      dom[toCamelCase(name)] = shadowRoot.getElementById(name);
      //console.log('loaded ' + camelName + ': ' + dom[camelName]);
    });

    dom.mediaPlayerComponent = this;

    this.mediaPlayerHelper = new MediaPlayerHelper(dom);
    console.log('mediaPlayerHelper: ' + this.mediaPlayerHelper);
    console.log(Date.now() + '-- createdCallback, gaia-media-player web component, end');
  },

  initialize: function(mediaPlayer) {
    console.log('mediaPlayerComponent.initialize begin');
    this.mediaPlayerHelper.initialize(mediaPlayer);
    console.log('mediaPlayerComponent.initialize done');
  },

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
  
  </style>

  <div id="mediaControlsContainer">
    <content select="section,gaia-header"></content>
    <gaia-media-controls id="media-controls"></gaia-media-controls>
  </div>`
});

module.exports = gaiaMediaPlayer

