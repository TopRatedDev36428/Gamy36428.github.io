/*!
 * jQuery Migrate - v3.4.1 - 2023-02-23T15:31Z
 * Copyright OpenJS Foundation and other contributors
 */ (function (factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define(["jquery"], function (jQuery) {
      return factory(jQuery, window);
    });
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory(require("jquery"), window);
  } else {
    factory(jQuery, window);
  }
})(function (jQuery, window) {
  "use strict";
  jQuery.migrateVersion = "3.4.1";
  function compareVersions(v1, v2) {
    var i,
      rVersionParts = /^(\d+)\.(\d+)\.(\d+)/,
      v1p = rVersionParts.exec(v1) || [],
      v2p = rVersionParts.exec(v2) || [];
    for (i = 1; i <= 3; i++) {
      if (+v1p[i] > +v2p[i]) {
        return 1;
      }
      if (+v1p[i] < +v2p[i]) {
        return -1;
      }
    }
    return 0;
  }
  function jQueryVersionSince(version) {
    return compareVersions(jQuery.fn.jquery, version) >= 0;
  }
  var disabledPatches = Object.create(null);
  jQuery.migrateDisablePatches = function () {
    var i;
    for (i = 0; i < arguments.length; i++) {
      disabledPatches[arguments[i]] = true;
    }
  };
  jQuery.migrateEnablePatches = function () {
    var i;
    for (i = 0; i < arguments.length; i++) {
      delete disabledPatches[arguments[i]];
    }
  };
  jQuery.migrateIsPatchEnabled = function (patchCode) {
    return !disabledPatches[patchCode];
  };
  (function () {
    if (!window.console || !window.console.log) {
      return;
    }
    if (
      !jQuery ||
      !jQueryVersionSince("3.0.0") ||
      jQueryVersionSince("5.0.0")
    ) {
      window.console.log("JQMIGRATE: jQuery 3.x-4.x REQUIRED");
    }
    if (jQuery.migrateWarnings) {
      window.console.log("JQMIGRATE: Migrate plugin loaded multiple times");
    }
    window.console.log(
      "JQMIGRATE: Migrate is installed" +
        (jQuery.migrateMute ? "" : " with logging active") +
        ", version " +
        jQuery.migrateVersion
    );
  })();
  var warnedAbout = {};
  jQuery.migrateDeduplicateWarnings = true;
  jQuery.migrateWarnings = [];
  if (jQuery.migrateTrace === undefined) {
    jQuery.migrateTrace = true;
  }
  jQuery.migrateReset = function () {
    warnedAbout = {};
    jQuery.migrateWarnings.length = 0;
  };
  function migrateWarn(code, msg) {
    var console = window.console;
    if (
      jQuery.migrateIsPatchEnabled(code) &&
      (!jQuery.migrateDeduplicateWarnings || !warnedAbout[msg])
    ) {
      warnedAbout[msg] = true;
      jQuery.migrateWarnings.push(msg + " [" + code + "]");
      if (console && console.warn && !jQuery.migrateMute) {
        if (jQuery.migrateTrace && console.trace) {
        }
      }
    }
  }
  function migrateWarnProp(obj, prop, value, code, msg) {
    Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: true,
      get: function () {
        migrateWarn(code, msg);
        return value;
      },
      set: function (newValue) {
        migrateWarn(code, msg);
        value = newValue;
      },
    });
  }
  function migrateWarnFuncInternal(obj, prop, newFunc, code, msg) {
    var finalFunc,
      origFunc = obj[prop];
    obj[prop] = function () {
      if (msg) {
        migrateWarn(code, msg);
      }
      finalFunc = jQuery.migrateIsPatchEnabled(code)
        ? newFunc
        : origFunc || jQuery.noop;
      return finalFunc.apply(this, arguments);
    };
  }
  function migratePatchAndWarnFunc(obj, prop, newFunc, code, msg) {
    if (!msg) {
      throw new Error("No warning message provided");
    }
    return migrateWarnFuncInternal(obj, prop, newFunc, code, msg);
  }
  function migratePatchFunc(obj, prop, newFunc, code) {
    return migrateWarnFuncInternal(obj, prop, newFunc, code);
  }
  if (window.document.compatMode === "BackCompat") {
    migrateWarn("quirks", "jQuery is not compatible with Quirks Mode");
  }
  var findProp,
    class2type = {},
    oldInit = jQuery.fn.init,
    oldFind = jQuery.find,
    rattrHashTest = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/,
    rattrHashGlob = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/g,
    rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
  migratePatchFunc(
    jQuery.fn,
    "init",
    function (arg1) {
      var args = Array.prototype.slice.call(arguments);
      if (
        jQuery.migrateIsPatchEnabled("selector-empty-id") &&
        typeof arg1 === "string" &&
        arg1 === "#"
      ) {
        migrateWarn(
          "selector-empty-id",
          "jQuery( '#' ) is not a valid selector"
        );
        args[0] = [];
      }
      return oldInit.apply(this, args);
    },
    "selector-empty-id"
  );
  jQuery.fn.init.prototype = jQuery.fn;
  migratePatchFunc(
    jQuery,
    "find",
    function (selector) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof selector === "string" && rattrHashTest.test(selector)) {
        try {
          window.document.querySelector(selector);
        } catch (err1) {
          selector = selector.replace(
            rattrHashGlob,
            function (_, attr, op, value) {
              return "[" + attr + op + '"' + value + '"]';
            }
          );
          try {
            window.document.querySelector(selector);
            migrateWarn(
              "selector-hash",
              "Attribute selector with '#' must be quoted: " + args[0]
            );
            args[0] = selector;
          } catch (err2) {
            migrateWarn(
              "selector-hash",
              "Attribute selector with '#' was not fixed: " + args[0]
            );
          }
        }
      }
      return oldFind.apply(this, args);
    },
    "selector-hash"
  );
  for (findProp in oldFind) {
    if (Object.prototype.hasOwnProperty.call(oldFind, findProp)) {
      jQuery.find[findProp] = oldFind[findProp];
    }
  }
  migratePatchAndWarnFunc(
    jQuery.fn,
    "size",
    function () {
      return this.length;
    },
    "size",
    "jQuery.fn.size() is deprecated and removed; use the .length property"
  );
  migratePatchAndWarnFunc(
    jQuery,
    "parseJSON",
    function () {
      return JSON.parse.apply(null, arguments);
    },
    "parseJSON",
    "jQuery.parseJSON is deprecated; use JSON.parse"
  );
  migratePatchAndWarnFunc(
    jQuery,
    "holdReady",
    jQuery.holdReady,
    "holdReady",
    "jQuery.holdReady is deprecated"
  );
  migratePatchAndWarnFunc(
    jQuery,
    "unique",
    jQuery.uniqueSort,
    "unique",
    "jQuery.unique is deprecated; use jQuery.uniqueSort"
  );
  migrateWarnProp(
    jQuery.expr,
    "filters",
    jQuery.expr.pseudos,
    "expr-pre-pseudos",
    "jQuery.expr.filters is deprecated; use jQuery.expr.pseudos"
  );
  migrateWarnProp(
    jQuery.expr,
    ":",
    jQuery.expr.pseudos,
    "expr-pre-pseudos",
    "jQuery.expr[':'] is deprecated; use jQuery.expr.pseudos"
  );
  if (jQueryVersionSince("3.1.1")) {
    migratePatchAndWarnFunc(
      jQuery,
      "trim",
      function (text) {
        return text == null ? "" : (text + "").replace(rtrim, "$1");
      },
      "trim",
      "jQuery.trim is deprecated; use String.prototype.trim"
    );
  }
  if (jQueryVersionSince("3.2.0")) {
    migratePatchAndWarnFunc(
      jQuery,
      "nodeName",
      function (elem, name) {
        return (
          elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase()
        );
      },
      "nodeName",
      "jQuery.nodeName is deprecated"
    );
    migratePatchAndWarnFunc(
      jQuery,
      "isArray",
      Array.isArray,
      "isArray",
      "jQuery.isArray is deprecated; use Array.isArray"
    );
  }
  if (jQueryVersionSince("3.3.0")) {
    migratePatchAndWarnFunc(
      jQuery,
      "isNumeric",
      function (obj) {
        var type = typeof obj;
        return (
          (type === "number" || type === "string") &&
          !isNaN(obj - parseFloat(obj))
        );
      },
      "isNumeric",
      "jQuery.isNumeric() is deprecated"
    );
    jQuery.each(
      "Boolean Number String Function Array Date RegExp Object Error Symbol".split(
        " "
      ),
      function (_, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
      }
    );
    migratePatchAndWarnFunc(
      jQuery,
      "type",
      function (obj) {
        if (obj == null) {
          return obj + "";
        }
        return typeof obj === "object" || typeof obj === "function"
          ? class2type[Object.prototype.toString.call(obj)] || "object"
          : typeof obj;
      },
      "type",
      "jQuery.type is deprecated"
    );
    migratePatchAndWarnFunc(
      jQuery,
      "isFunction",
      function (obj) {
        return typeof obj === "function";
      },
      "isFunction",
      "jQuery.isFunction() is deprecated"
    );
    migratePatchAndWarnFunc(
      jQuery,
      "isWindow",
      function (obj) {
        return obj != null && obj === obj.window;
      },
      "isWindow",
      "jQuery.isWindow() is deprecated"
    );
  }
  if (jQuery.ajax) {
    var oldAjax = jQuery.ajax,
      rjsonp = /(=)\?(?=&|$)|\?\?/;
    migratePatchFunc(
      jQuery,
      "ajax",
      function () {
        var jQXHR = oldAjax.apply(this, arguments);
        if (jQXHR.promise) {
          migratePatchAndWarnFunc(
            jQXHR,
            "success",
            jQXHR.done,
            "jqXHR-methods",
            "jQXHR.success is deprecated and removed"
          );
          migratePatchAndWarnFunc(
            jQXHR,
            "error",
            jQXHR.fail,
            "jqXHR-methods",
            "jQXHR.error is deprecated and removed"
          );
          migratePatchAndWarnFunc(
            jQXHR,
            "complete",
            jQXHR.always,
            "jqXHR-methods",
            "jQXHR.complete is deprecated and removed"
          );
        }
        return jQXHR;
      },
      "jqXHR-methods"
    );
    if (!jQueryVersionSince("4.0.0")) {
      jQuery.ajaxPrefilter("+json", function (s) {
        if (
          s.jsonp !== false &&
          (rjsonp.test(s.url) ||
            (typeof s.data === "string" &&
              (s.contentType || "").indexOf(
                "application/x-www-form-urlencoded"
              ) === 0 &&
              rjsonp.test(s.data)))
        ) {
          migrateWarn(
            "jsonp-promotion",
            "JSON-to-JSONP auto-promotion is deprecated"
          );
        }
      });
    }
  }
  var oldRemoveAttr = jQuery.fn.removeAttr,
    oldToggleClass = jQuery.fn.toggleClass,
    rmatchNonSpace = /\S+/g;
  migratePatchFunc(
    jQuery.fn,
    "removeAttr",
    function (name) {
      var self = this,
        patchNeeded = false;
      jQuery.each(name.match(rmatchNonSpace), function (_i, attr) {
        if (jQuery.expr.match.bool.test(attr)) {
          self.each(function () {
            if (jQuery(this).prop(attr) !== false) {
              patchNeeded = true;
              return false;
            }
          });
        }
        if (patchNeeded) {
          migrateWarn(
            "removeAttr-bool",
            "jQuery.fn.removeAttr no longer sets boolean properties: " + attr
          );
          self.prop(attr, false);
        }
      });
      return oldRemoveAttr.apply(this, arguments);
    },
    "removeAttr-bool"
  );
  migratePatchFunc(
    jQuery.fn,
    "toggleClass",
    function (state) {
      if (state !== undefined && typeof state !== "boolean") {
        return oldToggleClass.apply(this, arguments);
      }
      migrateWarn(
        "toggleClass-bool",
        "jQuery.fn.toggleClass( boolean ) is deprecated"
      );
      return this.each(function () {
        var className = (this.getAttribute && this.getAttribute("class")) || "";
        if (className) {
          jQuery.data(this, "__className__", className);
        }
        if (this.setAttribute) {
          this.setAttribute(
            "class",
            className || state === false
              ? ""
              : jQuery.data(this, "__className__") || ""
          );
        }
      });
    },
    "toggleClass-bool"
  );
  function camelCase(string) {
    return string.replace(/-([a-z])/g, function (_, letter) {
      return letter.toUpperCase();
    });
  }
  var origFnCss,
    internalCssNumber,
    internalSwapCall = false,
    ralphaStart = /^[a-z]/,
    rautoPx =
      /^(?:Border(?:Top|Right|Bottom|Left)?(?:Width|)|(?:Margin|Padding)?(?:Top|Right|Bottom|Left)?|(?:Min|Max)?(?:Width|Height))$/;
  if (jQuery.swap) {
    jQuery.each(["height", "width", "reliableMarginRight"], function (_, name) {
      var oldHook = jQuery.cssHooks[name] && jQuery.cssHooks[name].get;
      if (oldHook) {
        jQuery.cssHooks[name].get = function () {
          var ret;
          internalSwapCall = true;
          ret = oldHook.apply(this, arguments);
          internalSwapCall = false;
          return ret;
        };
      }
    });
  }
  migratePatchFunc(
    jQuery,
    "swap",
    function (elem, options, callback, args) {
      var ret,
        name,
        old = {};
      if (!internalSwapCall) {
        migrateWarn("swap", "jQuery.swap() is undocumented and deprecated");
      }
      for (name in options) {
        old[name] = elem.style[name];
        elem.style[name] = options[name];
      }
      ret = callback.apply(elem, args || []);
      for (name in options) {
        elem.style[name] = old[name];
      }
      return ret;
    },
    "swap"
  );
  if (jQueryVersionSince("3.4.0") && typeof Proxy !== "undefined") {
    jQuery.cssProps = new Proxy(jQuery.cssProps || {}, {
      set: function () {
        migrateWarn("cssProps", "jQuery.cssProps is deprecated");
        return Reflect.set.apply(this, arguments);
      },
    });
  }
  if (jQueryVersionSince("4.0.0")) {
    internalCssNumber = {
      animationIterationCount: true,
      columnCount: true,
      fillOpacity: true,
      flexGrow: true,
      flexShrink: true,
      fontWeight: true,
      gridArea: true,
      gridColumn: true,
      gridColumnEnd: true,
      gridColumnStart: true,
      gridRow: true,
      gridRowEnd: true,
      gridRowStart: true,
      lineHeight: true,
      opacity: true,
      order: true,
      orphans: true,
      widows: true,
      zIndex: true,
      zoom: true,
    };
    if (typeof Proxy !== "undefined") {
      jQuery.cssNumber = new Proxy(internalCssNumber, {
        get: function () {
          migrateWarn("css-number", "jQuery.cssNumber is deprecated");
          return Reflect.get.apply(this, arguments);
        },
        set: function () {
          migrateWarn("css-number", "jQuery.cssNumber is deprecated");
          return Reflect.set.apply(this, arguments);
        },
      });
    } else {
      jQuery.cssNumber = internalCssNumber;
    }
  } else {
    internalCssNumber = jQuery.cssNumber;
  }
  function isAutoPx(prop) {
    return (
      ralphaStart.test(prop) &&
      rautoPx.test(prop[0].toUpperCase() + prop.slice(1))
    );
  }
  origFnCss = jQuery.fn.css;
  migratePatchFunc(
    jQuery.fn,
    "css",
    function (name, value) {
      var camelName,
        origThis = this;
      if (name && typeof name === "object" && !Array.isArray(name)) {
        jQuery.each(name, function (n, v) {
          jQuery.fn.css.call(origThis, n, v);
        });
        return this;
      }
      if (typeof value === "number") {
        camelName = camelCase(name);
        if (!isAutoPx(camelName) && !internalCssNumber[camelName]) {
          migrateWarn(
            "css-number",
            'Number-typed values are deprecated for jQuery.fn.css( "' +
              name +
              '", value )'
          );
        }
      }
      return origFnCss.apply(this, arguments);
    },
    "css-number"
  );
  var origData = jQuery.data;
  migratePatchFunc(
    jQuery,
    "data",
    function (elem, name, value) {
      var curData, sameKeys, key;
      if (name && typeof name === "object" && arguments.length === 2) {
        curData = jQuery.hasData(elem) && origData.call(this, elem);
        sameKeys = {};
        for (key in name) {
          if (key !== camelCase(key)) {
            migrateWarn(
              "data-camelCase",
              "jQuery.data() always sets/gets camelCased names: " + key
            );
            curData[key] = name[key];
          } else {
            sameKeys[key] = name[key];
          }
        }
        origData.call(this, elem, sameKeys);
        return name;
      }
      if (name && typeof name === "string" && name !== camelCase(name)) {
        curData = jQuery.hasData(elem) && origData.call(this, elem);
        if (curData && name in curData) {
          migrateWarn(
            "data-camelCase",
            "jQuery.data() always sets/gets camelCased names: " + name
          );
          if (arguments.length > 2) {
            curData[name] = value;
          }
          return curData[name];
        }
      }
      return origData.apply(this, arguments);
    },
    "data-camelCase"
  );
  if (jQuery.fx) {
    var intervalValue,
      intervalMsg,
      oldTweenRun = jQuery.Tween.prototype.run,
      linearEasing = function (pct) {
        return pct;
      };
    migratePatchFunc(
      jQuery.Tween.prototype,
      "run",
      function () {
        if (jQuery.easing[this.easing].length > 1) {
          migrateWarn(
            "easing-one-arg",
            "'jQuery.easing." +
              this.easing.toString() +
              "' should use only one argument"
          );
          jQuery.easing[this.easing] = linearEasing;
        }
        oldTweenRun.apply(this, arguments);
      },
      "easing-one-arg"
    );
    intervalValue = jQuery.fx.interval;
    intervalMsg = "jQuery.fx.interval is deprecated";
    if (window.requestAnimationFrame) {
      Object.defineProperty(jQuery.fx, "interval", {
        configurable: true,
        enumerable: true,
        get: function () {
          if (!window.document.hidden) {
            migrateWarn("fx-interval", intervalMsg);
          }
          if (!jQuery.migrateIsPatchEnabled("fx-interval")) {
            return intervalValue;
          }
          return intervalValue === undefined ? 13 : intervalValue;
        },
        set: function (newValue) {
          migrateWarn("fx-interval", intervalMsg);
          intervalValue = newValue;
        },
      });
    }
  }
  var oldLoad = jQuery.fn.load,
    oldEventAdd = jQuery.event.add,
    originalFix = jQuery.event.fix;
  jQuery.event.props = [];
  jQuery.event.fixHooks = {};
  migrateWarnProp(
    jQuery.event.props,
    "concat",
    jQuery.event.props.concat,
    "event-old-patch",
    "jQuery.event.props.concat() is deprecated and removed"
  );
  migratePatchFunc(
    jQuery.event,
    "fix",
    function (originalEvent) {
      var event,
        type = originalEvent.type,
        fixHook = this.fixHooks[type],
        props = jQuery.event.props;
      if (props.length) {
        migrateWarn(
          "event-old-patch",
          "jQuery.event.props are deprecated and removed: " + props.join()
        );
        while (props.length) {
          jQuery.event.addProp(props.pop());
        }
      }
      if (fixHook && !fixHook._migrated_) {
        fixHook._migrated_ = true;
        migrateWarn(
          "event-old-patch",
          "jQuery.event.fixHooks are deprecated and removed: " + type
        );
        if ((props = fixHook.props) && props.length) {
          while (props.length) {
            jQuery.event.addProp(props.pop());
          }
        }
      }
      event = originalFix.call(this, originalEvent);
      return fixHook && fixHook.filter
        ? fixHook.filter(event, originalEvent)
        : event;
    },
    "event-old-patch"
  );
  migratePatchFunc(
    jQuery.event,
    "add",
    function (elem, types) {
      if (
        elem === window &&
        types === "load" &&
        window.document.readyState === "complete"
      ) {
        migrateWarn(
          "load-after-event",
          "jQuery(window).on('load'...) called after load event occurred"
        );
      }
      return oldEventAdd.apply(this, arguments);
    },
    "load-after-event"
  );
  jQuery.each(["load", "unload", "error"], function (_, name) {
    migratePatchFunc(
      jQuery.fn,
      name,
      function () {
        var args = Array.prototype.slice.call(arguments, 0);
        if (name === "load" && typeof args[0] === "string") {
          return oldLoad.apply(this, args);
        }
        migrateWarn(
          "shorthand-removed-v3",
          "jQuery.fn." + name + "() is deprecated"
        );
        args.splice(0, 0, name);
        if (arguments.length) {
          return this.on.apply(this, args);
        }
        this.triggerHandler.apply(this, args);
        return this;
      },
      "shorthand-removed-v3"
    );
  });
  jQuery.each(
    (
      "blur focus focusin focusout resize scroll click dblclick " +
      "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
      "change select submit keydown keypress keyup contextmenu"
    ).split(" "),
    function (_i, name) {
      migratePatchAndWarnFunc(
        jQuery.fn,
        name,
        function (data, fn) {
          return arguments.length > 0
            ? this.on(name, null, data, fn)
            : this.trigger(name);
        },
        "shorthand-deprecated-v3",
        "jQuery.fn." + name + "() event shorthand is deprecated"
      );
    }
  );
  jQuery(function () {
    jQuery(window.document).triggerHandler("ready");
  });
  jQuery.event.special.ready = {
    setup: function () {
      if (this === window.document) {
        migrateWarn("ready-event", "'ready' event is deprecated");
      }
    },
  };
  migratePatchAndWarnFunc(
    jQuery.fn,
    "bind",
    function (types, data, fn) {
      return this.on(types, null, data, fn);
    },
    "pre-on-methods",
    "jQuery.fn.bind() is deprecated"
  );
  migratePatchAndWarnFunc(
    jQuery.fn,
    "unbind",
    function (types, fn) {
      return this.off(types, null, fn);
    },
    "pre-on-methods",
    "jQuery.fn.unbind() is deprecated"
  );
  migratePatchAndWarnFunc(
    jQuery.fn,
    "delegate",
    function (selector, types, data, fn) {
      return this.on(types, selector, data, fn);
    },
    "pre-on-methods",
    "jQuery.fn.delegate() is deprecated"
  );
  migratePatchAndWarnFunc(
    jQuery.fn,
    "undelegate",
    function (selector, types, fn) {
      return arguments.length === 1
        ? this.off(selector, "**")
        : this.off(types, selector || "**", fn);
    },
    "pre-on-methods",
    "jQuery.fn.undelegate() is deprecated"
  );
  migratePatchAndWarnFunc(
    jQuery.fn,
    "hover",
    function (fnOver, fnOut) {
      return this.on("mouseenter", fnOver).on("mouseleave", fnOut || fnOver);
    },
    "pre-on-methods",
    "jQuery.fn.hover() is deprecated"
  );
  var rxhtmlTag =
      /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
    makeMarkup = function (html) {
      var doc = window.document.implementation.createHTMLDocument("");
      doc.body.innerHTML = html;
      return doc.body && doc.body.innerHTML;
    },
    warnIfChanged = function (html) {
      var changed = html.replace(rxhtmlTag, "<$1></$2>");
      if (changed !== html && makeMarkup(html) !== makeMarkup(changed)) {
        migrateWarn(
          "self-closed-tags",
          "HTML tags must be properly nested and closed: " + html
        );
      }
    };
  jQuery.UNSAFE_restoreLegacyHtmlPrefilter = function () {
    jQuery.migrateEnablePatches("self-closed-tags");
  };
  migratePatchFunc(
    jQuery,
    "htmlPrefilter",
    function (html) {
      warnIfChanged(html);
      return html.replace(rxhtmlTag, "<$1></$2>");
    },
    "self-closed-tags"
  );
  jQuery.migrateDisablePatches("self-closed-tags");
  var origOffset = jQuery.fn.offset;
  migratePatchFunc(
    jQuery.fn,
    "offset",
    function () {
      var elem = this[0];
      if (elem && (!elem.nodeType || !elem.getBoundingClientRect)) {
        migrateWarn(
          "offset-valid-elem",
          "jQuery.fn.offset() requires a valid DOM element"
        );
        return arguments.length ? this : undefined;
      }
      return origOffset.apply(this, arguments);
    },
    "offset-valid-elem"
  );
  if (jQuery.ajax) {
    var origParam = jQuery.param;
    migratePatchFunc(
      jQuery,
      "param",
      function (data, traditional) {
        var ajaxTraditional =
          jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
        if (traditional === undefined && ajaxTraditional) {
          migrateWarn(
            "param-ajax-traditional",
            "jQuery.param() no longer uses jQuery.ajaxSettings.traditional"
          );
          traditional = ajaxTraditional;
        }
        return origParam.call(this, data, traditional);
      },
      "param-ajax-traditional"
    );
  }
  migratePatchAndWarnFunc(
    jQuery.fn,
    "andSelf",
    jQuery.fn.addBack,
    "andSelf",
    "jQuery.fn.andSelf() is deprecated and removed, use jQuery.fn.addBack()"
  );
  if (jQuery.Deferred) {
    var oldDeferred = jQuery.Deferred,
      tuples = [
        [
          "resolve",
          "done",
          jQuery.Callbacks("once memory"),
          jQuery.Callbacks("once memory"),
          "resolved",
        ],
        [
          "reject",
          "fail",
          jQuery.Callbacks("once memory"),
          jQuery.Callbacks("once memory"),
          "rejected",
        ],
        [
          "notify",
          "progress",
          jQuery.Callbacks("memory"),
          jQuery.Callbacks("memory"),
        ],
      ];
    migratePatchFunc(
      jQuery,
      "Deferred",
      function (func) {
        var deferred = oldDeferred(),
          promise = deferred.promise();
        function newDeferredPipe() {
          var fns = arguments;
          return jQuery
            .Deferred(function (newDefer) {
              jQuery.each(tuples, function (i, tuple) {
                var fn = typeof fns[i] === "function" && fns[i];
                deferred[tuple[1]](function () {
                  var returned = fn && fn.apply(this, arguments);
                  if (returned && typeof returned.promise === "function") {
                    returned
                      .promise()
                      .done(newDefer.resolve)
                      .fail(newDefer.reject)
                      .progress(newDefer.notify);
                  } else {
                    newDefer[tuple[0] + "With"](
                      this === promise ? newDefer.promise() : this,
                      fn ? [returned] : arguments
                    );
                  }
                });
              });
              fns = null;
            })
            .promise();
        }
        migratePatchAndWarnFunc(
          deferred,
          "pipe",
          newDeferredPipe,
          "deferred-pipe",
          "deferred.pipe() is deprecated"
        );
        migratePatchAndWarnFunc(
          promise,
          "pipe",
          newDeferredPipe,
          "deferred-pipe",
          "deferred.pipe() is deprecated"
        );
        if (func) {
          func.call(deferred, deferred);
        }
        return deferred;
      },
      "deferred-pipe"
    );
    jQuery.Deferred.exceptionHook = oldDeferred.exceptionHook;
  }
  return jQuery;
});
