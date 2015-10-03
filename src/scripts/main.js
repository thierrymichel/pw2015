'use strict';
/*jslint indent: 2, nomen: true, node: true, devel: true, browser: true, vars: true*/
/*global Modernizr */

var $ = require('jquery');
var Mq = require('./parts/Mq.js');
var Hero = require('./parts/Hero.js');
require('./parts/Theatre.js');

var Demo = function () {
  return this;
};

Demo.prototype.init = function () {
  Mq.register('small', 'large', {
    match : function () {
      var $theatre = $('.theatre'),
        start = 155;
      $theatre.offset({top: 155 + scrollY});
      $(window).on('scroll', function () {
        var scrollY = $(document).scrollTop();
        $theatre.css('top', start - scrollY);
        if (scrollY >= start) {
          $theatre.css('top', 0);
        }
      });
    },
    unmatch : function () {
      $(window).off('scroll');
      $('.theatre').removeAttr('style');
    }
  });

  Mq.register('large', {
    match : function () {
      $('body').addClass('large');
      Hero.init();
    },
    unmatch : function () {
      $('body').removeClass('large');
      Hero.remove();
    }
  });

};

document.addEventListener('DOMContentLoaded', function () {
  (new Demo()).init();
});
