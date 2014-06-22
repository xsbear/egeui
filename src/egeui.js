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

    var pub = {};

    pub.$$ = function(obj) {
        return obj instanceof $ ? obj : $(obj)
    }

    +function (pub) {
        var Position = {};

        Position.pin = function(pinElem, baseObject) {
            var baseElem = pub.$$(baseObject.elem);
            var basePos = baseElem.offset();
            pinElem = pub.$$(pinElem);
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
            pinElem = pub.$$(pinElem);
            baseElem = pub.$$(baseElem) || $(window);
            var posLeft = parseInt((baseElem.width() - pinElem.outerWidth()) / 2, 10);
            var posTop = baseElem.height() - pinElem.outerHeight();
            posTop = (posTop < 0 ? 0 : parseInt(posTop / 2, 10)) + $(document).scrollTop();

            pinElem.css({
                'top' : posTop,
                'left' : posLeft
            });
        };

        pub.Position = Position

    }(pub);


    +function (pub) {

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

        pub.Mask = Mask;

    }(pub);


    +function (pub) {

        var Position = pub.Position;
        var Overlay = pub.Overlay;

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

        pub.Loading = Loading;

    }(pub);


    +function (pub) {

        /* Overlay CLASS DEFINITION
         * ====================== */
        var Overlay = function(options) {
            var defaults = {
                zIndex: 499,
                opacity: 0.4,
            }
            this.options = $.extend(defaults, options);
            this. init();
        }

        Overlay.prototype = {
            init: function() {
                this.overlayer = $('<div id="dm_window_overlay"></div>').appendTo('body').css({'z-index': this.options.zIndex, 'opacity': this.options.opacity});
            },
            show : function() {
                this.overlayer.show();
                if (this.masklayer) {
                    this.masklayer.show();
                }
            },
            hide : function() {
                this.overlayer.hide();            },
            destroy : function() {
                this.overlayer.remove();
            }
        };

        pub.Overlay = Overlay;

    }(pub);


    +function (pub) {

        var Position = pub.Position;
        var Overlay = pub.Overlay;

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

        pub.Popup = Popup;

    }(pub);

    return pub;
}));
