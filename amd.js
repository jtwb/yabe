if (typeof define === 'undefined') { var define = require('define').noConflict(); }

define(['jquery'], function($) {
  $('body').append('<div id="content"/>');
  define(['./application.js'], function(App) {
    console.log($('body').html());
  });
});
