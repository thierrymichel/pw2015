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

var Theatre = function () {
  this.isAnimating = false;
  this.isOpen = false;
  this.$theatre = $('.theatre');
  this.$theatre.after('<div class="theatre-overlay"></div>');
  this.$theatre.find('.theatre__title').on('click', $.proxy(this.toggle, this));
};

Theatre.prototype.toggle = function () {

  var that = this;
  if (this.isAnimating) {
    return false;
  }
  this.isAnimating = true;

  var onEndAnimationTheatre = function () {

    this.removeEventListener(animEndEventName, onEndAnimationTheatre);
    that.isAnimating = false;
    that.isOpen = that.isOpen ? false : true;

    if (that.isOpen) {
      $('body').addClass('theatre-open');
      $('body').removeClass('theatre-in');
      that.$theatre.addClass('close');
    } else {
      $('.theatre-overlay').fadeOut(300);
      $('body').removeClass('theatre-out');
      that.$theatre.removeClass('close');
      // ugly >_<
      // force repaint after theatre-out animation… beuark!
      // document.querySelector('.theatre__title').style.backgroundColor = '#f99700';
      $('.theatre__title, .theatre').css('background-color', '#f99700');
      $('.theatre__title, .theatre').on('mouseenter touchstart', function () {
        $('.theatre__title').removeAttr('style');
        document.querySelector('.theatre').style.backgroundColor = '';
      });
      // end shame
    }
  };

  if (support.animations) {
    this.$theatre[0].addEventListener(animEndEventName, onEndAnimationTheatre);
  } else {
    onEndAnimationTheatre();
  }

  if (this.isOpen) {
    $('body').removeClass('theatre-open');
    $('body').addClass('theatre-out');
  } else {
    $('body').addClass('theatre-in');
    $('.theatre-overlay').fadeIn(300);
  }
};

module.exports = new Theatre();
