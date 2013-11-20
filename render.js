#!/usr/local/bin/node
var argv = require('optimist')
  .demand('_').argv;

if (typeof define === 'undefined') { var define = require('define').noConflict(); }

define(['jquery'], function($) {
  $('body').append('<div id="content"/>');
  define([argv._[0]], function(App) {
    console.log($('body').html());
  });
});
