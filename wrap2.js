if (typeof define === 'undefined') { var define = require('define').noConflict(); }

var _ = require('underscore');

define('application', ['jsdom', 'jquery'], function(document, $) {

_.extend(this, document.parentWindow);
this.$ = this.jQuery = $;

(function(window, exports, define, _) {

with(this) {






}// with this
}).call(this, this); // mask exports, define

}); // define app
