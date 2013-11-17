$ = jQuery = require('jquery');

$(function() {
  $('<div id="header"><h1/></div>').appendTo('body');
  $('#header h1').append('<h2>Or, the caped conundrum</h2>');
  console.log($('body').html());
});
