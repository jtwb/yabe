function Namespace(namespaceStr, fn) {

  var pieces = namespaceStr.split('.') || [namespaceStr];

  var node = window;

  var len = pieces.length;
  for (var i = 0; i < len; i++) {
    var piece = pieces[i];
    if (typeof(node[piece]) === 'undefined') {
      node = node[piece] = {
        // _parent: node, // not needed (yet)
        _namespace: (node._namespace ? node._namespace + '.' : '') + piece,
        extend: $.extend
      };
    }
    else
      node = node[piece];
  }

  if (fn) fn.call(node, node);

  return node;
}
;
/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */


window.matchMedia = window.matchMedia || (function( doc, undefined ) {

    "use strict";

    var bool,
        docElem = doc.documentElement,
        refNode = docElem.firstElementChild || docElem.firstChild,
    // fakeBody required for <FF4 when executed in <head>
        fakeBody = doc.createElement( "body" ),
        div = doc.createElement( "div" );

    div.id = "mq-test-1";
    div.style.cssText = "position:absolute;top:-100em";
    fakeBody.style.background = "none";
    fakeBody.appendChild(div);

    return function(q){

        div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

        docElem.insertBefore( fakeBody, refNode );
        bool = div.offsetWidth === 42;
        docElem.removeChild( fakeBody );

        return {
            matches: bool,
            media: q
        };

    };

}( document ));

(function($, undefined) {

/**
 * Unobtrusive scripting adapter for jQuery
 * https://github.com/rails/jquery-ujs
 *
 * Requires jQuery 1.7.0 or later.
 *
 * Released under the MIT license
 *
 */

  // Cut down on the number of issues from people inadvertently including jquery_ujs twice
  // by detecting and raising an error when it happens.
  if ( $.rails !== undefined ) {
    $.error('jquery-ujs has already been loaded!');
  }

  // Shorthand to make it a little easier to call public rails functions from within rails.js
  var rails;
  var $document = $(document);

  $.rails = rails = {
    // Link elements bound by jquery-ujs
    linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote], a[data-disable-with]',

    // Button elements boud jquery-ujs
    buttonClickSelector: 'button[data-remote]',

    // Select elements bound by jquery-ujs
    inputChangeSelector: 'select[data-remote], input[data-remote], textarea[data-remote]',

    // Form elements bound by jquery-ujs
    formSubmitSelector: 'form',

    // Form input elements bound by jquery-ujs
    formInputClickSelector: 'form input[type=submit], form input[type=image], form button[type=submit], form button:not([type])',

    // Form input elements disabled during form submission
    disableSelector: 'input[data-disable-with], button[data-disable-with], textarea[data-disable-with]',

    // Form input elements re-enabled after form submission
    enableSelector: 'input[data-disable-with]:disabled, button[data-disable-with]:disabled, textarea[data-disable-with]:disabled',

    // Form required input elements
    requiredInputSelector: 'input[name][required]:not([disabled]),textarea[name][required]:not([disabled])',

    // Form file input elements
    fileInputSelector: 'input[type=file]',

    // Link onClick disable selector with possible reenable after remote submission
    linkDisableSelector: 'a[data-disable-with]',

    // Make sure that every Ajax request sends the CSRF token
    CSRFProtection: function(xhr) {
      var token = $('meta[name="csrf-token"]').attr('content');
      if (token) xhr.setRequestHeader('X-CSRF-Token', token);
    },

    // Triggers an event on an element and returns false if the event result is false
    fire: function(obj, name, data) {
      var event = $.Event(name);
      obj.trigger(event, data);
      return event.result !== false;
    },

    // Default confirm dialog, may be overridden with custom confirm dialog in $.rails.confirm
    confirm: function(message) {
      return confirm(message);
    },

    // Default ajax function, may be overridden with custom function in $.rails.ajax
    ajax: function(options) {
      return $.ajax(options);
    },

    // Default way to get an element's href. May be overridden at $.rails.href.
    href: function(element) {
      return element.attr('href');
    },

    // Submits "remote" forms and links with ajax
    handleRemote: function(element) {
      var method, url, data, elCrossDomain, crossDomain, withCredentials, dataType, options;

      if (rails.fire(element, 'ajax:before')) {
        elCrossDomain = element.data('cross-domain');
        crossDomain = elCrossDomain === undefined ? null : elCrossDomain;
        withCredentials = element.data('with-credentials') || null;
        dataType = element.data('type') || ($.ajaxSettings && $.ajaxSettings.dataType);

        if (element.is('form')) {
          method = element.attr('method');
          url = element.attr('action');
          data = element.serializeArray();
          // memoized value from clicked submit button
          var button = element.data('ujs:submit-button');
          if (button) {
            data.push(button);
            element.data('ujs:submit-button', null);
          }
        } else if (element.is(rails.inputChangeSelector)) {
          method = element.data('method');
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + "&" + element.data('params');
        } else if (element.is(rails.buttonClickSelector)) {
          method = element.data('method') || 'get';
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + "&" + element.data('params');
        } else {
          method = element.data('method');
          url = rails.href(element);
          data = element.data('params') || null;
        }

        options = {
          type: method || 'GET', data: data, dataType: dataType,
          // stopping the "ajax:beforeSend" event will cancel the ajax request
          beforeSend: function(xhr, settings) {
            if (settings.dataType === undefined) {
              xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
            }
            return rails.fire(element, 'ajax:beforeSend', [xhr, settings]);
          },
          success: function(data, status, xhr) {
            element.trigger('ajax:success', [data, status, xhr]);
          },
          complete: function(xhr, status) {
            element.trigger('ajax:complete', [xhr, status]);
          },
          error: function(xhr, status, error) {
            element.trigger('ajax:error', [xhr, status, error]);
          },
          crossDomain: crossDomain
        };

        // There is no withCredentials for IE6-8 when
        // "Enable native XMLHTTP support" is disabled
        if (withCredentials) {
          options.xhrFields = {
            withCredentials: withCredentials
          };
        }

        // Only pass url to `ajax` options if not blank
        if (url) { options.url = url; }

        var jqxhr = rails.ajax(options);
        element.trigger('ajax:send', jqxhr);
        return jqxhr;
      } else {
        return false;
      }
    },

    // Handles "data-method" on links such as:
    // <a href="/users/5" data-method="delete" rel="nofollow" data-confirm="Are you sure?">Delete</a>
    handleMethod: function(link) {
      var href = rails.href(link),
        method = link.data('method'),
        target = link.attr('target'),
        csrf_token = $('meta[name=csrf-token]').attr('content'),
        csrf_param = $('meta[name=csrf-param]').attr('content'),
        form = $('<form method="post" action="' + href + '"></form>'),
        metadata_input = '<input name="_method" value="' + method + '" type="hidden" />';

      if (csrf_param !== undefined && csrf_token !== undefined) {
        metadata_input += '<input name="' + csrf_param + '" value="' + csrf_token + '" type="hidden" />';
      }

      if (target) { form.attr('target', target); }

      form.hide().append(metadata_input).appendTo('body');
      form.submit();
    },

    /* Disables form elements:
      - Caches element value in 'ujs:enable-with' data store
      - Replaces element text with value of 'data-disable-with' attribute
      - Sets disabled property to true
    */
    disableFormElements: function(form) {
      form.find(rails.disableSelector).each(function() {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        element.data('ujs:enable-with', element[method]());
        element[method](element.data('disable-with'));
        element.prop('disabled', true);
      });
    },

    /* Re-enables disabled form elements:
      - Replaces element text with cached value from 'ujs:enable-with' data store (created in `disableFormElements`)
      - Sets disabled property to false
    */
    enableFormElements: function(form) {
      form.find(rails.enableSelector).each(function() {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        if (element.data('ujs:enable-with')) element[method](element.data('ujs:enable-with'));
        element.prop('disabled', false);
      });
    },

   /* For 'data-confirm' attribute:
      - Fires `confirm` event
      - Shows the confirmation dialog
      - Fires the `confirm:complete` event

      Returns `true` if no function stops the chain and user chose yes; `false` otherwise.
      Attaching a handler to the element's `confirm` event that returns a `falsy` value cancels the confirmation dialog.
      Attaching a handler to the element's `confirm:complete` event that returns a `falsy` value makes this function
      return false. The `confirm:complete` event is fired whether or not the user answered true or false to the dialog.
   */
    allowAction: function(element) {
      var message = element.data('confirm'),
          answer = false, callback;
      if (!message) { return true; }

      if (rails.fire(element, 'confirm')) {
        answer = rails.confirm(message);
        callback = rails.fire(element, 'confirm:complete', [answer]);
      }
      return answer && callback;
    },

    // Helper function which checks for blank inputs in a form that match the specified CSS selector
    blankInputs: function(form, specifiedSelector, nonBlank) {
      var inputs = $(), input, valueToCheck,
          selector = specifiedSelector || 'input,textarea',
          allInputs = form.find(selector);

      allInputs.each(function() {
        input = $(this);
        valueToCheck = input.is('input[type=checkbox],input[type=radio]') ? input.is(':checked') : input.val();
        // If nonBlank and valueToCheck are both truthy, or nonBlank and valueToCheck are both falsey
        if (!valueToCheck === !nonBlank) {

          // Don't count unchecked required radio if other radio with same name is checked
          if (input.is('input[type=radio]') && allInputs.filter('input[type=radio]:checked[name="' + input.attr('name') + '"]').length) {
            return true; // Skip to next input
          }

          inputs = inputs.add(input);
        }
      });
      return inputs.length ? inputs : false;
    },

    // Helper function which checks for non-blank inputs in a form that match the specified CSS selector
    nonBlankInputs: function(form, specifiedSelector) {
      return rails.blankInputs(form, specifiedSelector, true); // true specifies nonBlank
    },

    // Helper function, needed to provide consistent behavior in IE
    stopEverything: function(e) {
      $(e.target).trigger('ujs:everythingStopped');
      e.stopImmediatePropagation();
      return false;
    },

    //  replace element's html with the 'data-disable-with' after storing original html
    //  and prevent clicking on it
    disableElement: function(element) {
      element.data('ujs:enable-with', element.html()); // store enabled state
      element.html(element.data('disable-with')); // set to disabled state
      element.bind('click.railsDisable', function(e) { // prevent further clicking
        return rails.stopEverything(e);
      });
    },

    // restore element to its original state which was disabled by 'disableElement' above
    enableElement: function(element) {
      if (element.data('ujs:enable-with') !== undefined) {
        element.html(element.data('ujs:enable-with')); // set to old enabled state
        element.removeData('ujs:enable-with'); // clean up cache
      }
      element.unbind('click.railsDisable'); // enable element
    }

  };

  if (rails.fire($document, 'rails:attachBindings')) {

    $.ajaxPrefilter(function(options, originalOptions, xhr){ if ( !options.crossDomain ) { rails.CSRFProtection(xhr); }});

    $document.delegate(rails.linkDisableSelector, 'ajax:complete', function() {
        rails.enableElement($(this));
    });

    $document.delegate(rails.linkClickSelector, 'click.rails', function(e) {
      var link = $(this), method = link.data('method'), data = link.data('params');
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      if (link.is(rails.linkDisableSelector)) rails.disableElement(link);

      if (link.data('remote') !== undefined) {
        if ( (e.metaKey || e.ctrlKey) && (!method || method === 'GET') && !data ) { return true; }

        var handleRemote = rails.handleRemote(link);
        // response from rails.handleRemote() will either be false or a deferred object promise.
        if (handleRemote === false) {
          rails.enableElement(link);
        } else {
          handleRemote.error( function() { rails.enableElement(link); } );
        }
        return false;

      } else if (link.data('method')) {
        rails.handleMethod(link);
        return false;
      }
    });

    $document.delegate(rails.buttonClickSelector, 'click.rails', function(e) {
      var button = $(this);
      if (!rails.allowAction(button)) return rails.stopEverything(e);

      rails.handleRemote(button);
      return false;
    });

    $document.delegate(rails.inputChangeSelector, 'change.rails', function(e) {
      var link = $(this);
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      rails.handleRemote(link);
      return false;
    });

    $document.delegate(rails.formSubmitSelector, 'submit.rails', function(e) {
      var form = $(this),
        remote = form.data('remote') !== undefined,
        blankRequiredInputs = rails.blankInputs(form, rails.requiredInputSelector),
        nonBlankFileInputs = rails.nonBlankInputs(form, rails.fileInputSelector);

      if (!rails.allowAction(form)) return rails.stopEverything(e);

      // skip other logic when required values are missing or file upload is present
      if (blankRequiredInputs && form.attr("novalidate") == undefined && rails.fire(form, 'ajax:aborted:required', [blankRequiredInputs])) {
        return rails.stopEverything(e);
      }

      if (remote) {
        if (nonBlankFileInputs) {
          // slight timeout so that the submit button gets properly serialized
          // (make it easy for event handler to serialize form without disabled values)
          setTimeout(function(){ rails.disableFormElements(form); }, 13);
          var aborted = rails.fire(form, 'ajax:aborted:file', [nonBlankFileInputs]);

          // re-enable form elements if event bindings return false (canceling normal form submission)
          if (!aborted) { setTimeout(function(){ rails.enableFormElements(form); }, 13); }

          return aborted;
        }

        rails.handleRemote(form);
        return false;

      } else {
        // slight timeout so that the submit button gets properly serialized
        setTimeout(function(){ rails.disableFormElements(form); }, 13);
      }
    });

    $document.delegate(rails.formInputClickSelector, 'click.rails', function(event) {
      var button = $(this);

      if (!rails.allowAction(button)) return rails.stopEverything(event);

      // register the pressed submit button
      var name = button.attr('name'),
        data = name ? {name:name, value:button.val()} : null;

      button.closest('form').data('ujs:submit-button', data);
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:beforeSend.rails', function(event) {
      if (this == event.target) rails.disableFormElements($(this));
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:complete.rails', function(event) {
      if (this == event.target) rails.enableFormElements($(this));
    });

    $(function(){
      // making sure that all forms have actual up-to-date token(cached forms contain old one)
      var csrf_token = $('meta[name=csrf-token]').attr('content');
      var csrf_param = $('meta[name=csrf-param]').attr('content');
      $('form input[name="' + csrf_param + '"]').val(csrf_token);
    });
  }

})( jQuery );
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */




var Hogan = {};

(function (Hogan, useArrayBuffer) {
  Hogan.Template = function (codeObj, text, compiler, options) {
    codeObj = codeObj || {};
    this.r = codeObj.code || this.r;
    this.c = compiler;
    this.options = options;
    this.text = text || '';
    this.partials = codeObj.partials || {};
    this.subs = codeObj.subs || {};
    this.ib();
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // ensurePartial
    ep: function(symbol, partials) {
      var partial = this.partials[symbol];

      // check to see that if we've instantiated this partial before
      var template = partials[partial.name];
      if (partial.instance && partial.base == template) {
        return partial.instance;
      }

      if (typeof template == 'string') {
        if (!this.c) {
          throw new Error("No compiler available.");
        }
        template = this.c.compile(template, this.options);
      }

      if (!template) {
        return null;
      }

      // We use this to check whether the partials dictionary has changed
      this.partials[symbol].base = template;

      if (partial.subs) {
        template = createSpecializedPartial(template, partial.subs, partial.partials);
      }

      this.partials[symbol].instance = template;
      return template;
    },

    // tries to find a partial in the curent scope and render it
    rp: function(symbol, context, partials, indent) {
      var partial = this.ep(symbol, partials);
      if (!partial) {
        return '';
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ms(val, ctx, partials, inverted, start, end, tags);
      }

      pass = (val === '') || !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        return ctx[ctx.length - 1];
      }

      for (var i = 1; i < names.length; i++) {
        if (val && typeof val == 'object' && val[names[i]] != null) {
          cx = val;
          val = val[names[i]];
        } else {
          val = '';
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.mv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        if (v && typeof v == 'object' && v[key] != null) {
          val = v[key];
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.mv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ls: function(func, cx, partials, text, tags) {
      var oldTags = this.options.delimiters;

      this.options.delimiters = tags;
      this.b(this.ct(coerceToString(func.call(cx, text)), cx, partials));
      this.options.delimiters = oldTags;

      return false;
    },

    // compile text
    ct: function(text, cx, partials) {
      if (this.options.disableLambda) {
        throw new Error('Lambda features disabled.');
      }
      return this.c.compile(text, this.options).render(cx, partials);
    },

    // template result buffering
    b: (useArrayBuffer) ? function(s) { this.buf.push(s); } :
                          function(s) { this.buf += s; },

    fl: (useArrayBuffer) ? function() { var r = this.buf.join(''); this.buf = []; return r; } :
                           function() { var r = this.buf; this.buf = ''; return r; },
    // init the buffer
    ib: function () {
      this.buf = (useArrayBuffer) ? [] : '';
    },

    // method replace section
    ms: function(func, ctx, partials, inverted, start, end, tags) {
      var cx = ctx[ctx.length - 1],
          result = func.call(cx);

      if (typeof result == 'function') {
        if (inverted) {
          return true;
        } else {
          return this.ls(result, cx, partials, this.text.substring(start, end), tags);
        }
      }

      return result;
    },

    // method replace variable
    mv: function(func, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = func.call(cx);

      if (typeof result == 'function') {
        return this.ct(coerceToString(result.call(cx)), cx, partials);
      }

      return result;
    },

    sub: function(name, context, partials, indent) {
      var f = this.subs[name];
      if (f) {
        f(context, partials, this, indent);
      }
    }

  };

  function createSpecializedPartial(instance, subs, partials) {
    function PartialTemplate() {};
    PartialTemplate.prototype = instance;
    function Substitutions() {};
    Substitutions.prototype = instance.subs;
    var key;
    var partial = new PartialTemplate();
    partial.subs = new Substitutions();
    partial.ib();

    for (key in subs) {
      partial.subs[key] = subs[key];
    }

    for (key in partials) {
      partial.partials[key] = partials[key];
    }

    return partial;
  }

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos =/\'/g,
      rQuot = /\"/g,
      hChars =/[&<>\"\']/;

  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp,'&amp;')
        .replace(rLt,'&lt;')
        .replace(rGt,'&gt;')
        .replace(rApos,'&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);



(function (Hogan) {
  // Setup regex  assignments
  // remove whitespace according to Mustache spec
  var rIsWhitespace = /\S/,
      rQuot = /\"/g,
      rNewline =  /\n/g,
      rCr = /\r/g,
      rSlash = /\\/g;

  Hogan.tags = {
    '#': 1, '^': 2, '<': 3, '$': 4,
    '/': 5, '!': 6, '>': 7, '=': 8, '_v': 9,
    '{': 10, '&': 11, '_t': 12
  };

  Hogan.scan = function scan(text, delimiters) {
    var len = text.length,
        IN_TEXT = 0,
        IN_TAG_TYPE = 1,
        IN_TAG = 2,
        state = IN_TEXT,
        tagType = null,
        tag = null,
        buf = '',
        tokens = [],
        seenTag = false,
        i = 0,
        lineStart = 0,
        otag = '{{',
        ctag = '}}';

    function addBuf() {
      if (buf.length > 0) {
        tokens.push({tag: '_t', text: new String(buf)});
        buf = '';
      }
    }

    function lineIsWhitespace() {
      var isAllWhitespace = true;
      for (var j = lineStart; j < tokens.length; j++) {
        isAllWhitespace =
          (Hogan.tags[tokens[j].tag] < Hogan.tags['_v']) ||
          (tokens[j].tag == '_t' && tokens[j].text.match(rIsWhitespace) === null);
        if (!isAllWhitespace) {
          return false;
        }
      }

      return isAllWhitespace;
    }

    function filterLine(haveSeenTag, noNewLine) {
      addBuf();

      if (haveSeenTag && lineIsWhitespace()) {
        for (var j = lineStart, next; j < tokens.length; j++) {
          if (tokens[j].text) {
            if ((next = tokens[j+1]) && next.tag == '>') {
              // set indent to token value
              next.indent = tokens[j].text.toString()
            }
            tokens.splice(j, 1);
          }
        }
      } else if (!noNewLine) {
        tokens.push({tag:'\n'});
      }

      seenTag = false;
      lineStart = tokens.length;
    }

    function changeDelimiters(text, index) {
      var close = '=' + ctag,
          closeIndex = text.indexOf(close, index),
          delimiters = trim(
            text.substring(text.indexOf('=', index) + 1, closeIndex)
          ).split(' ');

      otag = delimiters[0];
      ctag = delimiters[1];

      return closeIndex + close.length - 1;
    }

    if (delimiters) {
      delimiters = delimiters.split(' ');
      otag = delimiters[0];
      ctag = delimiters[1];
    }

    for (i = 0; i < len; i++) {
      if (state == IN_TEXT) {
        if (tagChange(otag, text, i)) {
          --i;
          addBuf();
          state = IN_TAG_TYPE;
        } else {
          if (text.charAt(i) == '\n') {
            filterLine(seenTag);
          } else {
            buf += text.charAt(i);
          }
        }
      } else if (state == IN_TAG_TYPE) {
        i += otag.length - 1;
        tag = Hogan.tags[text.charAt(i + 1)];
        tagType = tag ? text.charAt(i + 1) : '_v';
        if (tagType == '=') {
          i = changeDelimiters(text, i);
          state = IN_TEXT;
        } else {
          if (tag) {
            i++;
          }
          state = IN_TAG;
        }
        seenTag = i;
      } else {
        if (tagChange(ctag, text, i)) {
          tokens.push({tag: tagType, n: trim(buf), otag: otag, ctag: ctag,
                       i: (tagType == '/') ? seenTag - otag.length : i + ctag.length});
          buf = '';
          i += ctag.length - 1;
          state = IN_TEXT;
          if (tagType == '{') {
            if (ctag == '}}') {
              i++;
            } else {
              cleanTripleStache(tokens[tokens.length - 1]);
            }
          }
        } else {
          buf += text.charAt(i);
        }
      }
    }

    filterLine(seenTag, true);

    return tokens;
  }

  function cleanTripleStache(token) {
    if (token.n.substr(token.n.length - 1) === '}') {
      token.n = token.n.substring(0, token.n.length - 1);
    }
  }

  function trim(s) {
    if (s.trim) {
      return s.trim();
    }

    return s.replace(/^\s*|\s*$/g, '');
  }

  function tagChange(tag, text, index) {
    if (text.charAt(index) != tag.charAt(0)) {
      return false;
    }

    for (var i = 1, l = tag.length; i < l; i++) {
      if (text.charAt(index + i) != tag.charAt(i)) {
        return false;
      }
    }

    return true;
  }

  // the tags allowed inside super templates
  var allowedInSuper = {'_t': true, '\n': true, '$': true, '/': true};

  function buildTree(tokens, kind, stack, customTags) {
    var instructions = [],
        opener = null,
        tail = null,
        token = null;

    tail = stack[stack.length - 1];

    while (tokens.length > 0) {
      token = tokens.shift();

      if (tail && tail.tag == '<' && !(token.tag in allowedInSuper)) {
        throw new Error('Illegal content in < super tag.');
      }

      if (Hogan.tags[token.tag] <= Hogan.tags['$'] || isOpener(token, customTags)) {
        stack.push(token);
        token.nodes = buildTree(tokens, token.tag, stack, customTags);
      } else if (token.tag == '/') {
        if (stack.length === 0) {
          throw new Error('Closing tag without opener: /' + token.n);
        }
        opener = stack.pop();
        if (token.n != opener.n && !isCloser(token.n, opener.n, customTags)) {
          throw new Error('Nesting error: ' + opener.n + ' vs. ' + token.n);
        }
        opener.end = token.i;
        return instructions;
      } else if (token.tag == '\n') {
        token.last = (tokens.length == 0) || (tokens[0].tag == '\n');
      }

      instructions.push(token);
    }

    if (stack.length > 0) {
      throw new Error('missing closing tag: ' + stack.pop().n);
    }

    return instructions;
  }

  function isOpener(token, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].o == token.n) {
        token.tag = '#';
        return true;
      }
    }
  }

  function isCloser(close, open, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].c == close && tags[i].o == open) {
        return true;
      }
    }
  }

  function stringifySubstitutions(obj) {
    var items = [];
    for (var key in obj) {
      items.push('"' + esc(key) + '": function(c,p,t,i) {' + obj[key] + '}');
    }
    return "{ " + items.join(",") + " }";
  }

  function stringifyPartials(codeObj) {
    var partials = [];
    for (var key in codeObj.partials) {
      partials.push('"' + esc(key) + '":{name:"' + esc(codeObj.partials[key].name) + '", ' + stringifyPartials(codeObj.partials[key]) + "}");
    }
    return "partials: {" + partials.join(",") + "}, subs: " + stringifySubstitutions(codeObj.subs);
  }

  Hogan.stringify = function(codeObj, text, options) {
    return "{code: function (c,p,i) { " + Hogan.wrapMain(codeObj.code) + " }," + stringifyPartials(codeObj) +  "}";
  }

  var serialNo = 0;
  Hogan.generate = function(tree, text, options) {
    serialNo = 0;
    var context = { code: '', subs: {}, partials: {} };
    Hogan.walk(tree, context);

    if (options.asString) {
      return this.stringify(context, text, options);
    }

    return this.makeTemplate(context, text, options);
  }

  Hogan.wrapMain = function(code) {
    return 'var t=this;t.b(i=i||"");' + code + 'return t.fl();';
  }

  Hogan.template = Hogan.Template;

  Hogan.makeTemplate = function(codeObj, text, options) {
    var template = this.makePartials(codeObj);
    template.code = new Function('c', 'p', 'i', this.wrapMain(codeObj.code));
    return new this.template(template, text, this, options);
  }

  Hogan.makePartials = function(codeObj) {
    var key, template = {subs: {}, partials: codeObj.partials, name: codeObj.name};
    for (key in template.partials) {
      template.partials[key] = this.makePartials(template.partials[key]);
    }
    for (key in codeObj.subs) {
      template.subs[key] = new Function('c', 'p', 't', 'i', codeObj.subs[key]);
    }
    return template;
  }

  function esc(s) {
    return s.replace(rSlash, '\\\\')
            .replace(rQuot, '\\\"')
            .replace(rNewline, '\\n')
            .replace(rCr, '\\r');
  }

  function chooseMethod(s) {
    return (~s.indexOf('.')) ? 'd' : 'f';
  }

  function createPartial(node, context) {
    var prefix = "<" + (context.prefix || "");
    var sym = prefix + node.n + serialNo++;
    context.partials[sym] = {name: node.n, partials: {}};
    context.code += 't.b(t.rp("' +  esc(sym) + '",c,p,"' + (node.indent || '') + '"));';
    return sym;
  }

  Hogan.codegen = {
    '#': function(node, context) {
      context.code += 'if(t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),' +
                      'c,p,0,' + node.i + ',' + node.end + ',"' + node.otag + " " + node.ctag + '")){' +
                      't.rs(c,p,' + 'function(c,p,t){';
      Hogan.walk(node.nodes, context);
      context.code += '});c.pop();}';
    },

    '^': function(node, context) {
      context.code += 'if(!t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),c,p,1,0,0,"")){';
      Hogan.walk(node.nodes, context);
      context.code += '};';
    },

    '>': createPartial,
    '<': function(node, context) {
      var ctx = {partials: {}, code: '', subs: {}, inPartial: true};
      Hogan.walk(node.nodes, ctx);
      var template = context.partials[createPartial(node, context)];
      template.subs = ctx.subs;
      template.partials = ctx.partials;
    },

    '$': function(node, context) {
      var ctx = {subs: {}, code: '', partials: context.partials, prefix: node.n};
      Hogan.walk(node.nodes, ctx);
      context.subs[node.n] = ctx.code;
      if (!context.inPartial) {
        context.code += 't.sub("' + esc(node.n) + '",c,p,i);';
      }
    },

    '\n': function(node, context) {
      context.code += write('"\\n"' + (node.last ? '' : ' + i'));
    },

    '_v': function(node, context) {
      context.code += 't.b(t.v(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));';
    },

    '_t': function(node, context) {
      context.code += write('"' + esc(node.text) + '"');
    },

    '{': tripleStache,

    '&': tripleStache
  }

  function tripleStache(node, context) {
    context.code += 't.b(t.t(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));';
  }

  function write(s) {
    return 't.b(' + s + ');';
  }

  Hogan.walk = function (nodelist, context) {
    var func;
    for (var i = 0, l = nodelist.length; i < l; i++) {
      func = Hogan.codegen[nodelist[i].tag];
      func && func(nodelist[i], context);
    }
    return context;
  }

  Hogan.parse = function(tokens, text, options) {
    options = options || {};
    return buildTree(tokens, '', [], options.sectionTags || []);
  },

  Hogan.cache = {};

  Hogan.cacheKey = function(text, options) {
    return [text, !!options.asString, !!options.disableLambda].join('||');
  },

  Hogan.compile = function(text, options) {
    options = options || {};
    var key = Hogan.cacheKey(text, options);
    var template = this.cache[key];

    if (template) {
      return template;
    }

    template = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
    return this.cache[key] = template;
  };
})(typeof exports !== 'undefined' ? exports : Hogan);

//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);
//     Backbone.js 1.0.0

//     (c) 2010-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.0.0';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender || root.$;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    _.extend(this, _.pick(options, modelOptions));
    if (options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // A list of options to be attached directly to the model, if provided.
  var modelOptions = ['url', 'urlRoot', 'collection'];

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options || {}, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.url) this.url = options.url;
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, merge: false, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.defaults(options || {}, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults(options || {}, setOptions);
      if (options.parse) models = this.parse(models, options);
      if (!_.isArray(models)) models = models ? [models] : [];
      var i, l, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(models[i], options))) continue;

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.remove) modelMap[existing.cid] = true;
          if (options.merge) {
            existing.set(model.attributes, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }

        // This is a new model, push it to the `toAdd` list.
        } else if (options.add) {
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
      }

      // Remove nonexistent models if appropriate.
      if (options.remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          push.apply(this.models, toAdd);
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = toAdd.length; i < l; i++) {
        (model = toAdd[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (sort) this.trigger('sort', this, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Figure out the smallest index at which a model should be inserted so as
    // to maintain order.
    sortedIndex: function(model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(e.g. model, collection, id, className)* are
    // attached directly to the view.  See `viewOptions` for an exhaustive
    // list.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && window.ActiveXObject &&
          !(window.external && window.external.msActiveXFilteringEnabled)) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

}).call(this);
/*globals Backbone:true, _:true, jQuery:true*/

Backbone.Paginator = (function ( Backbone, _, $ ) {
  "use strict";


  var bbVer = _.map(Backbone.VERSION.split('.'), function(digit) {
    return parseInt(digit, 10);
  });

  var Paginator = {};
  Paginator.version = "<%= pkg.version %>";

  // @name: clientPager
  //
  // @tagline: Paginator for client-side data
  //
  // @description:
  // This paginator is responsible for providing pagination
  // and sort capabilities for a single payload of data
  // we wish to paginate by the UI for easier browsering.
  //
  Paginator.clientPager = Backbone.Collection.extend({

    // DEFAULTS FOR SORTING & FILTERING
    useDiacriticsPlugin: true, // use diacritics plugin if available
    useLevenshteinPlugin: true, // use levenshtein plugin if available
    sortColumn: "",
    sortDirection: "desc",
    lastSortColumn: "",
    fieldFilterRules: [],
    lastFieldFilterRules: [],
    filterFields: "",
    filterExpression: "",
    lastFilterExpression: "",

    //DEFAULT PAGINATOR UI VALUES
    defaults_ui: {
      firstPage: 0,
      currentPage: 1,
      perPage: 5,
      totalPages: 10,
      pagesInRange: 4
    },

    // Default values used when sorting and/or filtering.
    initialize: function(){
      //LISTEN FOR ADD & REMOVE EVENTS THEN REMOVE MODELS FROM ORGINAL MODELS
      this.on('add', this.addModel, this);
      this.on('remove', this.removeModel, this);

      // SET DEFAULT VALUES (ALLOWS YOU TO POPULATE PAGINATOR MAUNALLY)
      this.setDefaults();
    },


    setDefaults: function() {
      // SET DEFAULT UI SETTINGS
      var options = _.defaults(this.paginator_ui, this.defaults_ui);

      //UPDATE GLOBAL UI SETTINGS
      _.defaults(this, options);
    },

    addModel: function(model) {
      this.origModels.push(model);
    },

    removeModel: function(model) {
      var index = _.indexOf(this.origModels, model);

      this.origModels.splice(index, 1);
    },

    sync: function ( method, model, options ) {
      var self = this;

      // SET DEFAULT VALUES
      this.setDefaults();

      // Some values could be functions, let's make sure
      // to change their scope too and run them
      var queryAttributes = {};
      _.each(_.result(self, "server_api"), function(value, key){
        if( _.isFunction(value) ) {
          value = _.bind(value, self);
          value = value();
        }
        queryAttributes[key] = value;
      });

      var queryOptions = _.clone(self.paginator_core);
      _.each(queryOptions, function(value, key){
        if( _.isFunction(value) ) {
          value = _.bind(value, self);
          value = value();
        }
        queryOptions[key] = value;
      });

      // Create default values if no others are specified
      queryOptions = _.defaults(queryOptions, {
        timeout: 25000,
        cache: false,
        type: 'GET',
        dataType: 'jsonp'
      });

      queryOptions = _.extend(queryOptions, {
        data: decodeURIComponent($.param(queryAttributes)),
        processData: false,
        url: _.result(queryOptions, 'url')
      }, options);

      var promiseSuccessFormat = !(bbVer[0] === 0 &&
                                   bbVer[1] === 9 &&
                                   bbVer[2] === 10);

      var isBeforeBackbone_1_0 = bbVer[0] === 0;

      var success = queryOptions.success;
      queryOptions.success = function ( resp, status, xhr ) {
        if ( success ) {
          // This is to keep compatibility with Backbone 0.9.10
          if (promiseSuccessFormat) {
            success( resp, status, xhr );
          } else {
            success( model, resp, queryOptions );
          }
        }
        if ( isBeforeBackbone_1_0 && model && model.trigger ) {
          model.trigger( 'sync', model, resp, queryOptions );
        }
      };

      var error = queryOptions.error;
      queryOptions.error = function ( xhr ) {
        if ( error ) {
          error( model, xhr, queryOptions );
        }
        if ( isBeforeBackbone_1_0 && model && model.trigger ) {
          model.trigger( 'error', model, xhr, queryOptions );
        }
      };

      var xhr = queryOptions.xhr = Backbone.ajax( queryOptions );
      if ( model && model.trigger ) {
        model.trigger('request', model, xhr, queryOptions);
      }
      return xhr;
    },

    nextPage: function (options) {
      if(this.currentPage < this.information.totalPages) {
        this.currentPage = ++this.currentPage;
        this.pager(options);
      }
    },

    previousPage: function (options) {
      if(this.currentPage > 1) {
        this.currentPage = --this.currentPage;
        this.pager(options);
      }
    },

    goTo: function ( page, options ) {
      if(page !== undefined){
        this.currentPage = parseInt(page, 10);
        this.pager(options);
      }
    },

    howManyPer: function ( perPage ) {
      if(perPage !== undefined){
        var lastPerPage = this.perPage;
        this.perPage = parseInt(perPage, 10);
        this.currentPage = Math.ceil( ( lastPerPage * ( this.currentPage - 1 ) + 1 ) / perPage);
        this.pager();
      }
    },


    // setSort is used to sort the current model. After
    // passing 'column', which is the model's field you want
    // to filter and 'direction', which is the direction
    // desired for the ordering ('asc' or 'desc'), pager()
    // and info() will be called automatically.
    setSort: function ( column, direction ) {
      if(column !== undefined && direction !== undefined){
        this.lastSortColumn = this.sortColumn;
        this.sortColumn = column;
        this.sortDirection = direction;
        this.pager();
        this.info();
      }
    },

    // setFieldFilter is used to filter each value of each model
    // according to `rules` that you pass as argument.
    // Example: You have a collection of books with 'release year' and 'author'.
    // You can filter only the books that were released between 1999 and 2003
    // And then you can add another `rule` that will filter those books only to
    // authors who's name start with 'A'.
    setFieldFilter: function ( fieldFilterRules ) {
      if( !_.isEmpty( fieldFilterRules ) ) {
        this.lastFieldFilterRules = this.fieldFilterRules;
        this.fieldFilterRules = fieldFilterRules;
        this.pager();
        this.info();
        // if all the filters are removed, we should save the last filter
        // and then let the list reset to it's original state.
      } else {
        this.lastFieldFilterRules = this.fieldFilterRules;
        this.fieldFilterRules = '';
        this.pager();
        this.info();
      }
    },

    // doFakeFieldFilter can be used to get the number of models that will remain
    // after calling setFieldFilter with a filter rule(s)
    doFakeFieldFilter: function ( rules ) {
      if( !_.isEmpty( rules ) ) {
        var testModels = this.origModels;
        if (testModels === undefined) {
          testModels = this.models;
        }

        testModels = this._fieldFilter(testModels, rules);

        // To comply with current behavior, also filter by any previously defined setFilter rules.
        if ( this.filterExpression !== "" ) {
          testModels = this._filter(testModels, this.filterFields, this.filterExpression);
        }

        // Return size
        return testModels.length;
      }

    },

    // setFilter is used to filter the current model. After
    // passing 'fields', which can be a string referring to
    // the model's field, an array of strings representing
    // each of the model's fields or an object with the name
    // of the model's field(s) and comparing options (see docs)
    // you wish to filter by and
    // 'filter', which is the word or words you wish to
    // filter by, pager() and info() will be called automatically.
    setFilter: function ( fields, filter ) {
      if( fields !== undefined && filter !== undefined ){
        this.filterFields = fields;
        this.lastFilterExpression = this.filterExpression;
        this.filterExpression = filter;
        this.pager();
        this.info();
      }
    },

    // doFakeFilter can be used to get the number of models that will
    // remain after calling setFilter with a `fields` and `filter` args.
    doFakeFilter: function ( fields, filter ) {
      if( fields !== undefined && filter !== undefined ){
        var testModels = this.origModels;
        if (testModels === undefined) {
          testModels = this.models;
        }

        // To comply with current behavior, first filter by any previously defined setFieldFilter rules.
        if ( !_.isEmpty( this.fieldFilterRules ) ) {
          testModels = this._fieldFilter(testModels, this.fieldFilterRules);
        }

        testModels = this._filter(testModels, fields, filter);

        // Return size
        return testModels.length;
      }
    },


    // pager is used to sort, filter and show the data
    // you expect the library to display.
    pager: function (options) {
      var self = this,
      disp = this.perPage,
      start = (self.currentPage - 1) * disp,
      stop = start + disp;
      // Saving the original models collection is important
      // as we could need to sort or filter, and we don't want
      // to loose the data we fetched from the server.
      if (self.origModels === undefined) {
        self.origModels = self.models;
      }

      self.models = self.origModels.slice();

      // Check if sorting was set using setSort.
      if ( this.sortColumn !== "" ) {
        self.models = self._sort(self.models, this.sortColumn, this.sortDirection);
      }

      // Check if field-filtering was set using setFieldFilter
      if ( !_.isEmpty( this.fieldFilterRules ) ) {
        self.models = self._fieldFilter(self.models, this.fieldFilterRules);
      }

      // Check if filtering was set using setFilter.
      if ( this.filterExpression !== "" ) {
        self.models = self._filter(self.models, this.filterFields, this.filterExpression);
      }

      // If the sorting or the filtering was changed go to the first page
      if ( this.lastSortColumn !== this.sortColumn || this.lastFilterExpression !== this.filterExpression || !_.isEqual(this.fieldFilterRules, this.lastFieldFilterRules) ) {
        start = 0;
        stop = start + disp;
        self.currentPage = 1;

        this.lastSortColumn = this.sortColumn;
        this.lastFieldFilterRules = this.fieldFilterRules;
        this.lastFilterExpression = this.filterExpression;
      }

      // We need to save the sorted and filtered models collection
      // because we'll use that sorted and filtered collection in info().
      self.sortedAndFilteredModels = self.models.slice();
      self.info();
      self.reset(self.models.slice(start, stop));

      // This is somewhat of a hack to get all the nextPage, prevPage, and goTo methods
      // to work with a success callback (as in the requestPager). Realistically there is no failure case here,
      // but maybe we could catch exception and trigger a failure callback?
      _.result(options, 'success');
    },

    // The actual place where the collection is sorted.
    // Check setSort for arguments explicacion.
    _sort: function ( models, sort, direction ) {
      models = models.sort(function (a, b) {
        var ac = a.get(sort),
        bc = b.get(sort);

        if ( _.isUndefined(ac) || _.isUndefined(bc) || ac === null || bc === null ) {
          return 0;
        } else {
          /* Make sure that both ac and bc are lowercase strings.
           * .toString() first so we don't have to worry if ac or bc
           * have other String-only methods.
           */
          ac = ac.toString().toLowerCase();
          bc = bc.toString().toLowerCase();
        }

        if (direction === 'desc') {

          // We need to know if there aren't any non-number characters
          // and that there are numbers-only characters and maybe a dot
          // if we have a float.
          // Oh, also a '-' for negative numbers!
          if((!ac.match(/[^\-\d\.]/) && ac.match(/-?[\d\.]+/)) &&
               (!bc.match(/[^\-\d\.]/) && bc.match(/-?[\d\.]+/))){

            if( (ac - 0) < (bc - 0) ) {
              return 1;
            }
            if( (ac - 0) > (bc - 0) ) {
              return -1;
            }
          } else {
            if (ac < bc) {
              return 1;
            }
            if (ac > bc) {
              return -1;
            }
          }

        } else {

          //Same as the regexp check in the 'if' part.
          if((!ac.match(/[^\-\d\.]/) && ac.match(/-?[\d\.]+/)) &&
             (!bc.match(/[^\-\d\.]/) && bc.match(/-?[\d\.]+/))){
            if( (ac - 0) < (bc - 0) ) {
              return -1;
            }
            if( (ac - 0) > (bc - 0) ) {
              return 1;
            }
          } else {
            if (ac < bc) {
              return -1;
            }
            if (ac > bc) {
              return 1;
            }
          }

        }

        if (a.cid && b.cid){
          var aId = a.cid,
          bId = b.cid;

          if (aId < bId) {
            return -1;
          }
          if (aId > bId) {
            return 1;
          }
        }

        return 0;
      });

      return models;
    },

    // The actual place where the collection is field-filtered.
    // Check setFieldFilter for arguments explicacion.
    _fieldFilter: function( models, rules ) {

      // Check if there are any rules
      if ( _.isEmpty(rules) ) {
        return models;
      }

      var filteredModels = [];

      // Iterate over each rule
      _.each(models, function(model){

        var should_push = true;

        // Apply each rule to each model in the collection
        _.each(rules, function(rule){

          // Don't go inside the switch if we're already sure that the model won't be included in the results
          if( !should_push ){
            return false;
          }

          should_push = false;

          // The field's value will be passed to a custom function, which should
          // return true (if model should be included) or false (model should be ignored)
          if(rule.type === "function"){
            var f = _.wrap(rule.value, function(func){
              return func( model.get(rule.field) );
            });
            if( f() ){
              should_push = true;
            }

            // The field's value is required to be non-empty
          }else if(rule.type === "required"){
            if( !_.isEmpty( model.get(rule.field).toString() ) ) {
              should_push = true;
            }

            // The field's value is required to be greater tan N (numbers only)
          }else if(rule.type === "min"){
            if( !_.isNaN( Number( model.get(rule.field) ) ) &&
               !_.isNaN( Number( rule.value ) ) &&
                 Number( model.get(rule.field) ) >= Number( rule.value ) ) {
              should_push = true;
            }

            // The field's value is required to be smaller tan N (numbers only)
          }else if(rule.type === "max"){
            if( !_.isNaN( Number( model.get(rule.field) ) ) &&
               !_.isNaN( Number( rule.value ) ) &&
                 Number( model.get(rule.field) ) <= Number( rule.value ) ) {
              should_push = true;
            }

            // The field's value is required to be between N and M (numbers only)
          }else if(rule.type === "range"){
            if( !_.isNaN( Number( model.get(rule.field) ) ) &&
               _.isObject( rule.value ) &&
                 !_.isNaN( Number( rule.value.min ) ) &&
                   !_.isNaN( Number( rule.value.max ) ) &&
                     Number( model.get(rule.field) ) >= Number( rule.value.min ) &&
                       Number( model.get(rule.field) ) <= Number( rule.value.max ) ) {
              should_push = true;
            }

            // The field's value is required to be more than N chars long
          }else if(rule.type === "minLength"){
            if( model.get(rule.field).toString().length >= rule.value ) {
              should_push = true;
            }

            // The field's value is required to be no more than N chars long
          }else if(rule.type === "maxLength"){
            if( model.get(rule.field).toString().length <= rule.value ) {
              should_push = true;
            }

            // The field's value is required to be more than N chars long and no more than M chars long
          }else if(rule.type === "rangeLength"){
            if( _.isObject( rule.value ) &&
               !_.isNaN( Number( rule.value.min ) ) &&
                 !_.isNaN( Number( rule.value.max ) ) &&
                   model.get(rule.field).toString().length >= rule.value.min &&
                     model.get(rule.field).toString().length <= rule.value.max ) {
              should_push = true;
            }

            // The field's value is required to be equal to one of the values in rules.value
          }else if(rule.type === "oneOf"){
            if( _.isArray( rule.value ) &&
               _.include( rule.value, model.get(rule.field) ) ) {
              should_push = true;
            }

            // The field's value is required to be equal to the value in rules.value
          }else if(rule.type === "equalTo"){
            if( rule.value === model.get(rule.field) ) {
              should_push = true;
            }

          }else if(rule.type === "containsAllOf"){
            if( _.isArray( rule.value ) &&
                _.isArray(model.get(rule.field)) &&
                _.intersection( rule.value, model.get(rule.field)).length === rule.value.length) {
              should_push = true;
            }

              // The field's value is required to match the regular expression
          }else if(rule.type === "pattern"){
            if( model.get(rule.field).toString().match(rule.value) ) {
              should_push = true;
            }

            //Unknown type
          }else{
            should_push = false;
          }

        });

        if( should_push ){
          filteredModels.push(model);
        }

      });

      return filteredModels;
    },

    // The actual place where the collection is filtered.
    // Check setFilter for arguments explicacion.
    _filter: function ( models, fields, filter ) {

      //  For example, if you had a data model containing cars like { color: '', description: '', hp: '' },
      //  your fields was set to ['color', 'description', 'hp'] and your filter was set
      //  to "Black Mustang 300", the word "Black" will match all the cars that have black color, then
      //  "Mustang" in the description and then the HP in the 'hp' field.
      //  NOTE: "Black Musta 300" will return the same as "Black Mustang 300"

      // We accept fields to be a string, an array or an object
      // but if string or array is passed we need to convert it
      // to an object.

      var self = this;

      var obj_fields = {};

      if( _.isString( fields ) ) {
        obj_fields[fields] = {cmp_method: 'regexp'};
      }else if( _.isArray( fields ) ) {
        _.each(fields, function(field){
          obj_fields[field] = {cmp_method: 'regexp'};
        });
      }else{
        _.each(fields, function( cmp_opts, field ) {
          obj_fields[field] = _.defaults(cmp_opts, { cmp_method: 'regexp' });
        });
      }

      fields = obj_fields;

      //Remove diacritic characters if diacritic plugin is loaded
      if( _.has(Backbone.Paginator, 'removeDiacritics') && self.useDiacriticsPlugin ){
        filter = Backbone.Paginator.removeDiacritics(filter);
      }

      // 'filter' can be only a string.
      // If 'filter' is string we need to convert it to
      // a regular expression.
      // For example, if 'filter' is 'black dog' we need
      // to find every single word, remove duplicated ones (if any)
      // and transform the result to '(black|dog)'
      if( filter === '' || !_.isString(filter) ) {
        return models;
      } else {
        var words = _.map(filter.match(/\w+/ig), function(element) { return element.toLowerCase(); });
        var pattern = "(" + _.uniq(words).join("|") + ")";
        var regexp = new RegExp(pattern, "igm");
      }

      var filteredModels = [];

      // We need to iterate over each model
      _.each( models, function( model ) {

        var matchesPerModel = [];

        // and over each field of each model
        _.each( fields, function( cmp_opts, field ) {

          var value = model.get( field );

          if( value ) {

            // The regular expression we created earlier let's us detect if a
            // given string contains each and all of the words in the regular expression
            // or not, but in both cases match() will return an array containing all
            // the words it matched.
            var matchesPerField = [];

            if( _.has(Backbone.Paginator, 'removeDiacritics') && self.useDiacriticsPlugin ){
              value = Backbone.Paginator.removeDiacritics(value.toString());
            }else{
              value = value.toString();
            }

            // Levenshtein cmp
            if( cmp_opts.cmp_method === 'levenshtein' && _.has(Backbone.Paginator, 'levenshtein') && self.useLevenshteinPlugin ) {
              var distance = Backbone.Paginator.levenshtein(value, filter);

              _.defaults(cmp_opts, { max_distance: 0 });

              if( distance <= cmp_opts.max_distance ) {
                matchesPerField = _.uniq(words);
              }

              // Default (RegExp) cmp
            }else{
              matchesPerField = value.match( regexp );
            }

            matchesPerField = _.map(matchesPerField, function(match) {
              return match.toString().toLowerCase();
            });

            _.each(matchesPerField, function(match){
              matchesPerModel.push(match);
            });

          }

        });

        // We just need to check if the returned array contains all the words in our
        // regex, and if it does, it means that we have a match, so we should save it.
        matchesPerModel = _.uniq( _.without(matchesPerModel, "") );

        if(  _.isEmpty( _.difference(words, matchesPerModel) ) ) {
          filteredModels.push(model);
        }

      });

      return filteredModels;
    },

    // You shouldn't need to call info() as this method is used to
    // calculate internal data as first/prev/next/last page...
    info: function () {
      var self = this,
      info = {},
      totalRecords = (self.sortedAndFilteredModels) ? self.sortedAndFilteredModels.length : self.length,
      totalPages = Math.ceil(totalRecords / self.perPage);

      info = {
        totalUnfilteredRecords: self.origModels.length,
        totalRecords: totalRecords,
        currentPage: self.currentPage,
        perPage: this.perPage,
        totalPages: totalPages,
        lastPage: totalPages,
        previous: false,
        next: false,
        startRecord: totalRecords === 0 ? 0 : (self.currentPage - 1) * this.perPage + 1,
        endRecord: Math.min(totalRecords, self.currentPage * this.perPage)
      };

      if (self.currentPage > 1) {
        info.previous = self.currentPage - 1;
      }

      if (self.currentPage < info.totalPages) {
        info.next = self.currentPage + 1;
      }

      info.pageSet = self.setPagination(info);

      self.information = info;
      return info;
    },


    // setPagination also is an internal function that shouldn't be called directly.
    // It will create an array containing the pages right before and right after the
    // actual page.
    setPagination: function ( info ) {

      var pages = [], i = 0, l = 0;

      // How many adjacent pages should be shown on each side?
      var ADJACENTx2 = this.pagesInRange * 2,
      LASTPAGE = Math.ceil(info.totalRecords / info.perPage);

      if (LASTPAGE > 1) {

        // not enough pages to bother breaking it up
        if (LASTPAGE <= (1 + ADJACENTx2)) {
          for (i = 1, l = LASTPAGE; i <= l; i++) {
            pages.push(i);
          }
        }

        // enough pages to hide some
        else {

          //close to beginning; only hide later pages
          if (info.currentPage <=  (this.pagesInRange + 1)) {
            for (i = 1, l = 2 + ADJACENTx2; i < l; i++) {
              pages.push(i);
            }
          }

          // in middle; hide some front and some back
          else if (LASTPAGE - this.pagesInRange > info.currentPage && info.currentPage > this.pagesInRange) {
            for (i = info.currentPage - this.pagesInRange; i <= info.currentPage + this.pagesInRange; i++) {
              pages.push(i);
            }
          }

          // close to end; only hide early pages
          else {
            for (i = LASTPAGE - ADJACENTx2; i <= LASTPAGE; i++) {
              pages.push(i);
            }
          }
        }

      }

      return pages;

    },

    bootstrap: function(options) {
      _.extend(this, options);
      this.goTo(1);
      this.info();
      return this;
    }

  });

  // function aliasing
  Paginator.clientPager.prototype.prevPage = Paginator.clientPager.prototype.previousPage;

  // Helper function to generate rejected Deferred
  var reject = function () {
    var response = new $.Deferred();
    response.reject();
    return response.promise();
  };

  // @name: requestPager
  //
  // Paginator for server-side data being requested from a backend/API
  //
  // @description:
  // This paginator is responsible for providing pagination
  // and sort capabilities for requests to a server-side
  // data service (e.g an API)
  //
  Paginator.requestPager = Backbone.Collection.extend({

    sync: function ( method, model, options ) {

      var self = this;

      self.setDefaults();

      // Some values could be functions, let's make sure
      // to change their scope too and run them
      var queryAttributes = {};
      _.each(_.result(self, "server_api"), function(value, key){
        if( _.isFunction(value) ) {
          value = _.bind(value, self);
          value = value();
        }
        queryAttributes[key] = value;
      });

      var queryOptions = _.clone(self.paginator_core);
      _.each(queryOptions, function(value, key){
        if( _.isFunction(value) ) {
          value = _.bind(value, self);
          value = value();
        }
        queryOptions[key] = value;
      });

      // Create default values if no others are specified
      queryOptions = _.defaults(queryOptions, {
        timeout: 25000,
        cache: false,
        type: 'GET',
        dataType: 'jsonp'
      });

      // Allows the passing in of {data: {foo: 'bar'}} at request time to overwrite server_api defaults
      if( options.data ){
        options.data = decodeURIComponent($.param(_.extend(queryAttributes,options.data)));
      }else{
        options.data = decodeURIComponent($.param(queryAttributes));
      }

      queryOptions = _.extend(queryOptions, {
        data: decodeURIComponent($.param(queryAttributes)),
        processData: false,
        url: _.result(queryOptions, 'url')
      }, options);

      var promiseSuccessFormat = !(bbVer[0] === 0 &&
                                   bbVer[1] === 9 &&
                                   bbVer[2] === 10);

      var isBeforeBackbone_1_0 = bbVer[0] === 0;

      var success = queryOptions.success;
      queryOptions.success = function ( resp, status, xhr ) {

        if ( success ) {
          // This is to keep compatibility with Backbone 0.9.10
          if (promiseSuccessFormat) {
            success( resp, status, xhr );
          } else {
            success( model, resp, queryOptions );
          }
        }
        if (isBeforeBackbone_1_0 && model && model.trigger ) {
          model.trigger( 'sync', model, resp, queryOptions );
        }
      };

      var error = queryOptions.error;
      queryOptions.error = function ( xhr ) {
        if ( error ) {
          error( xhr );
        }
        if ( isBeforeBackbone_1_0 && model && model.trigger ) {
          model.trigger( 'error', model, xhr, queryOptions );
        }
      };

      var xhr = queryOptions.xhr = Backbone.ajax( queryOptions );
      if ( model && model.trigger ) {
        model.trigger('request', model, xhr, queryOptions);
      }
      return xhr;
    },

    setDefaults: function() {
      var self = this;

      // Create default values if no others are specified
      _.defaults(self.paginator_ui, {
        firstPage: 0,
        currentPage: 1,
        perPage: 5,
        totalPages: 10,
        pagesInRange: 4
      });

      // Change scope of 'paginator_ui' object values
      _.each(self.paginator_ui, function(value, key) {
        if (_.isUndefined(self[key])) {
          self[key] = self.paginator_ui[key];
        }
      });
    },

    requestNextPage: function ( options ) {
      if ( this.currentPage !== undefined ) {
        this.currentPage += 1;
        return this.pager( options );
      } else {
        return reject();
      }
    },

    requestPreviousPage: function ( options ) {
      if ( this.currentPage !== undefined ) {
        this.currentPage -= 1;
        return this.pager( options );
      } else {
        return reject();
      }
    },

    updateOrder: function ( column, options ) {
      if (column !== undefined) {
        this.sortField = column;
        return this.pager( options );
      } else {
        return reject();
      }
    },

    goTo: function ( page, options ) {
      if ( page !== undefined ) {
        this.currentPage = parseInt(page, 10);
        return this.pager( options );
      } else {
        return reject();
      }
    },

    howManyPer: function ( count, options ) {
      if ( count !== undefined ) {
        this.currentPage = this.firstPage;
        this.perPage = count;
        return this.pager( options );
      } else {
        return reject();
      }
    },

    info: function () {

      var info = {
        // If parse() method is implemented and totalRecords is set to the length
        // of the records returned, make it available. Else, default it to 0
        totalRecords: this.totalRecords || 0,

        currentPage: this.currentPage,
        firstPage: this.firstPage,
        totalPages: Math.ceil(this.totalRecords / this.perPage),
        lastPage: this.totalPages, // should use totalPages in template
        perPage: this.perPage,
        previous:false,
        next:false
      };

      if (this.currentPage > 1) {
        info.previous = this.currentPage - 1;
      }

      if (this.currentPage < info.totalPages) {
        info.next = this.currentPage + 1;
      }

      // left around for backwards compatibility
      info.hasNext = info.next;
      info.hasPrevious = info.next;

      info.pageSet = this.setPagination(info);

      this.information = info;
      return info;
    },

    setPagination: function ( info ) {

      var pages = [], i = 0, l = 0;

      // How many adjacent pages should be shown on each side?
      var ADJACENTx2 = this.pagesInRange * 2,
      LASTPAGE = Math.ceil(info.totalRecords / info.perPage);

      if (LASTPAGE > 1) {

        // not enough pages to bother breaking it up
        if (LASTPAGE <= (1 + ADJACENTx2)) {
          for (i = 1, l = LASTPAGE; i <= l; i++) {
            pages.push(i);
          }
        }

        // enough pages to hide some
        else {

          //close to beginning; only hide later pages
          if (info.currentPage <=  (this.pagesInRange + 1)) {
            for (i = 1, l = 2 + ADJACENTx2; i < l; i++) {
              pages.push(i);
            }
          }

          // in middle; hide some front and some back
          else if (LASTPAGE - this.pagesInRange > info.currentPage && info.currentPage > this.pagesInRange) {
            for (i = info.currentPage - this.pagesInRange; i <= info.currentPage + this.pagesInRange; i++) {
              pages.push(i);
            }
          }

          // close to end; only hide early pages
          else {
            for (i = LASTPAGE - ADJACENTx2; i <= LASTPAGE; i++) {
              pages.push(i);
            }
          }
        }

      }

      return pages;

    },

    // fetches the latest results from the server
    pager: function ( options ) {
      if ( !_.isObject(options) ) {
        options = {};
      }
      return this.fetch( options );
    },

    url: function(){
      // Expose url parameter enclosed in this.paginator_core.url to properly
      // extend Collection and allow Collection CRUD
      if(this.paginator_core !== undefined && this.paginator_core.url !== undefined){
        return this.paginator_core.url;
      } else {
        return null;
      }
    },

    bootstrap: function(options) {
      _.extend(this, options);
      this.setDefaults();
      this.info();
      return this;
    }
  });

  // function aliasing
  Paginator.requestPager.prototype.nextPage = Paginator.requestPager.prototype.requestNextPage;
  Paginator.requestPager.prototype.prevPage = Paginator.requestPager.prototype.requestPreviousPage;

  return Paginator;

}( Backbone, _, jQuery ));
// MarionetteJS (Backbone.Marionette)
// ----------------------------------
// v1.1.0
//
// Copyright (c)2013 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://marionettejs.com



/*!
 * Includes BabySitter
 * https://github.com/marionettejs/backbone.babysitter/
 *
 * Includes Wreqr
 * https://github.com/marionettejs/backbone.wreqr/
 */

// Backbone.BabySitter
// -------------------
// v0.0.6
//
// Copyright (c)2013 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://github.com/babysitterjs/backbone.babysitter

// Backbone.ChildViewContainer
// ---------------------------
//
// Provide a container to store, retrieve and
// shut down child views.

Backbone.ChildViewContainer = (function(Backbone, _){
  
  // Container Constructor
  // ---------------------

  var Container = function(views){
    this._views = {};
    this._indexByModel = {};
    this._indexByCustom = {};
    this._updateLength();

    _.each(views, this.add, this);
  };

  // Container Methods
  // -----------------

  _.extend(Container.prototype, {

    // Add a view to this container. Stores the view
    // by `cid` and makes it searchable by the model
    // cid (and model itself). Optionally specify
    // a custom key to store an retrieve the view.
    add: function(view, customIndex){
      var viewCid = view.cid;

      // store the view
      this._views[viewCid] = view;

      // index it by model
      if (view.model){
        this._indexByModel[view.model.cid] = viewCid;
      }

      // index by custom
      if (customIndex){
        this._indexByCustom[customIndex] = viewCid;
      }

      this._updateLength();
    },

    // Find a view by the model that was attached to
    // it. Uses the model's `cid` to find it.
    findByModel: function(model){
      return this.findByModelCid(model.cid);
    },

    // Find a view by the `cid` of the model that was attached to
    // it. Uses the model's `cid` to find the view `cid` and
    // retrieve the view using it.
    findByModelCid: function(modelCid){
      var viewCid = this._indexByModel[modelCid];
      return this.findByCid(viewCid);
    },

    // Find a view by a custom indexer.
    findByCustom: function(index){
      var viewCid = this._indexByCustom[index];
      return this.findByCid(viewCid);
    },

    // Find by index. This is not guaranteed to be a
    // stable index.
    findByIndex: function(index){
      return _.values(this._views)[index];
    },

    // retrieve a view by it's `cid` directly
    findByCid: function(cid){
      return this._views[cid];
    },

    // Remove a view
    remove: function(view){
      var viewCid = view.cid;

      // delete model index
      if (view.model){
        delete this._indexByModel[view.model.cid];
      }

      // delete custom index
      _.any(this._indexByCustom, function(cid, key) {
        if (cid === viewCid) {
          delete this._indexByCustom[key];
          return true;
        }
      }, this);

      // remove the view from the container
      delete this._views[viewCid];

      // update the length
      this._updateLength();
    },

    // Call a method on every view in the container,
    // passing parameters to the call method one at a
    // time, like `function.call`.
    call: function(method){
      this.apply(method, _.tail(arguments));
    },

    // Apply a method on every view in the container,
    // passing parameters to the call method one at a
    // time, like `function.apply`.
    apply: function(method, args){
      _.each(this._views, function(view){
        if (_.isFunction(view[method])){
          view[method].apply(view, args || []);
        }
      });
    },

    // Update the `.length` attribute on this container
    _updateLength: function(){
      this.length = _.size(this._views);
    }
  });

  // Borrowing this code from Backbone.Collection:
  // http://backbonejs.org/docs/backbone.html#section-106
  //
  // Mix in methods from Underscore, for iteration, and other
  // collection related features.
  var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter', 
    'select', 'reject', 'every', 'all', 'some', 'any', 'include', 
    'contains', 'invoke', 'toArray', 'first', 'initial', 'rest', 
    'last', 'without', 'isEmpty', 'pluck'];

  _.each(methods, function(method) {
    Container.prototype[method] = function() {
      var views = _.values(this._views);
      var args = [views].concat(_.toArray(arguments));
      return _[method].apply(_, args);
    };
  });

  // return the public API
  return Container;
})(Backbone, _);

// Backbone.Wreqr (Backbone.Marionette)
// ----------------------------------
// v0.2.0
//
// Copyright (c)2013 Derick Bailey, Muted Solutions, LLC.
// Distributed under MIT license
//
// http://github.com/marionettejs/backbone.wreqr


Backbone.Wreqr = (function(Backbone, Marionette, _){
  "use strict";
  var Wreqr = {};

  // Handlers
// --------
// A registry of functions to call, given a name

Wreqr.Handlers = (function(Backbone, _){
  "use strict";
  
  // Constructor
  // -----------

  var Handlers = function(options){
    this.options = options;
    this._wreqrHandlers = {};
    
    if (_.isFunction(this.initialize)){
      this.initialize(options);
    }
  };

  Handlers.extend = Backbone.Model.extend;

  // Instance Members
  // ----------------

  _.extend(Handlers.prototype, Backbone.Events, {

    // Add multiple handlers using an object literal configuration
    setHandlers: function(handlers){
      _.each(handlers, function(handler, name){
        var context = null;

        if (_.isObject(handler) && !_.isFunction(handler)){
          context = handler.context;
          handler = handler.callback;
        }

        this.setHandler(name, handler, context);
      }, this);
    },

    // Add a handler for the given name, with an
    // optional context to run the handler within
    setHandler: function(name, handler, context){
      var config = {
        callback: handler,
        context: context
      };

      this._wreqrHandlers[name] = config;

      this.trigger("handler:add", name, handler, context);
    },

    // Determine whether or not a handler is registered
    hasHandler: function(name){
      return !! this._wreqrHandlers[name];
    },

    // Get the currently registered handler for
    // the specified name. Throws an exception if
    // no handler is found.
    getHandler: function(name){
      var config = this._wreqrHandlers[name];

      if (!config){
        throw new Error("Handler not found for '" + name + "'");
      }

      return function(){
        var args = Array.prototype.slice.apply(arguments);
        return config.callback.apply(config.context, args);
      };
    },

    // Remove a handler for the specified name
    removeHandler: function(name){
      delete this._wreqrHandlers[name];
    },

    // Remove all handlers from this registry
    removeAllHandlers: function(){
      this._wreqrHandlers = {};
    }
  });

  return Handlers;
})(Backbone, _);

  // Wreqr.CommandStorage
// --------------------
//
// Store and retrieve commands for execution.
Wreqr.CommandStorage = (function(){
  "use strict";

  // Constructor function
  var CommandStorage = function(options){
    this.options = options;
    this._commands = {};

    if (_.isFunction(this.initialize)){
      this.initialize(options);
    }
  };

  // Instance methods
  _.extend(CommandStorage.prototype, Backbone.Events, {

    // Get an object literal by command name, that contains
    // the `commandName` and the `instances` of all commands
    // represented as an array of arguments to process
    getCommands: function(commandName){
      var commands = this._commands[commandName];

      // we don't have it, so add it
      if (!commands){

        // build the configuration
        commands = {
          command: commandName, 
          instances: []
        };

        // store it
        this._commands[commandName] = commands;
      }

      return commands;
    },

    // Add a command by name, to the storage and store the
    // args for the command
    addCommand: function(commandName, args){
      var command = this.getCommands(commandName);
      command.instances.push(args);
    },

    // Clear all commands for the given `commandName`
    clearCommands: function(commandName){
      var command = this.getCommands(commandName);
      command.instances = [];
    }
  });

  return CommandStorage;
})();

  // Wreqr.Commands
// --------------
//
// A simple command pattern implementation. Register a command
// handler and execute it.
Wreqr.Commands = (function(Wreqr){
  "use strict";

  return Wreqr.Handlers.extend({
    // default storage type
    storageType: Wreqr.CommandStorage,

    constructor: function(options){
      this.options = options || {};

      this._initializeStorage(this.options);
      this.on("handler:add", this._executeCommands, this);

      var args = Array.prototype.slice.call(arguments);
      Wreqr.Handlers.prototype.constructor.apply(this, args);
    },

    // Execute a named command with the supplied args
    execute: function(name, args){
      name = arguments[0];
      args = Array.prototype.slice.call(arguments, 1);

      if (this.hasHandler(name)){
        this.getHandler(name).apply(this, args);
      } else {
        this.storage.addCommand(name, args);
      }

    },

    // Internal method to handle bulk execution of stored commands
    _executeCommands: function(name, handler, context){
      var command = this.storage.getCommands(name);

      // loop through and execute all the stored command instances
      _.each(command.instances, function(args){
        handler.apply(context, args);
      });

      this.storage.clearCommands(name);
    },

    // Internal method to initialize storage either from the type's
    // `storageType` or the instance `options.storageType`.
    _initializeStorage: function(options){
      var storage;

      var StorageType = options.storageType || this.storageType;
      if (_.isFunction(StorageType)){
        storage = new StorageType();
      } else {
        storage = StorageType;
      }

      this.storage = storage;
    }
  });

})(Wreqr);

  // Wreqr.RequestResponse
// ---------------------
//
// A simple request/response implementation. Register a
// request handler, and return a response from it
Wreqr.RequestResponse = (function(Wreqr){
  "use strict";

  return Wreqr.Handlers.extend({
    request: function(){
      var name = arguments[0];
      var args = Array.prototype.slice.call(arguments, 1);

      return this.getHandler(name).apply(this, args);
    }
  });

})(Wreqr);

  // Event Aggregator
// ----------------
// A pub-sub object that can be used to decouple various parts
// of an application through event-driven architecture.

Wreqr.EventAggregator = (function(Backbone, _){
  "use strict";
  var EA = function(){};

  // Copy the `extend` function used by Backbone's classes
  EA.extend = Backbone.Model.extend;

  // Copy the basic Backbone.Events on to the event aggregator
  _.extend(EA.prototype, Backbone.Events);

  return EA;
})(Backbone, _);


  return Wreqr;
})(Backbone, Backbone.Marionette, _);

var Marionette = (function(global, Backbone, _){
  "use strict";

  // Define and export the Marionette namespace
  var Marionette = {};
  Backbone.Marionette = Marionette;

  // Get the DOM manipulator for later use
  Marionette.$ = Backbone.$;

// Helpers
// -------

// For slicing `arguments` in functions
var protoSlice = Array.prototype.slice;
function slice(args) {
  return protoSlice.call(args);
}

function throwError(message, name) {
  var error = new Error(message);
  error.name = name || 'Error';
  throw error;
}

// Marionette.extend
// -----------------

// Borrow the Backbone `extend` method so we can use it as needed
Marionette.extend = Backbone.Model.extend;

// Marionette.getOption
// --------------------

// Retrieve an object, function or other value from a target
// object or its `options`, with `options` taking precedence.
Marionette.getOption = function(target, optionName){
  if (!target || !optionName){ return; }
  var value;

  if (target.options && (optionName in target.options) && (target.options[optionName] !== undefined)){
    value = target.options[optionName];
  } else {
    value = target[optionName];
  }

  return value;
};

// Trigger an event and/or a corresponding method name. Examples:
//
// `this.triggerMethod("foo")` will trigger the "foo" event and
// call the "onFoo" method.
//
// `this.triggerMethod("foo:bar") will trigger the "foo:bar" event and
// call the "onFooBar" method.
Marionette.triggerMethod = (function(){

  // split the event name on the :
  var splitter = /(^|:)(\w)/gi;

  // take the event section ("section1:section2:section3")
  // and turn it in to uppercase name
  function getEventName(match, prefix, eventName) {
    return eventName.toUpperCase();
  }

  // actual triggerMethod name
  var triggerMethod = function(event) {
    // get the method name from the event name
    var methodName = 'on' + event.replace(splitter, getEventName);
    var method = this[methodName];

    // trigger the event, if a trigger method exists
    if(_.isFunction(this.trigger)) {
      this.trigger.apply(this, arguments);
    }

    // call the onMethodName if it exists
    if (_.isFunction(method)) {
      // pass all arguments, except the event name
      return method.apply(this, _.tail(arguments));
    }
  };

  return triggerMethod;
})();

// DOMRefresh
// ----------
//
// Monitor a view's state, and after it has been rendered and shown
// in the DOM, trigger a "dom:refresh" event every time it is
// re-rendered.

Marionette.MonitorDOMRefresh = (function(){
  // track when the view has been shown in the DOM,
  // using a Marionette.Region (or by other means of triggering "show")
  function handleShow(view){
    view._isShown = true;
    triggerDOMRefresh(view);
  }

  // track when the view has been rendered
  function handleRender(view){
    view._isRendered = true;
    triggerDOMRefresh(view);
  }

  // Trigger the "dom:refresh" event and corresponding "onDomRefresh" method
  function triggerDOMRefresh(view){
    if (view._isShown && view._isRendered){
      if (_.isFunction(view.triggerMethod)){
        view.triggerMethod("dom:refresh");
      }
    }
  }

  // Export public API
  return function(view){
    view.listenTo(view, "show", function(){
      handleShow(view);
    });

    view.listenTo(view, "render", function(){
      handleRender(view);
    });
  };
})();


// Marionette.bindEntityEvents & unbindEntityEvents
// ---------------------------
//
// These methods are used to bind/unbind a backbone "entity" (collection/model) 
// to methods on a target object. 
//
// The first parameter, `target`, must have a `listenTo` method from the
// EventBinder object.
//
// The second parameter is the entity (Backbone.Model or Backbone.Collection)
// to bind the events from.
//
// The third parameter is a hash of { "event:name": "eventHandler" }
// configuration. Multiple handlers can be separated by a space. A
// function can be supplied instead of a string handler name. 

(function(Marionette){
  "use strict";

  // Bind the event to handlers specified as a string of
  // handler names on the target object
  function bindFromStrings(target, entity, evt, methods){
    var methodNames = methods.split(/\s+/);

    _.each(methodNames,function(methodName) {

      var method = target[methodName];
      if(!method) {
        throwError("Method '"+ methodName +"' was configured as an event handler, but does not exist.");
      }

      target.listenTo(entity, evt, method, target);
    });
  }

  // Bind the event to a supplied callback function
  function bindToFunction(target, entity, evt, method){
      target.listenTo(entity, evt, method, target);
  }

  // Bind the event to handlers specified as a string of
  // handler names on the target object
  function unbindFromStrings(target, entity, evt, methods){
    var methodNames = methods.split(/\s+/);

    _.each(methodNames,function(methodName) {
      var method = target[methodName];
      target.stopListening(entity, evt, method, target);
    });
  }

  // Bind the event to a supplied callback function
  function unbindToFunction(target, entity, evt, method){
      target.stopListening(entity, evt, method, target);
  }

  
  // generic looping function
  function iterateEvents(target, entity, bindings, functionCallback, stringCallback){
    if (!entity || !bindings) { return; }

    // allow the bindings to be a function
    if (_.isFunction(bindings)){
      bindings = bindings.call(target);
    }

    // iterate the bindings and bind them
    _.each(bindings, function(methods, evt){

      // allow for a function as the handler, 
      // or a list of event names as a string
      if (_.isFunction(methods)){
        functionCallback(target, entity, evt, methods);
      } else {
        stringCallback(target, entity, evt, methods);
      }

    });
  }
 
  // Export Public API
  Marionette.bindEntityEvents = function(target, entity, bindings){
    iterateEvents(target, entity, bindings, bindToFunction, bindFromStrings);
  };

  Marionette.unbindEntityEvents = function(target, entity, bindings){
    iterateEvents(target, entity, bindings, unbindToFunction, unbindFromStrings);
  };

})(Marionette);


// Callbacks
// ---------

// A simple way of managing a collection of callbacks
// and executing them at a later point in time, using jQuery's
// `Deferred` object.
Marionette.Callbacks = function(){
  this._deferred = Marionette.$.Deferred();
  this._callbacks = [];
};

_.extend(Marionette.Callbacks.prototype, {

  // Add a callback to be executed. Callbacks added here are
  // guaranteed to execute, even if they are added after the 
  // `run` method is called.
  add: function(callback, contextOverride){
    this._callbacks.push({cb: callback, ctx: contextOverride});

    this._deferred.done(function(context, options){
      if (contextOverride){ context = contextOverride; }
      callback.call(context, options);
    });
  },

  // Run all registered callbacks with the context specified. 
  // Additional callbacks can be added after this has been run 
  // and they will still be executed.
  run: function(options, context){
    this._deferred.resolve(context, options);
  },

  // Resets the list of callbacks to be run, allowing the same list
  // to be run multiple times - whenever the `run` method is called.
  reset: function(){
    var callbacks = this._callbacks;
    this._deferred = Marionette.$.Deferred();
    this._callbacks = [];
    
    _.each(callbacks, function(cb){
      this.add(cb.cb, cb.ctx);
    }, this);
  }
});


// Marionette Controller
// ---------------------
//
// A multi-purpose object to use as a controller for
// modules and routers, and as a mediator for workflow
// and coordination of other objects, views, and more.
Marionette.Controller = function(options){
  this.triggerMethod = Marionette.triggerMethod;
  this.options = options || {};

  if (_.isFunction(this.initialize)){
    this.initialize(this.options);
  }
};

Marionette.Controller.extend = Marionette.extend;

// Controller Methods
// --------------

// Ensure it can trigger events with Backbone.Events
_.extend(Marionette.Controller.prototype, Backbone.Events, {
  close: function(){
    this.stopListening();
    this.triggerMethod("close");
    this.unbind();
  }
});

// Region 
// ------
//
// Manage the visual regions of your composite application. See
// http://lostechies.com/derickbailey/2011/12/12/composite-js-apps-regions-and-region-managers/

Marionette.Region = function(options){
  this.options = options || {};

  this.el = Marionette.getOption(this, "el");

  if (!this.el){
    var err = new Error("An 'el' must be specified for a region.");
    err.name = "NoElError";
    throw err;
  }

  if (this.initialize){
    var args = Array.prototype.slice.apply(arguments);
    this.initialize.apply(this, args);
  }
};


// Region Type methods
// -------------------

_.extend(Marionette.Region, {

  // Build an instance of a region by passing in a configuration object
  // and a default region type to use if none is specified in the config.
  //
  // The config object should either be a string as a jQuery DOM selector,
  // a Region type directly, or an object literal that specifies both
  // a selector and regionType:
  //
  // ```js
  // {
  //   selector: "#foo",
  //   regionType: MyCustomRegion
  // }
  // ```
  //
  buildRegion: function(regionConfig, defaultRegionType){

    var regionIsString = (typeof regionConfig === "string");
    var regionSelectorIsString = (typeof regionConfig.selector === "string");
    var regionTypeIsUndefined = (typeof regionConfig.regionType === "undefined");
    var regionIsType = (typeof regionConfig === "function");

    if (!regionIsType && !regionIsString && !regionSelectorIsString) {
      throw new Error("Region must be specified as a Region type, a selector string or an object with selector property");
    }

    var selector, RegionType;
   
    // get the selector for the region
    
    if (regionIsString) {
      selector = regionConfig;
    } 

    if (regionConfig.selector) {
      selector = regionConfig.selector;
    }

    // get the type for the region
    
    if (regionIsType){
      RegionType = regionConfig;
    }

    if (!regionIsType && regionTypeIsUndefined) {
      RegionType = defaultRegionType;
    }

    if (regionConfig.regionType) {
      RegionType = regionConfig.regionType;
    }
    
    // build the region instance
    var region = new RegionType({
      el: selector
    });

    // override the `getEl` function if we have a parentEl
    // this must be overridden to ensure the selector is found
    // on the first use of the region. if we try to assign the
    // region's `el` to `parentEl.find(selector)` in the object
    // literal to build the region, the element will not be
    // guaranteed to be in the DOM already, and will cause problems
    if (regionConfig.parentEl){

      region.getEl = function(selector) {
        var parentEl = regionConfig.parentEl;
        if (_.isFunction(parentEl)){
          parentEl = parentEl();
        }
        return parentEl.find(selector);
      };
    }

    return region;
  }

});

// Region Instance Methods
// -----------------------

_.extend(Marionette.Region.prototype, Backbone.Events, {

  // Displays a backbone view instance inside of the region.
  // Handles calling the `render` method for you. Reads content
  // directly from the `el` attribute. Also calls an optional
  // `onShow` and `close` method on your view, just after showing
  // or just before closing the view, respectively.
  show: function(view){

    this.ensureEl();

    var isViewClosed = view.isClosed || _.isUndefined(view.$el);

    var isDifferentView = view !== this.currentView;

    if (isDifferentView) {
      this.close();
    }

    view.render();

    if (isDifferentView || isViewClosed) {
      this.open(view);
    }
    
    this.currentView = view;

    Marionette.triggerMethod.call(this, "show", view);
    Marionette.triggerMethod.call(view, "show");
  },

  ensureEl: function(){
    if (!this.$el || this.$el.length === 0){
      this.$el = this.getEl(this.el);
    }
  },

  // Override this method to change how the region finds the
  // DOM element that it manages. Return a jQuery selector object.
  getEl: function(selector){
    return Marionette.$(selector);
  },

  // Override this method to change how the new view is
  // appended to the `$el` that the region is managing
  open: function(view){
    this.$el.empty().append(view.el);
  },

  // Close the current view, if there is one. If there is no
  // current view, it does nothing and returns immediately.
  close: function(){
    var view = this.currentView;
    if (!view || view.isClosed){ return; }

    // call 'close' or 'remove', depending on which is found
    if (view.close) { view.close(); }
    else if (view.remove) { view.remove(); }

    Marionette.triggerMethod.call(this, "close");

    delete this.currentView;
  },

  // Attach an existing view to the region. This 
  // will not call `render` or `onShow` for the new view, 
  // and will not replace the current HTML for the `el`
  // of the region.
  attachView: function(view){
    this.currentView = view;
  },

  // Reset the region by closing any existing view and
  // clearing out the cached `$el`. The next time a view
  // is shown via this region, the region will re-query the
  // DOM for the region's `el`.
  reset: function(){
    this.close();
    delete this.$el;
  }
});

// Copy the `extend` function used by Backbone's classes
Marionette.Region.extend = Marionette.extend;

// Marionette.RegionManager
// ------------------------
//
// Manage one or more related `Marionette.Region` objects.
Marionette.RegionManager = (function(Marionette){

  var RegionManager = Marionette.Controller.extend({
    constructor: function(options){
      this._regions = {};
      Marionette.Controller.prototype.constructor.call(this, options);
    },

    // Add multiple regions using an object literal, where
    // each key becomes the region name, and each value is
    // the region definition.
    addRegions: function(regionDefinitions, defaults){
      var regions = {};

      _.each(regionDefinitions, function(definition, name){
        if (typeof definition === "string"){
          definition = { selector: definition };
        }

        if (definition.selector){
          definition = _.defaults({}, definition, defaults);
        }

        var region = this.addRegion(name, definition);
        regions[name] = region;
      }, this);

      return regions;
    },

    // Add an individual region to the region manager,
    // and return the region instance
    addRegion: function(name, definition){
      var region;

      var isObject = _.isObject(definition);
      var isString = _.isString(definition);
      var hasSelector = !!definition.selector;

      if (isString || (isObject && hasSelector)){
        region = Marionette.Region.buildRegion(definition, Marionette.Region);
      } else if (_.isFunction(definition)){
        region = Marionette.Region.buildRegion(definition, Marionette.Region);
      } else {
        region = definition;
      }

      this._store(name, region);
      this.triggerMethod("region:add", name, region);
      return region;
    },

    // Get a region by name
    get: function(name){
      return this._regions[name];
    },

    // Remove a region by name
    removeRegion: function(name){
      var region = this._regions[name];
      this._remove(name, region);
    },

    // Close all regions in the region manager, and
    // remove them
    removeRegions: function(){
      _.each(this._regions, function(region, name){
        this._remove(name, region);
      }, this);
    },

    // Close all regions in the region manager, but
    // leave them attached
    closeRegions: function(){
      _.each(this._regions, function(region, name){
        region.close();
      }, this);
    },

    // Close all regions and shut down the region
    // manager entirely
    close: function(){
      this.removeRegions();
      var args = Array.prototype.slice.call(arguments);
      Marionette.Controller.prototype.close.apply(this, args);
    },

    // internal method to store regions
    _store: function(name, region){
      this._regions[name] = region;
      this._setLength();
    },

    // internal method to remove a region
    _remove: function(name, region){
      region.close();
      delete this._regions[name];
      this._setLength();
      this.triggerMethod("region:remove", name, region);
    },

    // set the number of regions current held
    _setLength: function(){
      this.length = _.size(this._regions);
    }

  });

  // Borrowing this code from Backbone.Collection:
  // http://backbonejs.org/docs/backbone.html#section-106
  //
  // Mix in methods from Underscore, for iteration, and other
  // collection related features.
  var methods = ['forEach', 'each', 'map', 'find', 'detect', 'filter', 
    'select', 'reject', 'every', 'all', 'some', 'any', 'include', 
    'contains', 'invoke', 'toArray', 'first', 'initial', 'rest', 
    'last', 'without', 'isEmpty', 'pluck'];

  _.each(methods, function(method) {
    RegionManager.prototype[method] = function() {
      var regions = _.values(this._regions);
      var args = [regions].concat(_.toArray(arguments));
      return _[method].apply(_, args);
    };
  });

  return RegionManager;
})(Marionette);


// Template Cache
// --------------

// Manage templates stored in `<script>` blocks,
// caching them for faster access.
Marionette.TemplateCache = function(templateId){
  this.templateId = templateId;
};

// TemplateCache object-level methods. Manage the template
// caches from these method calls instead of creating 
// your own TemplateCache instances
_.extend(Marionette.TemplateCache, {
  templateCaches: {},

  // Get the specified template by id. Either
  // retrieves the cached version, or loads it
  // from the DOM.
  get: function(templateId){
    var cachedTemplate = this.templateCaches[templateId];

    if (!cachedTemplate){
      cachedTemplate = new Marionette.TemplateCache(templateId);
      this.templateCaches[templateId] = cachedTemplate;
    }

    return cachedTemplate.load();
  },

  // Clear templates from the cache. If no arguments
  // are specified, clears all templates:
  // `clear()`
  //
  // If arguments are specified, clears each of the 
  // specified templates from the cache:
  // `clear("#t1", "#t2", "...")`
  clear: function(){
    var i;
    var args = slice(arguments);
    var length = args.length;

    if (length > 0){
      for(i=0; i<length; i++){
        delete this.templateCaches[args[i]];
      }
    } else {
      this.templateCaches = {};
    }
  }
});

// TemplateCache instance methods, allowing each
// template cache object to manage its own state
// and know whether or not it has been loaded
_.extend(Marionette.TemplateCache.prototype, {

  // Internal method to load the template
  load: function(){
    // Guard clause to prevent loading this template more than once
    if (this.compiledTemplate){
      return this.compiledTemplate;
    }

    // Load the template and compile it
    var template = this.loadTemplate(this.templateId);
    this.compiledTemplate = this.compileTemplate(template);

    return this.compiledTemplate;
  },

  // Load a template from the DOM, by default. Override
  // this method to provide your own template retrieval
  // For asynchronous loading with AMD/RequireJS, consider
  // using a template-loader plugin as described here: 
  // https://github.com/marionettejs/backbone.marionette/wiki/Using-marionette-with-requirejs
  loadTemplate: function(templateId){
    var template = Marionette.$(templateId).html();

    if (!template || template.length === 0){
      throwError("Could not find template: '" + templateId + "'", "NoTemplateError");
    }

    return template;
  },

  // Pre-compile the template before caching it. Override
  // this method if you do not need to pre-compile a template
  // (JST / RequireJS for example) or if you want to change
  // the template engine used (Handebars, etc).
  compileTemplate: function(rawTemplate){
    return _.template(rawTemplate);
  }
});


// Renderer
// --------

// Render a template with data by passing in the template
// selector and the data to render.
Marionette.Renderer = {

  // Render a template with data. The `template` parameter is
  // passed to the `TemplateCache` object to retrieve the
  // template function. Override this method to provide your own
  // custom rendering and template handling for all of Marionette.
  render: function(template, data){

    if (!template) {
      var error = new Error("Cannot render the template since it's false, null or undefined.");
      error.name = "TemplateNotFoundError";
      throw error;
    }

    var templateFunc;
    if (typeof template === "function"){
      templateFunc = template;
    } else {
      templateFunc = Marionette.TemplateCache.get(template);
    }

    return templateFunc(data);
  }
};



// Marionette.View
// ---------------

// The core view type that other Marionette views extend from.
Marionette.View = Backbone.View.extend({

  constructor: function(){
    _.bindAll(this, "render");

    var args = Array.prototype.slice.apply(arguments);
    Backbone.View.prototype.constructor.apply(this, args);

    Marionette.MonitorDOMRefresh(this);
    this.listenTo(this, "show", this.onShowCalled, this);
  },

  // import the "triggerMethod" to trigger events with corresponding
  // methods if the method exists 
  triggerMethod: Marionette.triggerMethod,

  // Get the template for this view
  // instance. You can set a `template` attribute in the view
  // definition or pass a `template: "whatever"` parameter in
  // to the constructor options.
  getTemplate: function(){
    return Marionette.getOption(this, "template");
  },

  // Mix in template helper methods. Looks for a
  // `templateHelpers` attribute, which can either be an
  // object literal, or a function that returns an object
  // literal. All methods and attributes from this object
  // are copies to the object passed in.
  mixinTemplateHelpers: function(target){
    target = target || {};
    var templateHelpers = Marionette.getOption(this, "templateHelpers");
    if (_.isFunction(templateHelpers)){
      templateHelpers = templateHelpers.call(this);
    }
    return _.extend(target, templateHelpers);
  },

  // Configure `triggers` to forward DOM events to view
  // events. `triggers: {"click .foo": "do:foo"}`
  configureTriggers: function(){
    if (!this.triggers) { return; }

    var triggerEvents = {};

    // Allow `triggers` to be configured as a function
    var triggers = _.result(this, "triggers");

    // Configure the triggers, prevent default
    // action and stop propagation of DOM events
    _.each(triggers, function(value, key){

      // build the event handler function for the DOM event
      triggerEvents[key] = function(e){

        // stop the event in its tracks
        if (e && e.preventDefault){ e.preventDefault(); }
        if (e && e.stopPropagation){ e.stopPropagation(); }

        // build the args for the event
        var args = {
          view: this,
          model: this.model,
          collection: this.collection
        };

        // trigger the event
        this.triggerMethod(value, args);
      };

    }, this);

    return triggerEvents;
  },

  // Overriding Backbone.View's delegateEvents to handle 
  // the `triggers`, `modelEvents`, and `collectionEvents` configuration
  delegateEvents: function(events){
    this._delegateDOMEvents(events);
    Marionette.bindEntityEvents(this, this.model, Marionette.getOption(this, "modelEvents"));
    Marionette.bindEntityEvents(this, this.collection, Marionette.getOption(this, "collectionEvents"));
  },

  // internal method to delegate DOM events and triggers
  _delegateDOMEvents: function(events){
    events = events || this.events;
    if (_.isFunction(events)){ events = events.call(this); }

    var combinedEvents = {};
    var triggers = this.configureTriggers();
    _.extend(combinedEvents, events, triggers);

    Backbone.View.prototype.delegateEvents.call(this, combinedEvents);
  },

  // Overriding Backbone.View's undelegateEvents to handle unbinding
  // the `triggers`, `modelEvents`, and `collectionEvents` config
  undelegateEvents: function(){
    var args = Array.prototype.slice.call(arguments);
    Backbone.View.prototype.undelegateEvents.apply(this, args);

    Marionette.unbindEntityEvents(this, this.model, Marionette.getOption(this, "modelEvents"));
    Marionette.unbindEntityEvents(this, this.collection, Marionette.getOption(this, "collectionEvents"));
  },

  // Internal method, handles the `show` event.
  onShowCalled: function(){},

  // Default `close` implementation, for removing a view from the
  // DOM and unbinding it. Regions will call this method
  // for you. You can specify an `onClose` method in your view to
  // add custom code that is called after the view is closed.
  close: function(){
    if (this.isClosed) { return; }

    // allow the close to be stopped by returning `false`
    // from the `onBeforeClose` method
    var shouldClose = this.triggerMethod("before:close");
    if (shouldClose === false){
      return;
    }

    // mark as closed before doing the actual close, to
    // prevent infinite loops within "close" event handlers
    // that are trying to close other views
    this.isClosed = true;
    this.triggerMethod("close");

    // unbind UI elements
    this.unbindUIElements();

    // remove the view from the DOM
    this.remove();
  },

  // This method binds the elements specified in the "ui" hash inside the view's code with
  // the associated jQuery selectors.
  bindUIElements: function(){
    if (!this.ui) { return; }

    // store the ui hash in _uiBindings so they can be reset later
    // and so re-rendering the view will be able to find the bindings
    if (!this._uiBindings){
      this._uiBindings = this.ui;
    }

    // get the bindings result, as a function or otherwise
    var bindings = _.result(this, "_uiBindings");

    // empty the ui so we don't have anything to start with
    this.ui = {};

    // bind each of the selectors
    _.each(_.keys(bindings), function(key) {
      var selector = bindings[key];
      this.ui[key] = this.$(selector);
    }, this);
  },

  // This method unbinds the elements specified in the "ui" hash
  unbindUIElements: function(){
    if (!this.ui || !this._uiBindings){ return; }

    // delete all of the existing ui bindings
    _.each(this.ui, function($el, name){
      delete this.ui[name];
    }, this);

    // reset the ui element to the original bindings configuration
    this.ui = this._uiBindings;
    delete this._uiBindings;
  }
});

// Item View
// ---------

// A single item view implementation that contains code for rendering
// with underscore.js templates, serializing the view's model or collection,
// and calling several methods on extended views, such as `onRender`.
Marionette.ItemView = Marionette.View.extend({

  // Setting up the inheritance chain which allows changes to
  // Marionette.View.prototype.constructor which allows overriding
  constructor: function(){
    Marionette.View.prototype.constructor.apply(this, slice(arguments));
  },

  // Serialize the model or collection for the view. If a model is
  // found, `.toJSON()` is called. If a collection is found, `.toJSON()`
  // is also called, but is used to populate an `items` array in the
  // resulting data. If both are found, defaults to the model.
  // You can override the `serializeData` method in your own view
  // definition, to provide custom serialization for your view's data.
  serializeData: function(){
    var data = {};

    if (this.model) {
      data = this.model.toJSON();
    }
    else if (this.collection) {
      data = { items: this.collection.toJSON() };
    }

    return data;
  },

  // Render the view, defaulting to underscore.js templates.
  // You can override this in your view definition to provide
  // a very specific rendering for your view. In general, though,
  // you should override the `Marionette.Renderer` object to
  // change how Marionette renders views.
  render: function(){
    this.isClosed = false;

    this.triggerMethod("before:render", this);
    this.triggerMethod("item:before:render", this);

    var data = this.serializeData();
    data = this.mixinTemplateHelpers(data);

    var template = this.getTemplate();
    var html = Marionette.Renderer.render(template, data);

    this.$el.html(html);
    this.bindUIElements();

    this.triggerMethod("render", this);
    this.triggerMethod("item:rendered", this);

    return this;
  },

  // Override the default close event to add a few
  // more events that are triggered.
  close: function(){
    if (this.isClosed){ return; }

    this.triggerMethod('item:before:close');

    Marionette.View.prototype.close.apply(this, slice(arguments));

    this.triggerMethod('item:closed');
  }
});

// Collection View
// ---------------

// A view that iterates over a Backbone.Collection
// and renders an individual ItemView for each model.
Marionette.CollectionView = Marionette.View.extend({
  // used as the prefix for item view events
  // that are forwarded through the collectionview
  itemViewEventPrefix: "itemview",

  // constructor
  constructor: function(options){
    this._initChildViewStorage();

    Marionette.View.prototype.constructor.apply(this, slice(arguments));

    this._initialEvents();
  },

  // Configured the initial events that the collection view
  // binds to. Override this method to prevent the initial
  // events, or to add your own initial events.
  _initialEvents: function(){
    if (this.collection){
      this.listenTo(this.collection, "add", this.addChildView, this);
      this.listenTo(this.collection, "remove", this.removeItemView, this);
      this.listenTo(this.collection, "reset", this.render, this);
    }
  },

  // Handle a child item added to the collection
  addChildView: function(item, collection, options){
    this.closeEmptyView();
    var ItemView = this.getItemView(item);
    var index = this.collection.indexOf(item);
    this.addItemView(item, ItemView, index);
  },

  // Override from `Marionette.View` to guarantee the `onShow` method
  // of child views is called.
  onShowCalled: function(){
    this.children.each(function(child){
      Marionette.triggerMethod.call(child, "show");
    });
  },

  // Internal method to trigger the before render callbacks
  // and events
  triggerBeforeRender: function(){
    this.triggerMethod("before:render", this);
    this.triggerMethod("collection:before:render", this);
  },

  // Internal method to trigger the rendered callbacks and
  // events
  triggerRendered: function(){
    this.triggerMethod("render", this);
    this.triggerMethod("collection:rendered", this);
  },

  // Render the collection of items. Override this method to
  // provide your own implementation of a render function for
  // the collection view.
  render: function(){
    this.isClosed = false;
    this.triggerBeforeRender();
    this._renderChildren();
    this.triggerRendered();
    return this;
  },

  // Internal method. Separated so that CompositeView can have
  // more control over events being triggered, around the rendering
  // process
  _renderChildren: function(){
    this.closeEmptyView();
    this.closeChildren();

    if (this.collection && this.collection.length > 0) {
      this.showCollection();
    } else {
      this.showEmptyView();
    }
  },

  // Internal method to loop through each item in the
  // collection view and show it
  showCollection: function(){
    var ItemView;
    this.collection.each(function(item, index){
      ItemView = this.getItemView(item);
      this.addItemView(item, ItemView, index);
    }, this);
  },

  // Internal method to show an empty view in place of
  // a collection of item views, when the collection is
  // empty
  showEmptyView: function(){
    var EmptyView = Marionette.getOption(this, "emptyView");

    if (EmptyView && !this._showingEmptyView){
      this._showingEmptyView = true;
      var model = new Backbone.Model();
      this.addItemView(model, EmptyView, 0);
    }
  },

  // Internal method to close an existing emptyView instance
  // if one exists. Called when a collection view has been
  // rendered empty, and then an item is added to the collection.
  closeEmptyView: function(){
    if (this._showingEmptyView){
      this.closeChildren();
      delete this._showingEmptyView;
    }
  },

  // Retrieve the itemView type, either from `this.options.itemView`
  // or from the `itemView` in the object definition. The "options"
  // takes precedence.
  getItemView: function(item){
    var itemView = Marionette.getOption(this, "itemView");

    if (!itemView){
      throwError("An `itemView` must be specified", "NoItemViewError");
    }

    return itemView;
  },

  // Render the child item's view and add it to the
  // HTML for the collection view.
  addItemView: function(item, ItemView, index){
    // get the itemViewOptions if any were specified
    var itemViewOptions = Marionette.getOption(this, "itemViewOptions");
    if (_.isFunction(itemViewOptions)){
      itemViewOptions = itemViewOptions.call(this, item, index);
    }

    // build the view 
    var view = this.buildItemView(item, ItemView, itemViewOptions);
    
    // set up the child view event forwarding
    this.addChildViewEventForwarding(view);

    // this view is about to be added
    this.triggerMethod("before:item:added", view);

    // Store the child view itself so we can properly
    // remove and/or close it later
    this.children.add(view);

    // Render it and show it
    this.renderItemView(view, index);

    // call the "show" method if the collection view
    // has already been shown
    if (this._isShown){
      Marionette.triggerMethod.call(view, "show");
    }

    // this view was added
    this.triggerMethod("after:item:added", view);
  },

  // Set up the child view event forwarding. Uses an "itemview:"
  // prefix in front of all forwarded events.
  addChildViewEventForwarding: function(view){
    var prefix = Marionette.getOption(this, "itemViewEventPrefix");

    // Forward all child item view events through the parent,
    // prepending "itemview:" to the event name
    this.listenTo(view, "all", function(){
      var args = slice(arguments);
      args[0] = prefix + ":" + args[0];
      args.splice(1, 0, view);

      Marionette.triggerMethod.apply(this, args);
    }, this);
  },

  // render the item view
  renderItemView: function(view, index) {
    view.render();
    this.appendHtml(this, view, index);
  },

  // Build an `itemView` for every model in the collection.
  buildItemView: function(item, ItemViewType, itemViewOptions){
    var options = _.extend({model: item}, itemViewOptions);
    return new ItemViewType(options);
  },

  // get the child view by item it holds, and remove it
  removeItemView: function(item){
    var view = this.children.findByModel(item);
    this.removeChildView(view);
    this.checkEmpty();
  },

  // Remove the child view and close it
  removeChildView: function(view){

    // shut down the child view properly,
    // including events that the collection has from it
    if (view){
      this.stopListening(view);

      // call 'close' or 'remove', depending on which is found
      if (view.close) { view.close(); }
      else if (view.remove) { view.remove(); }

      this.children.remove(view);
    }

    this.triggerMethod("item:removed", view);
  },

  // helper to show the empty view if the collection is empty
  checkEmpty: function() {
    // check if we're empty now, and if we are, show the
    // empty view
    if (!this.collection || this.collection.length === 0){
      this.showEmptyView();
    }
  },

  // Append the HTML to the collection's `el`.
  // Override this method to do something other
  // then `.append`.
  appendHtml: function(collectionView, itemView, index){
    collectionView.$el.append(itemView.el);
  },

  // Internal method to set up the `children` object for
  // storing all of the child views
  _initChildViewStorage: function(){
    this.children = new Backbone.ChildViewContainer();
  },

  // Handle cleanup and other closing needs for
  // the collection of views.
  close: function(){
    if (this.isClosed){ return; }

    this.triggerMethod("collection:before:close");
    this.closeChildren();
    this.triggerMethod("collection:closed");

    Marionette.View.prototype.close.apply(this, slice(arguments));
  },

  // Close the child views that this collection view
  // is holding on to, if any
  closeChildren: function(){
    this.children.each(function(child){
      this.removeChildView(child);
    }, this);
    this.checkEmpty();
  }
});


// Composite View
// --------------

// Used for rendering a branch-leaf, hierarchical structure.
// Extends directly from CollectionView and also renders an
// an item view as `modelView`, for the top leaf
Marionette.CompositeView = Marionette.CollectionView.extend({

  // Setting up the inheritance chain which allows changes to
  // Marionette.CollectionView.prototype.constructor which allows overriding
  constructor: function(){
    Marionette.CollectionView.prototype.constructor.apply(this, slice(arguments));
  },

  // Configured the initial events that the composite view
  // binds to. Override this method to prevent the initial
  // events, or to add your own initial events.
  _initialEvents: function(){
    if (this.collection){
      this.listenTo(this.collection, "add", this.addChildView, this);
      this.listenTo(this.collection, "remove", this.removeItemView, this);
      this.listenTo(this.collection, "reset", this._renderChildren, this);
    }
  },

  // Retrieve the `itemView` to be used when rendering each of
  // the items in the collection. The default is to return
  // `this.itemView` or Marionette.CompositeView if no `itemView`
  // has been defined
  getItemView: function(item){
    var itemView = Marionette.getOption(this, "itemView") || this.constructor;

    if (!itemView){
      throwError("An `itemView` must be specified", "NoItemViewError");
    }

    return itemView;
  },

  // Serialize the collection for the view.
  // You can override the `serializeData` method in your own view
  // definition, to provide custom serialization for your view's data.
  serializeData: function(){
    var data = {};

    if (this.model){
      data = this.model.toJSON();
    }

    return data;
  },

  // Renders the model once, and the collection once. Calling
  // this again will tell the model's view to re-render itself
  // but the collection will not re-render.
  render: function(){
    this.isRendered = true;
    this.isClosed = false;
    this.resetItemViewContainer();

    this.triggerBeforeRender();
    var html = this.renderModel();
    this.$el.html(html);
    // the ui bindings is done here and not at the end of render since they
    // will not be available until after the model is rendered, but should be
    // available before the collection is rendered.
    this.bindUIElements();
    this.triggerMethod("composite:model:rendered");

    this._renderChildren();

    this.triggerMethod("composite:rendered");
    this.triggerRendered();
    return this;
  },

  _renderChildren: function(){
    if (this.isRendered){
      Marionette.CollectionView.prototype._renderChildren.call(this);
      this.triggerMethod("composite:collection:rendered");
    }
  },

  // Render an individual model, if we have one, as
  // part of a composite view (branch / leaf). For example:
  // a treeview.
  renderModel: function(){
    var data = {};
    data = this.serializeData();
    data = this.mixinTemplateHelpers(data);

    var template = this.getTemplate();
    return Marionette.Renderer.render(template, data);
  },

  // Appends the `el` of itemView instances to the specified
  // `itemViewContainer` (a jQuery selector). Override this method to
  // provide custom logic of how the child item view instances have their
  // HTML appended to the composite view instance.
  appendHtml: function(cv, iv, index){
    var $container = this.getItemViewContainer(cv);
    $container.append(iv.el);
  },

  // Internal method to ensure an `$itemViewContainer` exists, for the
  // `appendHtml` method to use.
  getItemViewContainer: function(containerView){
    if ("$itemViewContainer" in containerView){
      return containerView.$itemViewContainer;
    }

    var container;
    var itemViewContainer = Marionette.getOption(containerView, "itemViewContainer");
    if (itemViewContainer){

      var selector = _.isFunction(itemViewContainer) ? itemViewContainer() : itemViewContainer;
      container = containerView.$(selector);
      if (container.length <= 0) {
        throwError("The specified `itemViewContainer` was not found: " + containerView.itemViewContainer, "ItemViewContainerMissingError");
      }

    } else {
      container = containerView.$el;
    }

    containerView.$itemViewContainer = container;
    return container;
  },

  // Internal method to reset the `$itemViewContainer` on render
  resetItemViewContainer: function(){
    if (this.$itemViewContainer){
      delete this.$itemViewContainer;
    }
  }
});


// Layout
// ------

// Used for managing application layouts, nested layouts and
// multiple regions within an application or sub-application.
//
// A specialized view type that renders an area of HTML and then
// attaches `Region` instances to the specified `regions`.
// Used for composite view management and sub-application areas.
Marionette.Layout = Marionette.ItemView.extend({
  regionType: Marionette.Region,
  
  // Ensure the regions are available when the `initialize` method
  // is called.
  constructor: function (options) {
    options = options || {};

    this._firstRender = true;
    this._initializeRegions(options);
    
    Marionette.ItemView.prototype.constructor.call(this, options);
  },

  // Layout's render will use the existing region objects the
  // first time it is called. Subsequent calls will close the
  // views that the regions are showing and then reset the `el`
  // for the regions to the newly rendered DOM elements.
  render: function(){

    if (this.isClosed){
      // a previously closed layout means we need to 
      // completely re-initialize the regions
      this._initializeRegions();
    }
    if (this._firstRender) {
      // if this is the first render, don't do anything to
      // reset the regions
      this._firstRender = false;
    } else if (!this.isClosed){
      // If this is not the first render call, then we need to 
      // re-initializing the `el` for each region
      this._reInitializeRegions();
    }

    var args = Array.prototype.slice.apply(arguments);
    var result = Marionette.ItemView.prototype.render.apply(this, args);

    return result;
  },

  // Handle closing regions, and then close the view itself.
  close: function () {
    if (this.isClosed){ return; }
    this.regionManager.close();
    var args = Array.prototype.slice.apply(arguments);
    Marionette.ItemView.prototype.close.apply(this, args);
  },

  // Add a single region, by name, to the layout
  addRegion: function(name, definition){
    var regions = {};
    regions[name] = definition;
    return this._buildRegions(regions)[name];
  },

  // Add multiple regions as a {name: definition, name2: def2} object literal
  addRegions: function(regions){
    this.regions = _.extend({}, this.regions, regions);
    return this._buildRegions(regions);
  },

  // Remove a single region from the Layout, by name
  removeRegion: function(name){
    delete this.regions[name];
    return this.regionManager.removeRegion(name);
  },

  // internal method to build regions
  _buildRegions: function(regions){
    var that = this;

    var defaults = {
      regionType: Marionette.getOption(this, "regionType"),
      parentEl: function(){ return that.$el; }
    };

    return this.regionManager.addRegions(regions, defaults);
  },

  // Internal method to initialize the regions that have been defined in a
  // `regions` attribute on this layout. 
  _initializeRegions: function (options) {
    var regions;
    this._initRegionManager();

    if (_.isFunction(this.regions)) {
      regions = this.regions(options);
    } else {
      regions = this.regions || {};
    }

    this.addRegions(regions);
  },

  // Internal method to re-initialize all of the regions by updating the `el` that
  // they point to
  _reInitializeRegions: function(){
    this.regionManager.closeRegions();
    this.regionManager.each(function(region){
      region.reset();
    });
  },

  // Internal method to initialize the region manager
  // and all regions in it
  _initRegionManager: function(){
    this.regionManager = new Marionette.RegionManager();

    this.listenTo(this.regionManager, "region:add", function(name, region){
      this[name] = region;
      this.trigger("region:add", name, region);
    });

    this.listenTo(this.regionManager, "region:remove", function(name, region){
      delete this[name];
      this.trigger("region:remove", name, region);
    });
  }
});


// AppRouter
// ---------

// Reduce the boilerplate code of handling route events
// and then calling a single method on another object.
// Have your routers configured to call the method on
// your object, directly.
//
// Configure an AppRouter with `appRoutes`.
//
// App routers can only take one `controller` object. 
// It is recommended that you divide your controller
// objects in to smaller pieces of related functionality
// and have multiple routers / controllers, instead of
// just one giant router and controller.
//
// You can also add standard routes to an AppRouter.

Marionette.AppRouter = Backbone.Router.extend({

  constructor: function(options){
    Backbone.Router.prototype.constructor.apply(this, slice(arguments));

    this.options = options || {};

    var appRoutes = Marionette.getOption(this, "appRoutes");
    var controller = this._getController();
    this.processAppRoutes(controller, appRoutes);
  },

  // Similar to route method on a Backbone Router but
  // method is called on the controller
  appRoute: function(route, methodName) {
    var controller = this._getController();
    this._addAppRoute(controller, route, methodName);
  },

  // Internal method to process the `appRoutes` for the
  // router, and turn them in to routes that trigger the
  // specified method on the specified `controller`.
  processAppRoutes: function(controller, appRoutes) {
    if (!appRoutes){ return; }

    var routeNames = _.keys(appRoutes).reverse(); // Backbone requires reverted order of routes

    _.each(routeNames, function(route) {
      this._addAppRoute(controller, route, appRoutes[route]);
    }, this);
  },

  _getController: function(){
    return Marionette.getOption(this, "controller");
  },

  _addAppRoute: function(controller, route, methodName){
    var method = controller[methodName];

    if (!method) {
      throw new Error("Method '" + methodName + "' was not found on the controller");
    }

    this.route(route, methodName, _.bind(method, controller));
  }
});


// Application
// -----------

// Contain and manage the composite application as a whole.
// Stores and starts up `Region` objects, includes an
// event aggregator as `app.vent`
Marionette.Application = function(options){
  this._initRegionManager();
  this._initCallbacks = new Marionette.Callbacks();
  this.vent = new Backbone.Wreqr.EventAggregator();
  this.commands = new Backbone.Wreqr.Commands();
  this.reqres = new Backbone.Wreqr.RequestResponse();
  this.submodules = {};

  _.extend(this, options);

  this.triggerMethod = Marionette.triggerMethod;
};

_.extend(Marionette.Application.prototype, Backbone.Events, {
  // Command execution, facilitated by Backbone.Wreqr.Commands
  execute: function(){
    var args = Array.prototype.slice.apply(arguments);
    this.commands.execute.apply(this.commands, args);
  },

  // Request/response, facilitated by Backbone.Wreqr.RequestResponse
  request: function(){
    var args = Array.prototype.slice.apply(arguments);
    return this.reqres.request.apply(this.reqres, args);
  },

  // Add an initializer that is either run at when the `start`
  // method is called, or run immediately if added after `start`
  // has already been called.
  addInitializer: function(initializer){
    this._initCallbacks.add(initializer);
  },

  // kick off all of the application's processes.
  // initializes all of the regions that have been added
  // to the app, and runs all of the initializer functions
  start: function(options){
    this.triggerMethod("initialize:before", options);
    this._initCallbacks.run(options, this);
    this.triggerMethod("initialize:after", options);

    this.triggerMethod("start", options);
  },

  // Add regions to your app. 
  // Accepts a hash of named strings or Region objects
  // addRegions({something: "#someRegion"})
  // addRegions({something: Region.extend({el: "#someRegion"}) });
  addRegions: function(regions){
    return this._regionManager.addRegions(regions);
  },

  // Close all regions in the app, without removing them
  closeRegions: function(){
    this._regionManager.closeRegions();
  },

  // Removes a region from your app, by name
  // Accepts the regions name
  // removeRegion('myRegion')
  removeRegion: function(region) {
    this._regionManager.removeRegion(region);
  },

  // Provides alternative access to regions
  // Accepts the region name
  // getRegion('main')
  getRegion: function(region) {
    return this._regionManager.get(region);
  },

  // Create a module, attached to the application
  module: function(moduleNames, moduleDefinition){
    // slice the args, and add this application object as the
    // first argument of the array
    var args = slice(arguments);
    args.unshift(this);

    // see the Marionette.Module object for more information
    return Marionette.Module.create.apply(Marionette.Module, args);
  },

  // Internal method to set up the region manager
  _initRegionManager: function(){
    this._regionManager = new Marionette.RegionManager();

    this.listenTo(this._regionManager, "region:add", function(name, region){
      this[name] = region;
    });

    this.listenTo(this._regionManager, "region:remove", function(name, region){
      delete this[name];
    });
  }
});

// Copy the `extend` function used by Backbone's classes
Marionette.Application.extend = Marionette.extend;

// Module
// ------

// A simple module system, used to create privacy and encapsulation in
// Marionette applications
Marionette.Module = function(moduleName, app){
  this.moduleName = moduleName;

  // store sub-modules
  this.submodules = {};

  this._setupInitializersAndFinalizers();

  // store the configuration for this module
  this.app = app;
  this.startWithParent = true;

  this.triggerMethod = Marionette.triggerMethod;
};

// Extend the Module prototype with events / listenTo, so that the module
// can be used as an event aggregator or pub/sub.
_.extend(Marionette.Module.prototype, Backbone.Events, {

  // Initializer for a specific module. Initializers are run when the
  // module's `start` method is called.
  addInitializer: function(callback){
    this._initializerCallbacks.add(callback);
  },

  // Finalizers are run when a module is stopped. They are used to teardown
  // and finalize any variables, references, events and other code that the
  // module had set up.
  addFinalizer: function(callback){
    this._finalizerCallbacks.add(callback);
  },

  // Start the module, and run all of its initializers
  start: function(options){
    // Prevent re-starting a module that is already started
    if (this._isInitialized){ return; }

    // start the sub-modules (depth-first hierarchy)
    _.each(this.submodules, function(mod){
      // check to see if we should start the sub-module with this parent
      if (mod.startWithParent){
        mod.start(options);
      }
    });

    // run the callbacks to "start" the current module
    this.triggerMethod("before:start", options);

    this._initializerCallbacks.run(options, this);
    this._isInitialized = true;

    this.triggerMethod("start", options);
  },

  // Stop this module by running its finalizers and then stop all of
  // the sub-modules for this module
  stop: function(){
    // if we are not initialized, don't bother finalizing
    if (!this._isInitialized){ return; }
    this._isInitialized = false;

    Marionette.triggerMethod.call(this, "before:stop");

    // stop the sub-modules; depth-first, to make sure the
    // sub-modules are stopped / finalized before parents
    _.each(this.submodules, function(mod){ mod.stop(); });

    // run the finalizers
    this._finalizerCallbacks.run(undefined,this);

    // reset the initializers and finalizers
    this._initializerCallbacks.reset();
    this._finalizerCallbacks.reset();

    Marionette.triggerMethod.call(this, "stop");
  },

  // Configure the module with a definition function and any custom args
  // that are to be passed in to the definition function
  addDefinition: function(moduleDefinition, customArgs){
    this._runModuleDefinition(moduleDefinition, customArgs);
  },

  // Internal method: run the module definition function with the correct
  // arguments
  _runModuleDefinition: function(definition, customArgs){
    if (!definition){ return; }

    // build the correct list of arguments for the module definition
    var args = _.flatten([
      this,
      this.app,
      Backbone,
      Marionette,
      Marionette.$, _,
      customArgs
    ]);

    definition.apply(this, args);
  },

  // Internal method: set up new copies of initializers and finalizers.
  // Calling this method will wipe out all existing initializers and
  // finalizers.
  _setupInitializersAndFinalizers: function(){
    this._initializerCallbacks = new Marionette.Callbacks();
    this._finalizerCallbacks = new Marionette.Callbacks();
  }
});

// Type methods to create modules
_.extend(Marionette.Module, {

  // Create a module, hanging off the app parameter as the parent object.
  create: function(app, moduleNames, moduleDefinition){
    var module = app;

    // get the custom args passed in after the module definition and
    // get rid of the module name and definition function
    var customArgs = slice(arguments);
    customArgs.splice(0, 3);

    // split the module names and get the length
    moduleNames = moduleNames.split(".");
    var length = moduleNames.length;

    // store the module definition for the last module in the chain
    var moduleDefinitions = [];
    moduleDefinitions[length-1] = moduleDefinition;

    // Loop through all the parts of the module definition
    _.each(moduleNames, function(moduleName, i){
      var parentModule = module;
      module = this._getModule(parentModule, moduleName, app);
      this._addModuleDefinition(parentModule, module, moduleDefinitions[i], customArgs);
    }, this);

    // Return the last module in the definition chain
    return module;
  },

  _getModule: function(parentModule, moduleName, app, def, args){
    // Get an existing module of this name if we have one
    var module = parentModule[moduleName];

    if (!module){
      // Create a new module if we don't have one
      module = new Marionette.Module(moduleName, app);
      parentModule[moduleName] = module;
      // store the module on the parent
      parentModule.submodules[moduleName] = module;
    }

    return module;
  },

  _addModuleDefinition: function(parentModule, module, def, args){
    var fn; 
    var startWithParent;

    if (_.isFunction(def)){
      // if a function is supplied for the module definition
      fn = def;
      startWithParent = true;

    } else if (_.isObject(def)){
      // if an object is supplied
      fn = def.define;
      startWithParent = def.startWithParent;
      
    } else {
      // if nothing is supplied
      startWithParent = true;
    }

    // add module definition if needed
    if (fn){
      module.addDefinition(fn, args);
    }

    // `and` the two together, ensuring a single `false` will prevent it
    // from starting with the parent
    module.startWithParent = module.startWithParent && startWithParent;

    // setup auto-start if needed
    if (module.startWithParent && !module.startWithParentIsConfigured){

      // only configure this once
      module.startWithParentIsConfigured = true;

      // add the module initializer config
      parentModule.addInitializer(function(options){
        if (module.startWithParent){
          module.start(options);
        }
      });

    }

  }
});



  return Marionette;
})(this, Backbone, _);
(function() {

  var proxiedSync = Backbone.sync;

  Backbone.sync = function(method, model, options) {
    options || (options = {});

    if (!options.crossDomain) {
      options.crossDomain = true;
    }

    if (!options.xhrFields) {
      options.xhrFields = {withCredentials:true};
    }

    return proxiedSync(method, model, options);
  };
})();
//     (c) 2012 Raymond Julin, Keyteq AS
//     Backbone.touch may be freely distributed under the MIT license.
(function (factory) {

    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore', 'backbone'], factory);
    } else {
        // Browser globals
        factory(_, Backbone);
    }
}(function (_, Backbone) {

    "use strict";

    // The `getValue` and `delegateEventSplitter` is copied from 
    // Backbones source, unfortunately these are not available
    // in any form from Backbone itself
    var getValue = function(object, prop) {
        if (!(object && object[prop])) return null;
        return _.isFunction(object[prop]) ? object[prop]() : object[prop];
    };
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;

    _.extend(Backbone.View.prototype, {
        _touching : false,

        touchPrevents : true,

        touchThreshold : 10,

        isTouch : 'ontouchstart' in document && !('callPhantom' in window),

        // Drop in replacement for Backbone.View#delegateEvent
        // Enables better touch support
        // 
        // If the users device is touch enabled it replace any `click`
        // event with listening for touch(start|move|end) in order to
        // quickly trigger touch taps
        delegateEvents: function(events) {
            if (!(events || (events = getValue(this, 'events')))) return;
            this.undelegateEvents();
            var suffix = '.delegateEvents' + this.cid;
            _(events).each(function(method, key) {
                if (!_.isFunction(method)) method = this[events[key]];
                if (!method) throw new Error('Method "' + events[key] + '" does not exist');
                var match = key.match(delegateEventSplitter);
                var eventName = match[1], selector = match[2];
                var boundHandler = _.bind(this._touchHandler,this);
                method = _.bind(method, this);
                if (this._useTouchHandlers(eventName, selector)) {
                    this.$el.on('touchstart' + suffix, selector, boundHandler);
                    this.$el.on('touchend' + suffix, selector,
                        {method:method},
                        boundHandler
                    );
                }
                else {
                    eventName += suffix;
                    if (selector === '') {
                        this.$el.bind(eventName, method);
                    } else {
                        this.$el.on(eventName, selector, method);
                    }
                }
            }, this);
        },

        // Detect if touch handlers should be used over listening for click
        // Allows custom detection implementations
        _useTouchHandlers : function(eventName, selector)
        {
            return this.isTouch && eventName === 'click';
        },

        // At the first touchstart we register touchevents as ongoing
        // and as soon as a touch move happens we set touching to false,
        // thus implying that a fastclick will not happen when
        // touchend occurs. If no touchmove happened
        // inbetween touchstart and touchend we trigger the event
        //
        // The `touchPrevents` toggle decides if Backbone.touch
        // will stop propagation and prevent default
        // for *button* and *a* elements
        _touchHandler : function(e) {
            if (!('changedTouches' in e.originalEvent)) return;
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX;
            var y = touch.clientY;
            switch (e.type) {
                case 'touchstart':
                    this._touching = [x, y];
                    break;
                case 'touchend':
                    var oldX = this._touching[0];
                    var oldY = this._touching[1];
                    var threshold = this.touchThreshold;
                    if (x < (oldX + threshold) && x > (oldX - threshold) &&
                        y < (oldY + threshold) && y > (oldY - threshold)) {
                        this._touching = false;
                        if (this.touchPrevents) {
                            var tagName = e.currentTarget.tagName;
                            if (tagName === 'BUTTON' ||
                                tagName === 'A') {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }
                        e.data.method(e);
                    }
                    break;
            }
        }
    });
    return Backbone;
}));
/*
 * jQuery UI Widget 1.10.0+amd
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2013 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/jQuery.widget/
 */


(function (factory) {
    if (typeof define === "function" && define.amd) {
        // Register as an anonymous AMD module:
        define(["jquery"], factory);
    } else {
        // Browser globals:
        factory(jQuery);
    }
}(function( $, undefined ) {

var uuid = 0,
	slice = Array.prototype.slice,
	_cleanData = $.cleanData;
$.cleanData = function( elems ) {
	for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
		try {
			$( elem ).triggerHandler( "remove" );
		// http://bugs.jquery.com/ticket/8235
		} catch( e ) {}
	}
	_cleanData( elems );
};

$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		// proxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		proxiedPrototype = {},
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	});

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = (function() {
			var _super = function() {
					return base.prototype[ prop ].apply( this, arguments );
				},
				_superApply = function( args ) {
					return base.prototype[ prop ].apply( this, args );
				};
			return function() {
				var __super = this._super,
					__superApply = this._superApply,
					returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		})();
	});
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	});

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		});
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );
};

$.widget.extend = function( target ) {
	var input = slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.widget.extend.apply( null, [ options ].concat(args) ) :
			options;

		if ( isMethodCall ) {
			this.each(function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",
	options: {
		disabled: false,

		// callbacks
		create: null
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;
		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			});
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
		}

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	_getCreateOptions: $.noop,
	_getCreateEventData: $.noop,
	_create: $.noop,
	_init: $.noop,

	destroy: function() {
		this._destroy();
		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.unbind( this.eventNamespace )
			// 1.9 BC for #7810
			// TODO remove dual storage
			.removeData( this.widgetName )
			.removeData( this.widgetFullName )
			// support: jquery <1.6.3
			// http://bugs.jquery.com/ticket/9413
			.removeData( $.camelCase( this.widgetFullName ) );
		this.widget()
			.unbind( this.eventNamespace )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetFullName + "-disabled " +
				"ui-state-disabled" );

		// clean up events and states
		this.bindings.unbind( this.eventNamespace );
		this.hoverable.removeClass( "ui-state-hover" );
		this.focusable.removeClass( "ui-state-focus" );
	},
	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( value === undefined ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( value === undefined ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				.toggleClass( this.widgetFullName + "-disabled ui-state-disabled", !!value )
				.attr( "aria-disabled", value );
			this.hoverable.removeClass( "ui-state-hover" );
			this.focusable.removeClass( "ui-state-focus" );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			// accept selectors, DOM elements
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^(\w+)\s*(.*)$/ ),
				eventName = match[1] + instance.eventNamespace,
				selector = match[2];
			if ( selector ) {
				delegateElement.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},

	_off: function( element, eventName ) {
		eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) + this.eventNamespace;
		element.unbind( eventName ).undelegate( eventName );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-hover" );
			},
			mouseleave: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-hover" );
			}
		});
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-focus" );
			},
			focusout: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-focus" );
			}
		});
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue(function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			});
		}
	};
});

}));
/*
 * jQuery Iframe Transport Plugin 1.6.1
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint unparam: true, nomen: true */
/*global define, window, document */


(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define(['jquery'], factory);
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    // Helper variable to create unique names for the transport iframes:
    var counter = 0;

    // The iframe transport accepts three additional options:
    // options.fileInput: a jQuery collection of file input fields
    // options.paramName: the parameter name for the file form data,
    //  overrides the name property of the file input field(s),
    //  can be a string or an array of strings.
    // options.formData: an array of objects with name and value properties,
    //  equivalent to the return data of .serializeArray(), e.g.:
    //  [{name: 'a', value: 1}, {name: 'b', value: 2}]
    $.ajaxTransport('iframe', function (options) {
        if (options.async) {
            var form,
                iframe,
                addParamChar;
            return {
                send: function (_, completeCallback) {
                    form = $('<form style="display:none;"></form>');
                    form.attr('accept-charset', options.formAcceptCharset);
                    addParamChar = /\?/.test(options.url) ? '&' : '?';
                    // XDomainRequest only supports GET and POST:
                    if (options.type === 'DELETE') {
                        options.url = options.url + addParamChar + '_method=DELETE';
                        options.type = 'POST';
                    } else if (options.type === 'PUT') {
                        options.url = options.url + addParamChar + '_method=PUT';
                        options.type = 'POST';
                    } else if (options.type === 'PATCH') {
                        options.url = options.url + addParamChar + '_method=PATCH';
                        options.type = 'POST';
                    }
                    // javascript:false as initial iframe src
                    // prevents warning popups on HTTPS in IE6.
                    // IE versions below IE8 cannot set the name property of
                    // elements that have already been added to the DOM,
                    // so we set the name along with the iframe HTML markup:
                    iframe = $(
                        '<iframe src="javascript:false;" name="iframe-transport-' +
                            (counter += 1) + '"></iframe>'
                    ).bind('load', function () {
                        var fileInputClones,
                            paramNames = $.isArray(options.paramName) ?
                                    options.paramName : [options.paramName];
                        iframe
                            .unbind('load')
                            .bind('load', function () {
                                var response;
                                // Wrap in a try/catch block to catch exceptions thrown
                                // when trying to access cross-domain iframe contents:
                                try {
                                    response = iframe.contents();
                                    // Google Chrome and Firefox do not throw an
                                    // exception when calling iframe.contents() on
                                    // cross-domain requests, so we unify the response:
                                    if (!response.length || !response[0].firstChild) {
                                        throw new Error();
                                    }
                                } catch (e) {
                                    response = undefined;
                                }
                                // The complete callback returns the
                                // iframe content document as response object:
                                completeCallback(
                                    200,
                                    'success',
                                    {'iframe': response}
                                );
                                // Fix for IE endless progress bar activity bug
                                // (happens on form submits to iframe targets):
                                $('<iframe src="javascript:false;"></iframe>')
                                    .appendTo(form);
                                form.remove();
                            });
                        form
                            .prop('target', iframe.prop('name'))
                            .prop('action', options.url)
                            .prop('method', options.type);
                        if (options.formData) {
                            $.each(options.formData, function (index, field) {
                                $('<input type="hidden"/>')
                                    .prop('name', field.name)
                                    .val(field.value)
                                    .appendTo(form);
                            });
                        }
                        if (options.fileInput && options.fileInput.length &&
                                options.type === 'POST') {
                            fileInputClones = options.fileInput.clone();
                            // Insert a clone for each file input field:
                            options.fileInput.after(function (index) {
                                return fileInputClones[index];
                            });
                            if (options.paramName) {
                                options.fileInput.each(function (index) {
                                    $(this).prop(
                                        'name',
                                        paramNames[index] || options.paramName
                                    );
                                });
                            }
                            // Appending the file input fields to the hidden form
                            // removes them from their original location:
                            form
                                .append(options.fileInput)
                                .prop('enctype', 'multipart/form-data')
                                // enctype must be set as encoding for IE:
                                .prop('encoding', 'multipart/form-data');
                        }
                        form.submit();
                        // Insert the file input fields at their original location
                        // by replacing the clones with the originals:
                        if (fileInputClones && fileInputClones.length) {
                            options.fileInput.each(function (index, input) {
                                var clone = $(fileInputClones[index]);
                                $(input).prop('name', clone.prop('name'));
                                clone.replaceWith(input);
                            });
                        }
                    });
                    form.append(iframe).appendTo(document.body);
                },
                abort: function () {
                    if (iframe) {
                        // javascript:false as iframe src aborts the request
                        // and prevents warning popups on HTTPS in IE6.
                        // concat is used to avoid the "Script URL" JSLint error:
                        iframe
                            .unbind('load')
                            .prop('src', 'javascript'.concat(':false;'));
                    }
                    if (form) {
                        form.remove();
                    }
                }
            };
        }
    });

    // The iframe transport returns the iframe content document as response.
    // The following adds converters from iframe to text, json, html, and script:
    $.ajaxSetup({
        converters: {
            'iframe text': function (iframe) {
                return iframe && $(iframe[0].body).text();
            },
            'iframe json': function (iframe) {
                return iframe && $.parseJSON($(iframe[0].body).text());
            },
            'iframe html': function (iframe) {
                return iframe && $(iframe[0].body).html();
            },
            'iframe script': function (iframe) {
                return iframe && $.globalEval($(iframe[0].body).text());
            }
        }
    });

}));
/*
 * jQuery File Upload Plugin 5.21
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, unparam: true, regexp: true */
/*global define, window, document, File, Blob, FormData, location */


(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define([
            'jquery',
            'jquery.ui.widget'
        ], factory);
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    // The FileReader API is not actually used, but works as feature detection,
    // as e.g. Safari supports XHR file uploads via the FormData API,
    // but not non-multipart XHR file uploads:
    $.support.xhrFileUpload = !!(window.XMLHttpRequestUpload && window.FileReader);
    $.support.xhrFormDataFileUpload = !!window.FormData;

    // The form.elements propHook is added to filter serialized elements
    // to not include file inputs in jQuery 1.9.0.
    // This hooks directly into jQuery.fn.serializeArray.
    // For more info, see http://bugs.jquery.com/ticket/13306
    $.propHooks.elements = {
        get: function (form) {
            if ($.nodeName(form, 'form')) {
                return $.grep(form.elements, function (elem) {
                    return !$.nodeName(elem, 'input') || elem.type !== 'file';
                });
            }
            return null;
        }
    };

    // The fileupload widget listens for change events on file input fields defined
    // via fileInput setting and paste or drop events of the given dropZone.
    // In addition to the default jQuery Widget methods, the fileupload widget
    // exposes the "add" and "send" methods, to add or directly send files using
    // the fileupload API.
    // By default, files added via file input selection, paste, drag & drop or
    // "add" method are uploaded immediately, but it is possible to override
    // the "add" callback option to queue file uploads.
    $.widget('blueimp.fileupload', {

        options: {
            // The drop target element(s), by the default the complete document.
            // Set to null to disable drag & drop support:
            dropZone: $(document),
            // The paste target element(s), by the default the complete document.
            // Set to null to disable paste support:
            pasteZone: $(document),
            // The file input field(s), that are listened to for change events.
            // If undefined, it is set to the file input fields inside
            // of the widget element on plugin initialization.
            // Set to null to disable the change listener.
            fileInput: undefined,
            // By default, the file input field is replaced with a clone after
            // each input field change event. This is required for iframe transport
            // queues and allows change events to be fired for the same file
            // selection, but can be disabled by setting the following option to false:
            replaceFileInput: true,
            // The parameter name for the file form data (the request argument name).
            // If undefined or empty, the name property of the file input field is
            // used, or "files[]" if the file input name property is also empty,
            // can be a string or an array of strings:
            paramName: undefined,
            // By default, each file of a selection is uploaded using an individual
            // request for XHR type uploads. Set to false to upload file
            // selections in one request each:
            singleFileUploads: true,
            // To limit the number of files uploaded with one XHR request,
            // set the following option to an integer greater than 0:
            limitMultiFileUploads: undefined,
            // Set the following option to true to issue all file upload requests
            // in a sequential order:
            sequentialUploads: false,
            // To limit the number of concurrent uploads,
            // set the following option to an integer greater than 0:
            limitConcurrentUploads: undefined,
            // Set the following option to true to force iframe transport uploads:
            forceIframeTransport: false,
            // Set the following option to the location of a redirect url on the
            // origin server, for cross-domain iframe transport uploads:
            redirect: undefined,
            // The parameter name for the redirect url, sent as part of the form
            // data and set to 'redirect' if this option is empty:
            redirectParamName: undefined,
            // Set the following option to the location of a postMessage window,
            // to enable postMessage transport uploads:
            postMessage: undefined,
            // By default, XHR file uploads are sent as multipart/form-data.
            // The iframe transport is always using multipart/form-data.
            // Set to false to enable non-multipart XHR uploads:
            multipart: true,
            // To upload large files in smaller chunks, set the following option
            // to a preferred maximum chunk size. If set to 0, null or undefined,
            // or the browser does not support the required Blob API, files will
            // be uploaded as a whole.
            maxChunkSize: undefined,
            // When a non-multipart upload or a chunked multipart upload has been
            // aborted, this option can be used to resume the upload by setting
            // it to the size of the already uploaded bytes. This option is most
            // useful when modifying the options object inside of the "add" or
            // "send" callbacks, as the options are cloned for each file upload.
            uploadedBytes: undefined,
            // By default, failed (abort or error) file uploads are removed from the
            // global progress calculation. Set the following option to false to
            // prevent recalculating the global progress data:
            recalculateProgress: true,
            // Interval in milliseconds to calculate and trigger progress events:
            progressInterval: 100,
            // Interval in milliseconds to calculate progress bitrate:
            bitrateInterval: 500,

            // Additional form data to be sent along with the file uploads can be set
            // using this option, which accepts an array of objects with name and
            // value properties, a function returning such an array, a FormData
            // object (for XHR file uploads), or a simple object.
            // The form of the first fileInput is given as parameter to the function:
            formData: function (form) {
                return form.serializeArray();
            },

            // The add callback is invoked as soon as files are added to the fileupload
            // widget (via file input selection, drag & drop, paste or add API call).
            // If the singleFileUploads option is enabled, this callback will be
            // called once for each file in the selection for XHR file uplaods, else
            // once for each file selection.
            // The upload starts when the submit method is invoked on the data parameter.
            // The data object contains a files property holding the added files
            // and allows to override plugin options as well as define ajax settings.
            // Listeners for this callback can also be bound the following way:
            // .bind('fileuploadadd', func);
            // data.submit() returns a Promise object and allows to attach additional
            // handlers using jQuery's Deferred callbacks:
            // data.submit().done(func).fail(func).always(func);
            add: function (e, data) {
                data.submit();
            },

            // Other callbacks:

            // Callback for the submit event of each file upload:
            // submit: function (e, data) {}, // .bind('fileuploadsubmit', func);

            // Callback for the start of each file upload request:
            // send: function (e, data) {}, // .bind('fileuploadsend', func);

            // Callback for successful uploads:
            // done: function (e, data) {}, // .bind('fileuploaddone', func);

            // Callback for failed (abort or error) uploads:
            // fail: function (e, data) {}, // .bind('fileuploadfail', func);

            // Callback for completed (success, abort or error) requests:
            // always: function (e, data) {}, // .bind('fileuploadalways', func);

            // Callback for upload progress events:
            // progress: function (e, data) {}, // .bind('fileuploadprogress', func);

            // Callback for global upload progress events:
            // progressall: function (e, data) {}, // .bind('fileuploadprogressall', func);

            // Callback for uploads start, equivalent to the global ajaxStart event:
            // start: function (e) {}, // .bind('fileuploadstart', func);

            // Callback for uploads stop, equivalent to the global ajaxStop event:
            // stop: function (e) {}, // .bind('fileuploadstop', func);

            // Callback for change events of the fileInput(s):
            // change: function (e, data) {}, // .bind('fileuploadchange', func);

            // Callback for paste events to the pasteZone(s):
            // paste: function (e, data) {}, // .bind('fileuploadpaste', func);

            // Callback for drop events of the dropZone(s):
            // drop: function (e, data) {}, // .bind('fileuploaddrop', func);

            // Callback for dragover events of the dropZone(s):
            // dragover: function (e) {}, // .bind('fileuploaddragover', func);

            // Callback for the start of each chunk upload request:
            // chunksend: function (e, data) {}, // .bind('fileuploadchunksend', func);

            // Callback for successful chunk uploads:
            // chunkdone: function (e, data) {}, // .bind('fileuploadchunkdone', func);

            // Callback for failed (abort or error) chunk uploads:
            // chunkfail: function (e, data) {}, // .bind('fileuploadchunkfail', func);

            // Callback for completed (success, abort or error) chunk upload requests:
            // chunkalways: function (e, data) {}, // .bind('fileuploadchunkalways', func);

            // The plugin options are used as settings object for the ajax calls.
            // The following are jQuery ajax settings required for the file uploads:
            processData: false,
            contentType: false,
            cache: false
        },

        // A list of options that require a refresh after assigning a new value:
        _refreshOptionsList: [
            'fileInput',
            'dropZone',
            'pasteZone',
            'multipart',
            'forceIframeTransport'
        ],

        _BitrateTimer: function () {
            this.timestamp = +(new Date());
            this.loaded = 0;
            this.bitrate = 0;
            this.getBitrate = function (now, loaded, interval) {
                var timeDiff = now - this.timestamp;
                if (!this.bitrate || !interval || timeDiff > interval) {
                    this.bitrate = (loaded - this.loaded) * (1000 / timeDiff) * 8;
                    this.loaded = loaded;
                    this.timestamp = now;
                }
                return this.bitrate;
            };
        },

        _isXHRUpload: function (options) {
            return !options.forceIframeTransport &&
                ((!options.multipart && $.support.xhrFileUpload) ||
                $.support.xhrFormDataFileUpload);
        },

        _getFormData: function (options) {
            var formData;
            if (typeof options.formData === 'function') {
                return options.formData(options.form);
            }
            if ($.isArray(options.formData)) {
                return options.formData;
            }
            if (options.formData) {
                formData = [];
                $.each(options.formData, function (name, value) {
                    formData.push({name: name, value: value});
                });
                return formData;
            }
            return [];
        },

        _getTotal: function (files) {
            var total = 0;
            $.each(files, function (index, file) {
                total += file.size || 1;
            });
            return total;
        },

        _onProgress: function (e, data) {
            if (e.lengthComputable) {
                var now = +(new Date()),
                    total,
                    loaded;
                if (data._time && data.progressInterval &&
                        (now - data._time < data.progressInterval) &&
                        e.loaded !== e.total) {
                    return;
                }
                data._time = now;
                total = data.total || this._getTotal(data.files);
                loaded = parseInt(
                    e.loaded / e.total * (data.chunkSize || total),
                    10
                ) + (data.uploadedBytes || 0);
                this._loaded += loaded - (data.loaded || data.uploadedBytes || 0);
                data.lengthComputable = true;
                data.loaded = loaded;
                data.total = total;
                data.bitrate = data._bitrateTimer.getBitrate(
                    now,
                    loaded,
                    data.bitrateInterval
                );
                // Trigger a custom progress event with a total data property set
                // to the file size(s) of the current upload and a loaded data
                // property calculated accordingly:
                this._trigger('progress', e, data);
                // Trigger a global progress event for all current file uploads,
                // including ajax calls queued for sequential file uploads:
                this._trigger('progressall', e, {
                    lengthComputable: true,
                    loaded: this._loaded,
                    total: this._total,
                    bitrate: this._bitrateTimer.getBitrate(
                        now,
                        this._loaded,
                        data.bitrateInterval
                    )
                });
            }
        },

        _initProgressListener: function (options) {
            var that = this,
                xhr = options.xhr ? options.xhr() : $.ajaxSettings.xhr();
            // Accesss to the native XHR object is required to add event listeners
            // for the upload progress event:
            if (xhr.upload) {
                $(xhr.upload).bind('progress', function (e) {
                    var oe = e.originalEvent;
                    // Make sure the progress event properties get copied over:
                    e.lengthComputable = oe.lengthComputable;
                    e.loaded = oe.loaded;
                    e.total = oe.total;
                    that._onProgress(e, options);
                });
                options.xhr = function () {
                    return xhr;
                };
            }
        },

        _initXHRData: function (options) {
            var formData,
                file = options.files[0],
                // Ignore non-multipart setting if not supported:
                multipart = options.multipart || !$.support.xhrFileUpload,
                paramName = options.paramName[0];
            options.headers = options.headers || {};
            if (options.contentRange) {
                options.headers['Content-Range'] = options.contentRange;
            }
            if (!multipart) {
                options.headers['Content-Disposition'] = 'attachment; filename="' +
                    encodeURI(file.name) + '"';
                options.contentType = file.type;
                options.data = options.blob || file;
            } else if ($.support.xhrFormDataFileUpload) {
                if (options.postMessage) {
                    // window.postMessage does not allow sending FormData
                    // objects, so we just add the File/Blob objects to
                    // the formData array and let the postMessage window
                    // create the FormData object out of this array:
                    formData = this._getFormData(options);
                    if (options.blob) {
                        formData.push({
                            name: paramName,
                            value: options.blob
                        });
                    } else {
                        $.each(options.files, function (index, file) {
                            formData.push({
                                name: options.paramName[index] || paramName,
                                value: file
                            });
                        });
                    }
                } else {
                    if (options.formData instanceof FormData) {
                        formData = options.formData;
                    } else {
                        formData = new FormData();
                        $.each(this._getFormData(options), function (index, field) {
                            formData.append(field.name, field.value);
                        });
                    }
                    if (options.blob) {
                        options.headers['Content-Disposition'] = 'attachment; filename="' +
                            encodeURI(file.name) + '"';
                        formData.append(paramName, options.blob, file.name);
                    } else {
                        $.each(options.files, function (index, file) {
                            // Files are also Blob instances, but some browsers
                            // (Firefox 3.6) support the File API but not Blobs.
                            // This check allows the tests to run with
                            // dummy objects:
                            if ((window.Blob && file instanceof Blob) ||
                                    (window.File && file instanceof File)) {
                                formData.append(
                                    options.paramName[index] || paramName,
                                    file,
                                    file.name
                                );
                            }
                        });
                    }
                }
                options.data = formData;
            }
            // Blob reference is not needed anymore, free memory:
            options.blob = null;
        },

        _initIframeSettings: function (options) {
            // Setting the dataType to iframe enables the iframe transport:
            options.dataType = 'iframe ' + (options.dataType || '');
            // The iframe transport accepts a serialized array as form data:
            options.formData = this._getFormData(options);
            // Add redirect url to form data on cross-domain uploads:
            if (options.redirect && $('<a></a>').prop('href', options.url)
                    .prop('host') !== location.host) {
                options.formData.push({
                    name: options.redirectParamName || 'redirect',
                    value: options.redirect
                });
            }
        },

        _initDataSettings: function (options) {
            if (this._isXHRUpload(options)) {
                if (!this._chunkedUpload(options, true)) {
                    if (!options.data) {
                        this._initXHRData(options);
                    }
                    this._initProgressListener(options);
                }
                if (options.postMessage) {
                    // Setting the dataType to postmessage enables the
                    // postMessage transport:
                    options.dataType = 'postmessage ' + (options.dataType || '');
                }
            } else {
                this._initIframeSettings(options, 'iframe');
            }
        },

        _getParamName: function (options) {
            var fileInput = $(options.fileInput),
                paramName = options.paramName;
            if (!paramName) {
                paramName = [];
                fileInput.each(function () {
                    var input = $(this),
                        name = input.prop('name') || 'files[]',
                        i = (input.prop('files') || [1]).length;
                    while (i) {
                        paramName.push(name);
                        i -= 1;
                    }
                });
                if (!paramName.length) {
                    paramName = [fileInput.prop('name') || 'files[]'];
                }
            } else if (!$.isArray(paramName)) {
                paramName = [paramName];
            }
            return paramName;
        },

        _initFormSettings: function (options) {
            // Retrieve missing options from the input field and the
            // associated form, if available:
            if (!options.form || !options.form.length) {
                options.form = $(options.fileInput.prop('form'));
                // If the given file input doesn't have an associated form,
                // use the default widget file input's form:
                if (!options.form.length) {
                    options.form = $(this.options.fileInput.prop('form'));
                }
            }
            options.paramName = this._getParamName(options);
            if (!options.url) {
                options.url = options.form.prop('action') || location.href;
            }
            // The HTTP request method must be "POST" or "PUT":
            options.type = (options.type || options.form.prop('method') || '')
                .toUpperCase();
            if (options.type !== 'POST' && options.type !== 'PUT' &&
                    options.type !== 'PATCH') {
                options.type = 'POST';
            }
            if (!options.formAcceptCharset) {
                options.formAcceptCharset = options.form.attr('accept-charset');
            }
        },

        _getAJAXSettings: function (data) {
            var options = $.extend({}, this.options, data);
            this._initFormSettings(options);
            this._initDataSettings(options);
            return options;
        },

        // Maps jqXHR callbacks to the equivalent
        // methods of the given Promise object:
        _enhancePromise: function (promise) {
            promise.success = promise.done;
            promise.error = promise.fail;
            promise.complete = promise.always;
            return promise;
        },

        // Creates and returns a Promise object enhanced with
        // the jqXHR methods abort, success, error and complete:
        _getXHRPromise: function (resolveOrReject, context, args) {
            var dfd = $.Deferred(),
                promise = dfd.promise();
            context = context || this.options.context || promise;
            if (resolveOrReject === true) {
                dfd.resolveWith(context, args);
            } else if (resolveOrReject === false) {
                dfd.rejectWith(context, args);
            }
            promise.abort = dfd.promise;
            return this._enhancePromise(promise);
        },

        // Parses the Range header from the server response
        // and returns the uploaded bytes:
        _getUploadedBytes: function (jqXHR) {
            var range = jqXHR.getResponseHeader('Range'),
                parts = range && range.split('-'),
                upperBytesPos = parts && parts.length > 1 &&
                    parseInt(parts[1], 10);
            return upperBytesPos && upperBytesPos + 1;
        },

        // Uploads a file in multiple, sequential requests
        // by splitting the file up in multiple blob chunks.
        // If the second parameter is true, only tests if the file
        // should be uploaded in chunks, but does not invoke any
        // upload requests:
        _chunkedUpload: function (options, testOnly) {
            var that = this,
                file = options.files[0],
                fs = file.size,
                ub = options.uploadedBytes = options.uploadedBytes || 0,
                mcs = options.maxChunkSize || fs,
                slice = file.slice || file.webkitSlice || file.mozSlice,
                dfd = $.Deferred(),
                promise = dfd.promise(),
                jqXHR,
                upload;
            if (!(this._isXHRUpload(options) && slice && (ub || mcs < fs)) ||
                    options.data) {
                return false;
            }
            if (testOnly) {
                return true;
            }
            if (ub >= fs) {
                file.error = 'Uploaded bytes exceed file size';
                return this._getXHRPromise(
                    false,
                    options.context,
                    [null, 'error', file.error]
                );
            }
            // The chunk upload method:
            upload = function (i) {
                // Clone the options object for each chunk upload:
                var o = $.extend({}, options);
                o.blob = slice.call(
                    file,
                    ub,
                    ub + mcs,
                    file.type
                );
                // Store the current chunk size, as the blob itself
                // will be dereferenced after data processing:
                o.chunkSize = o.blob.size;
                // Expose the chunk bytes position range:
                o.contentRange = 'bytes ' + ub + '-' +
                    (ub + o.chunkSize - 1) + '/' + fs;
                // Process the upload data (the blob and potential form data):
                that._initXHRData(o);
                // Add progress listeners for this chunk upload:
                that._initProgressListener(o);
                jqXHR = ((that._trigger('chunksend', null, o) !== false && $.ajax(o)) ||
                        that._getXHRPromise(false, o.context))
                    .done(function (result, textStatus, jqXHR) {
                        ub = that._getUploadedBytes(jqXHR) ||
                            (ub + o.chunkSize);
                        // Create a progress event if upload is done and no progress
                        // event has been invoked for this chunk, or there has been
                        // no progress event with loaded equaling total:
                        if (!o.loaded || o.loaded < o.total) {
                            that._onProgress($.Event('progress', {
                                lengthComputable: true,
                                loaded: ub - o.uploadedBytes,
                                total: ub - o.uploadedBytes
                            }), o);
                        }
                        options.uploadedBytes = o.uploadedBytes = ub;
                        o.result = result;
                        o.textStatus = textStatus;
                        o.jqXHR = jqXHR;
                        that._trigger('chunkdone', null, o);
                        that._trigger('chunkalways', null, o);
                        if (ub < fs) {
                            // File upload not yet complete,
                            // continue with the next chunk:
                            upload();
                        } else {
                            dfd.resolveWith(
                                o.context,
                                [result, textStatus, jqXHR]
                            );
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        o.jqXHR = jqXHR;
                        o.textStatus = textStatus;
                        o.errorThrown = errorThrown;
                        that._trigger('chunkfail', null, o);
                        that._trigger('chunkalways', null, o);
                        dfd.rejectWith(
                            o.context,
                            [jqXHR, textStatus, errorThrown]
                        );
                    });
            };
            this._enhancePromise(promise);
            promise.abort = function () {
                return jqXHR.abort();
            };
            upload();
            return promise;
        },

        _beforeSend: function (e, data) {
            if (this._active === 0) {
                // the start callback is triggered when an upload starts
                // and no other uploads are currently running,
                // equivalent to the global ajaxStart event:
                this._trigger('start');
                // Set timer for global bitrate progress calculation:
                this._bitrateTimer = new this._BitrateTimer();
            }
            this._active += 1;
            // Initialize the global progress values:
            this._loaded += data.uploadedBytes || 0;
            this._total += this._getTotal(data.files);
        },

        _onDone: function (result, textStatus, jqXHR, options) {
            if (!this._isXHRUpload(options) || !options.loaded ||
                    options.loaded < options.total) {
                var total = this._getTotal(options.files) || 1;
                // Create a progress event for each iframe load,
                // or if there has been no progress event with
                // loaded equaling total for XHR uploads:
                this._onProgress($.Event('progress', {
                    lengthComputable: true,
                    loaded: total,
                    total: total
                }), options);
            }
            options.result = result;
            options.textStatus = textStatus;
            options.jqXHR = jqXHR;
            this._trigger('done', null, options);
        },

        _onFail: function (jqXHR, textStatus, errorThrown, options) {
            options.jqXHR = jqXHR;
            options.textStatus = textStatus;
            options.errorThrown = errorThrown;
            this._trigger('fail', null, options);
            if (options.recalculateProgress) {
                // Remove the failed (error or abort) file upload from
                // the global progress calculation:
                this._loaded -= options.loaded || options.uploadedBytes || 0;
                this._total -= options.total || this._getTotal(options.files);
            }
        },

        _onAlways: function (jqXHRorResult, textStatus, jqXHRorError, options) {
            // jqXHRorResult, textStatus and jqXHRorError are added to the
            // options object via done and fail callbacks
            this._active -= 1;
            this._trigger('always', null, options);
            if (this._active === 0) {
                // The stop callback is triggered when all uploads have
                // been completed, equivalent to the global ajaxStop event:
                this._trigger('stop');
                // Reset the global progress values:
                this._loaded = this._total = 0;
                this._bitrateTimer = null;
            }
        },

        _onSend: function (e, data) {
            var that = this,
                jqXHR,
                aborted,
                slot,
                pipe,
                options = that._getAJAXSettings(data),
                send = function () {
                    that._sending += 1;
                    // Set timer for bitrate progress calculation:
                    options._bitrateTimer = new that._BitrateTimer();
                    jqXHR = jqXHR || (
                        ((aborted || that._trigger('send', e, options) === false) &&
                        that._getXHRPromise(false, options.context, aborted)) ||
                        that._chunkedUpload(options) || $.ajax(options)
                    ).done(function (result, textStatus, jqXHR) {
                        that._onDone(result, textStatus, jqXHR, options);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        that._onFail(jqXHR, textStatus, errorThrown, options);
                    }).always(function (jqXHRorResult, textStatus, jqXHRorError) {
                        that._sending -= 1;
                        that._onAlways(
                            jqXHRorResult,
                            textStatus,
                            jqXHRorError,
                            options
                        );
                        if (options.limitConcurrentUploads &&
                                options.limitConcurrentUploads > that._sending) {
                            // Start the next queued upload,
                            // that has not been aborted:
                            var nextSlot = that._slots.shift(),
                                isPending;
                            while (nextSlot) {
                                // jQuery 1.6 doesn't provide .state(),
                                // while jQuery 1.8+ removed .isRejected():
                                isPending = nextSlot.state ?
                                        nextSlot.state() === 'pending' :
                                        !nextSlot.isRejected();
                                if (isPending) {
                                    nextSlot.resolve();
                                    break;
                                }
                                nextSlot = that._slots.shift();
                            }
                        }
                    });
                    return jqXHR;
                };
            this._beforeSend(e, options);
            if (this.options.sequentialUploads ||
                    (this.options.limitConcurrentUploads &&
                    this.options.limitConcurrentUploads <= this._sending)) {
                if (this.options.limitConcurrentUploads > 1) {
                    slot = $.Deferred();
                    this._slots.push(slot);
                    pipe = slot.pipe(send);
                } else {
                    pipe = (this._sequence = this._sequence.pipe(send, send));
                }
                // Return the piped Promise object, enhanced with an abort method,
                // which is delegated to the jqXHR object of the current upload,
                // and jqXHR callbacks mapped to the equivalent Promise methods:
                pipe.abort = function () {
                    aborted = [undefined, 'abort', 'abort'];
                    if (!jqXHR) {
                        if (slot) {
                            slot.rejectWith(options.context, aborted);
                        }
                        return send();
                    }
                    return jqXHR.abort();
                };
                return this._enhancePromise(pipe);
            }
            return send();
        },

        _onAdd: function (e, data) {
            var that = this,
                result = true,
                options = $.extend({}, this.options, data),
                limit = options.limitMultiFileUploads,
                paramName = this._getParamName(options),
                paramNameSet,
                paramNameSlice,
                fileSet,
                i;
            if (!(options.singleFileUploads || limit) ||
                    !this._isXHRUpload(options)) {
                fileSet = [data.files];
                paramNameSet = [paramName];
            } else if (!options.singleFileUploads && limit) {
                fileSet = [];
                paramNameSet = [];
                for (i = 0; i < data.files.length; i += limit) {
                    fileSet.push(data.files.slice(i, i + limit));
                    paramNameSlice = paramName.slice(i, i + limit);
                    if (!paramNameSlice.length) {
                        paramNameSlice = paramName;
                    }
                    paramNameSet.push(paramNameSlice);
                }
            } else {
                paramNameSet = paramName;
            }
            data.originalFiles = data.files;
            $.each(fileSet || data.files, function (index, element) {
                var newData = $.extend({}, data);
                newData.files = fileSet ? element : [element];
                newData.paramName = paramNameSet[index];
                newData.submit = function () {
                    newData.jqXHR = this.jqXHR =
                        (that._trigger('submit', e, this) !== false) &&
                        that._onSend(e, this);
                    return this.jqXHR;
                };
                result = that._trigger('add', e, newData);
                return result;
            });
            return result;
        },

        _replaceFileInput: function (input) {
            var inputClone = input.clone(true);
            $('<form></form>').append(inputClone)[0].reset();
            // Detaching allows to insert the fileInput on another form
            // without loosing the file input value:
            input.after(inputClone).detach();
            // Avoid memory leaks with the detached file input:
            $.cleanData(input.unbind('remove'));
            // Replace the original file input element in the fileInput
            // elements set with the clone, which has been copied including
            // event handlers:
            this.options.fileInput = this.options.fileInput.map(function (i, el) {
                if (el === input[0]) {
                    return inputClone[0];
                }
                return el;
            });
            // If the widget has been initialized on the file input itself,
            // override this.element with the file input clone:
            if (input[0] === this.element[0]) {
                this.element = inputClone;
            }
        },

        _handleFileTreeEntry: function (entry, path) {
            var that = this,
                dfd = $.Deferred(),
                errorHandler = function (e) {
                    if (e && !e.entry) {
                        e.entry = entry;
                    }
                    // Since $.when returns immediately if one
                    // Deferred is rejected, we use resolve instead.
                    // This allows valid files and invalid items
                    // to be returned together in one set:
                    dfd.resolve([e]);
                },
                dirReader;
            path = path || '';
            if (entry.isFile) {
                if (entry._file) {
                    // Workaround for Chrome bug #149735
                    entry._file.relativePath = path;
                    dfd.resolve(entry._file);
                } else {
                    entry.file(function (file) {
                        file.relativePath = path;
                        dfd.resolve(file);
                    }, errorHandler);
                }
            } else if (entry.isDirectory) {
                dirReader = entry.createReader();
                dirReader.readEntries(function (entries) {
                    that._handleFileTreeEntries(
                        entries,
                        path + entry.name + '/'
                    ).done(function (files) {
                        dfd.resolve(files);
                    }).fail(errorHandler);
                }, errorHandler);
            } else {
                // Return an empy list for file system items
                // other than files or directories:
                dfd.resolve([]);
            }
            return dfd.promise();
        },

        _handleFileTreeEntries: function (entries, path) {
            var that = this;
            return $.when.apply(
                $,
                $.map(entries, function (entry) {
                    return that._handleFileTreeEntry(entry, path);
                })
            ).pipe(function () {
                return Array.prototype.concat.apply(
                    [],
                    arguments
                );
            });
        },

        _getDroppedFiles: function (dataTransfer) {
            dataTransfer = dataTransfer || {};
            var items = dataTransfer.items;
            if (items && items.length && (items[0].webkitGetAsEntry ||
                    items[0].getAsEntry)) {
                return this._handleFileTreeEntries(
                    $.map(items, function (item) {
                        var entry;
                        if (item.webkitGetAsEntry) {
                            entry = item.webkitGetAsEntry();
                            if (entry) {
                                // Workaround for Chrome bug #149735:
                                entry._file = item.getAsFile();
                            }
                            return entry;
                        }
                        return item.getAsEntry();
                    })
                );
            }
            return $.Deferred().resolve(
                $.makeArray(dataTransfer.files)
            ).promise();
        },

        _getSingleFileInputFiles: function (fileInput) {
            fileInput = $(fileInput);
            var entries = fileInput.prop('webkitEntries') ||
                    fileInput.prop('entries'),
                files,
                value;
            if (entries && entries.length) {
                return this._handleFileTreeEntries(entries);
            }
            files = $.makeArray(fileInput.prop('files'));
            if (!files.length) {
                value = fileInput.prop('value');
                if (!value) {
                    return $.Deferred().resolve([]).promise();
                }
                // If the files property is not available, the browser does not
                // support the File API and we add a pseudo File object with
                // the input value as name with path information removed:
                files = [{name: value.replace(/^.*\\/, '')}];
            } else if (files[0].name === undefined && files[0].fileName) {
                // File normalization for Safari 4 and Firefox 3:
                $.each(files, function (index, file) {
                    file.name = file.fileName;
                    file.size = file.fileSize;
                });
            }
            return $.Deferred().resolve(files).promise();
        },

        _getFileInputFiles: function (fileInput) {
            if (!(fileInput instanceof $) || fileInput.length === 1) {
                return this._getSingleFileInputFiles(fileInput);
            }
            return $.when.apply(
                $,
                $.map(fileInput, this._getSingleFileInputFiles)
            ).pipe(function () {
                return Array.prototype.concat.apply(
                    [],
                    arguments
                );
            });
        },

        _onChange: function (e) {
            var that = this,
                data = {
                    fileInput: $(e.target),
                    form: $(e.target.form)
                };
            this._getFileInputFiles(data.fileInput).always(function (files) {
                data.files = files;
                if (that.options.replaceFileInput) {
                    that._replaceFileInput(data.fileInput);
                }
                if (that._trigger('change', e, data) !== false) {
                    that._onAdd(e, data);
                }
            });
        },

        _onPaste: function (e) {
            var cbd = e.originalEvent.clipboardData,
                items = (cbd && cbd.items) || [],
                data = {files: []};
            $.each(items, function (index, item) {
                var file = item.getAsFile && item.getAsFile();
                if (file) {
                    data.files.push(file);
                }
            });
            if (this._trigger('paste', e, data) === false ||
                    this._onAdd(e, data) === false) {
                return false;
            }
        },

        _onDrop: function (e) {
            var that = this,
                dataTransfer = e.dataTransfer = e.originalEvent.dataTransfer,
                data = {};
            if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                e.preventDefault();
            }
            this._getDroppedFiles(dataTransfer).always(function (files) {
                data.files = files;
                if (that._trigger('drop', e, data) !== false) {
                    that._onAdd(e, data);
                }
            });
        },

        _onDragOver: function (e) {
            var dataTransfer = e.dataTransfer = e.originalEvent.dataTransfer;
            if (this._trigger('dragover', e) === false) {
                return false;
            }
            if (dataTransfer && $.inArray('Files', dataTransfer.types) !== -1) {
                dataTransfer.dropEffect = 'copy';
                e.preventDefault();
            }
        },

        _initEventHandlers: function () {
            if (this._isXHRUpload(this.options)) {
                this._on(this.options.dropZone, {
                    dragover: this._onDragOver,
                    drop: this._onDrop
                });
                this._on(this.options.pasteZone, {
                    paste: this._onPaste
                });
            }
            this._on(this.options.fileInput, {
                change: this._onChange
            });
        },

        _destroyEventHandlers: function () {
            this._off(this.options.dropZone, 'dragover drop');
            this._off(this.options.pasteZone, 'paste');
            this._off(this.options.fileInput, 'change');
        },

        _setOption: function (key, value) {
            var refresh = $.inArray(key, this._refreshOptionsList) !== -1;
            if (refresh) {
                this._destroyEventHandlers();
            }
            this._super(key, value);
            if (refresh) {
                this._initSpecialOptions();
                this._initEventHandlers();
            }
        },

        _initSpecialOptions: function () {
            var options = this.options;
            if (options.fileInput === undefined) {
                options.fileInput = this.element.is('input[type="file"]') ?
                        this.element : this.element.find('input[type="file"]');
            } else if (!(options.fileInput instanceof $)) {
                options.fileInput = $(options.fileInput);
            }
            if (!(options.dropZone instanceof $)) {
                options.dropZone = $(options.dropZone);
            }
            if (!(options.pasteZone instanceof $)) {
                options.pasteZone = $(options.pasteZone);
            }
        },

        _create: function () {
            var options = this.options;
            // Initialize options set via HTML5 data-attributes:
            $.extend(options, $(this.element[0].cloneNode(false)).data());
            this._initSpecialOptions();
            this._slots = [];
            this._sequence = this._getXHRPromise(true);
            this._sending = this._active = this._loaded = this._total = 0;
            this._initEventHandlers();
        },

        _destroy: function () {
            this._destroyEventHandlers();
        },

        // This method is exposed to the widget API and allows adding files
        // using the fileupload API. The data parameter accepts an object which
        // must have a files property and can contain additional options:
        // .fileupload('add', {files: filesList});
        add: function (data) {
            var that = this;
            if (!data || this.options.disabled) {
                return;
            }
            if (data.fileInput && !data.files) {
                this._getFileInputFiles(data.fileInput).always(function (files) {
                    data.files = files;
                    that._onAdd(null, data);
                });
            } else {
                data.files = $.makeArray(data.files);
                this._onAdd(null, data);
            }
        },

        // This method is exposed to the widget API and allows sending files
        // using the fileupload API. The data parameter accepts an object which
        // must have a files or fileInput property and can contain additional options:
        // .fileupload('send', {files: filesList});
        // The method returns a Promise object for the file upload call.
        send: function (data) {
            if (data && !this.options.disabled) {
                if (data.fileInput && !data.files) {
                    var that = this,
                        dfd = $.Deferred(),
                        promise = dfd.promise(),
                        jqXHR,
                        aborted;
                    promise.abort = function () {
                        aborted = true;
                        if (jqXHR) {
                            return jqXHR.abort();
                        }
                        dfd.reject(null, 'abort', 'abort');
                        return promise;
                    };
                    this._getFileInputFiles(data.fileInput).always(
                        function (files) {
                            if (aborted) {
                                return;
                            }
                            data.files = files;
                            jqXHR = that._onSend(null, data).then(
                                function (result, textStatus, jqXHR) {
                                    dfd.resolve(result, textStatus, jqXHR);
                                },
                                function (jqXHR, textStatus, errorThrown) {
                                    dfd.reject(jqXHR, textStatus, errorThrown);
                                }
                            );
                        }
                    );
                    return this._enhancePromise(promise);
                }
                data.files = $.makeArray(data.files);
                if (data.files.length) {
                    return this._onSend(null, data);
                }
            }
            return this._getXHRPromise(false, data && data.context);
        }

    });

}));




/* ===================================================
 * bootstrap-transition.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */



!function ($) {

  $(function () {

    "use strict"; // jshint ;_;


    /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
     * ======================================================= */

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd'
            ,  'msTransition'     : 'MSTransitionEnd'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-affix.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#affix
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */



!function ($) {

  "use strict"; // jshint ;_;


 /* AFFIX CLASS DEFINITION
  * ====================== */

  var Affix = function (element, options) {
    this.options = $.extend({}, $.fn.affix.defaults, options)
    this.$window = $(window)
      .on('scroll.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.affix.data-api',  $.proxy(function () { setTimeout($.proxy(this.checkPosition, this), 1) }, this))
    this.$element = $(element)
    this.checkPosition()
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
      , scrollTop = this.$window.scrollTop()
      , position = this.$element.offset()
      , offset = this.options.offset
      , offsetBottom = offset.bottom
      , offsetTop = offset.top
      , reset = 'affix affix-top affix-bottom'
      , affix

    if (typeof offset != 'object') offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function') offsetTop = offset.top()
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom()

    affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ?
      false    : offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ?
      'bottom' : offsetTop != null && scrollTop <= offsetTop ?
      'top'    : false

    if (this.affixed === affix) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? position.top - scrollTop : null

    this.$element.removeClass(reset).addClass('affix' + (affix ? '-' + affix : ''))
  }


 /* AFFIX PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.affix

  $.fn.affix = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('affix')
        , options = typeof option == 'object' && option
      if (!data) $this.data('affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.affix.Constructor = Affix

  $.fn.affix.defaults = {
    offset: 0
  }


 /* AFFIX NO CONFLICT
  * ================= */

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


 /* AFFIX DATA-API
  * ============== */

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
        , data = $spy.data()

      data.offset = data.offset || {}

      data.offsetBottom && (data.offset.bottom = data.offsetBottom)
      data.offsetTop && (data.offset.top = data.offsetTop)

      $spy.affix(data)
    })
  })


}(window.jQuery);
/* ==========================================================
 * bootstrap-alert.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#alerts
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */



!function ($) {

  "use strict"; // jshint ;_;


 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype.close = function (e) {
    var $this = $(this)
      , selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)

    e && e.preventDefault()

    $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

    $parent.trigger(e = $.Event('close'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      $parent
        .trigger('closed')
        .remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent.on($.support.transition.end, removeElement) :
      removeElement()
  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.alert

  $.fn.alert = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT NO CONFLICT
  * ================= */

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


 /* ALERT DATA-API
  * ============== */

  $(document).on('click.alert.data-api', dismiss, Alert.prototype.close)

}(window.jQuery);
/* ============================================================
 * bootstrap-button.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */



!function ($) {

  "use strict"; // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }

  Button.prototype.setState = function (state) {
    var d = 'disabled'
      , $el = this.$element
      , data = $el.data()
      , val = $el.is('input') ? 'val' : 'html'

    state = state + 'Text'
    data.resetText || $el.data('resetText', $el[val]())

    $el[val](data[state] || this.options[state])

    // push to event loop to allow forms to submit
    setTimeout(function () {
      state == 'loadingText' ?
        $el.addClass(d).attr(d, d) :
        $el.removeClass(d).removeAttr(d)
    }, 0)
  }

  Button.prototype.toggle = function () {
    var $parent = this.$element.closest('[data-toggle="buttons-radio"]')

    $parent && $parent
      .find('.active')
      .removeClass('active')

    this.$element.toggleClass('active')
  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  var old = $.fn.button

  $.fn.button = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON NO CONFLICT
  * ================== */

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


 /* BUTTON DATA-API
  * =============== */

  $(document).on('click.button.data-api', '[data-toggle^=button]', function (e) {
    var $btn = $(e.target)
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
    $btn.button('toggle')
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-carousel.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */



!function ($) {

  "use strict"; // jshint ;_;


 /* CAROUSEL CLASS DEFINITION
  * ========================= */

  var Carousel = function (element, options) {
    this.$element = $(element)
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options = options
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.prototype = {

    cycle: function (e) {
      if (!e) this.paused = false
      if (this.interval) clearInterval(this.interval);
      this.options.interval
        && !this.paused
        && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
      return this
    }

  , getActiveIndex: function () {
      this.$active = this.$element.find('.item.active')
      this.$items = this.$active.parent().children()
      return this.$items.index(this.$active)
    }

  , to: function (pos) {
      var activeIndex = this.getActiveIndex()
        , that = this

      if (pos > (this.$items.length - 1) || pos < 0) return

      if (this.sliding) {
        return this.$element.one('slid', function () {
          that.to(pos)
        })
      }

      if (activeIndex == pos) {
        return this.pause().cycle()
      }

      return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
    }

  , pause: function (e) {
      if (!e) this.paused = true
      if (this.$element.find('.next, .prev').length && $.support.transition.end) {
        this.$element.trigger($.support.transition.end)
        this.cycle(true)
      }
      clearInterval(this.interval)
      this.interval = null
      return this
    }

  , next: function () {
      if (this.sliding) return
      return this.slide('next')
    }

  , prev: function () {
      if (this.sliding) return
      return this.slide('prev')
    }

  , slide: function (type, next) {
      var $active = this.$element.find('.item.active')
        , $next = next || $active[type]()
        , isCycling = this.interval
        , direction = type == 'next' ? 'left' : 'right'
        , fallback  = type == 'next' ? 'first' : 'last'
        , that = this
        , e

      this.sliding = true

      isCycling && this.pause()

      $next = $next.length ? $next : this.$element.find('.item')[fallback]()

      e = $.Event('slide', {
        relatedTarget: $next[0]
      , direction: direction
      })

      if ($next.hasClass('active')) return

      if (this.$indicators.length) {
        this.$indicators.find('.active').removeClass('active')
        this.$element.one('slid', function () {
          var $nextIndicator = $(that.$indicators.children()[that.getActiveIndex()])
          $nextIndicator && $nextIndicator.addClass('active')
        })
      }

      if ($.support.transition && this.$element.hasClass('slide')) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $next.addClass(type)
        $next[0].offsetWidth // force reflow
        $active.addClass(direction)
        $next.addClass(direction)
        this.$element.one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
      } else {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $active.removeClass('active')
        $next.addClass('active')
        this.sliding = false
        this.$element.trigger('slid')
      }

      isCycling && this.cycle()

      return this
    }

  }


 /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.carousel

  $.fn.carousel = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('carousel')
        , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
        , action = typeof option == 'string' ? option : options.slide
      if (!data) $this.data('carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  $.fn.carousel.defaults = {
    interval: 5000
  , pause: 'hover'
  }

  $.fn.carousel.Constructor = Carousel


 /* CAROUSEL NO CONFLICT
  * ==================== */

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }

 /* CAROUSEL DATA-API
  * ================= */

  $(document).on('click.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var $this = $(this), href
      , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      , options = $.extend({}, $target.data(), $this.data())
      , slideIndex

    $target.carousel(options)

    if (slideIndex = $this.attr('data-slide-to')) {
      $target.data('carousel').pause().to(slideIndex).cycle()
    }

    e.preventDefault()
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-collapse.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */



!function ($) {

  "use strict"; // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning || this.$element.hasClass('in')) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      $.support.transition && this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning || !this.$element.hasClass('in')) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSE PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.collapse

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = $.extend({}, $.fn.collapse.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSE NO CONFLICT
  * ==================== */

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


 /* COLLAPSE DATA-API
  * ================= */

  $(document).on('click.collapse.data-api', '[data-toggle=collapse]', function (e) {
    var $this = $(this), href
      , target = $this.attr('data-target')
        || e.preventDefault()
        || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
      , option = $(target).data('collapse') ? 'toggle' : $this.data()
    $this[$(target).hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
    $(target).collapse(option)
  })

}(window.jQuery);
/* ============================================================
 * bootstrap-dropdown.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */



!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle=dropdown]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , isActive

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) {
        $parent.toggleClass('open')
      }

      $this.focus()

      return false
    }

  , keydown: function (e) {
      var $this
        , $items
        , $active
        , $parent
        , isActive
        , index

      if (!/(38|40|27)/.test(e.keyCode)) return

      $this = $(this)

      e.preventDefault()
      e.stopPropagation()

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      if (!isActive || (isActive && e.keyCode == 27)) {
        if (e.which == 27) $parent.find(toggle).focus()
        return $this.click()
      }

      $items = $('[role=menu] li:not(.divider):visible a', $parent)

      if (!$items.length) return

      index = $items.index($items.filter(':focus'))

      if (e.keyCode == 38 && index > 0) index--                                        // up
      if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
      if (!~index) index = 0

      $items
        .eq(index)
        .focus()
    }

  }

  function clearMenus() {
    $(toggle).each(function () {
      getParent($(this)).removeClass('open')
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = selector && $(selector)

    if (!$parent || !$parent.length) $parent = $this.parent()

    return $parent
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  var old = $.fn.dropdown

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


 /* DROPDOWN NO CONFLICT
  * ==================== */

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(document)
    .on('click.dropdown.data-api', clearMenus)
    .on('click.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.dropdown-menu', function (e) { e.stopPropagation() })
    .on('click.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
    .on('keydown.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)

}(window.jQuery);
/* =========================================================
 * bootstrap-modal.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */



!function ($) {

  "use strict"; // jshint ;_;


 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function (element, options) {
    this.options = options
    this.$element = $(element)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
    this.options.remote && this.$element.find('.modal-body').load(this.options.remote)
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        this.isShown = true

        this.escape()

        this.backdrop(function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element.show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element
            .addClass('in')
            .attr('aria-hidden', false)

          that.enforceFocus()

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.focus().trigger('shown') }) :
            that.$element.focus().trigger('shown')

        })
      }

    , hide: function (e) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.escape()

        $(document).off('focusin.modal')

        this.$element
          .removeClass('in')
          .attr('aria-hidden', true)

        $.support.transition && this.$element.hasClass('fade') ?
          this.hideWithTransition() :
          this.hideModal()
      }

    , enforceFocus: function () {
        var that = this
        $(document).on('focusin.modal', function (e) {
          if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
            that.$element.focus()
          }
        })
      }

    , escape: function () {
        var that = this
        if (this.isShown && this.options.keyboard) {
          this.$element.on('keyup.dismiss.modal', function ( e ) {
            e.which == 27 && that.hide()
          })
        } else if (!this.isShown) {
          this.$element.off('keyup.dismiss.modal')
        }
      }

    , hideWithTransition: function () {
        var that = this
          , timeout = setTimeout(function () {
              that.$element.off($.support.transition.end)
              that.hideModal()
            }, 500)

        this.$element.one($.support.transition.end, function () {
          clearTimeout(timeout)
          that.hideModal()
        })
      }

    , hideModal: function () {
        var that = this
        this.$element.hide()
        this.backdrop(function () {
          that.removeBackdrop()
          that.$element.trigger('hidden')
        })
      }

    , removeBackdrop: function () {
        this.$backdrop && this.$backdrop.remove()
        this.$backdrop = null
      }

    , backdrop: function (callback) {
        var that = this
          , animate = this.$element.hasClass('fade') ? 'fade' : ''

        if (this.isShown && this.options.backdrop) {
          var doAnimate = $.support.transition && animate

          this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
            .appendTo(document.body)

          this.$backdrop.click(
            this.options.backdrop == 'static' ?
              $.proxy(this.$element[0].focus, this.$element[0])
            : $.proxy(this.hide, this)
          )

          if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

          this.$backdrop.addClass('in')

          if (!callback) return

          doAnimate ?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (!this.isShown && this.$backdrop) {
          this.$backdrop.removeClass('in')

          $.support.transition && this.$element.hasClass('fade')?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (callback) {
          callback()
        }
      }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.modal

  $.fn.modal = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL NO CONFLICT
  * ================= */

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


 /* MODAL DATA-API
  * ============== */

  $(document).on('click.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this)
      , href = $this.attr('href')
      , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
      , option = $target.data('modal') ? 'toggle' : $.extend({ remote:!/#/.test(href) && href }, $target.data(), $this.data())

    e.preventDefault()

    $target
      .modal(option)
      .one('hide', function () {
        $this.focus()
      })
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-scrollspy.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================== */



!function ($) {

  "use strict"; // jshint ;_;


 /* SCROLLSPY CLASS DEFINITION
  * ========================== */

  function ScrollSpy(element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll-spy.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body')
    this.refresh()
    this.process()
  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        var self = this
          , $targets

        this.offsets = $([])
        this.targets = $([])

        $targets = this.$body
          .find(this.selector)
          .map(function () {
            var $el = $(this)
              , href = $el.data('target') || $el.attr('href')
              , $href = /^#\w/.test(href) && $(href)
            return ( $href
              && $href.length
              && [[ $href.position().top + (!$.isWindow(self.$scrollElement.get(0)) && self.$scrollElement.scrollTop()), href ]] ) || null
          })
          .sort(function (a, b) { return a[0] - b[0] })
          .each(function () {
            self.offsets.push(this[0])
            self.targets.push(this[1])
          })
      }

    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
          , maxScroll = scrollHeight - this.$scrollElement.height()
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        if (scrollTop >= maxScroll) {
          return activeTarget != (i = targets.last()[0])
            && this.activate ( i )
        }

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active
          , selector

        this.activeTarget = target

        $(this.selector)
          .parent('.active')
          .removeClass('active')

        selector = this.selector
          + '[data-target="' + target + '"],'
          + this.selector + '[href="' + target + '"]'

        active = $(selector)
          .parent('li')
          .addClass('active')

        if (active.parent('.dropdown-menu').length)  {
          active = active.closest('li.dropdown').addClass('active')
        }

        active.trigger('activate')
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  var old = $.fn.scrollspy

  $.fn.scrollspy = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY NO CONFLICT
  * ===================== */

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(window).on('load', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}(window.jQuery);
/* ========================================================
 * bootstrap-tab.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */



!function ($) {

  "use strict"; // jshint ;_;


 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
        , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target
        , e

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active:last a')[0]

      e = $.Event('show', {
        relatedTarget: previous
      })

      $this.trigger(e)

      if (e.isDefaultPrevented()) return

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  var old = $.fn.tab

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB NO CONFLICT
  * =============== */

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


 /* TAB DATA-API
  * ============ */

  $(document).on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

}(window.jQuery);
/* ===========================================================
 * bootstrap-tooltip.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */



!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut
        , triggers
        , trigger
        , i

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      triggers = this.options.trigger.split(' ')

      for (i = triggers.length; i--;) {
        trigger = triggers[i]
        if (trigger == 'click') {
          this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
        } else if (trigger != 'manual') {
          eventIn = trigger == 'hover' ? 'mouseenter' : 'focus'
          eventOut = trigger == 'hover' ? 'mouseleave' : 'blur'
          this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
          this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
        }
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, this.$element.data(), options)

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var defaults = $.fn[this.type].defaults
        , options = {}
        , self

      this._options && $.each(this._options, function (key, value) {
        if (defaults[key] != value) options[key] = value
      }, this)

      self = $(e.currentTarget)[this.type](options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp
        , e = $.Event('show')

      if (this.hasContent() && this.enabled) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        $tip
          .detach()
          .css({ top: 0, left: 0, display: 'block' })

        this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

        pos = this.getPosition()

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        this.applyPlacement(tp, placement)
        this.$element.trigger('shown')
      }
    }

  , applyPlacement: function(offset, placement){
      var $tip = this.tip()
        , width = $tip[0].offsetWidth
        , height = $tip[0].offsetHeight
        , actualWidth
        , actualHeight
        , delta
        , replace

      $tip
        .offset(offset)
        .addClass(placement)
        .addClass('in')

      actualWidth = $tip[0].offsetWidth
      actualHeight = $tip[0].offsetHeight

      if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight
        replace = true
      }

      if (placement == 'bottom' || placement == 'top') {
        delta = 0

        if (offset.left < 0){
          delta = offset.left * -2
          offset.left = 0
          $tip.offset(offset)
          actualWidth = $tip[0].offsetWidth
          actualHeight = $tip[0].offsetHeight
        }

        this.replaceArrow(delta - width + actualWidth, actualWidth, 'left')
      } else {
        this.replaceArrow(actualHeight - height, actualHeight, 'top')
      }

      if (replace) $tip.offset(offset)
    }

  , replaceArrow: function(delta, dimension, position){
      this
        .arrow()
        .css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()
        , e = $.Event('hide')

      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).detach()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.detach()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.detach()

      this.$element.trigger('hidden')

      return this
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function () {
      var el = this.$element[0]
      return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
        width: el.offsetWidth
      , height: el.offsetHeight
      }, this.$element.offset())
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , arrow: function(){
      return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function (e) {
      var self = e ? $(e.currentTarget)[this.type](this._options).data(this.type) : this
      self.tip().hasClass('in') ? self.hide() : self.show()
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  var old = $.fn.tooltip

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover focus'
  , title: ''
  , delay: 0
  , html: false
  , container: false
  }


 /* TOOLTIP NO CONFLICT
  * =================== */

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(window.jQuery);
/* ===========================================================
 * bootstrap-popover.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */



!function ($) {

  "use strict"; // jshint ;_;


 /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }


  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
      $tip.find('.popover-content')[this.options.html ? 'html' : 'text'](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)
        || $e.attr('data-content')

      return content
    }

  , tip: function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.popover

  $.fn.popover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , trigger: 'click'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


 /* POPOVER NO CONFLICT
  * =================== */

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(window.jQuery);
/* =============================================================
 * bootstrap-typeahead.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */



!function($){

  "use strict"; // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.source = this.options.source
    this.$menu = $(this.options.menu)
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function (item) {
      return item
    }

  , show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu
        .insertAfter(this.$element)
        .css({
          top: pos.top + pos.height
        , left: pos.left
        })
        .show()

      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var items

      this.query = this.$element.val()

      if (!this.query || this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this
      }

      items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

      return items ? this.process(items) : this
    }

  , process: function (items) {
      var that = this

      items = $.grep(items, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;')
        isSupported = typeof this.$element[eventName] === 'function'
      }
      return isSupported
    }

  , move: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
      this.move(e)
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return
      this.move(e)
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , focus: function (e) {
      this.focused = true
    }

  , blur: function (e) {
      this.focused = false
      if (!this.mousedover && this.shown) this.hide()
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
      this.$element.focus()
    }

  , mouseenter: function (e) {
      this.mousedover = true
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  , mouseleave: function (e) {
      this.mousedover = false
      if (!this.focused && this.shown) this.hide()
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.typeahead

  $.fn.typeahead = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  , minLength: 1
  }

  $.fn.typeahead.Constructor = Typeahead


 /* TYPEAHEAD NO CONFLICT
  * =================== */

  $.fn.typeahead.noConflict = function () {
    $.fn.typeahead = old
    return this
  }


 /* TYPEAHEAD DATA-API
  * ================== */

  $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
    var $this = $(this)
    if ($this.data('typeahead')) return
    $this.typeahead($this.data())
  })

}(window.jQuery);













/*!
 * Bootstrap Scroll Modal
 * Version: 1.1
 * Made for your convenience by @theericanderson.
 * A variaton of only small piece of the insanely awesome
 * Twitter Bootstrap (http://twitter.github.com/bootstrap).
 */

/* =========================================================
 * bootstrap-modal.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */



!function ($) {

  "use strict"; // jshint ;_;

 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function ( content, options ) {
    this.options = options
    this.$element = $(content)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        $('body').addClass('modal-open')

        this.isShown = true

        escape.call(this)
        backdrop.call(this, function () {

          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element
            .show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element.addClass('in')

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.trigger('shown') }) :
            that.$element.trigger('shown')

        })
      }

    , hide: function ( e ) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        $('body').removeClass('modal-open')

        escape.call(this)

        this.$element.removeClass('in')

        $.support.transition && this.$element.hasClass('fade') ?
          hideWithTransition.call(this) :
          hideModal.call(this)
      }

  }


 /* MODAL PRIVATE METHODS
  * ===================== */

  function hideWithTransition() {
    var that = this
      , timeout = setTimeout(function () {
          that.$element.off($.support.transition.end)
          hideModal.call(that)
        }, 500)

    this.$element.one($.support.transition.end, function () {
      clearTimeout(timeout)
      hideModal.call(that)
    })
  }

  function hideModal(that) {
    this.$element
      .hide()
      .trigger('hidden')

    backdrop.call(this)
  }

  function backdrop(callback) {
    var that = this
      , animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
      if (!that.$element.parent().length) {
          this.$backdrop.appendTo(document.body) //don't move modals dom position
      } else {
          this.$backdrop.insertBefore(this.$element)
      }
      
      if (this.options.dynamic) {
        this.$elementWrapper = $('<div class="modal-wrapper" />')
          .prependTo(this.$backdrop)
          .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this));
          this.$element.prependTo(this.$elementWrapper);
      } else {
        this.$element.prependTo(this.$backdrop)
        .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
      }

      $('body').css({ 'overflow' : 'hidden' })

      if (this.options.backdrop != 'static') {
        this.$backdrop.on('click', function(e){
          if (e.target == e.delegateTarget) {
            that.hide(e)
          }
        })
      }

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      doAnimate ?
        this.$backdrop.one($.support.transition.end, callback) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      $.support.transition && this.$element.hasClass('fade')?
        this.$backdrop.one($.support.transition.end, $.proxy(removeBackdrop, this)) :
        removeBackdrop.call(this)

    } else if (callback) {
      callback()
    }
  }

  function removeBackdrop() {
    this.$element.insertAfter(this.$backdrop)
    this.$backdrop.remove()
    this.$backdrop = null
    $('body').css({ 'overflow' : 'auto' })
  }

  function escape() {
    var that = this
    if (this.isShown && this.options.keyboard) {
      $(document).on('keyup.dismiss.modal', function ( e ) {
        e.which == 27 && that.hide()
      })
    } else if (!this.isShown) {
      $(document).off('keyup.dismiss.modal')
    }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  $.fn.modal = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL DATA-API
  * ============== */

  $(function () {
    $('body').on('click.modal.data-api', '[data-toggle="modal"]', function ( e ) {
      var $this = $(this), href
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        , option = $target.data('modal') ? 'toggle' : $.extend({}, $target.data(), $this.data())

      e.preventDefault()
      $target.modal(option)
    })
  })

}(window.jQuery);
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/


var Mustache;

(function (exports) {
  if (typeof module !== "undefined") {
    module.exports = exports; // CommonJS
  } else if (typeof define === "function") {
    define(exports); // AMD
  } else {
    Mustache = exports; // <script>
  }
}((function () {
  var exports = {};

  exports.name = "mustache.js";
  exports.version = "0.5.2";
  exports.tags = ["{{", "}}"];

  exports.parse = parse;
  exports.clearCache = clearCache;
  exports.compile = compile;
  exports.compilePartial = compilePartial;
  exports.render = render;

  exports.Scanner = Scanner;
  exports.Context = Context;
  exports.Renderer = Renderer;

  // This is here for backwards compatibility with 0.4.x.
  exports.to_html = function (template, view, partials, send) {
    var result = render(template, view, partials);

    if (typeof send === "function") {
      send(result);
    } else {
      return result;
    }
  };

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var nonSpaceRe = /\S/;
  var eqRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  function testRe(re, string) {
    return RegExp.prototype.test.call(re, string);
  }

  function isWhitespace(string) {
    return !testRe(nonSpaceRe, string);
  }

  var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };

  // OSWASP Guidelines: escape all non alphanumeric characters in ASCII space.
  var jsCharsRe = /[\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\xFF\u2028\u2029]/gm;

  function quote(text) {
    var escaped = text.replace(jsCharsRe, function (c) {
      return "\\u" + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    });

    return '"' + escaped + '"';
  }

  function escapeRe(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  // Export these utility functions.
  exports.isWhitespace = isWhitespace;
  exports.isArray = isArray;
  exports.quote = quote;
  exports.escapeRe = escapeRe;
  exports.escapeHtml = escapeHtml;

  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      this.tail = this.tail.substring(match[0].length);
      this.pos += match[0].length;
      return match[0];
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var match, pos = this.tail.search(re);

    switch (pos) {
    case -1:
      match = this.tail;
      this.pos += this.tail.length;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, pos);
      this.tail = this.tail.substring(pos);
      this.pos += pos;
    }

    return match;
  };

  function Context(view, parent) {
    this.view = view;
    this.parent = parent;
    this.clearCache();
  }

  Context.make = function (view) {
    return (view instanceof Context) ? view : new Context(view);
  };

  Context.prototype.clearCache = function () {
    this._cache = {};
  };

  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  Context.prototype.lookup = function (name) {
    var value = this._cache[name];

    if (!value) {
      if (name === ".") {
        value = this.view;
      } else {
        var context = this;

        while (context) {
          if (name.indexOf(".") > 0) {
            var names = name.split("."), i = 0;

            value = context.view;

            while (value && i < names.length) {
              value = value[names[i++]];
            }
          } else {
            value = context.view[name];
          }

          if (value != null) {
            break;
          }

          context = context.parent;
        }
      }

      this._cache[name] = value;
    }

    if (typeof value === "function") {
      value = value.call(this.view);
    }

    return value;
  };

  function Renderer() {
    this.clearCache();
  }

  Renderer.prototype.clearCache = function () {
    this._cache = {};
    this._partialCache = {};
  };

  Renderer.prototype.compile = function (tokens, tags) {
    if (typeof tokens === "string") {
      tokens = parse(tokens, tags);
    }

    var fn = compileTokens(tokens),
        self = this;

    return function (view) {
      return fn(Context.make(view), self);
    };
  };

  Renderer.prototype.compilePartial = function (name, tokens, tags) {
    this._partialCache[name] = this.compile(tokens, tags);
    return this._partialCache[name];
  };

  Renderer.prototype.render = function (template, view) {
    var fn = this._cache[template];

    if (!fn) {
      fn = this.compile(template);
      this._cache[template] = fn;
    }

    return fn(view);
  };

  Renderer.prototype._section = function (name, context, callback) {
    var value = context.lookup(name);

    switch (typeof value) {
    case "object":
      if (isArray(value)) {
        var buffer = "";

        for (var i = 0, len = value.length; i < len; ++i) {
          buffer += callback(context.push(value[i]), this);
        }

        return buffer;
      }

      return value ? callback(context.push(value), this) : "";
    case "function":
      // TODO: The text should be passed to the callback plain, not rendered.
      var sectionText = callback(context, this),
          self = this;

      var scopedRender = function (template) {
        return self.render(template, context);
      };

      return value.call(context.view, sectionText, scopedRender) || "";
    default:
      if (value) {
        return callback(context, this);
      }
    }

    return "";
  };

  Renderer.prototype._inverted = function (name, context, callback) {
    var value = context.lookup(name);

    // From the spec: inverted sections may render text once based on the
    // inverse value of the key. That is, they will be rendered if the key
    // doesn't exist, is false, or is an empty list.
    if (value == null || value === false || (isArray(value) && value.length === 0)) {
      return callback(context, this);
    }

    return "";
  };

  Renderer.prototype._partial = function (name, context) {
    var fn = this._partialCache[name];

    if (fn) {
      return fn(context);
    }

    return "";
  };

  Renderer.prototype._name = function (name, context, escape) {
    var value = context.lookup(name);

    if (typeof value === "function") {
      value = value.call(context.view);
    }

    var string = (value == null) ? "" : String(value);

    if (escape) {
      return escapeHtml(string);
    }

    return string;
  };

  /**
   * Low-level function that compiles the given `tokens` into a
   * function that accepts two arguments: a Context and a
   * Renderer. Returns the body of the function as a string if
   * `returnBody` is true.
   */
  function compileTokens(tokens, returnBody) {
    var body = ['""'];
    var token, method, escape;

    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token.type) {
      case "#":
      case "^":
        method = (token.type === "#") ? "_section" : "_inverted";
        body.push("r." + method + "(" + quote(token.value) + ", c, function (c, r) {\n" +
          "  " + compileTokens(token.tokens, true) + "\n" +
          "})");
        break;
      case "{":
      case "&":
      case "name":
        escape = token.type === "name" ? "true" : "false";
        body.push("r._name(" + quote(token.value) + ", c, " + escape + ")");
        break;
      case ">":
        body.push("r._partial(" + quote(token.value) + ", c)");
        break;
      case "text":
        body.push(quote(token.value));
        break;
      }
    }

    // Convert to a string body.
    body = "return " + body.join(" + ") + ";";

    // Good for debugging.
    // console.log(body);

    if (returnBody) {
      return body;
    }

    // For great evil!
    return new Function("c, r", body);
  }

  function escapeTags(tags) {
    if (tags.length === 2) {
      return [
        new RegExp(escapeRe(tags[0]) + "\\s*"),
        new RegExp("\\s*" + escapeRe(tags[1]))
      ];
    }

    throw new Error("Invalid tags: " + tags.join(" "));
  }

  /**
   * Forms the given linear array of `tokens` into a nested tree structure
   * where tokens that represent a section have a "tokens" array property
   * that contains all tokens that are in that section.
   */
  function nestTokens(tokens) {
    var tree = [];
    var collector = tree;
    var sections = [];
    var token, section;

    for (var i = 0; i < tokens.length; ++i) {
      token = tokens[i];

      switch (token.type) {
      case "#":
      case "^":
        token.tokens = [];
        sections.push(token);
        collector.push(token);
        collector = token.tokens;
        break;
      case "/":
        if (sections.length === 0) {
          throw new Error("Unopened section: " + token.value);
        }

        section = sections.pop();

        if (section.value !== token.value) {
          throw new Error("Unclosed section: " + section.value);
        }

        if (sections.length > 0) {
          collector = sections[sections.length - 1].tokens;
        } else {
          collector = tree;
        }
        break;
      default:
        collector.push(token);
      }
    }

    // Make sure there were no open sections when we're done.
    section = sections.pop();

    if (section) {
      throw new Error("Unclosed section: " + section.value);
    }

    return tree;
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var lastToken;

    for (var i = 0; i < tokens.length; ++i) {
      var token = tokens[i];

      if (lastToken && lastToken.type === "text" && token.type === "text") {
        lastToken.value += token.value;
        tokens.splice(i--, 1); // Remove this token from the array.
      } else {
        lastToken = token;
      }
    }
  }

  /**
   * Breaks up the given `template` string into a tree of token objects. If
   * `tags` is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
   * course, the default is to use mustaches (i.e. Mustache.tags).
   */
  function parse(template, tags) {
    tags = tags || exports.tags;

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var tokens = [],      // Buffer to hold the tokens
        spaces = [],      // Indices of whitespace tokens on the current line
        hasTag = false,   // Is there a {{tag}} on the current line?
        nonSpace = false; // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    var stripSpace = function () {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          tokens.splice(spaces.pop(), 1);
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    };

    var type, value, chr;

    while (!scanner.eos()) {
      value = scanner.scanUntil(tagRes[0]);

      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push({type: "text", value: chr});

          if (chr === "\n") {
            stripSpace(); // Check for whitespace on the current line.
          }
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) {
        break;
      }

      hasTag = true;
      type = scanner.scan(tagRe) || "name";

      // Skip any whitespace between tag and value.
      scanner.scan(whiteRe);

      // Extract the tag value.
      if (type === "=") {
        value = scanner.scanUntil(eqRe);
        scanner.scan(eqRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === "{") {
        var closeRe = new RegExp("\\s*" + escapeRe("}" + tags[1]));
        value = scanner.scanUntil(closeRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) {
        throw new Error("Unclosed tag at " + scanner.pos);
      }

      tokens.push({type: type, value: value});

      if (type === "name" || type === "{" || type === "&") {
        nonSpace = true;
      }

      // Set the tags for the next time around.
      if (type === "=") {
        tags = value.split(spaceRe);
        tagRes = escapeTags(tags);
      }
    }

    squashTokens(tokens);

    return nestTokens(tokens);
  }

  // The high-level clearCache, compile, compilePartial, and render functions
  // use this default renderer.
  var _renderer = new Renderer();

  /**
   * Clears all cached templates and partials.
   */
  function clearCache() {
    _renderer.clearCache();
  }

  /**
   * High-level API for compiling the given `tokens` down to a reusable
   * function. If `tokens` is a string it will be parsed using the given `tags`
   * before it is compiled.
   */
  function compile(tokens, tags) {
    return _renderer.compile(tokens, tags);
  }

  /**
   * High-level API for compiling the `tokens` for the partial with the given
   * `name` down to a reusable function. If `tokens` is a string it will be
   * parsed using the given `tags` before it is compiled.
   */
  function compilePartial(name, tokens, tags) {
    return _renderer.compilePartial(name, tokens, tags);
  }

  /**
   * High-level API for rendering the `template` using the given `view`. The
   * optional `partials` object may be given here for convenience, but note that
   * it will cause all partials to be re-compiled, thus hurting performance. Of
   * course, this only matters if you're going to render the same template more
   * than once. If so, it is best to call `compilePartial` before calling this
   * function and to leave the `partials` argument blank.
   */
  function render(template, view, partials) {
    if (partials) {
      for (var name in partials) {
        compilePartial(name, partials[name]);
      }
    }

    return _renderer.render(template, view);
  }

  return exports;
}())));
var _dbg = _dbg || {};

(function(self) {
  _.extend(self,{
    init: function() {

      stubFunctions();

      if( $('body').hasClass('debug') ) {
        useRealFunctions();
      }
    },

    fns: {
      log: function(msg) {
        console.log(msg);
      }
    }
  });

  function stubFunctions() {
    for(var key in self.fns) {
      self[key] = $.noop;
    }
  }

  function useRealFunctions() {
    for(var key in self.fns) {
      self[key] = self.fns[key];
    }
  }
})(_dbg);
/*jshint eqnull:true */
/*!
 * jQuery Cookie Plugin v1.2
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */

(function ($, document, undefined) {

	var pluses = /\+/g;

	function raw(s) {
		return s;
	}

	function decoded(s) {
		return decodeURIComponent(s.replace(pluses, ' '));
	}

	$.cookie = function (key, value, options) {

		// key and at least value given, set cookie...
		if (value !== undefined && !/Object/.test(Object.prototype.toString.call(value))) {
			options = $.extend({}, $.cookie.defaults, options);

			if (value === null) {
				options.expires = -1;
			}

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setDate(t.getDate() + days);
			}

			value = String(value);

			return (document.cookie = [
				encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// key and possibly options given, get cookie...
		options = value || $.cookie.defaults || {};
		var decode = options.raw ? raw : decoded;
		var cookies = document.cookie.split('; ');
		for (var i = 0, parts; (parts = cookies[i] && cookies[i].split('=')); i++) {
			if (decode(parts.shift()) === key) {
				return decode(parts.join('='));
			}
		}

		return null;
	};

	$.cookie.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key, options) !== null) {
			$.cookie(key, null, options);
			return true;
		}
		return false;
	};

})(jQuery, document);
// enquire.js v1.5.4 - Awesome Media Queries in JavaScript
// Copyright (c) 2013 Nick Williams - http://wicky.nillia.ms/enquire.js
// License: MIT (http://www.opensource.org/licenses/mit-license.php)


window.enquire = (function(matchMedia) {

    "use strict";

    /**
     * Helper function for iterating over a collection
     *
     * @param collection
     * @param fn
     */
    function each(collection, fn) {
        var i      = 0,
            length = collection.length,
            cont;

        for(i; i < length; i++) {
            cont = fn(collection[i], i);
            if(cont === false) {
                break; //allow early exit
            }
        }
    }

    /**
     * Helper function for determining whether target object is an array
     *
     * @param target the object under test
     * @return {Boolean} true if array, false otherwise
     */
    function isArray(target) {
        return Object.prototype.toString.apply(target) === "[object Array]";
    }

    /**
     * Helper function for determining whether target object is a function
     *
     * @param target the object under test
     * @return {Boolean} true if function, false otherwise
     */
    function isFunction(target) {
        return typeof target === "function";
    }

    /**
     * Delegate to handle a media query being matched and unmatched.
     *
     * @param {object} options
     * @param {function} options.match callback for when the media query is matched
     * @param {function} [options.unmatch] callback for when the media query is unmatched
     * @param {function} [options.setup] one-time callback triggered the first time a query is matched
     * @param {boolean} [options.deferSetup=false] should the setup callback be run immediately, rather than first time query is matched?
     * @constructor
     */
    function QueryHandler(options) {
        this.initialised = false;
        this.options = options;

        if(!options.deferSetup) {
			this.setup();
		}
    }
    QueryHandler.prototype = {

        /**
         * coordinates setup of the handler
         *
         * @function
         */
        setup : function(e) {
            if(this.options.setup){
                this.options.setup(e);
            }
            this.initialised = true;
        },

        /**
         * coordinates setup and triggering of the handler
         *
         * @function
         * @param [e] the browser event which triggered a match
         */
        on : function(e) {
            if(!this.initialised){
                this.setup(e);
            }
            this.options.match(e);
        },

        /**
         * coordinates the unmatch event for the handler
         *
         * @function
         * @param [e] the browser event which triggered a match
         */
        off : function(e) {
            if(this.options.unmatch){
                this.options.unmatch(e);
            }
        },

        /**
         * called when a handler is to be destroyed.
         * delegates to the destroy or unmatch callbacks, depending on availability.
         *
         * @function
         */
        destroy : function() {
            if(this.options.destroy) {
                this.options.destroy();
            }
            else {
                this.off();
            }
        },

        /**
         * determines equality by reference.
         * if object is supplied compare options, if function, compare match callback
         *
         * @function
         * @param {object || function} [target] the target for comparison
         */
        equals : function(target) {
            return this.options === target || this.options.match === target;
        }

    };
/**
 * Represents a single media query, manages it's state and registered handlers for this query
 *
 * @constructor
 * @param {string} query the media query string
 * @param {boolean} [isUnconditional=false] whether the media query should run regardless of whether the conditions are met. Primarily for helping older browsers deal with mobile-first design
 */
function MediaQuery(query, isUnconditional) {
    this.query = query;
    this.isUnconditional = isUnconditional;
    
    this.handlers = [];
    this.matched = false;
}
MediaQuery.prototype = {

    /**
     * tests whether this media query is currently matching
     *
     * @function
     * @returns {boolean} true if match, false otherwise
     */
    matchMedia : function() {
        return matchMedia(this.query).matches;
    },

    /**
     * add a handler for this query, triggering if already active
     *
     * @function
     * @param {object} handler
     * @param {function} handler.match callback for when query is activated
     * @param {function} [handler.unmatch] callback for when query is deactivated
     * @param {function} [handler.setup] callback for immediate execution when a query handler is registered
     * @param {boolean} [handler.deferSetup=false] should the setup callback be deferred until the first time the handler is matched?
     * @param {boolean} [turnOn=false] should the handler be turned on if the query is matching?
     */
    addHandler : function(handler, turnOn) {
        var qh = new QueryHandler(handler);
        this.handlers.push(qh);

        turnOn && this.matched && qh.on();
    },

    /**
     * removes the given handler from the collection, and calls it's destroy methods
     *
     * @function
     * @param {object || function} handler the handler to remove
     */
    removeHandler : function(handler) {
        var handlers = this.handlers;
        each(handlers, function(h, i) {
            if(h.equals(handler)) {
                h.destroy();
                return !handlers.splice(i,1); //remove from array and exit each early
            }
        });
    },

    /*
     * assesses the query, turning on all handlers if it matches, turning them off if it doesn't match
     *
     * @function
     */
    assess : function(e) {
        if(this.matchMedia() || this.isUnconditional) {
            this.match(e);
        }
        else {
            this.unmatch(e);
        }
    },

    /**
     * activates a query.
     * callbacks are fired only if the query is currently unmatched
     *
     * @function
     * @param {Event} [e] browser event if triggered as the result of a browser event
     */
    match : function(e) {
        if(this.matched) {
			return; //already on
		}

        each(this.handlers, function(handler) {
            handler.on(e);
        });
        this.matched = true;
    },

    /**
     * deactivates a query.
     * callbacks are fired only if the query is currently matched
     *
     * @function
     * @param {Event} [e] browser event if triggered as the result of a browser event
     */
    unmatch : function(e) {
        if(!this.matched) {
			return; //already off
        }

        each(this.handlers, function(handler){
			handler.off(e);
        });
        this.matched = false;
    }
};
    /**
     * Allows for reigstration of query handlers.
     * Manages the  query handler's state and is responsible for wiring up browser events
     *
     * @constructor
     */
    function MediaQueryDispatch () {
        if(!matchMedia) {
            throw new Error('matchMedia is required');
        }

        var capabilityTest = new MediaQuery('only all');
        this.queries = {};
        this.listening = false;
        this.browserIsIncapable = !capabilityTest.matchMedia();
    }

    MediaQueryDispatch.prototype = {

        /**
         * Registers a handler for the given media query
         *
         * @function
         * @param {string} q the media query
         * @param {object || Array || Function} options either a single query handler object, a function, or an array of query handlers
         * @param {function} options.match fired when query matched
         * @param {function} [options.unmatch] fired when a query is no longer matched
         * @param {function} [options.setup] fired when handler first triggered
         * @param {boolean} [options.deferSetup=false] whether setup should be run immediately or deferred until query is first matched
         * @param {boolean} [shouldDegrade=false] whether this particular media query should always run on incapable browsers
         */
        register : function(q, options, shouldDegrade) {
            var queries         = this.queries,
                isUnconditional = shouldDegrade && this.browserIsIncapable,
                listening       = this.listening;

            if(!queries.hasOwnProperty(q)) {
                queries[q] = new MediaQuery(q, isUnconditional);

                this.listening && queries[q].assess();
            }

            //normalise to object
            if(isFunction(options)) {
                options = {
                    match : options
                };
            }
            //normalise to array
            if(!isArray(options)) {
                options = [options];
            }
            each(options, function(handler) {
                queries[q].addHandler(handler, listening);
            });

            return this;
        },

        /**
         * unregisters a query and all it's handlers, or a specific handler for a query
         *
         * @function
         * @param {string} q the media query to target
         * @param {object || function} [handler] specific handler to unregister
         */
        unregister : function(q, handler) {
            var queries = this.queries;

            if(!queries.hasOwnProperty(q)) {
                return this;
            }
            
            if(!handler) {
                each(this.queries[q].handlers, function(handler) {
                    handler.destroy();
                });
                delete queries[q];
            }
            else {
                queries[q].removeHandler(handler);
            }

            return this;
        },

        /**
         * Tests all media queries and calls relevant methods depending whether
         * transitioning from unmatched->matched or matched->unmatched
         *
         * @function
         * @param {Event} [e] if fired as a result of a browser event,
         * an event can be supplied to propagate to the various media query handlers
         */
        fire : function(e) {
            var queries = this.queries,
                mediaQuery;

            for(mediaQuery in queries) {
                if(queries.hasOwnProperty(mediaQuery)) {
                    queries[mediaQuery].assess(e);
				}
            }
            return this;
        },

        /**
         * sets up listeners for resize and orientation events
         *
         * @function
         * @param {int} [timeout=500] the time (in milliseconds) after which the queries should be handled
         */
        listen : function(timeout) {
            var self = this;

            timeout = timeout || 500;

            // any browser that doesn't implement this
            // will not have media query support
            if(!window.addEventListener) {
                return;
            }

            //prevent multiple event handlers
            if(this.listening) {
				return this;
			}

            //creates closure for separate timed events
            function wireFire(event) {
                var timer;

                window.addEventListener(event, function(e) {
                    timer && clearTimeout(timer);

                    timer = setTimeout(function() {
                        self.fire(e);
                    }, timeout);
                });
            }

            //handle initial load then listen
            self.fire();
            wireFire('resize');
            wireFire('orientationChange');

            this.listening = true;
            return this;
        }
    };


    return new MediaQueryDispatch();

}(window.matchMedia));
/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-touch-shiv-cssclasses-teststyles-prefixes-forms_fileinput-load
 */

;window.Modernizr=function(a,b,c){function w(a){j.cssText=a}function x(a,b){return w(m.join(a+";")+(b||""))}function y(a,b){return typeof a===b}function z(a,b){return!!~(""+a).indexOf(b)}function A(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:y(f,"function")?f.bind(d||b):f}return!1}var d="2.6.2",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n={},o={},p={},q=[],r=q.slice,s,t=function(a,c,d,e){var f,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),l.appendChild(j);return f=["&#173;",'<style id="s',h,'">',a,"</style>"].join(""),l.id=h,(m?l:n).innerHTML+=f,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=g.style.overflow,g.style.overflow="hidden",g.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),g.style.overflow=k),!!i},u={}.hasOwnProperty,v;!y(u,"undefined")&&!y(u.call,"undefined")?v=function(a,b){return u.call(a,b)}:v=function(a,b){return b in a&&y(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=r.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(r.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(r.call(arguments)))};return e}),n.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:t(["@media (",m.join("touch-enabled),("),h,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c};for(var B in n)v(n,B)&&(s=B.toLowerCase(),e[s]=n[B](),q.push((e[s]?"":"no-")+s));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)v(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" "+(b?"":"no-")+a),e[a]=b}return e},w(""),i=k=null,function(a,b){function k(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function l(){var a=r.elements;return typeof a=="string"?a.split(" "):a}function m(a){var b=i[a[g]];return b||(b={},h++,a[g]=h,i[h]=b),b}function n(a,c,f){c||(c=b);if(j)return c.createElement(a);f||(f=m(c));var g;return f.cache[a]?g=f.cache[a].cloneNode():e.test(a)?g=(f.cache[a]=f.createElem(a)).cloneNode():g=f.createElem(a),g.canHaveChildren&&!d.test(a)?f.frag.appendChild(g):g}function o(a,c){a||(a=b);if(j)return a.createDocumentFragment();c=c||m(a);var d=c.frag.cloneNode(),e=0,f=l(),g=f.length;for(;e<g;e++)d.createElement(f[e]);return d}function p(a,b){b.cache||(b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag()),a.createElement=function(c){return r.shivMethods?n(c,a,b):b.createElem(c)},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+l().join().replace(/\w+/g,function(a){return b.createElem(a),b.frag.createElement(a),'c("'+a+'")'})+");return n}")(r,b.frag)}function q(a){a||(a=b);var c=m(a);return r.shivCSS&&!f&&!c.hasCSS&&(c.hasCSS=!!k(a,"article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")),j||p(a,c),a}var c=a.html5||{},d=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,e=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,f,g="_html5shiv",h=0,i={},j;(function(){try{var a=b.createElement("a");a.innerHTML="<xyz></xyz>",f="hidden"in a,j=a.childNodes.length==1||function(){b.createElement("a");var a=b.createDocumentFragment();return typeof a.cloneNode=="undefined"||typeof a.createDocumentFragment=="undefined"||typeof a.createElement=="undefined"}()}catch(c){f=!0,j=!0}})();var r={elements:c.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:c.shivCSS!==!1,supportsUnknownElements:j,shivMethods:c.shivMethods!==!1,type:"default",shivDocument:q,createElement:n,createDocumentFragment:o};a.html5=r,q(b)}(this,b),e._version=d,e._prefixes=m,e.testStyles=t,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+q.join(" "):""),e}(this,this.document),function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))},Modernizr.addTest("fileinput",function(){var a=document.createElement("input");return a.type="file",!a.disabled});
// moment.js
// version : 2.1.0
// author : Tim Wood
// license : MIT
// momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.1.0",
        round = Math.round, i,
        // internal storage for language config files
        languages = {},

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(\d*)?\.?(\d+)\:(\d+)\:(\d+)\.?(\d{3})?/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO seperator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        // preliminary iso regex
        // 0000-00-00 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000
        isoRegex = /^\s*\d{4}-\d\d-\d\d((T| )(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.S', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            w : 'week',
            M : 'month',
            y : 'year'
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return this.weekYear();
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return this.isoWeekYear();
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return ~~(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(~~(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(a / 60), 2) + ":" + leftZeroFill(~~a % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(10 * a / 6), 4);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            }
        };

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var years = duration.years || duration.year || duration.y || 0,
            months = duration.months || duration.month || duration.M || 0,
            weeks = duration.weeks || duration.week || duration.w || 0,
            days = duration.days || duration.day || duration.d || 0,
            hours = duration.hours || duration.hour || duration.h || 0,
            minutes = duration.minutes || duration.minute || duration.m || 0,
            seconds = duration.seconds || duration.second || duration.s || 0,
            milliseconds = duration.milliseconds || duration.millisecond || duration.ms || 0;

        // store reference to input for deterministic cloning
        this._input = duration;

        // representation for dateAddRemove
        this._milliseconds = milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = months +
            years * 12;

        this._data = {};

        this._bubble();
    }


    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
        return a;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months,
            minutes,
            hours,
            currentDate;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        // store the minutes and hours so we can restore them
        if (days || months) {
            minutes = mom.minute();
            hours = mom.hour();
        }
        if (days) {
            mom.date(mom.date() + days * isAdding);
        }
        if (months) {
            mom.month(mom.month() + months * isAdding);
        }
        if (milliseconds && !ignoreUpdateOffset) {
            moment.updateOffset(mom);
        }
        // restore the minutes and hours after possibly changing dst
        if (days || months) {
            mom.minute(minutes);
            mom.hour(hours);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (~~array1[i] !== ~~array2[i]) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        return units ? unitAliases[units] || units.toLowerCase().replace(/(.)s$/, '$1') : units;
    }


    /************************************
        Languages
    ************************************/


    Language.prototype = {
        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            return ((input + '').toLowerCase()[0] === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },
        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    };

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        if (!key) {
            return moment.fn._lang;
        }
        if (!languages[key] && hasModule) {
            try {
                require('./lang/' + key);
            } catch (e) {
                // call with no params to set to default
                return moment.fn._lang;
            }
        }
        return languages[key];
    }


    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[.*\]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return m.lang().longDateFormat(input) || input;
        }

        while (i-- && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        }

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
            return parseTokenFourDigits;
        case 'YYYYY':
            return parseTokenSixDigits;
        case 'S':
        case 'SS':
        case 'SSS':
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return getLangDefinition(config._l)._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
            return parseTokenOneOrTwoDigits;
        default :
            return new RegExp(token.replace('\\', ''));
        }
    }

    function timezoneMinutesFromString(string) {
        var tzchunk = (parseTokenTimezone.exec(string) || [])[0],
            parts = (tzchunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + ~~parts[2];

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            datePartArray[1] = (input == null) ? 0 : ~~input - 1;
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[1] = a;
            } else {
                config._isValid = false;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DDDD
        case 'DD' : // fall through to DDDD
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                datePartArray[2] = ~~input;
            }
            break;
        // YEAR
        case 'YY' :
            datePartArray[0] = ~~input + (~~input > 68 ? 1900 : 2000);
            break;
        case 'YYYY' :
        case 'YYYYY' :
            datePartArray[0] = ~~input;
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = getLangDefinition(config._l).isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[3] = ~~input;
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[4] = ~~input;
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[5] = ~~input;
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
            datePartArray[6] = ~~ (('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        }

        // if the input is null, the date is not valid
        if (input == null) {
            config._isValid = false;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromArray(config) {
        var i, date, input = [];

        if (config._d) {
            return;
        }

        for (i = 0; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[3] += ~~((config._tzm || 0) / 60);
        input[4] += ~~((config._tzm || 0) % 60);

        date = new Date(0);

        if (config._useUTC) {
            date.setUTCFullYear(input[0], input[1], input[2]);
            date.setUTCHours(input[3], input[4], input[5], input[6]);
        } else {
            date.setFullYear(input[0], input[1], input[2]);
            date.setHours(input[3], input[4], input[5], input[6]);
        }

        config._d = date;
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var tokens = config._f.match(formattingTokens),
            string = config._i,
            i, parsedInput;

        config._a = [];

        for (i = 0; i < tokens.length; i++) {
            parsedInput = (getParseRegexForToken(tokens[i], config).exec(string) || [])[0];
            if (parsedInput) {
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            }
            // don't parse if its not a known token
            if (formatTokenFunctions[tokens[i]]) {
                addTimeToArrayFromToken(tokens[i], parsedInput, config);
            }
        }

        // add remaining unparsed input to the string
        if (string) {
            config._il = string;
        }

        // handle am pm
        if (config._isPm && config._a[3] < 12) {
            config._a[3] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[3] === 12) {
            config._a[3] = 0;
        }
        // return
        dateFromArray(config);
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            tempMoment,
            bestMoment,

            scoreToBeat = 99,
            i,
            currentScore;

        for (i = 0; i < config._f.length; i++) {
            tempConfig = extend({}, config);
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);
            tempMoment = new Moment(tempConfig);

            currentScore = compareArrays(tempConfig._a, tempMoment.toArray());

            // if there is any input that was not parsed
            // add a penalty for that format
            if (tempMoment._il) {
                currentScore += tempMoment._il.length;
            }

            if (currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempMoment;
            }
        }

        extend(config, bestMoment);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            // match[2] should be "T" or undefined
            config._f = 'YYYY-MM-DD' + (match[2] || " ");
            for (i = 0; i < 4; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (parseTokenTimezone.exec(string)) {
                config._f += " Z";
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromArray(config);
        } else {
            config._d = input instanceof Date ? new Date(+input) : new Date(input);
        }
    }


    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }


    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || input === '') {
            return null;
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = extend({}, input);
            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang) {
        return makeMoment({
            _i : input,
            _f : format,
            _l : lang,
            _isUTC : false
        });
    };

    // creating with utc
    moment.utc = function (input, format, lang) {
        return makeMoment({
            _useUTC : true,
            _isUTC : true,
            _l : lang,
            _i : input,
            _f : format
        });
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var isDuration = moment.isDuration(input),
            isNumber = (typeof input === 'number'),
            duration = (isDuration ? input._input : (isNumber ? {} : input)),
            matched = aspNetTimeSpanJsonRegex.exec(input),
            sign,
            ret;

        if (isNumber) {
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (matched) {
            sign = (matched[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: ~~matched[2] * sign,
                h: ~~matched[3] * sign,
                m: ~~matched[4] * sign,
                s: ~~matched[5] * sign,
                ms: ~~matched[6] * sign
            };
        }

        ret = new Duration(duration);

        if (isDuration && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(key, values);
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment;
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };


    /************************************
        Moment Prototype
    ************************************/


    moment.fn = Moment.prototype = {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            return formatMoment(moment(this).utc(), 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            if (this._isValid == null) {
                if (this._a) {
                    this._isValid = !compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray());
                } else {
                    this._isValid = !isNaN(this._d.getTime());
                }
            }
            return !!this._isValid;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = this._isUTC ? moment(input).zone(this._offset || 0) : moment(input).local(),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            var diff = this.diff(moment().startOf('day'), 'days', true),
                format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().weekdaysParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : function (input) {
            var utc = this._isUTC ? 'UTC' : '',
                dayOfMonth,
                daysInMonth;

            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().monthsParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }

                dayOfMonth = this.date();
                this.date(1);
                this._d['set' + utc + 'Month'](input);
                this.date(Math.min(dayOfMonth, this.daysInMonth()));

                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + 'Month']();
            }
        },

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            }

            return this;
        },

        endOf: function (units) {
            return this.startOf(units).add(units, 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) === +moment(input).startOf(units);
        },

        min: function (other) {
            other = moment.apply(null, arguments);
            return other < this ? this : other;
        },

        max: function (other) {
            other = moment.apply(null, arguments);
            return other > this ? this : other;
        },

        zone : function (input) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, true);
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        daysInMonth : function () {
            return moment.utc([this.year(), this.month() + 1, 0]).date();
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this._d.getDay() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    };

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    moment.duration.fn = Duration.prototype = {
        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              ~~(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang
    };

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });


    /************************************
        Exposing Moment
    ************************************/


    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    }
    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        this['moment'] = moment;
    }
    /*global define:false */
    if (typeof define === "function" && define.amd) {
        define("moment", [], function () {
            return moment;
        });
    }
}).call(this);
/*
 * Default jQuery AJAX parameters
 */

$.ajaxPrefilter(function(options, originalOptions, request) {
  request.fail(function(jqXHR, textStatus, errorThrown) {
    if (jqXHR.status == 403 || jqXHR.status == 401) {
      utils.redirectToSignIn();
    }
  });

  if (!originalOptions.hasOwnProperty('dataType')) {
    return 'json';
  }
});
Backbone.Marionette.Renderer.render = function(path, data){
  if (!path) {
    return '';
  }
  var template = HoganTemplates[path];
  return template.render(data);
};

var _e = _.extend( {}, Backbone.Events );
window.StyleGallery = {
  Modules: {},
  Controllers: {},
  Routers: {},
  Models: {},
  Collections: {},
  Views: {
    Wizards: {}
  },
  Analytics: {
    Builders: {}
  },
  Initializers: {}
};
window.StyleGalleryBase = {
  Routers: {},
  Models: {},
  Collections: {},
  Views: {}
};
(function(){
StyleGallery.Paths = {
  apiRoot: '/style-gallery/api/v1',

  gallery:                      pathWithRoot(function(filter) {
    return filter ? filter : '';
  }),
  outfitProductTagger:          pathWithRoot(function(id) {
    return 'outfit/' + id + '/assign_products';
  }),
  outfitPreview:                pathWithRoot(function(id) {
    return 'outfit/' + id + '/preview';
  }),
  galleryUpload:                pathWithRoot(function() {
    return 'upload_photo';
  }),
  galleryInstagramUpload:       pathWithRoot(function() {
    return 'instagram/upload_photo';
  }),
  galleryOutfit:                pathWithRoot(function(id){
    return 'outfits/' + id;
  }),
  submitOutfit:                 function(id)            { return '/outfit/' + id + '/submit'; },

  // outside routes:
  productCacheApi:              function()              { return '/style-gallery/products.json'; },
  cachedProduct:                function(id)            { return '/style-gallery/products/' + id + '.json'; },

  productsByCatalogSlug:        function(slug)          { return '/style-gallery/products/find_by_catalog_slug/' + slug; },
  productsBySearchTerm:         function(keyword)       { return '/style-gallery/products/search/' + keyword; },
  productsByOrderHistory:       function(accessToken)   { return '/style-gallery/products/order_history/' + accessToken; },

  outfitAddProduct:             function(id)            { return '/style-gallery/outfits/' + id + '/items.json'; }, // POST
  outfitRemoveProduct:          function(id, productId) { return '/style-gallery/outfits/' + id + '/items/' + productId + '.json'; }, // DELETE
  outfitUpdatePicturedProduct:  function(id, productId) { return '/style-gallery/outfits/' + id + '/items/' + productId + '/pictured.json'; }, // PUT
  outfitAssignedProductsApi:    function(id)            { return '/style-gallery/outfits/' + id + '/items.json'; },

  loveAnOutfit:                 function(id)            { return '/style-gallery/api/v1/outfits/' + id + '/loves'; }, //POST
  unLoveAnOutfit:               function(id)            { return '/style-gallery/api/v1/outfits/' + id + '/loves'; }, //DELETE

  outfits:                      function()              { return '/style-gallery/api/v1/outfits.json'; },
  outfit:                       function(id)            { return '/style-gallery/api/v1/outfits/' + id + '.json'; },
  account:                      function()              { return '/style-gallery/account.json'; },
  userCloset:                   function()              { return '/style-gallery/api/v1/closet.json'; },

  signIn:                       function()              { return '/style-gallery/sign_in'; },
  signOut:                      function()              { return '/style-gallery/sign_out'; },
  join:                         function()              { return '/style-gallery/join'; },
  resetCurrentUser:             function()              { return '/style-gallery/reset_current_user'; },

  cart:                         function()              { return '/storefront/cart/view'; },
  checkout:                     function()              { return '/storefront/checkout/login?verify=' + !!StyleGallery.currentUser.id; },

  outfitsByContributor:         function(accountId)          { return '/style-gallery/contributor/' + accountId + '/outfits.json'; },
  taggedOutfits:                function(slug)          { return '/style-gallery/api/v1/tags/' + slug + '/outfits.json'; },
  contributorOutfits:           function(contributorId) { return '/style-gallery/api/v1/contributors/' +  contributorId + '/outfits.json'; },

  authenticate: {
    instagram:                  function()              { return '/style-gallery/instagram/authorize' }
  },

  instagram: {
    user: {
      recent:                   function(uid)           { return 'https://api.instagram.com/v1/users/' + uid + '/media/recent/' }
    }
  },

  api: {
    outfits:                    function()              { return router.paths.apiRoot + '/outfits.json'; },
    profiles: {
      profile:                  function(account_id)    { return window.initialBackboneData.identityApiUrl + '/v1/external/profiles/find_by_account_id/' + account_id + '.json'; },
      follow:                   function()              { return window.initialBackboneData.identityApiUrl + '/v1/external/following_relationships'; }
    }
  }
};
function pathWithRoot(urlBuilder) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var includeRoot = _.isBoolean(_.last(args)) && _.last(args);
    var root = includeRoot ? router.rootURL : '/';
    return root + urlBuilder.apply(this, arguments);
  };
}
})();
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};
Namespace('utils');


utils.extend({
  startBackboneHistory: function() {
    if(!Backbone.history.started) {
      window.router.rootURL = '/style-gallery/';
      Backbone.history.start({pushState:true, root: window.router.rootURL});
      Backbone.history.started = true;
    }
  },

  insertCSRFToken: function(selector) {
    $(selector).append('<input type="hidden" name="authenticity_token" value="' + $('meta[name="csrf-token"]').attr('content') + '" />');
  },

  redirectWhenSignedOut: function() {
    if (!window.StyleGallery || !window.StyleGallery.currentUser) {
      this.redirectToSignIn();
      return true;
    }
    return false;
  },

  redirectToSignIn: function() {
    this.redirect(window.router.paths.signIn());
  },

  isPath: function(url) {
    return /^\/.*/i.exec(url);
  },

  redirect: function (url, options) {
    if (this.isPath(url)) {
      window.location.pathname = url;
    } else {
      window.location.href = url;
    }
  },

  // let REFERER be your destination
  returnableRedirect: function(url) {
    if (this.isPath(url)) {
      history.pushState(null, null, url);
    }
    this.redirect(url);
  },

  onAdminPath: function() {
    return $.inArray('admin', window.location.pathname.split( '/' )) >= 0;
  },

  addScopeToGalleryPath: function(path) {

    if (this.onAdminPath()) {
     return path;
    }

    if (initialBackboneData.resourceIdentifier) {
      return path = '/' + StyleGallery.rootCollectionUrl;
    }

    // If we're going back to the gallery, include the scope param in the onClosePath
    var selectedScope = window.StyleGallery.scopeView && window.StyleGallery.scopeView.selectedScope;
    if (selectedScope) {
      path = '/' + selectedScope;
      if (selectedScope === 'loved') {
        path += '/' + window.StyleGallery.scopeView.filterView.selectedFilter;
      }
      return path;
    }

    return path;
  },

  injectSharedHeader: function() {
    var type = utils.device.headerType();
    var headerTemplate = $('#'+type+'-header').html();
    $('.container-fluid-inner').before( headerTemplate );
    if (type == 'phone') {
      var oldHeaderTemplate = $('#phone-header-old').html();
      var menuTemplate = $('#'+type+'-menu').html();
      $('.container-fluid-inner').before( oldHeaderTemplate );
      $('.container-fluid').before( menuTemplate );
    }
  },

  ensureMobileModalHeader: function(container) {
    var container = container || $('.modal');
    var headerSelector = $('#mc-phone-header').css('display') != 'none' ?
      '#mc-phone-header' : '#mc-phone-header-old';
    if (utils.device.phone() && !(container.find(headerSelector).length)) {
      container.prepend($(headerSelector).clone());
    }
  },

  /*
   * Like setInterval, but will not congest the JS execution queue
   * Terminates when fn returns truthy.
   */
  setNiceInterval: function(fn, delay) {
    var wrapper = function() {
      if (fn()) { return; }
      setTimeout(wrapper, delay);
    };
    setTimeout(wrapper, delay);
  },

  pageViewDidHappen: function (context) {
    _e.trigger('router:pageView', context);
  }
});
window.utils = window.utils || {};

utils.Device = function() {
  var that = this;

  this.setupCallbacks = function() {
    this.registerPhoneCallback();
    this.registerTabletCallback();
    this.registerTabletDesktopOverlap();
    this.registerDesktopCallback();
  };

  this.registerPhoneCallback = function() {
    var query = '(max-width: 640px)';
    enquire.register(query, { match: that.handlePhone } ).listen();
  };
  this.registerTabletCallback = function() {
    var query = '(min-width: 641px) and (max-width: 959px)';
    enquire.register(query, { match: that.handleTablet } ).listen();
  };
  this.registerTabletDesktopOverlap = function() {
    var query = '(min-width: 960px) and (max-width: 1280px)';
    enquire.register(query, { match: that.handleTabletDesktopOverlap } ).listen();
  };
  this.registerDesktopCallback = function() {
    var query = '(min-width: 1281px)';
    enquire.register(query, { match: that.handleDesktop } ).listen();
  };

  this.handlePhone = function() {
    that.type = 'phone';
  };
  this.handleTablet = function() {
    that.type = 'tablet';
  };

  // There is a large resolution overlap between desktop and some tablets - we check for touch capability to differentiate.
  this.handleTabletDesktopOverlap = function() {
    if (Modernizr.touch) {
      that.handleTablet();
    } else {
      that.handleDesktop();
    }
  };
  this.handleDesktop = function() {
    that.type = 'desktop';
  };

  // convenience methods
  this.phone = function() {
    return that.type === 'phone';
  };

  /* We're showing desktop header to tablet but still want to track tablet traffic */
  this.headerType = function() {
    // Tablet isn't supported yet by mc-shared-assets or us
    return this.phone() ? 'phone' : 'desktop'
  };

  // defaults to desktop
  this.type = 'desktop';
};

utils.device = new utils.Device();
utils.device.setupCallbacks();
StyleGallery.Initializers.outfitUploadWizard = function() {
  var wizardSteps = [
    new StyleGallery.Views.GalleryUploadView(),
    new StyleGallery.Views.OutfitProductTaggerView({model: new StyleGallery.Models.Outfit()}),
    new StyleGallery.Views.OutfitProductSubmitterView({model: new StyleGallery.Models.Outfit()})
  ];
  window.currentWizard = new StyleGallery.Views.Wizards.OutfitUploadWizard(wizardSteps);
};
StyleGallery.Initializers.scrollToTop = function(){
  // take the user to the top of the page when they click on the
  // scroll to top button
  $('.scroll-to-top').on('click', function(e) {
    e.preventDefault();
    $('html, body').animate({
      scrollTop: 0
    }, 500);
  });

  // Have "back to top" icon fixed to the right of the gallery, not the right of the window
  var fixbackToTopButtonToGallery = function() {
    var $gallery = $('#gallery'),
        $scrollButton = $('.scroll-to-top'),
        buffer = 15,
        offset = $gallery.offset() || {},
        galleryRightEdge = offset.left + $gallery.width();
 
    $scrollButton.css({left: galleryRightEdge + buffer});
  }
  fixbackToTopButtonToGallery();
  $(window).resize( fixbackToTopButtonToGallery );
};
StyleGallery.Initializers.sharedHeader = function() {
  utils.injectSharedHeader();

  // Bootstrap CurrentUser
  if(window.initialBackboneData['currentUser']) {
    window.StyleGallery.currentUser = new StyleGallery.Models.Account( window.initialBackboneData['currentUser'] );
    var personalization = {
        currentAccountId: window.StyleGallery.currentUser.get('id'),
        host: window.initialBackboneData['personalizationHost']
    };
    mc_shared_assets.trigger('fetchAndSetPersonalization', personalization);
  } else {
    mc_shared_assets.trigger('setPersonalization', {});
  }

  // Set Current Menu Item
  mc_shared_assets.trigger('setActiveMenu', 'style-gallery');
};
StyleGallery.Initializers.styleGalleryApp = function(){
  StyleGallery.Initializers.outfitUploadWizard();
  StyleGallery.Initializers.sharedHeader();
  utils.scrollBottomListener();
  StyleGallery.Initializers.scrollToTop();
};
mc_shared_assets = {
  scope: function(scopeStr, fn) {

    var pieces = scopeStr.split('.') || [scopeStr];
    var node = window;
    var len = pieces.length;

    for (var i = 0; i < len; i++) {
      var piece = pieces[i];
      if (typeof(node[piece]) === 'undefined') {
        node = node[piece] = {};
      }
      else {
        node = node[piece];
      }
    }

    if (fn) {
      fn.call(node, node);
    }

    return node;
  },

  callbacks: {},

  on: function(event, callback) {
    if (!mc_shared_assets.callbacks[event]) mc_shared_assets.callbacks[event] = [];
    mc_shared_assets.callbacks[event].push(callback);
  },

  trigger: function(event /*, optional data */) {
    var params = Array.prototype.slice.call(arguments);
    params.shift();
    if (mc_shared_assets.callbacks[event]) {
      for (var i = 0; i < mc_shared_assets.callbacks[event].length; i++) {
        mc_shared_assets.callbacks[event][i].apply({}, params);
      }

    }
  },

  testMode: function(newValue) {
    if (typeof $ == 'undefined' || typeof $.cookie == 'undefined') return false;
    if (typeof newValue !== 'undefined') {
      $.cookie('mc_shared_assets.testMode', newValue);
    }
    return $.cookie('mc_shared_assets.testMode');
  },

  isTouchDevice: function() {
    return "ontouchstart" in window;
  },


  loadWebFont:function () {
    // Called by each component that requires the font; only execute once.
    // JS is necessary to match the protocol and prevent rendering errors.
    if (!mc_shared_assets.loadWebFont.done) {
      WebFontConfig = {
        google:{ families:[ 'Lato:400,700:latin' ] }
      };
      var wf = document.createElement('script');
      wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
      wf.type = 'text/javascript';
      wf.async = 'true';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(wf, s);
      mc_shared_assets.loadWebFont.done = true;
    }
  }
};
/*
Public API for analytics code.

There are just a few concepts here:

* There are _services_ that are registered and are responsible to report the events
  that happen within the application.

* There is trackEvent to track any sort of events that happen on a host application.
  These broadcast to all the registered
  services, which report in the appropriate way.

The analytics supports the concept of a "context", which is passed to all the
services so that they can generate the correct pixel. This context is a simple
object that the caller can push any values into, although it is encouraged that
these be "generic" analytic reporting type values. In other words, refrain from
placing "omniture_eVar18" into this hash, as that is not its purpose.

@see context.js
@see dom_binding.js
 */


mc_shared_assets.scope('mc_shared_assets.analytics.api', function (self) {

  var listeners = [], context = {};



  /*
   Merge more variables into the context (overriding existing).
   */
  self.pushContext = function (c) {
    if (arguments.length == 2) {
      context[arguments[0]] = arguments[1];
    } else {
      for (var k in c) {
        if (c.hasOwnProperty(k)) {
          context[k] = c[k];
        }
      }
    }
  };

  /*
   Add a new service/tracking pixel that listens to events.

   A service should support one or more of:
   .trackEvent
   */
  self.addService = function (service) {
    listeners.push(service);
  };


  self.trackPageView = function (optionalContext) {
    console.log('trackPageView: deprecated. Use trackEvent("pageView")');
    self.trackEvent('pageView', optionalContext);
  };

  self.trackEvent = function (event, optionalContext) {
    var eventContext = $.extend({event:event}, context);
    if (optionalContext) {
      if (arguments.length == 3) {
        eventContext[arguments[1]] = arguments[2];
      } else {
        $.extend(eventContext, optionalContext);
      }
    }
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i].trackEvent) {
        listeners[i].trackEvent.apply(eventContext, [event, eventContext]);
      }
    }
  };

  self.getContext = function() {
    return context;
  }

  mc_shared_assets.on('trackPageView', self.trackPageView);
  mc_shared_assets.on('trackEvent', self.trackEvent);
  mc_shared_assets.on('pushContext', self.pushContext);

});
/*
 Simple JS hash object, but some of the common/expect key/values are:

 * ab_test_bucket_summary:  monetate generated a/b cookie summary per our convention
 * total_orders:            total number of orders the user has placed, derived from a cookie
 * mc_id_cookie:            the value of the mc_id_cookie

 GA specific:
 *

 Omniture specific:
 * product_finding_method:  eVar1
 * page_type:               a description of the page type, pushed into omniture eVar2
 * utm_source:
 * utm_medium:
 * utm_campaign:

 */

mc_shared_assets.scope('mc_shared_assets.analytics.context', function (self) {

  /*
   This method attempts to replicate the variables used by E-Comm.
   */
  self.calcECommValues = function () {

    var context = {};

    self.defaults(context);

    // Cookie based context
    context.ab_test_bucket_summary = getABCookiesSummary();
    context.total_orders = $.cookie('total_orders') || "0";
    context.mc_id_cookie = $.cookie('mc_id'); // TODO rename?
    return context;
  };

  self.defaults = function (context) {
    context.page_href = document.location.href;
    context.page_search = document.location.search;
    self.extractParams(context);
  };

  self.extractParams = function (context) {
    var s, parts, p, i;
    context.url_params = {};
    s = context.page_search;
    if (s) {
      if (s[0] == '?') s = s.substring(1);
      parts = s.split('&');
      for (i = 0; i < parts.length; i++) {
        p = parts[i].split('=');
        context.url_params[p[0]] = decodeURIComponent(p[1]);
      }
    }
  };

  function getABCookiesSummary() {
    var monetateCookies = [];
    var value = undefined;
    var cookieStr = undefined;

    $.each([1, 2, 3, 4, 5], function () {
      var cookieValue = $.cookie('MonetateCookie' + this);
      value = (cookieValue == null) ? '-' : cookieValue;
      cookieStr = this + ':' + value;
      monetateCookies.push(cookieStr);
    });
    return monetateCookies.join(';');
  }


});


/*
 Basic instrumentation so you can say a "click" event fires an event.

 To have an "auto-wired" click event:
 * add "data-analytics-click-event"
 * (optional) add "data-analytics-context"
 */

mc_shared_assets.scope('mc_shared_assets.analytics.dom_binding', function (self) {

  // Instrument a given DOM node to track analytics events.
  // See #bindAll
  self.handleClickOn = function (element) {
    var context = {},
      contextStr,
      $el = $(element),
      event = $el.attr('data-analytics-click-event');

    if (event) {
      $el.parents('[data-analytics-context]').add($el).each(function () {
        contextStr = $(this).attr('data-analytics-context');
        try {
          if (contextStr) eval('$.extend(context, {' + contextStr + '})');
        } catch (e) {
          console.log("mc_shared_assets.analytics.dom_binding ignoring malformed context string: " + contextStr);
        }
      });

      $el.click(function () {
        mc_shared_assets.trigger('trackEvent', event, context);
      }).attr('data-analytics-click-event', null).attr('data-analytics-context', null);
    }
  };

  // Find all the current nodes in the DOM to be bound with analytics events and instrument them.
  // This method is idempotent, and can be called each time new DOM is loaded.
  self.bindAll = function () {
    $('[data-analytics-click-event]').each(function () {
      mc_shared_assets.analytics.dom_binding.handleClickOn(this);
    });
  };

  if (typeof $ !== 'undefined') {
    $(function () {
      self.bindAll();
    });
  }

});


/* Google Analytics reporting service */


var _gaq = _gaq || [];

mc_shared_assets.scope('mc_shared_assets.analytics.services.ga', function (self) {

  var eventBuilders = [];

  self.log = {
    gaq:[],
    last_call:{},
    custom_vars:{} // flattened version of all custom variables set
  };

  self.reset = function() {
    eventBuilders = [];
  }

  self.addBuilder = function (fn) {
    eventBuilders.push(fn);
  };

  self.pushEventBuilder = function (fn) {
    console.log('pushEventBuilder deprecated in favor of addBuilder');
    self.addBuilder(fn);
  };

  var trackPageView = function (context) {
    push('_setAccount', context.ga_account_key);

    // LEGACY BEHAVIOR, DO NOT REMOVE
    // Prior to 2/14/2012 we manually set the domain to ".modcloth.com"
    // By mistake, in release 12.006, we allowed the default behavior
    // to run, and we lost historical campaign numbers. This code puts
    // those legacy users into the same bucket as before. Otherwise,
    // we allow google defaults to run.
    if (/^125428693/.exec(getCookie('__utmz'))) {
      push('_setDomainName', '.modcloth.com');
    }

    var siteExperience = 'Desktop';
    if (context.device_type == 'phone') {
      siteExperience = 'Mobile'
    } else if (context.device_type == 'tablet') {
      siteExperience = 'Tablet';
    }
    push('_setCustomVar', 1, 'New vs Return Customer', context.total_orders, 2);
    push('_setCustomVar', 2, 'Site Experience', siteExperience, 3);
    push('_setCustomVar', 3, 'AB Test Bucket', context.ab_test_bucket_summary);
    push('_setCampaignCookieTimeout', 3888000000); // 45 days

    if (context.url) {
      push('_trackPageview', context.url);
    } else {
      push('_trackPageview');
    }
  };


  self.trackEvent = function (event, context) {
    if (event == 'pageView') {
      trackPageView(context);
    } else {
      var data, i;
      for (i = 0; i < eventBuilders.length; i++) {
        data = eventBuilders[i].apply(context, [event, context]);
        if (data == false) return;
        if (data) {
          trackUserEvent(data);
          return;
        }
      }
      console.log("No GA eventBuilders handled event " + event);
    }
  };

  function getCookie(key) {
    if (typeof $.cookie == 'undefined') return '';
    $.cookie(key);
  }


  // Track a user event.
  // Pass:
  // * array of data: category, action, label, value (optional)
  // * parameters in the same order
  // * JS object
  function trackUserEvent(data) {
    if ($.isPlainObject(data)) {
      data = [data.category, data.action, data.label, data.value];
    } else if (!$.isArray(data)) {
      data = Array.prototype.slice.call(arguments, 0)
    }
    data[2] = (data[2] && ("" + data[2])) || undefined; // must be a string or undefined
    data[3] = data[3] || 1;
    data.unshift('_trackEvent');
    push(data);
  }

  // Push data into _gaq. Use this interceptor so that we can record data for automated tests.
  function push(data) {
    if (!$.isArray(data)) {
      data = Array.prototype.slice.call(arguments)
    }
    _gaq.push(data);

    // Record the data so tests can analyze
    self.log.gaq.push(data);
    var values = data.slice(1);
    self.log.last_call[data[0]] = values;
    if (data[0] == '_setCustomVar') {
      self.log.custom_vars[values[1]] = values[2]
    }

    // Used for integration tests to track events through page refreshes.
    if (mc_shared_assets.testMode()) {
      $.cookie('ga.log', JSON.stringify(self.log));
    }
  }

  // on page load may want to restore cookies
  if (mc_shared_assets.testMode() && $.cookie('ga.log')) {
    self.log = JSON.parse($.cookie('ga.log'))
  }

});
/* Omniture reporting service
 *
 * Variable	Value Represents	Appears in tags
 linkName	Custom Links Report	Common to all custom link tags
 events	Custom Event Reports	Common to all tags
 campaign	Eternal Campaign Tracking Codes	Common to all tags
 page name	Pages Report	Common to all tags
 page type	Page Type	Common to all tags
 products	Products Reports	Common to tags about product interaction

 eVar1	Product Finding Methods	Common to all tags
 prop1	Product Finding Methods	Common to all tags
 prop2	Page Type	Common to all tags
 prop6	Campaign Pathing Reports	Common to all tags
 eVar12	New vs. Repeat Visitors	Common to all tags
 prop12	New vs. Repeat Visitor	Common to all tags
 eVar13	Time Parting	Common to all tags
 prop13	Time Parting	Common to all tags
 eVar26	Number of Visits	Common to all tags
 prop26	Number of Visits	Common to all tags
 eVar27	Order Count Reports	Common to all tags
 prop27	Order Count	Common to all tags
 eVar31	Custom Links	Common to all custom link tags
 prop31	Custom Links	Common to all custom link tags
 eVar35	Visitor ID	Common to all tags
 prop35	Visitor ID	Common to all tags
 eVar36	Site Experience	Common to all tags
 prop36	Site Experience	Common to all tags
 eVar37	Test Cookies	Common to all tags
 prop37	Test Cookies	Common to all tags
 eVar38	Custom Link Location	Common to all custom link tags
 prop38	Custom Link Location	Common to all custom link tags
 eVar39	Account ID	Common to all tags
 prop39	Account ID Reports	Common to all tags
 eVar40	Logged in Status	Common to all tags
 prop40	Logged in Status	Common to all tags
 eVar41	Style Gallery Interaction
 *
 * */

mc_shared_assets.scope('mc_shared_assets.analytics.services.omniture', function (self) {

  var builders = [];
  var max_eVar_prop_length = 41; // whitelist eVar1 -> eVar41 and prop1 -> prop41
  var keysLogged = [
    'linkName',
    'events',
    'campaign',
    'products',
    'pageName',
    'pageType',
    'linkName',
    'linkType'
  ];

  for (var i = 1; i <= max_eVar_prop_length; i++) {
    keysLogged.push('prop' + i);
    keysLogged.push('eVar' + i);
  }

  self.addBuilder = function (fn) {
    builders.push(fn);
  };

  self.pushParamDecorator = function (fn) {
    console.log('pushParamDecorator deprecated in favor of addBuilder');
    self.addBuilder(fn);
  };

  self.trackEvent = function (event, context) {
    context.event = event;

    var params = buildParamsFromContext(context);

    if (params) {
      self.insertTrackingPixel(params, event);
    }
  };

  self.insertTrackingPixel = function (params, event) {
    if (event == 'pageView') {
      if (typeof(window.omn) != 'undefined' && typeof(window.omn.t) == 'function') {
        resetOmniture();
        setData(params);
        window.omn.t();
      } else {
        console.log('Omniture not included properly.', params);
      }
    } else {
      if (typeof(window.omn.tl) == 'function') {
        setData(params);

        // Whitelist of variables to send to Omniture
        // When you change the whitelist also need change the jasmine spec and run test
        window.omn.linkTrackVars = "events,products,linkName,linkType,pageType";
        for (var i=1; i <= max_eVar_prop_length; i++) {
          window.omn.linkTrackVars += ",eVar"+ i + ",prop" + i;
        }
        window.omn.linkTrackEvents = window.omn.events;
        window.omn.tl(true, "o", params["linkName"]);
      }
    }

    log(params);
  };


  self.calcCampaignParams = function (vars, context) {
    var parms = context.url_params;
    if (!parms) return;

    if (parms.utm_campaign) {
      vars.campaign = [parms.utm_source, parms.utm_medium, parms.utm_campaign].join(':');
    }

    // These override utm_* variables
    var omcids = [];
    for (var p in parms) {
      if (p.match && p.match(/omcid/i)) omcids.push(parms[p])
    }
    if (omcids.length) {
      vars.campaign = omcids.sort().join(':');
    }
  };

  var pageViewContext = {};

  function buildParamsFromContext(context) {
    context = $.extend({}, pageViewContext, context);

    var i,
      vars = mapIndexesToPropsAndEVars(buildDefaults(context)),
      cont = true;

    self.calcCampaignParams(vars, context);

    vars['pageType'] = context.page_type;
    if (context.breadcrumb && $.isArray(context.breadcrumb)) {
      var trail = context.breadcrumb.join('>');
      vars['pageName'] = vars['prop6'] = trail;
      if (vars.campaign) {
        vars['prop6'] = vars.campaign + ':' + trail;
      }
    } else {
      delete context.breadcrumb;
    }

    for (i = 0; i < builders.length; i++) {
      cont = builders[i].call(context, vars, context);
      if (cont === false) return false;
    }

    if (context.event === 'pageView') {
      pageViewContext = context.breadcrumb ? {breadcrumb: context.breadcrumb} : {};
    } else {
      if (vars.linkName) {
        if (!vars.eVar31) vars.eVar31 = vars.linkName;
        if (!vars.prop31) vars.prop31 = vars.linkName;
      }
      if (vars['pageName']) {
        if (!vars.eVar38) vars.eVar38 = vars['pageName'];
        if (!vars.prop38) vars.prop38 = vars['pageName'];
      }
    }

    return vars;


    function buildDefaults(context) {
      return {
        // Used to establish new vs returning customers:
        1:context.product_finding_method || 'browse',
        2:context.page_type || '?',
        12:omn.getNewRepeat(30, 's_getNewRepeat'),
        13:omn.getTimeParting('h', '-8') + ">" + omn.getTimeParting('d', '-8') + ">" + omn.getTimeParting('w', '-8'), // Set hour // Set day // Set weekday
        19:omn.getPercentPageViewed(),
        26:omn.getVisitNum(),
        27:context.total_orders,
        35:context.mc_id_cookie,
        36:context.device_type == 'phone' ? 'mobile' : context.device_type,
        37:context.ab_test_bucket_summary,
        39:context.account_id,
        40:context.account_id ? 'logged-in' : 'logged-out'
      };
    }


    /**
     * Given an object with numeric keys, returns an "omniture friendly" object
     * with prop and eVar values, based on the input keys.
     * @param o object with numeric keys
     * @return {Object} with omniture keys
     */
    function mapIndexesToPropsAndEVars(o) {
      var out = {};
      for (var k in o) {
        if (o.hasOwnProperty(k)) {
          out['prop' + k] = o[k];
          out['eVar' + k] = o[k];
        }
      }
      return out;
    }

  }

  function log(params) {
    self.lastPixel = {};
    for (var i = 0; i < keysLogged.length; i++) {
      var key = keysLogged[i];
      self.lastPixel[key] = params[key];
    }
  }

  /**
   * Set omniture's variables.
   * @param eVarsAndProps
   */
  function setData(eVarsAndProps) {

    for (var x in eVarsAndProps) {
      if (!(typeof(window.omn[x]) == "function") && x != 'template') {
        window.omn[x] = eVarsAndProps[x];
      }
    }
  }

  function resetOmniture() {
    for (var i = 1; i <= max_eVar_prop_length; i++) {
      delete window.omn["eVar" + i];
      delete window.omn["prop" + i];
    }
    delete window.omn.events;
  }

});
/* SiteCatalyst code version: H.25.4.
Copyright 1996-2013 Adobe, Inc. All Rights Reserved
More info available at http://www.omniture.com */

/* Specify the Report Suite ID(s) to track here */

var s_account='modclothdevelopment';
if(document.URL.indexOf('www.modcloth.com')>-1)
	s_account='modclothproduction';
var omn=s_gi(s_account);

/************************** CONFIG SECTION **************************/
/* You may add or alter any code config here. */
omn.charSet="ISO-8859-1";

/* Conversion Config */
omn.currencyCode="USD";

/* Link Tracking Config */
omn.trackDownloadLinks=false;
omn.trackExternalLinks=false;
omn.trackInlineStats=false;
omn.linkDownloadFileTypes="exe,zip,wav,mp3,mov,mpg,avi,wmv,doc,pdf,xls";
omn.linkInternalFilters="javascript:,modcloth.com";
omn.linkLeaveQueryString=false;
omn.linkTrackVars="None";
omn.linkTrackEvents="None";

/* WARNING: Changing any of the below variables will cause drastic
changes to how your visitor data is collected.  Changes should only be
made when instructed to do so by your account manager.*/
omn.visitorNamespace="modcloth";
omn.trackingServer='metric.modcloth.com';
omn.trackingServerSecure='metrics.modcloth.com';

// timeparting config variables
var date = new Date();
omn.dstStart="3/11/2012"; // update to the correct Daylight Savings Time start date for the current year.
omn.dstEnd="11/4/2012"; // update to the correct Daylight Savings Time end date for the current year.
omn.currentYear= date.getFullYear(); // update to the current year (can be done programmatically).


/************************** PLUGIN CONFIG  **************************/
omn.usePlugins=true;

function s_doPlugins(s)
{
    //Plugin Config (withing the s_doPlugins()):

    omn.eVar12=omn.getNewRepeat(30,'s_getNewRepeat');
    omn.prop12=omn.getNewRepeat(30,'s_getNewRepeat');

    omn.eVar13=omn.getTimeParting('h','-8')+">"+omn.getTimeParting('d','-8')+">"+omn.getTimeParting('w','-8'); // Set hour // Set day // Set weekday
    omn.prop13=omn.getTimeParting('h','-8')+">"+omn.getTimeParting('d','-8')+">"+omn.getTimeParting('w','-8'); // Set hour // Set day // Set weekday

    omn.prop19=omn.getPercentPageViewed();

    omn.eVar26=omn.getVisitNum();
    omn.prop26=omn.getVisitNum();

    omn.campaign=omn.getQueryParam('utm_source') + ':' + omn.getQueryParam('utm_medium') + ':' + omn.getQueryParam('utm_campaign') + ':' + omn.getQueryParam('utm_term') + ':' + omn.getQueryParam('utm_content');

}

omn.doPlugins=s_doPlugins;
/************************** PLUGINS SECTION *************************/
/* You may insert any plugins you wish to use here.                 */

/* * Plugin: getNewRepeat 1.2 - Returns whether user is new or repeat */
omn.getNewRepeat=new Function("d","cn","" +"var s=this,e=new Date(),cval,sval,ct=e.getTime();d=d?d:30;cn=cn?cn:" +"'s_nr';e.setTime(ct+d*24*60*60*1000);cval=omn.c_r(cn);if(cval.length=" +"=0){omn.c_w(cn,ct+'-New',e);return'New';}sval=omn.split(cval,'-');if(ct" +"-sval[0]<30*60*1000&&sval[1]=='New'){omn.c_w(cn,ct+'-New',e);return'N" +"ew';}else{omn.c_w(cn,ct+'-Repeat',e);return'Repeat';}");

/* * Plugin: getTimeParting 2.0 - Set timeparting values based on time zone */
omn.getTimeParting=new Function("t","z","" +"var s=this,cy;dc=new Date('1/1/2000');" +"if(dc.getDay()!=6||dc.getMonth()!=0){return'Data Not Available'}" +"else{;z=parseFloat(z);var dsts=new Date(omn.dstStart);" +"var dste=new Date(omn.dstEnd);fl=dste;cd=new Date();if(cd>dsts&&cd<fl)" +"{z=z+1}else{z=z};utc=cd.getTime()+(cd.getTimezoneOffset()*60000);" +"tz=new Date(utc + (3600000*z));thisy=tz.getFullYear();"+"var days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'," +"'Saturday'];if(thisy!=omn.currentYear){return'Data Not Available'}else{;" +"thish=tz.getHours();thismin=tz.getMinutes();thisd=tz.getDay();" +"var dow=days[thisd];var ap='AM';var dt='Weekday';var mint='00';" +"if(thismin>30){mint='30'}if(thish>=12){ap='PM';thish=thish-12};"+"if (thish==0){thish=12};if(thisd==6||thisd==0){dt='Weekend'};" +"var timestring=thish+':'+mint+ap;if(t=='h'){return timestring}" +"if(t=='d'){return dow};if(t=='w'){return dt}}};");

/*
 * Plugin: getPercentPageViewed v1.5
 */

omn.handlePPVevents=new Function("",""+
"var s=s_c_il["+omn._in+"];if(!omn.getPPVid)return;var dh=Math.max(Math."+
"max(omn.d.body.scrollHeight,omn.d.documentElement.scrollHeight),Math.ma"+
"x(omn.d.body.offsetHeight,omn.d.documentElement.offsetHeight),Math.max("+
"omn.d.body.clientHeight,omn.d.documentElement.clientHeight)),vph=omn.wd.i"+
"nnerHeight||(omn.d.documentElement.clientHeight||omn.d.body.clientHeigh"+
"t),st=omn.wd.pageYOffset||(omn.wd.document.documentElement.scrollTop||s"+
".wd.document.body.scrollTop),vh=st+vph,pv=Math.min(Math.round(vh/dh"+
"*100),100),c=omn.c_r('s_ppv'),a=(c.indexOf(',')>-1)?c.split(',',4):[]"+
",id=(a.length>0)?(a[0]):escape(omn.getPPVid),cv=(a.length>1)?parseInt"+
"(a[1],10):(0),p0=(a.length>2)?parseInt(a[2],10):(pv),cy=(a.length>3)?pars"+
"eInt(a[3]):(0),cn=(pv>0)?(id+','+((pv>cv)?pv:cv)+','+p0+','+((vh>cy"+
")?vh:cy)):'';omn.c_w('s_ppv',cn);");
omn.getPercentPageViewed=new Function("pid",""+
"pid=pid?pid:'-';var s=this,ist=!omn.getPPVid?true:false;if(typeof(omn.l"+
"inkType)!='undefined'&&omn.linkType!='e')return'';var v=omn.c_r('s_ppv'"+
"),a=(v.indexOf(',')>-1)?v.split(',',4):[];if(a.length<4){for(var i="+
"3;i>0;i--){a[i]=(i<a.length)?(a[i-1]):('');}a[0]='';}a[0]=unescape("+
"a[0]);omn.getPPVpid=pid;omn.c_w('s_ppv',escape(pid));if(ist){omn.getPPVid"+
"=(pid)?(pid):(omn.pageName?omn.pageName:document.location.href);omn.c_w('"+
"s_ppv',escape(omn.getPPVid));if(omn.wd.addEventListener){omn.wd.addEventL"+
"istener('load',omn.handlePPVevents,false);omn.wd.addEventListener('scro"+
"ll',omn.handlePPVevents,false);omn.wd.addEventListener('resize',omn.handl"+
"ePPVevents,false);}else if(omn.wd.attachEvent){omn.wd.attachEvent('onlo"+
"ad',omn.handlePPVevents);omn.wd.attachEvent('onscroll',omn.handlePPVevent"+
"s);omn.wd.attachEvent('onresize',omn.handlePPVevents);}}return(pid!='-'"+
")?(a):(a[1]);");


/* * Plugin: Visit Number By Month 2.0 - Return the user visit number */
omn.getVisitNum=new Function("" +"var s=this,e=new Date(),cval,cvisit,ct=e.getTime(),c='s_vnum',c2='s" +"_invisit';e.setTime(ct+30*24*60*60*1000);cval=omn.c_r(c);if(cval){var" +" i=cval.indexOf('&vn='),str=cval.substring(i+4,cval.length),k;}cvis" +"it=omn.c_r(c2);if(cvisit){if(str){e.setTime(ct+30*60*1000);omn.c_w(c2,'" +"true',e);return str;}else return 'unknown visit number';}else{if(st" +"r){str++;k=cval.substring(0,i);e.setTime(k);omn.c_w(c,k+'&vn='+str,e)" +";e.setTime(ct+30*60*1000);omn.c_w(c2,'true',e);return str;}else{omn.c_w" +"(c,ct+30*24*60*60*1000+'&vn=1',e);e.setTime(ct+30*60*1000);omn.c_w(c2" +",'true',e);return 1;}}" );

/*
Utility Functions: apl, p_c, p_gh, split, replace, join
*/

//append list
omn.apl=new Function("L","v","d","u","var omn=this,m=0;if(!L)L='';if(u){var i,n,a=s.split(L,d);for(i=0;i<a.length;i++){n=a[i];m=m||(u==1?(n==v):(n.toLowerCase()==v.toLowerCase()));}}if(!m)L=L?L+d+v:v;return L");

// split v1.5
omn.split=new Function("l","d","var i,x=0,a=new Array;while(l){i=l.indexOf(d);i=i>-1?i:l.length;a[x++]=l.substring(0,i);l=l.substring(i+d.length);}return a");

// ver. 1.0 - join(v,p)| v - Array | p - formatting parameters (front,back,delim,wrap)
omn.join=new Function("v","p","var omn=this;var f,b,d,w;if(p){f=p.front?p.front:'';b=p.back?p.back:'';d=p.delim?p.delim:'';w=p.wrap?p.wrap:'';}var str='';for(var x=0;x<v.length;x++){if(typeof(v[x])=='object' )str+=omn.join( v[x],p);else str+=w+v[x]+w;if(x<v.length-1)str+=d;}return f+str+b;");

// Plugin Utility: Replace v1.0
omn.repl=new Function("x","o","n",""+
"var i=x.indexOf(o),l=n.length;while(x&&i>=0){x=x.substring(0,i)+n+x."+
"substring(i+o.length);i=x.indexOf(o,i+l)}return x");

/* Plugin: getQueryParam 2.3 */
/* https://developer.omniture.com/en_US/content_page/sitecatalyst-tagging/c-retrieve-a-url-variable-using-a-sitecatalyst-plug-in-script */
omn.getQueryParam=new Function("p","d","u","var omn=this,v='',i,t;d=d?d:'';u=u?u:(omn.pageURL?omn.pageURL:omn.wd.location);if(u=='f')u=omn.gtfs().location;while(p){i=p.indexOf(',');i=i<0?p.length:i;t=omn.p_gpv(p.substring(0,i),u+'');if(t){t=t.indexOf('#')>-1?t.substring(0,t.indexOf('#')):t;}if(t)v+=v?d+t:t;p=p.substring(i==p.length?i:i+1)}return v");omn.p_gpv=new Function("k","u","var s=this,v='',i=u.indexOf('?'),q;if(k&&i>-1){q=u.substring(i+1);v=omn.pt(q,'&','p_gvf',k)}return v");omn.p_gvf=new Function("t","k","if(t){var s=this,i=t.indexOf('='),p=i<0?t:t.substring(0,i),v=i<0?'True':t.substring(i+1);if(p.toLowerCase()==k.toLowerCase())return omn.epa(v)}return ''");

/************* DO NOT ALTER ANYTHING BELOW THIS LINE ! **************/
var s_code='',s_objectID;function s_gi(un,pg,ss){var c="s.version='H.25.4';s.an=s_an;s.logDebug=function(m){var s=this,tcf=new Function('var e;try{console.log(\"'+s.rep(s.rep(s.rep(m,\"\\\\\",\"\\\\"+
"\\\\\"),\"\\n\",\"\\\\n\"),\"\\\"\",\"\\\\\\\"\")+'\");}catch(e){}');tcf()};s.cls=function(x,c){var i,y='';if(!c)c=this.an;for(i=0;i<x.length;i++){n=x.substring(i,i+1);if(c.indexOf(n)>=0)y+=n}retur"+
"n y};s.fl=function(x,l){return x?(''+x).substring(0,l):x};s.co=function(o){return o};s.num=function(x){x=''+x;for(var p=0;p<x.length;p++)if(('0123456789').indexOf(x.substring(p,p+1))<0)return 0;ret"+
"urn 1};s.rep=s_rep;s.sp=s_sp;s.jn=s_jn;s.ape=function(x){var s=this,h='0123456789ABCDEF',f=\"+~!*()'\",i,c=s.charSet,n,l,e,y='';c=c?c.toUpperCase():'';if(x){x=''+x;if(s.em==3){x=encodeURIComponent("+
"x);for(i=0;i<f.length;i++) {n=f.substring(i,i+1);if(x.indexOf(n)>=0)x=s.rep(x,n,\"%\"+n.charCodeAt(0).toString(16).toUpperCase())}}else if(c=='AUTO'&&('').charCodeAt){for(i=0;i<x.length;i++){c=x.su"+
"bstring(i,i+1);n=x.charCodeAt(i);if(n>127){l=0;e='';while(n||l<4){e=h.substring(n%16,n%16+1)+e;n=(n-n%16)/16;l++}y+='%u'+e}else if(c=='+')y+='%2B';else y+=escape(c)}x=y}else x=s.rep(escape(''+x),'+"+
"','%2B');if(c&&c!='AUTO'&&s.em==1&&x.indexOf('%u')<0&&x.indexOf('%U')<0){i=x.indexOf('%');while(i>=0){i++;if(h.substring(8).indexOf(x.substring(i,i+1).toUpperCase())>=0)return x.substring(0,i)+'u00"+
"'+x.substring(i);i=x.indexOf('%',i)}}}return x};s.epa=function(x){var s=this,y,tcf;if(x){x=s.rep(''+x,'+',' ');if(s.em==3){tcf=new Function('x','var y,e;try{y=decodeURIComponent(x)}catch(e){y=unesc"+
"ape(x)}return y');return tcf(x)}else return unescape(x)}return y};s.pt=function(x,d,f,a){var s=this,t=x,z=0,y,r;while(t){y=t.indexOf(d);y=y<0?t.length:y;t=t.substring(0,y);r=s[f](t,a);if(r)return r"+
";z+=y+d.length;t=x.substring(z,x.length);t=z<x.length?t:''}return ''};s.isf=function(t,a){var c=a.indexOf(':');if(c>=0)a=a.substring(0,c);c=a.indexOf('=');if(c>=0)a=a.substring(0,c);if(t.substring("+
"0,2)=='s_')t=t.substring(2);return (t!=''&&t==a)};s.fsf=function(t,a){var s=this;if(s.pt(a,',','isf',t))s.fsg+=(s.fsg!=''?',':'')+t;return 0};s.fs=function(x,f){var s=this;s.fsg='';s.pt(x,',','fsf'"+
",f);return s.fsg};s.mpc=function(m,a){var s=this,c,l,n,v;v=s.d.visibilityState;if(!v)v=s.d.webkitVisibilityState;if(v&&v=='prerender'){if(!s.mpq){s.mpq=new Array;l=s.sp('webkitvisibilitychange,visi"+
"bilitychange',',');for(n=0;n<l.length;n++){s.d.addEventListener(l[n],new Function('var s=s_c_il['+s._in+'],c,v;v=s.d.visibilityState;if(!v)v=s.d.webkitVisibilityState;if(s.mpq&&v==\"visible\"){whil"+
"e(s.mpq.length>0){c=s.mpq.shift();s[c.m].apply(s,c.a)}s.mpq=0}'),false)}}c=new Object;c.m=m;c.a=a;s.mpq.push(c);return 1}return 0};s.si=function(){var s=this,i,k,v,c=s_gi+'var s=s_gi(\"'+s.oun+'\")"+
";s.sa(\"'+s.un+'\");';for(i=0;i<s.va_g.length;i++){k=s.va_g[i];v=s[k];if(v!=undefined){if(typeof(v)!='number')c+='s.'+k+'=\"'+s_fe(v)+'\";';else c+='s.'+k+'='+v+';'}}c+=\"s.lnk=s.eo=s.linkName=s.li"+
"nkType=s.wd.s_objectID=s.ppu=s.pe=s.pev1=s.pev2=s.pev3='';\";return c};s.c_d='';s.c_gdf=function(t,a){var s=this;if(!s.num(t))return 1;return 0};s.c_gd=function(){var s=this,d=s.wd.location.hostnam"+
"e,n=s.fpCookieDomainPeriods,p;if(!n)n=s.cookieDomainPeriods;if(d&&!s.c_d){n=n?parseInt(n,10):2;n=n>2?n:2;p=d.lastIndexOf('.');if(p>=0){while(p>=0&&n>1){p=d.lastIndexOf('.',p-1);n--}s.c_d=p>0&&s.pt(d,'"+
".','c_gdf',0)?d.substring(p):d}}return s.c_d};s.c_r=function(k){var s=this;k=s.ape(k);var c=' '+s.d.cookie,i=c.indexOf(' '+k+'='),e=i<0?i:c.indexOf(';',i),v=i<0?'':s.epa(c.substring(i+2+k.length,e<"+
"0?c.length:e));return v!='[[B]]'?v:''};s.c_w=function(k,v,e){var s=this,d=s.c_gd(),l=s.cookieLifetime,t;v=''+v;l=l?(''+l).toUpperCase():'';if(e&&l!='SESSION'&&l!='NONE'){t=(v!=''?parseInt(l?l:0,10):-6"+
"0);if(t){e=new Date;e.setTime(e.getTime()+(t*1000))}}if(k&&l!='NONE'){s.d.cookie=k+'='+s.ape(v!=''?v:'[[B]]')+'; path=/;'+(e&&l!='SESSION'?' expires='+e.toGMTString()+';':'')+(d?' domain='+d+';':''"+
");return s.c_r(k)==v}return 0};s.eh=function(o,e,r,f){var s=this,b='s_'+e+'_'+s._in,n=-1,l,i,x;if(!s.ehl)s.ehl=new Array;l=s.ehl;for(i=0;i<l.length&&n<0;i++){if(l[i].o==o&&l[i].e==e)n=i}if(n<0){n=i"+
";l[n]=new Object}x=l[n];x.o=o;x.e=e;f=r?x.b:f;if(r||f){x.b=r?0:o[e];x.o[e]=f}if(x.b){x.o[b]=x.b;return b}return 0};s.cet=function(f,a,t,o,b){var s=this,r,tcf;if(s.apv>=5&&(!s.isopera||s.apv>=7)){tc"+
"f=new Function('s','f','a','t','var e,r;try{r=s[f](a)}catch(e){r=s[t](e)}return r');r=tcf(s,f,a,t)}else{if(s.ismac&&s.u.indexOf('MSIE 4')>=0)r=s[b](a);else{s.eh(s.wd,'onerror',0,o);r=s[f](a);s.eh(s"+
".wd,'onerror',1)}}return r};s.gtfset=function(e){var s=this;return s.tfs};s.gtfsoe=new Function('e','var s=s_c_il['+s._in+'],c;s.eh(window,\"onerror\",1);s.etfs=1;c=s.t();if(c)s.d.write(c);s.etfs=0"+
";return true');s.gtfsfb=function(a){return window};s.gtfsf=function(w){var s=this,p=w.parent,l=w.location;s.tfs=w;if(p&&p.location!=l&&p.location.host==l.host){s.tfs=p;return s.gtfsf(s.tfs)}return "+
"s.tfs};s.gtfs=function(){var s=this;if(!s.tfs){s.tfs=s.wd;if(!s.etfs)s.tfs=s.cet('gtfsf',s.tfs,'gtfset',s.gtfsoe,'gtfsfb')}return s.tfs};s.mrq=function(u){var s=this,l=s.rl[u],n,r;s.rl[u]=0;if(l)fo"+
"r(n=0;n<l.length;n++){r=l[n];s.mr(0,0,r.r,r.t,r.u)}};s.flushBufferedRequests=function(){};s.mr=function(sess,q,rs,ta,u){var s=this,dc=s.dc,t1=s.trackingServer,t2=s.trackingServerSecure,tb=s.trackin"+
"gServerBase,p='.sc',ns=s.visitorNamespace,un=s.cls(u?u:(ns?ns:s.fun)),r=new Object,l,imn='s_i_'+(un),im,b,e;if(!rs){if(t1){if(t2&&s.ssl)t1=t2}else{if(!tb)tb='2o7.net';if(dc)dc=(''+dc).toLowerCase()"+
";else dc='d1';if(tb=='2o7.net'){if(dc=='d1')dc='112';else if(dc=='d2')dc='122';p=''}t1=un+'.'+dc+'.'+p+tb}rs='http'+(s.ssl?'s':'')+'://'+t1+'/b/ss/'+s.un+'/'+(s.mobile?'5.1':'1')+'/'+s.version+(s.t"+
"cn?'T':'')+'/'+sess+'?AQB=1&ndh=1'+(q?q:'')+'&AQE=1';if(s.isie&&!s.ismac)rs=s.fl(rs,2047)}if(s.d.images&&s.apv>=3&&(!s.isopera||s.apv>=7)&&(s.ns6<0||s.apv>=6.1)){if(!s.rc)s.rc=new Object;if(!s.rc[u"+
"n]){s.rc[un]=1;if(!s.rl)s.rl=new Object;s.rl[un]=new Array;setTimeout('if(window.s_c_il)window.s_c_il['+s._in+'].mrq(\"'+un+'\")',750)}else{l=s.rl[un];if(l){r.t=ta;r.u=un;r.r=rs;l[l.length]=r;retur"+
"n ''}imn+='_'+s.rc[un];s.rc[un]++}if(s.debugTracking){var d='AppMeasurement Debug: '+rs,dl=s.sp(rs,'&'),dln;for(dln=0;dln<dl.length;dln++)d+=\"\\n\\t\"+s.epa(dl[dln]);s.logDebug(d)}im=s.wd[imn];if("+
"!im)im=s.wd[imn]=new Image;im.s_l=0;im.onload=new Function('e','this.s_l=1;var wd=window,s;if(wd.s_c_il){s=wd.s_c_il['+s._in+'];s.bcr();s.mrq(\"'+un+'\");s.nrs--;if(!s.nrs)s.m_m(\"rr\")}');if(!s.nr"+
"s){s.nrs=1;s.m_m('rs')}else s.nrs++;im.src=rs;if(s.useForcedLinkTracking||s.bcf){if(!s.forcedLinkTrackingTimeout)s.forcedLinkTrackingTimeout=250;setTimeout('if(window.s_c_il)window.s_c_il['+s._in+'"+
"].bcr()',s.forcedLinkTrackingTimeout);}else if((s.lnk||s.eo)&&(!ta||ta=='_self'||ta=='_top'||(s.wd.name&&ta==s.wd.name))){b=e=new Date;while(!im.s_l&&e.getTime()-b.getTime()<500)e=new Date}return '"+
"'}return '<im'+'g sr'+'c=\"'+rs+'\" width=1 height=1 border=0 alt=\"\">'};s.gg=function(v){var s=this;if(!s.wd['s_'+v])s.wd['s_'+v]='';return s.wd['s_'+v]};s.glf=function(t,a){if(t.substring(0,2)=="+
"'s_')t=t.substring(2);var s=this,v=s.gg(t);if(v)s[t]=v};s.gl=function(v){var s=this;if(s.pg)s.pt(v,',','glf',0)};s.rf=function(x){var s=this,y,i,j,h,p,l=0,q,a,b='',c='',t;if(x&&x.length>255){y=''+x"+
";i=y.indexOf('?');if(i>0){q=y.substring(i+1);y=y.substring(0,i);h=y.toLowerCase();j=0;if(h.substring(0,7)=='http://')j+=7;else if(h.substring(0,8)=='https://')j+=8;i=h.indexOf(\"/\",j);if(i>0){h=h."+
"substring(j,i);p=y.substring(i);y=y.substring(0,i);if(h.indexOf('google')>=0)l=',q,ie,start,search_key,word,kw,cd,';else if(h.indexOf('yahoo.co')>=0)l=',p,ei,';if(l&&q){a=s.sp(q,'&');if(a&&a.length"+
">1){for(j=0;j<a.length;j++){t=a[j];i=t.indexOf('=');if(i>0&&l.indexOf(','+t.substring(0,i)+',')>=0)b+=(b?'&':'')+t;else c+=(c?'&':'')+t}if(b&&c)q=b+'&'+c;else c=''}i=253-(q.length-c.length)-y.lengt"+
"h;x=y+(i>0?p.substring(0,i):'')+'?'+q}}}}return x};s.s2q=function(k,v,vf,vfp,f){var s=this,qs='',sk,sv,sp,ss,nke,nk,nf,nfl=0,nfn,nfm;if(k==\"contextData\")k=\"c\";if(v){for(sk in v)if((!f||sk.subst"+
"ring(0,f.length)==f)&&v[sk]&&(!vf||vf.indexOf(','+(vfp?vfp+'.':'')+sk+',')>=0)&&(!Object||!Object.prototype||!Object.prototype[sk])){nfm=0;if(nfl)for(nfn=0;nfn<nfl.length;nfn++)if(sk.substring(0,nf"+
"l[nfn].length)==nfl[nfn])nfm=1;if(!nfm){if(qs=='')qs+='&'+k+'.';sv=v[sk];if(f)sk=sk.substring(f.length);if(sk.length>0){nke=sk.indexOf('.');if(nke>0){nk=sk.substring(0,nke);nf=(f?f:'')+nk+'.';if(!n"+
"fl)nfl=new Array;nfl[nfl.length]=nf;qs+=s.s2q(nk,v,vf,vfp,nf)}else{if(typeof(sv)=='boolean'){if(sv)sv='true';else sv='false'}if(sv){if(vfp=='retrieveLightData'&&f.indexOf('.contextData.')<0){sp=sk."+
"substring(0,4);ss=sk.substring(4);if(sk=='transactionID')sk='xact';else if(sk=='channel')sk='ch';else if(sk=='campaign')sk='v0';else if(s.num(ss)){if(sp=='prop')sk='c'+ss;else if(sp=='eVar')sk='v'+"+
"ss;else if(sp=='list')sk='l'+ss;else if(sp=='hier'){sk='h'+ss;sv=sv.substring(0,255)}}}qs+='&'+s.ape(sk)+'='+s.ape(sv)}}}}}if(qs!='')qs+='&.'+k}return qs};s.hav=function(){var s=this,qs='',l,fv='',"+
"fe='',mn,i,e;if(s.lightProfileID){l=s.va_m;fv=s.lightTrackVars;if(fv)fv=','+fv+','+s.vl_mr+','}else{l=s.va_t;if(s.pe||s.linkType){fv=s.linkTrackVars;fe=s.linkTrackEvents;if(s.pe){mn=s.pe.substring("+
"0,1).toUpperCase()+s.pe.substring(1);if(s[mn]){fv=s[mn].trackVars;fe=s[mn].trackEvents}}}if(fv)fv=','+fv+','+s.vl_l+','+s.vl_l2;if(fe){fe=','+fe+',';if(fv)fv+=',events,'}if (s.events2)e=(e?',':'')+"+
"s.events2}for(i=0;i<l.length;i++){var k=l[i],v=s[k],b=k.substring(0,4),x=k.substring(4),n=parseInt(x,10),q=k;if(!v)if(k=='events'&&e){v=e;e=''}if(v&&(!fv||fv.indexOf(','+k+',')>=0)&&k!='linkName'&&k!="+
"'linkType'){if(k=='timestamp')q='ts';else if(k=='dynamicVariablePrefix')q='D';else if(k=='visitorID')q='vid';else if(k=='pageURL'){q='g';if(v.length>255){s.pageURLRest=v.substring(255);v=v.substrin"+
"g(0,255);}}else if(k=='pageURLRest')q='-g';else if(k=='referrer'){q='r';v=s.fl(s.rf(v),255)}else if(k=='vmk'||k=='visitorMigrationKey')q='vmt';else if(k=='visitorMigrationServer'){q='vmf';if(s.ssl&"+
"&s.visitorMigrationServerSecure)v=''}else if(k=='visitorMigrationServerSecure'){q='vmf';if(!s.ssl&&s.visitorMigrationServer)v=''}else if(k=='charSet'){q='ce';if(v.toUpperCase()=='AUTO')v='ISO8859-1"+
"';else if(s.em==2||s.em==3)v='UTF-8'}else if(k=='visitorNamespace')q='ns';else if(k=='cookieDomainPeriods')q='cdp';else if(k=='cookieLifetime')q='cl';else if(k=='variableProvider')q='vvp';else if(k"+
"=='currencyCode')q='cc';else if(k=='channel')q='ch';else if(k=='transactionID')q='xact';else if(k=='campaign')q='v0';else if(k=='resolution')q='s';else if(k=='colorDepth')q='c';else if(k=='javascri"+
"ptVersion')q='j';else if(k=='javaEnabled')q='v';else if(k=='cookiesEnabled')q='k';else if(k=='browserWidth')q='bw';else if(k=='browserHeight')q='bh';else if(k=='connectionType')q='ct';else if(k=='h"+
"omepage')q='hp';else if(k=='plugins')q='p';else if(k=='events'){if(e)v+=(v?',':'')+e;if(fe)v=s.fs(v,fe)}else if(k=='events2')v='';else if(k=='contextData'){qs+=s.s2q('c',s[k],fv,k,0);v=''}else if(k"+
"=='lightProfileID')q='mtp';else if(k=='lightStoreForSeconds'){q='mtss';if(!s.lightProfileID)v=''}else if(k=='lightIncrementBy'){q='mti';if(!s.lightProfileID)v=''}else if(k=='retrieveLightProfiles')"+
"q='mtsr';else if(k=='deleteLightProfiles')q='mtsd';else if(k=='retrieveLightData'){if(s.retrieveLightProfiles)qs+=s.s2q('mts',s[k],fv,k,0);v=''}else if(s.num(x)){if(b=='prop')q='c'+n;else if(b=='eV"+
"ar')q='v'+n;else if(b=='list')q='l'+n;else if(b=='hier'){q='h'+n;v=s.fl(v,255)}}if(v)qs+='&'+s.ape(q)+'='+(k.substring(0,3)!='pev'?s.ape(v):v)}}return qs};s.ltdf=function(t,h){t=t?t.toLowerCase():'"+
"';h=h?h.toLowerCase():'';var qi=h.indexOf('?');h=qi>=0?h.substring(0,qi):h;if(t&&h.substring(h.length-(t.length+1))=='.'+t)return 1;return 0};s.ltef=function(t,h){t=t?t.toLowerCase():'';h=h?h.toLow"+
"erCase():'';if(t&&h.indexOf(t)>=0)return 1;return 0};s.lt=function(h){var s=this,lft=s.linkDownloadFileTypes,lef=s.linkExternalFilters,lif=s.linkInternalFilters;lif=lif?lif:s.wd.location.hostname;h"+
"=h.toLowerCase();if(s.trackDownloadLinks&&lft&&s.pt(lft,',','ltdf',h))return 'd';if(s.trackExternalLinks&&h.indexOf('#')!=0&&h.indexOf('about:')!=0&&h.indexOf('javascript:')!=0&&(lef||lif)&&(!lef||"+
"s.pt(lef,',','ltef',h))&&(!lif||!s.pt(lif,',','ltef',h)))return 'e';return ''};s.lc=new Function('e','var s=s_c_il['+s._in+'],b=s.eh(this,\"onclick\");s.lnk=this;s.t();s.lnk=0;if(b)return this[b](e"+
");return true');s.bcr=function(){var s=this;if(s.bct&&s.bce)s.bct.dispatchEvent(s.bce);if(s.bcf){if(typeof(s.bcf)=='function')s.bcf();else if(s.bct&&s.bct.href)s.d.location=s.bct.href}s.bct=s.bce=s"+
".bcf=0};s.bc=new Function('e','if(e&&e.s_fe)return;var s=s_c_il['+s._in+'],f,tcf,t,n,nrs,a,h;if(s.d&&s.d.all&&s.d.all.cppXYctnr)return;if(!s.bbc)s.useForcedLinkTracking=0;else if(!s.useForcedLinkTr"+
"acking){s.b.removeEventListener(\"click\",s.bc,true);s.bbc=s.useForcedLinkTracking=0;return}else s.b.removeEventListener(\"click\",s.bc,false);s.eo=e.srcElement?e.srcElement:e.target;nrs=s.nrs;s.t("+
");s.eo=0;if(s.nrs>nrs&&s.useForcedLinkTracking&&e.target){a=e.target;while(a&&a!=s.b&&a.tagName.toUpperCase()!=\"A\"&&a.tagName.toUpperCase()!=\"AREA\")a=a.parentNode;if(a){h=a.href;if(h.indexOf(\""+
"#\")==0||h.indexOf(\"about:\")==0||h.indexOf(\"javascript:\")==0)h=0;t=a.target;if(e.target.dispatchEvent&&h&&(!t||t==\"_self\"||t==\"_top\"||(s.wd.name&&t==s.wd.name))){e.stopPropagation();e.stopI"+
"mmediatePropagation();e.preventDefault();n=s.d.createEvent(\"MouseEvents\");n.initMouseEvent(\"click\",e.bubbles,e.cancelable,e.view,e.detail,e.screenX,e.screenY,e.clientX,e.clientY,e.ctrlKey,e.alt"+
"Key,e.shiftKey,e.metaKey,e.button,e.relatedTarget);n.s_fe=1;s.bct=e.target;s.bce=n}}}');s.oh=function(o){var s=this,l=s.wd.location,h=o.href?o.href:'',i,j,k,p;i=h.indexOf(':');j=h.indexOf('?');k=h."+
"indexOf('/');if(h&&(i<0||(j>=0&&i>j)||(k>=0&&i>k))){p=o.protocol&&o.protocol.length>1?o.protocol:(l.protocol?l.protocol:'');i=l.pathname.lastIndexOf('/');h=(p?p+'//':'')+(o.host?o.host:(l.host?l.ho"+
"st:''))+(h.substring(0,1)!='/'?l.pathname.substring(0,i<0?0:i)+'/':'')+h}return h};s.ot=function(o){var t=o.tagName;if(o.tagUrn||(o.scopeName&&o.scopeName.toUpperCase()!='HTML'))return '';t=t&&t.to"+
"UpperCase?t.toUpperCase():'';if(t=='SHAPE')t='';if(t){if((t=='INPUT'||t=='BUTTON')&&o.type&&o.type.toUpperCase)t=o.type.toUpperCase();else if(!t&&o.href)t='A';}return t};s.oid=function(o){var s=thi"+
"s,t=s.ot(o),p,c,n='',x=0;if(t&&!o.s_oid){p=o.protocol;c=o.onclick;if(o.href&&(t=='A'||t=='AREA')&&(!c||!p||p.toLowerCase().indexOf('javascript')<0))n=s.oh(o);else if(c){n=s.rep(s.rep(s.rep(s.rep(''"+
"+c,\"\\r\",''),\"\\n\",''),\"\\t\",''),' ','');x=2}else if(t=='INPUT'||t=='SUBMIT'){if(o.value)n=o.value;else if(o.innerText)n=o.innerText;else if(o.textContent)n=o.textContent;x=3}else if(o.src&&t"+
"=='IMAGE')n=o.src;if(n){o.s_oid=s.fl(n,100);o.s_oidt=x}}return o.s_oid};s.rqf=function(t,un){var s=this,e=t.indexOf('='),u=e>=0?t.substring(0,e):'',q=e>=0?s.epa(t.substring(e+1)):'';if(u&&q&&(','+u"+
"+',').indexOf(','+un+',')>=0){if(u!=s.un&&s.un.indexOf(',')>=0)q='&u='+u+q+'&u=0';return q}return ''};s.rq=function(un){if(!un)un=this.un;var s=this,c=un.indexOf(','),v=s.c_r('s_sq'),q='';if(c<0)re"+
"turn s.pt(v,'&','rqf',un);return s.pt(un,',','rq',0)};s.sqp=function(t,a){var s=this,e=t.indexOf('='),q=e<0?'':s.epa(t.substring(e+1));s.sqq[q]='';if(e>=0)s.pt(t.substring(0,e),',','sqs',q);return "+
"0};s.sqs=function(un,q){var s=this;s.squ[un]=q;return 0};s.sq=function(q){var s=this,k='s_sq',v=s.c_r(k),x,c=0;s.sqq=new Object;s.squ=new Object;s.sqq[q]='';s.pt(v,'&','sqp',0);s.pt(s.un,',','sqs',"+
"q);v='';for(x in s.squ)if(x&&(!Object||!Object.prototype||!Object.prototype[x]))s.sqq[s.squ[x]]+=(s.sqq[s.squ[x]]?',':'')+x;for(x in s.sqq)if(x&&(!Object||!Object.prototype||!Object.prototype[x])&&"+
"s.sqq[x]&&(x==q||c<2)){v+=(v?'&':'')+s.sqq[x]+'='+s.ape(x);c++}return s.c_w(k,v,0)};s.wdl=new Function('e','var s=s_c_il['+s._in+'],r=true,b=s.eh(s.wd,\"onload\"),i,o,oc;if(b)r=this[b](e);for(i=0;i"+
"<s.d.links.length;i++){o=s.d.links[i];oc=o.onclick?\"\"+o.onclick:\"\";if((oc.indexOf(\"s_gs(\")<0||oc.indexOf(\".s_oc(\")>=0)&&oc.indexOf(\".tl(\")<0)s.eh(o,\"onclick\",0,s.lc);}return r');s.wds=f"+
"unction(){var s=this;if(s.apv>3&&(!s.isie||!s.ismac||s.apv>=5)){if(s.b&&s.b.attachEvent)s.b.attachEvent('onclick',s.bc);else if(s.b&&s.b.addEventListener){if(s.n&&s.n.userAgent.indexOf('WebKit')>=0"+
"&&s.d.createEvent){s.bbc=1;s.useForcedLinkTracking=1;s.b.addEventListener('click',s.bc,true)}s.b.addEventListener('click',s.bc,false)}else s.eh(s.wd,'onload',0,s.wdl)}};s.vs=function(x){var s=this,"+
"v=s.visitorSampling,g=s.visitorSamplingGroup,k='s_vsn_'+s.un+(g?'_'+g:''),n=s.c_r(k),e=new Date,y=e.getYear();e.setYear(y+10+(y<1900?1900:0));if(v){v*=100;if(!n){if(!s.c_w(k,x,e))return 0;n=x}if(n%"+
"10000>v)return 0}return 1};s.dyasmf=function(t,m){if(t&&m&&m.indexOf(t)>=0)return 1;return 0};s.dyasf=function(t,m){var s=this,i=t?t.indexOf('='):-1,n,x;if(i>=0&&m){var n=t.substring(0,i),x=t.subst"+
"ring(i+1);if(s.pt(x,',','dyasmf',m))return n}return 0};s.uns=function(){var s=this,x=s.dynamicAccountSelection,l=s.dynamicAccountList,m=s.dynamicAccountMatch,n,i;s.un=s.un.toLowerCase();if(x&&l){if"+
"(!m)m=s.wd.location.host;if(!m.toLowerCase)m=''+m;l=l.toLowerCase();m=m.toLowerCase();n=s.pt(l,';','dyasf',m);if(n)s.un=n}i=s.un.indexOf(',');s.fun=i<0?s.un:s.un.substring(0,i)};s.sa=function(un){v"+
"ar s=this;if(s.un&&s.mpc('sa',arguments))return;s.un=un;if(!s.oun)s.oun=un;else if((','+s.oun+',').indexOf(','+un+',')<0)s.oun+=','+un;s.uns()};s.m_i=function(n,a){var s=this,m,f=n.substring(0,1),r"+
",l,i;if(!s.m_l)s.m_l=new Object;if(!s.m_nl)s.m_nl=new Array;m=s.m_l[n];if(!a&&m&&m._e&&!m._i)s.m_a(n);if(!m){m=new Object,m._c='s_m';m._in=s.wd.s_c_in;m._il=s._il;m._il[m._in]=m;s.wd.s_c_in++;m.s=s"+
";m._n=n;m._l=new Array('_c','_in','_il','_i','_e','_d','_dl','s','n','_r','_g','_g1','_t','_t1','_x','_x1','_rs','_rr','_l');s.m_l[n]=m;s.m_nl[s.m_nl.length]=n}else if(m._r&&!m._m){r=m._r;r._m=m;l="+
"m._l;for(i=0;i<l.length;i++)if(m[l[i]])r[l[i]]=m[l[i]];r._il[r._in]=r;m=s.m_l[n]=r}if(f==f.toUpperCase())s[n]=m;return m};s.m_a=new Function('n','g','e','if(!g)g=\"m_\"+n;var s=s_c_il['+s._in+'],c="+
"s[g+\"_c\"],m,x,f=0;if(s.mpc(\"m_a\",arguments))return;if(!c)c=s.wd[\"s_\"+g+\"_c\"];if(c&&s_d)s[g]=new Function(\"s\",s_ft(s_d(c)));x=s[g];if(!x)x=s.wd[\\'s_\\'+g];if(!x)x=s.wd[g];m=s.m_i(n,1);if("+
"x&&(!m._i||g!=\"m_\"+n)){m._i=f=1;if((\"\"+x).indexOf(\"function\")>=0)x(s);else s.m_m(\"x\",n,x,e)}m=s.m_i(n,1);if(m._dl)m._dl=m._d=0;s.dlt();return f');s.m_m=function(t,n,d,e){t='_'+t;var s=this,"+
"i,x,m,f='_'+t,r=0,u;if(s.m_l&&s.m_nl)for(i=0;i<s.m_nl.length;i++){x=s.m_nl[i];if(!n||x==n){m=s.m_i(x);u=m[t];if(u){if((''+u).indexOf('function')>=0){if(d&&e)u=m[t](d,e);else if(d)u=m[t](d);else u=m"+
"[t]()}}if(u)r=1;u=m[t+1];if(u&&!m[f]){if((''+u).indexOf('function')>=0){if(d&&e)u=m[t+1](d,e);else if(d)u=m[t+1](d);else u=m[t+1]()}}m[f]=1;if(u)r=1}}return r};s.m_ll=function(){var s=this,g=s.m_dl"+
",i,o;if(g)for(i=0;i<g.length;i++){o=g[i];if(o)s.loadModule(o.n,o.u,o.d,o.l,o.e,1);g[i]=0}};s.loadModule=function(n,u,d,l,e,ln){var s=this,m=0,i,g,o=0,f1,f2,c=s.h?s.h:s.b,b,tcf;if(n){i=n.indexOf(':'"+
");if(i>=0){g=n.substring(i+1);n=n.substring(0,i)}else g=\"m_\"+n;m=s.m_i(n)}if((l||(n&&!s.m_a(n,g)))&&u&&s.d&&c&&s.d.createElement){if(d){m._d=1;m._dl=1}if(ln){if(s.ssl)u=s.rep(u,'http:','https:');"+
"i='s_s:'+s._in+':'+n+':'+g;b='var s=s_c_il['+s._in+'],o=s.d.getElementById(\"'+i+'\");if(s&&o){if(!o.l&&s.wd.'+g+'){o.l=1;if(o.i)clearTimeout(o.i);o.i=0;s.m_a(\"'+n+'\",\"'+g+'\"'+(e?',\"'+e+'\"':'"+
"')+')}';f2=b+'o.c++;if(!s.maxDelay)s.maxDelay=250;if(!o.l&&o.c<(s.maxDelay*2)/100)o.i=setTimeout(o.f2,100)}';f1=new Function('e',b+'}');tcf=new Function('s','c','i','u','f1','f2','var e,o=0;try{o=s"+
".d.createElement(\"script\");if(o){o.type=\"text/javascript\";'+(n?'o.id=i;o.defer=true;o.onload=o.onreadystatechange=f1;o.f2=f2;o.l=0;':'')+'o.src=u;c.appendChild(o);'+(n?'o.c=0;o.i=setTimeout(f2,"+
"100)':'')+'}}catch(e){o=0}return o');o=tcf(s,c,i,u,f1,f2)}else{o=new Object;o.n=n+':'+g;o.u=u;o.d=d;o.l=l;o.e=e;g=s.m_dl;if(!g)g=s.m_dl=new Array;i=0;while(i<g.length&&g[i])i++;g[i]=o}}else if(n){m"+
"=s.m_i(n);m._e=1}return m};s.voa=function(vo,r){var s=this,l=s.va_g,i,k,v,x;for(i=0;i<l.length;i++){k=l[i];v=vo[k];if(v||vo['!'+k]){if(!r&&(k==\"contextData\"||k==\"retrieveLightData\")&&s[k])for(x"+
" in s[k])if(!v[x])v[x]=s[k][x];s[k]=v}}};s.vob=function(vo){var s=this,l=s.va_g,i,k;for(i=0;i<l.length;i++){k=l[i];vo[k]=s[k];if(!vo[k])vo['!'+k]=1}};s.dlt=new Function('var s=s_c_il['+s._in+'],d=n"+
"ew Date,i,vo,f=0;if(s.dll)for(i=0;i<s.dll.length;i++){vo=s.dll[i];if(vo){if(!s.m_m(\"d\")||d.getTime()-vo._t>=s.maxDelay){s.dll[i]=0;s.t(vo)}else f=1}}if(s.dli)clearTimeout(s.dli);s.dli=0;if(f){if("+
"!s.dli)s.dli=setTimeout(s.dlt,s.maxDelay)}else s.dll=0');s.dl=function(vo){var s=this,d=new Date;if(!vo)vo=new Object;s.vob(vo);vo._t=d.getTime();if(!s.dll)s.dll=new Array;s.dll[s.dll.length]=vo;if"+
"(!s.maxDelay)s.maxDelay=250;s.dlt()};s.gfid=function(){var s=this,d='0123456789ABCDEF',k='s_fid',fid=s.c_r(k),h='',l='',i,j,m=8,n=4,e=new Date,y;if(!fid||fid.indexOf('-')<0){for(i=0;i<16;i++){j=Mat"+
"h.floor(Math.random()*m);h+=d.substring(j,j+1);j=Math.floor(Math.random()*n);l+=d.substring(j,j+1);m=n=16}fid=h+'-'+l;}y=e.getYear();e.setYear(y+2+(y<1900?1900:0));if(!s.c_w(k,fid,e))fid=0;return f"+
"id};s.applyADMS=function(){var s=this,vb=new Object;if(s.wd.ADMS&&!s.visitorID&&!s.admsc){if(!s.adms)s.adms=ADMS.getDefault();if(!s.admsq){s.visitorID=s.adms.getVisitorID(new Function('v','var s=s_"+
"c_il['+s._in+'],l=s.admsq,i;if(v==-1)v=0;if(v)s.visitorID=v;s.admsq=0;if(l){s.admsc=1;for(i=0;i<l.length;i++)s.t(l[i]);s.admsc=0;}'));if(!s.visitorID)s.admsq=new Array}if(s.admsq){s.vob(vb);vb['!vi"+
"sitorID']=0;s.admsq.push(vb);return 1}else{if(s.visitorID==-1)s.visitorID=0}}return 0};s.track=s.t=function(vo){var s=this,trk=1,tm=new Date,sed=Math&&Math.random?Math.floor(Math.random()*100000000"+
"00000):tm.getTime(),sess='s'+Math.floor(tm.getTime()/10800000)%10+sed,y=tm.getYear(),vt=tm.getDate()+'/'+tm.getMonth()+'/'+(y<1900?y+1900:y)+' '+tm.getHours()+':'+tm.getMinutes()+':'+tm.getSeconds("+
")+' '+tm.getDay()+' '+tm.getTimezoneOffset(),tcf,tfs=s.gtfs(),ta=-1,q='',qs='',code='',vb=new Object;if(s.mpc('t',arguments))return;s.gl(s.vl_g);s.uns();s.m_ll();if(!s.td){var tl=tfs.location,a,o,i"+
",x='',c='',v='',p='',bw='',bh='',j='1.0',k=s.c_w('s_cc','true',0)?'Y':'N',hp='',ct='',pn=0,ps;if(String&&String.prototype){j='1.1';if(j.match){j='1.2';if(tm.setUTCDate){j='1.3';if(s.isie&&s.ismac&&"+
"s.apv>=5)j='1.4';if(pn.toPrecision){j='1.5';a=new Array;if(a.forEach){j='1.6';i=0;o=new Object;tcf=new Function('o','var e,i=0;try{i=new Iterator(o)}catch(e){}return i');i=tcf(o);if(i&&i.next){j='1"+
".7';if(a.reduce){j='1.8';if(j.trim){j='1.8.1';if(Date.parse){j='1.8.2';if(Object.create)j='1.8.5'}}}}}}}}}if(s.apv>=4)x=screen.width+'x'+screen.height;if(s.isns||s.isopera){if(s.apv>=3){v=s.n.javaE"+
"nabled()?'Y':'N';if(s.apv>=4){c=screen.pixelDepth;bw=s.wd.innerWidth;bh=s.wd.innerHeight}}s.pl=s.n.plugins}else if(s.isie){if(s.apv>=4){v=s.n.javaEnabled()?'Y':'N';c=screen.colorDepth;if(s.apv>=5){"+
"bw=s.d.documentElement.offsetWidth;bh=s.d.documentElement.offsetHeight;if(!s.ismac&&s.b){tcf=new Function('s','tl','var e,hp=0;try{s.b.addBehavior(\"#default#homePage\");hp=s.b.isHomePage(tl)?\"Y\""+
":\"N\"}catch(e){}return hp');hp=tcf(s,tl);tcf=new Function('s','var e,ct=0;try{s.b.addBehavior(\"#default#clientCaps\");ct=s.b.connectionType}catch(e){}return ct');ct=tcf(s)}}}else r=''}if(s.pl)whi"+
"le(pn<s.pl.length&&pn<30){ps=s.fl(s.pl[pn].name,100)+';';if(p.indexOf(ps)<0)p+=ps;pn++}s.resolution=x;s.colorDepth=c;s.javascriptVersion=j;s.javaEnabled=v;s.cookiesEnabled=k;s.browserWidth=bw;s.bro"+
"wserHeight=bh;s.connectionType=ct;s.homepage=hp;s.plugins=p;s.td=1}if(vo){s.vob(vb);s.voa(vo)}s.fid=s.gfid();if(s.applyADMS())return '';if((vo&&vo._t)||!s.m_m('d')){if(s.usePlugins)s.doPlugins(s);i"+
"f(!s.abort){var l=s.wd.location,r=tfs.document.referrer;if(!s.pageURL)s.pageURL=l.href?l.href:l;if(!s.referrer&&!s._1_referrer){s.referrer=r;s._1_referrer=1}s.m_m('g');if(s.lnk||s.eo){var o=s.eo?s."+
"eo:s.lnk,p=s.pageName,w=1,t=s.ot(o),n=s.oid(o),x=o.s_oidt,h,l,i,oc;if(s.eo&&o==s.eo){while(o&&!n&&t!='BODY'){o=o.parentElement?o.parentElement:o.parentNode;if(o){t=s.ot(o);n=s.oid(o);x=o.s_oidt}}if"+
"(!n||t=='BODY')o='';if(o){oc=o.onclick?''+o.onclick:'';if((oc.indexOf('s_gs(')>=0&&oc.indexOf('.s_oc(')<0)||oc.indexOf('.tl(')>=0)o=0}}if(o){if(n)ta=o.target;h=s.oh(o);i=h.indexOf('?');h=s.linkLeav"+
"eQueryString||i<0?h:h.substring(0,i);l=s.linkName;t=s.linkType?s.linkType.toLowerCase():s.lt(h);if(t&&(h||l)){s.pe='lnk_'+(t=='d'||t=='e'?t:'o');s.pev1=(h?s.ape(h):'');s.pev2=(l?s.ape(l):'')}else t"+
"rk=0;if(s.trackInlineStats){if(!p){p=s.pageURL;w=0}t=s.ot(o);i=o.sourceIndex;if(o.dataset&&o.dataset.sObjectId){s.wd.s_objectID=o.dataset.sObjectId;}else if(o.getAttribute&&o.getAttribute('data-s-o"+
"bject-id')){s.wd.s_objectID=o.getAttribute('data-s-object-id');}else if(s.useForcedLinkTracking){s.wd.s_objectID='';oc=o.onclick?''+o.onclick:'';if(oc){var ocb=oc.indexOf('s_objectID'),oce,ocq,ocx;"+
"if(ocb>=0){ocb+=10;while(ocb<oc.length&&(\"= \\t\\r\\n\").indexOf(oc.charAt(ocb))>=0)ocb++;if(ocb<oc.length){oce=ocb;ocq=ocx=0;while(oce<oc.length&&(oc.charAt(oce)!=';'||ocq)){if(ocq){if(oc.charAt("+
"oce)==ocq&&!ocx)ocq=0;else if(oc.charAt(oce)==\"\\\\\")ocx=!ocx;else ocx=0;}else{ocq=oc.charAt(oce);if(ocq!='\"'&&ocq!=\"'\")ocq=0}oce++;}oc=oc.substring(ocb,oce);if(oc){o.s_soid=new Function('s','"+
"var e;try{s.wd.s_objectID='+oc+'}catch(e){}');o.s_soid(s)}}}}}if(s.gg('objectID')){n=s.gg('objectID');x=1;i=1}if(p&&n&&t)qs='&pid='+s.ape(s.fl(p,255))+(w?'&pidt='+w:'')+'&oid='+s.ape(s.fl(n,100))+("+
"x?'&oidt='+x:'')+'&ot='+s.ape(t)+(i?'&oi='+i:'')}}else trk=0}if(trk||qs){s.sampled=s.vs(sed);if(trk){if(s.sampled)code=s.mr(sess,(vt?'&t='+s.ape(vt):'')+s.hav()+q+(qs?qs:s.rq()),0,ta);qs='';s.m_m('"+
"t');if(s.p_r)s.p_r();s.referrer=s.lightProfileID=s.retrieveLightProfiles=s.deleteLightProfiles=''}s.sq(qs)}}}else s.dl(vo);if(vo)s.voa(vb,1);s.abort=0;s.pageURLRest=s.lnk=s.eo=s.linkName=s.linkType"+
"=s.wd.s_objectID=s.ppu=s.pe=s.pev1=s.pev2=s.pev3='';if(s.pg)s.wd.s_lnk=s.wd.s_eo=s.wd.s_linkName=s.wd.s_linkType='';return code};s.trackLink=s.tl=function(o,t,n,vo,f){var s=this;s.lnk=o;s.linkType="+
"t;s.linkName=n;if(f){s.bct=o;s.bcf=f}s.t(vo)};s.trackLight=function(p,ss,i,vo){var s=this;s.lightProfileID=p;s.lightStoreForSeconds=ss;s.lightIncrementBy=i;s.t(vo)};s.setTagContainer=function(n){va"+
"r s=this,l=s.wd.s_c_il,i,t,x,y;s.tcn=n;if(l)for(i=0;i<l.length;i++){t=l[i];if(t&&t._c=='s_l'&&t.tagContainerName==n){s.voa(t);if(t.lmq)for(i=0;i<t.lmq.length;i++){x=t.lmq[i];y='m_'+x.n;if(!s[y]&&!s"+
"[y+'_c']){s[y]=t[y];s[y+'_c']=t[y+'_c']}s.loadModule(x.n,x.u,x.d)}if(t.ml)for(x in t.ml)if(s[x]){y=s[x];x=t.ml[x];for(i in x)if(!Object.prototype[i]){if(typeof(x[i])!='function'||(''+x[i]).indexOf("+
"'s_c_il')<0)y[i]=x[i]}}if(t.mmq)for(i=0;i<t.mmq.length;i++){x=t.mmq[i];if(s[x.m]){y=s[x.m];if(y[x.f]&&typeof(y[x.f])=='function'){if(x.a)y[x.f].apply(y,x.a);else y[x.f].apply(y)}}}if(t.tq)for(i=0;i"+
"<t.tq.length;i++)s.t(t.tq[i]);t.s=s;return}}};s.wd=window;s.ssl=(s.wd.location.protocol.toLowerCase().indexOf('https')>=0);s.d=document;s.b=s.d.body;if(s.d.getElementsByTagName){s.h=s.d.getElements"+
"ByTagName('HEAD');if(s.h)s.h=s.h[0]}s.n=navigator;s.u=s.n.userAgent;s.ns6=s.u.indexOf('Netscape6/');var apn=s.n.appName,v=s.n.appVersion,ie=v.indexOf('MSIE '),o=s.u.indexOf('Opera '),i;if(v.indexOf"+
"('Opera')>=0||o>0)apn='Opera';s.isie=(apn=='Microsoft Internet Explorer');s.isns=(apn=='Netscape');s.isopera=(apn=='Opera');s.ismac=(s.u.indexOf('Mac')>=0);if(o>0)s.apv=parseFloat(s.u.substring(o+6"+
"));else if(ie>0){s.apv=parseInt(i=v.substring(ie+5),10);if(s.apv>3)s.apv=parseFloat(i)}else if(s.ns6>0)s.apv=parseFloat(s.u.substring(s.ns6+10));else s.apv=parseFloat(v);s.em=0;if(s.em.toPrecision)s.e"+
"m=3;else if(String.fromCharCode){i=escape(String.fromCharCode(256)).toUpperCase();s.em=(i=='%C4%80'?2:(i=='%U0100'?1:0))}if(s.oun)s.sa(s.oun);s.sa(un);s.vl_l='timestamp,dynamicVariablePrefix,visito"+
"rID,fid,vmk,visitorMigrationKey,visitorMigrationServer,visitorMigrationServerSecure,ppu,charSet,visitorNamespace,cookieDomainPeriods,cookieLifetime,pageName,pageURL,referrer,contextData,currencyCod"+
"e,lightProfileID,lightStoreForSeconds,lightIncrementBy,retrieveLightProfiles,deleteLightProfiles,retrieveLightData';s.va_l=s.sp(s.vl_l,',');s.vl_mr=s.vl_m='timestamp,charSet,visitorNamespace,cookie"+
"DomainPeriods,cookieLifetime,contextData,lightProfileID,lightStoreForSeconds,lightIncrementBy';s.vl_t=s.vl_l+',variableProvider,channel,server,pageType,transactionID,purchaseID,campaign,state,zip,e"+
"vents,events2,products,linkName,linkType';var n;for(n=1;n<=75;n++){s.vl_t+=',prop'+n+',eVar'+n;s.vl_m+=',prop'+n+',eVar'+n}for(n=1;n<=5;n++)s.vl_t+=',hier'+n;for(n=1;n<=3;n++)s.vl_t+=',list'+n;s.va"+
"_m=s.sp(s.vl_m,',');s.vl_l2=',tnt,pe,pev1,pev2,pev3,resolution,colorDepth,javascriptVersion,javaEnabled,cookiesEnabled,browserWidth,browserHeight,connectionType,homepage,pageURLRest,plugins';s.vl_t"+
"+=s.vl_l2;s.va_t=s.sp(s.vl_t,',');s.vl_g=s.vl_t+',trackingServer,trackingServerSecure,trackingServerBase,fpCookieDomainPeriods,disableBufferedRequests,mobile,visitorSampling,visitorSamplingGroup,dy"+
"namicAccountSelection,dynamicAccountList,dynamicAccountMatch,trackDownloadLinks,trackExternalLinks,trackInlineStats,linkLeaveQueryString,linkDownloadFileTypes,linkExternalFilters,linkInternalFilter"+
"s,linkTrackVars,linkTrackEvents,linkNames,lnk,eo,lightTrackVars,_1_referrer,un';s.va_g=s.sp(s.vl_g,',');s.pg=pg;s.gl(s.vl_g);s.contextData=new Object;s.retrieveLightData=new Object;if(!ss)s.wds();i"+
"f(pg){s.wd.s_co=function(o){return o};s.wd.s_gs=function(un){s_gi(un,1,1).t()};s.wd.s_dc=function(un){s_gi(un,1).t()}}",
w=window,l=w.s_c_il,n=navigator,u=n.userAgent,v=n.appVersion,e=v.indexOf('MSIE '),m=u.indexOf('Netscape6/'),a,i,j,x,s;if(un){un=un.toLowerCase();if(l)for(j=0;j<2;j++)for(i=0;i<l.length;i++){s=l[i];x=s._c;if((!x||x=='s_c'||(j>0&&x=='s_l'))&&(s.oun==un||(s.fs&&s.sa&&s.fs(s.oun,un)))){if(s.sa)s.sa(un);if(x=='s_c')return s;}else s=0;}}w.s_an='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
w.s_sp=new Function("x","d","var a=new Array,i=0,j;if(x){if(x.split)a=x.split(d);else if(!d)for(i=0;i<x.length;i++)a[a.length]=x.substring(i,i+1);else while(i>=0){j=x.indexOf(d,i);a[a.length]=x.subst"+
"ring(i,j<0?x.length:j);i=j;if(i>=0)i+=d.length}}return a");
w.s_jn=new Function("a","d","var x='',i,j=a.length;if(a&&j>0){x=a[0];if(j>1){if(a.join)x=a.join(d);else for(i=1;i<j;i++)x+=d+a[i]}}return x");
w.s_rep=new Function("x","o","n","return s_jn(s_sp(x,o),n)");
w.s_d=new Function("x","var t='`^@$#',l=s_an,l2=new Object,x2,d,b=0,k,i=x.lastIndexOf('~~'),j,v,w;if(i>0){d=x.substring(0,i);x=x.substring(i+2);l=s_sp(l,'');for(i=0;i<62;i++)l2[l[i]]=i;t=s_sp(t,'');d"+
"=s_sp(d,'~');i=0;while(i<5){v=0;if(x.indexOf(t[i])>=0) {x2=s_sp(x,t[i]);for(j=1;j<x2.length;j++){k=x2[j].substring(0,1);w=t[i]+k;if(k!=' '){v=1;w=d[b+l2[k]]}x2[j]=w+x2[j].substring(1)}}if(v)x=s_jn("+
"x2,'');else{w=t[i]+' ';if(x.indexOf(w)>=0)x=s_rep(x,w,t[i]);i++;b+=62}}}return x");
w.s_fe=new Function("c","return s_rep(s_rep(s_rep(c,'\\\\','\\\\\\\\'),'\"','\\\\\"'),\"\\n\",\"\\\\n\")");
w.s_fa=new Function("f","var s=f.indexOf('(')+1,e=f.indexOf(')'),a='',c;while(s>=0&&s<e){c=f.substring(s,s+1);if(c==',')a+='\",\"';else if((\"\\n\\r\\t \").indexOf(c)<0)a+=c;s++}return a?'\"'+a+'\"':"+
"a");
w.s_ft=new Function("c","c+='';var s,e,o,a,d,q,f,h,x;s=c.indexOf('=function(');while(s>=0){s++;d=1;q='';x=0;f=c.substring(s);a=s_fa(f);e=o=c.indexOf('{',s);e++;while(d>0){h=c.substring(e,e+1);if(q){i"+
"f(h==q&&!x)q='';if(h=='\\\\')x=x?0:1;else x=0}else{if(h=='\"'||h==\"'\")q=h;if(h=='{')d++;if(h=='}')d--}if(d>0)e++}c=c.substring(0,s)+'new Function('+(a?a+',':'')+'\"'+s_fe(c.substring(o+1,e))+'\")"+
"'+c.substring(e+1);s=c.indexOf('=function(')}return c;");
c=s_d(c);if(e>0){a=parseInt(i=v.substring(e+5),10);if(a>3)a=parseFloat(i);}else if(m>0)a=parseFloat(u.substring(m+10));else a=parseFloat(v);if(a<5||v.indexOf('Opera')>=0||u.indexOf('Opera')>=0)c=s_ft(c);if(!s){s={};if(!w.s_c_in){w.s_c_il=[];w.s_c_in=0;}s._il=w.s_c_il;s._in=w.s_c_in;s._il[s._in]=s;w.s_c_in++;}s._c='s_c';(new Function("s","un","pg","ss",c))(s,un,pg,ss);return s;}
function s_giqf(){var w=window,q=w.s_giq,i,t,s;if(q)for(i=0;i<q.length;i++){t=q[i];s=s_gi(t.oun);s.sa(t.un);s.setTagContainer(t.tagContainerName);}w.s_giq=0;}s_giqf();




window.analytics = window.analytics || {};
window.analytics.init = function() {
  
  // Configure which services we want
  mc_shared_assets.analytics.api.addService(mc_shared_assets.analytics.services.omniture);
  mc_shared_assets.analytics.api.addService(mc_shared_assets.analytics.services.ga);

  // Configure the context
  mc_shared_assets.analytics.api.pushContext(mc_shared_assets.analytics.context.calcECommValues());
  mc_shared_assets.trigger('pushContext',mc_shared_assets.analytics.context.calcECommValues());

  /*
    Activate Optimizely's Omniture integration

    Needs to be called after Omniture's s_code.js (via mc-shared-assets) 
    is included and any tracking call is made.
    See base.js and http://support.optimizely.com/customer/portal/articles/465375-how-can-i-integrate-optimizely-with-omniture-sitecatalyst
  */
  window.optimizely = window.optimizely || [];
  window.optimizely.push( ['activateSiteCatalyst', {'sVariable': window.omn}] );

  mc_shared_assets.analytics.api.pushContext({
    ga_account_key: window.gaKey,
    device_type: utils.device.type
  });
};

window.analytics.init();

mc_shared_assets.on('fetchAndSetPersonalization', function(options) {

  var url = (options.host ? 'http://' + options.host : '')  + '/personalization';

  $.ajax({
    url: url,
    dataType: 'jsonp',
    type: 'get',
    success: function( result ) {

      if (result.account.id == options.currentAccountId || window.isCapybara) {
        mc_shared_assets.trigger('setPersonalization', result);
      } else {
        // Something is WRONG: shared session cookie was out of sync with what
        // personalization thought. EComm should have corrected that on the
        // /personalization call, so we will try again... (once)
        if (!/cleanupSharedSession/.exec(document.location.search)) {
          window.location.href = document.location.href.split('#')[0] + (document.location.search ? '&' : '?') +'cleanupSharedSession=1' + document.location.hash;
        }

        if (result.account.id && !options.currentAccountId) {
          console.log('ERROR: Personalization thinks there is account, but rails does not. Please check with a BTB engineer.');
        } else if (result.account.id != options.currentAccountId) {
          console.log('ERROR: Rails and personalization disagree on the account ids. Please check with a BTB engineer.');
        }

      }

    }
  });
});
mc_shared_assets.scope( 'mc_shared_assets.modal', function( modal ) {
  
  modal.bind = function( url, options ) {
    
  };
  
  modal.center = function() {
    var $dialog = $('#mc-modal-dialog');
    
    var top = Math.max( $(window).height() - $dialog.outerHeight(), 0 ) / 2;
    var left = Math.max( $(window).width() - $dialog.outerWidth(), 0 ) / 2;

    $dialog.css({
      top: top + $(window).scrollTop(), 
      left: left + $(window).scrollLeft()
    });
  };
  
  modal.load = function( options ) {
    var $dialog  = $('#mc-modal-dialog'),
        $title   = $('#mc-modal-dialog-title'),
        $content = $('#mc-modal-dialog-content'),
        $close   = $('#mc-modal-dialog-close');
    
    if( options.title ) {
      $title.html( options.title );
    }
    
    if( options.close && options.close == false ) {
      $close.hide();
    } else {
      $close.click( function( e ) {
        e.stopImmediatePropagation();
        modal.hide();
        return false;
      });
    }
    
    if( options.content_url ) {
      $.get( options.content_url, function( html ) {
        $content.html( html );
        modal.center();
        modal.show();
      });
    } else if( options.html ) {
      $content.html( options.html );
      modal.center();
      modal.show();
    }
    
    return true;
  };
  
  modal.show = function( options ) {
    $('#mc-modal-overlay').css( 'display', 'block' );
    $('#mc-modal-dialog').css( 'display', 'block' );
  };
  
  modal.hide = function() {
    $('#mc-modal-dialog').css( 'display', 'none' );
    $('#mc-modal-overlay').css( 'display', 'none' );
  };
  
});
// Put data here (or pass data in) that you need Backbone to have access to at initialization time
window.initialBackboneData = window.initialBackboneData || {}
// Shared modules
window.wizards = window.wizards || {};
window.modal = window.modal || {};
window.Modal = window.Modal || {};


$(function() {
  _dbg.init();
  _dbg.log("[:: Launching base app ::]");

  mc_shared_assets.on('userClickedSignIn', function() {
    utils.redirect(window.router.paths.signIn());
  });

  mc_shared_assets.on('userClickedSignOut', function() {
    utils.redirect(window.router.paths.signOut());
  });

  mc_shared_assets.on('userClickedJoin', function() {
    utils.redirect(window.router.paths.join());
  });

  mc_shared_assets.on('userClickedCart', function() {
    utils.redirect(window.router.paths.cart());
  });

  mc_shared_assets.on('userClickedCheckout', function() {
    window.location = window.router.paths.checkout();
  });

  mc_shared_assets.on('userClickedCustomerCare', function () {
    var deviceType = utils.device.type;
    mc_shared_assets.modal.load({
      title: ( deviceType == 'phone' ? 'Customer Care' : 'ModCloth Customer Care' ),
      content_url: ( '/style-gallery/mc-shared-assets/modals/customer_care/' + deviceType)
    });
  });

  // translates bootstrap's generic hide event into namespaced event for use in backbone
  $('body').on('hide', '.modal', function() {
    _dbg.log('[GLOBAL] Caught a hide event, translating..');
    _e.trigger('modal:hide');
  });

  $('body').on('hidden', '.modal', function() {
    _dbg.log('[GLOBAL] Caught a hidden event, translating..');
    _e.trigger('modal:hidden');
  });

  $('body').on('show', '.modal', function() {
    _dbg.log('[GLOBAL] Caught a show event, translating..');
    _e.trigger('modal:show');
  });

  $('body').on('shown', '.modal', function() {
    _dbg.log('[GLOBAL] Caught a shown event, translating..');
    _e.trigger('modal:shown');
  });

  $(window).on('resize', _.throttle( function() {
      _e.trigger('window:resize');
    }, 200 )
  );

  // Listen for orientation changes
  window.addEventListener("orientationchange", function() {
    _e.trigger('orientationDidChange');
  }, false);
});
$(function() {
  $.fn.cover = function($element) {
    return this.each(function() {
      var $this = $(this);
      $this.width($element.width()).height($element.height());
      $this.css({'position': 'absolute', 'top': $element.position().top, 'left': $element.position().left});
      $this.insertAfter($element);
    });
  };
});
$(function() {

  $.fn.unscrollable = function() {
    return this.each(function() {
      var $this = $(this);
      var viewportHeight = $(window).height();
      var scrollPosition = $(window).scrollTop();
      if ( typeof $this.data('scrollable-orig-height') == 'undefined') {
        $this.data('scrollable-orig-height', this.style.height);
      }
      $this.css({'height': Math.min(250, viewportHeight - 100), 'overflow': 'hidden'});
      $this.data('scrollPosition', scrollPosition);
    });
  };

  $.fn.scrollable = function() {
    return this.each(function() {
      var $this = $(this);
      var originalHeight = $this.data('scrollable-orig-height');
      var originalScrollPosition = $this.data('scrollPosition');
      $this.css({'height': originalHeight, 'overflow': 'auto'});
      $(window).scrollTop( originalScrollPosition );
      $this.data( { 'scrollable-orig-height': undefined, 'scrollPosition': undefined });
    });
  };
});
StyleGallery.Analytics.Builders.Omniture = function(vars, context) {

  if (context.page_name) {
    vars.eVar6 = vars.pageName = context.page_name;
  }
};

// Configure Omniture builder
mc_shared_assets.analytics.services.omniture.addBuilder(StyleGallery.Analytics.Builders.Omniture);
var gaOutfitDetailEventBuilder = function(event, context) {
  /*
   * Category: user_actions
   * Action: sg_outfit
   * Label: outfit_id
   *
   */

  switch (event) {
    case 'outfitDetailView':
      return ['user_actions', 'sg_outfit', context.outfitId];
  }
};

var omnitureOutfitDetailEventBuilder = function(vars, context) {
  if (context.event === 'outfitDetailViewClick') {
    context.page_type = context.product_finding_method = 'style gallery';
    vars.eVar1 = vars.eVar2 = vars.prop1 = vars.prop2 = 'style gallery';
    vars.linkName = 'modcloth>style-gallery>outfit>' + context.outfitId;
    vars.events = 'event80,event22';
  }
};

var addOutfitDetailEventBuilders = function() {
  mc_shared_assets.analytics.services.ga.addBuilder(gaOutfitDetailEventBuilder);
  mc_shared_assets.analytics.services.omniture.addBuilder(omnitureOutfitDetailEventBuilder);
};
addOutfitDetailEventBuilders(); // Exposed for testing. TODO - remove this when we're confident we have coverage elsewhere
;
var gaProfilesEventBuilder = function(event, context){
  switch (event) {
    case 'userBrowseFollowers':
      return ['user_actions', 'sg:followers', context.userId];
    case 'userBrowseFollowed':
      return ['user_actions', 'sg:following', context.userId];
    case 'userFollowAction':
      return ['user_actions', 'sg:follow', context.userId];
    case 'userUnfollowAction':
      return ['user_actions', 'sg:un-follow', context.userId];
    case 'userFollowingListFollow':
      return ['user_actions', 'sg:following-list:follow', context.userId];
    case 'userFollowingListUnfollow':
      return ['user_actions', 'sg:following-list:un-follow', context.userId];
    case 'userFollowingListProfile':
      return ['user_actions', 'sg:following-list:profile', context.userId];
    case 'userFollowersListFollow':
      return ['user_actions', 'sg:followers-list:follow', context.userId];
    case 'userFollowersListUnfollow':
      return ['user_actions', 'sg:followers-list:un-follow', context.userId];
    case 'userFollowersListProfile':
      return ['user_actions', 'sg:followers-list:profile', context.userId];
  }
};

var omnitureProfilesEventBuilder = function(vars, context){

  switch (context.event) {
    case 'userBrowseFollowers':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>followers";
      vars.eVar31 = "modcloth>followers";
      vars.events = 'event80,event36';
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userBrowseFollowed':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>following";
      vars.eVar31 = "modcloth>following";
      vars.events = 'event80,event36';
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userFollowAction':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>follow";
      vars.eVar31 = "modcloth>follow";
      vars.events = 'event80,event36';
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userUnfollowAction':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>un-follow";
      vars.eVar31 = "modcloth>un-follow";
      vars.events = 'event80';
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userFollowingListFollow':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>followers-list>follow";
      vars.eVar31 = "modcloth>followers-list>follow";
      vars.events = 'event80,event36';
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userFollowingListUnfollow':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>followers-list>un-follow";
      vars.eVar31 = "modcloth>followers-list>un-follow";
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userFollowingListProfile':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>followers-list>profile";
      vars.eVar31 = "modcloth>followers-list>profile";
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userFollowersListFollow':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>following-list>follow";
      vars.eVar31 = "modcloth>following-list>follow";
      vars.events = 'event80,event36';
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userFollowersListUnfollow':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>following-list>un-follow";
      vars.eVar31 = "modcloth>following-list>un-follow";
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
    case 'userFollowersListProfile':
      vars.eVar2 = 'style gallery';
      vars.prop2 = 'style-gallery';
      vars.eVar36 = 'mobile';
      vars.prop36 = 'mobile';
      vars.prop31 = "modcloth>following-list>profile";
      vars.eVar31 = "modcloth>following-list>profile";
      vars.evar38 = context.pageName;
      vars.prop28 = context.pageName;
      break;
  }
};

var addProfilesEventBuilders = function(){
  mc_shared_assets.analytics.services.ga.addBuilder(gaProfilesEventBuilder);
  mc_shared_assets.analytics.services.omniture.addBuilder(omnitureProfilesEventBuilder);
};

addProfilesEventBuilders();
var gaShareEventBuilder = function(event, context) {
  /*
   * Category: social_network_share
   * Action: share:[share network]:stylegallery
   * Label: outfit_id
   *
   */

    var location = 'gallery';
    switch (context.currentView) {
      case 'outfitDetailView':
        location = 'outfit';
    }

    switch (event) {
      case 'social-share-facebook':
        return ['social_network_share', 'style-gallery:' + location + ':facebook', context.product_id];
      case 'social-share-twitter':
        return ['social_network_share', 'style-gallery:' + location + ':twitter', context.product_id];
      case 'social-share-pinterest':
        return ['social_network_share', 'style-gallery:' + location + ':pinterest', context.product_id];
    }
};

var addShareEventBuilders = function() {
  mc_shared_assets.analytics.services.ga.addBuilder(gaShareEventBuilder);
};
addShareEventBuilders(); // Exposed for testing. TODO - remove this when we're confident we have coverage elsewhere
;
var gaUploadEventBuilder = function(event, context) {
  switch (event) {
    case 'mobileInstagramUploadButtonClicked':
      return ['user_actions', 'sg:upload:instagram'];
    case 'mobileDeviceUploadButtonClicked':
      return ['user_actions', 'sg:upload'];
    case 'mobileDeviceUploadIntent':
      return ['user_actions', 'sg:add_photo'];
    case 'mobileDeviceUploadBarClosed':
      return ['user_actions', 'sg:close_photo'];
  }
};


var addUploadEventBuilders = function() {
  mc_shared_assets.analytics.services.ga.addBuilder(gaUploadEventBuilder);
};
addUploadEventBuilders();
StyleGallery.Models.Modal = Backbone.Model.extend({
  defaults: {
    el: '.modal',
    isShowing: false,
    content: null
  },

  initialize: function() {
    _dbg.log('[Modal::initialize]');
  },

  show: function() {
    _dbg.log('[Modal] #show');
    this.set({isShowing: true},{silent:true});
    this.trigger('change');
  },

  /*******
  *    !!! DANGER! DANGER! DANGER !!!
  *
  * You should only call this if you have a non-standard button
  * that needs to close the modal explicitly. See, for example,
  * the confirmation box in the upload modal, otherwise bootstrap
  * actually takes care of hiding the modal for you by binding to
  * click events on the backdrop or on elements with the appropriate
  * closing data-attribute.
  *
  */
  forceHide: function() {
    _dbg.log('[Modal] #forceHide');
    this.set({isShowing: false},{silent:true});
    this.trigger('change');
  }

});
(function() {

  StyleGallery.Views.ModalView = Backbone.View.extend({
    className: 'modal',

    initialize: function(){
      _.bindAll(this, 'render');
      _dbg.log('[ModalView::initialize]');
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      this._render();
      return this;
    },

    _render: function() {
      _dbg.log('[ModalView::_render]')
      if(this.model.get('isShowing')) {
        this.show();
      } else {
        this.hide();
      }
    },

    isShowing: function() {
      return $('body .modal:visible').length > 0;
    },

    show: function() {
      _dbg.log('[ModalView::show]');
      var options = this.model.get('modalOptions') || {};
      _.defaults(options, {dynamic: true, backdrop: true});

      this.$el.html(this.model.get('content'));

      this.$el.modal(options); // Magic to make the modal scrollable. See https://github.com/aroc/Bootstrap-Scroll-Modal
      // this.$el.modal('show'); // We don't need to call modal with 'show' explicitly as the line above triggers show

      this.bindCloseModal();
    },

    hide: function() {
      _dbg.log('[ModalView::hide]');
      this.$el.modal('hide');
      this.model.set(this.model.defaults,{silent:true});
    },

    bindCloseModal: function() {
      // remove any existing events...
      _e.off('modal:hidden', this.navigateToClosePath, this);

      // bind closing modal to navigateToClosePath
      _e.on('modal:hidden', this.navigateToClosePath, this);
    },

    navigateToClosePath: function() {
      closePath = this.model.get('onClosePath');
      if (closePath) {
        _dbg.log('[ModalView] #navigateToClosePath: ' + closePath);
        window.router.navigate(closePath, { trigger: true });
      }
      $('body').removeClass('not-scrollable');
    }

  });

})();
$(function() {
  window.Modal.View = new StyleGallery.Views.ModalView({model: new StyleGallery.Models.Modal()});
});
StyleGalleryBase.Mixin = {

  extend: function(proto) {
    return _.extend({}, this, proto);
  },

  mixin: function(that) {
    _.defaults(that, _.omit(this, 'initialize'));
    this.initialize.call(that);
  },

  initialize: function() {}
};
StyleGalleryBase.Models.OutfitBase = Backbone.Model.extend({

  addProduct: function(product) {
    var model = this;

    product.withLock(function(unlock) {
      $.ajax({
        url: window.router.paths.outfitAddProduct(model.get('id')),
        type: 'POST',
        data: {
          id: product.id
        },
        success: function(data, textStatus, jqXHR){
          unlock();
          model.fetch();
        }
      });
    });
  },

  removeProduct: function(product) {
    var model = this;

    product.whenUnlocked(function() {
      $.ajax({
        url: window.router.paths.outfitRemoveProduct(model.get('id'), product.id),
        type: 'DELETE',
        success: function(data, textStatus, jqXHR){
          model.fetch();
        }
      });
    });
  }
});
StyleGalleryBase.Collections.Change = StyleGalleryBase.Mixin.extend({
  initialize: function() {
    var onChange = _.debounce(function() {
      this.trigger('change:done');
    }, 3);
    // this.listenTo(this, 'change', onChange);
    this.listenTo(this, 'remove', onChange);
    this.listenTo(this, 'add', onChange);
  }
});
StyleGalleryBase.Collections.Dirty = StyleGalleryBase.Mixin.extend({
  initialize: function() {
    this.pristine = true;
    this.modificationCount = 0;
    this.listenTo(this, 'add', this.trackModifications);
    this.listenTo(this, 'remove', this.trackModifications);
  },

  trackModifications: function() {
    this.pristine = false;
    this.modificationCount++;
  }
});
/*
 * Mutex
 *
 * Code passed to whenUnlocked will queue until all locks are free
 *
 * lock(function(unlock) {
 *  someAsyncCode(function() {
 *    unlock();
 *  })
 * })
 */

StyleGalleryBase.Models.Lockable = StyleGalleryBase.Mixin.extend({
  initialize: function() {
    this._lock = new $.Deferred().resolve();
  },

  withLock: function(callback) {
    var self = this;
    var promise = new $.Deferred();
    this.whenUnlocked(function() {
      var unlock = function() {
        promise.resolve();
      };
      self._lock = promise;
      callback(unlock);
    });
    return promise;
  },

  whenUnlocked: function(action) {
    if (this._lock.state() != "pending") {
      action();
    } else {
      this._lock.always(action);
    }
    return this._lock;
  }
});
StyleGalleryBase.Routers.Paths = StyleGalleryBase.Mixin.extend({
  paths: StyleGallery.Paths
});
StyleGalleryBase.Routers.TrailingSlash = StyleGalleryBase.Mixin.extend({
  initialize: function(){
    var that = this;
    _.each(that.appRoutes, function(actionName, routeName){
      if (!/\/$/.test(routeName)) {
        that.appRoute(routeName + '/', actionName);
      }
    });
  }
});
/*
 * Usage
 * MyClass = Backbone.View.extend({
 *   initialize: function() {
 *     StyleGalleryBase.Views.ExpandableView.mixin(this);
 *   }
 * });
 *
 * Capabilities
 *
 * click/tap on .header, .toggle-icon
 * to trigger a slide-toggle
 * on .content
 *
 * Will display + or - in the .toggle-icon element.
 *
 * Will fire 'expandable:toggle', ':open' and ':close' events.
 */

StyleGalleryBase.Views.ExpandableView = StyleGalleryBase.Mixin.extend({
  initialize: function() {
    var events = {
      'click .header, .toggle-icon': 'checkToggle',
      'tap .header, .toggle-icon': 'checkToggle',
    };
    this.delegateEvents(_.extend(this.events || {}, events));
  },

  checkToggle: function() {
    if (this.$('.toggle-icon').is(':visible')) {
      this.slideToggle();
    }
    return false;
  },

  slideToggle: function() {
    var that = this;
    this.$('.content').slideToggle(function() {
      var contentIsVisible = $(this).is(':visible');
      var iconText = contentIsVisible ? '–' : '+';
      that.$('.toggle-icon').html(iconText);
      that.trigger('expandable:toggle');
      that.trigger(contentIsVisible ? 'expandable:open' : 'expandable:close');
    });
  },

  hideExpandableContent: function() {
    this.$('.content').hide();
    this.$('.toggle-icon').html('+');
  }
});
StyleGalleryBase.Views.InfiniteScrollView = StyleGalleryBase.Mixin.extend({

  pollInterval: 50,

  paginateAtPosition: 150,

  initialize: function() {
    _.bindAll(this, 'onPoll', 'startScrollPoller', 'endScrollPoller', 'unpauseScrollPoller', 'contentHeight', 'scrollBottom');
  },

  startScrollPoller: function() {
    _dbg.log('[Scroller] Start scroll position poller');
    this.getViewport();
    this.shouldTerminateScrollPoller = false;
    this.pauseScrollPoller = false;
    utils.setNiceInterval(this.onPoll, this.pollInterval);
  },

  onPoll: function() {
    var distanceToBottom = this.contentHeight() - this.scrollBottom();

    if (!this.pauseScrollPoller && distanceToBottom < this.paginateAtPosition) {
      _dbg.log('[Scroller] Trigger pagination event');
      this.pauseScrollPoller = true;
      this.trigger('paginate');
    }

    return this.shouldTerminateScrollPoller;
  },

  contentHeight: function() {
    var contentHeight = 0;
    this.$viewport.children().each(function() {
      contentHeight += $(this).height();
    });
    return contentHeight;
  },

  scrollBottom: function() {
    return this.$viewport.scrollTop() + this.$viewport.height();
  },

  endScrollPoller: function() {
    this.shouldTerminateScrollPoller = true;
  },

  unpauseScrollPoller: function() {
    _dbg.log('[Scroller] Unpause scroll position poller');
    this.pauseScrollPoller = false;
  },

  getViewport: function() {
    this.$viewport = _.result(this, 'viewport');
    if(!this.$viewport) {
      throw "Viewport not defined";
    }
  }
});
StyleGallery.FlatRegion = Marionette.Region.extend({
  open: function(view){
    this.$el.replaceWith(view.el);
  }
});
StyleGallery.Views.Wizards.BailUploadView = Backbone.View.extend({

  className: 'exit-confirmation',
  viewName: 'Abandon', // Used to name the step in the wizard

  render: function() {
    this.$el.html( HoganTemplates['upload/bail_upload'].render() );

    return this;
  }

});

// This is a view that provides the logic for navigating through a wizard

(function($) {
  'use strict';

  StyleGallery.Views.Wizards.OutfitUploadWizard = Backbone.View.extend({
    className: 'modal-backdrop in',

    initialize: function(steps) {
      _dbg.log('[outfitUploadWizard::init]');
      this.steps = steps || [];
      this.stepsMapping = {};
      this.data = {};

      this.setStepsMapping(steps);
      this.currentStep = 0;

      _dbg.log('outfitUploadWizard has steps: ' + _.values(this.stepsMapping).join(', ') );

      _.bindAll(this, 'interceptLinkEvents');
      _.bindAll(this, 'renderNextStep');
      _.bindAll(this, 'renderPreviousStep');
      _.bindAll(this, 'shouldShowInterceptOnClose');
    },

    setStepsMapping: function() {
      // creates a mapping to steps so that we can ask for step "foo" and get it's index
      var mapping = {};
      _.each(this.steps, function(step, index) {
        var viewName;
        if( step.viewName ) {
          viewName = step.viewName;
        } else {
          viewName = 'View' + index;
        }
        mapping[index] = viewName;
      }, this);

      this.stepsMapping = mapping;
    },

    insertElIntoDOM: function() {
      $('body').append(this.el);
      $('.container-fluid').unscrollable();
    },

    bindNextAndPrevEvents: function() {
      $('body').off('click', '[data-wizard-next="true"]', this.renderNextStep);
      $('body').on('click', '[data-wizard-next="true"]', this.renderNextStep);

      $('body').off('click', '[data-wizard-previous="true"]', this.renderPreviousStep);
      $('body').on('click', '[data-wizard-previous="true"]', this.renderPreviousStep);
    },

    bindExitEvent: function() {
      var that = this;

      $('body').on('click', '.modal-backdrop', function(event) {
        if( $(event.target).hasClass('modal-backdrop') ) {
          // TODO - don't do this here and use interceptTransition(), feels wrong

          if(that.shouldShowInterceptOnClose()) {
              that.renderInterceptScreen();
          } else {
            var step = that.steps[that.currentStep];
            if (step.onClose) {
              step.onClose();
            }
            that.close();
          }
        }
      });
    },

    render: function() {
      _dbg.log('outfitUploadWizard render');

      this.insertElIntoDOM();

      this.renderStep(this.currentStep);

      this.bindNextAndPrevEvents();

      this.bindExitEvent();

      return this;
    },

    // Step methods

    setCurrentStep: function(stepName) {
      var index = this.indexForStepName(stepName);
      if ( index >= 0 ) {
        this.currentStep = index;
      }
    },

    indexForStepName: function(stepName) {
      return _.values(this.stepsMapping).indexOf(stepName);
    },

    stepNameForIndex: function(index) {
      return this.stepsMapping[index];
    },

    stepForStepName: function(stepName) {
      var index = this.indexForStepName(stepName);
      if ( typeof(index) !== 'undefined' ) {
        return this.steps[index];
      }
    },

    currentStepName: function() {
      return this.stepNameForIndex(this.currentStep);
    },

    renderStep: function(stepIndex, options) {
      options = options || {};

      if ( !options.transitionOverride && 
          this.interceptTransition(this.currentStep, stepIndex) ) {
        return;
      }

      var that = this;
      var step = this.steps[stepIndex];

      // notify outgoing step that it will exit
      if (stepIndex !== this.currentStep) {
        this.willExitStep(this.steps[this.currentStep]);
      }
      this.willRenderStep(step);

      this.currentStep = stepIndex;
      _dbg.log('rendering step: ' + this.currentStep);

      this.renderView(step, step.narrowModal);
      setTimeout(function() {
        that.didRenderStep(step);
      }, 100); // We don't know when the view actually ended up in the DOM, but we can guesstimate
      if (!utils.onAdminPath()) {
        window.router.navigate(step.route, {trigger: false});
      }
    },

    // helper method to insert content with correct wrappers
    renderView: function(step, narrowModal) {
      var modalWrapperClass = 'modal-wrapper';
      if ( narrowModal ) {
        modalWrapperClass += ' narrow';
      }
      var wrapper = $('<div/>', {class: modalWrapperClass });
      var modal = $('<div/>', {class: 'modal', id: 'uploadWizard'});
      var content = wrapper.append( modal );

      this.$el.children().detach();
      this.$el.html(content);

      step.render();
    },

    renderNextStep: function(event) { // TODO - now these fn names feel odd since I started passing the event in
      if (event) {
        event.preventDefault();
      }
      var nextStep = this.currentStep + 1;
      if( nextStep >= this.steps.length ) {
        // um. Exit?
        _dbg.log('will exit wizard');
        this.close();
      } else {
        if (event && $(event.target).data('wizard-transition-force')) {
          this.renderStep(nextStep, {
            transitionOverride: true
          });
        } else {
          this.renderStep(nextStep);
        }
      }
    },

    renderPreviousStep: function(event) {
      if (event) {
        event.preventDefault();
      }
      var prevStep = this.currentStep - 1;
      if( prevStep >= 0 ) {
        if (event && $(event.target).data('wizard-transition-force')) {
          this.renderStep(prevStep, {
            transitionOverride: true
          });
        } else {
          this.renderStep(prevStep);
        }
      } else {
        // um. Exit?
        _dbg.log('will exit wizard');
        this.close();
      }
    },

    willRenderStep: function(step) {
      _dbg.log('[OutfitUploadWizard::willRenderStep]');
      // do any initialization or state setup before the view is rendered

      if (step.viewWillRender) {
        step.viewWillRender(this.data);
      }
    },

    didRenderStep: function(step) {
      _dbg.log('[OutfitUploadWizard::didRenderStep]');
      // fire any callbacks or functions after the view has been rendered

      if (step.viewDidRender) {
        step.viewDidRender(this.data);
      }
    },

    willExitStep: function(step) {
      _dbg.log('[OutfitUploadWizard::willExitStep]');
      // fire any callbacks or functions prior to exiting the wizard

      if (step.viewWillExit) {
        step.viewWillExit();
      }
    },

    // Interception functions

    interceptTransition: function(oldIndex, newIndex) {
      // if going from step 1 to step 0, don't let that happen - render interceptView
      // TODO - don't do this based soley on indicies, look to see what view we're leaving
      if( oldIndex === 1 && newIndex === 0 ) {
        this.renderInterceptScreen();
        return true;
      } else {
        return false;
      }
    },

    renderInterceptScreen: function() {
      _dbg.log('renderInterceptScreen');
      var view = new StyleGallery.Views.Wizards.BailUploadView().render();

      this.$('.' + view.className).remove(); // TODO - smartest way of doing this?
      this.$('.' + view.className + '-bg').remove(); // TODO - smartest way of doing this?

      this.$el.find('.modal').prepend( $('<div/>', {class: view.className + '-bg'}) );
      this.$el.find('.modal').prepend(view.el);

      $('body').off('click', '.intercept-link', this.interceptLinkEvents);
      $('body').on('click', '.intercept-link', { interceptViewClassName: view.className }, this.interceptLinkEvents);
    },

    interceptLinkEvents: function(event) {
      event.preventDefault();
      var shouldClose = false;

      this.$('.' + event.data.interceptViewClassName).remove();
      this.$('.' + event.data.interceptViewClassName + '-bg').remove();

      if( $(event.target).data('wizard-intercept-abort') ) {
        shouldClose = true;

      } else if( $(event.target).data('wizard-intercept-finish') ) {
        // find index of submitter step and ask for that to be rendered
        var sumbitViewStepIndex = this.indexForStepName('OutfitProductSubmitter');
        this.renderStep(sumbitViewStepIndex);
      }

      if( shouldClose ) {
        this.close();
      }
    },


    close: function() {
      this.willExitStep( this.steps[this.currentStep] );

      if(!utils.onAdminPath()) {
        window.router.navigate(utils.addScopeToGalleryPath(''), {trigger: true});
      }
      this.$el.detach();
      $('.container-fluid').scrollable();
      this.currentStep = 0;
    },

    shouldShowInterceptOnClose: function() {
      var step = this.steps[this.currentStep];
      return this.currentStep === 1 && this.currentStepName() === 'OutfitProductTagger' && 
        !step.isPreviewMode();
    }

  });

})(jQuery);
(function( $ ){

  $.fn.toggles = function(opts) {
    opts = opts || {};
    var o = $.extend({
      dragable: true,
      clickable: true,
      ontext: 'ON',
      offtext: 'OFF',
      on: true,
      animtime: 300
    },opts);
    var transition = 'margin-left '+o.animtime/1000+'s ease-in-out';
    var transitions = {
      '-webkit-transition': transition,
      '-moz-transition': transition,
      'transition': transition
    };
    var notrans = {
      '-webkit-transition': '',
      '-moz-transition': '',
      'transition': ''
    };
    var toggle = function(slide,w,h) {
      var inner = slide.find('.inner');
      inner.css(transitions);
      var active = slide.toggleClass('active').hasClass('active');
      inner.css({
        marginLeft: (active) ? 0 : -w+h
      });
      if (o.checkbox) $(o.checkbox).attr('checked',active);
      setTimeout(function() {
        inner.css({
          marginLeft: (active) ? 0 : -w+h
        });
        inner.css(notrans);
      },o.animtime);
      _e.trigger('toggle:done', slide, active); /* MODCLOTH ADDED */
    };

    return this.each(function() {
      var self = $(this);

      // we dont want the click handler to go on all the elements
      o.click = opts.click || self;


      var h = self.height(), w= self.width();
      if (h === 0 || w===0) {
        self.height(h = 28);
        self.width(w = 110);
      }
      var slide = $('<div class="slide" />'), inner = $('<div class="inner" />'),on = $('<div class="on" />'), off = $('<div class="off" />'), blob = $('<div class="blob" />');
      on
      .css({
        height:h,
        width: w-h/2,
        textAlign: 'center',
        textIndent: -h/2,
        lineHeight: h+'px'
      })
      .text(o.ontext);
      off
      .css({
        height:h,
        width: w-h/2,
        marginLeft: -h/2,
        textAlign: 'center',
        textIndent: h/2,
        lineHeight: h+'px'
      })
      .text(o.offtext);
      blob.css({
        height: h,
        width: h,
        marginLeft: -h/2
      });
      inner.css({
        width: w*2-h,
        marginLeft: (o.on) ? 0 : -w+h
      });
      if (o.on) {
        slide.addClass('active');
        if (o.checkbox) $(o.checkbox).attr('checked',true);
      }
      self.html('');
      self.append(slide.append(inner.append(on,blob,off)));
      var diff = 0, time;
      self.on('toggle', function() {
        toggle(slide,w,h);
      });
      if (o.clickable) {
        o.click.click(function(e) {
          if (e.target !=  blob[0] || !o.dragable) {
            self.trigger('toggle');
          }
        });
      }
      function upleave(e) {
        self.off('mousemove');
        slide.off('mouseleave');
        blob.off('mouseup');
        if (diff !== 0) {
        if (slide.hasClass('active')) {
          if (diff < (-w+h)/4) {
            self.trigger('toggle');
          }else{
            inner.animate({
              marginLeft: 0
            }, o.animtime/2);
          }
        }else{
          if (diff > (w-h)/4) {
            self.trigger('toggle');
          }else{
            inner.animate({
              marginLeft: -w+h
            },o.animtime/2);
          }
        }
      }else if (o.clickable && e.type != 'mouseleave') self.trigger('toggle');
      }
      if (o.dragable) {
        blob.on('mousedown',function(e) {
          diff = 0;
          blob.off('mouseup');
          slide.off('mouseleave');
          var cursor = e.pageX;
          self.on('mousemove',blob,function(e) {
            diff = e.pageX - cursor;
            if (slide.hasClass('active')) {
              inner.css({
                marginLeft: (diff < 0) ? (diff < -w+h) ? -w+h : diff : 0
              });
            }else{
              inner.css({
                marginLeft: (diff > 0) ? (diff > w-h) ? 0 : diff-w+h :-w+h
              });
            }
          });
          blob.on('mouseup',upleave);
          slide.on('mouseleave',upleave);
        });
      }
    });
};
})( jQuery );
/**
 * jCarouselLite - jQuery plugin to navigate images/any content in a carousel style widget.
 * @requires jQuery v1.2 or above
 *
 * http://gmarwaha.com/jquery/jcarousellite/
 *
 * Copyright (c) 2007 Ganeshji Marwaha (gmarwaha.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Version: 1.0.1
 * Note: Requires jquery 1.2 or above from version 1.0.1
 */

/**
 * Creates a carousel-style navigation widget for images/any-content from a simple HTML markup.
 *
 * The HTML markup that is used to build the carousel can be as simple as...
 *
 *  <div class="carousel">
 *      <ul>
 *          <li><img src="image/1.jpg" alt="1"></li>
 *          <li><img src="image/2.jpg" alt="2"></li>
 *          <li><img src="image/3.jpg" alt="3"></li>
 *      </ul>
 *  </div>
 *
 * As you can see, this snippet is nothing but a simple div containing an unordered list of images.
 * You don't need any special "class" attribute, or a special "css" file for this plugin.
 * I am using a class attribute just for the sake of explanation here.
 *
 * To navigate the elements of the carousel, you need some kind of navigation buttons.
 * For example, you will need a "previous" button to go backward, and a "next" button to go forward.
 * This need not be part of the carousel "div" itself. It can be any element in your page.
 * Lets assume that the following elements in your document can be used as next, and prev buttons...
 *
 * <button class="prev">&lt;&lt;</button>
 * <button class="next">&gt;&gt;</button>
 *
 * Now, all you need to do is call the carousel component on the div element that represents it, and pass in the
 * navigation buttons as options.
 *
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev"
 * });
 *
 * That's it, you would have now converted your raw div, into a magnificient carousel.
 *
 * There are quite a few other options that you can use to customize it though.
 * Each will be explained with an example below.
 *
 * @param an options object - You can specify all the options shown below as an options object param.
 *
 * @option btnPrev, btnNext : string - no defaults
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev"
 * });
 * @desc Creates a basic carousel. Clicking "btnPrev" navigates backwards and "btnNext" navigates forward.
 *
 * @option btnGo - array - no defaults
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      btnGo: [".0", ".1", ".2"]
 * });
 * @desc If you don't want next and previous buttons for navigation, instead you prefer custom navigation based on
 * the item number within the carousel, you can use this option. Just supply an array of selectors for each element
 * in the carousel. The index of the array represents the index of the element. What i mean is, if the
 * first element in the array is ".0", it means that when the element represented by ".0" is clicked, the carousel
 * will slide to the first element and so on and so forth. This feature is very powerful. For example, i made a tabbed
 * interface out of it by making my navigation elements styled like tabs in css. As the carousel is capable of holding
 * any content, not just images, you can have a very simple tabbed navigation in minutes without using any other plugin.
 * The best part is that, the tab will "slide" based on the provided effect. :-)
 *
 * @option mouseWheel : boolean - default is false
 * @example
 * $(".carousel").jCarouselLite({
 *      mouseWheel: true
 * });
 * @desc The carousel can also be navigated using the mouse wheel interface of a scroll mouse instead of using buttons.
 * To get this feature working, you have to do 2 things. First, you have to include the mouse-wheel plugin from brandon.
 * Second, you will have to set the option "mouseWheel" to true. That's it, now you will be able to navigate your carousel
 * using the mouse wheel. Using buttons and mouseWheel or not mutually exclusive. You can still have buttons for navigation
 * as well. They complement each other. To use both together, just supply the options required for both as shown below.
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      mouseWheel: true
 * });
 *
 * @option auto : number - default is null, meaning autoscroll is disabled by default
 * @example
 * $(".carousel").jCarouselLite({
 *      auto: 800,
 *      speed: 500
 * });
 * @desc You can make your carousel auto-navigate itself by specfying a millisecond value in this option.
 * The value you specify is the amount of time between 2 slides. The default is null, and that disables auto scrolling.
 * Specify this value and magically your carousel will start auto scrolling.
 *
 * @option speed : number - 200 is default
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      speed: 800
 * });
 * @desc Specifying a speed will slow-down or speed-up the sliding speed of your carousel. Try it out with
 * different speeds like 800, 600, 1500 etc. Providing 0, will remove the slide effect.
 *
 * @option easing : string - no easing effects by default.
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      easing: "bounceout"
 * });
 * @desc You can specify any easing effect. Note: You need easing plugin for that. Once specified,
 * the carousel will slide based on the provided easing effect.
 *
 * @option vertical : boolean - default is false
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      vertical: true
 * });
 * @desc Determines the direction of the carousel. true, means the carousel will display vertically. The next and
 * prev buttons will slide the items vertically as well. The default is false, which means that the carousel will
 * display horizontally. The next and prev items will slide the items from left-right in this case.
 *
 * @option circular : boolean - default is true
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      circular: false
 * });
 * @desc Setting it to true enables circular navigation. This means, if you click "next" after you reach the last
 * element, you will automatically slide to the first element and vice versa. If you set circular to false, then
 * if you click on the "next" button after you reach the last element, you will stay in the last element itself
 * and similarly for "previous" button and first element.
 *
 * @option visible : number - default is 3
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      visible: 4
 * });
 * @desc This specifies the number of items visible at all times within the carousel. The default is 3.
 * You are even free to experiment with real numbers. Eg: "3.5" will have 3 items fully visible and the
 * last item half visible. This gives you the effect of showing the user that there are more images to the right.
 *
 * @option start : number - default is 0
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      start: 2
 * });
 * @desc You can specify from which item the carousel should start. Remember, the first item in the carousel
 * has a start of 0, and so on.
 *
 * @option scrool : number - default is 1
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      scroll: 2
 * });
 * @desc The number of items that should scroll/slide when you click the next/prev navigation buttons. By
 * default, only one item is scrolled, but you may set it to any number. Eg: setting it to "2" will scroll
 * 2 items when you click the next or previous buttons.
 *
 * @option beforeStart, afterEnd : function - callbacks
 * @example
 * $(".carousel").jCarouselLite({
 *      btnNext: ".next",
 *      btnPrev: ".prev",
 *      beforeStart: function(a) {
 *          alert("Before animation starts:" + a);
 *      },
 *      afterEnd: function(a) {
 *          alert("After animation ends:" + a);
 *      }
 * });
 * @desc If you wanted to do some logic in your page before the slide starts and after the slide ends, you can
 * register these 2 callbacks. The functions will be passed an argument that represents an array of elements that
 * are visible at the time of callback.
 *
 *
 * @cat Plugins/Image Gallery
 * @author Ganeshji Marwaha/ganeshread@gmail.com
 */


(function($) {                                          // Compliant with jquery.noConflict()
$.fn.jCarouselLite = function(o) {
    o = $.extend({
        btnPrev: null,
        btnNext: null,
        btnGo: null,
        mouseWheel: false,
        auto: null,

        speed: 200,
        easing: null,

        vertical: false,
        circular: true,
        visible: 3,
        start: 0,
        scroll: 1,

        beforeStart: null,
        afterEnd: null
    }, o || {});

    return this.each(function() {                           // Returns the element collection. Chainable.

        var running = false, animCss=o.vertical?"top":"left", sizeCss=o.vertical?"height":"width";
        var div = $(this), ul = $("ul", div), tLi = $("li", ul), tl = tLi.size(), v = o.visible;

        if(o.circular) {
            ul.prepend(tLi.slice(tl-v-1+1).clone())
              .append(tLi.slice(0,v).clone());
            o.start += v;
        }

        var li = $("li", ul), itemLength = li.size(), curr = o.start;
        div.css("visibility", "visible");

        li.css({overflow: "hidden", float: o.vertical ? "none" : "left"});
        ul.css({margin: "0", padding: "0", position: "relative", "list-style-type": "none", "z-index": "1"});
        div.css({overflow: "hidden", position: "relative", "z-index": "2", left: "0px"});

        var liSize = o.vertical ? height(li) : width(li);   // Full li size(incl margin)-Used for animation
        var ulSize = liSize * itemLength;                   // size of full ul(total length, not just for the visible items)
        var divSize = liSize * v;                           // size of entire div(total length for just the visible items)

        li.css({width: li.width(), height: li.height()});
        ul.css(sizeCss, ulSize+"px").css(animCss, -(curr*liSize));

        div.css(sizeCss, divSize+"px");                     // Width of the DIV. length of visible images

        if(o.btnPrev)
            $(o.btnPrev).click(function() {
                return go(curr-o.scroll);
            });

        if(o.btnNext)
            $(o.btnNext).click(function() {
                return go(curr+o.scroll);
            });

        if(o.btnGo)
            $.each(o.btnGo, function(i, val) {
                $(val).click(function() {
                    return go(o.circular ? o.visible+i : i);
                });
            });

        if(o.mouseWheel && div.mousewheel)
            div.mousewheel(function(e, d) {
                return d>0 ? go(curr-o.scroll) : go(curr+o.scroll);
            });

        if(o.auto)
            setInterval(function() {
                go(curr+o.scroll);
            }, o.auto+o.speed);

        function vis() {
            return li.slice(curr).slice(0,v);
        };

        function go(to) {
            if(!running) {

                if(o.beforeStart)
                    o.beforeStart.call(this, vis());

                if(o.circular) {            // If circular we are in first or last, then goto the other end
                    if(to<=o.start-v-1) {           // If first, then goto last
                        ul.css(animCss, -((itemLength-(v*2))*liSize)+"px");
                        // If "scroll" > 1, then the "to" might not be equal to the condition; it can be lesser depending on the number of elements.
                        curr = to==o.start-v-1 ? itemLength-(v*2)-1 : itemLength-(v*2)-o.scroll;
                    } else if(to>=itemLength-v+1) { // If last, then goto first
                        ul.css(animCss, -( (v) * liSize ) + "px" );
                        // If "scroll" > 1, then the "to" might not be equal to the condition; it can be greater depending on the number of elements.
                        curr = to==itemLength-v+1 ? v+1 : v+o.scroll;
                    } else curr = to;
                } else {                    // If non-circular and to points to first or last, we just return.
                    if(to<0 || to>itemLength-v) return;
                    else curr = to;
                }                           // If neither overrides it, the curr will still be "to" and we can proceed.

                running = true;

                ul.animate(
                    animCss == "left" ? { left: -(curr*liSize) } : { top: -(curr*liSize) } , o.speed, o.easing,
                    function() {
                        if(o.afterEnd)
                            o.afterEnd.call(this, vis());
                        running = false;
                    }
                );
                // Disable buttons when the carousel reaches the last/first, and enable when not
                if(!o.circular) {
                    $(o.btnPrev + "," + o.btnNext).removeClass("disabled");
                    $( (curr-o.scroll<0 && o.btnPrev)
                        ||
                       (curr+o.scroll > itemLength-v && o.btnNext)
                        ||
                       []
                     ).addClass("disabled");
                }

            }
            return false;
        };
    });
};

function css(el, prop) {
    return parseInt($.css(el[0], prop)) || 0;
};
function width(el) {
    return  el[0].offsetWidth + css(el, 'marginLeft') + css(el, 'marginRight');
};
function height(el) {
    return el[0].offsetHeight + css(el, 'marginTop') + css(el, 'marginBottom');
};

})(jQuery);
/*!
 * SwipeView v1.0 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */

var SwipeView = (function (window, document) {
	var dummyStyle = document.createElement('div').style,
		vendor = (function () {
			var vendors = 't,webkitT,MozT,msT,OT'.split(','),
				t,
				i = 0,
				l = vendors.length;

			for ( ; i < l; i++ ) {
				t = vendors[i] + 'ransform';
				if ( t in dummyStyle ) {
					return vendors[i].substr(0, vendors[i].length - 1);
				}
			}

			return false;
		})(),
		cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',

		// Style properties
		transform = prefixStyle('transform'),
		transitionDuration = prefixStyle('transitionDuration'),

		// Browser capabilities
		has3d = prefixStyle('perspective') in dummyStyle,
		hasTouch = 'ontouchstart' in window,
		hasTransform = !!vendor,
		hasTransitionEnd = prefixStyle('transition') in dummyStyle,

		// Helpers
		translateZ = has3d ? ' translateZ(0)' : '',

		// Events
		resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize',
		startEvent = hasTouch ? 'touchstart' : 'mousedown',
		moveEvent = hasTouch ? 'touchmove' : 'mousemove',
		endEvent = hasTouch ? 'touchend' : 'mouseup',
		cancelEvent = hasTouch ? 'touchcancel' : 'mouseup',
		transitionEndEvent = (function () {
			if ( vendor === false ) return false;

			var transitionEnd = {
					''			: 'transitionend',
					'webkit'	: 'webkitTransitionEnd',
					'Moz'		: 'transitionend',
					'O'			: 'oTransitionEnd',
					'ms'		: 'MSTransitionEnd'
				};

			return transitionEnd[vendor];
		})(),
		
		SwipeView = function (el, options) {
			var i,
				div,
				className,
				pageIndex;

			this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
			this.options = {
				text: null,
				numberOfPages: 3,
				snapThreshold: null,
				hastyPageFlip: false,
				loop: true
			};
		
			// User defined options
			for (i in options) this.options[i] = options[i];
			
			this.wrapper.style.overflow = 'hidden';
			this.wrapper.style.position = 'relative';
			
			this.masterPages = [];
			
			div = document.createElement('div');
			div.id = 'swipeview-slider';
			div.style.cssText = 'position:relative;top:0;height:100%;width:100%;' + cssVendor + 'transition-duration:0;' + cssVendor + 'transform:translateZ(0);' + cssVendor + 'transition-timing-function:ease-out';
			this.wrapper.appendChild(div);
			this.slider = div;

			this.refreshSize();

			for (i=-1; i<2; i++) {
				div = document.createElement('div');
				div.id = 'swipeview-masterpage-' + (i+1);
				div.style.cssText = cssVendor + 'transform:translateZ(0);position:absolute;top:0;height:100%;width:100%;left:' + i*100 + '%';
				if (!div.dataset) div.dataset = {};
				pageIndex = i == -1 ? this.options.numberOfPages - 1 : i;
				div.dataset.pageIndex = pageIndex;
				div.dataset.upcomingPageIndex = pageIndex;
				
				if (!this.options.loop && i == -1) div.style.visibility = 'hidden';

				this.slider.appendChild(div);
				this.masterPages.push(div);
			}
			
			className = this.masterPages[1].className;
			this.masterPages[1].className = !className ? 'swipeview-active' : className + ' swipeview-active';

			window.addEventListener(resizeEvent, this, false);
			this.wrapper.addEventListener(startEvent, this, false);
			this.wrapper.addEventListener(moveEvent, this, false);
			this.wrapper.addEventListener(endEvent, this, false);
			this.slider.addEventListener(transitionEndEvent, this, false);
			// in Opera >= 12 the transitionend event is lowercase so we register both events
			if ( vendor == 'O' ) this.slider.addEventListener(transitionEndEvent.toLowerCase(), this, false);

/*			if (!hasTouch) {
				this.wrapper.addEventListener('mouseout', this, false);
			}*/
		};

	SwipeView.prototype = {
		currentMasterPage: 1,
		x: 0,
		page: 0,
		pageIndex: 0,
		customEvents: [],
		
		onFlip: function (fn) {
			this.wrapper.addEventListener('swipeview-flip', fn, false);
			this.customEvents.push(['flip', fn]);
		},
		
		onMoveOut: function (fn) {
			this.wrapper.addEventListener('swipeview-moveout', fn, false);
			this.customEvents.push(['moveout', fn]);
		},

		onMoveIn: function (fn) {
			this.wrapper.addEventListener('swipeview-movein', fn, false);
			this.customEvents.push(['movein', fn]);
		},
		
		onTouchStart: function (fn) {
			this.wrapper.addEventListener('swipeview-touchstart', fn, false);
			this.customEvents.push(['touchstart', fn]);
		},

		destroy: function () {
			while ( this.customEvents.length ) {
				this.wrapper.removeEventListener('swipeview-' + this.customEvents[0][0], this.customEvents[0][1], false);
				this.customEvents.shift();
			}
			
			// Remove the event listeners
			window.removeEventListener(resizeEvent, this, false);
			this.wrapper.removeEventListener(startEvent, this, false);
			this.wrapper.removeEventListener(moveEvent, this, false);
			this.wrapper.removeEventListener(endEvent, this, false);
			this.slider.removeEventListener(transitionEndEvent, this, false);

/*			if (!hasTouch) {
				this.wrapper.removeEventListener('mouseout', this, false);
			}*/
		},

		refreshSize: function () {
			this.wrapperWidth = this.wrapper.clientWidth;
			this.wrapperHeight = this.wrapper.clientHeight;
			this.pageWidth = this.wrapperWidth;
			this.maxX = -this.options.numberOfPages * this.pageWidth + this.wrapperWidth;
			this.snapThreshold = this.options.snapThreshold === null ?
				Math.round(this.pageWidth * 0.15) :
				/%/.test(this.options.snapThreshold) ?
					Math.round(this.pageWidth * this.options.snapThreshold.replace('%', '') / 100) :
					this.options.snapThreshold;
		},
		
		updatePageCount: function (n) {
			this.options.numberOfPages = n;
			this.maxX = -this.options.numberOfPages * this.pageWidth + this.wrapperWidth;
			this.goToPage(this.page); // redraw master pages
		},
		
		goToPage: function (p) {
			var i;

			this.masterPages[this.currentMasterPage].className = this.masterPages[this.currentMasterPage].className.replace(/(^|\s)swipeview-active(\s|$)/, '');
			for (i=0; i<3; i++) {
				className = this.masterPages[i].className;
				/(^|\s)swipeview-loading(\s|$)/.test(className) || (this.masterPages[i].className = !className ? 'swipeview-loading' : className + ' swipeview-loading');
			}
			
			p = p < 0 ? 0 : p > this.options.numberOfPages-1 ? this.options.numberOfPages-1 : p;
			this.page = p;
			this.pageIndex = p;
			this.slider.style[transitionDuration] = '0s';
			this.__pos(-p * this.pageWidth);

			this.currentMasterPage = (this.page + 1) - Math.floor((this.page + 1) / 3) * 3;

			this.masterPages[this.currentMasterPage].className = this.masterPages[this.currentMasterPage].className + ' swipeview-active';

			if (this.currentMasterPage === 0) {
				this.masterPages[2].style.left = this.page * 100 - 100 + '%';
				this.masterPages[0].style.left = this.page * 100 + '%';
				this.masterPages[1].style.left = this.page * 100 + 100 + '%';
				
				this.masterPages[2].dataset.upcomingPageIndex = this.page === 0 ? this.options.numberOfPages-1 : this.page - 1;
				this.masterPages[0].dataset.upcomingPageIndex = this.page;
				this.masterPages[1].dataset.upcomingPageIndex = this.page == this.options.numberOfPages-1 ? 0 : this.page + 1;
			} else if (this.currentMasterPage == 1) {
				this.masterPages[0].style.left = this.page * 100 - 100 + '%';
				this.masterPages[1].style.left = this.page * 100 + '%';
				this.masterPages[2].style.left = this.page * 100 + 100 + '%';

				this.masterPages[0].dataset.upcomingPageIndex = this.page === 0 ? this.options.numberOfPages-1 : this.page - 1;
				this.masterPages[1].dataset.upcomingPageIndex = this.page;
				this.masterPages[2].dataset.upcomingPageIndex = this.page == this.options.numberOfPages-1 ? 0 : this.page + 1;
			} else {
				this.masterPages[1].style.left = this.page * 100 - 100 + '%';
				this.masterPages[2].style.left = this.page * 100 + '%';
				this.masterPages[0].style.left = this.page * 100 + 100 + '%';

				this.masterPages[1].dataset.upcomingPageIndex = this.page === 0 ? this.options.numberOfPages-1 : this.page - 1;
				this.masterPages[2].dataset.upcomingPageIndex = this.page;
				this.masterPages[0].dataset.upcomingPageIndex = this.page == this.options.numberOfPages-1 ? 0 : this.page + 1;
			}

			this.__checkVisibility();
			this.__flip();
		},

		__checkVisibility: function() {
			var n = this.options.numberOfPages;
			var leftMasterPage = (this.currentMasterPage - 1) % 3;
			var rightMasterPage = (this.currentMasterPage + 1) % 3;
			if (!this.options.loop) {
				for (var i = 0; i < 3; i++) {
					this.masterPages[i].style.visibility = '';
				}
				if (this.page == 0) {
					this.masterPages[leftMasterPage].style.visibility = 'hidden';
				}
				if (this.page == n - 1) {
					this.masterPages[rightMasterPage].style.visibility = 'hidden';
				}
			}
		},

		next: function () {
			if (!this.options.loop && this.x == this.maxX) return;
			
			this.directionX = -1;
			this.x -= 1;
			this.__checkPosition();
		},

		prev: function () {
			if (!this.options.loop && this.x === 0) return;

			this.directionX = 1;
			this.x += 1;
			this.__checkPosition();
		},

		handleEvent: function (e) {
			switch (e.type) {
				case startEvent:
					this.__start(e);
					break;
				case moveEvent:
					this.__move(e);
					break;
				case cancelEvent:
				case endEvent:
					this.__end(e);
					break;
				case resizeEvent:
					this.__resize();
					break;
				case transitionEndEvent:
				case 'otransitionend':
					if (e.target == this.slider && !this.options.hastyPageFlip) this.__flip();
					break;
			}
		},


		/**
		*
		* Pseudo private methods
		*
		*/
		__pos: function (x) {
			this.x = x;
			this.slider.style[transform] = 'translate(' + x + 'px,0)' + translateZ;
		},

		__resize: function () {
			this.refreshSize();
			this.slider.style[transitionDuration] = '0s';
			this.__pos(-this.page * this.pageWidth);
		},

		__start: function (e) {
			//e.preventDefault();

			if (this.initiated) return;
			
			var point = hasTouch ? e.touches[0] : e;
			
			this.initiated = true;
			this.moved = false;
			this.thresholdExceeded = false;
			this.startX = point.pageX;
			this.startY = point.pageY;
			this.pointX = point.pageX;
			this.pointY = point.pageY;
			this.stepsX = 0;
			this.stepsY = 0;
			this.directionX = 0;
			this.directionLocked = false;
			
/*			var matrix = getComputedStyle(this.slider, null).webkitTransform.replace(/[^0-9-.,]/g, '').split(',');
			this.x = matrix[4] * 1;*/

			this.slider.style[transitionDuration] = '0s';
			
			this.__event('touchstart');
		},
		
		__move: function (e) {
			if (!this.initiated) return;

			var point = hasTouch ? e.touches[0] : e,
				deltaX = point.pageX - this.pointX,
				deltaY = point.pageY - this.pointY,
				newX = this.x + deltaX,
				dist = Math.abs(point.pageX - this.startX);

			this.moved = true;
			this.pointX = point.pageX;
			this.pointY = point.pageY;
			this.directionX = deltaX > 0 ? 1 : deltaX < 0 ? -1 : 0;
			this.stepsX += Math.abs(deltaX);
			this.stepsY += Math.abs(deltaY);

			// We take a 10px buffer to figure out the direction of the swipe
			if (this.stepsX < 10 && this.stepsY < 10) {
//				e.preventDefault();
				return;
			}

			// We are scrolling vertically, so skip SwipeView and give the control back to the browser
			if (!this.directionLocked && this.stepsY > this.stepsX) {
				this.initiated = false;
				return;
			}

			e.preventDefault();

			this.directionLocked = true;

			if (!this.options.loop && (newX > 0 || newX < this.maxX)) {
				newX = this.x + (deltaX / 2);
			}

			if (!this.thresholdExceeded && dist >= this.snapThreshold) {
				this.thresholdExceeded = true;
				this.__event('moveout');
			} else if (this.thresholdExceeded && dist < this.snapThreshold) {
				this.thresholdExceeded = false;
				this.__event('movein');
			}
			
/*			if (newX > 0 || newX < this.maxX) {
				newX = this.x + (deltaX / 2);
			}*/
			
			this.__pos(newX);
		},
		
		__end: function (e) {
			if (!this.initiated) return;
			
			var point = hasTouch ? e.changedTouches[0] : e,
				dist = Math.abs(point.pageX - this.startX);

			this.initiated = false;
			
			if (!this.moved) return;

			if (!this.options.loop && (this.x > 0 || this.x < this.maxX)) {
				dist = 0;
				this.__event('movein');
			}

			// Check if we exceeded the snap threshold
			if (dist < this.snapThreshold) {
				this.slider.style[transitionDuration] = Math.floor(300 * dist / this.snapThreshold) + 'ms';
				this.__pos(-this.page * this.pageWidth);
				return;
			}

			this.__checkPosition();
		},
		
		__checkPosition: function () {
			var pageFlip,
				pageFlipIndex,
				className;

			this.masterPages[this.currentMasterPage].className = this.masterPages[this.currentMasterPage].className.replace(/(^|\s)swipeview-active(\s|$)/, '');

			// Flip the page
			if (this.directionX > 0) {
				this.page = -Math.ceil(this.x / this.pageWidth);
				this.currentMasterPage = (this.page + 1) - Math.floor((this.page + 1) / 3) * 3;
				this.pageIndex = this.pageIndex === 0 ? this.options.numberOfPages - 1 : this.pageIndex - 1;

				pageFlip = this.currentMasterPage - 1;
				pageFlip = pageFlip < 0 ? 2 : pageFlip;
				this.masterPages[pageFlip].style.left = this.page * 100 - 100 + '%';

				pageFlipIndex = this.page - 1;
			} else {
				this.page = -Math.floor(this.x / this.pageWidth);
				this.currentMasterPage = (this.page + 1) - Math.floor((this.page + 1) / 3) * 3;
				this.pageIndex = this.pageIndex == this.options.numberOfPages - 1 ? 0 : this.pageIndex + 1;

				pageFlip = this.currentMasterPage + 1;
				pageFlip = pageFlip > 2 ? 0 : pageFlip;
				this.masterPages[pageFlip].style.left = this.page * 100 + 100 + '%';

				pageFlipIndex = this.page + 1;
			}

			// Add active class to current page
			className = this.masterPages[this.currentMasterPage].className;
			/(^|\s)swipeview-active(\s|$)/.test(className) || (this.masterPages[this.currentMasterPage].className = !className ? 'swipeview-active' : className + ' swipeview-active');

			// Add loading class to flipped page
			className = this.masterPages[pageFlip].className;
			/(^|\s)swipeview-loading(\s|$)/.test(className) || (this.masterPages[pageFlip].className = !className ? 'swipeview-loading' : className + ' swipeview-loading');
			
			pageFlipIndex = pageFlipIndex - Math.floor(pageFlipIndex / this.options.numberOfPages) * this.options.numberOfPages;
			this.masterPages[pageFlip].dataset.upcomingPageIndex = pageFlipIndex;		// Index to be loaded in the newly flipped page

			newX = -this.page * this.pageWidth;
			
			this.slider.style[transitionDuration] = Math.floor(500 * Math.abs(this.x - newX) / this.pageWidth) + 'ms';

			// Hide the next page if we decided to disable looping
			if (!this.options.loop) {
				this.masterPages[pageFlip].style.visibility = newX === 0 || newX == this.maxX ? 'hidden' : '';
			}

			if (this.x == newX) {
				this.__flip();		// If we swiped all the way long to the next page (extremely rare but still)
			} else {
				this.__pos(newX);
				if (this.options.hastyPageFlip) this.__flip();
			}
		},
		
		__flip: function () {
			this.__event('flip');

			for (var i=0; i<3; i++) {
				this.masterPages[i].className = this.masterPages[i].className.replace(/(^|\s)swipeview-loading(\s|$)/, '');		// Remove the loading class
				this.masterPages[i].dataset.pageIndex = this.masterPages[i].dataset.upcomingPageIndex;
			}
		},
		
		__event: function (type) {
			var ev = document.createEvent("Event");
			
			ev.initEvent('swipeview-' + type, true, true);

			this.wrapper.dispatchEvent(ev);
		}
	};

	function prefixStyle (style) {
		if ( vendor === '' ) return style;

		style = style.charAt(0).toUpperCase() + style.substr(1);
		return vendor + style;
	}

	return SwipeView;
})(window, document);
/*
  honeybadger-js
  A JavaScript Notifier for Honeybadger
  https://github.com/honeybadger-io/honeybadger-js
  https://www.honeybadger.io/
  MIT license
*/

(function() {
/*
 TraceKit - Cross brower stack traces - github.com/occ/TraceKit
 MIT license
*/

;(function(window, undefined) {


var TraceKit = {};
var _oldTraceKit = window.TraceKit;

// global reference to slice
var _slice = [].slice;
var UNKNOWN_FUNCTION = '?';


/**
 * _has, a better form of hasOwnProperty
 * Example: _has(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
function _has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function _isUndefined(what) {
    return typeof what === 'undefined';
}

/**
 * TraceKit.noConflict: Export TraceKit out to another variable
 * Example: var TK = TraceKit.noConflict()
 */
TraceKit.noConflict = function noConflict() {
    window.TraceKit = _oldTraceKit;
    return TraceKit;
};

/**
 * TraceKit.wrap: Wrap any function in a TraceKit reporter
 * Example: func = TraceKit.wrap(func);
 *
 * @param {Function} func Function to be wrapped
 * @return {Function} The wrapped func
 */
TraceKit.wrap = function traceKitWrapper(func) {
    function wrapped() {
        try {
            return func.apply(this, arguments);
        } catch (e) {
            TraceKit.report(e);
            throw e;
        }
    }
    return wrapped;
};

/**
 * TraceKit.report: cross-browser processing of unhandled exceptions
 *
 * Syntax:
 *   TraceKit.report.subscribe(function(stackInfo) { ... })
 *   TraceKit.report.unsubscribe(function(stackInfo) { ... })
 *   TraceKit.report(exception)
 *   try { ...code... } catch(ex) { TraceKit.report(ex); }
 *
 * Supports:
 *   - Firefox: full stack trace with line numbers, plus column number
 *              on top frame; column number is not guaranteed
 *   - Opera:   full stack trace with line and column numbers
 *   - Chrome:  full stack trace with line and column numbers
 *   - Safari:  line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *   - IE:      line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *
 * In theory, TraceKit should work on all of the following versions:
 *   - IE5.5+ (only 8.0 tested)
 *   - Firefox 0.9+ (only 3.5+ tested)
 *   - Opera 7+ (only 10.50 tested; versions 9 and earlier may require
 *     Exceptions Have Stacktrace to be enabled in opera:config)
 *   - Safari 3+ (only 4+ tested)
 *   - Chrome 1+ (only 5+ tested)
 *   - Konqueror 3.5+ (untested)
 *
 * Requires TraceKit.computeStackTrace.
 *
 * Tries to catch all unhandled exceptions and report them to the
 * subscribed handlers. Please note that TraceKit.report will rethrow the
 * exception. This is REQUIRED in order to get a useful stack trace in IE.
 * If the exception does not reach the top of the browser, you will only
 * get a stack trace from the point where TraceKit.report was called.
 *
 * Handlers receive a stackInfo object as described in the
 * TraceKit.computeStackTrace docs.
 */
TraceKit.report = (function reportModuleWrapper() {
    var handlers = [],
        lastException = null,
        lastExceptionStack = null;

    /**
     * Add a crash handler.
     * @param {Function} handler
     */
    function subscribe(handler) {
        installGlobalHandler();
        handlers.push(handler);
    }

    /**
     * Remove a crash handler.
     * @param {Function} handler
     */
    function unsubscribe(handler) {
        for (var i = handlers.length - 1; i >= 0; --i) {
            if (handlers[i] === handler) {
                handlers.splice(i, 1);
            }
        }
    }

    /**
     * Dispatch stack information to all handlers.
     * @param {Object.<string, *>} stack
     */
    function notifyHandlers(stack, windowError) {
        var exception = null;
        if (windowError && !TraceKit.collectWindowErrors) {
          return;
        }
        for (var i in handlers) {
            if (_has(handlers, i)) {
                try {
                    handlers[i].apply(null, [stack].concat(_slice.call(arguments, 2)));
                } catch (inner) {
                    exception = inner;
                }
            }
        }

        if (exception) {
            throw exception;
        }
    }

    var _oldOnerrorHandler, _onErrorHandlerInstalled;

    /**
     * Ensures all global unhandled exceptions are recorded.
     * Supported by Gecko and IE.
     * @param {string} message Error message.
     * @param {string} url URL of script that generated the exception.
     * @param {(number|string)} lineNo The line number at which the error
     * occurred.
     */
    function traceKitWindowOnError(message, url, lineNo) {
        var stack = null;

        if (lastExceptionStack) {
            TraceKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo, message);
            stack = lastExceptionStack;
            lastExceptionStack = null;
            lastException = null;
        } else {
            var location = {
                'url': url,
                'line': lineNo
            };
            location.func = TraceKit.computeStackTrace.guessFunctionName(location.url, location.line);
            location.context = TraceKit.computeStackTrace.gatherContext(location.url, location.line);
            stack = {
                'mode': 'onerror',
                'message': message,
                'url': document.location.href,
                'stack': [location],
                'useragent': navigator.userAgent
            };
        }

        notifyHandlers(stack, 'from window.onerror');

        if (_oldOnerrorHandler) {
            return _oldOnerrorHandler.apply(this, arguments);
        }

        return false;
    }

    function installGlobalHandler ()
    {
        if (_onErrorHandlerInstalled === true) {
            return;
        }
        _oldOnerrorHandler = window.onerror;
        window.onerror = traceKitWindowOnError;
        _onErrorHandlerInstalled = true;
    }

    /**
     * Reports an unhandled Error to TraceKit.
     * @param {Error} ex
     */
    function report(ex) {
        var args = _slice.call(arguments, 1);
        if (lastExceptionStack) {
            if (lastException === ex) {
                return; // already caught by an inner catch block, ignore
            } else {
                var s = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [s, null].concat(args));
            }
        }

        var stack = TraceKit.computeStackTrace(ex);
        lastExceptionStack = stack;
        lastException = ex;

        // If the stack trace is incomplete, wait for 2 seconds for
        // slow slow IE to see if onerror occurs or not before reporting
        // this exception; otherwise, we will end up with an incomplete
        // stack trace
        window.setTimeout(function () {
            if (lastException === ex) {
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [stack, null].concat(args));
            }
        }, (stack.incomplete ? 2000 : 0));

        throw ex; // re-throw to propagate to the top level (and cause window.onerror)
    }

    report.subscribe = subscribe;
    report.unsubscribe = unsubscribe;
    return report;
}());

/**
 * TraceKit.computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = TraceKit.computeStackTrace.ofCaller([depth])
 *   s = TraceKit.computeStackTrace(exception) // consider using TraceKit.report instead (see below)
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
 *   s.stack[i].args     - arguments passed to the function, if known
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
 *   s.mode              - 'stack', 'stacktrace', 'multiline', 'callers', 'onerror', or 'failed' -- method used to collect the stack trace
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 *
 * Tries to guess names of anonymous functions by looking for assignments
 * in the source code. In IE and Safari, we have to guess source file names
 * by searching for function bodies inside all page scripts. This will not
 * work for scripts that are loaded cross-domain.
 * Here be dragons: some function names may be guessed incorrectly, and
 * duplicate functions may be mismatched.
 *
 * TraceKit.computeStackTrace should only be used for tracing purposes.
 * Logging of unhandled exceptions should be done with TraceKit.report,
 * which builds on top of TraceKit.computeStackTrace and provides better
 * IE support by utilizing the window.onerror event to retrieve information
 * about the top of the stack.
 *
 * Note: In IE and Safari, no stack trace is recorded on the Error object,
 * so computeStackTrace instead walks its *own* chain of callers.
 * This means that:
 *  * in Safari, some methods may be missing from the stack trace;
 *  * in IE, the topmost function in the stack trace will always be the
 *    caller of computeStackTrace.
 *
 * This is okay for tracing (because you are likely to be calling
 * computeStackTrace from the function you want to be the topmost element
 * of the stack trace anyway), but not okay for logging unhandled
 * exceptions (because your catch block will likely be far away from the
 * inner function that actually caused the exception).
 *
 * Tracing example:
 *     function trace(message) {
 *         var stackInfo = TraceKit.computeStackTrace.ofCaller();
 *         var data = message + "\n";
 *         for(var i in stackInfo.stack) {
 *             var item = stackInfo.stack[i];
 *             data += (item.func || '[anonymous]') + "() in " + item.url + ":" + (item.line || '0') + "\n";
 *         }
 *         if (window.console)
 *             console.info(data);
 *         else
 *             alert(data);
 *     }
 */
TraceKit.computeStackTrace = (function computeStackTraceWrapper() {
    var debug = false,
        sourceCache = {};

    /**
     * Attempts to retrieve source code via XMLHttpRequest, which is used
     * to look up anonymous function names.
     * @param {string} url URL of source code.
     * @return {string} Source contents.
     */
    function loadSource(url) {
        if (!TraceKit.remoteFetching) { //Only attempt request if remoteFetching is on.
            return '';
        }
        try {
            function getXHR() {
                try {
                    return new window.XMLHttpRequest();
                } catch (e) {
                    // explicitly bubble up the exception if not found
                    return new window.ActiveXObject('Microsoft.XMLHTTP');
                }
            }

            var request = getXHR();
            request.open('GET', url, false);
            request.send('');
            return request.responseText;
        } catch (e) {
            return '';
        }
    }

    /**
     * Retrieves source code from the source code cache.
     * @param {string} url URL of source code.
     * @return {Array.<string>} Source contents.
     */
    function getSource(url) {
        if (!_has(sourceCache, url)) {
            // URL needs to be able to fetched within the acceptable domain.  Otherwise,
            // cross-domain errors will be triggered.
            var source = '';
            if (url.indexOf(document.domain) !== -1) {
                source = loadSource(url);
            }
            sourceCache[url] = source ? source.split('\n') : [];
        }

        return sourceCache[url];
    }

    /**
     * Tries to use an externally loaded copy of source code to determine
     * the name of a function by looking at the name of the variable it was
     * assigned to, if any.
     * @param {string} url URL of source code.
     * @param {(string|number)} lineNo Line number in source code.
     * @return {string} The function name, if discoverable.
     */
    function guessFunctionName(url, lineNo) {
        var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/,
            reGuessFunction = /['"]?([0-9A-Za-z$_]+)['"]?\s*[:=]\s*(function|eval|new Function)/,
            line = '',
            maxLines = 10,
            source = getSource(url),
            m;

        if (!source.length) {
            return UNKNOWN_FUNCTION;
        }

        // Walk backwards from the first line in the function until we find the line which
        // matches the pattern above, which is the function definition
        for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo - i] + line;

            if (!_isUndefined(line)) {
                if ((m = reGuessFunction.exec(line))) {
                    return m[1];
                } else if ((m = reFunctionArgNames.exec(line))) {
                    return m[1];
                }
            }
        }

        return UNKNOWN_FUNCTION;
    }

    /**
     * Retrieves the surrounding lines from where an exception occurred.
     * @param {string} url URL of source code.
     * @param {(string|number)} line Line number in source code to centre
     * around for context.
     * @return {?Array.<string>} Lines of source code.
     */
    function gatherContext(url, line) {
        var source = getSource(url);

        if (!source.length) {
            return null;
        }

        var context = [],
            // linesBefore & linesAfter are inclusive with the offending line.
            // if linesOfContext is even, there will be one extra line
            //   *before* the offending line.
            linesBefore = Math.floor(TraceKit.linesOfContext / 2),
            // Add one extra line if linesOfContext is odd
            linesAfter = linesBefore + (TraceKit.linesOfContext % 2),
            start = Math.max(0, line - linesBefore - 1),
            end = Math.min(source.length, line + linesAfter - 1);

        line -= 1; // convert to 0-based index

        for (var i = start; i < end; ++i) {
            if (!_isUndefined(source[i])) {
                context.push(source[i]);
            }
        }

        return context.length > 0 ? context : null;
    }

    /**
     * Escapes special characters, except for whitespace, in a string to be
     * used inside a regular expression as a string literal.
     * @param {string} text The string.
     * @return {string} The escaped string literal.
     */
    function escapeRegExp(text) {
        return text.replace(/[\-\[\]{}()*+?.,\\\^$|#]/g, '\\$&');
    }

    /**
     * Escapes special characters in a string to be used inside a regular
     * expression as a string literal. Also ensures that HTML entities will
     * be matched the same as their literal friends.
     * @param {string} body The string.
     * @return {string} The escaped string.
     */
    function escapeCodeAsRegExpForMatchingInsideHTML(body) {
        return escapeRegExp(body).replace('<', '(?:<|&lt;)').replace('>', '(?:>|&gt;)').replace('&', '(?:&|&amp;)').replace('"', '(?:"|&quot;)').replace(/\s+/g, '\\s+');
    }

    /**
     * Determines where a code fragment occurs in the source code.
     * @param {RegExp} re The function definition.
     * @param {Array.<string>} urls A list of URLs to search.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceInUrls(re, urls) {
        var source, m;
        for (var i = 0, j = urls.length; i < j; ++i) {
            // console.log('searching', urls[i]);
            if ((source = getSource(urls[i])).length) {
                source = source.join('\n');
                if ((m = re.exec(source))) {
                    // console.log('Found function in ' + urls[i]);

                    return {
                        'url': urls[i],
                        'line': source.substring(0, m.index).split('\n').length,
                        'column': m.index - source.lastIndexOf('\n', m.index) - 1
                    };
                }
            }
        }

        // console.log('no match');

        return null;
    }

    /**
     * Determines at which column a code fragment occurs on a line of the
     * source code.
     * @param {string} fragment The code fragment.
     * @param {string} url The URL to search.
     * @param {(string|number)} line The line number to examine.
     * @return {?number} The column number.
     */
    function findSourceInLine(fragment, url, line) {
        var source = getSource(url),
            re = new RegExp('\\b' + escapeRegExp(fragment) + '\\b'),
            m;

        line -= 1;

        if (source && source.length > line && (m = re.exec(source[line]))) {
            return m.index;
        }

        return null;
    }

    /**
     * Determines where a function was defined within the source code.
     * @param {(Function|string)} func A function reference or serialized
     * function definition.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceByFunctionBody(func) {
        var urls = [window.location.href],
            scripts = document.getElementsByTagName('script'),
            body,
            code = '' + func,
            codeRE = /^function(?:\s+([\w$]+))?\s*\(([\w\s,]*)\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            eventRE = /^function on([\w$]+)\s*\(event\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            re,
            parts,
            result;

        for (var i = 0; i < scripts.length; ++i) {
            var script = scripts[i];
            if (script.src) {
                urls.push(script.src);
            }
        }

        if (!(parts = codeRE.exec(code))) {
            re = new RegExp(escapeRegExp(code).replace(/\s+/g, '\\s+'));
        }

        // not sure if this is really necessary, but I don’t have a test
        // corpus large enough to confirm that and it was in the original.
        else {
            var name = parts[1] ? '\\s+' + parts[1] : '',
                args = parts[2].split(',').join('\\s*,\\s*');

            body = escapeRegExp(parts[3]).replace(/;$/, ';?'); // semicolon is inserted if the function ends with a comment.replace(/\s+/g, '\\s+');
            re = new RegExp('function' + name + '\\s*\\(\\s*' + args + '\\s*\\)\\s*{\\s*' + body + '\\s*}');
        }

        // look for a normal function definition
        if ((result = findSourceInUrls(re, urls))) {
            return result;
        }

        // look for an old-school event handler function
        if ((parts = eventRE.exec(code))) {
            var event = parts[1];
            body = escapeCodeAsRegExpForMatchingInsideHTML(parts[2]);

            // look for a function defined in HTML as an onXXX handler
            re = new RegExp('on' + event + '=[\\\'"]\\s*' + body + '\\s*[\\\'"]', 'i');

            if ((result = findSourceInUrls(re, urls[0]))) {
                return result;
            }

            // look for ???
            re = new RegExp(body);

            if ((result = findSourceInUrls(re, urls))) {
                return result;
            }
        }

        return null;
    }

    // Contents of Exception in various browsers.
    //
    // SAFARI:
    // ex.message = Can't find variable: qq
    // ex.line = 59
    // ex.sourceId = 580238192
    // ex.sourceURL = http://...
    // ex.expressionBeginOffset = 96
    // ex.expressionCaretOffset = 98
    // ex.expressionEndOffset = 98
    // ex.name = ReferenceError
    //
    // FIREFOX:
    // ex.message = qq is not defined
    // ex.fileName = http://...
    // ex.lineNumber = 59
    // ex.stack = ...stack trace... (see the example below)
    // ex.name = ReferenceError
    //
    // CHROME:
    // ex.message = qq is not defined
    // ex.name = ReferenceError
    // ex.type = not_defined
    // ex.arguments = ['aa']
    // ex.stack = ...stack trace...
    //
    // INTERNET EXPLORER:
    // ex.message = ...
    // ex.name = ReferenceError
    //
    // OPERA:
    // ex.message = ...message... (see the example below)
    // ex.name = ReferenceError
    // ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
    // ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

    /**
     * Computes stack trace information from the stack property.
     * Chrome and Gecko use this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStackProp(ex) {
        if (!ex.stack) {
            return null;
        }

        var chrome = /^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?((?:file|http|https):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            gecko = /^\s*(\S*)(?:\((.*?)\))?@((?:file|http|https).*?):(\d+)(?::(\d+))?\s*$/i,
            lines = ex.stack.split('\n'),
            stack = [],
            parts,
            element,
            reference = /^(.*) is undefined$/.exec(ex.message);

        for (var i = 0, j = lines.length; i < j; ++i) {
            if ((parts = gecko.exec(lines[i]))) {
                element = {
                    'url': parts[3],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'args': parts[2] ? parts[2].split(',') : '',
                    'line': +parts[4],
                    'column': parts[5] ? +parts[5] : null
                };
            } else if ((parts = chrome.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
            } else {
                continue;
            }

            if (!element.func && element.line) {
                element.func = guessFunctionName(element.url, element.line);
            }

            if (element.line) {
                element.context = gatherContext(element.url, element.line);
            }

            stack.push(element);
        }

        if (stack[0] && stack[0].line && !stack[0].column && reference) {
            stack[0].column = findSourceInLine(reference[1], stack[0].url, stack[0].line);
        }

        if (!stack.length) {
            return null;
        }

        return {
            'mode': 'stack',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * Computes stack trace information from the stacktrace property.
     * Opera 10 uses this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStacktraceProp(ex) {
        // Access and store the stacktrace property before doing ANYTHING
        // else to it because Opera is not very good at providing it
        // reliably in other circumstances.
        var stacktrace = ex.stacktrace;

        var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\((.*)\) in (.*):\s*$/i,
            lines = stacktrace.split('\n'),
            stack = [],
            parts;

        for (var i = 0, j = lines.length; i < j; i += 2) {
            if ((parts = testRE.exec(lines[i]))) {
                var element = {
                    'line': +parts[1],
                    'column': +parts[2],
                    'func': parts[3] || parts[4],
                    'args': parts[5] ? parts[5].split(',') : [],
                    'url': parts[6]
                };

                if (!element.func && element.line) {
                    element.func = guessFunctionName(element.url, element.line);
                }
                if (element.line) {
                    try {
                        element.context = gatherContext(element.url, element.line);
                    } catch (exc) {}
                }

                if (!element.context) {
                    element.context = [lines[i + 1]];
                }

                stack.push(element);
            }
        }

        if (!stack.length) {
            return null;
        }

        return {
            'mode': 'stacktrace',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * NOT TESTED.
     * Computes stack trace information from an error message that includes
     * the stack trace.
     * Opera 9 and earlier use this method if the option to show stack
     * traces is turned on in opera:config.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack information.
     */
    function computeStackTraceFromOperaMultiLineMessage(ex) {
        // Opera includes a stack trace into the exception message. An example is:
        //
        // Statement on line 3: Undefined variable: undefinedFunc
        // Backtrace:
        //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
        //         undefinedFunc(a);
        //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
        //           zzz(x, y, z);
        //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
        //           yyy(a, a, a);
        //   Line 1 of function script
        //     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
        //   ...

        var lines = ex.message.split('\n');
        if (lines.length < 4) {
            return null;
        }

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE3 = /^\s*Line (\d+) of function script\s*$/i,
            stack = [],
            scripts = document.getElementsByTagName('script'),
            inlineScriptBlocks = [],
            parts,
            i,
            len,
            source;

        for (i in scripts) {
            if (_has(scripts, i) && !scripts[i].src) {
                inlineScriptBlocks.push(scripts[i]);
            }
        }

        for (i = 2, len = lines.length; i < len; i += 2) {
            var item = null;
            if ((parts = lineRE1.exec(lines[i]))) {
                item = {
                    'url': parts[2],
                    'func': parts[3],
                    'line': +parts[1]
                };
            } else if ((parts = lineRE2.exec(lines[i]))) {
                item = {
                    'url': parts[3],
                    'func': parts[4]
                };
                var relativeLine = (+parts[1]); // relative to the start of the <SCRIPT> block
                var script = inlineScriptBlocks[parts[2] - 1];
                if (script) {
                    source = getSource(item.url);
                    if (source) {
                        source = source.join('\n');
                        var pos = source.indexOf(script.innerText);
                        if (pos >= 0) {
                            item.line = relativeLine + source.substring(0, pos).split('\n').length;
                        }
                    }
                }
            } else if ((parts = lineRE3.exec(lines[i]))) {
                var url = window.location.href.replace(/#.*$/, ''),
                    line = parts[1];
                var re = new RegExp(escapeCodeAsRegExpForMatchingInsideHTML(lines[i + 1]));
                source = findSourceInUrls(re, [url]);
                item = {
                    'url': url,
                    'line': source ? source.line : line,
                    'func': ''
                };
            }

            if (item) {
                if (!item.func) {
                    item.func = guessFunctionName(item.url, item.line);
                }
                var context = gatherContext(item.url, item.line);
                var midline = (context ? context[Math.floor(context.length / 2)] : null);
                if (context && midline.replace(/^\s*/, '') === lines[i + 1].replace(/^\s*/, '')) {
                    item.context = context;
                } else {
                    // if (context) alert("Context mismatch. Correct midline:\n" + lines[i+1] + "\n\nMidline:\n" + midline + "\n\nContext:\n" + context.join("\n") + "\n\nURL:\n" + item.url);
                    item.context = [lines[i + 1]];
                }
                stack.push(item);
            }
        }
        if (!stack.length) {
            return null; // could not parse multiline exception message as Opera stack trace
        }

        return {
            'mode': 'multiline',
            'name': ex.name,
            'message': lines[0],
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * Adds information about the first frame to incomplete stack traces.
     * Safari and IE require this to get complete data on the first frame.
     * @param {Object.<string, *>} stackInfo Stack trace information from
     * one of the compute* methods.
     * @param {string} url The URL of the script that caused an error.
     * @param {(number|string)} lineNo The line number of the script that
     * caused an error.
     * @param {string=} message The error generated by the browser, which
     * hopefully contains the name of the object that caused the error.
     * @return {boolean} Whether or not the stack information was
     * augmented.
     */
    function augmentStackTraceWithInitialElement(stackInfo, url, lineNo, message) {
        var initial = {
            'url': url,
            'line': lineNo
        };

        if (initial.url && initial.line) {
            stackInfo.incomplete = false;

            if (!initial.func) {
                initial.func = guessFunctionName(initial.url, initial.line);
            }

            if (!initial.context) {
                initial.context = gatherContext(initial.url, initial.line);
            }

            var reference = / '([^']+)' /.exec(message);
            if (reference) {
                initial.column = findSourceInLine(reference[1], initial.url, initial.line);
            }

            if (stackInfo.stack.length > 0) {
                if (stackInfo.stack[0].url === initial.url) {
                    if (stackInfo.stack[0].line === initial.line) {
                        return false; // already in stack trace
                    } else if (!stackInfo.stack[0].line && stackInfo.stack[0].func === initial.func) {
                        stackInfo.stack[0].line = initial.line;
                        stackInfo.stack[0].context = initial.context;
                        return false;
                    }
                }
            }

            stackInfo.stack.unshift(initial);
            stackInfo.partial = true;
            return true;
        } else {
            stackInfo.incomplete = true;
        }

        return false;
    }

    /**
     * Computes stack trace information by walking the arguments.caller
     * chain at the time the exception occurred. This will cause earlier
     * frames to be missed but is the only way to get any stack trace in
     * Safari and IE. The top frame is restored by
     * {@link augmentStackTraceWithInitialElement}.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceByWalkingCallerChain(ex, depth) {
        var functionName = /function\s+([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)?\s*\(/i,
            stack = [],
            funcs = {},
            recursion = false,
            parts,
            item,
            source;

        for (var curr = computeStackTraceByWalkingCallerChain.caller; curr && !recursion; curr = curr.caller) {
            if (curr === computeStackTrace || curr === TraceKit.report) {
                // console.log('skipping internal function');
                continue;
            }

            item = {
                'url': null,
                'func': UNKNOWN_FUNCTION,
                'line': null,
                'column': null
            };

            if (curr.name) {
                item.func = curr.name;
            } else if ((parts = functionName.exec(curr.toString()))) {
                item.func = parts[1];
            }

            if ((source = findSourceByFunctionBody(curr))) {
                item.url = source.url;
                item.line = source.line;

                if (item.func === UNKNOWN_FUNCTION) {
                    item.func = guessFunctionName(item.url, item.line);
                }

                var reference = / '([^']+)' /.exec(ex.message || ex.description);
                if (reference) {
                    item.column = findSourceInLine(reference[1], source.url, source.line);
                }
            }

            if (funcs['' + curr]) {
                recursion = true;
            }else{
                funcs['' + curr] = true;
            }

            stack.push(item);
        }

        if (depth) {
            // console.log('depth is ' + depth);
            // console.log('stack is ' + stack.length);
            stack.splice(0, depth);
        }

        var result = {
            'mode': 'callers',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
        augmentStackTraceWithInitialElement(result, ex.sourceURL || ex.fileName, ex.line || ex.lineNumber, ex.message || ex.description);
        return result;
    }

    /**
     * Computes a stack trace for an exception.
     * @param {Error} ex
     * @param {(string|number)=} depth
     */
    function computeStackTrace(ex, depth) {
        var stack = null;
        depth = (depth == null ? 0 : +depth);

        try {
            // This must be tried first because Opera 10 *destroys*
            // its stacktrace property if you try to access the stack
            // property first!!
            stack = computeStackTraceFromStacktraceProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromStackProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromOperaMultiLineMessage(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceByWalkingCallerChain(ex, depth + 1);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        return {
            'mode': 'failed'
        };
    }

    /**
     * Logs a stacktrace starting from the previous call and working down.
     * @param {(number|string)=} depth How many frames deep to trace.
     * @return {Object.<string, *>} Stack trace information.
     */
    function computeStackTraceOfCaller(depth) {
        depth = (depth == null ? 0 : +depth) + 1; // "+ 1" because "ofCaller" should drop one frame
        try {
            throw new Error();
        } catch (ex) {
            return computeStackTrace(ex, depth + 1);
        }

        return null;
    }

    computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
    computeStackTrace.guessFunctionName = guessFunctionName;
    computeStackTrace.gatherContext = gatherContext;
    computeStackTrace.ofCaller = computeStackTraceOfCaller;

    return computeStackTrace;
}());

/**
 * Extends support for global error handling for asynchronous browser
 * functions. Adopted from Closure Library's errorhandler.js
 */
(function extendToAsynchronousCallbacks() {
    var _helper = function _helper(fnName) {
        var originalFn = window[fnName];
        window[fnName] = function traceKitAsyncExtension() {
            // Make a copy of the arguments
            var args = _slice.call(arguments);
            var originalCallback = args[0];
            if (typeof (originalCallback) === 'function') {
                args[0] = TraceKit.wrap(originalCallback);
            }
            // IE < 9 doesn't support .call/.apply on setInterval/setTimeout, but it
            // also only supports 2 argument and doesn't care what "this" is, so we
            // can just call the original function directly.
            if (originalFn.apply) {
                return originalFn.apply(this, args);
            } else {
                return originalFn(args[0], args[1]);
            }
        };
    };

    _helper('setTimeout');
    _helper('setInterval');
}());

//Default options:
if (!TraceKit.remoteFetching) {
  TraceKit.remoteFetching = true;
}
if (!TraceKit.collectWindowErrors) {
  TraceKit.collectWindowErrors = true;
}
if (!TraceKit.linesOfContext || TraceKit.linesOfContext < 1) {
  // 5 lines before, the offending line, 5 lines after
  TraceKit.linesOfContext = 11;
}



// Export to global object
window.TraceKit = TraceKit;

}(window));
// Generated by CoffeeScript 1.6.2
var Notice;

Notice = (function() {
  function Notice(options) {
    var k, v, _ref, _ref1, _ref2, _ref3, _ref4;

    this.options = options != null ? options : {};
    this.stackInfo = this.options.stackInfo || (this.options.error && TraceKit.computeStackTrace(this.options.error));
    this.trace = this._parseBacktrace((_ref = this.stackInfo) != null ? _ref.stack : void 0);
    this["class"] = (_ref1 = this.stackInfo) != null ? _ref1.name : void 0;
    this.message = (_ref2 = this.stackInfo) != null ? _ref2.message : void 0;
    this.source = this.stackInfo && this._extractSource(this.stackInfo.stack);
    this.url = document.URL;
    this.project_root = Honeybadger.configuration.project_root;
    this.environment = Honeybadger.configuration.environment;
    this.component = Honeybadger.configuration.component;
    this.action = Honeybadger.configuration.action;
    this.context = {};
    _ref3 = Honeybadger.context;
    for (k in _ref3) {
      v = _ref3[k];
      this.context[k] = v;
    }
    if (this.options.context) {
      _ref4 = this.options.context;
      for (k in _ref4) {
        v = _ref4[k];
        this.context[k] = v;
      }
    }
  }

  Notice.prototype.toJSON = function() {
    return JSON.stringify({
      notifier: {
        name: 'honeybadger.js',
        url: 'https://github.com/honeybadger-io/honeybadger-js',
        version: Honeybadger.version,
        language: 'javascript'
      },
      error: {
        "class": this["class"],
        message: this.message,
        backtrace: this.trace,
        source: this.source
      },
      request: {
        url: this.url,
        component: this.component,
        action: this.action,
        context: this.context,
        cgi_data: this._cgiData()
      },
      server: {
        project_root: this.project_root,
        environment_name: this.environment
      }
    });
  };

  Notice.prototype._parseBacktrace = function(stack) {
    var backtrace, trace, _i, _len, _ref, _ref1;

    if (stack == null) {
      stack = [];
    }
    backtrace = [];
    for (_i = 0, _len = stack.length; _i < _len; _i++) {
      trace = stack[_i];
      if ((_ref = trace.url) != null ? _ref.match(/honeybadger(?:\.min)?\.js/) : void 0) {
        continue;
      }
      backtrace.push({
        file: ((_ref1 = trace.url) != null ? _ref1.replace(Honeybadger.configuration.project_root, '[PROJECT_ROOT]') : void 0) || 'unknown',
        number: trace.line,
        method: trace.func
      });
    }
    return backtrace;
  };

  Notice.prototype._extractSource = function(stack) {
    var i, line, source, _i, _len, _ref, _ref1, _ref2;

    if (stack == null) {
      stack = [];
    }
    source = {};
    _ref2 = (_ref = (_ref1 = stack[0]) != null ? _ref1.context : void 0) != null ? _ref : [];
    for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
      line = _ref2[i];
      source[i] = line;
    }
    return source;
  };

  Notice.prototype._cgiData = function() {
    var data, k, v;

    data = {};
    for (k in navigator) {
      v = navigator[k];
      if (typeof v !== 'object') {
        data[k.split(/(?=[A-Z][a-z]*)/).join('_').toUpperCase()] = v;
      }
    }
    data['HTTP_USER_AGENT'] = data['USER_AGENT'];
    delete data['USER_AGENT'];
    if (document.referrer.match(/\S/)) {
      data['HTTP_REFERER'] = document.referrer;
    }
    return data;
  };

  return Notice;

})();
// Generated by CoffeeScript 1.6.2
var Honeybadger;

Honeybadger = (function() {
  var _this = this;

  function Honeybadger() {}

  Honeybadger.version = '0.0.2';

  Honeybadger.default_configuration = {
    api_key: null,
    host: 'api.honeybadger.io',
    ssl: true,
    project_root: window.location.protocol + '//' + window.location.host,
    environment: 'production',
    component: null,
    action: null,
    disabled: true,
    onerror: false
  };

  Honeybadger.configured = false;

  Honeybadger.configure = function(options) {
    var k, v;

    if (options == null) {
      options = {};
    }
    if (this.configured === false) {
      if (typeof options.disabled === 'undefined') {
        options['disabled'] = false;
      }
      this.configured = true;
    }
    for (k in options) {
      v = options[k];
      this.configuration[k] = v;
    }
    TraceKit.collectWindowErrors = this.configuration.onerror;
    return this;
  };

  Honeybadger.configuration = {
    reset: function() {
      var k, v, _ref;

      Honeybadger.configured = false;
      _ref = Honeybadger.default_configuration;
      for (k in _ref) {
        v = _ref[k];
        Honeybadger.configuration[k] = v;
      }
      TraceKit.collectWindowErrors = Honeybadger.configuration.onerror;
      return Honeybadger;
    }
  };

  Honeybadger.configuration.reset();

  Honeybadger.context = {};

  Honeybadger.resetContext = function(options) {
    if (options == null) {
      options = {};
    }
    this.context = options;
    return this;
  };

  Honeybadger.setContext = function(options) {
    var k, v;

    if (options == null) {
      options = {};
    }
    for (k in options) {
      v = options[k];
      this.context[k] = v;
    }
    return this;
  };

  Honeybadger.notify = function(error, options) {
    var notice;

    if (options == null) {
      options = {};
    }
    if (this.configuration.disabled === true) {
      return false;
    }
    if (error) {
      options['error'] = error;
    }
    notice = new Notice(options);
    return this._sendRequest(notice.toJSON());
  };

  Honeybadger._sendRequest = function(data) {
    var url;

    url = 'http' + ((this.configuration.ssl && 's') || '') + '://' + this.configuration.host + '/v1/notices.html';
    return this._crossDomainPost(url, data);
  };

  Honeybadger._crossDomainPost = function(url, payload) {
    var form, iframe, input, uniqueNameOfFrame;

    iframe = document.createElement('iframe');
    uniqueNameOfFrame = '_hb_' + (new Date).getTime();
    document.body.appendChild(iframe);
    iframe.style.display = 'none';
    iframe.contentWindow.name = uniqueNameOfFrame;
    form = document.createElement('form');
    form.target = uniqueNameOfFrame;
    form.action = url;
    form.method = 'POST';
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "payload";
    input.value = payload;
    form.appendChild(input);
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "api_key";
    input.value = this.configuration.api_key;
    form.appendChild(input);
    document.body.appendChild(form);
    return form.submit();
  };

  Honeybadger._handleTraceKitSubscription = function(stackInfo) {
    return Honeybadger.notify(null, {
      stackInfo: stackInfo
    });
  };

  return Honeybadger;

}).call(this);

TraceKit.report.subscribe(Honeybadger._handleTraceKitSubscription);

(typeof exports !== "undefined" && exports !== null ? exports : this).Honeybadger = Honeybadger;
}).call(this);
(function() {
  Namespace('utils');

  var scrollListenerStarted = false;
  utils.extend({
    scrollBottomListener : function(){
      if(scrollListenerStarted){
        return;
      }
      var heightBuffer = 650;
      var distanceToBottomOfScreenFn = function() {
        // Layouts with the hamburger menu scroll differently
        if ( utils.device.phone() ) {
          return $('.container-fluid-inner').height() - $('.container-fluid').scrollTop();
        } else {
          return $(document).height() - ($(window).scrollTop() + $(window).height());
        }
      };
      var galleryScrollHandler = function() {
        if($(window).data('scrollAjaxReady') == false ) return; // Only run the scroll check if we're ready to respond to it

        // Trigger the scroll:bottom event if we're close to the bottom of the screen
        // How close is determined by the heightBuffer var
        if( distanceToBottomOfScreenFn() <= heightBuffer ) {
          $(window).data('scrollAjaxReady', false);
          _e.trigger('scroll:bottom');
        }

        // show the "scroll to top" button if the page can be vertically scrolled
        if($(window).scrollTop() > 750) {
          $('.scroll-to-top').fadeIn();
        } else {
          $('.scroll-to-top').fadeOut();
        }
      };
      $('.container-fluid').scroll( galleryScrollHandler );
      $(window).scroll( galleryScrollHandler );

      scrollListenerStarted = true;
    }
  });
})();
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["shared/loading_message"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<p class=\"spindicator\">");t.b("\n" + i);t.b("  <img src=\"/style-gallery/assets/spindicator-loader.gif\" />");t.b("\n" + i);t.b("  Loading&hellip;");t.b("\n" + i);t.b("</p>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["shared/photo_guidelines"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<header class=\"header\">");t.b("\n" + i);t.b("  <div class=\"toggle-icon\">+</div>");t.b("\n" + i);t.b("  <h5>Photo Guidelines</h5>");t.b("\n" + i);t.b("</header>");t.b("\n" + i);t.b("<div class=\"photo-guidelines-body content\">");t.b("\n" + i);t.b("  <div class=\"controls\">");t.b("\n" + i);t.b("    <a class=\"arrow left-arrow\" href=\"#\" data-carousel-slide=\"prev\"></a>");t.b("\n" + i);t.b("    <a class=\"arrow right-arrow\" href=\"#\" data-carousel-slide=\"next\"></a>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("  <ul></ul>");t.b("\n" + i);t.b("  <div class=\"row\">");t.b("\n" + i);t.b("    <a class=\"view-full\" href='http://www.modcloth.com/help/community_guidelines#photo-submission'");t.b("\n" + i);t.b("      target=\"_blank\">View Full Guidelines</a>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/banner_layout"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"inner-banner\">");t.b("\n" + i);t.b("  <div class=\"title-button\"></div>");t.b("\n" + i);t.b("  <div id=\"title-text\">");t.b("\n" + i);t.b("    <div class=\"title\"></div>");t.b("\n" + i);t.b("    <div class=\"subtitle\"></div>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("  <div class=\"relationships\"></div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/follow_bar"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"header\">");t.b("\n" + i);t.b("  <div class=\"float-container\">");t.b("\n" + i);t.b("    <span class=\"glyph small-glyph\">&#xe006;</span>");t.b("\n" + i);t.b("    <span class=\"header-text\">Follow</span>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/love_button"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"love-it-button\">");t.b("\n" + i);t.b("  <div class=\"extra-love\">");t.b("\n" + i);t.b("    <div class=\"first-heart heart\">");t.b("\n" + i);t.b("      <img alt=\"Heart1\" src=\"/style-gallery/assets/heart1.png\">");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"second-heart heart\">");t.b("\n" + i);t.b("      <img alt=\"Heart2\" src=\"/style-gallery/assets/heart2.png\">");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("      <div class=\"love-button  ");t.b(t.v(t.f("state",c,p,0)));t.b("\">");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"loves-count\">");t.b("\n" + i);t.b("    ");t.b(t.v(t.f("count",c,p,0)));t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/outfit"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<a class=\"gallery-overlay-trigger\" data-id=\"");t.b(t.v(t.f("id",c,p,0)));t.b("\" href=\"#\">");t.b("\n" + i);t.b("  <span class=\"border-box outfit-image\">");t.b("\n" + i);t.b("      <span class=\"corner tl\"></span><span class=\"corner tr\"></span><span class=\"corner bl\"></span><span class=\"corner br\"></span>");t.b("\n" + i);t.b("  </span>");t.b("\n" + i);t.b("  <div class=\"shopthelook-ribbon\"></div>");t.b("\n" + i);t.b("  <span class=\"center-circle\"><div class=\"circle\"></div><div class=\"magnifying-glass\"></div></span>");t.b("\n" + i);t.b("  <img class=\"outfit-image\" alt=\"Open Outfit Link ");t.b(t.v(t.f("id",c,p,0)));t.b("\" src=\"");t.b(t.v(t.d("image.medium.url",c,p,0)));t.b("\"");t.b("\n" + i);t.b("    style=\"width: ");t.b(t.v(t.d("image.medium.width",c,p,0)));t.b("px; height: ");t.b(t.v(t.d("image.medium.height",c,p,0)));t.b("px;\" />");t.b("\n" + i);t.b("  <span class=\"share-widget-container\"></span>");t.b("\n" + i);t.b("</a>");t.b("\n" + i);t.b("<div class=\"meta-bar\">");t.b("\n" + i);t.b("  <div class=\"left\">");t.b("\n" + i);t.b("    <a href='/style-gallery/users/");t.b(t.v(t.d("contributor.id",c,p,0)));t.b("' class=\"name\">");t.b(t.v(t.d("contributor.name",c,p,0)));t.b("</a>");t.b("\n" + i);t.b("    <p class=\"upload-timestamp\">");t.b(t.v(t.f("moderatedAtTimeAgo",c,p,0)));t.b("</p>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("  <div class=\"right\">");t.b("\n" + i);t.b("    <div class=\"bb-love-button gallery-view\"></div>");t.b("\n" + i);t.b("    <div class=\"touch-share-trigger\"></div>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/outfit_detail"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"main-image\">");t.b("\n" + i);t.b("  <div class=\"main-image-container\">");t.b("\n" + i);t.b("    <img src=\"");t.b(t.v(t.d("attributes.images.large.url",c,p,0)));t.b("\" />");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");t.b("\n" + i);t.b("<div class=\"details\">");t.b("\n" + i);t.b("  <button type=\"button\" class=\"close\" data-dismiss=\"modal\" value=\"x\"></button>");t.b("\n" + i);t.b("  ");t.b("\n" + i);t.b("  <div class=\"user-details\">");t.b("\n");t.b("\n" + i);t.b("    <h3 class=\"uploader-name\">");t.b("\n" + i);t.b("      <a href='/style-gallery/users/");t.b(t.v(t.d("attributes.contributor.id",c,p,0)));t.b("'>");t.b(t.v(t.d("attributes.contributor.name",c,p,0)));t.b("</a>");t.b("\n" + i);t.b("    </h3>");t.b("\n");t.b("\n" + i);if(t.s(t.f("user_personal_website",c,p,1),c,p,0,444,645,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("      <h4 class=\"uploader-extra-info\">");t.b("\n" + i);t.b("        <a href=\"http://");t.b(t.v(t.d("attributes.contributor.personal_website_url",c,p,0)));t.b("\" target=\"_blank\">");t.b(t.v(t.d("attributes.contributor.personal_website_url",c,p,0)));t.b("</a>");t.b("\n" + i);t.b("      </h4>");t.b("\n" + i);});c.pop();}t.b("    <p class=\"date-added\">Added ");t.b(t.v(t.f("moderatedAtTimeAgo",c,p,0)));t.b(" </p>");t.b("\n" + i);t.b("    ");t.b("\n" + i);t.b("    <div class=\"widgets widgets-detail \">");t.b("\n" + i);t.b("      <div class=\"bb-love-button love-expanded\"></div>");t.b("\n" + i);t.b("      <span class=\"share-widget\"></span>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/phone/outfit_detail"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"outfit-image-container\">");t.b("\n" + i);t.b("  <ul class=\"detail-header\">");t.b("\n" + i);t.b("    <li><a href=\"#\" id=\"back-btn\"><div class=\"transparent-bg\"></div><span>&#57346;</span></a></li>");t.b("\n" + i);t.b("    <li class=\"bb-love-button detail-view\"></li>");t.b("\n" + i);t.b("    <li class=\"share-widget\"><div class=\"transparent-bg\"></div></li>");t.b("\n" + i);t.b("  </ul>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"main-image\">");t.b("\n" + i);t.b("    <img src=\"");t.b(t.v(t.d("attributes.images.large.url",c,p,0)));t.b("\" />");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);t.b("<div class=\"user-details\">");t.b("\n" + i);t.b("  <p class=\"date-added\">Added ");t.b(t.v(t.f("moderatedAtTimeAgo",c,p,0)));t.b("</p>");t.b("\n");t.b("\n" + i);t.b("  <h3 class=\"uploader-name\">");t.b("\n" + i);t.b("    <a href='/style-gallery/users/");t.b(t.v(t.d("attributes.contributor.id",c,p,0)));t.b("'>");t.b(t.v(t.d("attributes.contributor.name",c,p,0)));t.b("</a>");t.b("\n" + i);t.b("  </h3>");t.b("\n");t.b("\n" + i);t.b("  <h4 class=\"uploader-extra-info\">");t.b("\n" + i);if(t.s(t.f("user_personal_website",c,p,1),c,p,0,682,778,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("      <a href=\"http://");t.b(t.v(t.f("url",c,p,0)));t.b("\" target=\"_blank\">");t.b(t.v(t.d("attributes.personal_website_url",c,p,0)));t.b("</a>");t.b("\n" + i);});c.pop();}t.b("  </h4>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/product"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("\n" + i);t.b("<a href=\"");t.b(t.v(t.d("_links.html",c,p,0)));t.b("\" id=\"open-product-");t.b(t.v(t.f("id",c,p,0)));t.b("\" data-analytics-click-event='user clicked product' data-analytics-context='productId: ");t.b(t.v(t.f("id",c,p,0)));t.b(", productName: \"");t.b(t.v(t.f("name",c,p,0)));t.b("\"' target=\"");t.b(t.v(t.f("clickTarget",c,p,0)));t.b("\">");t.b("\n" + i);t.b("  <div class=\"product-image-container\">");t.b("\n" + i);t.b("    <img src=\"");t.b(t.v(t.d("images.small.url",c,p,0)));t.b("\" name=\"Catalog Product ");t.b(t.v(t.f("id",c,p,0)));t.b("\"/>");t.b("\n" + i);if(t.s(t.f("picturedItem",c,p,1),c,p,0,529,582,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("      <h3 class=\"pictured-ribbon\">Pictured</h3>");t.b("\n" + i);});c.pop();}if(!t.s(t.f("picturedItem",c,p,1),c,p,1,0,0,"")){t.b("      <h3 class=\"inspired-ribbon\">Similar</h3>");t.b("\n" + i);};t.b("  </div>");t.b("\n" + i);t.b("  <p class=\"name\"><strong>");t.b(t.v(t.f("name",c,p,0)));t.b("</strong></p>");t.b("\n" + i);t.b("  <div class=\"price-availability\">");t.b("\n" + i);if(t.s(t.f("price",c,p,1),c,p,0,799,1253,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("      <div class=\"product-price-container\">");t.b("\n" + i);if(!t.s(t.f("archived",c,p,1),c,p,1,0,0,"")){if(!t.s(t.f("out_of_stock",c,p,1),c,p,1,0,0,"")){if(t.s(t.f("on_sale",c,p,1),c,p,0,918,1068,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("                <span class=\"price list-price\">");t.b(t.v(t.f("price",c,p,0)));t.b("</span>");t.b("\n" + i);t.b("                <span class=\"price sale-price\">");t.b(t.v(t.f("sale_price",c,p,0)));t.b("</span>");t.b("\n" + i);});c.pop();}if(!t.s(t.f("on_sale",c,p,1),c,p,1,0,0,"")){t.b("                <span class=\"price\">");t.b(t.v(t.f("price",c,p,0)));t.b("</span>");t.b("\n" + i);};};};t.b("      </div>");t.b("\n" + i);});c.pop();}t.b("    <div class=\"product-availability-container\">");t.b("\n" + i);if(!t.s(t.f("archived",c,p,1),c,p,1,0,0,"")){if(t.s(t.f("scarce_on_hand",c,p,1),c,p,0,1360,1513,"{{ }}")){t.rs(c,p,function(c,p,t){if(!t.s(t.f("out_of_stock",c,p,1),c,p,1,0,0,"")){t.b("                <span class=\"availability scarce\">");t.b(t.v(t.f("scarce_on_hand",c,p,0)));t.b(" LEFT!</span>");t.b("\n" + i);};});c.pop();}if(t.s(t.f("out_of_stock",c,p,1),c,p,0,1558,1694,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("            <span class=\"availability out-of-stock\">OUT OF STOCK</span>");t.b("\n" + i);t.b("            <span class=\"need-it-cta\">I Need It!<span>");t.b("\n" + i);});c.pop();}};if(t.s(t.f("archived",c,p,1),c,p,0,1751,1826,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("        <span class=\"no-longer-available\">NO LONGER AVAILABLE<span>");t.b("\n" + i);});c.pop();}t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</a>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/shop_the_look"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"shop-the-look-inner\">");t.b("\n" + i);t.b("  <h3 class=\"title\">Shop the Look</h3>");t.b("\n" + i);if(t.s(t.f("displayViewSwitcher",c,p,1),c,p,0,99,439,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("    <ul id=\"view-switcher\">");t.b("\n" + i);t.b("      <li>View</li>");t.b("\n" + i);t.b("      <li>");t.b("\n" + i);t.b("        <a href=\"#\" data-view-type=\"grid\" class=\"grid-toggle\"><img src=\"/style-gallery/assets/grid-icon.png\" /></a>");t.b("\n" + i);t.b("      </li>");t.b("\n" + i);t.b("      <li>");t.b("\n" + i);t.b("        <a href=\"#\"  data-view-type=\"list\" class=\"grid-toggle\"><img src=\"/style-gallery/assets/list-icon.png\" /></a>");t.b("\n" + i);t.b("      </li>");t.b("\n" + i);t.b("    </ul>");t.b("\n" + i);});c.pop();}t.b("\n" + i);t.b("  <div class=\"product-list carousel slide clearfix\" data-interval=\"false\">");t.b("\n" + i);t.b("    <div class=\"carousel-inner\"></div>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);if(t.s(t.f("displayNavigation",c,p,1),c,p,0,617,825,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("  <div class='navigation carousel-controls'>");t.b("\n" + i);t.b("    <a class=\"arrow left-arrow\" href=\".product-list\" data-slide=\"prev\"></a>");t.b("\n" + i);t.b("    <a class=\"arrow right-arrow\" href=\".product-list\" data-slide=\"next\"></a>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);});c.pop();}return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/sliver"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"toggle-icon\" id=\"sliver-toggle-icon\">&#8211;</div>");t.b("\n" + i);t.b("<div class=\"header\" id=\"sliver-header\"></div>");t.b("\n" + i);t.b("<div class=\"content\" id=\"sliver-content\"></div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/subtitle"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b(t.t(t.f("subtitle",c,p,0)));t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/tag"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<a href=\"");t.b(t.v(t.f("url",c,p,0)));t.b("\">");t.b("\n" + i);if(t.s(t.f("colorTag",c,p,1),c,p,0,34,72,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("  <div class=\"");t.b(t.v(t.f("colorTag",c,p,0)));t.b("\"></div>");t.b("\n" + i);});c.pop();}t.b("  ");t.b(t.v(t.f("name",c,p,0)));t.b("\n" + i);t.b("</a>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/title_banner"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("Style Gallery");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/title_button"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<span class=\"");t.b(t.v(t.f("iconClass",c,p,0)));t.b("\"></span>");t.b(t.v(t.f("label",c,p,0)));t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/upload_bar"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"header\">");t.b("\n" + i);t.b("  <h4 class=\"header-text\">Add Your Photo</h4>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);t.b("<div class=\"toggle-icon glyph\" id=\"upload-bar-toggle-icon\">&#xe006</div>");t.b("\n" + i);t.b("<div id=\"upload-bar-content\" class=\"content\">");t.b("\n" + i);t.b("  <div class=\"inner\">");t.b("\n" + i);t.b("    <button class=\"mc-button jumbo-btn instagram-button\" data-button-text=\"Add from Instagram\">");t.b("\n" + i);t.b("      <span>Add from Instagram</span>");t.b("\n" + i);t.b("    </button>");t.b("\n");t.b("\n" + i);t.b("    <form accept-charset=\"UTF-8\" action=\"");t.b(t.v(t.f("formAction",c,p,0)));t.b("\"");t.b("\n" + i);t.b("      class=\"submit-photo-form\" enctype=\"multipart/form-data\" method=\"post\" id=\"mobile-fileupload\">");t.b("\n" + i);t.b("      <div class='form-extras' style=\"margin:0;padding:0;display:inline\">");t.b("\n" + i);t.b("        <input name=\"utf8\" type=\"hidden\" value=\"✓\">");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("      <button class=\"upload fileinput-button mc-button jumbo-btn ");t.b(t.v(t.f("hasUserClass",c,p,0)));t.b(" phone-button\" data-button-text=\"Add from Your Device\">");t.b("\n" + i);t.b("        <span>Add from Your Device</span>");t.b("\n" + i);t.b("        <input id=\"mobile_outfit_image\" name=\"outfit[image_attributes][media]\" type=\"file\">");t.b("\n" + i);t.b("      </button>");t.b("\n" + i);t.b("    </form>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("  <div class=\"errors\"></div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["gallery/upload_bar_errors"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<ul>");t.b("\n" + i);if(t.s(t.f("errors",c,p,1),c,p,0,18,66,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("  <li><strong>");t.b(t.v(t.f("prefix",c,p,0)));t.b("</strong> ");t.b(t.v(t.d(".",c,p,0)));t.b("</li>");t.b("\n" + i);});c.pop();}t.b("</ul>");t.b("\n" + i);t.b("<a href=\"#\" class=\"close\">&#57352;</a>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/bail_upload"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"exit-confirmation-header\">");t.b("\n" + i);t.b("  <a href=\"#\" class=\"go-back-btn no-btn intercept-link\" data-wizard-intercept-go-back=\"true\">&laquo; Continue editing</a>");t.b("\n" + i);t.b("  <a href=\"#\" class=\"close-btn intercept-link\" data-wizard-intercept-go-back=\"true\"></a>");t.b("\n" + i);t.b("</div>");t.b("\n");t.b("\n" + i);t.b("<h2>Wanna submit this photo before you leave?</h2>");t.b("\n" + i);t.b("<p>We'll save your place if you'd rather continue later.</p>");t.b("\n");t.b("\n" + i);t.b("<div class=\"exit-confirmation-buttons\">");t.b("\n" + i);t.b("  <a href=\"#\" class=\"mc-button save-it-button intercept-link\" data-wizard-intercept-abort=\"true\"><span>No</span>, Save For Later</a>");t.b("\n" + i);t.b("  <a href=\"#\" class=\"mc-button submit-it-button intercept-link\" data-wizard-intercept-finish=\"true\"><span>Yes</span>, Submit My Photo</a>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/base"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"base\"></div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/catalog_product"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<a href='#' class='assign-product-link' >");t.b("\n" + i);t.b("  <img src='");t.b(t.v(t.f("image",c,p,0)));t.b("' alt='Catalog Product ");t.b(t.v(t.f("id",c,p,0)));t.b("'/>");t.b("\n" + i);t.b("</a>");t.b("\n" + i);if(t.s(t.f("archived",c,p,1),c,p,0,118,152,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("  <p>No longer</br>available</p>");t.b("\n" + i);});c.pop();}return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/choose_file"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div id=\"upload-header-container\">");t.b("\n" + i);t.b("  <div id=\"upload-header-container\">");t.b("\n" + i);t.b("  <div class=\"modal-header header-steps\">");t.b("\n" + i);t.b("    <div class=\"steps\">");t.b("\n" + i);t.b("      <ul class=\"upload-photo-steps\">");t.b("\n" + i);t.b("        <li class=\"add-photo active\">");t.b("\n" + i);t.b("          <p>Add Your Photo</p>");t.b("\n" + i);t.b("        </li>");t.b("\n" + i);t.b("        <li class=\"recreate-the-look\">");t.b("\n" + i);t.b("          <p>Recreate the Look</p>");t.b("\n" + i);t.b("        </li>");t.b("\n" + i);t.b("      </ul>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"close-icon\">");t.b("\n" + i);t.b("      <button class=\"close\" data-wizard-previous=\"true\" value=\"close\"></button>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);t.b("</div>");t.b("\n");t.b("\n" + i);t.b("<div class=\"upload-photo-container clearfix\">");t.b("\n");t.b("\n" + i);t.b("  <div class=\"submit-photo-left-container\">");t.b("\n" + i);t.b("    <div class=\"submit-photo-container\">");t.b("\n" + i);t.b("      <p class=\"submit-photo-title\">Choose Your Photo</p>");t.b("\n");t.b("\n" + i);if(t.s(t.f("showErrors",c,p,1),c,p,0,727,1007,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("        <h3 class=\"error-title\">Uh oh!  There were some problems with your photo.</h3>       ");t.b("\n" + i);t.b("        <div class=\"outfit-upload-errors\">");t.b("\n" + i);t.b("          <ul class=\"errors\">");t.b("\n" + i);if(t.s(t.f("errors",c,p,1),c,p,0,918,958,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("            <li>");t.b(t.v(t.d(".",c,p,0)));t.b("</li>");t.b("\n" + i);});c.pop();}t.b("          </ul>");t.b("\n" + i);t.b("        </div>");t.b("\n" + i);});c.pop();}t.b("      ");t.b("\n" + i);t.b("      <form accept-charset=\"UTF-8\" action=\"");t.b(t.v(t.f("formAction",c,p,0)));t.b("\" class=\"submit-photo-form\" enctype=\"multipart/form-data\" method=\"post\" id=\"fileupload\">");t.b("\n" + i);t.b("        <div class='form-extras' style=\"margin:0;padding:0;display:inline\"><input name=\"utf8\" type=\"hidden\" value=\"✓\"><input name=\"close_path\" type=\"hidden\" value=\"");t.b(t.v(t.f("onClosePath",c,p,0)));t.b("\"></div>");t.b("\n" + i);if(t.s(t.f("loading",c,p,1),c,p,0,1388,1561,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("        <div class=\"upload-loading mc-button jumbo-btn\">");t.b("\n" + i);t.b("          <img src=\"/style-gallery/assets/loader.gif\" alt=\"\" />");t.b("\n" + i);t.b("          <p>LOADING...</p>");t.b("\n" + i);t.b("        </div>");t.b("\n" + i);});c.pop();}t.b("\n" + i);if(!t.s(t.f("loading",c,p,1),c,p,1,0,0,"")){t.b("        <span class=\"mc-button jumbo-btn fileinput-button\">");t.b("\n" + i);t.b("          <span class=\"fileupload-new\">Upload from My Computer</span>");t.b("\n" + i);t.b("          <input id=\"outfit_outfit_image\" name=\"outfit[image_attributes][media]\" type=\"file\">");t.b("\n" + i);t.b("        </span>");t.b("\n" + i);};t.b("        <p class=\"file-format\">JPG or PNG</p>");t.b("\n" + i);t.b("      </form>");t.b("\n" + i);t.b("    </div>");t.b("\n");t.b("\n" + i);t.b("    <div class=\"photo-guidelines\">");t.b("\n" + i);t.b("      <a class=\"full-guidelines-link\" href=\"http://www.modcloth.com/help/community_guidelines#photo-submission\" target=\"_blank\">View Full Guidelines</a>");t.b("\n");t.b("\n" + i);t.b("      <p class=\"submit-photo-title\">Photo Guidelines</p>");t.b("\n");t.b("\n" + i);t.b("      <ul class=\"guidelines-list\">");t.b("\n" + i);t.b("        <li>We love head-to-toe shots because they show us the outstanding outfits you put together.</li>");t.b("\n" + i);t.b("        <li>We can’t accept any long distance, crowd, or overly blurry photos.</li>");t.b("\n" + i);t.b("        <li>Photos need to be at least 462 px wide.</li>");t.b("\n" + i);t.b("        <li>We moderate all user-submitted photos and captions, so please keep in mind our");t.b("\n" + i);t.b("          <a href='http://www.modcloth.com/help/community_guidelines#photo-submission' target=\"_blank\">guidelines</a>");t.b("\n" + i);t.b("          and <a href='http://www.modcloth.com/help/terms-of-use' target=\"_blank\">Terms of Use</a>.");t.b("\n" + i);t.b("        </li>");t.b("\n" + i);t.b("        <li>Don’t forget to tell your friends and family to share your shots on their social networks!</li>");t.b("\n" + i);t.b("      </ul>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"submit-photo-right-container\">");t.b("\n" + i);t.b("    <h4>Photo Tips from Our ModStylists</h4>");t.b("\n" + i);t.b("    <iframe width=\"372\" height=\"209\" src=\"http://www.youtube.com/embed/xDKdtXYoIFA\"  frameborder=\"0\" allowfullscreen></iframe>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");t.b("\n" + i);t.b("<div id=\"closet-container\" class=\"hide\">");t.b("\n" + i);t.b("  <p><strong>Your Closet</strong> This area contains the photos you haven't submitted yet. Select one to continue!</p>");t.b("\n" + i);t.b("  <div class=\"closet-outfits-container\"></div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/closet_outfit"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<li>");t.b("\n" + i);t.b("  <img src='");t.b(t.v(t.d("images.medium.url",c,p,0)));t.b("' data-id='");t.b(t.v(t.f("id",c,p,0)));t.b("' data-height='");t.b(t.v(t.d("images.medium.height",c,p,0)));t.b("' data-width='");t.b(t.v(t.d("images.medium.width",c,p,0)));t.b("' />");t.b("\n" + i);t.b("  <span class='remove-item'></span>");t.b("\n" + i);t.b("</li>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/confirmation"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"modal-header high-five-header\">");t.b("\n" + i);t.b("  <h2><span>High five!</span> Your photo has been succesfully uploaded.</h2>");t.b("\n" + i);t.b("  <div class=\"modal-header\" style=\"border-width:0\">");t.b("\n" + i);t.b("    <button type=\"button\" id=\"close-hi-five\" class=\"close hi-five\" data-dismiss=\"modal\" data-wizard-next=\"true\" value=\"\"></button>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);t.b("<div class=\"modal-content high-five-body\">");t.b("\n" + i);t.b("  <div class=\"submitted\">");t.b("\n" + i);t.b("    <p class='what-now'><strong>What now?</strong></p>");t.b("\n" + i);t.b("    <p>Our ModCommunity Hosts will double-check that it follows our Photo Guidelines.<br/>It should appear within 24-48 hours.</p>");t.b("\n" + i);t.b("    <div class=\"photo-steps-container\">");t.b("\n" + i);t.b("      <ul class='photo-steps'>");t.b("\n" + i);t.b("        <li class=\"your-photo\">");t.b("\n" + i);t.b("          <img src=\"");t.b(t.v(t.d("images.medium.url",c,p,0)));t.b("\" />");t.b("\n" + i);t.b("        </li>");t.b("\n" + i);t.b("        <li class=\"transistion\"></li>");t.b("\n" + i);t.b("        <li class=\"moderation\"></li>");t.b("\n" + i);t.b("        <li class=\"approval\"></li>");t.b("\n" + i);t.b("      </ul>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"meanwhile\">");t.b("\n" + i);t.b("      <h2>In the meantime, why don't you:</h2>");t.b("\n" + i);t.b("      <div class=\"next-steps\">");t.b("\n" + i);t.b("        <p>");t.b("\n" + i);t.b("          <img src=\"/style-gallery/assets/globe.png\" alt=\"\" />");t.b("\n" + i);t.b("          Include a link to your personal website or blog. <a href=\"");t.b(t.v(t.f("editAccountURL",c,p,0)));t.b("\" target=\"_blank\">Update Your Account &raquo;</a></p>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/confirmation_mobile"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"modal-header-directions\">");t.b("\n" + i);t.b("  <div class=\"header-directions-body\">");t.b("\n" + i);t.b("    <h4>Your photo has been submitted for review!</h4>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("  <div class=\"close-icon\">");t.b("\n" + i);t.b("    <button class=\"close mobile-preview-cancel\" data-dismiss=\"modal\" data-wizard-next=\"true\"></button>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);t.b("<p>It should appear within 24-48 hours.</p>");t.b("\n" + i);t.b("<div class=\"modal-header\" style=\"border-width:0\">");t.b("\n" + i);t.b("  <button id=\"close-hi-five\" class=\"close hi-five\" data-dismiss=\"modal\" data-wizard-next=\"true\"></button>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);t.b("<div class=\"outfit-photo\">");t.b("\n" + i);t.b("  <img src=\"");t.b(t.v(t.d("images.medium.url",c,p,0)));t.b("\" />");t.b("\n" + i);t.b("  <span class=\"ribbon ribbon-3d-simple\">Pending approval</span>");t.b("\n" + i);t.b("</div>");t.b("\n" + i);t.b("<a class=\"mc-button jumbo-btn\" href=\"");t.b(t.v(t.f("galleryURL",c,p,0)));t.b("\">Go Back to the Style Gallery</a>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/instagram-photo"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<img class=\"thumb\" src=\"");t.b(t.v(t.f("image",c,p,0)));t.b("\"/>");t.b("\n" + i);t.b("<span class=\"border\"></span>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/instagram"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"modal-header modal-header-directions\">");t.b("\n" + i);t.b("  <div class=\"header-directions-body\">");t.b("\n" + i);t.b("    <h4>Choose It</h4>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("  <div class=\"close-icon\">");t.b("\n" + i);t.b("    <button class=\"close cancel\"></button>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");t.b("\n" + i);t.b("<div class=\"row\">");t.b("\n" + i);t.b("  <div class=\"photo-guidelines\"></div>");t.b("\n" + i);t.b("</div>");t.b("\n");t.b("\n" + i);t.b("<div class=\"photos loading\">");t.b("\n" + i);t.b("  <div class=\"instagram-photo-sheet-viewport\"></div>");t.b("\n" + i);t.b("  <button class=\"mc-button jumbo-btn instagram-add-photo\">Add This Photo</button>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/outfit_preview"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("\n" + i);t.b("  <div class=\"modal-header modal-header-directions\">");t.b("\n" + i);t.b("    <div class=\"back-btn\">");t.b("\n" + i);t.b("      <form accept-charset=\"UTF-8\" action=\"");t.b(t.v(t.f("formAction",c,p,0)));t.b("\"");t.b("\n" + i);t.b("        class=\"submit-photo-form\" enctype=\"multipart/form-data\" method=\"post\" id=\"mobile-fileupload\">");t.b("\n" + i);t.b("        <div class='form-extras' style=\"margin:0;padding:0;display:inline\">");t.b("\n" + i);t.b("          <input name=\"utf8\" type=\"hidden\" value=\"✓\">");t.b("\n" + i);t.b("        </div>");t.b("\n" + i);t.b("        <button class=\"back-next-btn back-button mc-button fileinput-button\">");t.b("\n" + i);t.b("          &laquo; Back");t.b("\n" + i);t.b("          <input id=\"mobile_outfit_image\" name=\"outfit[image_attributes][media]\" type=\"file\">");t.b("\n" + i);t.b("        </button>");t.b("\n" + i);t.b("      </form>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"header-directions-body\">");t.b("\n" + i);t.b("      <h4>Photo Preview</h4>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"close-icon\">");t.b("\n" + i);t.b("      <button class=\"close mobile-preview-cancel\"></button>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"row\">");t.b("\n" + i);t.b("    <div class=\"photo-guidelines\"></div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"row\">");t.b("\n" + i);t.b("    <div class=\"outfit-photo\"><img src=\"");t.b(t.v(t.d("images.medium.url",c,p,0)));t.b("\"></div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"mobile-preview-controls row\">");t.b("\n" + i);t.b("    <button class=\"mc-button jumbo-btn mobile-preview-cancel\">Cancel</button>");t.b("\n" + i);t.b("    <button class=\"mc-button jumbo-btn mobile-preview-submit\" data-wizard-next=\"true\">Submit</button>");t.b("\n" + i);t.b("  </div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
        this.HoganTemplates || (this.HoganTemplates = {});
        this.HoganTemplates["upload/product_tagger"] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("  <div id=\"upload-header-container\">");t.b("\n" + i);t.b("    <div class=\"modal-header header-steps\">");t.b("\n" + i);t.b("      <div class=\"steps\">");t.b("\n" + i);t.b("        <ul class=\"upload-photo-steps\">");t.b("\n" + i);t.b("          <li class=\"add-photo\">");t.b("\n" + i);t.b("            <p>Add Your Photo</p>");t.b("\n" + i);t.b("          </li>");t.b("\n" + i);t.b("          <li class=\"recreate-the-look active\">");t.b("\n" + i);t.b("            <p>Recreate the Look</p>");t.b("\n" + i);t.b("          </li>");t.b("\n" + i);t.b("        </ul>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("      <div class=\"close-icon\">");t.b("\n" + i);t.b("        <button class=\"close\" data-wizard-previous=\"true\" value=\"close\"></button>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"modal-header modal-header-directions\">");t.b("\n" + i);t.b("    <div class=\"back-btn\">");t.b("\n" + i);t.b("      <a class=\"back-next-btn back-button mc-button\" data-wizard-previous=\"true\" href=\"#\">");t.b("\n" + i);t.b("        <span class=\"nav-icon\">");t.b("\n" + i);t.b("          &laquo;");t.b("\n" + i);t.b("        </span>");t.b("\n" + i);t.b("        Back");t.b("\n" + i);t.b("      </a>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"next-btn\">");t.b("\n" + i);t.b("      <a class=\"back-next-btn next-button mc-button\" data-wizard-next=\"true\" href=\"#\">");t.b("\n" + i);t.b("        Skip");t.b("\n" + i);t.b("        <span class=\"nav-icon\">&raquo;</span>");t.b("\n" + i);t.b("      </a>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"header-directions-body\">");t.b("\n" + i);t.b("      <h4>Add items that appear in your look.</h4>");t.b("\n" + i);t.b("      <p id=\"featured-inspired-intro\">");t.b("\n" + i);t.b("        <b>Know what?</b>");t.b("\n" + i);t.b("        You can add items that inspired your look, too.");t.b("\n" + i);t.b("      </p>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n");t.b("\n" + i);t.b("  <div class=\"row\">");t.b("\n" + i);t.b("    <div class=\"outfit-photo\"><img src=\"");t.b(t.v(t.d("images.medium.url",c,p,0)));t.b("\"><span class=\"zoom\">Zoom in</span></div>");t.b("\n" + i);t.b("    <div class=\"initial-products-area\">");t.b("\n" + i);t.b("      <h4>Nothing here yet. Click the items you want to add.</h4>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"selected-products\">");t.b("\n" + i);t.b("      <button class=\"prev\">&lt;&lt;</button>");t.b("\n" + i);t.b("      <div class=\"carousel\"></div>");t.b("\n" + i);t.b("      <div class=\"add-more-items\">");t.b("\n" + i);t.b("        <h5>Add More<br/>Items");t.b("\n" + i);t.b("        </h5>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("      <div class=\"carousel-decorator carousel-controls\">");t.b("\n" + i);t.b("        <a class=\"arrow left-arrow\" href=\"#\" data-carousel-slide=\"prev\"></a>");t.b("\n" + i);t.b("        <a class=\"arrow right-arrow\" href=\"#\" data-carousel-slide=\"next\"></a>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("      <button class=\"next\">&gt;&gt;</button>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"row\">");t.b("\n" + i);t.b("    <div class=\"span2 menu-filters\">");t.b("\n" + i);t.b("      <ul class=\"right-filters\">");t.b("\n" + i);t.b("        <li class=\"active\" data-source=\"order-history\">Your Order History</li>");t.b("\n" + i);t.b("        <li data-source=\"clothing\">Browse ModCloth</li>");t.b("\n" + i);t.b("      </ul>");t.b("\n" + i);t.b("      <input type=\"text\" id='search' placeholder=\"Ex: red shoes\" class=\"search-input-box\"/>");t.b("\n" + i);t.b("      <div class='search-btn'>");t.b("\n" + i);t.b("        <a class='search' href='#'>");t.b("\n" + i);t.b("          <i class='search-icon'></i>");t.b("\n" + i);t.b("        </a>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("      <ul class=\"search-inputs\">");t.b("\n" + i);t.b("        <li class=\"active\">Search Results</li>");t.b("\n" + i);t.b("      </ul>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <div class=\"products\">");t.b("\n" + i);t.b("      <div class=\"categories\">");t.b("\n" + i);t.b("        <ul class=\"category-btn\">");t.b("\n" + i);t.b("          <li class=\"active\" data-slug=\"clothing\">Clothing</li>");t.b("\n" + i);t.b("          <li data-slug=\"dresses\">Dresses</li>");t.b("\n" + i);t.b("          <li data-slug=\"tops\">Tops</li>");t.b("\n" + i);t.b("          <li data-slug=\"bottoms\">Bottoms</li>");t.b("\n" + i);t.b("          <li data-slug=\"outerwear\">Outerwear</li>");t.b("\n" + i);t.b("          <li data-slug=\"shoes\">Shoes</li>");t.b("\n" + i);t.b("          <li data-slug=\"accessories\">Accessories</li>");t.b("\n" + i);t.b("        </ul>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("      <h4 class=\"no-products-msg\"></h4>");t.b("\n" + i);t.b("      <div class=\"unselected-products\">");t.b("\n" + i);t.b("        <ul></ul>");t.b("\n" + i);t.b("      </div>");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"row\">");t.b("\n" + i);t.b("    <div class=\"photo-guidelines\"></div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"modal-footer\">");t.b("\n" + i);t.b("    <a class=\"mc-button secondary-btn collection-prev\" href=\"#\">&laquo;</a>");t.b("\n" + i);t.b("    <a class=\"mc-button secondary-btn collection-next\" href=\"#\">&raquo;</a>");t.b("\n" + i);t.b("  </div>");t.b("\n");return t.fl(); },partials: {}, subs: {  }}, "", Hogan, {});
StyleGallery.Models.Account = Backbone.Model.extend({
  url: function() { return window.router.paths.account(); },

  initialize: function() {

    // The shared header doesn't use the backbone model but a JSON object
    // and it's looking for "name", not "firstName".
    this.set( {name: this.name()}, {silent: true});
  },

  name: function() {
    if(this.has('firstName')) {
      return this.get('firstName');
    } else {
      return 'ModLover';
    }
  },

  instagram: function() {
    return this.get('instagram');
  },

  reloadUser: function() {
    return $.post(window.router.paths.resetCurrentUser());
  }
});

StyleGallery.Models.InstagramPhoto = Backbone.Model.extend({
});
StyleGallery.Models.Outfit = StyleGalleryBase.Models.OutfitBase.extend({
  defaults: {
    "user_loved":  false,
  },

  initialize: function(attributes) {
    _.bindAll(this, '_transformImage', '_sortImages');

    this.listenTo(this, 'change:image', this._transformImage);
    this.listenTo(this, 'change:images', this._sortImages);

    if ( attributes && attributes.image ) {
      this._transformImage( this, attributes.image );
    }

    this.setUserUploaded();
  },

  url: function() { return window.router.paths.outfit(this.get('id')); },

  love: function (account_id){
      if (utils.redirectWhenSignedOut()) return;

      $.ajax({
          url: window.router.paths.loveAnOutfit(this.id),
          type: 'POST'
      });
      var accounts_with_user_id = this.get('loves').account_ids;
      accounts_with_user_id.push(account_id);
      this.set({
          user_loved: true,
          loves: {
              count: (this.get('loves').count + 1),
              account_ids: accounts_with_user_id
          }
      });
      this.triggerLove();
  },

  unLove: function(account_id){
      if (utils.redirectWhenSignedOut()) return;

      $.ajax({
          url: window.router.paths.unLoveAnOutfit(this.id),
          type: 'DELETE'
      });
      var account_ids_without_user = _.reject(this.get('loves').account_ids, function(list_account_id){
          return account_id === list_account_id;
      });
      this.set({
          user_loved: false,
          loves: {
              count: (this.get('loves').count - 1),
              account_ids: account_ids_without_user
          }
      });
      this.triggerUnlove();
  },

  triggerLove: function(){
    this.trigger('loved');
  },

  triggerUnlove: function(){
    this.trigger('unloved');
  },

  getUserLoved: function(account_id){
    return _.contains(this.get('loves').account_ids, account_id);
  },

  getUserUploaded: function(){
    if (StyleGallery.currentUser && this.get('contributor')) {
      return StyleGallery.currentUser.get('id') === this.get('contributor').id;
    } else {
      return false;
    }
  },

  setUserUploaded: function(){
    if (StyleGallery.currentUser && this.get('contributor')) {
      this.set('user_uploaded', this.getUserUploaded());
    }
  },

  getImageUrl: function(options) {
    var optimalImageSize = this._getOptimalImageSize(options);
    return optimalImageSize.url;
  },

  _getOptimalImageSize: function(opts) {
    var images = this.get('images'),
        imageSort = this.get('image_sort'),
        options = ( opts || {} ),
        original = images.original,
        constrainedDimension,
        optimalImageForDimension;

    optimalImageForDimension = function(dimension, value)  {
      var optimalImageLabel = _.find(imageSort , function(imageIdentifier) {
        return value <= images[imageIdentifier][dimension];
      });
      return images[optimalImageLabel] || original;
    };

    if ( _.has(options, 'max-width') && _.has(options, 'max-height') ) {
      constrainedDimension =
        (original.width === _.max( [original.width, original.height] ) ?
          'width' : 'height' );
      options[constrainedDimension] = options['max-' + constrainedDimension];

    } else {
      constrainedDimension = _.find( ['width', 'height'], function(dimension) {
          return options.hasOwnProperty(dimension);
        }
      );
    }

    return optimalImageForDimension(
      constrainedDimension, options[constrainedDimension] );
  },

  _sortImages: function(model, images) {
    var imageLabels = _.keys(images),
        sortedImages,
        sortedLabels;

    sortedImages = _.sortBy(images, function(img) {
      return img.width * img.height;
    });
    sortedLabels = _.map(sortedImages, function(img) {
      return imageLabels[ _.indexOf(_.toArray(images), img) ];
    });

    this.set('image_sort', sortedLabels);
  },

  /*
    The current API offers retina images as a secondary URL, without dimensions.
    This makes it difficult to sort the images by dimensions, since some of
    the images (and their dimensions) are implicit. The `_transformImages`
    function creates the `images` structure to make all image sizes explicit.

    The transformed structure also matches the public API (/api/v1/outfits) to
    make it easier to move to that in the future.
  */
  _transformImage: function(model, image) {
    if ( _.isObject(image) === false ) {
      return;
    }

    var images = {},
        imageSizes = _.keys(image.sizes),
        sizeMap = {
          'full': 'original',
          'grid': 'medium',
          'overlay': 'large'
        };

    _.each(imageSizes, function(size) {
      var key = sizeMap[size],
          img = image.sizes[size];

      images[key] = _.omit(img, 'retina');

      if ( img.hasOwnProperty('retina') ) {
        var original = image.sizes.full,
            width = _.min( [img.width * 2, original.width] ),
            height = _.min( [img.height * 2, original.height] );

        images[key + '2x'] = {
          url: img.retina,
          width: width,
          height: height
        };
      }
    });

    this.set('images', images);
  },

  parse: function(response, options) {
      if(_.has(response, 'outfit')){
        return response.outfit;
      } else {
          return response;
      }
  }

});
window.StyleGallery.Models.OutfitsLayout = Backbone.Model.extend({
/*
  This model manages the dynamic, infinite scroll layout used in the gallery.
  It's responsible for:
    - Evenly distributing outfits across the dynamic number of columns
    - Calculating and setting the scale factor used by images in the gallery

  Usage:
    To add OutfitViews to an existing layout:
      outfitCollectionLayout.flowOutfits(outfitViews);
       - Where `outfitViews` is an array of `StyleGallery.Views.OutfitView`s

    To reflow an existing layout (when container width or orientation change):
      outfitCollectionLayout.set('containerWidth', 320); // Sets width to 320
       - Layout automatically reflows outfits; no need to call anything else
*/

  defaults: {
    'containerWidth': 1034,
    'height': 0,
    'idealColumnWidth': 320,
    'marginHoriz': 15,
    'marginVert': 15
  },

  initialize: function() {
    this.stopListening(this, 'change:containerWidth', this._reflowOutfits);
    this.listenTo(this, 'change:containerWidth', this._reflowOutfits);

    this._defineProperties( this._calculatedProperties() );
    this._outfitViews = {};
    this._orderedOutfitIds = [];
  },

  flowOutfits: function(outfitViews, reset) {
    if ( reset === true ) {
      this._outfitViews = {};
      this._orderedOutfitIds = [];
    }
    _.each(outfitViews, this._positionOutfit, this);
  },

  _reflowOutfits: function() {
    var orderedViews, unsetProperty, mapOutfitIds;
    unsetProperty = function(p) { this.unset(p); };
    mapOutfitViews = function(outfitId) {
      return this._outfitViews[outfitId];
    };

    _.each(this._calculatedProperties(), unsetProperty, this);
    orderedViews = _.map(this._orderedOutfitIds, mapOutfitViews, this);
    this.flowOutfits(orderedViews, true);
  },

  _nextCoordinates: function() {
    var shortestColumn, top, left;
    shortestColumn = this._shortestColumn();
    top = this.columnHeights()[shortestColumn];
    left = shortestColumn * ( this.columnWidth() + this.get('marginHoriz') );
    return { 'top': top, 'left': left };
  },

  _incrementShortestColumn: function(incrementalHeight) {
    this.columnHeights()[this._shortestColumn()] += incrementalHeight + this.get('marginVert');
    this.set( 'height', this._getHeight() );
  },

  _containsOutfitId: function(outfitId) {
    return this._outfitViews.hasOwnProperty(outfitId);
  },

  _positionOutfit: function(outfitView) {
    var outfitId, coords;
    outfitId = outfitView.model.id;
    if ( this._containsOutfitId( outfitId ) ) {
      outfitView.$el.remove();
      return;
    }
    coords = this._nextCoordinates();
    outfitView.setPositionAndScaleFactor( coords.top, coords.left, this.scaleFactor() );
    this._incrementShortestColumn( outfitView.getHeight() );

    this._outfitViews[outfitId] = outfitView;
    this._orderedOutfitIds.push(outfitId);
  },

  _calculatedProperties: function() {
    return ['columnHeights', 'columnCount', 'columnWidth', 'scaleFactor'];
  },

  _defineProperties: function(properties) {
    var defineProperty = function(propertyName) {
      this[propertyName] = function() {
        return this._fetchProperty(propertyName);
      };
    };
    _.each(properties, defineProperty, this);
  },

  _fetchProperty: function(propertyName) {
    if ( this.has(propertyName) === false ) {
      var calcFn = '_calculate' + propertyName.charAt(0).toUpperCase() +
        propertyName.slice(1);
      this.set( propertyName, this[calcFn]() );
    }
    return this.get(propertyName);
  },

  _calculateColumnHeights: function() {
    var columnHeights = [];
    for ( var i = 0; i < this.columnCount(); i++ ) {
      columnHeights.push(0);
    }
    return columnHeights;
  },

  _calculateColumnCount: function() {
    var columns = Math.floor( this.get('containerWidth') / this.get('idealColumnWidth') );
    return (columns < 2 ? 2 : columns);
  },
  
  _calculateColumnWidth: function() {
    var totalInnerMarginWidth = this.get('marginHoriz') * (this.columnCount() - 1);
    return Math.floor( (this.get('containerWidth') - totalInnerMarginWidth) / this.columnCount() );
  },

  _calculateScaleFactor: function() {
    return this.columnWidth() / this.get('idealColumnWidth');
  },

  _shortestColumn: function() {
    var shortestHeight = _.min( this.columnHeights() );
    return _.indexOf( this.columnHeights(), shortestHeight );
  },

  _getHeight: function() {
    return _.max( this.columnHeights() );
  }
});
StyleGallery.Models.Product = Backbone.Model.extend({

  initialize: function() {
    StyleGalleryBase.Models.Lockable.mixin(this);
  },

  url: function() { return window.router.paths.cachedProduct(this.get('id')); },

  fade: function() {
    this.set({'faded':true},{silent:true});
  }
});
StyleGallery.Collections.CatalogProducts = Backbone.Paginator.requestPager.extend({
  paginator_core: {
    dataType: function() {
      var demoApi = window.initialBackboneData.apiUrl.indexOf('.demo.modcloth.com') > -1;
      if (this.slug == 'order-history' && demoApi) {
        return 'jsonp';
      } else {
        return 'json';
      }
    },
    url: function() {
      if (this.slug == 'perform-search') {
        return this.url;
      }else if (this.slug == 'order-history') {
          return this.orderHistoryApiUrl();
      } else {
        return window.router.paths.productsByCatalogSlug(this.slug);
      }
    }
  },

  paginator_ui: {
    firstPage: 1,
    currentPage: 1,
    perPage: 10
  },

  server_api: {
    'per_page': 10,
    'page': function() { return this.currentPage; }
  },

  defaultSlug: 'order-history',

  setDefaultSlug: function() {
    this.slug = this.defaultSlug;
  },

  model: StyleGallery.Models.Product,


  initialize: function(models,options) {

    options = _.defaults({
      slug: this.defaultSlug,
    });

    this.slug = options.slug;

    StyleGalleryBase.Collections.Change.mixin(this);
  },

  parse: function(response) {
    if(response && response.products) {
      return response.products;
    }
    return response;
  },

  orderHistoryApiUrl: function() {
    var url = window.initialBackboneData.apiUrl + '/api/v1/accounts/';
    if (utils.onAdminPath()) {
      url += this.userId + '/';
    }
    url += 'orders/products';
    return url;
  }
});
StyleGallery.Collections.CurrentUserClosetOutfits = Backbone.Collection.extend({
  model: StyleGallery.Models.Outfit,

  url: function() { return window.router.paths.userCloset(); },
});
StyleGallery.Collections.Outfits = Backbone.Collection.extend({
    model: StyleGallery.Models.Outfit
});
StyleGallery.Collections.PaginatedCollectionOutfits = Backbone.Paginator.requestPager.extend({

  model: StyleGallery.Models.Outfit,

  resourceUrl: function() {
    // Child Classes should override, see paginatedOutfitsbyTag
  },

  isLastPage: function() {
    return this.currentPage === this.totalPages;
  },

  paginator_core: {
    dataType: 'json',
    cache: true,
    url: function() { return this.resourceUrl(); }
  },

  paginator_ui: {
     // the lowest page index
     firstPage: 1,
     currentPage: 1,
     perPage: 6
   },

  server_api: {
    page: function() { return this.currentPage; }
  },

  parse: function(response) {
    this.perPage = response.pagination.per_page;
    this.totalPages = response.pagination.total_pages;
    this.currentPage = response.pagination.page;
    this.totalRecords = response.pagination.total_items;
    return response.outfits;
  }

});
StyleGallery.Collections.PaginatedInstagramPhotos = Backbone.Paginator.requestPager.extend({

  model: StyleGallery.Models.InstagramPhoto,

  data: [],

  paginator_core: {
    url: function() {
      var uid = StyleGallery.currentUser.instagram().uid;
      return window.router.paths.instagram.user.recent(uid);
    }
  },

  server_api: function() {
    var params = {
      'access_token': StyleGallery.currentUser.instagram().access_token,
      'count': this.perPage
    };

    if ( this.max_id ) {
      _.extend(params, {
        'max_id': this.max_id
      });
    };

    return params;
  },

  paginator_ui: {
    // the lowest page index
    firstPage: 1,
    currentPage: 1,
    perPage: 30
  },

  initialize: function() {
    StyleGalleryBase.Collections.Change.mixin(this);
  },

  parse: function(response) {
    /*
      Pagination:
      Instagram API uses `max_id` rather than `page` request params
    */
    if ( _.isEmpty(response.pagination) ) {
      this.totalPages = this.currentPage;
    } else {
      this.totalPages = this.currentPage + 1;
    }
    this.max_id = response.pagination.next_max_id;

    var photos = _.filter(response.data, function(media) {
      return media.type == 'image';
    });

    // Append data to collection
    this.data = this.data.concat(photos);
    return this.data;
  }
});
StyleGallery.Collections.PaginatedOutfits = Backbone.Paginator.requestPager.extend({

  model: StyleGallery.Models.Outfit,

  // Setting default scopes
  // active is what was used to make the last request
  // and is set here when the sort fn of the server_api
  // object is used to make the request
  activeScope: '',
  activeFilter: '',

  // selected is what the user has selected
  // and is set by the ScopeView and FilterView
  // during user interaction
  selectedScope: 'latest',
  selectedFilter: 'all',

  isLastPage: function() {
    return this.currentPage === this.totalPages;
  },

  paginator_core: {
    dataType: 'json',
    cache: true,
    url: function() { return window.router.paths.outfits(); }
  },

  paginator_ui: {
    // the lowest page index
    firstPage: 1,
    currentPage: 1,
    perPage: 6
  },

  server_api: {
    'page': function() { return this.currentPage },

    // we keep track of the activeScope so we can detect if we're already on that scope and don't need to fetch
    // see OutfitCollectionView#renderIfNewFilter
    'scope': function() { return this.activeScope = this.selectedScope },

    // we keep track of the activeFilter so we can detect if we're already on that filter and don't need to fetch
    // see OutfitCollectionView#renderIfNewFilter
    'filter': function() { return this.activeFilter = this.selectedFilter }
  },

  initialize: function() {
    StyleGalleryBase.Collections.Change.mixin(this);
  },

  parse: function(response) {
    this.perPage = response.pagination.per_page;
    this.totalPages = response.pagination.total_pages;
    this.currentPage = response.pagination.page;
    this.totalRecords = response.pagination.total_items;
    return response.outfits;
  }
});
StyleGallery.Collections.PaginatedOutfitsByContributor = StyleGallery.Collections.PaginatedCollectionOutfits.extend({
  resourceUrl: function() {
    return window.router.paths.contributorOutfits(this.contributorId);
  },

  initialize: function(options) {
    this.contributorId = options.contributorId;
    StyleGalleryBase.Collections.Change.mixin(this);
  }
});
StyleGallery.Collections.PaginatedOutfitsByTag = StyleGallery.Collections.PaginatedCollectionOutfits.extend({
  resourceUrl: function() {
    return window.router.paths.taggedOutfits(window.initialBackboneData.resourceIdentifier);
  },

  initialize: function() {
    StyleGalleryBase.Collections.Change.mixin(this);
  }
});
StyleGallery.Collections.Products = Backbone.Collection.extend({
  url: function() { return window.router.paths.productCacheApi(); },
  model: StyleGallery.Models.Product,

  initialize: function(models,options) {
    options = options || {};

    if( options.url ) {
      this.url = options.url;
    }

    StyleGalleryBase.Collections.Dirty.mixin(this);
  }
});
StyleGalleryBase.Views.CarouselView = Backbone.View.extend({

  pageSize: 1,

  isReadyForCarousel: true,

  loop: false,

  initialize: function() {

    _.bindAll(this, 'prev');
    _.bindAll(this, 'next');
    _.bindAll(this, '_onFlip');
    _.bindAll(this, 'collectionChange');
    _.bindAll(this, '_modelAdded');

    $('body').off('click', '[data-carousel-slide="prev"]', this.prev);
    $('body').on('click', '[data-carousel-slide="prev"]', this.prev);

    $('body').off('click', '[data-carousel-slide="next"]', this.next);
    $('body').on('click', '[data-carousel-slide="next"]', this.next);

    $('body').off('click', '[data-carousel-go]', this.go);
    $('body').on('click', '[data-carousel-go]', this.go);

    this.listenTo(this.collection, 'add', this._modelAdded);

    this.listenTo(this.collection, 'reset', this.collectionChange);
    this.listenTo(this.collection, 'remove', this.collectionChange);
    this.listenTo(this.collection, 'add', this.collectionChange);

    this.listenTo(this, 'carousel-view:change', this._syncCollectionPage);

  },

  collectionChange: function() {
    if (!this.isReadyForCarousel) {
      return;
    }
    if (!this._swipeview) {
      this.setupCarousel();
    } else {
      this._swipeview.updatePageCount(this._numberOfPages());
      this._swipeview.goToPage(this._swipeview.page);
      this._rerenderMasterPages();
    }
    this.trigger('carousel-view:change');
  },

  setupCarousel: function() {
    if (!this.isReadyForCarousel) {
      return;
    }
    var _swipeview = this._swipeview = new SwipeView(_.result(this,'carouselEl') || this.el, {
      numberOfPages: this._numberOfPages(),
      loop: this.loop
    });
    _swipeview.goToPage(this.collection.page || 0);

    this._rerenderMasterPages();

    _swipeview.onFlip($.proxy(this._onFlip, this));
  },

  _syncCollectionPage: function() {
    this.collection.page = this._swipeview.page;
  },

  _modelAdded: function() {
    if (!this._swipeview) {
      return;
    }
    this._swipeview.updatePageCount(this._numberOfPages());
    this._swipeview.goToPage(this._numberOfPages() - 1);
  },

  _rerenderMasterPages: function() {
    var page = this._swipeview.page;
    var currentMasterPage = this._swipeview.currentMasterPage;
    for (var i=0; i<3; i++) {
      var upcoming = this._swipeview.masterPages[i].dataset.upcomingPageIndex;
      if (upcoming == ""+page && i != currentMasterPage) {
        $(this._swipeview.masterPages[i]).html('');
      } else {
        $(this._swipeview.masterPages[i]).html('').append(this.renderPage(upcoming));
      }
    }
  },

  _onFlip: function() {
    var upcoming, pageIndex, i;
    var currentPage = this._swipeview.page;

    for (i=0; i<3; i++) {
      upcoming = this._swipeview.masterPages[i].dataset.upcomingPageIndex;
      pageIndex = this._swipeview.masterPages[i].dataset.pageIndex;

      if (upcoming == "" + currentPage && i != this._swipeview.currentMasterPage) {
        $(this._swipeview.masterPages[i]).html('');
      } else if (upcoming != pageIndex) {
        $(this._swipeview.masterPages[i]).html('').append(this.renderPage(upcoming));
      }
    }
    this.trigger('carousel-view:change');
  },

  _numberOfPages: function() {
    return Math.ceil(this.collection.size() / this.pageSize);
  },

  isFirstPage: function() {
    return this._swipeview.page == 0;
  },

  isLastPage: function() {
    return this._swipeview.page == this._numberOfPages() - 1;
  },

  prev: function(event) {
    event.preventDefault();
    if (!this._swipeview) return;
    this._swipeview.prev();
  },

  next: function(event) {
    event.preventDefault();
    if (!this._swipeview) return;
    this._swipeview.next();
  },

  go: function(event) {
    event.preventDefault();
    var to = $(event.target).data('carousel-go');
    if (!to || !this._swipeview) return;
    this._swipeview.goToPage(to);
  },

  renderPage: function(pageIndex) {
    var $pageEl = $('<div/>');
    var arrIndex = pageIndex * this.pageSize;
    var self = this;
    var item;

    _(this.collection.slice(arrIndex, arrIndex + this.pageSize)).each(function(model, i) {
      item = self.renderItem(model, i);
      $pageEl.append(item);
    });
    return $pageEl;
  },

  renderItem: function(model) {}
});
StyleGallery.Views.ShopTheLookView = Backbone.View.extend({

  className: 'shop-the-look',

  events: {
    'click .grid-toggle': 'toggleGridView'
  },


  initialize: function() {
    _dbg.log('[ShopTheLookView::initialize]');
    this.defaultViewType = 'grid';
  },

  render: function() {
    // TODO - Refactoring opportunity. There should be a base view that the desktop and phone specific views extend
    var displayNavigation, displayViewSwitcher;
    if ( utils.device.phone() ) { 
      displayNavigation = false;
      displayViewSwitcher = true;
    } else {
      displayNavigation = this.collection.length > 3;
      displayViewSwitcher = false;
    }

    var viewData = {displayNavigation: displayNavigation, displayViewSwitcher: displayViewSwitcher };
    var renderedContent = HoganTemplates['gallery/shop_the_look'].render(viewData);
    this.$el.html( renderedContent );

    if (utils.device.phone()) {
      this.renderProducts();
    } else {
      this.renderProductsCarousel();
    }

    return this;
  },

  renderProducts: function() {
    this.$('.product-list').addClass( this.defaultViewType );
    this.$('.grid-toggle[data-view-type=' + this.defaultViewType + ']').addClass('active');

    this.collection.each(function(product) {
        var productView = new StyleGallery.Views.ShopTheLookProductView({model: product});
        this.$('.product-list').append( productView.render().el );
      }, this);
  },

  renderProductsCarousel: function() {
    // Wrap every three products in a div for the carousel
    var products = [];
    this.collection.each(function(product) {
      var productView = new StyleGallery.Views.ShopTheLookProductView({model: product});
      products.push( productView.render().el );
    }, this);

     for(var i = 0; i < products.length; i+=3) {
       var div = $('<div/>', {class: 'products-page item'}).html( products.slice(i, i+3) );
       this.$('.product-list .carousel-inner').append(div);
     }
    this.$('.product-list').find('.products-page').first().addClass('active');
  },

  toggleGridView: function(event) {
    event.preventDefault();

    var $dataElement = $(event.target);
    if (event.target.tagName === 'IMG' ) { 
      $dataElement = $dataElement.parents('a');
    }

    if ( $dataElement.hasClass('active') ) { 
      // Bail here if we don't need to toggle anything
      return;
    };

    $('.grid-toggle').toggleClass('active');
    $('.product-list').attr('class', 'product-list').addClass( $dataElement.data('view-type') );

    // in order to get the grid to line up nicely, we need to make sure all the product divs
    // are the same height. I.e. they're all as tall as the tallest one.
    // Q. Why not a grid? A. i) requires extra markup not needed when the products are displayed
    // as a simple list. ii) bootstrap grid stops working on viewpoers under 724px.
    if ( $dataElement.data('view-type') === 'grid' ) { 
      var maxHeight = Math.max.apply(null, $('.product').map(function () {
        return $(this).height();
      }).get());
      $('.product').css('height', maxHeight);
    } else {
      $('.product').css('height', 'auto');
    }
  }


});
StyleGallery.Views.ClosetItemView = Backbone.Marionette.ItemView.extend({
  template: 'upload/closet_outfit',
  events: {
    'click img': 'imageClicked',
    'click .remove-item': 'removeItemClicked'
  },
  imageClicked: function(event) {
    var outfitId = this.model.get('id');
    if (outfitId) {
      window.currentWizard.data.outfitId = outfitId;
      window.currentWizard.renderNextStep();
    }
  },
  removeItemClicked: function(ev) {
    this.model.destroy();
  },
});
StyleGallery.Views.ClosetOutfitsView = Backbone.Marionette.CollectionView.extend({

  className: 'closet-outfits',
  tagName: 'ul',
  itemView: StyleGallery.Views.ClosetItemView,

  attached: false,

  initialize: function() {
    _dbg.log('[ClosetOutfitsView::initialize]');
    this.listenTo(this.collection, 'sync', this.render);
  },

  onRender: function(){
    if (this.collection.length > 0) {
      if (!this.attached) {
        this.$el.appendTo($('#closet-container .closet-outfits-container'));
        this.attached = true;
      }

      this.setScrollerWidth();

      $('#closet-container').removeClass('hide');
    } else {
      $('#closet-container').addClass('hide');
    }
  },

  onItemRemoved: function(){
    if (this.collection.length === 0) {
      $('#closet-container').addClass('hide');
    }
  },

  setScrollerWidth: function() {
    // set horizontal width for closet scroller based on size of rendered closet images
    var ulMargin = 50;
    var liWidth = 0;
    var maxHeight = 140;
    this.$('li').each(function(index, element) {
      var ratio =  maxHeight / $('img', element).data('height');
      var renderedWidth = $('img', element).data('width') * ratio;
      liWidth += Math.round( renderedWidth ) + 20; // 20px margin
    });
    var width = liWidth + ulMargin;
    this.$el.css('width', width);
  },
});
StyleGallery.Views.FilterView = Backbone.View.extend({

  tagName: 'ul',
  id: 'filters',
  selectedFilter: 'all',
  
  events: {
    'click li a': 'handleClick',
  },

  initialize: function(params) {
    _.bindAll(this, 'setSelectedFilterFromPath', 'setValidFilters');

    this.scope = params.scope;
    this.filters = this.filtersForScope(params.scope);
    this.setValidFilters( this.filters );
    this.paginator = params.paginator;

    // Override default filter when scope is loved
    if (this.scope === 'loved') { 
      this.selectedFilter = 'week';
    }
  },

  render: function() {
    var that = this;

    this.setSelectedFilterFromPath( window.location.pathname );

    if ( $('ul#filters').length > 0 ) {
      this.setElement( $('ul#filters') );
    };

    this.$el.empty();

    if (this.filters.length > 0) {

      _.each(this.filters, function(filter, index) {

        var className = '';
        if (filter.slug == that.selectedFilter) {
          className = 'active';
        };
        
        var partitionText;
        if (index > 0) {
          partitionText= '|';
        };

        that.$el.append(
          $('<li/>', {class: 'filter'}).text( partitionText ).append(
            $('<a/>', {href: window.router.paths.gallery(that.scope) + '/' + filter.slug, class: className, id: filter.slug}).text( filter.name )
          ));
      });

    }

    // This view inserts itself into the DOM after the ScopeView which is before the outfits
    $('#scopes').after(this.el);

    this.paginator.selectedFilter = this.selectedFilter;

    return this;
  },

  filtersForScope: function(scope) {
    var filters = []
    switch (scope) {
      case 'loved':
        filters = [ { name: 'All Time', slug: 'all' }, { name: 'This Week', slug: 'week' }, { name: 'Today', slug: 'today' } ]
      break;
    }

    return filters;
  },

  setValidFilters: function( filters ) {
    this.validFilters = _.map(filters, function(obj) { return obj.slug } );
  },

  handleClick: function(event) {
    event.preventDefault();
    var $link = $(event.target);
    var path = $link.attr('href');

    $('#filters a.active').removeClass('active');
    $link.addClass('active');
    this.selectedFilter = this.paginator.selectedFilter = $link.attr('id');

    window.router.navigate(path, {trigger: true});
  },

  setSelectedFilterFromPath: function( pathName ) {
    var match = /^\/style-gallery\/\w+\/(\w+)/.exec( pathName );
    if ( match && _.contains(this.validFilters, match[1]) ) {
      this.selectedFilter = match[1];
    }
  }

});
(function($) {
  'use_strict';

  StyleGallery.Views.GalleryDefaultUploadView = Marionette.Layout.extend({
    className: 'gallery-upload',

    template: 'upload/choose_file',

    viewName: 'Upload', // Used to name the step in the wizard

    narrowModal: true,
    uploadErrors: [],
    loading: false,

    initialize: function() {
      _.bindAll(this, 'onViewDidRender');
      this.listenTo(this, 'viewDidRender', this.onViewDidRender);
    },

    serializeData: function() {
      return { 
        errors: this.uploadErrors, 
        showErrors: this.uploadErrors.length > 0, 
        loading: this.loading, 
        formAction: router.paths.api.outfits()
      };
    },

    renderCloset: function() {
      _dbg.log('[GalleryUploadView::renderCloset]');
      var view = new StyleGallery.Views.ClosetOutfitsView({collection: new StyleGallery.Collections.CurrentUserClosetOutfits() });
      view.collection.fetch({ reset: true });
    },

    bindUploadInput: function() {
      var that = this;
      $('#fileupload').fileupload({
        dataType: "json",
        start: function(e, data){
          that.uploadErrors = [];
          that.loading = true;
          that.render();
        },
        always: function(e, data) {
          that.loading = false;
        },
        success: function(result, textStatus, jqXHR) {
          this.uploadErrors = [];
          window.currentWizard.data.outfitId = result.outfit.id;
          window.currentWizard.renderNextStep();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          that.uploadErrors = JSON.parse(jqXHR.responseText).errors.image;
          that.loading = false;
          that.render();
          that.bindUploadInput();
        }
      });
    },

    onViewDidRender: function(data) {
      this.bindUploadInput();
      this.renderCloset();
    }

  });
})(jQuery);
(function($) {
  'use_strict';

  StyleGallery.Views.GalleryInstagramUploadView = Marionette.Layout.extend({
    className: 'instagram-upload',
    template: 'upload/instagram',

    regions: {
      'guidelines': '.photo-guidelines',
      'photoSheet': '.instagram-photo-sheet-viewport'
    },

    events: {
      'click .instagram-load-next':               'loadNext',
      'click .instagram-add-photo':               'upload',
      'click .cancel':                            'cancel'
    },

    viewport: function() {
      if (utils.device.phone()) {
        return $('.modal');
      } else {
        return $('.instagram-photo-sheet-viewport');
      }
    },

    initialize: function() {
      StyleGalleryBase.Views.InfiniteScrollView.mixin(this);
      _.bindAll(this, 'onSelect', 'onDeselect', 'photosAdded');
      this.on('paginate', this.loadNext);
    },

    serializeData: function() {
      return {
        formAction: router.paths.api.outfits()
      }
    },

    onRender: function() {
      this.photoSheetView = new StyleGallery.Views.InstagramPhotoSheetView(
        { collection: new StyleGallery.Collections.PaginatedInstagramPhotos() }
      );
      this.photoSheetView.on('deselect', this.onDeselect);
      this.photoSheetView.on('select', this.onSelect);
      this.photoSheetView.collection.on('change:done', this.photosAdded);
      this.photoSheetView.collection.on('change:done', this.unpauseScrollPoller);
      this.photoSheetView.collection.goTo(1);

      utils.ensureMobileModalHeader();
    },

    onShow: function() {
      this.photoSheet.show(this.photoSheetView);
      this.guidelines.show(new StyleGallery.Views.PhotoGuidelinesView());
    },

    onSelect: function(targetView) {
      this.selected = targetView;
      this.$el.addClass('photo-selected');
    },

    onDeselect: function() {
      this.selected = false;
      this.$el.removeClass('photo-selected');
    },

    loadNext: function() {
      this.photoSheetView.collection.requestNextPage();
    },

    photosAdded: function() {
      var $photoSheet = this.$('.photos');
      var photos = this.photoSheetView.collection;
      if ($photoSheet.hasClass('loading')) {
        $photoSheet.removeClass('loading');
        this.startScrollPoller();
      }

      if (photos.currentPage == photos.totalPages) {
        $photoSheet.addClass('no-more-photos');
        this.endScrollPoller();
      }
    },

    cancel: function() {
      window.currentWizard.close();
    },

    upload: function() {
      if (!this.selected) { return; }
      var url = this.selected.model.get('images').standard_resolution.url;
      this.$('.instagram-add-photo').addClass('loading').text('Uploading...');

      // TODO don't I smell like I should be a model?
      $.ajax({
        type: 'POST',
        url: router.paths.api.outfits(),
        dataType: 'json',
        data: {
          utf8: '✓',
          close_path: '',
          'outfit[image_attributes][url]': url
        }
      }).done(function(data) {
        var id = data.outfit.id;
        router.navigate(router.paths.submitOutfit(id), {trigger: true});
      });

      return false;
    }
  });

})(jQuery);
(function($) {
  'use_strict';

  StyleGallery.Views.GalleryUploadView = Marionette.Layout.extend({

    template: 'upload/base',
    narrowModal: true,
    viewName: 'Desktop Photo Picker', // Used to name the step in the wizard

    regions: {
      'view': '.base'
    },

    options: {
      mode: 'device'
    },

    viewWillRender: function(data) {
      _.extend(this.options, data);
    },

    viewDidRender: function(data) {
      this.view.currentView.trigger('viewDidRender', data);
    },

    onRender: function() {
      this.$el.appendTo('.modal#uploadWizard');
      if (this.options.mode == 'instagram') {
        this.route = window.router.paths.galleryInstagramUpload();
        this.view.show(new StyleGallery.Views.GalleryInstagramUploadView());
      } else {
        this.route = window.router.paths.galleryUpload();
        this.view.show(new StyleGallery.Views.GalleryDefaultUploadView());
      }
    }
  });

})(jQuery);
(function($) {
  'use strict';

  StyleGallery.Views.InstagramPhotoSheetView = Marionette.CollectionView.extend({
    className: 'instagram-photo-sheet',

    initialize: function() {
      _.bindAll(this, 'deselect');
      this.itemView = StyleGallery.Views.InstagramPhotoView;
    },

    onRender: function() {
      this.$el.find('.spindicator').remove();
      this.$el.append('<p class="spindicator"><img alt="Spindicator-loader" src="/style-gallery/assets/spindicator-loader.gif">Loading…</p>');
    },

    onShow: function() {
      $('body').on('click', this.deselect);
    },

    beforeClose: function() {
      $('body').off('click', this.deselect);
    },

    onItemviewClick: function() {
      this.deselect();
    },

    deselect: function() {
      this.$('.instagram-uploadable-photo').removeClass('selected');
      this.trigger('deselect');
    },

    onItemviewSelect: function(view) {
      this.trigger('select', view);
    }

  });

})(jQuery);
(function($) {
  'use strict';

  StyleGallery.Views.InstagramPhotoView = Marionette.ItemView.extend({

    template: 'upload/instagram-photo',

    className: 'instagram-uploadable-photo',
    tagName: 'a',
    attributes: {
      href: 'javascript:void(0);'
    },

    events: {
      'click': 'onClick'
    },

    serializeData: function() {
      return {
        image: this.model.get('images').thumbnail.url
      };
    },

    onClick: function() {
      var selectable = !this.$el.hasClass('selected');
      this.trigger('click');
      if (selectable) {
        this.select();
      }
      return false;
    },

    select: function() {
      this.$el.addClass('selected');
      this.trigger('select', this);
    }

  });
})(jQuery);
(function($) {
  'use_strict';

  StyleGallery.Views.LoveButtonView = Marionette.ItemView.extend({

    template: 'gallery/love_button',

    events: {
      "click .love-button": "respondToLoveRequest",
    },

    modelEvents: {
      "change": "render",
      "loved": "renderHeartAnimation",
    },

    serializeData: function(){
      return _.extend(this.model.get('loves'), {
        state: this.userLoved() ? 'loved' : 'unloved'
      });
    },

    respondToLoveRequest: function(){
      if (utils.redirectWhenSignedOut()) return;
      if (this.userLoved()){
        this.model.unLove(StyleGallery.currentUser.get('id'));
      } else {
        this.model.love(StyleGallery.currentUser.get('id'));
      }
    },

    userLoved:function(){
      if (StyleGallery.currentUser) {
        return this.model.getUserLoved(StyleGallery.currentUser.get('id'));
      } else {
        return false;
      }
    },

    renderHeartAnimation: function() {
      this.$el.find('.heart').addClass('animated');
    }

  });
})(jQuery);
(function($) {
  'use strict';

  StyleGallery.Views.OutfitDetailView = Backbone.View.extend({
    className: 'outfit-detail',

    events: {
      'click #back-btn': 'backButtonPressed'
    },

    templateHelpers: {
      moderatedAtTimeAgo: function () {
       if (utils.onAdminPath()) {
           return moment(this.attributes.created_at).fromNow();
       }else{
           return moment(this.attributes.moderated_at).fromNow();
       }
      },
      user_personal_website: function(){
          return this.attributes.contributor.personal_website_url || false;
      }
    },

    initialize: function() {
      _dbg.log('[OutfitDetailView::initialize]');

      this.listenTo(this.model, 'change', this.updateAnalyticsContext);
      this.listenTo(this.model, 'change', this.render);

      _e.off('modal:hide', this.viewDidClose);
      _e.on('modal:hide', this.viewDidClose, this);

      _e.off('window:resize', this.constrainImage);
      _e.on('window:resize', this.constrainImage, this);

      _e.off('orientationDidChange', this.constrainImage);
      _e.on('orientationDidChange', this.constrainImage, this);

      _e.off('scroll:bottom', this._handleScrollToBottom);
      _e.on('scroll:bottom', this._handleScrollToBottom, this);

      this.bindAnalytics(this.model);

      this.loveButton = new StyleGallery.Views.LoveButtonView({
        model: this.model
      });

      this.onClosePath = this.options.onClosePath || ( initialBackboneData.resourceIdentifier ? initialBackboneData.resourceIdentifier : window.router.paths.gallery());
      this.sharingWidget = new StyleGallery.Views.SocialSharingWidget({
        model: this.model
      });

      this.setTemplates();
    },

    closePath: function() {
      if (utils.onAdminPath()) {
        return null;
      }
      return utils.addScopeToGalleryPath(this.onClosePath);
    },

    setTemplates: function() {
      if (utils.device.phone()) {
        this.showInModal =  false;
        this.template = HoganTemplates['gallery/phone/outfit_detail'];
      } else {
        this.showInModal = true;
        this.template = HoganTemplates['gallery/outfit_detail'];
      }
    },

    bindAnalytics: function(model) {
      // Omniture is not ready to go out yet, but we may return to this in the future
      // Leaving this so there's a starting point. -NR
      //mc_shared_assets.analytics.services.omniture.addBuilder(function(vars, context) {
        //if (context.event == 'user clicked product') {
          //vars.events = 'event4,event80'
          //vars.products = '[' + context.productId + ']';
          //vars.linkname = 'modcloth>outfit-details>shop-the-look';
          //vars.evar9 = 'outfit:' + document.title;
          //vars.evar10 = 'outfit:' + context.productName;
          //vars.evar20 = context.outfitModel.get('id');
          //vars.prop9 = 'outfit:' + document.title;
          //vars.prop10 = 'outfit:' + context.productName;
          //vars.prop20 = context.outfitModel.get('id');
        //}
      //});

      mc_shared_assets.analytics.services.ga.addBuilder(function(event, context) {
        if (event == 'user clicked product') {
          return ['style-gallery:outfit', 'user_actions', 'shop-the-look', 1];
        }
      });
    },

    updateAnalyticsContext: function() {
      mc_shared_assets.trigger('pushContext', {outfitModel: this.model });
    },

    viewDidClose: function() {
      _dbg.log('[OutfitDetailView::viewDidClose]');

      _e.trigger('outfitDetail:didClose');

      // clear analytics context
      mc_shared_assets.analytics.api.pushContext({currentView: ''});
    },

    render: function() {
      _.extend(this.model, this.templateHelpers);

      var shopTheLookWidget =  new StyleGallery.Views.ShopTheLookView(
        { collection:
          new StyleGallery.Collections.Products( this.model.get('products') )
        });

      var renderedContent = this.template.render( this.model );

      this.$el.html(renderedContent);

      this.$el.find('.user-details').after( shopTheLookWidget.render().el );

      // TagsView
      this.tagsView = new StyleGallery.Views.TagsView({ tags: this.model.get( 'tags' ) });
      this.$el.find('.shop-the-look').after( this.tagsView.render().el );

      if (this.showInModal) {
        this._showModal(this.el, this.closePath());
        this.constrainImage();
      } else {
        // Check to see if this is a re-render
        if ($('.outfit-detail').length === 0) {
          this.scrollPos = $(window).scrollTop();
          var $containerDiv = $('<div/>', { id:'outfit-detail-container', class: 'content-container'});
          $containerDiv.html(this.el);
          $('.container-fluid').before($containerDiv);
        }
        $('.container-fluid').hide(); // hacky

        utils.ensureMobileModalHeader($('#outfit-detail-container .outfit-detail'));
      }
      this.loveButton.setElement(this.$('.bb-love-button'));
      this.loveButton.render();

      if (!utils.onAdminPath()) {
        this.sharingWidget.setElement(this.$el.find('.share-widget'));
        this.sharingWidget.render();
      }


      // set analyticsContext
      mc_shared_assets.analytics.api.pushContext({currentView: 'outfitDetailView'});
      mc_shared_assets.analytics.dom_binding.bindAll();

      _e.trigger('outfitDetail:didRender');

      return this;
    },

    constrainImage: function() {
      var maxHeight = $(window).height() * .9;
      var maxWidth = $(window).width() * .6;
      if ($(window).width() < 900) {
        maxWidth = $(window).width() * .35;
      }

      this.$el.find('.main-image-container img').css({'max-height': parseInt(maxHeight, 10), 'max-width': parseInt(maxWidth, 10)});
      this.$el.find('.main-image-container').css({'max-height': parseInt(maxHeight, 10), 'max-width': parseInt(maxWidth, 10)});
    },

    backButtonPressed: function(event) {
      event.preventDefault();
      this.removePhoneView();
    },

    removePhoneView: function() {
      _dbg.log('[OutfitDetailView::removePhoneView]');
      // go back to gallery
      $('#outfit-detail-container').remove();
      $('.container-fluid').show();
      $(window).scrollTop(this.scrollPos);

      // Update router
      var shouldTrigger = StyleGallery.outfitCollectionView.collection.length === 0;
      window.router.navigate(this.closePath(), shouldTrigger);

      this.viewDidClose();

    },

    close: function() {
      this.stopListening(this.model);
      if (utils.device.phone()) {
        this.removePhoneView();
      } else {
        // Calling hide when the modal isn't showing caused the modal options
        // to get messed up and the scrolling and positioning of the modal goes to hell
        //
        // Why would we try and close the modal while it wasn't showing?
        // The router gallery action will because the outfitDetailView doesn't get
        // removed when closed. TODO - TECH DEBT - remove views we're not using!!!
        Modal.View.isShowing() && Modal.View.hide();
      }
    },

    _handleScrollToBottom: function() {
      // This will stay off until another page of outfits is rendered on the gallery. We're not updating the gallery
      // while in the detail view, so we make sure this is ready to accept new scroll events immediately.
      $(window).data('scrollAjaxReady', true);
    },

    _showModal: function(content, theClosePath) {
      var modal = window.Modal.View.model;

      modal.set({
        content: content,
        onClosePath: theClosePath,
        wideModal: true
      }, {silent: true});

      modal.show();
    }
  });

})(jQuery);


StyleGallery.Views.ScopeView = Backbone.View.extend({
  tagName: 'ul',
  id: 'scopes',
  selectedScope: 'latest',

  initialize: function(validScopes) {
    this.validScopes = validScopes;
    this.paginatorScope;
    this.filterView;

    _.bindAll(this, 'renderFilters', 'setSelectedScopeFromPath', 'setSelectedScope', 'registerPaginator');
  },
  
  events: {
    'click a': "handleClick",
  }, 

  render: function() {
    var that = this;

    this.setSelectedScopeFromPath( window.location.pathname );
    that.$el.empty();

    _.each(this.validScopes, function(scope) {

      var className = '';
      if (scope === that.selectedScope) {
        className = 'active';
      };
      
      that.$el.append(
        $('<li/>', {class: 'scope'}).append(
          $('<a/>', {src: window.router.paths.gallery(scope), class: className, id: scope}).text( that.humanReadableScope(scope) )
        ));
    });

    $('#gallery').before(this.el);
    this.renderFilters();
    this.paginator.selectedScope = this.selectedScope;

    return this;
  },

  renderFilters: function(path) {
    this.filterView && this.filterView.remove();
    this.filterView = new StyleGallery.Views.FilterView({ scope: this.selectedScope, paginator: this.paginator });
    this.filterView.render();

    if (path) {
      window.router.navigate(path, {trigger: true});
    }
  },

  handleClick: function(event) {
    event.preventDefault();
    var $link = $(event.target);
    var scopeParam = $link.attr('id');
    this.setSelectedScope( scopeParam );
  },

  setSelectedScope: function( newScope ) {
    var path = window.router.paths.gallery(newScope);
    this.selectedScope = this.paginator.selectedScope = newScope;
    $('#scopes a.active').removeClass('active');
    this.$el.find('#' + newScope).addClass('active');

    this.renderFilters(path);
  },

  setSelectedScopeFromPath: function( pathName ) {
    var match = /^\/style-gallery\/(\w+)/.exec( pathName );
    if ( match && _.contains(this.validScopes, match[1]) ) {
      this.selectedScope = match[1];
    }
  },

  registerPaginator: function( paginator ) {
    this.paginator = paginator;
  },

  humanReadableScope: function(scope) {
    return scope === 'loved' ? 'most loved' : scope;
  }

});
StyleGallery.Views.ShopTheLookProductView = Backbone.View.extend({

  className: 'product span3',
  tagName: 'div',

  attributes: function() {
    var attrs = {};
    attrs['data-id'] = this.model.get('id');
    if (utils.device.phone()) {
      attrs['style'] = 'height:270px;'; // setting default height for grid
    }
    return attrs
  },

  render: function() {
    var clickTarget = '_blank';
    if (Modernizr.touch) {
      clickTarget = '_self';
    }

    var picturedItem = this.model.get('rel') == 'pictured' || false;

    var renderedContent = HoganTemplates['gallery/product'].render( _.extend(this.model.toJSON(), { clickTarget: clickTarget, picturedItem: picturedItem }) );
    this.$el.html( renderedContent );
    return this;
  }

});
StyleGallery.Views.SliverView = Backbone.View.extend({

  id: 'sliver',

  className: 'sliver opened',

  tagName: 'div',

  events: {
    "click #sliver-header, #sliver-toggle-icon" : "checkToggle",
    "tap #sliver-header, #sliver-toggle-icon" : "checkToggle"
  },

  render: function() {

    var html = HoganTemplates['gallery/sliver'].render();
    this.$el.html( html );

    $( '#style-gallery-banner' ).after( this.$el );

    return this;
  },

  setDefaultValues: function() {

    $( '#sliver-header' ).html( 'STYLE ASSIGNMENT' );
    $( '#sliver-content' ).html( 'Wow us with a \'white out\'. Check out how we\'re styling whites, and show us your take by up.' );
  },

  checkToggle: function() {
    var view = this;

    if( $( '#sliver-toggle-icon' ).is( ':visible' ) ) {
      view.slideToggle();
    }
  },

  slideToggle: function() {
    var view = this;
    $( '#sliver-content' ).slideToggle( function() {
      var iconText;
      if ( $( this ).is( ':visible' ) ) {
        view.$el.addClass('opened');
        view.$el.removeClass('closed');
        iconText = "&#8211;";
      } else {
        view.$el.addClass('closed');
        view.$el.removeClass('opened');
        iconText = "+";
      }

      $( '#sliver-toggle-icon' ).html( iconText );
    });
  }

});
StyleGallery.Views.SocialSharingWidget = Backbone.View.extend({
  className: 'share-widget',

  render: function() {
    this.$el.socialShareProduct({
      product_id:        this.model.get('id'),
      product_url:       this.shareURL(),
      product_image_url: this.shareImageURL(),
      tweet:             this.twitterText(),
      pin:               this.pinterestText(),
      facebook_title:    this.facebookTitle(),
      product_summary:   this.facebookDescription(),
      redirect_url:      this.redirectUrl(),
      services:          'Pinterest,Twitter,Facebook',
      device_type:       utils.device.type,
      ga_utm_medium:     'share',
      ga_utm_campaign:   this.gaUtmCampaign(),
      ga_utm_keyword:    this.model.get('id')
    });

    return this;
  },

  facebookTitle: function() {
    return 'I \u2665 ' + this.model.get('contributor').name + '\'s look!';
  },

  facebookDescription: function() {
    return "I spotted this outstanding outfit on the ModCloth Style Gallery. You can view, love, and share your own fashionable photos with the ModCloth community, too!";
  },

  twitterText: function() {
    return "I’ve got a crush on this look from the @ModCloth Style Gallery! ";
  },

  pinterestText: function() {
    return "<3 this look from the ModCloth Style Gallery! Cutest community ever. #indie #style";
  },

  shareURL: function() {
    return 'http://' + window.location.host + '/style-gallery' + window.router.paths.galleryOutfit(this.model.get('id'));
  },

  shareImageURL: function() {
    return this.model.get('images').original.url;
  },

  redirectUrl: function() {
//    Host needs to be hardcoded because the redirect_uri param for Facebook Dialog Feed
//    requires the host to be defined on the app settings. The host that is defined on Facebook app settings
//    is www.modcloth.com
    return 'http://www.modcloth.com' + window.location.pathname;
  },

  gaUtmCampaign: function(){
    if((window.location.pathname).match(/\/outfits\/\d/)){
        var level = 'outfitshare';
    } else {
        level = 'galleryshare'
    }
    return 'sg_' + level;
  }
});
StyleGallery.Views.SubtitleBaseView = Backbone.Marionette.ItemView.extend({
  id: "inspire-admire",

  className: 'subtitle',

  template: 'gallery/subtitle',

  defaults: {
    subtitle: "Inspire <span class='glyph glyph-and'></span> Admire"
  },

  initialize: function(options) {
    this.options = _.defaults({}, options, this.defaults);
  },

  serializeData: function() {
    return {
      subtitle: this.options.subtitle
    }
  },

  onRender: function() {
    _dbg.log('[SubtitleBaseView::render]');
  }
});
StyleGallery.Views.SubtitleTagView = StyleGallery.Views.SubtitleBaseView.extend({
  id: "tag-title",

  modelEvents: {
    'change': 'render'
  },

  initialize: function(options) {
    this.options = _.defaults({}, options, this.defaults);
    this.model = StyleGallery.currentProfile;
  },

  onBeforeRender: function() {
    var tag = this.getTag();
    this.options.subtitle = this._formatTagName(tag);
  },

  onRender: function() {
    _dbg.log('[SubtitleTagView::render]');
  },

  getTag: function() {
    var profile = StyleGallery.currentProfile;
    var displayName = profile && profile.displayName();
    if (displayName && /\S/.test(displayName)) {
      return displayName;
    }
    return window.initialBackboneData.tag_name;
  },

  _formatTagName: function(tagName) {
    return (tagName || '').replace(" / ", "/");
  },
});
$(function() {
  'use strict';
  
  StyleGallery.Views.TagView = Backbone.View.extend({
    tagName: 'li',

    initialize: function( options ) {
      this.tag = options.tag;
      this.name = this.tag.name;
      this.colorTag = this.isColorTag() ? this.name.toLowerCase() : false;
      this.url = "/style-gallery/" + this.tag.slug;
    },
    
    isColorTag: function() {
      return this.tag.category == "Primary Color";
    },

    render: function() {
      var renderedContent = HoganTemplates['gallery/tag'].render(this);
      this.$el.html( renderedContent );
      return this;
    }
    
  });
  
});
$(function() {
  'use strict';
  
  StyleGallery.Views.TagsView = Backbone.View.extend({
    
    id: 'outfit-tags',
    
    tagName: 'ul',
    
    tagViews: [],
    
    initialize: function( options ) {
      this.tags = options.tags || [];
    },
    
    render: function() {
      _dbg.log( '[TagsView::render]' );
      
      for ( var i = 0; i < this.tags.length; i++ ) {
        if (this.tags[i].state == 'live') {
            this.tagViews[i] = new StyleGallery.Views.TagView({ tag: this.tags[i] });
            this.$el.append( this.tagViews[i].render().el );
        }
      }
      
      return this;
    }
    
  });
  
});
StyleGallery.Views.TitleBannerView = Backbone.Marionette.ItemView.extend({
  id: 'style-gallery-title',
  tagName: 'a',
  className: 'title curve',
  attributes: {
    href: '/style-gallery'
  },

  template: 'gallery/title_banner',

  onRender: function() {
    _dbg.log('[TitleBannerView::render]');
    this._createTitle();
  },

  _createTitle: function() {
    var text = this.$el.html() || '',
        newContent = '';
    for( var i = 0; i < text.length; i++ ) {
      newContent += "<span class='letter letter-" + i + "'>" + text.charAt( i ) + "</span>";
    }
    this.$el.html( newContent );
  }
});
StyleGallery.Views.TitleButtonView = Backbone.Marionette.ItemView.extend({
  id: 'upload-button',
  tagName: 'button',

  template: 'gallery/title_button',

  events: {
    'click': 'openUploadModal'
  },

  serializeData: function() {
    return {
      iconClass: 'glyph camera',
      label: 'Add Your Photo'
    };
  },

  openUploadModal: function() {
    window.router.navigate(window.router.paths.galleryUpload(), {trigger: true});
  }
});
StyleGallery.Views.TitleFollowButtonView = StyleGallery.Views.TitleButtonView.extend({
  id: 'follow-button',

  triggers: {
    'click': 'followClick',
    'mouseenter': 'mouseEnter',
    'mouseleave': 'mouseLeave'
  },

  modelEvents: {
    'change': 'render'
  },

  defaults: {
    content: {
      following: {
        iconClass: 'glyph checkmark',
        label: 'Following'
      },
      unfollowHover: {
        iconClass: 'glyph x',
        label: 'Unfollow'
      },
      unfollowed: {
        iconClass: 'glyph plus',
        label: 'Follow'
      }
    }
  },

  initialize: function(options) {
    this.options = _.defaults({}, options, this.defaults);
    this.model = StyleGallery.currentProfile;
    this.hover = this.mouseover = false;
  },

  state: function() {
    if (this.model.isFollowedByCurrentUser()) {
      return this.hover ? 'unfollowHover' : 'following';
    } else {
      return 'unfollowed';
    }
  },

  serializeData: function() {
    var state = _.result(this, 'state');
    return this.options.content[state];
  },

  onRender: function() {
    this.$el.toggleClass('following', this.model.isFollowedByCurrentUser());
  },

  onFollowClick: function() {
    if(this.model.isFollowedByCurrentUser()) {
      this.model.unfollow();
    } else {
      this.model.follow();
    }
    this.adjustHoverAndFocus();
  },

  adjustHoverAndFocus: function() {
    if (this.mouseover) {
      this.$el.blur();
    }
    this.hover = false;
    this.render();
  },

  onMouseEnter: function() {
    this.hover = this.mouseover = true;
    this.render();
  },

  onMouseLeave: function() {
    this.hover = this.mouseover = false;
    this.render();
  }
});
StyleGallery.Views.UploadBarErrorsView = Marionette.ItemView.extend({

  template: 'gallery/upload_bar_errors',

  events: {
    'click .close': 'close'
  },

  className: 'upload-bar-errors',

  serializeData: function() {
    return _.defaults({
      prefix: this.model.get('fault') == "ours" ? 'Sorry!' : 'Uh-oh!'
    }, this.model.toJSON());
  },

  onRender: function() {
    if (this.options.renderArrow) {
      this.$el.addClass('with-arrow');
    }
    if (this.model.get('fault') == "ours") {
      this.$el.addClass('not-your-fault');
    }
  },

  onShow: function() {
    if (this.options.targetEl) {
      var $target = $(this.options.targetEl);
      var position = $target.position();
      var targetTop = position.top;
      var targetLeft = position.left;
      var centeringMargin = (this.$el.outerWidth() - $target.outerWidth()) / 2;
      this.$el.css({
        bottom: 'auto',
        top: targetTop - this.$el.height(),
        left: targetLeft,
        marginLeft: -1 * centeringMargin
      });
    }
    return this;
  }
});
StyleGallery.Views.UploadBarView = Marionette.Layout.extend({
  id: 'gallery-upload-bar',
  className: 'content-container',
  tagName: 'footer',

  template: 'gallery/upload_bar',

  events: {
    'click .fileinput-button': 'trackDeviceUpload',
    'click .no-user.fileinput-button': 'redirectToLogin',
    'click .instagram-button': 'instagramIt'
  },

  regions: {
    'errors': '.errors'
  },

  cookiename: {
    ig: 'sg.ig_msg'
  },

  hideExpandableContentOnRender: true,

  initialize: function() {
    _.bindAll(this, 'onUploadSuccess');
    _.bindAll(this, 'onUploadFailure');
    _.bindAll(this, 'clearInstagramError');
    this.on('expandable:open', this.trackUploadIntent);
    this.on('expandable:open', this.trackUploadBarClosed);
    StyleGalleryBase.Views.ExpandableView.mixin(this);
  },

  serializeData: function() {
    return {
      formAction: router.paths.api.outfits(),
      galleryUploadPath: router.paths.galleryUpload(true),
      hasUserClass: !!StyleGallery.currentUser ? '' : 'no-user',
    };
  },

  onRender: function() {
    _dbg.log('[UploadBarView::render]');
  },

  onShow: function() {
    var that = this;
    var $fileuploadButton = this.$('form .fileinput-button');
    this.$('form').fileupload({
      dataType: "json",
      start: function() {
        that.setLoadingState( $fileuploadButton );
        that.errors.close();
      },
      always: function() {
        that.clearLoadingState( $fileuploadButton );
      },
      error: this.onUploadFailure,
      success: this.onUploadSuccess
    });

    if (this.isInstagramUnavailableMode()) {
      this.showInstagramError();
      this.hideExpandableContentOnRender = false;
    }

    if (this.hideExpandableContentOnRender) {
      this.hideExpandableContent();
    }
  },

  isInstagramUnavailableMode: function() {
    return !!$.cookie(this.cookiename.ig);
  },

  trackDeviceUpload: function(){
    mc_shared_assets.analytics.api.trackEvent('mobileDeviceUploadButtonClicked', {} );
  },

  trackUploadBarClosed: function(){
    mc_shared_assets.analytics.api.trackEvent('mobileDeviceUploadBarClosed', {} );
  },

  trackUploadIntent: function(){
    mc_shared_assets.analytics.api.trackEvent('mobileDeviceUploadIntent', {} );
  },

  showInstagramError: function() {
    var message = $.cookie(this.cookiename.ig);
    this.errorView = new StyleGallery.Views.UploadBarErrorsView({
      model: new Backbone.Model({
       errors: [ message ],
       fault: "ours"
      }),
      targetEl: this.$('.instagram-button'),
      renderArrow: true
    });
    this.errors.show(this.errorView);
    setTimeout(this.clearInstagramError, 6000);
  },

  clearInstagramError: function() {
    $.removeCookie(this.cookiename.ig, {path: '/style-gallery'});
  },

  onUploadSuccess: function(result) {
    this.outfitId = result.outfit.id;
    router.navigate(router.paths.outfitPreview(this.outfitId), {trigger: true});
  },

  onUploadFailure: function(jqXHR) {
    var errors = JSON.parse(jqXHR.responseText).errors.image;
    this.errorView = new StyleGallery.Views.UploadBarErrorsView({
      model: new Backbone.Model({ errors: errors }),
      targetEl: this.$('.phone-button'),
      renderArrow: true
    });
    this.errors.show(this.errorView);
  },

  redirectToLogin: function(e) {
    utils.redirectWhenSignedOut();
    return false;
  },

  instagramIt: function() {
    mc_shared_assets.analytics.api.trackEvent('mobileInstagramUploadButtonClicked', {} );
    if (this.instagramTokenPresent()){
      router.navigate(router.paths.galleryInstagramUpload(), {trigger: true});
    } else {
      utils.returnableRedirect(window.router.paths.authenticate.instagram());
    }
  },

  setLoadingState: function($button) {
    $button.addClass('loading').find('span').text('Loading...');
  },

  clearLoadingState: function($button) {
    var defaultText = $button.data('button-text');
    $button.removeClass('loading').find('span').text( defaultText );
  },

  instagramTokenPresent: function(){
    return StyleGallery.currentUser && !!StyleGallery.currentUser.get('instagram') && StyleGallery.currentUser.get('instagram').access_token !== '';
  }
});
(function ($) {
  'use strict';

  StyleGallery.Views.PhotoGuidelinesView = StyleGalleryBase.Views.CarouselView.extend({

    isReadyForCarousel: false,

    loop: true,

    className: 'photo-guidelines expandable-bar',

    carouselEl: function() {
      return this.$('ul')[0];
    },

    // Note - when changing this copy, check usages of this view on
    // phone, tablet and desktop screen-widths for overflows
    guidelines: [
      'We love head-to-toe shots because they show us the outstanding outfits you put together.',
      'We can’t accept any long distance, crowd, or overly blurry photos.',
      'Photos need to be at least 462 px wide.',
      'We moderate all user-submitted photos and captions, so please keep in mind our ' +
        '<a href="http://www.modcloth.com/help/community_guidelines#photo-submission" target="_blank">guidelines</a> ' +
        'and <a href="http://www.modcloth.com/help/terms-of-use" target="_blank">Terms of Use</a>.',
      'Don’t forget to tell your friends and family to share your shots on their social networks!'
    ],

    initialize: function() {
      this.collection = new Backbone.Collection(this.guidelines.map(function(text) {
        return new Backbone.Model({ value: text });
      }));
      this.listenTo(this, 'show', this.onShow);
      this.listenTo(this, 'expandable:open', this.onOpen);
      StyleGalleryBase.Views.ExpandableView.mixin(this);
      StyleGalleryBase.Views.CarouselView.prototype.initialize.apply(this, arguments);
    },

    render: function() {
      _dbg.log('[PhotoGuidelinesView::render]');
      var that = this;
      if (this.$el.is(':empty')) {
        var renderedContent = HoganTemplates['shared/photo_guidelines'].render();
        this.$el.html( renderedContent );
      }
    },

    onShow: function() {
      this.collection.trigger('reset');
    },

    onOpen: function() {
      this.isReadyForCarousel = true;
      if (!this._swipeview) {
        this.setupCarousel();
      }
    },

    renderItem: function(guideline) {
      return $('<li/>').append($('<span class="guideline"></span>').html(guideline.get('value')));
    }
  });

})(jQuery);
(function ($) {
  'use strict';

  var outfitProductTaggerInstance;

  StyleGallery.Views.OutfitProductTaggerView = Backbone.Marionette.Layout.extend({
    className: 'gallery-tag-products',
    viewName: 'OutfitProductTagger', // Used to name the step in the wizard

    template: 'upload/product_tagger',

    options: {
      mode: 'tagger'
    },

    events: {
      'click .right-filters li':                  'browseModCloth',
      'click .category-btn li':                   'browseCategory',
      'click .collection-prev':                   'paginatePrev',
      'click .collection-next':                   'paginateNext',
      'click .no-order-history-msg-link':         'orderHistoryRedirect',
      'click .search-btn':                        'prepareSearch',
      'click .search-inputs li':                  'prepareSearch',
      'keypress .search-input-box':               'onSearchboxKeypress',
      'click .mobile-preview-cancel':             'cancelPreview',
      'click #mobile-fileupload .back-next-btn':  'backButtonPressed',
      'click .outfit-photo.admin':                'openZoomWindow'
    },

    modelEvents: {
      'change': 'updateSubviews'
    },

    regions: {
      'associatedProductsRegion': '.carousel',
      'catalogProductsRegion': '.unselected-products ul',
      'guidelinesRegion': '.photo-guidelines'
    },

    initialize: function() {
      _.bindAll(this, 'clearLoadingOverlay');
      _.bindAll(this, 'onUploadSuccess');
      _.bindAll(this, 'onUploadFailure');
    },

    serializeData: function() {
      return _.extend(this.model.toJSON(), { formAction: router.paths.api.outfits() });
    },

    onBeforeRender: function() {
      _dbg.log('[OutfitProductTagger] rendering...');
      var that = this;

      outfitProductTaggerInstance = this; // setting this variable at a higher scope level to aid in refactoring the neseted functions in #updateSubviews

      if (this.options.mode == 'preview') {
        this.template = 'upload/outfit_preview';
      }

      if ( utils.onAdminPath() ) {
        this.route = window.router.paths.admin.editOutfit(this.model.get('id'));
      } else if (this.isPreviewMode()) {
        this.route = window.router.paths.outfitPreview(this.model.get('id'));
      } else {
        this.route = window.router.paths.outfitProductTagger(this.model.get('id'));
      }
    },

    onRender: function() {
      var that = this;

      this.$el.attr('class', function(i, className) {
        return className.replace(/(^|\s)mode-\S*/,'') + ' mode-' + that.options.mode;
      });

      var triggerUpdateSubview = false;
      if ( !this.model.hasChanged('id') ) {
        triggerUpdateSubview = true;
      }

      this.model.fetch({
        success: function(model, response, options) {
          if (triggerUpdateSubview) {
            that.updateSubviews();
          }
          that.$('.outfit-photo img').on('load', that.clearLoadingOverlay);
        }
      });

      this.$el.appendTo('.modal#uploadWizard');

      utils.ensureMobileModalHeader();

      this.showGuidelines();

      // NOTE - be sure to draw the loading overlay AFTER the overlay target
      // reaches its final position. `showGuidelines` and `ensureMobileModalHeader`
      // adjust the final position of the preview image.
      this.updateLoadingSubview();

      this.$('form').fileupload({
        dataType: 'json',
        start: function() {
          that.model.loading = true;
          that.updateLoadingSubview();
        },
        error: this.onUploadFailure,
        success: this.onUploadSuccess
      });

      return this;
    },

    updateLoadingSubview: function() {
      if (this.model.loading) {
        if (!$('.loading-overlay').length) {
          $('<div class="loading-overlay">Loading...</div>')
            .cover(this.$('.outfit-photo img'));
        }
      } else {
        $('.loading-overlay').remove();
      }
    },

    showGuidelines: function() {
      if (this.options.mode == 'preview') {
        this.guidelinesView = new StyleGallery.Views.PhotoGuidelinesView();
        this.guidelinesRegion.show(this.guidelinesView);
      }
    },

    syncCollections: function() {
      this.associatedProductsCollection = this.associatedProductsCollection || new StyleGallery.Collections.Products([],{url: window.router.paths.outfitAssignedProductsApi(this.model.get('id'))});
      this.catalogProductsCollection = this.catalogProductsCollection || new StyleGallery.Collections.CatalogProducts();
    },

    updateSubviews: function() {
      var that = this;

      if (!utils.onAdminPath() && !this.model.getUserUploaded()) {
        utils.redirect(window.router.paths.gallery(null, true));
        return;
      }

      function fetchAssociatedAndCatalogProducts() {
        _dbg.log('[OutfitProductTagger :: Fetching associated products and ecomm products');
        that.associatedProductsCollection.reset([],{silent:true});
        that.catalogProductsCollection.reset([],{silent:true});

        that.associatedProductsCollection.url = window.router.paths.outfitAssignedProductsApi(that.model.get('id'));

        that.catalogProductsCollection.userId = that.model.get('contributor').id;
        that.catalogProductsCollection.goTo(1);

        var associatedProductsView = new StyleGallery.Views.AssociatedProductsView({
          collection: that.associatedProductsCollection,
          outfitId: that.model.get('id')
        });

        var catalogProductsView = new StyleGallery.Views.CatalogProductsView({
          collection: that.catalogProductsCollection,
          associatedProductsCollection: that.associatedProductsCollection
        });

        that.associatedProductsCollection.fetch({reset: true}).done(function() {
          _dbg.log('[OutfitProductTaggerView] successfully fetched associated products');
          _dbg.log('  ** from: ' + that.associatedProductsCollection.url);
          that.associatedProductsRegion.show( associatedProductsView );
          that.catalogProductsRegion.show( catalogProductsView );

          that.catalogProductsCollection.fetch().done(function() {
            _dbg.log('[OutfitProductTaggerView] successfully fetched catalog products');
            _dbg.log('  ** from: ' + that.catalogProductsCollection.paginator_core.url());
          });
        });
      }
      function renderOutfitImage() {
        if ( utils.onAdminPath() ) { that.$('.outfit-photo').addClass('admin'); }
        that.$('.outfit-photo img').attr('src', that.model.get('images').medium.url);
      }

      this.syncCollections();
      fetchAssociatedAndCatalogProducts();
      renderOutfitImage();
    },

    browseModCloth: function(e){
      e.preventDefault();
      $('.no-products-msg').hide();
      $('.active', '.gallery-tag-products').removeClass('active');
      $(e.target).addClass('active');

      $('.search-word-btn').hide();
      $('.category-btn').show();

      var collection = outfitProductTaggerInstance.catalogProductsCollection;
      if($(e.target).data().source == 'order-history'){
        $('.category-btn').hide();
      }

      collection.slug = $(e.target).data().source;
      collection.goTo(1);
      // Set active state for default category
      $('.category-btn li[data-slug="' + collection.slug + '"]').addClass('active');
    },

    browseCategory: function(e) {
      outfitProductTaggerInstance.catalogProductsCollection.slug = $(e.target).data('slug');
      outfitProductTaggerInstance.catalogProductsCollection.goTo(1);
      $('ul.category-btn li').each(function() { $(this).removeClass('active'); });
      $(e.target).addClass('active');
    },

    orderHistoryRedirect: function(e) {
      e.preventDefault();

      $('.no-products-msg').hide();
      $('.right-filters .active').removeClass('active');

      $('.right-filters li[data-source="clothing"]').addClass('active');

      $('.category-btn').show();

      var collection = outfitProductTaggerInstance.catalogProductsCollection;
      collection.slug = 'clothing';
      collection.goTo(1);
    },

    paginatePrev: function(e) {
      e.stopPropagation();
      e.preventDefault();
      outfitProductTaggerInstance.catalogProductsCollection.requestPreviousPage();
    },

    paginateNext: function(e) {
      e.stopPropagation();
      e.preventDefault();
      outfitProductTaggerInstance.catalogProductsCollection.requestNextPage();
    },

    onSearchboxKeypress: function(e) {
      if (e.which == 13) {
        this.prepareSearch();
      }
    },

    prepareSearch: function() {
      var keyword = $('input#search').val();
      addSearchToMenu(keyword);
      this.search(keyword);
    },

    search: function(keyword) {
      this.catalogProductsCollection.url = window.router.paths.productsBySearchTerm(keyword);
      this.catalogProductsCollection.slug = 'perform-search';
      this.catalogProductsCollection.goTo(1);
    },

    viewWillRender: function(data) {
      data = _.extend({mode: 'tagger'}, data);
      this.options.mode = data.mode;
      this.model.set({id: data.outfitId}, {silent: true});
    },

    viewWillExit: function () {
      this.catalogProductsCollection.setDefaultSlug();
    },

    isPreviewMode: function() {
      return this.options.mode == 'preview';
    },

    cancelPreview: function() {
      if (!this.isPreviewMode()) { return; }
      this.destroyOutfit();
      window.currentWizard.close();
    },

    destroyOutfit: function() {
      this.model.destroy();
    },


    onUploadSuccess: function(result) {
      this.destroyOutfit();
      this.outfitId = result.outfit.id;
      router.navigate(router.paths.outfitPreview(this.outfitId), {trigger: true});
    },

    onUploadFailure: function(jqXHR) {
      this.errors = JSON.parse(jqXHR.responseText).errors.image;
      this.errorView = new StyleGallery.Views.UploadBarErrorsView({errors: this.errors});
      this.$('.outfit-photo').append( this.errorView.render().el );
      this.clearLoadingOverlay();
      this.$('.mobile-preview-submit').attr('disabled', 'disabled');
      this.$('.outfit-photo img').hide();
      this.$el.addClass('has-errors');
    },

    onClose: function() {
      this.cancelPreview();
      if (this.errorView) {
        this.errorView.close();
      }
    },

    clearLoadingOverlay: function() {
      this.model.loading = false;
      this.updateLoadingSubview();
    },

    backButtonPressed: function() {
      this.$('.mobile-preview-submit').removeAttr('disabled');
      if (this.errorView) {
        this.errorView.close();
      }
      this.$el.removeClass('has-errors');
    },

    openZoomWindow: function() {
        event.preventDefault();
        event.stopPropagation();
        window.open(this.model.get('image_url'),"Outfit-" + this.model.get(''), "height=500,width=350,menubar=no,status=no");
    }
  });

  function fetchCloset() {
    return window.currentWizard.stepForStepName('Upload').collection;
  }

  function addSearchToMenu(keyword) {
    $(".right-filters li").removeClass('active');
    $(".search-inputs li").addClass('active');
    $(".search-inputs li").show();

    $('.no-products-msg').hide();
    $('.category-btn').hide();
  }

})(jQuery);
(function(){
  'use strict';

  StyleGallery.Views.AssociatedProductView = Backbone.View.extend({

    events: {
      'click .remove-item': 'handleClick'
    },

    tagName: 'li',
    className: 'product-browser-associated-product',

    attributes: function() {
      var attr = {};
      attr['data-id'] = this.model.get('id');
      return attr;
    },

    initialize: function() {
      _.bindAll(this, 'renderTooltip');
      this.model.set({faded: false},{silent:true});
    },

    render: function() {
      _dbg.log('[AssociatedProduct] rendering...');
      var tmpl = _.template(
        "<a href='#' class='assign-product-link'>" +
          "<img src='{{ image }}' alt='Unselected Product Picture {{ id }}' />" +
        "</a>" +
        "<span class='remove-item'></span>" +
        "<div class='toggle'></div>"
      );
      this.$el.html( tmpl( this.model.toJSON() ) );
      var onState = true;
      if( this.model.has('pictured') ) {
        onState = this.model.get('pictured');
      }
      $('.toggle',this.$el).toggles({ontext: 'Pictured', offtext: 'Similar', on: onState });
      $('.toggle',this.$el).on('click', function (e) {
        // stops clicking on the toggle from triggering click that will remove product from associated products view
        e.stopPropagation();
      });

      this.$toggle = this.$toggle || this.$('.toggle');

      _e.off('toggle:done', this.handleToggle);
      _e.on('toggle:done', this.handleToggle, this);

      if (this.options.tooltip) {
        setTimeout(this.renderTooltip,0);
      }
      return this;
    },

    renderTooltip: function() {
      this.$toggle.tooltip({
        title: "Is this item <b>pictured in your look</b> or is it <b>similar to your look</b>?<span class='tooltip-close'>x</span>",
        placement: "top",
        html: true,
        trigger: "manual",
        container: this.$el.closest('.modal')
      });
      this.$el.closest('.modal').on('click', '.tooltip-close', this.closeTooltip);
      this.$toggle.tooltip('show');
    },

    closeTooltip: function(ev) {
      $(ev.currentTarget).closest('.tooltip').remove();
    },

    handleToggle: function() {
      this.$toggle.tooltip('destroy');
    },

    handleClick: function() {
      _e.trigger('outfit-product-tagger:associated-product:click',this.model.get('id'));
    }


  });

})();
(function(){
  'use strict';

  var outfitProductTagger;

  StyleGallery.Views.AssociatedProductsView = StyleGalleryBase.Views.CarouselView.extend({

    tagName: 'ul',

    pageSize: 4,
    isReadyForCarousel: false,

    wasEmptyWhenPristine: false,
    tooltipActive: false,

    events: {
      // Override OS image drag to allow swipe on desktop
      'mousedown img': function(e) {e.preventDefault();}
    },

    initialize: function() {
      this.listenTo(this.collection, 'reset', this.onChange);
      this.listenTo(this.collection, 'add', this.onChange);
      this.listenTo(this.collection, 'remove', this.onChange);
      _e.off('outfit-product-tagger:catalog-product:click',this.addProduct);
      _e.on('outfit-product-tagger:catalog-product:click',this.addProduct,this);
      _e.off('outfit-product-tagger:associated-product:click',this.removeProduct);
      _e.on('outfit-product-tagger:associated-product:click',this.removeProduct,this);
      _e.off('toggle:done', this.submitPicturedOrInspiredBy);
      _e.on('toggle:done', this.submitPicturedOrInspiredBy, this);

      this.listenTo(this, 'carousel-view:change', this.showOrHideNavigation);

      this.listenTo(this, 'show', this.onShow);

      StyleGalleryBase.Views.CarouselView.prototype.initialize.apply(this, arguments);
    },

    render: function() {
      _dbg.log('[AssociatedProductsView::render]');

      this.setOutfitProductTagger();

      if (!this.collection.isEmpty()) {
        this.isReadyForCarousel = true;
      }

      return this;
    },

    onShow: function() {
      if (this.$el.is(':empty')) {
        this.setupCarousel();
      }

      if (!this.collection.isEmpty()) {
        this.showOrHideNavigation();
      }
    },

    onChange: function() {

      var $galleryTagProducts = $('.gallery-tag-products');

      this.tooltipActive = this.wasEmptyWhenPristine && this.collection.modificationCount == 1;

      if(this.collection.isEmpty()) {
        if (this.collection.pristine) {
          this.wasEmptyWhenPristine = true;
        }
        $galleryTagProducts.removeClass('has-products');
        $('.back-next-btn.next-button').html('Skip <span class="nav-icon">&raquo;</span>');
      } else {
        if (this.$el.closest('body').length) {
          this.isReadyForCarousel = true;
        }
        $galleryTagProducts.addClass('has-products');
        $('.back-next-btn.next-button').html('Done <span class="nav-icon">&raquo;</span>');
      }

      this.removeTooltips();
    },

    renderItem: function(product, i) {
      var productView = new StyleGallery.Views.AssociatedProductView({
        model: product,
        tooltip: this.tooltipActive && i == 0
      });
      return productView.render().el;
    },

    removeTooltips: function() {
      this.$el.closest('.modal').find('.tooltip').remove();
    },

    addProduct: function(id) {
      var product, that = this;
      if (!_.isNumber(id)) { return; }

      product = new StyleGallery.Models.Product({id: id});
      product.fetch({
        success: function() {
          that.collection.add(product);
          outfitProductTagger.model.addProduct(product);
        }
      });
    },

    removeProduct: function(id){
      var that = this;
      // Note: if the remove ajax fails, the user won't know
      var product = this.collection.get(id);
      that.collection.remove(product);
      outfitProductTagger.model.removeProduct(product);
    },

    updatePicturedOrInspiredBy: function(id, isPictured) {
      var product = this.collection.get(id);
      if (product) {
        product.set({pictured: isPictured}, {silent: true});
      }
    },

    setOutfitProductTagger: function() {
      outfitProductTagger = window.currentWizard.stepForStepName('OutfitProductTagger');
    },

    showOrHideNavigation: function() {
      var $galleryTagProducts = $('.gallery-tag-products');

      $galleryTagProducts.removeClass('last-page');
      $galleryTagProducts.removeClass('first-page');

      if (this.isFirstPage()) {
        $galleryTagProducts.addClass('first-page');
      }
      if (this.isLastPage()) {
        $galleryTagProducts.addClass('last-page');
      }
    },

    submitPicturedOrInspiredBy: function(element, active) {
      var associatedProductsView = this;
      var productId = $(element).parents('li').data('id');
      var outfitId = outfitProductTagger.model.get('id');
      var product = this.collection.get(productId);

      associatedProductsView.updatePicturedOrInspiredBy(productId, active);

      product.whenUnlocked(function() {
        $.ajax({
          type: 'PUT',
          data: { active: active },
          url: window.router.paths.outfitUpdatePicturedProduct(outfitId, productId)
        });
      });
    }
  });
})();
(function(){
  'use strict';
  StyleGallery.Views.CatalogProductView = Backbone.Marionette.ItemView.extend({

    tagName: 'li',
    className: 'product-browser-catalog-product',

    template: 'upload/catalog_product',

    events: {
      'click': "handleClick"
    },

    modelEvents: {
      'change': 'render'
    },

    attributes: function() {
      var attr = {};
      attr['data-id'] = this.model.get('id');
      return attr;
    },

    serializeData: function() {
      this.archived = this.model.get('state') == 'archived';
      this.image = 'http://' + this.model.get('image_url');

      return $.extend({ archived: this.archived, image: this.image }, this.model.toJSON());
    },

    onRender: function() {
      _dbg.log('[CatalogProductView::render]');

      this.$('img').error(function() {
        $(this).hide();
      });

      if(this.archived) {
        this.$el.addClass('archived');
      }

      if(this.model.get('faded')) {
        this.$el.addClass('faded');
      }
    },

    fade: function() {
      this.model.set({faded:true});
      this.$el.addClass('faded');
    },

    unfade: function() {
      this.model.set({faded:false});
      this.$el.removeClass('faded');
    },

    handleClick: function(event) {
      event.preventDefault();
      if (this.archived) {
        return;
      }
      _e.trigger('outfit-product-tagger:catalog-product:click',this.model.get('id'));
      this.fade();
    }

  });

})();
(function() {
  'use strict';

  StyleGallery.Views.CatalogProductsView = Backbone.Marionette.CollectionView.extend({

    itemView: StyleGallery.Views.CatalogProductView,

    collectionEvents: {
      'change:done': 'manageNextPrevButtons'
    },

    initialize: function() {
      _dbg.log('[CatalogProductsView::initialize]');
      // TODO - TECH DEBT. Zombie views listening to global events. Refactor to make use listenTo and bubbling
      _e.on('outfit-product-tagger:associated-product:click',this.unfadeProduct,this);
    },

    onBeforeRender: function() {
      if (this.collection.length) {
        var associatedProductIds = this.options.associatedProductsCollection.pluck('id');
        this.collection.chain().filter(function(product) {
          return _.include(associatedProductIds, product.get('id'));
        }).invoke('fade');
      }
    },

    onRender: function() {
      _dbg.log('[CatalogProductsView::render]');
      if(this.collection.length == 0  && this.collection.currentPage == 1) {
        this.showErrorMessage(this.collection.slug);
      }
    },

    unfadeProduct: function(pid) {
      var view = this.children.find(function(p) { return p.model.get('id') == pid; });
      if (view) {
        view.unfade();
      }
    },

    showErrorMessage: function(slug) {
      if(slug == 'order-history') {
        $('.no-products-msg').html('You haven’t ordered from us yet, have you? No worries! You can still add similar items inspired by your look, too. Just use the Search box, or <a class="no-order-history-msg-link" href="#">Browse ModCloth!</a>').show();
      } else if(slug == 'perform-search') {
        var keyword = $('input#search').val();
        $('.no-products-msg').html('Sorry, no results found for "' + keyword + '". Please try another search.').show();
      }
    },

    manageNextPrevButtons: function(){
      var collection = this.collection;
      var showNext = true; var showPrev = true;

      // Hide prev button if user is in first page
      if(collection.currentPage == 1){
        showPrev = false;
      }
      // Hide next button for last page
      if(collection.length < collection.perPage || collection.length == 0) {
        showNext = false;
      }
      $('a.collection-next').toggle(showNext);
      $('a.collection-prev').toggle(showPrev);
    }
  });
})();
(function ($) {
  'use strict';

  var modal;

  StyleGallery.Views.OutfitProductSubmitterView = Backbone.Marionette.ItemView.extend({
    className: 'gallery-tag-products-submitter',

    viewName: 'OutfitProductSubmitter', // Used to name the step in the wizard

    template: 'upload/confirmation',

    modelEvents: {
      'change': 'submitPhoto render'
    },

    initialize: function() {
      if ($(window).width() < 1025) {
        this.template = 'upload/confirmation_mobile';
      }
    },

    serializeData: function() {
      var editAccountURL = 'https://www.modcloth.com/customers/accounts/' + StyleGallery.currentUser.get('id') + '/edit';
      var galleryURL = window.router.paths.gallery('',true);
      return _.extend(this.model.toJSON(), {
        editAccountURL: editAccountURL,
        galleryURL: galleryURL
      });
    },

    onRender: function() {
      _dbg.log('[OutfitProductSubmitterView] rendering...');

      this.$el.appendTo('.modal#uploadWizard');

      utils.ensureMobileModalHeader();

      this.route = window.router.paths.submitOutfit(this.model.get('id'));

      setTimeout(function(){
        $('#close-hi-five').click();
      },20000);

      return this;
    },

    submitPhoto: function() {
      this.model.save({state: 'pending'},{
        // 
      });
    },


    viewWillRender: function(data) {
      this.model.set({id: data.outfitId}, {silent: true});
      this.model.fetch(); // TODO - maybe we shouldn't be fetching here but in render?
    }

  });

})(jQuery);
window.StyleGallery.Views.OutfitView = Backbone.Marionette.Layout.extend({
  className: 'outfit',

  events: {
    'click .gallery-overlay-trigger': 'showDetailView',
    'click .touch-share-trigger':     'toggleSharingWidget',
    'click .meta-bar':                'dismissSharingWidget'
  },

  defaults: function() {
    return {
      imageDimensions: {
          width: 320,
          height: 0
      }
    };
  },

  regions: {
    loveButton: ".bb-love-button",
    shareWidget: ".share-widget-container"
  },

  templateHelpers: {
    moderatedAtTimeAgo: function(){
      if (this.moderated_at) {
        return moment(this.moderated_at).fromNow();
      } else {
        return 'Recently';
      }
    }
  },

  template: 'gallery/outfit',

  attributes: function() {
    var attr = {};
    var id = this.model.get('id');
    attr['id'] = 'image-' + id;
    attr['data-id'] = id;
    attr['data-page'] = this.options.page;
    attr['data-height'] = this.model.get('images').medium.height;
    attr['data-width'] = this.model.get('images').medium.width;
    return attr;
  },

  initialize: function() {
    _dbg.log('[OutfitView::initialize]');
    _.bindAll(this, 'showDetailView');

    this.options = _.defaults(this.options, this.defaults());
    this.loveButtonView = (this.options.loveButtonView ||
      new StyleGallery.Views.LoveButtonView({ model: this.model })
    );
    this.sharingWidgetView = (this.options.sharingWidgetView ||
      new StyleGallery.Views.SocialSharingWidget({ model: this.model })
    );
  },

  onRender: function() {
    this._setImageDimensions();
    this.loveButton.show(this.loveButtonView);
    this.shareWidget.show(this.sharingWidgetView);
  },

  showDetailView: function(event) {
    if(event) { event.preventDefault(); }

    // trigger click event
    mc_shared_assets.analytics.api.pushContext( { outfitId: this.model.get('id') });
    mc_shared_assets.analytics.api.trackEvent('outfitDetailViewClick', {} );

    window.router.navigate(window.router.paths.galleryOutfit(this.model.get('id')), {trigger: true});
  },

  toggleSharingWidget: function() {
    var $shareEl, currentlyVisible;
    $shareEl = this.$el.find('.share-widget');
    currentlyVisible = $shareEl.is(':visible');

    this.dismissSharingWidget();
    $shareEl.parent().toggle(!currentlyVisible);
    return false;
  },

  dismissSharingWidget: function() {
    if ( Modernizr.touch ) {
      $('.share-widget-container').hide();
    }
  },

  setPositionAndScaleFactor: function(top, left, scaleFactor) {
    this._setPosition(top, left);
    this._setScaleFactor(scaleFactor);
    this._setImageUrl();
    this.$el.show();
  },

  getHeight: function() {
    return this.$el.outerHeight();
  },

  _setScaleFactor: function(scaleFactor) {
    var imageDimensions = this.options.imageDimensions;
    imageDimensions.width = Math.floor(
      this.model.get('images').medium.width * scaleFactor );
    imageDimensions.height = Math.floor(
      this.model.get('images').medium.height * scaleFactor );

    this._setImageDimensions();
  },

  _setImageDimensions: function() {
    this.$el.find('.outfit-image').css({
      'width': this.options.imageDimensions.width + 'px',
      'height': this.options.imageDimensions.height + 'px'
    });
    this.$el.find('.meta-bar').css({
      'width': (this.options.imageDimensions.width - 10) + 'px'  // -10 because element's padding and margin
    });
  },

  _setImageUrl: function() {
    var optimalImageUrl = this.model.get('images').medium.url;
    this.$el.find('img.outfit-image').attr('src', optimalImageUrl);
  },

  _setPosition: function(top, left) {
    this.$el.css({
      top: top,
      left: left
    });
  }
  
});
StyleGallery.Views.OutfitsView = Backbone.View.extend({

  initialize: function() {
    this.callbacksOn = false;

    _.bindAll(this, '_renderIfNewFilter', '_handleScrollToBottom', '_turnOffCallbacks', '_turnOnCallbacks');

    _e.off('outfitDetail:didRender', this._hideShareWidgets);
    _e.on('outfitDetail:didRender', this._hideShareWidgets, this);

    _e.off('outfitDetail:didRender', this._turnOffCallbacks);
    _e.on('outfitDetail:didRender', this._turnOffCallbacks, this);

    _e.off('outfitDetail:didClose', this._handleContainerWidthChange);
    _e.on('outfitDetail:didClose', this._handleContainerWidthChange, this);

    _e.off('outfitDetail:didClose', this._turnOnCallbacks);
    _e.on('outfitDetail:didClose', this._turnOnCallbacks, this);

    this._turnOffCallbacks();
    this._turnOnCallbacks();

    this.listenTo(this.collection, 'change:done', this.render);
    this.listenTo(this.collection, 'reset', this.render);

    this._layout = this._createOutfitsLayout();
    this.listenTo(this._layout, 'change:height', this._handleLayoutHeightChange);

    this.AllOutfits = new StyleGallery.Collections.Outfits();
  },

  fetchOutfits: function() {
    // If we haven't loaded any outfits, fetch some.
    // Otherwise, only fetch outfits if the filter (loved/latest/etc) has changed
    if ( this.collection.length === 0 ) {
      this.collection.fetch();
    } else if (!initialBackboneData.resourceIdentifier) {
      this._renderIfNewFilter();
    }
  },

  render: function() {
    if ( this.collection.length === 0 && this.emptyView ) {
      //if (window.features && features.follow){
        var view = new this.emptyView({collection: this.collection});
        this.$el.html(view.render().el);
      //} else {
        //utils.redirect('/style-gallery/');
      //}
    } else {
      _dbg.log('[OutfitCollectionView::render]');

      this._showLoadingMessage();

      var outfitViews = this.collection.map(this._renderOutfit, this);
      this._layout.flowOutfits(outfitViews, this.collection.currentPage === 1);
      $(window).data('scrollAjaxReady', true); // start listening to scroll events now

      // set analytics context
      mc_shared_assets.analytics.api.pushContext({currentView: 'outfitCollectionView'});

      if (this.collection.isLastPage()) {
        this._hideLoadingMessage();
      }
    }

    return this;
  },

  _renderOutfit: function(outfit) {
    var view = this._createOutfitView({
      model: outfit,
      page: this.collection.currentPage
    });
    this.$el.append(view.render().el);
    this.AllOutfits.push(outfit);
    return view;
  },

  _turnOffCallbacks: function() {
      _e.off('scroll:bottom', this._handleScrollToBottom);
      _e.off('window:resize', this._handleContainerWidthChange);
      _e.off('orientationDidChange', this._handleContainerWidthChange);
      this.callbacksOn = false;
  },

  _turnOnCallbacks: function() {
    if (this.callbacksOn === false) {
      _e.on('scroll:bottom', this._handleScrollToBottom, this);
      _e.on('window:resize', this._handleContainerWidthChange, this);
      _e.on('orientationDidChange', this._handleContainerWidthChange, this);
      this.callbacksOn = true;
    }
  },

  _handleLayoutHeightChange: function(layout, height) {
    this.$el.css('height', height + 'px');
  },

  _handleContainerWidthChange: function() {
    this._layout.set( 'containerWidth', this._getContainerWidth() );
  },

  _getContainerWidth: function() {
    return this.$el.width();
  },

  _createOutfitView: function(options) {
    return new StyleGallery.Views.OutfitView(options);
  },

  _createOutfitsLayout: function() {
    var options = { containerWidth: this._getContainerWidth() };
    return this.options.layout ||
      new StyleGallery.Models.OutfitsLayout(options);
  },

  _hideLoadingMessage: function() {
    $('.spindicator').hide();
  },

  _showLoadingMessage: function() {
    $('.spindicator').show();
  },

  // TODO - Tech Debt - should this logic be in the collection instead?
  _renderIfNewFilter: function() {
    // selectedScope = what user has chosen
    // activeScope = what the last request was made with
    var scopeIsNotSet = typeof(this.collection.activeScope) === 'undefined';
    var scopeHasChanged = this.collection.activeScope !== this.collection.selectedScope;
    var filterHasChanged = this.collection.activeFilter !== this.collection.selectedFilter;

    if ( scopeIsNotSet || scopeHasChanged || filterHasChanged ) {
      this.$el.find('.outfit').remove();
      this.stopListening(this._layout, 'change:height', this._handleLayoutHeightChange);
      this._layout = this._createOutfitsLayout();
      this.listenTo(this._layout, 'change:height', this._handleLayoutHeightChange);
      this.collection.currentPage = 1;
      this.collection.fetch();
    }
  },

  _handleScrollToBottom: function() {
    if( this.collection.length > 0 && !this.collection.isLastPage() ) {
      this.collection.requestNextPage();
    }
  },

  _hideShareWidgets: function() {
    if ( Modernizr.touch ) {
      $('.share-widget-container').hide();
    }
  }

});
StyleGallery.Controllers.ActionBarController = Marionette.Controller.extend({
  follow : function(){
    _dbg.log('ActionBarController::follow');

    var followFeatureEnabled = window.features && features.follow;
    if (!followFeatureEnabled) {
      return this.upload();
    }

    StyleGallery.followBarView = new StyleGallery.Views.FollowBarView({
      model: StyleGallery.currentProfile
    });

    this.options.region.show(StyleGallery.followBarView);
  },
  upload : function(){
    _dbg.log('ActionBarController::upload');

    StyleGallery.uploadBarView = StyleGallery.uploadBarView || new StyleGallery.Views.UploadBarView();
    this.options.region.show(StyleGallery.uploadBarView);
  }
});
StyleGallery.Modules.ActionBarModule = {
  startWithParent: false,
  define: function(){

    this.router = {
      routes: function() {
        var routes = {};
        if (StyleGallery.currentUser) {
          routes['^users/' + StyleGallery.currentUser.id] = 'upload';
        }
        routes['^users/(\\d)']                          = 'follow';
        routes['.*']                                    = 'upload';
        return routes;
      },

      onPageView: function() {
        var that = this;
        var path = Backbone.history.getFragment();

        _.any(_.result(this.router, 'routes'), function(action, pattern) {
          var match = new RegExp(pattern).exec(path);
          if (match) {
            that.controller[action].apply(that.controller, match.slice(1));
            return true;
          }
        });
      }
    };

    this.on('start', function(region){
      this.region = region;
      this.controller = new StyleGallery.Controllers.ActionBarController({ region: region });
      this.app.vent.on('pageview', _.bind(this.router.onPageView, this));
    });
  }
};
StyleGallery.Controllers.BannerController = Marionette.Controller.extend({
  
  followableUserCollection: function() {
    if (!( window.features && features.follow )) {
      return this.nonFollowableUserCollection();
    }
    _dbg.log('BannerController::followableUserCollection');
    this.options.region.show(this.options.layout);
    this.options.layout.$el.addClass('followable');
    this.options.layout.title.show( new StyleGallery.Views.TitleBannerView() );
    this.options.layout.subtitle.show( new StyleGallery.Views.SubtitleTagView() );
    this.options.layout.button.show( new StyleGallery.Views.TitleFollowButtonView() );
    if ( window.features && features.follow ) {
      this.options.layout.relationships.show( new StyleGallery.Views.FollowHeader({ parentEl: this.options.layout.subtitle.el }) );
    }
  },

  nonFollowableUserCollection: function() {
    _dbg.log('BannerController::nonFollowableUserCollection');
    this.options.region.show(this.options.layout);
    this.options.layout.title.show( new StyleGallery.Views.TitleBannerView() );
    this.options.layout.subtitle.show( new StyleGallery.Views.SubtitleTagView() );
    this.options.layout.button.show( new StyleGallery.Views.TitleButtonView() );
    if ( window.features && features.follow ) {
      this.options.layout.relationships.show( new StyleGallery.Views.FollowHeader({ parentEl: this.options.layout.subtitle.el }) );
    }
  },

  gallery: function() {
    _dbg.log('BannerController::gallery');
    this.options.region.show(this.options.layout);
    this.options.layout.title.show(new StyleGallery.Views.TitleBannerView());
    this.options.layout.subtitle.show(new StyleGallery.Views.SubtitleBaseView());
    this.options.layout.button.show(new StyleGallery.Views.TitleButtonView());
  },

  tagsCollection: function() {
    _dbg.log('BannerController::tagsCollection');
    this.options.region.show(this.options.layout);
    this.options.layout.title.show(new StyleGallery.Views.TitleBannerView());
    this.options.layout.subtitle.show(new StyleGallery.Views.SubtitleTagView());
    this.options.layout.button.show(new StyleGallery.Views.TitleButtonView());
  }
});
StyleGallery.Modules.BannerModule = {
  startWithParent: false,
  define: function(){

    this.router = {
      routes: function() {
        var routes = {};
        if (StyleGallery.currentUser) {
          routes['^users/' + StyleGallery.currentUser.id] = 'nonFollowableUserCollection';
        }
        routes['^users/(\\d+)']                          = 'followableUserCollection';
        routes['^$']                                     = 'gallery';
        routes['^loved']                                 = 'gallery';
        routes['^loved/(.*)']                            = 'gallery';
        routes['^latest']                                = 'gallery';
        routes['^latest/(.*)']                           = 'gallery';
        routes['^featured']                              = 'gallery';
        routes['(.*)']                                   = 'tagsCollection';
        return routes;
      },

      onPageView: function() {
        var that = this;
        var path = Backbone.history.getFragment();

        _.any(_.result(this.router, 'routes'), function(action, pattern) {
          var match = new RegExp(pattern).exec(path);
          if (match) {
            that.controller[action].apply(that.controller, match.slice(1));
            return true;
          }
        });
      }
    };

    this.on('start', function(region){
      this.region = region;
      this.layout = new StyleGallery.Views.BannerLayout();
      this.controller = new StyleGallery.Controllers.BannerController({ region: region, layout: this.layout });
      this.app.vent.on('pageview', _.bind(this.router.onPageView, this));
    });
  }
};
StyleGallery.Views.BannerLayout = Backbone.Marionette.Layout.extend({
  template: 'gallery/banner_layout',
  regionType: StyleGallery.FlatRegion,
  regions: {
    'button':         '.title-button',
    'title':          '.title',
    'subtitle':       '.subtitle',
    'relationships':  '.relationships'
  }
});
GalleryController = Backbone.Marionette.Controller.extend({
 gallery: function() {
    _dbg.log('[Router::gallery]');
    utils.pageViewDidHappen( { page_name: "modcloth>style-gallery" } );

    var outfitsCollection = new StyleGallery.Collections.PaginatedOutfits();
    var outfitsViewOptions = { collection: outfitsCollection, el: $('.outfits') };

    this._withinGalleryLayout(function() {
      StyleGallery.outfitCollectionView = window.StyleGallery.outfitCollectionView || new StyleGallery.Views.OutfitsView( outfitsViewOptions );
      StyleGallery.scopeView = StyleGallery.scopeView || new StyleGallery.Views.ScopeView( window.initialBackboneData.validScopes );
      StyleGallery.scopeView.registerPaginator( StyleGallery.outfitCollectionView.collection );
      StyleGallery.scopeView.render();
    });

    StyleGallery.outfitCollectionView.fetchOutfits();

    // Close outfitDetailView if it is open (eg user has pressed the back button)
    StyleGallery.outfitDetailView && StyleGallery.outfitDetailView.close();
    GalleryApplication.vent.trigger('pageview');
  },

  tagsCollection: function(slug) {
    _dbg.log('[Router::outfitsCollection]');
    utils.pageViewDidHappen( { page_name: "modcloth>style-gallery>" + slug } );
    StyleGallery.rootCollectionUrl = slug;

    this.renderViewForCollection(new StyleGallery.Collections.PaginatedOutfitsByTag(), {
      showSliver: false
    });
    GalleryApplication.vent.trigger('pageview');
  },

  renderViewForCollection: function(collection, options) {
    // maybe pass in the slug
    //var outfitsViewOptions = { collection: new StyleGallery.Collections.PaginatedCollectionTagsOutfits(), el: $('.outfits') };
    var outfitsViewOptions = { collection: collection, el: $('.outfits') };
    StyleGallery.outfitCollectionView = StyleGallery.outfitCollectionView || new StyleGallery.Views.OutfitsView( outfitsViewOptions );

    this._withinGalleryLayout(null, options);

    StyleGallery.outfitCollectionView.fetchOutfits();
    StyleGallery.outfitDetailView && StyleGallery.outfitDetailView.close();
  },

  _withinGalleryLayout: function(callback, options) {
    var options = _.defaults(options || {}, {
      showSliver: true,
    });

    if(!StyleGallery.titleBannerView) {
      StyleGallery.titleBannerView = new StyleGallery.Views.TitleBannerView();
      StyleGallery.titleBannerView.render();
    }

    if(!StyleGallery.sliverView) {
      StyleGallery.sliverView = new StyleGallery.Views.SliverView();
      StyleGallery.sliverView.render();
    }

    if (callback) {
      callback();
    }
  },

  galleryUpload: function(){
    _dbg.log('[Router::galleryUpload]');
    utils.pageViewDidHappen();

    if(StyleGallery.currentUser) {
      currentWizard.setCurrentStep('Upload');
      currentWizard.render();
    } else {
      utils.redirect(router.paths.signIn());
    }
    GalleryApplication.vent.trigger('pageview');
  },

  galleryInstagramUpload: function(){
    _dbg.log('[Router::galleryInstagramUpload]');
    utils.pageViewDidHappen();

    if(StyleGallery.currentUser) {
      _.extend(currentWizard.data, { mode: 'instagram' });
      currentWizard.setCurrentStep('Upload');
      currentWizard.render();
    } else {
      utils.redirect(router.paths.signIn());
    }
    GalleryApplication.vent.trigger('pageview');
  },

  outfitPreview: function(id){
    mc_shared_assets.analytics.api.trackEvent('pageView');
    _dbg.log('[Router::outfitPreview]');

    utils.redirectWhenSignedOut();

    StyleGallery.scopeView = StyleGallery.scopeView || new StyleGallery.Views.ScopeView( window.initialBackboneData.validScopes );

    _.extend(currentWizard.data, {
      outfitId: id,
      mode: 'preview'
    });
    currentWizard.setCurrentStep('OutfitProductTagger');
    currentWizard.render();
    GalleryApplication.vent.trigger('pageview');
  },

  outfitProductTagger: function(id){
    _dbg.log('[Router::outfitProductTagger]');
    utils.pageViewDidHappen();

    if (!window.StyleGallery.currentUser) {
      utils.redirect( router.paths.signIn() );
      return;
    }

    utils.redirectWhenSignedOut();

    StyleGallery.scopeView = StyleGallery.scopeView || new StyleGallery.Views.ScopeView( window.initialBackboneData.validScopes );

    _.extend(currentWizard.data, {
      outfitId: id,
      mode: 'tagger'
    });
    currentWizard.setCurrentStep('OutfitProductTagger');
    currentWizard.render();
    GalleryApplication.vent.trigger('pageview');
  },

  outfit: function(id) {
    _dbg.log('[Router::outfitView]');
    utils.pageViewDidHappen( { page_name: "modcloth>style-gallery>outfit>" +id, outfitId: id });
    mc_shared_assets.analytics.api.trackEvent('outfitDetailView');

    window.StyleGallery.outfitDetailView =
      new StyleGallery.Views.OutfitDetailView({model: new StyleGallery.Models.Outfit()});

    if( typeof StyleGallery.scopeView === 'undefined' ) {
      StyleGallery.scopeView = new StyleGallery.Views.ScopeView( window.initialBackboneData.validScopes );
    }

    var outfitsViewOptions = { collection: new StyleGallery.Collections.PaginatedOutfits(), el: $('.outfits') };
    if( typeof window.StyleGallery.outfitCollectionView === 'undefined' ) {
      window.StyleGallery.outfitCollectionView = new StyleGallery.Views.OutfitsView( outfitsViewOptions );
    }

    var shouldFetch, model;
    // Grab outfit from collection if present...
    if (typeof StyleGallery.outfitCollectionView !== 'undefined') {
      model = StyleGallery.outfitCollectionView.collection.get(id);
    }
    if (!model) {
      // otherwise we'll instantiate a new model
      model = new StyleGallery.Models.Outfit({id: id});
      shouldFetch = true;
    }

    StyleGallery.outfitDetailView = new StyleGallery.Views.OutfitDetailView({model: model});

    // avoid fetching the model if we already have it's data
    if (shouldFetch) {
      StyleGallery.outfitDetailView.model.fetch();
    } else {
      StyleGallery.outfitDetailView.render();
    }

    GalleryApplication.vent.trigger('pageview');
  },

  submitOutfit: function(id) {
    _dbg.log('[Router::submitOutfit]');
    utils.pageViewDidHappen();
    currentWizard.data.outfitId = id;
    currentWizard.setCurrentStep('OutfitProductSubmitter');
    currentWizard.render();
    GalleryApplication.vent.trigger('pageview');
  },

  setCurrentProfile: function(opts) {
    StyleGallery.currentProfile = new StyleGallery.Models.Profile({account_id: opts.id});
    StyleGallery.currentProfile.fetch();
  }

});
GalleryRouter = Backbone.Marionette.AppRouter.extend({
  appRoutes: {
    "style-gallery":              "gallery", // what backbone sees as the fragment when on root path without a trailing slash
    "":                           "gallery", // what backbone sees as the fragment when on root path with a trailing slash
    "latest":                     "gallery",
    "latest/:filter":             "gallery",
    "loved":                      "gallery",
    "loved/:filter":              "gallery",
    "featured":                   "gallery",
    "upload_photo":               "galleryUpload",
    "instagram/upload_photo":     "galleryInstagramUpload",
    "outfit/:id/preview":         "outfitPreview",
    "outfit/:id/assign_products": "outfitProductTagger",
    "outfit/:id/submit":          "submitOutfit",
    "outfits/:id":                "outfit",
    ":slug":                      "tagsCollection"
  },

  initialize: function(options) {
    // Hack Marionette AppRouter (v1.1.0) to enable this.appRoute() in #initialize
    this.options = options || {};

    StyleGalleryBase.Routers.Paths.mixin(this);
    StyleGalleryBase.Routers.TrailingSlash.mixin(this);
  }
});
GalleryApplication = new Backbone.Marionette.Application();

GalleryApplication.addInitializer(function() {
  window.controller = new GalleryController();
  window.router = new GalleryRouter({
    controller : window.controller
  });

  this.module('Banner').start(this.headerRegion);
  this.module('ActionBar').start(this.actionRegion);

  utils.startBackboneHistory();
});

GalleryApplication.addRegions({
  headerRegion : '#style-gallery-banner',
  contentRegion : '#gallery',
  actionRegion : '#fixed'
});

GalleryApplication.module('Banner', StyleGallery.Modules.BannerModule);
GalleryApplication.module('ActionBar', StyleGallery.Modules.ActionBarModule);
$(function() {
  // Start Gallery backbone app
  _dbg.log("[:: Launching Style Gallery App]");

  StyleGallery.Initializers.styleGalleryApp();
  window.app = GalleryApplication;
});
/*
 * jQuery resize event - v1.1 - 3/14/2010
 * http://benalman.com/projects/jquery-resize-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

(function($,h,c){var a=$([]),e=$.resize=$.extend($.resize,{}),i,k="setTimeout",j="resize",d=j+"-special-event",b="delay",f="throttleWindow";e[b]=250;e[f]=true;$.event.special[j]={setup:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.add(l);$.data(this,d,{w:l.width(),h:l.height()});if(a.length===1){g()}},teardown:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.not(l);l.removeData(d);if(!a.length){clearTimeout(i)}},add:function(l){if(!e[f]&&this[k]){return false}var n;function m(s,o,p){var q=$(this),r=$.data(this,d);r.w=o!==c?o:q.width();r.h=p!==c?p:q.height();n.apply(this,arguments)}if($.isFunction(l)){n=l;return m}else{n=l.handler;l.handler=m}}};function g(){i=h[k](function(){a.each(function(){var n=$(this),m=n.width(),l=n.height(),o=$.data(this,d);if(m!==o.w||l!==o.h){n.trigger(j,[o.w=m,o.h=l])}});g()},e[b])}})(jQuery,this);
mc_shared_assets.scope('mc_shared_assets.social_sharing.product', function (self) {

    self.create = function (services, context) {

        var view = {
            contextFn:null
        };

        view.initialize = function () {
            view.$el = $('<div></div>').addClass('social-sharing-product').data('view', view);

            for (var i = 0; i < services.length; i++) {
                view.$el.append(createService(services[i]));
            }

            return view;
        }


        view.getContext = function () {
            var c = context || {};
            if (view.contextFn) {
                $.extend(c, view.contextFn());
            }
            return c;
        }

        function createService(name) {
            var downName = name.toLowerCase();
            var $service = $('<a></a>').text(name).attr('href', '#').addClass('social-sharing icon-24 ' + downName);
            $service.click(function (e) {
                e.stopImmediatePropagation();
                mc_shared_assets.trigger('trackEvent', 'social-share-' + downName, view.getContext());
                view['shareOn' + name].call(view);
                return false;
            });
            return $service;
        }

        view.shareOnTwitter = function () {
            window.open("http://twitter.com/home?status=" + encodeURIComponent(getTweet()), '_share_twitter', 'height=400, width=700');
        }

        view.shareOnFacebook = function () {
            var queryStr = 'link=' + encodeURIComponent(getProductUrlWithCampaignTracking('facebook')) + '&name=' + encodeURIComponent(getFacebookTitle());
            queryStr += '&app_id=235443466567312'; // ModCloth's app ID, registered with facebook.
            queryStr += '&redirect_uri=' + encodeURIComponent(getRedirectUrl());
            queryStr += '&description=' + encodeURIComponent(getProductSummary());
            queryStr += '&picture=' + encodeURIComponent(getProductImage());
            if (isPhone()) {
                view.facebookSharingRedirect('http://m.facebook.com/dialog/feed?', queryStr)
            } else {
                view.facebookSharingRedirect('http://www.facebook.com/dialog/feed?', queryStr);
            }
         }


        // allow override of passed parameters
        //s=100&p[url]=URL&p[images][0]=THUMBNAIL&p[title]=TITLE&p[summary]=SUMMARY, which overrides the meta tags with the passed parameters
        //s=100&p%5B
        // url%5D=http%3A%2F%2Fwww.modcloth.com%2FGifts%2Fholiday-gift-guide&p%5Bimages%5D%5B0%5D=http%3A%2F%2Fcdn0.modcloth.com%2Fimages%2Fassets%2F0002%2F2180%2Fwinston-box.png&p%5Btitle%5D=ModCloth+Holiday+Gift+Guide&p%5Bsummary%5D=A+festive%2C+fashionable+gifting+wonderland%21

        view.shareOnPinterest = function () {
            window.open('http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(getProductUrlWithCampaignTracking('pinterest')) +
                '&media=' + encodeURIComponent(getProductImage()) +
                '&description=' + encodeURIComponent(getPin()), '_share_pinterest', 'height=320, width=600');
        }

        view.shareOnEmail = function () {
            $cache.emailModal.find('form').get(0).reset();
            $cache.emailMessage.val('Check out what I found at ModCloth!');
            $cache.emailErrors.empty();
            $cache.sharePanel.show();
            $cache.emailModal.find('.success-panel').hide();
        }

        view.showEmailShareSuccess = function (data) {
            $cache.successPanel.find('.modal-directions').text("An email has been sent to " + data.to_email + " about the " + data.product_name + ".");
            $cache.successPanel.show();
            $cache.emailModal.find('.share-panel').hide();
        }


        view.campaignParamsURIEncoded = function (source) {
            var medium = view.getContext().ga_utm_medium || '';
            var campaign = view.getContext().ga_utm_campaign || '';
            var keyword = view.getContext().ga_utm_keyword || '';
            return 'utm_source='+ source + '&utm_medium=' + medium + '&utm_campaign=' + campaign + '&utm_keyword=' + keyword;
        }

        view.facebookSharingRedirect = function(facebook_url, queryStr){
            window.location.replace(facebook_url + queryStr);
        }

        function getProductUrl() {
            return view.getContext().product_url || document.location.href;
        }

        function getProductUrlWithCampaignTracking(source) {
            var url = view.getContext().product_url || document.location.href;
            url += ((/\?/.exec(url)) ? '&' : '?') + view.campaignParamsURIEncoded(source);
            return url;
        }

        function getProductName() {
            return view.getContext().product_name;
        }

        function getProductSummary() {
            return view.getContext().product_summary;
        }

        function getProductImage() {
            return view.getContext().product_image_url;
        }

        function getRedirectUrl() {
            return view.getContext().redirect_url;
        }

        function getPin() {
            return view.getContext().pin || getProductName();
        }

        function getFacebookTitle() {
            return view.getContext().facebook_title || getProductName();
        }


        function getTweet() {
            var tweet = view.getContext().tweet || 'My heart skips a beat for the ' + getProductName() + ' that I found via @ModCloth! '
            tweet += getProductUrlWithCampaignTracking('twitter');
            return tweet;
        }

        function isPhone() {
            return view.getContext().device_type == 'phone';
        }


        return view.initialize();
    }


    self.gaEventBuilder = function (event, context) {

        switch (event) {
            case 'social-share-facebook':
                return ['social_network_share', context.ga_category_prefix ? context.ga_category_prefix + ':facebook' : 'Facebook', context.product_id];
            case 'social-share-twitter':
                return ['social_network_share', context.ga_category_prefix ? context.ga_category_prefix + ':twitter' : 'Twitter', context.product_id];
            case 'social-share-pinterest':
                return ['social_network_share', context.ga_category_prefix ? context.ga_category_prefix + ':pinterest' : 'Pinterest', context.product_id];
            case 'social-share-email':
                return ['social_network_share', context.ga_category_prefix ? context.ga_category_prefix + ':email' : 'Tell-a-Friend', context.product_id];
        }
    }

    self.omnitureEventBuilder = function (vars, context) {
        var map = {
            facebook:'Facebook',
            twitter:'Twitter',
            pinterest:'Pinterest',
            email:'Tell-a-Friend'
        };
        var m = /social-share-(.*)/.exec(context.event);
        if (m && map[m[1]]) {
            vars.linkName = vars.eVar26 = vars.prop26 = 'modcloth>share>' + map[m[1]];
            vars.events = 'event11,event80';
            vars.products = '' + context.inventory_classification_id + ';' + context.product_id;
        }
    }

    if (typeof $ == 'undefined') throw "jQuery must be included before mc_shared_assets/social_sharing/product";


    /**
     * BEGIN dataContext plugin
     * @see https://github.com/ndp/jsutils
     * Potentially include this separately, but don't want to make client include lots of stuff
     * ... hmmm... what to do.
     */
    $.fn.dataContext = function () {
        var o = {};
        var els = $.makeArray($(this).add($(this).parents())).reverse();
        for (var i = 0; i < els.length; i++) {
            $.extend(o, dataAttrs(els[i]));
        }
        return o;
    }

    function dataAttrs(el) {
        var o = {}, attrs = el.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            var names = /data\-(.*)/.exec(attrs[i].name);
            if (names) {
                o[names[1].replace(/\-/g, '_')] = attrs[i].value;
            }
        }
        return o;
    }

    /*
     * END dataContext plugin
     */


    $.fn.socialShareProduct = function (context) {
        return $(this).each(function () {
            var $el = $(this), ctx = $.extend({}, context, $(this).dataContext());
            var services = ctx.services;
            if (!$.isArray(services)) services = services.split(',');
            $el.append(self.create(services, ctx).$el);
        });
    };

    // By default, "magic" class.
    $(function () {
        $('.mc-shared-assets-social-sharing-product').socialShareProduct();
    });


});

window.utils = window.utils || {};

utils.PageViewHelper = function() {
  var that = this;

  this.setupListeners = function() {
    _e.on('router:pageView', that.pageViewEventDidFire );
  };

  this.pageViewEventDidFire = function(context) {
    utils.sharedAssetsHelper.pageViewEventDidFire(context);
    utils.optimizelyHelper.pageViewEventDidFire();
  };

};

utils.pageViewHelper = new utils.PageViewHelper();
utils.pageViewHelper.setupListeners();

window.utils = window.utils || {};

utils.SharedAssetsHelper = function() {
  var that = this;

  this.pageViewEventDidFire = function(context) {
    if (context) {
      mc_shared_assets.analytics.api.pushContext( context );
    }

    mc_shared_assets.analytics.api.trackEvent('pageView');
  };
};
utils.sharedAssetsHelper = new utils.SharedAssetsHelper();
window.utils = window.utils || {};

utils.OptimizelyHelper = function() {
  var that = this;

  this.pageViewEventDidFire = function() {
    if ( window.optimizely !== undefined ) {
      window.optimizely.push( [ 'activate' ] )
    }
  };
};
utils.optimizelyHelper = new utils.OptimizelyHelper();
!(function() {
  for(var viewName in StyleGallery.Views){
    StyleGallery.Views[viewName].__name__ = viewName;
  }
});
/* Backbone adapter for caliper.js v0.4.1 (c) 2013 Coherence Inc (https://github.com/caliper-io/caliper-backbone) */

!function(a,b,c){!function(){"use strict";var a={VERSION:"0.2.0-pre"},b=window.Caliper||{};if(b.loaded===!0){var c;return a.VERSION===b.VERSION?(c="Already loaded caliper.core  v"+a.VERSION,b.config&&b.config.debug===!0&&("function"==typeof b.warn?b.warn(c):window.console&&"function"==typeof window.console.warn?window.console.warn("[Caliper] "+c):window.console&&"function"==typeof window.console.log&&window.console.log("[Caliper] **WARNNING** "+c))):(c="Failed to load caliper.core  v"+a.VERSION+": "+"another version of caliper.core (v"+b.VERSION+") was already loaded","function"==typeof b.error?b.error(c):window.console&&"function"==typeof window.console.error?window.console.error("[Caliper] "+c):window.console&&"function"==typeof window.console.log&&window.console.log("[Caliper] **ERROR** "+c)),void 0}a.config={apiKey:null,beaconURL:"//b.caliper.io/_.gif",debug:!1,enabled:!0};for(var d in b.config)b.config.hasOwnProperty(d)&&(a.config[d]=b.config[d]);var e=function(){return!!(!window.attachEvent||window.addEventListener||window.navigator.userAgent.indexOf("MSIE 8.0")>=0)}();if(a.enabled=!(!e||!a.config.enabled),a.enabled===!1)return a.debug&&window.console&&"function"==typeof window.console.log&&window.console.log("[Caliper] Caliper is disabled"),window.Caliper=a,void 0;if(Date.now||(Date.now=function(){return(new Date).valueOf()}),a.__empty__=function(){},a.log=window.console&&"function"==typeof window.console.log?function(b){a.config.debug===!0&&window.console.log("[Caliper] "+b)}:a.__empty__,a.warn=window.console&&"function"==typeof window.console.warn?function(b){a.config.debug===!0&&window.console.warn("[Caliper] "+b)}:window.console&&"function"==typeof window.console.log?function(b){a.config.debug===!0&&window.console.log("[Caliper] **WARNNING** "+b)}:a.__empty__,a.error=window.console&&"function"==typeof window.console.error?function(a){window.console.error("[Caliper] "+a)}:window.console&&"function"==typeof window.console.log?function(a){window.console.log("[Caliper] **ERROR** "+a)}:a.__empty__,a.slice=function(a){return Array.prototype.slice.call(a)},a.setImmediate="function"==typeof window.setImmediate?function(){return window.setImmediate.apply(window,arguments)}:function(a){var b=[].slice.call(arguments,1);return window.setTimeout(function(){a.apply(null,b)},0)},a.randomStr=function(a){var b=a.length;return function(c){for(var d=[],e=0;c>e;e++)d.push(a[Math.floor(Math.random()*b)]);return d.join("")}}("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"),a.__super__=function(){throw new Error("Cannot call Caliper.__super__ outside of a wrapped function")},a.wrap=function(b,c){return function(){var d=a.__super__,e=this,f=a.slice(arguments);try{return a.__super__="function"==typeof b?function(){return this===a?0===arguments.length?b.apply(e,f):b.apply(e,arguments):b.apply(this,arguments)}:a.__empty__,c.apply(this,arguments)}finally{a.__super__=d}}},a.aliasMethodChain=function(a,b,c,d){var e=a[b];if("function"==typeof e){var f="__"+b+"_without_"+c+"__",g="__"+b+"_with_"+c+"__";a[f]=e,a[g]=a[b]=d}return a},a.nameFor=function(a){return"string"==typeof a||a instanceof String?a:a&&a.constructor?a.__name__||a.constructor.__name__:void 0},a.log("Initializing caliper.core v"+a.VERSION+"..."),!a.config.apiKey||!a.config.apiKey.length)return a.error("Failed to load caliper.core: did you forget to set your Caliper API key?"),void 0;a.sessionID=a.randomStr(16),a.log("Generated session ID "+a.sessionID),a.visitorID=a.config.visitor||function(){var b,c=function(){for(var a="_cpv=",b=document.cookie.split(";"),c=0;c<b.length;c++){var d=b[c].replace(/^\s+|\s+$/g,""),e=d.indexOf(a);if(0===e)return d.substring(5,d.length)}return void 0},d=function(a){var b=new Date(Date.now()+631152e5);return document.cookie="_cpv="+a+"; expires="+b.toGMTString()+"; path=/",a};return b=c(),b?a.log("Using existing visitor ID "+b):(b=a.randomStr(16),a.log("Generated visitor ID "+b)),d(b)}();var f=0,g=function(a){"string"==typeof a&&(a=[a]);for(var b=[],c=0;c<a.length;c++)b.push(encodeURIComponent(a[c]).replace(/[-_~%]/g,function(a){switch(a){case"-":return"~2D";case"_":return"~5F";case"~":return"~7E";case"%":return"~"}}));return b.join("-")},h=function(a){if("string"==typeof a)return g(a);for(var b=[],c=0;c<a.length;c++)b.push(g(a[c]));return b.join("_")},i=function(a){for(var b in a)return!1;return!0};a.send=function(b,c){if(!a.config.apiKey||!a.config.apiKey.length)return a.error("Attempted to call send without an API key set, payload dropped"),void 0;if(b&&b.length>0||c&&!i(c)){var d={},e=[];for(var g in a.adapters)a.adapters.hasOwnProperty(g)&&e.push(g+"-"+a.adapters[g].VERSION);d.k=a.config.apiKey,d.c=e.join("_"),d.s=a.sessionID,a.config.visitor?d.e=encodeURIComponent(a.config.visitor):d.v=encodeURIComponent(a.visitorID);var j=[];for(var k in d)d.hasOwnProperty(k)&&j.push(k+"="+d[k]);for(k in c)c.hasOwnProperty(k)&&j.push(k+"="+encodeURIComponent(c[k]));var l=f++,m=a.config.beaconURL+"?"+j.join("&");b&&(m=m+"&p="+h(b)),a.log("Sending request "+l),m.length>2e3&&a.log("Request "+l+": URL is "+m.length+" characters long, this might cause errors in some browsers!");var n=function(){a.log("Completed request "+l)},o=function(){a.log("Failed request "+l+", giving up")},p=function(b,c,d){return function(){a.log("Failed request "+l+", retrying in "+b+" seconds"),window.setTimeout(function(){a.log("Retrying request "+l),d>0?a.dispatchRequest(m,n,p(b*c,c,d-1)):a.dispatchRequest(m,n,o)},1e3*b)}};a.dispatchRequest(m,n,p(30,2,2))}},a.dispatchRequest=function(a,b,c){var d=new Image;"function"==typeof b&&(d.onload=b),"function"==typeof c&&(d.onerror=c),d.src=a},a.adapters={core:a},a.loaded=!0,window.Caliper=a,a.log("Sucessfully loaded caliper.core v"+a.VERSION)}(),function(a,b,c,d){"use strict";var e={VERSION:"0.4.1"};if(void 0===a||a.loaded!==!0)a.enabled!==!1&&(window.console&&"function"==typeof window.console.error?window.console.error("[Caliper] Failed to load caliper.backbone: caliper.core could not be found"):window.console&&"function"==typeof window.console.log&&window.console.error("[Caliper] **ERROR** Failed to load caliper.backbone: caliper.core could not be found"));else if(a.adapters&&a.adapters.Backbone)a.adapters.Backbone.VERSION===e.VERSION?a.warn("Already loaded caliper.backbone v"+e.VERSION):a.error("Failed to load caliper.backbone v"+e.VERSION+": "+"another version of caliper.backbone (v"+a.adapters.Backbone.VERSION+") was already loaded");else if(void 0===b)a.error("Failed to load caliper.backbone: Backbone could not be found");else if(void 0===c)a.error("Failed to load caliper.backbone: Underscore could not be found");else{a.log("Initializing caiper.backbone v"+e.VERSION),void 0===a.config.enableAjaxFilter&&a.config.disableAjaxFilter===!1&&(a.config.enableAjaxFilter=!0),a.config.enableAjaxFilter=a.config.enableAjaxFilter||!1,a.config.minDuration=a.config.minDuration||50;var f=c.result||function(a,b){if(!a)return null;var d=a[b];return c.isFunction(d)?d.call(a):d},g=a.wrap(a.aliasMethodChain,function(b,d,e,f){var g=b[d];if("function"!=typeof g)return b;var h=a.wrap(g,f);return h="function"==typeof g.extend?g.extend({constructor:h}):c.extend(h,g),a.__super__(b,d,e,h)});a.aliasMethodChain(a,"aliasMethodChain","underscore",g),a.aliasMethodChain(a,"nameFor","backbone",function(c){var d=a.__super__();return!d&&c instanceof b.View&&(d="UnnamedView",c.id?d=d+"<#"+f(c,"id")+">":c.className&&(d=d+"<."+f(c,"className")+">"),c.__name__=d),d});var h=function(a,b){this.method=a,this.url=b,this.startTime=Date.now(),this.pending=!0};h.prototype.stop=function(){this.pending&&(this.stopTime=Date.now(),this.pending=!1)},h.prototype.serialize=function(a){return this.pending===!1?(a=a||0,["a",this.method,this.url,this.startTime-a,this.stopTime-this.startTime]):void 0};var i=function(a){this.viewName=a,this.startTime=Date.now(),this.pending=!0};i.prototype.stop=h.prototype.stop,i.prototype.serialize=function(a){return this.pending===!1?(a=a||0,["r",this.viewName,this.startTime-a,this.stopTime-this.startTime]):void 0};var j=[],k=function(){return j[j.length-1]},l=function(a,b,c){this.klass=a,this.method=b,this.pattern=c,this.startTime=Date.now(),this.events=[],this.finalized=!1,j.push(this)};l.prototype.finalize=function(){if(this.finalized!==!0){var c;for(c=1;c<=j.length;c++)j[j.length-c]===this&&j.splice(j.length-c,1);for(c=0;c<this.events.length;c++)if(this.events[c].pending)return;if(this.stopTime=Date.now(),this.finalized=!0,this.duration=this.stopTime-this.startTime,this.duration<(a.config.minDuration||1))return a.log("Dropped: "+this.klass+"."+this.method+" ("+this.pattern+"), took "+this.duration+"ms. (minDuration is "+a.config.minDuration+"ms)"),void 0;if(a.config.enableAjaxFilter===!0){var d=!1;for(c=0;c<this.events.length;c++)if(this.events[c]instanceof h){d=!0;break}if(!d)return a.log("Dropped: "+this.klass+"."+this.method+" ("+this.pattern+"), took "+this.duration+"ms. (enableAjaxFilter is true)"),void 0}a.log("Sending: "+this.klass+"."+this.method+" ("+this.pattern+"), took "+this.duration+"ms.");try{this.url=b.history.getFragment()}catch(e){this.url=window.location.hash.length?window.location.hash.substr(1):window.location.pathname}var f={bs:this.startTime,bd:this.duration,bu:this.url};this.klass&&this.klass.length>0&&(f.bc=this.klass),this.method&&this.method.length>0&&(f.bm=this.method),this.pattern&&this.pattern.length>0&&(f.bp=this.pattern);var g=[];for(c=0;c<this.events.length;c++)g.push(this.events[c].serialize(this.startTime));a.send(g,f)}},void 0!==b.Router&&a.aliasMethodChain(b,"Router","instrumentation",function(){return a.aliasMethodChain(this,"route","instrumentation",function(){var b=a.slice(arguments),c=String(b[0]),d=b[1],e=b[2];return"/"!==c[0]&&"!"!==c[0]&&(c="/"+c),"function"==typeof d?(e=d,d=void 0):void 0===e&&(e=this[d]),e=a.wrap(e,function(){var b=k();return b?(b.klass=a.nameFor(this),b.method=d,b.pattern=c):b=new l(a.nameFor(this),d,c),a.setImmediate(function(){b.finalize()}),a.__super__()}),a.__super__.call(this,b[0],d||"",e)}),a.__super__()}),void 0!==b.View&&a.aliasMethodChain(b,"View","instrumentation",function(){a.aliasMethodChain(this,"initialize","instrumentation",function(){var b;return k()||(b=new l(a.nameFor(this),"initialize"),a.setImmediate(function(){b.finalize()})),a.__super__()}),a.aliasMethodChain(this,"render","instrumentation",function(){var b,c=k();c&&(b=new i(a.nameFor(this)),c.events.push(b));var d=a.__super__();return b&&b.stop(),d});var b=function(b,c){return a.wrap(b,function(){if(!k()){var b=new l(a.nameFor(this),c);a.setImmediate(function(){b.finalize()})}return a.__super__()})};return a.aliasMethodChain(this,"delegateEvents","instrumentation",function(){var d,e,g=a.slice(arguments),h=c.clone(g[0]||f(this,"events"));for(var i in h)if(h.hasOwnProperty(i)){if(e=h[i],c.isFunction(e)?d="UnnamedAction":(d=e,e=this[e]),!e)continue;h[i]=b(e,d)}return a.__super__(h)}),a.__super__()}),a.aliasMethodChain(d,"ajax","instrumentation",function(){var b=k();if(b){var c=arguments[1]||arguments[0],d=c.type||"GET",e=c.url||arguments[0];"string"==typeof c&&(c={});var f=new h(d,e);return b.events.push(f),c.success=a.wrap(c.success,function(){return k()!==b&&j.push(b),f.stop(),a.__super__()}),c.error=a.wrap(c.error,function(){return k()!==b&&j.push(b),f.stop(),a.__super__()}),c.complete=a.wrap(c.complete,function(){return a.setImmediate(function(){b.finalize()}),a.__super__()}),c.url=e,a.__super__(c)}return a.__super__()}),b.history=b.history||new b.History,a.adapters.Backbone=e,a.log("Sucessfully loaded caliper.backbone v"+e.VERSION)}}(window.Caliper,a,b,c)}(window.Backbone,window._,window.jQuery||window.Zepto);





















// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//






































// jQuery toggling plugin: http://simontabor.com/toggles/





;
$(document).ready(function() {
  console.log('Try app start');
  window.app.start();
});


