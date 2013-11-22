if (typeof define === 'undefined') { var define = require('define').noConflict(); }

module.exports = function(target, callback) {

  define(['jquery'], function($) {

    $('body').append('<div id="content"/>');

    define([target], function(App) {
      callback($('body').html());
    });
  });

};
