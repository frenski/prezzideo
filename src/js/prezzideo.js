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
			screenPositionClass: 'prezzideo-screen-position-'
		},
		autoplay: false,
		callbackInit: null,
		callbackDistroy: null,
		videoProvider: 'youtube',
		defaultBigScreen: 'slides',
		smallScreenPosition: 'bottom-right'
	};
	
	var vProvidersEmbedCode = {
		'youtube':'<iframe src="https://www.youtube.com/embed/{{id}}?autoplay={{auto}}&controls=0&modestbranding=1&showinfo=0" frameborder="0"></iframe>'
	}
	

	/* 
		Private Methods -------------------------------------------------------
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
	
	
	// A generic function to add html markup do a dom element
	var _insertHTML = function() {
		
	}
	
	// Adds or removes class to/from an element
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
	
	
	// The player class
	function Prezzideo(element,id) {
		
        var self = this;
        self.element = element;
		self.playerId = id;
		self.slides = [];
		self.currentSlide = 0;
		
		// A funciton to select a child dom element by selector
		var _selectChild = function(selector) {
			return _selectChildren(selector)[0];
		}
		
		// A funciton to select children dom elements by selector
		var _selectChildren = function(selector) {
			return self.element.querySelectorAll(selector);
		}
		
		// A crossbrowser funciton to handle events addition
		var _addEvent = function(obj,type,fn) {
			if (obj.addEventListener) {
				obj.addEventListener (type,fn,false);
			} else if (obj.attachEvent) {
				obj.attachEvent ('on'+type,fn);
			}
		}
		
		// A crossbrowser funciton to handle events removal
		var _removeEvent = function(obj,type,fn) {
			if (obj.removeEventListener) {
				obj.removeEventListener (type,fn,false);
			} else if (obj.detachEvent) {
				obj.detachEvent ('on'+type,fn);
			}
		}
		
		
		var _insertControls = function() {
			
		}
		
		
		// This function inits which of the screen is on the top and what
		// is the default position of the each screen: top, right, bottom, left
		var _initPositions = function() {
			
			_changeSmallScreenPosition(config.smallScreenPosition);
			
			if (config.defaultBigScreen == 'video') {
				var slideC = _selectChild(config.dom.slidesContainer);
				_toggleClass(slideC, config.dom.slidesShrinkedClass, true);
			} else if (config.defaultBigScreen == 'slides') {
				var videoC = _selectChild(config.dom.videoContainer);
				_toggleClass(videoC, config.dom.videoShrinkedClass, true)
			}
			
		}
		
		
		var _changeSmallScreenPosition = function( position ) {
			var slideC = _selectChild(config.dom.slidesContainer);
			var videoC = _selectChild(config.dom.videoContainer);
			_toggleClass(slideC, 
				config.dom.screenPositionClass + position, true);
			_toggleClass(videoC, 
				config.dom.screenPositionClass + position, true);
		}
		
		
		// A function to compare the aspect ratio of the container and the 
		// images and place the image depending on that and also make the
		// latest ones invisible
		// TODO: add some sorting function
		var _resetImages = function() {
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
				if (i > 0 ) self.slides[i].style.display = 'none';
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
			self.element.innerHTML += videoMarkup;
		} 
		
		// A function to play the video
		var _play = function() {
			
		}
		
		// A funtion to pause the video
		var _pause = function() {
			
		}
		
		// The function to be called on init
		var _init = function() {
			_addVideo();
			_getSlides(function(){
				_resetImages();
			});
			_initPositions();
			// console.log('init player'+self.playerId);
		}
		
		// The function to be called on init
		var _destroy = function() {
			// console.log('some destroy function');
		}
		
		// Inits or returns empty object if init fails
		_init();
        if(!self.init) {
            return {};
        }
		
		return {
			play: _play,
			pause: _pause
		}

	}
	
	
	/*
		API Methods -----------------------------------------------------------
	*/
	
	// The prezzideo player class
	// @param options - settings provided by the user
	api.init = function(options){
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