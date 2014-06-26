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

        var Position = {};

        Position.pin = function(pinElem, baseObject) {
            var baseElem = $$(baseObject.elem);
            var basePos = baseElem.offset();
            pinElem = $$(pinElem);
            var posTop, posLeft;

            var pinPos = baseObject.pos;

            if(pinPos.indexOf('top') > -1){
                posTop = basePos.top - pinElem.outerHeight();
            }
            if(pinPos.indexOf('bottom') > -1){
                posTop = basePos.top + baseElem.outerHeight();
            }
            if(pinPos === 'bottom' || pinPos === 'top'){
                posLeft = basePos.left;
            }
            if(pinPos.indexOf('right') > -1){
                posLeft = basePos.left + baseElem.outerWidth();
            }
            if(pinPos.indexOf('left') > -1){
                posLeft = basePos.left - pinElem.outerWidth();
            }
            if(pinPos === 'right' || pinPos === 'left'){
                posTop = basePos.top;
            }

            if(posTop < 0){
                posTop = basePos.top + baseElem.outerHeight();
            }
            if(posLeft < 0){
                posLeft = basePos.left + baseElem.outerWidth();
            }

            if(baseObject.offset){
                var offset = baseObject.offset.split(' ');
                if(offset[0].indexOf('%') > -1){
                    posTop -= parseInt(offset[0].slice(0, -1), 10) / 100 * pinElem.outerHeight() - baseElem.outerHeight() / 2
                } else {
                    posTop += parseInt(offset[0], 10);
                }
                posTop = posTop < 0 ? 0: posTop;
                if(offset.length > 1){
                    if(offset[1].indexOf('%') > -1){
                        posLeft -= parseInt(offset[1].slice(0, -1), 10) / 100 * pinElem.outerWidth() - baseElem.outerWidth() / 2
                    } else {
                        posLeft += parseInt(offset[1], 10);
                    }
                    posLeft = posLeft < 0 ? 0: posLeft;
                }
            }

            // TODO ref jqueryui Position collision with flip or fit
            if(posTop + pinElem.outerHeight() > $(document).height()){
                posTop = $(document).height() - pinElem.outerHeight()
            }
            if(posLeft + pinElem.outerWidth() > $(document).width()){
                posLeft = $(document).width() - pinElem.outerWidth();
            }

            pinElem.css({
                'top' : posTop,
                'left' : posLeft
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


        var Widget = function() {}
        Widget.prototype = {
            _widgetEvents: {},
            before: function(method, fn){
                var events = this._widgetEvents['before'] || (this._widgetEvents['before'] = {});
                events = events[method] || (events[method] = []);
                events.push(fn);
            },
            after: function(method, fn){
                var events = this._widgetEvents['after'] || (this._widgetEvents['after'] = {});
                events = events[method] || (events[method] = []);
                events.push(fn);
            },
            destroy: function(){
                this._widgetEvents = null;
            },
            trigger: function(event, method){
                if(this._widgetEvents[event] && this._widgetEvents[event][method]){
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
            }
            this.options = $.extend(defaults, options);
            this. init();
        }

        Mask.prototype = {
            overlayer : null,
            masklayer : null,
            init: function() {
                this.overlayer = $('<div id="dm_window_overlay"></div>').appendTo('body').css({'z-index': this.options.zIndex, 'opacity': this.options.opacity});
                if (isIE6) {
                    this.masklayer = $('<iframe id="dm_window_selectmask" frameborder="0" />').appendTo('body').css('z-index', this.options.zIndex - 1);
                }
            },
            show : function() {
                this.overlayer.show();
                if (this.masklayer) {
                    this.masklayer.show();
                }
            },
            hide : function() {
                this.overlayer.hide();
                if (this.masklayer) {
                    this.masklayer.hide();
                }
            },
            destroy : function() {
                this.overlayer.remove();
                if (this.masklayer) {
                    this.masklayer.remove();
                }
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

                this.align(options.align)

                options.visible && this.show();

                if(options.hideBlur){
                    Overlay.blurOverlays.push(this);
                    this._relativeElements.push(this.element)
                }
            },
            align: function(pos){
                if(pos){
                    if(pos.elem && pos.pos){
                        Position.pin(this.$element, pos)
                    } else {
                        Position.center(this.$element, pos)
                    }
                } else {
                    Position.center(this.$element)
                }
            },
            show : function() {
                if(!this.$element){
                    this.init()
                }
                this.trigger('before', 'show')
                this.$element.show();
                this.trigger('after', 'show')
                this.visible = true;
            },
            hide : function() {
                this.trigger('before', 'hide')
                this.$element.hide();
                this.trigger('after', 'hide')
                this.visible = false;
            },
            destroy : function() {
                this.trigger('before', 'destroy')
                this.$element.off()
                this.$element.remove();
                erase(this, Overlay.blurOverlays)
                this.trigger('after', 'destroy')
                Overlay.superClass.destroy.call(this);
            },
            _relativeElements: []
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
                    'delay': 100
                }
                this.options = $.extend(defaults, this.options);
                this._bindTrigger();
            },
            _bindTrigger: function(){
                var triggerType = this.options.triggerType;

                if(triggerType === 'click'){
                    this._bindClick();
                } else {
                    this.init();
                    this._bindHover();
                }
                if(this.options.showAlign){
                    this.before('show', function(){
                        this.options.showAlign.elem = this.activeTrigger;
                        this.align(this.options.showAlign)
                    })
                }
            },

            _bindHover: function(){
                var delay = this.options.delay,
                    delegateNode = this.options.delegateNode,
                    trigger = this.options.trigger;

                var showTimer, hideTimer;
                var that = this;

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

                function leaveHandler(e) {
                    clearTimeout(showTimer);
                    showTimer = null;

                    if (that.visible) {
                        hideTimer = setTimeout(function () {
                            that.hide();
                        }, delay);
                    }
                }
            },

            _bindClick: function(){
                var that = this;
                bindEvent('click', this.options.trigger, function(){
                    that.show()
                }, this.options.delegateNode, this);

                if(this.options.hideBlur){
                    this._relativeElements.push($$(this.options.trigger)[0], this)
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



        var Menu = Overlay.extend({
            init: function(){
                this.options.element = this.options.element || this.options.template || '<ul class="egeui-menu"></ul>';

                Menu.superClass.init.call(this);
            }
        })



    var pub = {};
    pub.Overlay = Overlay;
    pub.Popup = Popup;
    pub.Menu = Menu;

    return pub;
}));
