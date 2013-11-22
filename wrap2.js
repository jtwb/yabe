var _ = require('underscore');
var jsdom = require('jsdom').jsdom;
var nodejquery = require('jquery');

module.exports = function isocode(stdin) {

var document = jsdom(stdin || null);
var $ = nodejquery.create(document.parentWindow);

_.extend(this, document.parentWindow);
this.$ = this.jQuery = $;

(function(window, exports, module, define, _) {

with(this) {






}// with this
}).call(this, this); // mask exports, define

}; // define app
