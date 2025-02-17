(function($) {
  'use strict';

  // closest Polyfill (https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (el.matches(s)) { return el; }
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  function scrollTarget($target, duration, callback) {
    var targetY;

    if ($target.length > 0) {
      targetY = Math.ceil($target.offset().top);

      if (duration === 0) {
        $(window).scrollTop(targetY);
        callback();
      } else {
        $.when(
          $('html, body').animate({scrollTop: targetY}, duration, 'swing')
        ).done(function() {
          callback();
        });
      }
    }
  }

  function pjax() {
    var bodyRegExp = /<body(?: .+?)?>/;
    var idRegExp = /id\s*=\s*["|'](.*?)["|'].*?/i;
    // '"
    var classRegExp = /class\s*=\s*["|'](.*?)["|'].*?/i;
    var isVisible = true;
    var loadingTime;
    var bodyId;
    var bodyClass;
    var bodyClassRemove;

    var removeTimestampQueryString = function(href) {
      var newlink = document.createElement('a');
      newlink.setAttribute('href', href);
      var searchString = newlink.search;
      if (searchString !== '') {
        var parameters = searchString.slice(1).split('&');
        parameters = parameters.filter(function(element) {
          var parameter = element.split('=');
          return parameter[0] !== 't';
        });
        newlink.search = parameters.length > 0 ? '?' + parameters.join('&') : '';
        href = newlink.href.replace(/\?$/, '');
      }
      return href;
    };

    document.addEventListener('pjax:send', function() {
      //console.log('Event: pjax:send');
      document.body.classList.add('out');
      setTimeout(function() {
        document.body.classList.add('paging');
        document.body.classList.add('send');
        loadingTime = new Date().getTime();
      }, 60);
      setTimeout(function() {
        isVisible = false;
        if (window.pageYOffset > 130) {
          scrollTarget($('#page'), 0, $.noop);
          luxy.wapperOffset = 0;
        }
        //$('.l-container').addClass('loading');
     }, 360);
    });

    document.addEventListener('pjax:complete', function() {
      //console.log('Event: pjax:complete');
      document.body.classList.remove('out');
      document.body.classList.add('in');
      //if (document.getElementsByClassName('l-kv').length) {
      //  document.body.classList.add('isOpening');
      //}
      if (bodyId === '') {
        document.body.removeAttribute('id')
      } else {
        document.body.id = bodyId;
      }
      if (bodyClassRemove !== '') {
        if (isIE) {
          bodyClassRemove.split(' ').forEach(function(currentValue) {
            document.body.classList.remove(currentValue);
          });
        } else {
          document.body.classList.remove.apply(document.body.classList, bodyClassRemove.split(' '));
        }
      }
      if (bodyClass !== '') {
        if (isIE) {
          bodyClass.split(' ').forEach(function(currentValue) {
            document.body.classList.add(currentValue);
          });
        } else {
          document.body.classList.add.apply(document.body.classList, bodyClass.split(' '));
        }
      }
    });

    document.addEventListener('pjax:success', function() {
      //console.log('Event: pjax:success');
      setTimeout(function() {
        document.body.classList.remove('send');
      }, 60);
      //isVisible = true;
      //$('.l-container').removeClass('loading');
      var pagingFix = bodyId !== 'conceptPage' ? 1600 : 2000;
      setTimeout(function() {
        document.body.classList.remove('in');
        document.body.classList.remove('paging');
        document.body.classList.remove('toTop');
        //if (document.getElementsByClassName('l-kv').length) {
        //  document.body.classList.remove('isOpening');
        //}
      }, pagingFix);
    });

    document.addEventListener('pjax:error', function() {
      //console.log('Event: pjax:error');
    });

    pjaxInstance = new Pjax({
      elements: ['a[href]:not([href^="#"]), form[action]'],
      selectors: ['.js-wrapper', 'title', 'meta'],
      // cacheBust: false,
      switches: {
        '.js-wrapper': function(oldEl, newEl) {
          var _this = this;
          var bodyCheckTimer;
          //console.log('switches:start');
          bodyCheckTimer = setInterval(function() {
            if (!isVisible) {
              clearInterval(bodyCheckTimer);
              $(newEl.outerHTML).imagesLoaded().always(function() {
                var now = new Date().getTime();
                var timer;
                if (now - loadingTime < 500) {
                  timer = 500 - (now - loadingTime);
                } else {
                  timer = 0;
                }
                setTimeout(function() {
                  //console.log('switches:end');
                  oldEl.outerHTML = newEl.outerHTML;
                  _this.onSwitch();
                }, timer);
              });
            }
          }, 50);
        }
      },
      analytics: function() {
        gtag('config', 'UA-91686800-2');
      }
    });

    pjaxInstance._handleResponse = pjaxInstance.handleResponse;
    pjaxInstance.handleResponse = function(responseText, request, href, options) {
      //console.log('handleResponse');
      var result, result2;
      if (responseText !== null) {
        bodyId = '';
        bodyClass = '';
        bodyClassRemove = document.body.className.split(' ').filter(function(element) {
          var isPass;
          switch (element) {
            case 'paging':
            case 'send':
            case 'in':
            case 'out':
              isPass = false;
              break;
            default:
              isPass = true;
          }
          return isPass;
        }).join(' ');
        result = responseText.match(bodyRegExp);
        if (result !== null) {
          result2 = result[0].match(idRegExp);
          if (result2 !== null) {
            bodyId = result2[1];
          }
          result2 = result[0].match(classRegExp);
          if (result2 !== null) {
            bodyClass = result2[1];
          }
        }
      }
      pjaxInstance._handleResponse(responseText, request, href, options);
    };

    pjaxInstance._afterAllSwitches = pjaxInstance.afterAllSwitches;
    pjaxInstance.afterAllSwitches = function() {
      //console.log('afterAllSwitches');
      if (pjaxInstance.options.cacheBust) {
        pjaxInstance.state.href = removeTimestampQueryString(pjaxInstance.state.href);
      }
      pjaxInstance._afterAllSwitches();
    };

    pjaxInstance._latestChance = pjaxInstance.latestChance;
    pjaxInstance.latestChance = function(href) {
      pjaxInstance._latestChance(pjaxInstance.options.cacheBust ? removeTimestampQueryString(href) : href);
    };

    //console.log('Pjax initialized.');
  }

  function loading() {
    var $loading = $('.l-loading');
    var isTop = document.getElementsByClassName('l-kv').length;
    if ($loading.length !== 1) { return; }
    var pagingFix = document.body.getAttribute('id') !== 'conceptPage' ? 1200 : 2000;
    $loading.imagesLoaded({ background: true }).always(function() {
      if (!isTop) {
        document.body.classList.add('paging');
      }
      $loading.removeClass('-standby');
      $('.l-container').addClass('anima');
      //setTimeout(function() {
        $body.imagesLoaded({ background: true }).always(function() {
          if (!isTop) {
            $('.l-container').removeClass('loading').addClass('active');
            setTimeout(function() {
              document.body.classList.remove('send');
              setTimeout(function() {
                document.body.classList.remove('paging');
                document.body.classList.remove('in');
              }, pagingFix);
            }, 300);
          }
          if (!isTop) {
            setTimeout(function() {
              $('.l-container').removeClass('anima');
            }, 1600);
          }
        });
      //}, 100);
    });
  }

  function navigation() {
    var idRegexp = new RegExp(/^[a-zA-Z]+[\w|\-|:|.]+$/),
        header,
        toggle;

    header = new Vue({
      el: '.l-header.type1',
      data: {
        isEnable: true,
        isFixed: false,
        isActive: false,
        enableTransition: false
      },
      mounted: function() {
        var _this = this,
            isChangeFixed = false,
            scrollY = 0,
            prevScrollY = 0,
            scrollDirection = 0;

        $(this.$el).find('a[href]:not([target="_blank"])').on('click', function() {
          totopLink(arguments[0]);
          if (toggle.isShow) {
            vueHub.$emit('closeMenu');
          }
          pjaxInstance.loadUrl(this.href);
          return false;
        });
        $(this.$el).data('vm-header', this);
        $(window).on('scroll', function() {
          prevScrollY = scrollY;
          scrollY = window.pageYOffset;
          scrollDirection = scrollY - prevScrollY;

          if (isChangeFixed) {
            isChangeFixed = false;
            _this.enableTransition = true;
          }
          if (scrollY <= 0) {
            _this.isFixed = false;
            _this.isActive = false;
            _this.enableTransition= false;
          } else {
            if (scrollY > 130) {
              if (!_this.isFixed) {
                _this.isFixed = true;
                isChangeFixed = true;
              }
            } else {
              if (_this.isFixed) {
                _this.isFixed = false;
              }
            }
          }
          if (_this.isEnable && _this.isFixed) {
            _this.isActive = scrollY <= 0 || scrollDirection <= 0;
          }
        });
      },
      methods: {
        openMenu: function() {
          vueHub.$emit('openMenu');
        }
      }
    });
    toggle = new Vue({
      el: '.l-toggle.type1',
      data: {
        isShow: false
      },
      created: function() {
        var _this = this;
        vueHub.$on('openMenu', function() {
          _this.isShow = true;
        });
        vueHub.$on('closeMenu', function() {
          _this.isShow = false;
        });
      },
      mounted: function() {
        $(this.$el).find('a[href]:not([target="_blank"])').on('click', function() {
          totopLink(arguments[0]);
          var _this = this,
               delayTime;

          if (toggle.isShow) {
            vueHub.$emit('closeMenu');
            delayTime = 300;
          } else {
            delayTime = 0;
          }
          setTimeout(function() {
            pjaxInstance.loadUrl(_this.href);
          }, delayTime);
          return false;
        });
      },
      methods: {
        open: function() {
          vueHub.$emit('openMenu');
        },
        close: function() {
          vueHub.$emit('closeMenu');
        }
      }
    });
    new Vue({
      el: '.l-toggleWrap.type1',
      data: {
        isShow: false
      },
      created: function() {
        var _this = this;
        vueHub.$on('openMenu', function() {
          _this.isShow = true;
        });
        vueHub.$on('closeMenu', function() {
          _this.isShow = false;
        });
      },
      methods: {
        open: function() {
          vueHub.$emit('openMenu');
        },
        close: function() {
          vueHub.$emit('closeMenu');
        }
      }
    });

    $(window).on('unload', function() {
      if (header.isOpen) {
        vueHub.$emit('closeMenu');
      }
    });
    $('.l-container').on('click', 'a', function(event) {
      var currentAnchor = location.href.split('#');

      totopLink(arguments[0]);
      var $target = $(event.target),
          thisAnchor = this.href.split('#');

      if (header.isOpen) {
        if ($target.closest('.l-toggle').length !== 0) {
          if (currentAnchor[0] === thisAnchor[0] && thisAnchor.length > 1 && idRegexp.test(thisAnchor[1])) {
            vueHub.$emit('closeMenu');
          }
        }
      }
    });
  }
  
  function navigation2() {
    var idRegexp = new RegExp(/^[a-zA-Z]+[\w|\-|:|.]+$/),
        header,
        toggle;

    header = new Vue({
      el: '.l-header.type2',
      data: {
        isEnable: true,
        isFixed: false,
        isActive: false,
        enableTransition: false
      },
      mounted: function() {
        var _this = this,
            isChangeFixed = false,
            scrollY = 0,
            prevScrollY = 0,
            scrollDirection = 0;

        $(this.$el).find('a[href]:not([target="_blank"])').on('click', function() {
          totopLink(arguments[0]);
          if (toggle.isShow) {
            vueHub.$emit('closeMenu');
          }
          pjaxInstance.loadUrl(this.href);
          return false;
        });
        $(this.$el).data('vm-header', this);
        $(window).on('scroll', function() {
          prevScrollY = scrollY;
          scrollY = window.pageYOffset;
          scrollDirection = scrollY - prevScrollY;

          if (isChangeFixed) {
            isChangeFixed = false;
            _this.enableTransition = true;
          }
          if (scrollY <= 0) {
            _this.isFixed = false;
            _this.isActive = false;
            _this.enableTransition= false;
          } else {
            if (scrollY > 50) {
              if (!_this.isFixed) {
                _this.isFixed = true;
                isChangeFixed = true;
              }
            } else {
              if (_this.isFixed) {
                _this.isFixed = false;
              }
            }
          }
          if (_this.isEnable && _this.isFixed) {
            _this.isActive = scrollY <= 0 || scrollDirection <= 0;
          }
        });
      },
      methods: {
        openMenu: function() {
          vueHub.$emit('openMenu');
        }
      }
    });
    toggle = new Vue({
      el: '.l-toggle.type2',
      data: {
        isShow: false
      },
      created: function() {
        var _this = this;
        vueHub.$on('openMenu', function() {
          _this.isShow = true;
        });
        vueHub.$on('closeMenu', function() {
          _this.isShow = false;
        });
      },
      mounted: function() {
        $(this.$el).find('a[href]:not([target="_blank"])').on('click', function() {
          totopLink(arguments[0]);
          var _this = this,
               delayTime;

          if (toggle.isShow) {
            vueHub.$emit('closeMenu');
            delayTime = 300;
          } else {
            delayTime = 0;
          }
          setTimeout(function() {
            pjaxInstance.loadUrl(_this.href);
          }, delayTime);
          return false;
        });
      },
      methods: {
        open: function() {
          vueHub.$emit('openMenu');
        },
        close: function() {
          vueHub.$emit('closeMenu');
        }
      }
    });
    new Vue({
      el: '.l-toggleWrap.type2',
      data: {
        isShow: false
      },
      created: function() {
        var _this = this;
        vueHub.$on('openMenu', function() {
          _this.isShow = true;
        });
        vueHub.$on('closeMenu', function() {
          _this.isShow = false;
        });
      },
      methods: {
        open: function() {
          vueHub.$emit('openMenu');
        },
        close: function() {
          vueHub.$emit('closeMenu');
        }
      }
    });

    $(window).on('unload', function() {
      if (header.isOpen) {
        vueHub.$emit('closeMenu');
      }
    });
    $('.l-container').on('click', 'a', function(event) {
      var currentAnchor = location.href.split('#');

      totopLink(arguments[0]);
      var $target = $(event.target),
          thisAnchor = this.href.split('#');

      if (header.isOpen) {
        if ($target.closest('.l-toggle').length !== 0) {
          if (currentAnchor[0] === thisAnchor[0] && thisAnchor.length > 1 && idRegexp.test(thisAnchor[1])) {
            vueHub.$emit('closeMenu');
          }
        }
      }
    });
  }

  function hashScroll() {
    var $container = $('.l-container'),
        idRegexp = new RegExp(/^[a-zA-Z]+[\w|\-|:|.]+$/),
        $target;

    $container.on('click', 'a', function() {
      var currentAnchor = location.href.split('#'),
          thisAnchor = this.href.split('#');

      if (currentAnchor[0] === thisAnchor[0] && thisAnchor.length > 1 && idRegexp.test(thisAnchor[1])) {
        $target = $('#' + thisAnchor[1]);
        scrollTarget($target, 500, $.noop);
        return false;
      }
    });
    $(window).on('load', function() {
      var locationHash = '';

      if (location.hash) {
        locationHash = location.hash;
        $target = $(locationHash);
        scrollTarget($target, 500, $.noop);
        if ('replaceState' in history) {
          history.replaceState('', document.title, window.location.pathname + window.location.search);
        }
      }
    });
  }

  function totopLink(e) {
    if (e.target.closest('[data-totop]') !== null) {
      document.body.classList.add('toTop');
    }
  }

  var $body = $('body'),
      vueHub = new Vue(),
      pjaxInstance;
  var isIE = function() {
    var ua = window.navigator.userAgent.toLowerCase();
    return ua.indexOf('msie') >= 0 || ua.indexOf('trident') >= 0;
  }();

  document.addEventListener('DOMContentLoaded', function() {
    pjax();
    loading();
    navigation();
    navigation2();
    hashScroll();
  });
})(jQuery);
//# sourceMappingURL=maps/script.js.map