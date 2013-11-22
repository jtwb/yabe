if (typeof define === 'undefined') { var define = require('define').noConflict(); }

// TODO new approach: read > wrap > eval
//
// 1. Readfilesync for target file
//    Target file should be a single combined JS file
//    A) MUST NOT include jQuery
//    B) MAY read values from provided DOM state
//    C) MUST NOT rely on <script> tags in the DOM setup
//    D) MUST NOT rely on user events to run
//    E) MAY use $(fn) or $(document).ready(fn);
//
// 2. Wrap user file
//    A) $ = require('jquery') OR declare(['jquery'], fn($) {
//    B) this.$ = $
//    C) window, document, window.document, this.document = jsdom
//       QUESTION - must (this, window) be unified for some apps to run?
//       What about globals?
//       e.g. this.$, $, window.$ are same in browser
//       Does an off-the-shelf solution exist?
//
// 3. Eval wrapped user file
//
// 4. Extract DOM
//
module.exports = function(target, callback) {

  define(['jquery'], function($) {

    $('body').append('<div id="content"/>');

    define([target], function(App) {
      callback($('body').html());
    });
  });

};
