if (typeof define === 'undefined') { var define = require('define').noConflict(); }

var _ = require('underscore');

define('application', ['jsdom', 'jquery'], function(document, $) {

_.extend(this, document.parentWindow);
var window = this;
this.$ = $;





});
