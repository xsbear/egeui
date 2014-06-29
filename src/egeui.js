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

    /* Position UTILITY DEFINITION
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

    var EVENT_KEY_SPLITTER = /^(\S+)\s*(.*)$/;
    var cidCounter = 0;
    var cachedInstances = {};
    function uniqueCid() {
        return 'widget-' + cidCounter++
    }

    // For memory leak
    $(window).unload(function() {
        for(var cid in cachedInstances) {
            cachedInstances[cid].destroy()
        }
    })

    /* Widget CLASS DEFINITION
    * ====================== */
    var Widget = function(options) {
        this.options = options;
        this.setup();
    }
    Widget.prototype = {
        rendered: false,
        setup: function(){
            this.cid = uniqueCid();
            cachedInstances[this.cid] = this;
        },
        render: function(){
            if (!this.rendered) {
                this.rendered = true;
            }
            this.trigger('before', 'render')
            var parentNode = $$(this.options.parentNode);
            if(!$.contains(document.documentElement, this.element)){
                this.$element.appendTo(parentNode);
            }
            this.trigger('after', 'render');

            this._delegateEvents();


            return this;
        },
        _delegateEvents: function(){
            var events = this.events;
            if(this.events){
                for(var key in this.events){
                    if(this.events.hasOwnProperty(key)){
                        var match = key.match(EVENT_KEY_SPLITTER);
                        var  eventType = match[1];
                        var selector = match[2] || undefined;

                        (function(handler, widget) {
                            var callback = function(ev) {
                                if ($.isFunction(handler)) {
                                    handler.call(widget, ev)
                                } else {
                                    widget[handler](ev)
                                }
                            }
                            // delegate
                            if (selector) {
                                widget.$element.on(eventType, selector, callback)
                            } else {
                                widget.$element.on(eventType, callback)
                            }
                        })(events[key], this)
                    }
                }
            }
        },
        _getEvents: function(event, method){
            this._widgetEvents = this._widgetEvents || {};
            var events = this._widgetEvents[event] || (this._widgetEvents[event] = {});
            return events[method] || (events[method] = []);
        },
        before: function(method, fn){
            var events = this._getEvents('before', method);
            events.push(fn);
            return this;
        },
        after: function(method, fn){
            var events = this._getEvents('after', method);
            events.push(fn);
            return this;
        },
        destroy: function(){
            this.trigger('before', 'destroy')
            this.$element.off();
            delete cachedInstances[this.cid];

            if(this._isTemplate){
                this.$element.remove();
            }

            this.trigger('after', 'destroy');
            this._widgetEvents = null;
            this.$element = null;
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

    /* Overlay WIDGET DEFINITION
     * ====================== */
    var Overlay = Widget.extend({
        setup: function(){
            Overlay.superClass.setup.call(this);

            var defaults = {
                // element, template, width, height, id , className, trigger
                parentNode: document.body,
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 99,
                visible: false
            }
            var options = this.options = $.extend(defaults, this.options);

            this._isTemplate = !!options.template;
            this.$element = $$(this.$element || options.element || options.template);
            if(!this.$element){
                throw new Error('element or template not specified');
            }
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

            this.after('render', this.align);
            options.hideBlur && this._hideBlur($$(options.trigger))
            options.visible && this.show();
        },
        visible: false,
        align: function(posOption){
            posOption = posOption || this.options.align;
            if(posOption){
                if(posOption.pos === 'center'){
                    Position.center(this.$element, posOption.elem)
                } else {
                    Position.pin(this.$element, posOption)
                }
            }
            return this;
        },
        setPosition: function(pos){
            if(!this.rendered){
                this.render();
            }
            Position.pin(this.$element, pos);
            return this;
        },
        show : function() {
            if(!this.rendered){
                this.render();
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
            Overlay.superClass.destroy.call(this);
            erase(this, Overlay.blurOverlays);
        },
        _hideBlur: function(arr, relativeOnly){
            arr = $.makeArray(arr);
            arr.push(this.element);
            this._relativeElements = arr;
            if(!relativeOnly){
                Overlay.blurOverlays.push(this);
            }
        },
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


    /* Popup WIDGET DEFINITION
     * ====================== */
    var Popup = Overlay.extend({
        setup: function(){
            var defaults = {
                'triggerType': 'hover',
                'hideBlur': true,
                'delay': 200
            }
            var options = this.options = $.extend(defaults, this.options);

            Popup.superClass.setup.call(this);

            this._bindTrigger();

            // 当使用委托事件时，_hideBlur 方法对于新添加的节点会失效 需要重新绑定
            if (options.delegateNode && options.hideBlur) {
                var that = this;
                this.before('show', function () {
                    this._hideBlur($$(options.trigger, true))
                });
            }
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
                this.render();

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
                this.render();

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

    function bindEvent(type, element, fn, delegateNode){
        if(delegateNode){
            $$(delegateNode).on(type, element, fn);
        } else {
            $$(element).on(type, fn);
        }
    }


    /* Mask WIDGET DEFINITION
     * ====================== */
    var Mask = Overlay.extend({
        setup: function(){
            var defaults = {
                width: '100%',
                height: '100%',
                position: 'fixed',
                zIndex: 499,
                opacity: 0.3,
                backgroundColor: '#000',
                template: '<div class="egeui-mask"></div>'
            }
            var options = this.options = $.extend(defaults, this.options);

            Popup.superClass.setup.call(this);

            this.$element.css({
                'background-color': options.backgroundColor,
                'opacity': options.opacity,
            })
        }
    })


    /* Dialog WIDGET DEFINITION
     * ====================== */
    var Dialog = Overlay.extend({
        _dialogTpl: '<div class="{{classPrefix}}"></div>',
        _closeTpl: '<div class="{{classPrefix}}-close" data-role="close"></div>',
        _titleTpl: '<div class="{{classPrefix}}-title" data-role="title"></div>',
        _contentTpl: '<div class="{{classPrefix}}-content" data-role="content"></div>',

        setup: function(){
            var defaults = {
                align: {pos: 'center'},
                classPrefix: 'egeui-dialog',
                closeTpl: 'x',
                zIndex: 999
                // visible: true
            };
            var options = this.options = $.extend(defaults, this.options);

            this.$element = $(this._parseTpl(this._dialogTpl));
            if(options.closeTpl){
                $(this._parseTpl(this._closeTpl)).appendTo(this.$element).append(options.closeTpl);
            }
            if(options.content){
                this.$contentElement = $(this._parseTpl(this._contentTpl)).append(options.content);
                this.$element.append(this.$contentElement)
            } else {
                throw new Error('content not specified');
            }

            if(options.mask){
                this.mask = new Mask( options.mask === true ? {} : options.mask)

                this.before('show', function(){
                    this.mask.show();
                }).after('hide', function(){
                    this.mask.hide();
                }).after('destroy', function(){
                    this.mask.destroy();
                })
            }

            Popup.superClass.setup.call(this);

            this._isTemplate = true;
        },
        events: {
            'click [data-role=close]': function(e){
                e.preventDefault();
                this.hide();
            }
        },
        _parseTpl: function(tpl){
            return tpl.replace(/\{\{classPrefix\}\}/g, this.options.classPrefix);
        }
    })


    var pub = {};
    pub.Overlay = Overlay;
    pub.Popup = Popup;
    pub.Dialog = Dialog;

    return pub;
}));
