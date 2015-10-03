'use strict';
/*jslint indent: 2, nomen: true, devel: true, browser: true, vars: true*/
/*global $, Modernizr, classie */

var support = { animations : Modernizr.cssanimations };
var animEndEventNames = {
  'WebkitAnimation' : 'webkitAnimationEnd',
  'OAnimation' : 'oAnimationEnd',
  'msAnimation' : 'MSAnimationEnd',
  'animation' : 'animationend'
};
var animEndEventName = animEndEventNames[Modernizr.prefixed('animation')];

var Hero = function () {
  return this;
};

Hero.prototype.init = function () {

  this.isAnimating = false;
  this.current = 0;
  this.$items = null;

  var that = this;

  $('<div class="hero">')
    .insertBefore('.movie')
    .load('hero.html', function () {

      var $hero = $(this);

      var $nav = $('.hero__nav');
      var $navNext = $nav.find('.hero__next');
      var $navPrev = $nav.find('.hero__prev');

      that.$items = $('.hero__item');
      that.itemsCount = that.$items.length;

      $hero.find('img').each(function () {
        var src = this.src;
        $(this)
          .parent('li')
          .css('background-image', 'url(' + src + ')')
          .end()
          .remove();
      });

      $navPrev.on('click', $.proxy(that.onClickPrev, that));
      $navNext.on('click', $.proxy(that.onClickNext, that));
    });
};

Hero.prototype.onClickPrev = function (e) {
  e.preventDefault();
  this.navigate('prev');
};

Hero.prototype.onClickNext = function (e) {
  e.preventDefault();
  this.navigate('next');
};

Hero.prototype.navigate = function (dir) {
  var that = this;
  if (that.isAnimating) {
    return false;
  }
  that.isAnimating = true;
  var cntAnims = 0,
    currentItem = this.$items[this.current],
    nextItem;

  if (dir === 'next') {
    this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;
  } else if (dir === 'prev') {
    this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;
  }

  nextItem = this.$items[this.current];

  var onEndAnimationCurrentItem = function () {
    this.removeEventListener(animEndEventName, onEndAnimationCurrentItem);
    $(this).removeClass('current');
    $(this).removeClass(dir === 'next' ? 'nav-out-next' : 'nav-out-prev');
    cntAnims += 1;
    if (cntAnims === 2) {
      that.isAnimating = false;
    }
  };

  var onEndAnimationNextItem = function () {
    this.removeEventListener(animEndEventName, onEndAnimationNextItem);
    $(this).addClass('current');
    $(this).removeClass(dir === 'next' ? 'nav-in-next' : 'nav-in-prev');
    cntAnims += 1;
    if (cntAnims === 2) {
      that.isAnimating = false;
    }
  };

  if (support.animations) {
    currentItem.addEventListener(animEndEventName, onEndAnimationCurrentItem);
    nextItem.addEventListener(animEndEventName, onEndAnimationNextItem);
  } else {
    onEndAnimationCurrentItem();
    onEndAnimationNextItem();
  }

  $(currentItem).addClass(dir === 'next' ? 'nav-out-next' : 'nav-out-prev');
  $(nextItem).addClass(dir === 'next' ? 'nav-in-next' : 'nav-in-prev');
};

Hero.prototype.remove = function () {
  $('.hero').remove();
};

module.exports = new Hero();
