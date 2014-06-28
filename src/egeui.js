// EGEUI v0.1.0

(function(global, factory){
    // Set up egeui appropriately for the environment.
    if (typeof define === 'function' && define.cmd) {
        define(function(require, exports, module) {
            var $ = require('jquery');
            module.exports = factory($);
        });
    } else {
        global.egeui = factory(global.jQuery || global.$);
    }
}(this, function($){

    var $$ = function(obj) {
        return obj instanceof $ ? obj : $(obj)
    };

    /* Position CLASS DEFINITION
     * ====================== */
    var Position = {};

    Position.pin = function(pinElem, baseObject) {
        pinElem = $$(pinElem);
        var collision = baseObject.collision || 'flip';
        var posTop, posLeft;

        var baseHeight, baseWidth;
        var pinHeight = pinElem.outerHeight(),
            pinWidth = pinElem.outerWidth();

        if(baseObject.top && baseObject.left){
            posTop = baseObject.top;
            posLeft = baseObject.left;
            baseHeight = baseWidth = 0;
        } else {
            var baseElem = $$(baseObject.elem);
            var basePos = baseElem.offset();
            var pinPos = baseObject.pos;

            baseHeight = baseElem.outerHeight();
            baseWidth = baseElem.outerWidth();

            if(pinPos.indexOf('top') > -1){
                posTop = basePos.top - pinHeight;
            }
            if(pinPos.indexOf('bottom') > -1){
                posTop = basePos.top + baseHeight;
            }
            if(pinPos === 'bottom' || pinPos === 'top'){
                posLeft = basePos.left;
            }
            if(pinPos.indexOf('right') > -1){
                posLeft = basePos.left + baseWidth;
            }
            if(pinPos.indexOf('left') > -1){
                posLeft = basePos.left - pinWidth;
            }
            if(pinPos === 'right' || pinPos === 'left'){
                posTop = basePos.top;
            }

            if(posTop < 0){
                posTop = basePos.top + baseHeight;
            }
            if(posLeft < 0){
                posLeft = basePos.left + baseWidth;
            }

            if(baseObject.offset){
                var offset = baseObject.offset.split(' ');
                if(offset[0].indexOf('%') > -1){
                    posTop -= parseInt(offset[0].slice(0, -1), 10) / 100 * pinHeight - baseHeight / 2;
                } else {
                    posTop += parseInt(offset[0], 10);
                }
                posTop = posTop < 0 ? 0: posTop;
                if(offset.length > 1){
                    if(offset[1].indexOf('%') > -1){
                        posLeft -= parseInt(offset[1].slice(0, -1), 10) / 100 * pinWidth - baseWidth / 2;
                    } else {
                        posLeft += parseInt(offset[1], 10);
                    }
                    posLeft = posLeft < 0 ? 0: posLeft;
                }
            }
        }

        // collision handle
        var docST = $(document).scrollTop(), docSL = $(document).scrollLeft(),
            docH = $(document).height(), docW = $(document).width(),
            winH = $(window).height(), winW = $(window).width();

        if(posTop < docST){
            if(collision === 'fit'){
                posTop = docST;
            } else if(collision === 'flip'){
                posTop = posTop + pinHeight + baseHeight;
                if(posTop + pinHeight > docH){
                    posTop = docH - pinHeight;
                }
            }
        } else if(posTop + pinHeight - docST > winH){
            if(collision === 'fit'){
                posTop = winH + docST - pinHeight;
            } else if(collision === 'flip'){
                // +1: fix firefox bug
                posTop = posTop - pinHeight - baseHeight + 1;
                if(posTop < 0){
                    posTop = 0;
                }
            }
        }

        if(posLeft < docSL){
            if(collision === 'fit'){
                posLeft = docSL;
            } else if(collision === 'flip'){
                posLeft = posLeft + pinWidth + baseWidth;
                if(posLeft + pinWidth > docW){
                    posLeft = docW - pinWidth;
                }
            }
        } else if(posLeft + pinWidth - docSL > winW){
            if(collision === 'fit'){
                posLeft = winW + docSL - pinWidth;
            } else if(collision === 'flip'){
                posLeft = posLeft - pinWidth - baseWidth;
                if(posLeft < 0){
                    posLeft = 0;
                }
            }
        }

        pinElem.css({
            'top': posTop,
            'left': posLeft
        });
    };

    Position.center = function(pinElem, baseElem) {
        pinElem = $$(pinElem);
        baseElem = $$(baseElem || window);
        var posLeft = parseInt((baseElem.width() - pinElem.outerWidth()) / 2, 10);
        var posTop = baseElem.height() - pinElem.outerHeight();
        posTop = (posTop < 0 ? 0 : parseInt(posTop / 2, 10)) + $(document).scrollTop();

        pinElem.css({
            'top' : posTop,
            'left' : posLeft
        });
    };

    /* Widget CLASS DEFINITION
    * ====================== */
    var Widget = function() {}
    Widget.prototype = {
        _getEvents: function(event, method){
            this._widgetEvents = this._widgetEvents || {};
            var events = this._widgetEvents[event] || (this._widgetEvents[event] = {});
            return events[method] || (events[method] = []);
        },
        before: function(method, fn){
            var events = this._getEvents('before', method);
            events.push(fn);
        },
        after: function(method, fn){
            var events = this._getEvents('after', method);
            events.push(fn);
        },
        destroy: function(){
            this._widgetEvents = null;
        },
        trigger: function(event, method){
            if(this._widgetEvents && this._widgetEvents[event] && this._widgetEvents[event][method]){
                var fns = this._widgetEvents[event][method];
                for (var i = 0; i < fns.length; i++) {
                    fns[i].call(this)
                }
            }
        }
    }
    Widget.extend = function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
          child = function(){ return parent.apply(this, arguments); };
        }

        // Add static properties to the constructor function, if supplied.
        $.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function(){ this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) $.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.superClass = parent.prototype;

        return child;
    };


    var isIE6 = !window.XMLHttpRequest

    /* Mask CLASS DEFINITION
     * ====================== */
    var Mask = function(options) {
        var defaults = {
            zIndex: 499,
            opacity: 0.4,
            bgColor: '#fff'
        }
        this.options = $.extend(defaults, options);
        this. init();
    }

    Mask.prototype = {
        masklayer : null,
        init: function() {
            this.masklayer = $('<div class="egeui-mask"></div>').appendTo('body').css({
                'top': 0,
                'left': 0,
                'height': '100%',
                'width': '100%',
                'background-color': this.options.bgColor,
                'z-index': this.options.zIndex,
                'opacity': this.options.opacity
            });
        },
        show : function() {
            this.masklayer.show();
        },
        hide : function() {
            this.masklayer.hide();
        },
        destroy : function() {
            this.masklayer.remove();
        }
    };


    /* Overlay CLASS DEFINITION
     * ====================== */
    var Overlay = Widget.extend({
        constructor: function(options) {
            var defaults = {
                // element, template, width, height, id , className, trigger
                parentNode: document.body,
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 99,
                visible: false,
                align: ''
            }
            this.options = $.extend(defaults, options);

            if(this.options.visible){
                this.init()
            }
        },
        visible: false,
        init: function() {
            var options = this.options;
            var parentNode = $$(options.parentNode);
            this.$element = $$(options.element || options.template);
            this.element = this.$element[0];
            options.id && this.$element.attr('id', options.id);
            options.className && this.$element.addClass(options.className)
            this.$element.css({
                'position': options.position,
                'z-index': options.zIndex,
                'top': options.top,
                'left': options.left,
                'display': 'none'
            });
            options.width && this.$element.css('width', options.width);
            options.height && this.$element.css('height', options.height);
            if(!$.contains(document.documentElement, this.element)){
                this.$element.appendTo(parentNode);
            }

            options.align && this.align(options.align);

            if(options.hideBlur){
                this._hideBlur($$(options.trigger))
            }
            options.visible && this.show();
        },
        _hideBlur: function(arr){
            arr = $.makeArray(arr);
            arr.push(this.element);
            this._relativeElements = arr;
            Overlay.blurOverlays.push(this);
        },
        align: function(posInfo){
            if(posInfo.pos === 'center'){
                Position.center(this.$element, posInfo.elem)
            } else {
                Position.pin(this.$element, posInfo)
            }
            return this;
        },
        setPosition: function(pos){
            if(!this.$element){
                this.init()
            }
            Position.pin(this.$element, pos)
            return this;
        },
        show : function() {
            if(!this.$element){
                this.init()
            }
            this.trigger('before', 'show')
            this.$element.show();
            this.trigger('after', 'show')
            this.visible = true;
            return this;
        },
        hide : function() {
            this.trigger('before', 'hide')
            this.$element.hide();
            this.trigger('after', 'hide')
            this.visible = false;
            return this;
        },
        destroy : function() {
            this.trigger('before', 'destroy')
            this.$element.off()
            this.$element.remove();
            erase(this, Overlay.blurOverlays)
            this.trigger('after', 'destroy')
            Overlay.superClass.destroy.call(this);
        }
    });

    // 绑定 blur 隐藏事件
    Overlay.blurOverlays = [];
    $(document).on('click', function (e) {
        hideBlurOverlays(e);
    });

    // hide blur overlays
    function hideBlurOverlays(e){
        $(Overlay.blurOverlays).each(function (index, item) {
            if (!item || !item.visible) {
                return;
            }
            for (var i = 0; i < item._relativeElements.length; i++) {
                var el = item._relativeElements[i];
                if (el === e.target || $.contains(el, e.target)) {
                    return;
                }
            }
            item.hide();
        })
    }

    function erase(target, array) {
        for (var i = 0; i < array.length; i++) {
            if (target === array[i]) {
                array.splice(i, 1);
                return array;
            }
        }
    }


    /* Popup CLASS DEFINITION
     * ====================== */
    var Popup = Overlay.extend({
        constructor: function(){
            Popup.superClass.constructor.apply(this, arguments);

            var defaults = {
                'triggerType': 'hover',
                'hideBlur': true,
                'delay': 200
            }
            this.options = $.extend(defaults, this.options);
            this._bindTrigger();
        },

        _bindTrigger: function(){
            var triggerType = this.options.triggerType,
                delay = this.options.delay,
                delegateNode = this.options.delegateNode,
                trigger = this.options.trigger;
            var that = this;

            if(triggerType === 'click'){
                bindEvent('click', this.options.trigger, function(){
                    that.activeTrigger = this;
                    that.show()
                }, this.options.delegateNode, this);

            } else if(triggerType === 'focus'){
                this.init();

                bindEvent('focus', trigger, function () {
                    that.activeTrigger = this;
                    that.show();
                }, delegateNode, this);

                bindEvent('blur', trigger, function () {
                    setTimeout(function () {
                        (!that._downOnElement) && that.hide();
                        that._downOnElement = false;
                    }, delay);
                }, delegateNode, this);

                // 为了当input blur时能够选择和操作弹出层上的内容
                bindEvent('mousedown', this.element, function (e) {
                    that._downOnElement = true;
                });

            } else {
                this.options.hideBlur = false;
                this.init();

                var showTimer, hideTimer;

                var leaveHandler = function (e) {
                    clearTimeout(showTimer);
                    showTimer = null;

                    if (that.visible) {
                        hideTimer = setTimeout(function () {
                            that.hide();
                        }, delay);
                    }
                }

                bindEvent('mouseenter', trigger, function(){
                    clearTimeout(hideTimer);
                    hideTimer = null;

                    that.activeTrigger = this;

                    showTimer = setTimeout(function(){
                        that.show()
                    }, delay)
                }, delegateNode, this);

                bindEvent('mouseleave', trigger, leaveHandler, delegateNode, this);

                // 鼠标在悬浮层上时不消失
                this.$element.on("mouseenter", function () {
                    clearTimeout(hideTimer);
                });
                this.$element.on("mouseleave", leaveHandler);

                this.$element.on('mouseleave', 'select', function (e) {
                    e.stopPropagation();
                });
            }

            if(this.options.showAlign){
                this.before('show', function(){
                    this.options.showAlign.elem = this.activeTrigger;
                    this.align(this.options.showAlign)
                })
            }
        }
    })

    function bindEvent(type, element, fn, delegateNode, context){
        if(delegateNode){
            $$(delegateNode).on(type, element, fn);
        } else {
            $$(element).on(type, fn);
        }
    }

    var pub = {};
    pub.Overlay = Overlay;
    pub.Popup = Popup;

    return pub;
}));
