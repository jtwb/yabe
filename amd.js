if (typeof define === 'undefined') { var define = require('define').noConflict(); }

define(['jquery', './application.js'], function($, App) {
  console.log($('body').html());
});
