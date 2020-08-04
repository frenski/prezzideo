// ============================================================================
// Prezzideo
// prezzideo.js v0.1
// https://github.com/frenski/prezzideo
// License: The MIT License (MIT)
// ============================================================================

(function (api) {


	/* 
		Private Properties ----------------------------------------------------
	*/
	var config;

	var defaults = {
		dom: {
			container: '.prezzideo',
			slidesContainer: '.prezzideo-slides',
			slideItem: '.prezzideo-slides-item',
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
			controlStop: 'prezzideo-control-stop',
			controlFullscreen: 'prezzideo-control-fullscreen',
			displayTime: 'prezzideo-display-time'
		},
		showSlideTimeIndicators: true,
		loadedScripts: {},
		autoplay: false,
		callbackInit: null,
		callbackDistroy: null,
		videoProvider: 'youtube',
		defaultBigScreen: 'slides',
		smallScreenPositionDef: 'bottom-right',
		smallScreenPositions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],

	};


	//hack youtubeAPIReady to work for mutlitple instances
	let _YTisReady = false;
	const _YTcallbacks = [];
	window.enqueueOnYoutubeIframeAPIReady = function (callback) {

		if (_YTisReady) {
			callback();
		} else {
			_YTcallbacks.push(callback);
		}
	}

	window.onYouTubeIframeAPIReady = function () {

		_YTisReady = true;
		_YTcallbacks.forEach(function (callback) {
			callback();
		});
		_YTcallbacks.splice(0);

	}



	var vProvidersEmbedCode = {
		'youtube': '<iframe src="https://www.youtube.com/embed/{{id}}?autoplay={{auto}}&controls=0&modestbranding=1&showinfo=0" frameborder="0"></iframe>'
	}


	/* 
		Private Methods and Classes -------------------------------------------
	*/

	// Extending the defaults config
	// Using Deep extend two objects. Legacy:
	// http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
	const _extendConfig = (destination, source) => {
		for (const property in source) {
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
	var _loadImages = function (imgs, imgsReturn, timesArr, loadCallback) {

		// Creates a new image object with src of the dom image
		var img = new Image();
		img.src = imgs[0].getAttribute('src');
		// shifts the array until it's empty
		if (imgs.length > 1) {
			img.onload = function () {
				imgsReturn.push(imgs[0]);
				timesArr.push(
					_stringToSeconds(imgs[0].getAttribute('data-time')));
				imgs.shift();
				// recursively calls the function with the updated array 
				_loadImages(imgs, imgsReturn, timesArr, loadCallback);
			}
		} else {
			img.onload = function () {
				imgsReturn.push(imgs[0]);
				timesArr.push(
					_stringToSeconds(imgs[0].getAttribute('data-time')));
				if (typeof loadCallback === 'function') {
					loadCallback();
				}
			}
		}

	}

	// A generic function which create and element and appends to given element
	const _createElement = (type, parent, attributes = {}, content = {}) => {
		const element = document.createElement(type);
		parent.appendChild(element);
		for (const attr in attributes) {
			element.setAttribute(attr, attributes[attr]);
		}
		for (const item in content) {
			element[item] = content[item];
		}
		return element;
	}

	// A generic function to append html markup to a dom element
	var _appendHTML = function (el, html) {
		el.innerHTML = el.innerHTML + html;
	}

	// A generic function to prepend html markup to a dom element
	var _prependHTML = function (el, html) {
		el.innerHTML = html + el.innerHTML;
	}

	// A generic function to append element to another dom element
	// var _appendElement = function (container, type, className, content, id) {
	// 	var node = document.createElement(type);
	// 	var textnode = document.createTextNode(content);
	// 	if (typeof id !== 'undefined') node.setAttribute('id', id);
	// 	node.appendChild(textnode);
	// 	node.className = className;
	// 	container.appendChild(node);
	// 	return node;
	// }

	// A generic function to append script
	var _appendScript = function (src) {
		if (!config.loadedScripts[src]) {
			var tag = document.createElement('script');
			tag.src = src;
			config.loadedScripts[src] = true;
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		}

	}

	// A crossbrowser function to add or remove class to/from an element
	function _toggleClass(el, className, add) {
		if (el) {
			if (el.classList) {
				el.classList[add ? "add" : "remove"](className);
			}
			else {
				var classList = (" " + el.className + " ")
					.replace(/\s+/g, " ")
					.replace(" " + className + " ", "");
				el.className = classList + (add ? " " + className : "");
			}
		}
	}

	// A generic crossbrowser funciton to handle events addition
	var _addEvent = function (obj, type, fn) {

		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + type, fn);
		}
	}

	// A generic crossbrowser funciton to handle events removal
	var _removeEvent = function (obj, type, fn) {
		if (obj.removeEventListener) {
			obj.removeEventListener(type, fn, false);
		} else if (obj.detachEvent) {
			obj.detachEvent('on' + type, fn);
		}
	}

	// Converts string time to seconts
	var _stringToSeconds = function (str) {
		var units = str.split(':')
		return parseFloat(units[0]) * 3600
			+ parseFloat(units[1]) * 60
			+ parseFloat(units[2]);
	}

	var _secondsToString = function (secondsTotal) {
		var hours = Math.floor(secondsTotal / 3600);
		var minutes = Math.floor((secondsTotal % 3600) / 60);
		var seconds = Math.floor((secondsTotal % 3600) % 60);
		if (seconds < 10) seconds = '0' + seconds;
		var stringTime = minutes + ':' + seconds;
		if (hours) stringTime = hours + ':' + stringTime;
		return stringTime;
	}

	// Gets mouse coordinates on an event
	var _getMouseCoords = function (e) {
		if (e.pageX || e.pageY) {
			return { x: e.pageX, y: e.pageY };
		}
		return {
			x: e.clientX + document.body.scrollLeft - document.body.clientLeft,
			y: e.clientY + document.body.scrollTop - document.body.clientTop
		}
	}


	// TIMER CLASS
	function Timer(trigger_points, delegate) {

		// Properties ---------------------------------------------------------

		// keeps the self of the current instance
		var self = this;

		// keeps the times, where actions are required
		self.triggerPoints = trigger_points;

		// keeps the current point in order to trigger delegate call if changed
		self.currentPoint = 0;

		// keeps the current time
		self.currentTime = 0;

		// keeps the current time
		self.duration = 0;

		// keeps the time interval object
		self.interval = null;

		// If the video is not being played yet, then the meta data is not
		// loaded, therefore we get the duration after loading the video for
		// the first time. We keep this to make sure we add the duration to the
		// triggerPoints only when it's played for the first time.
		self.isDurationSet = false;


		// Methods ------------------------------------------------------------

		// updates the current time
		var _updateTime = function (time, duration) {
			self.currentTime = time;
			_updateCurrentPoint();
			if (typeof delegate.onTimeUpdate === 'function' && duration) {
				delegate.onTimeUpdate(time, duration);
			}
		}

		// Finds the closest trigger point based on the current time
		var _findPoint = function () {
			var point = null;
			for (var i = self.triggerPoints.length - 2; i >= 0; i--) {
				if (self.currentTime >= self.triggerPoints[i]) {
					point = i;
					break;
				}
			}
			return point;
		}

		// Updates the current trigger point if necessary
		var _updateCurrentPoint = function () {
			if (!(self.currentTime >= self.triggerPoints[self.currentPoint]
				&& self.currentTime < self.triggerPoints[self.currentPoint + 1])) {
				self.currentPoint = _findPoint();
				if (self.currentPoint !== null) {
					if (typeof delegate.onPointChange === 'function') {
						delegate.onPointChange(self.currentPoint);
					}
				}
			}
		}


		// API ------------------------------------------------------------

		return {

			updateTime: _updateTime,
			getTime: function () { return self.currentTime; },
			getDuration: function () { return self.duration; },
			setPlaying: function (intFunction) {
				self.interval = window.setInterval(intFunction, 100);
			},
			resetPlaying: function () {
				window.clearInterval(self.interval);
			},
			addEndPoint: function (time) {
				self.triggerPoints.push(time);
			},
			setDuration: function (time) {
				self.duration = time;
				self.isDurationSet = true;
			}
		}

	}

	// a function that creates container element for prezzideo player
	const _createPrezzideoContainer = (parent, options) => {
		console.log(options)
		const data = {
			'data-id': options.id, id: `player-container_${options.id}`, class: 'prezzideo', width: '100%',
			'size-screen': options['size-screen']
		}
		data['data-' + options.videotype] = options.videosource;
		console.log(data)
		return _createElement('div', parent, data);
	}
	// a function that creates slide image elements
	const _createPrezzideoSlides = (parent, options) => {
		const slidesContainer = _createElement('div', parent, { id: `slides-container_${options.id}`, class: 'prezzideo-slides' });
		options.slides.map((item, i) => _createElement('img', slidesContainer,
			{
				id: `slide-${i}_${item.id}`,
				class: 'prezzideo-slides-item',
				'src': item.image,
				'data-time': item.time
			}));

		return slidesContainer;
	}
	const _calculateTotalSlidesTime = (container) => {
		[...container.children].map((stamp) => {
			// const time = stamp.getAttribute('data-time').split(':');
			// (+time[0]) * 60 * 60 + (+time[1]) * 60 + (+time[2])
			const seconds = _stringToSeconds(stamp.getAttribute('data-time'));
			stamp.setAttribute('data-time-in-seconds', seconds);
		});
	}
	const _createPrezzideoView = (parent, options, settings) => {
		const data = { 'size-screen': settings.screen.screenSize, id: options.id, videotype: options.video.type, videosource: options.video.source };

		const container = _createPrezzideoContainer(parent, data);
		const slidersContainer = _createPrezzideoSlides(container, options);
		_calculateTotalSlidesTime(slidersContainer);


		return container;
	}

	// PLAYER CLASS
	function Prezzideo(element, id) {

		// Properties ---------------------------------------------------------

		// keeps the self of the current instance
		var self = this;

		// keeps the dom element objects
		self.element = element;

		// keeps the sequence id of the player - 0,1,2...
		self.playerId = id;

		// keeps the ide of the container, for ie 'prezzideo-video1'
		self.videoContainerId = config.dom.videoContainer.substr(
			1, config.dom.videoContainer.length - 1) + id;

		// keeps the slides dom elements in an array
		self.slides = [];

		// keeps the array index of the current slide being displayed
		self.currentSlide = 0;

		// keeps a track of which screen is large now
		self.bigScreen = config.defaultBigScreen;

		// keeps the video provider instance object, for ie - YT
		self.player = {};

		// An object to hold the play, pause, stop.. functions to communicate
		// with the video provider API
		self.actions = {};

		// keeps the state - playing or stoped
		self.playing = false;

		// keeps the timer instance
		self.timer = {};

		// keeps the time of each slide in seconds
		self.slideTimes = [];


		// Methods ------------------------------------------------------------

		// A funciton to select a child dom element by selector
		var _selectChild = function (selector) {
			return _selectChildren(selector)[0];
		}

		// A funciton to select children dom elements by selector
		var _selectChildren = function (selector) {
			return self.element.querySelectorAll(selector);
		}

		// Attaches all events to the controls
		var _addEvents = function (id) {

			const buttonSwap = document.getElementById('controlSwap' + '_' + id);
			const buttonPP = document.getElementById('controlPlayPause' + '_' + id);
			const buttonStop = document.getElementById('controlStop' + '_' + id);
			const timeline = document.getElementById('controlTimeline' + '_' + id);
			const slider = document.getElementById('controlSlider' + '_' + id);
			const buttonFullScreen = document.getElementById('controlFullscreen' + '_' + id);


			_addEvent(buttonFullScreen, 'click', _changeScreenSize);
			_addEvent(buttonSwap, 'click', _swapScreens);
			_addEvent(buttonStop, 'click', _stop);
			_addEvent(buttonPP, 'click', function () {
				if (!self.playing) {
					_play();
				} else {
					_pause();
				}
			});

			var positionSlider = function (e) {
				var mouseX = _getMouseCoords(e).x;
				var timelineX = timeline.getBoundingClientRect().left;
				var relativeX = mouseX - timelineX;
				var timelineW = timeline.clientWidth;
				var relativeW = relativeX / timelineW;
				_setSliderPosition(relativeX);
				_goToTime(relativeW);
				return { 'relX': relativeX, 'relW': relativeW };
			}

			// timeline click event
			_addEvent(timeline, 'click', function (e) {
				positionSlider(e);
			});
			// Slider down, move and up events
			var sliderMove = function (e) {
				var posSl = positionSlider(e);
				var duration = self.timer.getDuration();
			
				if (duration) {
					_setDisplayTime(posSl.relW * duration, duration);
				}
			}
			var sliderUp = function () {
				_removeEvent(document, 'mousemove', sliderMove);
				_removeEvent(document, 'mouseup', sliderUp);
			}
			var sliderDown = function () {
				_addEvent(document, 'mousemove', sliderMove);
				_addEvent(document, 'mouseup', sliderUp);
			}
			_addEvent(slider, 'mousedown', sliderDown);

		}

		// A funtion to insert controls to the player
		var _insertControls = function (id = 0) {
			// inserting the button over the small screen for swapping
			// _appendElement(self.element, 'div', config.dom.controlSwap, '');
			_createElement(
				'div',
				self.element, { id: `controlSwap_${id}`, class: config.dom.controlSwap });

			// inserting the control bar at the bottom
			const bar = _createElement(
				'div',
				self.element, { id: `controlBar_${id}`, class: config.dom.controlBar });
			const timeline = _createElement('div', bar, { id: `controlTimeline_${id}`, class: config.dom.controlTimeline });
			_createElement('div', bar, { id: `controlSlider_${id}`, class: config.dom.controlSlider });
			_createElement('div', bar, {
				id: `controlPlayPause_${id}`, class: config.dom.controlPlayPause +
					' ' + config.dom.controlPlay
			});
			_createElement('div', bar, { id: `controlStop_${id}`, class: config.dom.controlStop });
			_createElement('div', bar, { id: `controlFullscreen_${id}`, class: config.dom.controlFullscreen });
			_createElement('div', bar, { id: `displayTime_${id}`, class: config.dom.displayTime }, { textContent: '0:00 / 0:00' });


			// _addSlideTimeIndicators(timeline, id)
		}

		// Sets the slider position, by passing value for x
		var _setSliderPosition = function (posX) {
			var slider = _selectChild('.' + config.dom.controlSlider);
			slider.style.left = posX + 'px';
		}

		var _setDisplayTime = function (timeElapsed, timeTotal) {
			var displayTime = _selectChild('.' + config.dom.displayTime);
			displayTime.innerHTML = _secondsToString(timeElapsed) + ' / ' +
				_secondsToString(timeTotal);
		}

		// caclilates slider position, by passing a fraction of the time passed
		var _calcSliderPosition = function (timeFract) {
			var timeline = _selectChild('.' + config.dom.controlTimeline);
			return Math.round(timeFract * timeline.clientWidth);
		}

		var _setPPButtonStatus = function () {
			var buttonPP = _selectChild('.' + config.dom.controlPlayPause);
			if (!self.playing) {
				_toggleClass(buttonPP, config.dom.controlPlay, true);
				_toggleClass(buttonPP, config.dom.controlPause, false);
			} else {
				_toggleClass(buttonPP, config.dom.controlPlay, false);
				_toggleClass(buttonPP, config.dom.controlPause, true);
			}
		}

		// This function inits which of the screen is on the top and what
		// is the default position of the each screen: top, right, bottom, left
		var _initScreensPositions = function (id) {

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
		var _changeSmallScreenPosition = function (position) {
			var slideC = _selectChild(config.dom.slidesContainer);
			var videoC = _selectChild(config.dom.videoContainer);
			var buttonSwap = _selectChild('.' + config.dom.controlSwap);
			// First removing the old classes if they exist
			for (var i = 0; i < config.smallScreenPositions.length; i++) {
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
		var _swapScreens = function () {
			var slideC = _selectChild(config.dom.slidesContainer);
			var videoC = _selectChild(config.dom.videoContainer);
			if (self.bigScreen == 'video') {
				_toggleClass(slideC, config.dom.slidesShrinkedClass, false);
				_toggleClass(videoC, config.dom.videoShrinkedClass, true);
				_setSlidesPositions();
				self.bigScreen = 'slides';
			} else if (self.bigScreen == 'slides') {
				_toggleClass(slideC, config.dom.slidesShrinkedClass, true);
				_toggleClass(videoC, config.dom.videoShrinkedClass, false);
				_setSlidesPositions();
				self.bigScreen = 'video';
			}
		}
		// when exiting full screen with escape add escape callback
		const _exitFullScreen = () => {
			if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
				const bars = document.getElementsByClassName('prezzideo-control-bar');
				[...bars].forEach((bar, index) => {
					bar.style = null;
					bar.parentElement.setAttribute('size-screen', 'small')
					document.getElementById('slides-container_' + index).style = null;
					document.getElementById('prezzideo-video' + index).style = null;
				});

				_setSlidesPositions();

			}
		}

		const _changeScreenSize = async function () {

			const controlbar = this.parentElement;
			const container = controlbar.parentElement;
			const id = container.getAttribute('data-id');

			const video = document.getElementById('prezzideo-video' + id);
			const presentation = document.getElementById('slides-container_' + id);

			const screenSize = container.getAttribute('size-screen');

			// _selectPrezzideoElements(container);
			if (screenSize === 'full') {
				container.setAttribute('size-screen', 'small')
				_exitFullScreen();
			} else {
				if (container.requestFullscreen) {
					await container.requestFullscreen();
					_setSlidesPositions();
				} else if (container.mozRequestFullScreen) { /* Firefox */
					await container.mozRequestFullScreen();
					_setSlidesPositions();
				} else if (container.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
					await container.webkitRequestFullscreen();
					_setSlidesPositions();
				} else if (container.msRequestFullscreen) { /* IE/Edge */
					await container.msRequestFullscreen();
					_setSlidesPositions();
				}
				controlbar.style.bottom = 0;
				video.style.bottom = '3.8%';
				presentation.style.bottom = '3.8%';
				container.setAttribute('size-screen', 'full')
			}
		}

		document.addEventListener('fullscreenchange', _exitFullScreen);
		document.addEventListener('webkitfullscreenchange', _exitFullScreen);
		document.addEventListener('mozfullscreenchange', _exitFullScreen);
		document.addEventListener('MSFullscreenChange', _exitFullScreen);


		const _remap = (t, tMin, tMax, value1, value2) => {
			return ((t - tMin) / (tMax - tMin)) * (value2 - value1) + value1;
		};

		const _addSlideTimeIndicators = (timeline, id, duration) => {

			const slidesContainer = document.getElementById('slides-container_' + id);
			// const videoTimeStamp = slidesContainer.getAttribute('data-total-time').split(':');
			// const videoTotalTime = Number(videoTimeStamp[0]) * 60 + Number(videoTimeStamp[1]);
			// const videoTotalTime = _stringToSeconds(slidesContainer.getAttribute('data-total-time'));
			const videoTotalTime = duration;

			const SlideTimeIndicators = [...slidesContainer.children];
			const totalTime = videoTotalTime;

			SlideTimeIndicators.map((stamp) => {
				const time = +stamp.getAttribute('data-time-in-seconds');
				const stampLoc = _remap(time, 0, totalTime, 0, 97.5);
				const marker = _createElement('div', timeline, { class: 'time-stamp' }, { style: `left:${stampLoc}%` });
				// marker.addEventListener('click',()=>{
				// 	_goToTime(time);
				// })
			});

		}

		// A function to compare the aspect ratio of the container and the 
		// images and place the image depending on that and also make the
		// latest ones invisible
		// TODO: add some sorting function    	//.sort((a, b) => b - a)
		var _setSlidesPositions = function () {

			var cRatio = self.element.clientWidth / self.element.clientHeight;
			for (var i = 0; i < self.slides.length; i++) {
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
		const _getSlides = function (loadCallback) {
			const images = [];
			const slides = _selectChildren(config.dom.slideItem);
			for (let i = 0; i < slides.length; i++) {
				if (slides[i] != null) {
					if (slides[i].getAttribute('data-time')) {
						images.push(slides[i]);
					}
				}
			}
			_loadImages(images, self.slides, self.slideTimes, loadCallback);
		}


		// Adds the video markup to the container, depending on the provider
		const _addVideo = function (id) {
			// (type, parent, attributes = {})

			//	_appendElement = function (container, type, className, content, id) 

			const videoContainer = _createElement(
				'div',
				self.element,
				{
					class: config.dom.videoContainer
						.substr(1, config.dom.videoContainer.length - 1),
					id: 'prezzideo-video' + id
				}
			)


			switch (config.videoProvider) {

				case 'youtube':

					if (typeof YT === 'object') {
						_initYoutube(videoContainer);

					} else {
						_appendScript("https://www.youtube.com/iframe_api");
						//hack window.onYoutubeIframeAPIReady
						enqueueOnYoutubeIframeAPIReady(function () {
							_initYoutube(videoContainer);

						})

					}
					break;
				case 'html5-video':
					const container = document.getElementById('player-container_' + id);
					const videoElement = _initHtmlVideo(videoContainer, container.getAttribute('data-path'));
					videoElement.addEventListener('loadeddata', (e) => {
						if (videoElement.readyState >= 3) {
							_slidesTimeIndicators();
						}
					})

					break

				default:
					break;
			}
		}


		const _slidesTimeIndicators = (show = config.showSlideTimeIndicators) => {
			const id = self.element.getAttribute('data-id');
			// if(self.element.getAttribute('data-path')){

			// }
			const timeline = document.getElementById('controlTimeline_' + id);
			timeline.innerHTML = '';
			if (show) {
				_addSlideTimeIndicators(timeline, id, self.player.getDuration());
			}
		}

		const _initHtmlVideo = (videoContainer, src) => {

			const video = _createElement(
				'video',
				videoContainer,
				{
					id: self.videoContainerId + '-html5_video',
					width: "100%"
				})
			const dotsplit = src.split('.');
			const memetype = dotsplit[dotsplit.length - 1];

			const source = _createElement('source', video, { src: src, type: 'video/' + memetype })



			self.actions = {
				play: () => {
					video.play();
					self.playing = true;
					_setPPButtonStatus();
				},
				pause: () => {
					video.pause()
					self.playing = false;
					_setPPButtonStatus();
				},
				stop: () => {

					video.pause();
					video.currentTime = 0;
					self.playing = false;
					_setSliderPosition(0)
					_setPPButtonStatus();
				
				},
				goToTime: (time) => {
					const timeInSec = time * video.duration;
					video.currentTime = timeInSec;
					video.play();
					self.playing = true;
					_setPPButtonStatus();

				}
			}
		
			self.player.getDuration = () => video.duration;
			if (!self.timer.getDuration()) {
				const duration = video.duration;
				self.timer.addEndPoint(duration);
				self.timer.setDuration(duration);
			}
			self.timer.setPlaying(function () {
				self.timer.updateTime(
					video.currentTime,
					video.duration
				);
			});
	
			return video;
		}



		// Videos initializers
		const _initYoutube = (videoContainer) => {
			_createElement(
				'div',
				videoContainer,
				{
					id: self.videoContainerId + '-youtube'
				}
			)


			self.player = new YT.Player(self.videoContainerId + '-youtube', {
				videoId: self.element.getAttribute('data-urlid'),
				playerVars: {
					autoplay: 0,
					controls: 0,
					rel: 0,
					showinfo: 0,
					iv_load_policy: 3,
					modestbranding: 1,
					disablekb: 1
				},
				events: {
					'onReady': function (event) {
						var obj = event.target;
						self.actions.play = function () { obj.playVideo(); }
						self.actions.stop = function () { obj.stopVideo(); }
						self.actions.pause = function () { obj.pauseVideo(); }
						self.actions.goToTime = function (time) {
							var timeInSec = time * obj.getDuration();
							obj.seekTo(timeInSec);
						}
						data - source();
					},
					'onStateChange': function (event) {

						self.timer.resetPlaying();

						var obj = event.target;

						switch (event.data) {
							case -1:
								self.playing = false;
								break;
							case 0:
								self.playing = false;
								break;
							case 1:
								// We add the final point (the duration) to the
								// points array of the timer
								if (!self.timer.getDuration()) {
									var duration = obj.getDuration()
									self.timer.addEndPoint(duration);
									self.timer.setDuration(duration);
								}
								self.timer.setPlaying(function () {
									self.timer.updateTime(
										obj.getCurrentTime(),
										obj.getDuration()
									);
								});
								self.playing = true;
								break;
							case 2:
								self.playing = false;
								break;
							case 3:
								self.playing = false;
								break;
						}

						_setPPButtonStatus();

					}
				}
			});

		}


		// Shows the selected slide
		var _goToSlide = function (id) {
			if (id in self.slides) {
				var curSlide = self.slides[self.currentSlide];
				var newSlide = self.slides[id];
				curSlide.style.zIndex = '0';
				newSlide.style.zIndex = '1';
				self.currentSlide = id;
			}
		}

		// Shows the next slide
		var _nextSlide = function () {
			_goToSlide(self.currentSlide + 1);
		}

		// A function to play the video
		var _play = function () {
			if (typeof self.actions.play === 'function') {
				self.actions.play();
			}
		}

		// A funtion to stop completely the video
		var _stop = function () {
			if (typeof self.actions.stop === 'function') {
				self.actions.stop();
			}
		}

		// A funtion to pause the video
		var _pause = function () {
			if (typeof self.actions.pause === 'function') {
				self.actions.pause();
			}
		}

		// A funtion to go to a certain part of the video - time is fraction of
		// the full time. In Youtube function calculated	
		var _goToTime = function (time) {
			if (typeof self.actions.goToTime === 'function') {
				self.actions.goToTime(time);
			}
		}

		// The function to be called on init
		var _init = function () {

			_getSlides(function () {
				// Repositios each slide
				_setSlidesPositions();
				// Makes the first slide visible
				_goToSlide(0);
				// Inits the slider, by passing the sl. times and the delegate
				self.timer = new Timer(self.slideTimes,
					{
						onPointChange: _goToSlide,
						onTimeUpdate: function (t, d) {
							var frac = t / d;
							var x = _calcSliderPosition(frac);
							_setSliderPosition(x);
							_setDisplayTime(t, d);
						}
					});

				const playerID = self.element.getAttribute('data-id')
				// Adds the video scripts
				_addVideo(playerID);
				// Inserst the dom elements for controling the video

				_insertControls(playerID);
				// Makes one of the screens to appear big, depending on setting
				_initScreensPositions(playerID);
				// Adds the event handlers
				_addEvents(playerID);
			});

		}

		// The function to be called on init
		var _destroy = function () {

		}


		// Inits or returns empty object if init fails
		_init();
		// if (!self.init) {
		// 	return {};
		// }

		return {
			play: _play,
			pause: _pause,
			stop: _stop,
			goto: _goToTime,
			swap: _swapScreens,
			smallScreenPosition: _changeSmallScreenPosition,
			SlideTimeIndicators: _slidesTimeIndicators,
		}

	}


	/*
		API Methods -----------------------------------------------------------
	*/

	// The prezzideo player class
	// @param presentations - settings provided by the user
	// @param options - settings provided by the user
	api.init = function (presentations, options) {

		// Takes into consideration the user's settings
		config = _extendConfig(defaults, options);

		let elements;
		// Get the players 
		if (options.source === 'html') {

			if (typeof presentations === 'string') {
				const container = document.getElementById(presentations);
				const ID = container.getAttribute('data-id');

				elements = [container];
				const slidesContainer = document.getElementById('slides-container_' + ID);

				_calculateTotalSlidesTime(slidesContainer);
			} else if (Array.isArray(presentations)) {
				elements = presentations.map((item) => {

					const container = document.getElementById(item);
					const ID = container.getAttribute('data-id');

					const slidesContainer = document.getElementById('slides-container_' + ID);

					_calculateTotalSlidesTime(slidesContainer);
					return container;
				})
			}

		} else if (options.source === 'json') {
			elements = presentations.map((presentation) => {
				return _createPrezzideoView(document.getElementById(presentation.stage), presentation.assets, presentation.settings);
			});
		}

		const players = [];
		// Initializing Prezzideo instance for each DOM element
		elements.map(async (item, index) => {
			// Setup a player instance and add to the element
			if (typeof item.prezzideo === 'undefined') {
				// Create new Prezzideo instance
				const prezzideo = new Prezzideo(item, index);
				// Set prezzideo to false if setup failed
				item.prezzideo = (Object.keys(prezzideo).length ? prezzideo : false);
				// Callback
				if (typeof config.callbackInit === "function") {
					config.callbackInit(item.prezzideo);
				}
			}
			// adds the player to the array of players
			players.push(item.prezzideo);
		})
		return players;
	}

}(window.prezzideo = window.prezzideo || {}));