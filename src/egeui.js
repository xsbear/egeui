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


        /* Loading CLASS DEFINITION
         * ====================== */
        var Loading = function(text,options) {
            this.text = text;
            var defaults = {
                zIndex: 1000,
                opacity: 0.4,
                indicator: null,
            }
            this.options = $.extend(defaults, options);
            this.init();
        };

        Loading.prototype = {
            constructor : Loading,
            overlay : null,
            indicator : null,

            init: function(){
                this.overlay = new Overlay({zIndex:  this.options.zIndex, opacity: this.options.opacity});
                this.indicator = this.options.indicator || '<div class="mm-loading"><p>'+ this.text +'</p></div>';
                this.indicator = $(this.indicator).appendTo('body').css('z-index', this.options.zIndex + 1);
                if(this.options.indicator === null){
                    Position.center(this.indicator);
                }
            },

            hide: function(){
                this.overlay.destroy();
                this.indicator.remove();
            }
        };

        /* Overlay CLASS DEFINITION
         * ====================== */
        var Overlay = function(options) {
            var defaults = {
                // element, template, width, height, id , className, trigger
                parentNode: document.body,
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                zIndex: 99,
                visible: false,
                hideBlur: false,
                align: ''
            }
            this.options = $.extend(defaults, options);
            if(this.options.visible){
                this.init()
            }
        }

        // 绑定 blur 隐藏事件
        Overlay.blurOverlays = [];
        $(document).on('click', function (e) {
            hideBlurOverlays(e);
        });

        Overlay.prototype = {
            // constructor: Overlay,
            init: function() {
                var options = this.options;
                var parentNode = $$(options.parentNode);
                this.layer = $$(options.element || options.template);
                options.id && this.layer.attr('id', options.id);
                options.className && this.layer.addClass(options.className)
                this.layer.css({
                    'position': options.position,
                    'z-index': options.zIndex,
                    'top': options.top,
                    'left': options.left,
                    'display': options.visible ? 'block' : 'none'
                });
                options.width && this.layer.css('width', options.width);
                options.height && this.layer.css('height', options.height);
                this.layer.appendTo(parentNode);

                if(options.align){
                    var align = options.align;
                    if(align.elem && align.pos){
                        Position.pin(this.layer, align)
                    } else {
                        Position.center(this.layer, align)
                    }
                } else {
                    Position.center(this.layer)
                }

                if(options.hideBlur){
                    Overlay.blurOverlays.push(this);
                }
                if(options.trigger){
                    this.triggerElement = options.trigger[0] || options.trigger;
                }
                this.element = this.layer[0];
            },
            show : function() {
                if(!this.layer){
                    this.init()
                }
                this.layer.show();
            },
            hide : function() {
                this.layer.hide();
            },
            destroy : function() {
                this.layer.remove();
                erase(this, Overlay.blurOverlays)
            }
        }

        // hide blur overlays
        function hideBlurOverlays(e){
            $(Overlay.blurOverlays).each(function (index, item) {
                if (!item || item.layer.is(':hidden')) {
                    return;
                }
                if (item.triggerElement === e.target || item.element === e.target || $.contains(item.element, e.target)) {
                    return;
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


        Overlay.extend = function(protoProps, staticProps) {
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
            child.__super__ = parent.prototype;

            return child;
        };


        var Menu = Overlay.extend({
            showMenu: function(){
                console.log('this is a menu')
            }
        })

        /* Popup CLASS DEFINITION
         * ====================== */
        var Popup = function(element, options) {
            this.options = options;
            this.$element = $(element);
        }

        Popup.prototype = {
            constructor : Popup,
            overlay : null,
            init : function() {
                var o = this.options, $this = this;

                if (o.modal) {
                    this.overlay = new Overlay({zIndex:  o.zIndex - 1});
                }

                var _popup = $('<div class="mm-popup"></div>').appendTo('body').addClass(o.themeClass).css('z-index', o.zIndex);

                if (o.title !== '') {
                    var _head = $('<div class="hd"><span class="title">' + o.title + '</span></div>').appendTo(_popup);
                    if(o.closeIcon){
                        $('<span class="close" title="关闭">&times;</span>').appendTo(_head).click(function() {
                            if(o.closeMode === 'destroy'){
                                $this.destroy()
                            } else {
                                $this.hide();
                            }
                        });
                    }
                }
                var _body = this.$element.appendTo(_popup).addClass('bd');

                if (o.buttons) {
                    var _foot = $('<div class="ft"></div>').appendTo(_popup);

                    if (!$.isArray(o.buttons)) {
                        o.buttons = new Array(o.buttons);
                    }
                    for (var i = 0; i < o.buttons.length; i++) {
                        var iBtn = o.buttons[i];
                        oBtns = $.extend({
                            classname: 'confirm',
                            trigger: 'click'
                        }, iBtn)
                        if (!iBtn.hasOwnProperty('text')) {
                            for (var key in iBtn) {
                                oBtns.text = key;
                                oBtns.handler = iBtn[key];
                            }
                        }
                        if ( typeof (oBtns.handler) === 'string' && oBtns.handler === 'close') {
                            $('<span class="button cancel-button">' + oBtns.text + '</span>').appendTo(_foot).click(function() {
                                if(o.closeMode === 'destroy'){
                                    $this.destroy()
                                } else {
                                    $this.hide();
                                }
                            });
                        } else {
                            $('<span class="button ' + oBtns.classname + '-button">' + oBtns.text + '</span>').appendTo(_foot).on(oBtns.trigger, oBtns.handler);
                        }
                    }
                }
                // if specify width option, then set the width of targe element
                if (o.width) {
                    // o.width = this.$element.outerWidth();
                    this.$element.css('width', o.width);
                }
                // if specify height option, then set the height of targe element
                if (o.height) {
                    // o.height = this.$element.outerHeight() + ( _head ? _head.outerHeight() : 0) + ( _foot ? _foot.outerHeight() : 0);
                    this.$element.css('height', o.height);
                }

                if(this.options.pin){
                    Position.pin(_popup, this.options.pin)
                } else {
                    Position.center(_popup);
                }

                this.popuper = _popup;
            },
            show : function(options) {
                this.popuper.show();
                if (this.options.modal) {
                    this.overlay.show();
                }
                this.popuper.show();
            },
            hide : function() {
                this.popuper.hide();
                if (this.options.modal) {
                    this.overlay.hide();
                }
                if(this.options.onHide){
                    this.options.onHide.call(this);
                }
            },
            destroy : function() {
                if(this.options.beforeClose){
                    this.options.beforeClose();
                }
                this.popuper.remove();
                if (this.options.modal) {
                    this.overlay.destroy();
                }
                this.$element.removeData('popup');
                if(this.options.onDestroy){
                    this.options.onDestroy.call(this);
                }
            },
            rePosition: function(){
                Position.center(this.popuper);
            }
        }

        /* Popup PLUGIN DEFINITION
         * ======================= */
        $.fn.Popup = function(option) {
            return this.each(function() {
                var $this = $(this), data = $this.data('popup'), options = $.extend({}, $.fn.Popup.defaults, $this.data(), typeof option === 'object' && option)
                if (!data)
                    $this.data('popup', ( data = new Popup(this, options)))
                if ( typeof option === 'string')
                    data[option]()
                else if (options.show)
                    data.init()
            })
        }

        $.fn.Popup.defaults = {
            show : true,
            modal : false,
            themeClass : 'mmpop-aero',
            title : '',
            closeIcon: true,
            zIndex: 500,
            closeMode: 'destroy'
        }


    var pub = {};
    pub.Overlay = Overlay;
    pub.Menu = Menu;

    return pub;
}));
