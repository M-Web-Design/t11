(function() {
	'use strict';
	
	(function() {
		var ua = window.navigator.userAgent.toLowerCase(),
			container = document.querySelector('.l-container');
		if (ua.indexOf('msie') !== -1 || ua.indexOf('trident') !== -1) {
			container.classList.add('isIE');
		} else if (ua.indexOf('edge') !== -1) {
			container.classList.add('isEdge');
		}
	}());
	
	window.luxy.originalAttachEvent = window.luxy.attachEvent;
	window.luxy.attachEvent = function() {
		if (!this.isResize) {
			window.luxy.originalAttachEvent();
		}
	};
	window.luxy.resetTargets = function() {
		this.Targets = [];
		this.TargetsLength = 0;
	};
	window.luxy.reapply = function() {
		this.resetTargets();
		this.targets = document.querySelectorAll(this.settings.targets);
		this.apply(this.targets, this.wrapper);
	};
	if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
		window.luxy.wrapperInit = navigator.userAgent.match(/iPhone|iPad|iPod/i) === null ? $.noop : function() {
			$(this.wrapper).css('transform', 'translateZ(0)');
		};
		window.luxy.wrapperUpdate = $.noop;
	}
	
	// オープニング
	var opening = {
		start: function(state) {
			if (!document.querySelector('.l-kv')) { return; }
			imagesLoaded(document.querySelector('.l-kv'), function(instance) {
				opening.visual(state);
			});
		},
		visual: function(state) {
			//console.log('-----> opening');
			window.scrollTo(0, 0);
			this.keyLimit = window.innerHeight;
			this.keyvisual = document.querySelector('.l-kv');
			this.key = document.querySelector('.kv-visual')
			this.aspect = 1200 / 738;
			this.loading(state);
			this.particle();
			this.onResize();
			this.animationElm = document.querySelectorAll('.l-kv svg image, .kv-particle li, .kv-particle span, .kv-particle svg');
		},
		loading: function(state) {
			var _this = this;
			this.container = document.querySelector('.l-container');
			this.cover = document.querySelector('.l-cover');
			this.lastElm = document.querySelector('.l-kv .c-scroll');
			var loadTime = !state ? 1000 : 0;
			setTimeout(function() {
				_this.container.classList.add('anima');
			}, loadTime/5);
			setTimeout(function() {
				_this.container.classList.add('cover');
				_this.cover.addEventListener('transitionend', _this.loadingFix.bind(_this), false);
			}, loadTime/2.5);
			setTimeout(function() {
				_this.container.classList.remove('loading');
			}, loadTime);
		},
		loadingFix: function() {
			var _this = this;
			setTimeout(function() {
				_this.container.classList.add('active');
				_this.cover.removeEventListener('transitionend', _this.loadingFix.bind(_this), false);
				_this.lastElm.addEventListener('transitionend', _this.loadingFixed.bind(_this), false);
			}, 600);
		},
		loadingFixed: function() {
			this.container.classList.remove('cover');
			this.container.classList.remove('anima');
			this.lastElm.removeEventListener('transitionend', this.loadingFixed.bind(this), false);
		},
		particle: function() {
			this.elm = document.querySelector('.kv-particle');
			var min1920 = window.matchMedia('(min-width: 1920px)').matches,
				min960 = window.matchMedia('(min-width: 960px)').matches,
				min567 = window.matchMedia('(min-width: 567px)').matches,
				num = min1920 ? 24 : min960 ? 20 : min567 ? 16 : 12;
			this.p = { num: num, pos: [5, 90], wid: [16, 56], dur: [8, 24] };
			this.createParticle();
		},
		createParticle: function() {
			//console.log(this);
			var p = this.p;
			for (var i = p.num; i--;) {
				var w = ranNum(p.wid[0], p.wid[1]),
					l = ranNum(p.pos[0], p.pos[1]),
					d = ranNum(p.dur[0], p.dur[1]),
					liStyle = ' style="left:' + l + '%;animation-duration:' + d + 's;animation-delay:' + (1.4 + Math.round(d*5)/100) + 's"',
					spanStyle = ' style="animation-duration:' + d/2 + 's"',
					svgStyle = ' style="width:' + w + 'px;height:' + Math.round(w*.9) + 'px;animation-duration:' + d/4 + 's;animation-delay:-' + d/2 + 's"',
					particleElms = '<li' + liStyle + '><span' + spanStyle + '><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 9"' + svgStyle + '><path d="M5 0l-5 9h10z"/></svg></span></li>';
				this.elm.insertAdjacentHTML('beforeend', particleElms);
			}
		},
		onResize: function() {
			if (!this.key) { return; }
			if (window.innerWidth / window.innerHeight > this.aspect) {
				this.container.classList.add('width');
				this.key.style['width'] = window.innerWidth;
			} else {
				this.container.classList.remove('width');
				this.key.style['height'] = window.innerHeight;
			}
			this.keyLimit = window.innerHeight;
		},
		hideCheck: function() {
			if (this.keyLimit < window.pageYOffset) {
				if (!this.animationStoped) {
					for (let i = this.animationElm.length; i--;) {
						this.animationElm[i].style.animationPlayState = 'paused';
					}
					this.keyvisual.classList.add('paused');
					this.animationStoped = true;
				}
			} else {
				if (this.animationStoped) {
					for (let i = this.animationElm.length; i--;) {
						this.animationElm[i].style.animationPlayState = '';
					}
					this.keyvisual.classList.remove('paused');
					this.animationStoped = false;
				}
			}
		}
	}
	
	// backgroundScroll
	var backgroundScroll = {
		init: function() {
			this.isPjax = false;
			this.bg = document.querySelector('.l-background');
			this.friction = 0.12;
			this.startPos = 0;
			this.scOffset = 0;
			
			this.loop();
		},
		onScroll: function() {
			//console.log(window.pageYOffset);
			this.startPos = this.scOffset;
			var scOffset = this.cal();
			if (this.isPjax) {
				this.friction = 1;
			} else {
				this.friction = 0.12;
				this.bg.style.cssText = 'background-position: 50% -' + scOffset + 'px';
			}
			//if (this.startPos !== this.scOffset) console.log(this.scOffset);
			this.startPos = this.scOffset;
		},
		cal: function() {
			var scY = window.pageYOffset;
			this.scOffset += (scY - this.scOffset) * this.friction;
			this.scOffset = Math.round(this.scOffset * 100) / 100;
			if (this.scOffset < 0.1) {
				this.scOffset = 0;
			} else if (this.scOffset > this.wrapperBtm - 0.1) {
				this.scOffset = this.wrapperBtm;
			}
			return this.scOffset % (443 / 2);
		},
		loop: function() {
			backgroundScroll.timer = requestAnimationFrame(backgroundScroll.loop);
			backgroundScroll.onScroll();
		}
	};
	
	// luxy.js
	function setLuxy() {
		if (luxy.isResize) {
			if (document.querySelector('.js-luxy')) {
				luxy.reapply();
			} else {
				luxy.resetTargets();
			}
		} else {
			luxy.init({
				wrapper: '#page',
				targets : '.js-luxy',
				wrapperSpeed:  0.12
			});
		}
	}
	
	// with in-view.min.js
	function inview() {
		if (document.getElementsByClassName('js-inview').length) {
			inView('.js-inview').on('enter', function(el) {
				el.classList.add('in-view')
			}).check();
			inView.offset(window.innerHeight / 8);
		}
	}
	
	// .c-link
	var addLinkCircle = {
		init: function() {
			var cLink = document.querySelectorAll('.c-link');
			var linkSvg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 80 80"><defs><path id="cLinkPath" d="M-1-1v21.3h10.1v39.4h-10.1v21.3h82v-82z"/></defs><clipPath id="cLinkMask"><use xlink:href="#cLinkPath" overflow="visible"/></clipPath><path class="c" d="M5 24c6.1-13.3 19.5-22.5 35-22.5 21.3 0 38.5 17.2 38.5 38.5s-17.2 38.5-38.5 38.5c-15.5 0-28.9-9.2-35-22.5"/></svg>';
			for (var i = cLink.length; i--;) {
				cLink[i].insertAdjacentHTML('beforeend', linkSvg);
				cLink[i].addEventListener('mouseleave', this.mouseOut.bind(this), false);
				cLink[i].addEventListener('transitionend', this.transitionEnd, false);
			}
			this.cLink = cLink;
			//console.log( document.querySelector(".c-link .c").getTotalLength() );
		},
		mouseOut: function(event) {
			var target = event.target.closest('.c-link');
			target.classList.add('out');
		},
		transitionEnd: function(event) {
			//console.log('transitionEnd', event.target);
			event.target.classList.remove('out');
		},
		destroy: function() {
			var cLink = this.cLink;
			for (var i = cLink.length; i--;) {
				cLink[i].removeEventListener('mouseleave', this.mouseOut.bind(this), false);
				cLink[i].removeEventListener('transitionend', this.transitionEnd, false);
			}
		}
	}
	
	// .l-entry のカバー
	var entryCover = {
		init: function() {
			var cover = document.querySelector('.l-entry .cover');
			cover.addEventListener('transitionend', this.transitionEnd);
		},
		transitionEnd: function(e) {
			if (e.propertyName === 'transform' || e.propertyName === 'webkitTransform') {
				this.parentNode.classList.add('fix');
				this.removeEventListener('transitionend', this.transitionEnd);
			}
		}
	}
	
	// 関数
	function ranNum(min, max) {
		min = parseInt(min);
		max = parseInt(max);
		return Math.floor( Math.random() * (max - min + 1) ) + min;
	}
	
	window.addEventListener('resize', opening.onResize.bind(opening));
	window.addEventListener('scroll', opening.hideCheck.bind(opening));
	
	document.addEventListener('pjax:send', function() {
		backgroundScroll.isPjax = true;
	});
	document.addEventListener('pjax:complete', function() {
		if (document.getElementsByClassName('l-kv').length) {
			document.querySelector('.l-container').classList.remove('active');
		}
		if (document.querySelector('.l-entry .cover')) {
			entryCover.init();
		}
		if (document.querySelector('.js-luxy')) {
			setLuxy();
		}
	});
	document.addEventListener('pjax:success', function() {
		backgroundScroll.isPjax = false;
		if (document.getElementsByClassName('l-kv').length) {
			opening.start('isPjax');
		}
		addLinkCircle.init();
		inview();
	});
	document.addEventListener('DOMContentLoaded', function() {
		backgroundScroll.init();
		if (document.getElementsByClassName('l-kv').length) {
			opening.start();
		}
		if (document.querySelector('.l-entry .cover')) {
			entryCover.init();
		}
		//if (document.querySelector('.js-luxy')) {
			setLuxy();
		//}
	
		// .c-linkにcircle挿入
		addLinkCircle.init();
		inview();
	}, false);
})();
//# sourceMappingURL=maps/visual.js.map