// ==========================================================================
// Prezzideo
// prezzideo.js v0.1
// https://github.com/frenski/prezzideo
// License: The MIT License (MIT)
// ==========================================================================

(function( api, undefined ) { 
	
	/* 
		Private Properties ----------------------------------------------------
	*/
	var config;
	
	var defaults = {
		dom: {
			container:'.prezzideo',
			slidesContainer: '.prezzideo-slides',
			slideItem:'.prezzideo-slides-item',
			slideVClass: 'prezzideo-slide-vertical',
			slideHClass: 'prezzideo-slide-horizontal',
			slidesShrinkedClass: 'prezzideo-slides-shrinked',
			videoContainer: '.prezzideo-video',
			videoShrinkedClass: 'prezzideo-video-shrinked',
			screenPositionClass: 'prezzideo-screen-position-',
			controlSwap: 'prezzideo-swap-screen-button',
			controlBar: 'prezzideo-control-bar',
			controlSlider: 'prezzideo-control-slider',
			controlTimeline: 'prezzideo-control-timeline',
			controlPlayPause: 'prezzideo-control-playpause',
			controlPlay: 'prezzideo-control-play',
			controlPause: 'prezzideo-control-pause',
			controlFullscreen: 'prezzideo-control-fullscreen'
		},
		autoplay: false,
		callbackInit: null,
		callbackDistroy: null,
		videoProvider: 'youtube',
		defaultBigScreen: 'slides',
		smallScreenPositionDef: 'bottom-right',
		smallScreenPositions:['top-left','top-right','bottom-left','bottom-right']
	};
	
	var vProvidersEmbedCode = {
		'youtube':'<iframe src="https://www.youtube.com/embed/{{id}}?autoplay={{auto}}&controls=0&modestbranding=1&showinfo=0" frameborder="0"></iframe>'
	}
	

	/* 
		Private Methods and Classes -------------------------------------------
	*/
	
	// Extending the defaults config
	// Using Deep extend two objects. Legacy:
	// http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
	var _extendConfig = function(destination, source) {
        for (var property in source) {
            if (source[property] && source[property].constructor 
					&& source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                _extend(destination[property], source[property]);
            } 
            else {
                destination[property] = source[property];
            }
        }
        return destination;
	}
	
	// A function which allows for image preloading
	var _loadImages = function(imgs, imgsReturn, loadCallback) {

		// Creates a new image object with src of the dom image
		var img = new Image();
		img.src = imgs[0].getAttribute('src');
		// shifts the array until it's empty
		if( imgs.length > 1 ) { 
	 		img.onload = function() {
				imgsReturn.push(imgs[0]);
				imgs.shift(); 
				// recursively calls the function with the updated array 
				_loadImages(imgs, imgsReturn, loadCallback); 
			}
		} else {
			img.onload = function() {
				imgsReturn.push(imgs[0]);
				if(typeof loadCallback === 'function') {
				    loadCallback();
				}
			}
		}

	}
	
	// A generic function to append html markup do a dom element
	var _appendHTML = function(el, html) {
		el.innerHTML = el.innerHTML + html;
	}
	
	// A generic function to prepend html markup do a dom element
	var _prependHTML = function(el, html) {
		el.innerHTML = html + el.innerHTML;
	}
	
	var _appendElement = function(container, type, className, content){
		var node = document.createElement(type);
		var textnode = document.createTextNode(content);
		node.appendChild(textnode);
		node.className = className;
		container.appendChild(node);
		return node;
	}
	
	// A crossbrowser function to add or remove class to/from an element
    function _toggleClass(el, className, add) {
        if(el){
            if(el.classList) {
                el.classList[add ? "add" : "remove"](className);
            }
            else {
                var classList = (" " + element.className + " ")
								.replace(/\s+/g, " ")
								.replace(" " + className + " ", "");
                el.className = classList + (add ? " " + className : "");
            }
        }
    }

	// A generic crossbrowser funciton to handle events addition
	var _addEvent = function(obj,type,fn) {
		if (obj.addEventListener) {
			obj.addEventListener (type,fn,false);
		} else if (obj.attachEvent) {
			obj.attachEvent ('on'+type,fn);
		}
	}

	// A generic crossbrowser funciton to handle events removal
	var _removeEvent = function(obj,type,fn) {
		if (obj.removeEventListener) {
			obj.removeEventListener (type,fn,false);
		} else if (obj.detachEvent) {
			obj.detachEvent ('on'+type,fn);
		}
	}
	
	
	// The player class
	function Prezzideo(element,id) {
		
        var self = this;
        self.element = element;
		self.playerId = id;
		self.slides = [];
		self.currentSlide = 0;
		self.bigScreen = config.defaultBigScreen;
		
		// A funciton to select a child dom element by selector
		var _selectChild = function(selector) {
			return _selectChildren(selector)[0];
		}
		
		// A funciton to select children dom elements by selector
		var _selectChildren = function(selector) {
			return self.element.querySelectorAll(selector);
		}
		
		// Attaches all events to the controls
		var _addEvents = function(){
			// adding an event to the swap button
			var buttonSwap = _selectChild('.'+config.dom.controlSwap);
			_addEvent(buttonSwap,'click', _swapScreens);
		}
		
		// A funtion to insert controls to the player
		var _insertControls = function() {
			// inserting the button over the small screen for swapping
			_appendElement(self.element, 'div', config.dom.controlSwap, '');
			
			// inserting the control bar at the bottom
			var bar = _appendElement(
					self.element, 'div', config.dom.controlBar, '');
			_appendElement(bar, 'div', config.dom.controlTimeline, '');
			_appendElement(bar, 'div', config.dom.controlSlider, '');
			_appendElement(bar, 'div', config.dom.controlPlayPause + 
				' ' + config.dom.controlPlay, '');
			_appendElement(bar, 'div', config.dom.controlFullscreen, '');
			
		}
		
		// This function inits which of the screen is on the top and what
		// is the default position of the each screen: top, right, bottom, left
		var _initScreensPositions = function() {
			
			_changeSmallScreenPosition(config.smallScreenPositionDef);
			
			if (config.defaultBigScreen == 'video') {
				var slideC = _selectChild(config.dom.slidesContainer);
				_toggleClass(slideC, config.dom.slidesShrinkedClass, true);
			} else if (config.defaultBigScreen == 'slides') {
				var videoC = _selectChild(config.dom.videoContainer);
				_toggleClass(videoC, config.dom.videoShrinkedClass, true)
			}
			
		}
		
		// Changes the position of the small screen
		var _changeSmallScreenPosition = function( position ) {
			var slideC = _selectChild(config.dom.slidesContainer);
			var videoC = _selectChild(config.dom.videoContainer);
			var buttonSwap = _selectChild('.'+config.dom.controlSwap);
			// First removing the old classes if they exist
			for (var i = 0; i < config.smallScreenPositions.length; i++){
				var pos = config.dom.screenPositionClass 
						+ config.smallScreenPositions[i];
				_toggleClass(slideC, pos, false);
				_toggleClass(videoC, pos, false);
				_toggleClass(buttonSwap, pos, false);
			}
			_toggleClass(slideC, 
				config.dom.screenPositionClass + position, true);
			_toggleClass(videoC, 
				config.dom.screenPositionClass + position, true);
			_toggleClass(buttonSwap, 
				config.dom.screenPositionClass + position, true);
		}
		
		// swaps screens
		var _swapScreens = function() {
			var slideC = _selectChild(config.dom.slidesContainer);
			var videoC = _selectChild(config.dom.videoContainer);
			if (self.bigScreen == 'video') {
				_toggleClass(slideC, config.dom.slidesShrinkedClass, false);
				_toggleClass(videoC, config.dom.videoShrinkedClass, true);
				_resetSlidesPositions();
				self.bigScreen = 'slides';
			} else if (self.bigScreen == 'slides') {
				_toggleClass(slideC, config.dom.slidesShrinkedClass, true);
				_toggleClass(videoC, config.dom.videoShrinkedClass, false);
				_resetSlidesPositions();
				self.bigScreen = 'video';
			}
		}
		
		
		// A function to compare the aspect ratio of the container and the 
		// images and place the image depending on that and also make the
		// latest ones invisible
		// TODO: add some sorting function
		var _resetSlidesPositions = function() {
			var cRatio = self.element.clientWidth / self.element.clientHeight;
			for (var i = 0; i < self.slides.length; i ++ ){
				var iRatio = self.slides[i].clientWidth / 
							 self.slides[i].clientHeight;
				if (cRatio <= iRatio) {
					// Adds vertical alignment of the class, since it's wider
					// than the container
					_toggleClass(self.slides[i], config.dom.slideVClass, true);
					var marginTop = - self.slides[i].clientHeight / 2;
					self.slides[i].style.marginTop = marginTop + 'px';
				} else {
					// Adds vertical alignment of the class, since it's higher
					// than the container
					_toggleClass(self.slides[i], config.dom.slideHClass, true);
					var marginLeft = - self.slides[i].clientWidth / 2;
					self.slides[i].style.marginLeft = marginLeft + 'px';
				}
			}
		}
		
		// Gets the slides depending on the attributes and sends the array
		// for loading
		var _getSlides = function(loadCallback) {
			var images = [];
			var slides = _selectChildren(config.dom.slideItem);
			for (var i = 0; i < slides.length; i ++) {
				if (slides[i]!=null){
					if(slides[i].getAttribute('data-time')){
						images.push(slides[i]);
					}
				}
			}
			_loadImages(images, self.slides, loadCallback);
		}
		
		// Adds the video markup to the container, depending on the provider
		var _addVideo = function() {
			var videoMarkup = '<div class="prezzideo-video">'
				+ vProvidersEmbedCode[config.videoProvider]
					.replace('{{id}}', self.element.getAttribute('data-urlid'))
					.replace('{{auto}}', config.autoplay)
				+ '</div>';
			_appendHTML (self.element, videoMarkup)
		}
		
		
		// Shows the selected slide
		var _goToSlide = function(id) {
			if (id in self.slides) {
				var currentSlide = self.slides[self.currentSlide];
				var newSlide = self.slides[id];
				currentSlide.style.zIndex = '0';
				newSlide.style.zIndex = '1';
			}
		}
		
		// Shows the next slide
		var _nextSlide = function() {
			_goToSlide(self.currentSlide + 1);	
		}
		
		// A function to play the video
		var _play = function() {
			
		}
		
		// A funtion to pause the video
		var _pause = function() {
			
		}
		
		// A funtion to stop completely the video
		var _pause = function() {
			
		}
		
		// The function to be called on init
		var _init = function() {
			_addVideo();
			_insertControls();
			_getSlides(function(){
				_resetSlidesPositions();
				_goToSlide(0);
			});
			_initScreensPositions();
			_addEvents();
		}
		
		// The function to be called on init
		var _destroy = function() {
			
		}
		
		// Inits or returns empty object if init fails
		_init();
        if(!self.init) {
            return {};
        }
		
		return {
			play: _play,
			pause: _pause,
			stop: _stop,
			swap: _swapScreens,
			smallScreenPosition: _changeSmallScreenPosition
		}

	}
	
	
	/*
		API Methods -----------------------------------------------------------
	*/
	
	// The prezzideo player class
	// @param options - settings provided by the user
	api.init = function(options) {
		// Takes into consideration the user's settings
		config = _extendConfig(defaults, options);

		// Get the players 
		var elements = document.querySelectorAll(config.dom.container);
		var players = [];

		// Initializing Prezzideo instance for each DOM element
		for (var i = 0; i < elements.length; i ++) {
		
			// Setup a player instance and add to the element
			if(typeof elements[i].prezzideo === "undefined") { 
				// Create new Prezzideo instance
				var prezzideo = new Prezzideo(elements[i],i);

				// Set prezzideo to false if setup failed
				elements[i].prezzideo = 
					(Object.keys(prezzideo).length ? prezzideo : false);

				// Callback
				if(typeof config.callbackInit === "function") {
					config.callbackInit(elements[i].prezzideo);
				}
			}
			
			// adds the player to an array
			players.push(elements[i].prezzideo);
		}
		
		return players;
	}

}( window.prezzideo = window.prezzideo || {} ));