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
		dom:{
			container:'.prezzideo'
		},
		callbackInit:null,
		callbackDistroy:null,
		videoProvider:'youtube'
	};
	
	var vProvidersEmbedCode = {
		'youtube':'<iframe width="{{w}}" height="{{h}}" src="https://www.youtube.com/embed/{{id}}" frameborder="0"></iframe>'
	}
	

	/* 
		Private Methods -------------------------------------------------------
	*/
	
	// Extending the defaults config
	// Using Deep extend two objects. Legacy:
	// http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
	var _extendConfig = function( destination, source ) {
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
	
	
	// The player class
	function Prezzideo(element,id) {
		
        var self = this;
        self.element = element;
		self.playerId = id;
		
		// A funciton to select a child dom element by selector
		var _selectChild = function(selector) {
			return _selectChildren(selector)[0];
		}
		
		// A funciton to select children dom elements by selector
		var _selectChildren = function(selector) {
			return self.element.querySelectorAll(selector);
		}
		
		var _insertHTML = function(){
			
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
		
		// A function to play the video
		var _play = function() {
			
		}
		
		// A funtion to pause the video
		var _pause = function() {
			
		}
		
		// The function to be called on init
		var _init = function() {
			console.log('init player'+self.playerId);
		}
		
		// The function to be called on init
		var _destroy = function() {
			console.log('some destroy function');
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
		for (var i = 0; i < elements.length; i++) {
		
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