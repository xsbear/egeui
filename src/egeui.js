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

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            if (this === undefined || this === null) {
                throw new TypeError('"this" is null or not defined');
            }
            var length = this.length >>> 0; // Hack to convert object.length to a UInt32
            fromIndex = +fromIndex || 0;
            if (Math.abs(fromIndex) === Infinity) {
                fromIndex = 0;
            }
            if (fromIndex < 0) {
                fromIndex += length;
                if (fromIndex < 0) {
                    fromIndex = 0;
                }
            }
            for (; fromIndex < length; fromIndex++) {
                if (this[fromIndex] === searchElement) {
                    return fromIndex;
                }
            }
            return -1;
        };
    }

    var $$ = function(obj) {
        return obj instanceof $ ? obj : $(obj)
    };

    /* Position UTILITY DEFINITION
     * ====================== */
    var Position = {};

    Position.pin = function(pinElem, baseObject) {
        pinElem = $$(pinElem);
        if(!pinElem[0]){
            throw new Error('Position Error: pin element not specified');
        }
        var collision = baseObject.collision || 'flip';
        var posTop, posLeft;

        var baseHeight, baseWidth, basePos;
        var pinHeight = pinElem.outerHeight(),
            pinWidth = pinElem.outerWidth();

        if(baseObject.top && baseObject.left){
            posTop = baseObject.top;
            posLeft = baseObject.left;
            baseHeight = baseWidth = 0;
        } else {
            var baseElem = $$(baseObject.elem);
            if(!baseElem[0]){
                throw new Error('Position Error: base element not specified');
            }
            basePos = baseElem.offset();
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

            if(baseObject.offset){
                var offset = baseObject.offset.split(' ');
                if(offset[0].indexOf('%') > -1){
                    posTop -= parseInt(offset[0].slice(0, -1), 10) / 100 * pinHeight - baseHeight / 2;
                } else {
                    posTop += parseInt(offset[0], 10);
                }

                if(offset.length > 1){
                    if(offset[1].indexOf('%') > -1){
                        posLeft -= parseInt(offset[1].slice(0, -1), 10) / 100 * pinWidth - baseWidth / 2;
                    } else {
                        posLeft += parseInt(offset[1], 10);
                    }
                }
            }
        }

        // collision handle
        if(collision !== 'none'){
            var docST = $(document).scrollTop(), docSL = $(document).scrollLeft(),
                docH = $(document).height(), docW = $(document).width(),
                winH = $(window).height(), winW = $(window).width();

            if(posTop < docST){
                if(!basePos || basePos.top > docST){
                    if(collision === 'fit'){
                        posTop = docST;
                    } else if(collision === 'flip'){
                        posTop = posTop + pinHeight + baseHeight;
                        if(posTop + pinHeight > docH){
                            posTop = docH - pinHeight;
                        }
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
                if(!basePos || basePos.left > docSL){
                    if(collision === 'fit'){
                        posLeft = docSL;
                    } else if(collision === 'flip'){
                        posLeft = posLeft + pinWidth + baseWidth;
                        if(posLeft + pinWidth > docW){
                            posLeft = docW - pinWidth;
                        }
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
        }

        // offsetParent adjust
        var parentOffset = pinElem.offsetParent().offset();
        posLeft -= parentOffset.left;
        posTop -= parentOffset.top;

        pinElem.css({
            'top': posTop,
            'left': posLeft
        });
    };

    Position.center = function(pinElem, baseElem) {
        pinElem = $$(pinElem[0]);
        if(!pinElem){
            throw new Error('Position Error: pin element not specified');
        }
        baseElem = $$(baseElem || window);
        var posLeft = parseInt((baseElem.width() - pinElem.outerWidth()) / 2, 10);
        var posTop = baseElem.height() - pinElem.outerHeight();
        posTop = (posTop < 0 ? 0 : parseInt(posTop / 2, 10)) + $(document).scrollTop();

        pinElem.css({
            'top' : posTop,
            'left' : posLeft
        });
    };


    // widget base class
    var EVENT_KEY_SPLITTER = /^(\S+)\s*(.*)$/;
    var cidCounter = 0;
    var cachedInstances = {};
    function uniqueCid() {
        return 'widget-' + cidCounter++
    }

    // For memory leak
    $(window).unload(function() {
        try {
            for(var cid in cachedInstances) {
                cachedInstances[cid].destroy()
            }
        } catch(e){}
    })

    /* BASE CLASS DEFINITION
    * ====================== */
    var Base = function(){}
    Base.prototype = {
        on: function(event, fn, context){
            var events = this._getEvents(event, 'on');
            events.push([fn, context || this]);
            return this;
        },
        before: function(event, fn, context){
            var events = this._getEvents(event, 'before');
            events.push([fn, context || this]);
            return this;
        },
        after: function(event, fn, context){
            var events = this._getEvents(event, 'after');
            events.push([fn, context || this]);
            return this;
        },
        trigger: function(event){
            var type = 'on';
            var args = Array.prototype.slice.call(arguments, 1);
            if(event === 'before' || event === 'after'){
                type = event;
                event = arguments[1];
                args = Array.prototype.slice.call(arguments, 2);
            }
            if(this._widgetEvents && this._widgetEvents[type] && this._widgetEvents[type][event]){
                var handlers = this._widgetEvents[type][event];
                for (var i = 0; i < handlers.length; i++) {
                    if ($.isFunction(handlers[i][0])) {
                        handlers[i][0].apply(handlers[i][1], args);
                    } else if(isString(handlers[i][0])) {
                        this[handlers[i][0]].apply(handlers[i][1], args);
                    }
                }
            }
        },
        _getEvents: function(event, type){
            this._widgetEvents = this._widgetEvents || {};
            var events = this._widgetEvents[type] || (this._widgetEvents[type] = {});
            return events[event] || (events[event] = []);
        },
    }

    Base.extend = function(protoProps, staticProps) {
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

    /* Widget CLASS DEFINITION
    * ====================== */
    var Widget = Base.extend({
        constructor: function(options) {
            this.options = options;
            this.setup();
        },
        rendered: false,
        setup: function(){
            var defaults = {
                parentNode: document.body
                // other initial options: element, template, id , className
            }
            var options = this.options = $.extend(defaults, this.options);

            this._isTemplate = !options.element;
            this.$element = $$(this.$element || options.element || options.template);
            if(!this.$element[0]){
                throw new Error('Overlay Error: element or template not specified');
            }
            this.element = this.$element[0];
            options.id && this.$element.attr('id', options.id);
            options.className && this.$element.addClass(options.className);

            this.cid = uniqueCid();
            cachedInstances[this.cid] = this;
        },
        render: function(){
            if (!this.rendered) {
                this.rendered = true;
            }
            this.trigger('before', 'render')
            var parentNode = $$(this.options.parentNode);
            if(!isInDocument(this.element)){
                this.$element.appendTo(parentNode);
            }
            this.trigger('after', 'render');

            this._delegateEvents();

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
        _delegateEvents: function(){
            var events = this.events = $.extend(this.events, this.options.events);
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
        $: function(select){
            return this.$element.find(select);
        }
    });

    /* Overlay WIDGET DEFINITION
     * ====================== */
    var Overlay = Widget.extend({
        setup: function(){
            var defaults = {
                // width, height, trigger, hideBlur, align
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 99,
                visible: false
            }
            var options = this.options = $.extend(defaults, this.options);

            Overlay.superClass.setup.call(this);

            this.$element.css({
                'position': options.position,
                'z-index': options.zIndex,
                'top': options.top,
                'left': options.left,
                'display': 'none'
            });
            options.width && this.$element.css('width', options.width);
            options.height && this.$element.css('height', options.height);

            if(options.align){
                options.align.after = options.align.after || 'render';
                this.after(options.align.after, this.align);
                delete(options.align.after);
            }
            options.hideBlur && this._hideBlur($$(options.trigger))
            options.visible && this.show();
        },
        render: function(){
            Overlay.superClass.render.call(this);
            // add to alignOverlays
            if(this.options.align){
                Overlay.alignOverlays.push(this);
            }
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
            erase(this, Overlay.alignOverlays);
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

    // 绑定 resize 后重新定位
    Overlay.alignOverlays = [];
    var resizeTimer;
    var winWidth = $(window).width();
    var winHeight = $(window).height();

    $(window).resize(function () {
        resizeTimer && clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            var winNewWidth = $(window).width();
            var winNewHeight = $(window).height();

            if (winWidth !== winNewWidth || winHeight !== winNewHeight) {
                $(Overlay.alignOverlays).each(function (i, item) {
                    if(item) {
                        if(!isInDocument(item.element)){
                            throw new Error('Overlay Error: an instance element is not existed, it should be destroyed.')
                            return;
                        }
                        item.align();
                    }
                });
            }
            winWidth = winNewWidth;
            winHeight = winNewHeight;
            resizeTimer = null;
        }, 100);
    });

    // 绑定 blur 隐藏事件
    Overlay.blurOverlays = [];
    $(document).on('click', function (e) {
        hideBlurOverlays(e);
    });

    // hide blur overlays
    function hideBlurOverlays(e){
        $(Overlay.blurOverlays).each(function (index, item) {
            if (item) {
                if(!isInDocument(item.element)){
                    throw new Error('Overlay Error: an instance element is not existed, it should be destroyed.')
                    return;
                }
                if(!item.visible){
                    return;
                }
                for (var i = 0; i < item._relativeElements.length; i++) {
                    var el = item._relativeElements[i];
                    if (el === e.target || $.contains(el, e.target)) {
                        return;
                    }
                }
                item.hide();
            }
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

    function isInDocument(element) {
        return $.contains(document.documentElement, element);
    }


    /* Popup WIDGET DEFINITION
     * ====================== */
    var EVENT_NAMESPACE = '.egeui-popup';

    var Popup = Overlay.extend({
        setup: function(){
            // other options: trigger, delegateNode, showAlign
            var defaults = {
                'triggerType': 'hover',
                'delay': 200
            }
            var options = this.options = $.extend(defaults, this.options);
            if(options.align && !options.align.elem){
                options.align.elem = options.trigger;
            }
            if(options.triggerType === 'click'){
                options.hideBlur = true;
            }

            Popup.superClass.setup.call(this);

            this.render();
            this._bindTrigger();

            // 当使用委托事件时，_hideBlur 方法对于新添加的节点会失效 需要重新绑定
            if (options.delegateNode && options.hideBlur) {
                var that = this;
                this.before('show', function () {
                    this._hideBlur($$(options.trigger), true)
                });
            }

            if(this.options.showAlign){
                this.after('show', function(){
                    this.options.showAlign.elem = this.activeTrigger;
                    this.align(this.options.showAlign)
                })
            }
        },

        _bindTrigger: function(){
            var triggerType = this.options.triggerType,
                trigger = this.options.trigger,
                delegateNode = this.options.delegateNode,
                delay = this.options.delay;
            var that = this;

            if(triggerType === 'click'){
                bindEvent('click', trigger, function(){
                    that.activeTrigger = this;
                    that.show()
                }, delegateNode);

            } else if(triggerType === 'focus'){
                bindEvent('focus', trigger, function () {
                    that.activeTrigger = this;
                    that.show();
                }, delegateNode);

                bindEvent('blur', trigger, function () {
                    setTimeout(function () {
                        (!that._downOnElement) && that.hide();
                        that._downOnElement = false;
                    }, delay);
                }, delegateNode);

                // 为了当input blur时能够选择和操作弹出层上的内容  ??
                bindEvent('mousedown', this.element, function (e) {
                    that._downOnElement = true;
                });

            } else {
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
                }, delegateNode);

                bindEvent('mouseleave', trigger, leaveHandler, delegateNode);

                // 鼠标在悬浮层上时不消失
                bindEvent('mouseenter', this.$element, function(){
                    clearTimeout(hideTimer);
                });
                bindEvent('mouseleave', this.$element, leaveHandler);

                bindEvent('mouseleave', 'select', function (e) {
                    e.stopPropagation();
                }, this.$element)
            }

            // remove trigger event when destroy
            this.before('destroy', function(){
                if(delegateNode){
                    $$(delegateNode).off(EVENT_NAMESPACE, trigger)
                } else {
                    $$(trigger).off(EVENT_NAMESPACE)
                }
                if(triggerType !== 'click'){
                    this.$element.off(EVENT_NAMESPACE)
                }
            })
        }
    })

    function bindEvent(type, element, fn, delegateNode){
        type += EVENT_NAMESPACE;
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

            Mask.superClass.setup.call(this);

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
            // other options: content
            var defaults = {
                align: {pos: 'center'},
                classPrefix: 'egeui-dialog',
                closeTpl: 'x',
                title: '',
                zIndex: 999
                // visible: true
            };
            var options = this.options = $.extend(defaults, this.options);

            this.$element = $(this._parseTpl(this._dialogTpl));
            if(options.closeTpl){
                $(this._parseTpl(this._closeTpl)).appendTo(this.$element).append(options.closeTpl);
            }
            if(options.title){
                $(this._parseTpl(this._titleTpl)).appendTo(this.$element).append(options.title);
            }
            if(options.content){
                this.$contentElement = $(this._parseTpl(this._contentTpl)).append(options.content);
                this.$element.append(this.$contentElement)
            } else {
                throw new Error('Dialog Error: content not specified');
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

            Dialog.superClass.setup.call(this);

            // TODO when content is in document, keep element to origin parentNode before destroy
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


    /* DataSource CLASS DEFINITION
     * ====================== */
    var DataSource = Base.extend({
        constructor: function(options){
            this.source = options.source;
            this.filter = options.filter;
            this.locator = options.locator;
            this.valueField = options.valueField;
            this.init();
        },
        init: function(){
            if($.isArray(this.source)){
                this.type = 'array';
            } else if($.isFunction(this.source)){
                this.type = 'function';
            } else if ($.isPlainObject(this.source)) {
                if(this.source.data && this.source.fields){
                    this.type = 'array';
                    this.search_fields = this.source.fields;
                } else {
                    this.type = 'object';
                }
            } else if(isString(this.source)) {
                this.type = 'url';
            }
            if(this.type !== 'url'){
                this.filter = this.filter || 'startsWith';
                if(!$.isFunction(this.filter)){
                    this.filter = Filters[this.filter]
                    if(!this.filter){
                        throw new Error('Specified filter is not existed.')
                    }
                }
                this._initDataSource()
            }

            this.id = 0;
            this.callbacks = [];
        },
        getData: function(query){
            this['_get' + capitalize(this.type) + 'Data'](query);
        },
        abort: function () {
            this.callbacks = [];
        },
        _done: function (data) {
            this.trigger('data', data);
        },
        _getArrayData: function(query){
            var data = this.filter(this.data, query);
            this._done(data)
            return data;
        },
        _getUrlData: function(query){
            var that = this,
                options;
            var obj = {
                query: query ? encodeURIComponent(query) : '',
                timestamp: new Date().getTime()
            };
            var url = this.source.replace(/\{\{(.*?)\}\}/g, function (all, match) {
                return obj[match];
            });

            var callbackId = 'callback_' + this.id++;
            this.callbacks.push(callbackId);

            if (/^(https?:\/\/)/.test(url)) {
                options = {
                    dataType: 'jsonp'
                };
            } else {
                options = {
                    dataType: 'json'
                };
            }
            $.ajax(url, options).success(function (data) {
                if(that.locator){
                    data = data[that.locator];
                }
                if ($.inArray(callbackId, that.callbacks) > -1) {
                    delete that.callbacks[callbackId];
                    that._done(data);
                }
            }).error(function () {
                if ($.inArray(callbackId, that.callbacks) > -1) {
                    delete that.callbacks[callbackId];
                    that._done({});
                }
            });
        },
        _initDataSource: function(dataSource){
            if(this.type === 'array'){
                this.data = this.source;
                if(this.search_fields){
                    this.source = this.source.data;
                    var data = this.source;
                    var fields = this.search_fields;
                    var l = data.length;
                    this.data = [];
                    // console.log(data)
                    for (var i = 0; i < l ; i++) {
                        var item = {};
                        for(var f = 0; f < fields.length; f++){
                            item[fields[f]] = data[i][fields[f]]
                        }
                        this.data[i] = item;
                    }
                }
                normalizeData(this.data);
            }
        },
        _filters: {
            'startsWith': function(data, search){
                return filterData('startsWith', data, search)
            },
            'stringMatch':  function(data, search){
                return filterData('stringMatch', data, search)
            },
        },
    })

    // 标准数据格式
    // {
    //     value: 'xxx' 或者 {'field1': {value: '123'}, 'field2': {value: 'xxx'}} 待匹配字段
    //     hlIndex: [start, end] 高亮范围  filter 后返回
    // }
    function normalizeData(data) {
        $.each(data, function (index, item) {
            if (isString(item)) {
                data[index] = {value: item};
            } else if ($.isPlainObject(item)) {
                for(var field in item){
                    item[field] = {
                        value: item[field]
                    }
                }
            }
        })
    }

    var Filters = {
        'startsWith': function(data, search){
            var re = new RegExp('^' + escapeKeyword(search));
            var result = [];
            var l = search.length;
            $.each(data, function(index, item){
                var new_item = {};
                var matched = false;
                for(var field in item){
                    if(!$.isPlainObject(item[field]) && field === 'value'){
                        new_item.value = item.value;
                        if(re.test(item.value)){
                            new_item.hlIndex = [0, l];
                            matched = true;
                        }
                    } else if($.isPlainObject(item[field])){
                        new_item[field] = {
                            value: item[field].value
                        };
                        if(re.test(item[field].value)){
                            new_item[field].hlIndex = [0, l];
                            matched = true;
                        }
                    }
                }
                if(matched){
                    new_item.index = index;
                    result.push(new_item);
                }
            })
            return result;
        },
        'stringMatch': function(data, search){
            var re = new RegExp(escapeKeyword(search));
            var result = [];
            var l = search.length, hl_start;
            $.each(data, function(index, item){
                var new_item = {};
                var matched = false;
                for(var field in item){
                    if(!$.isPlainObject(item[field]) && field === 'value'){
                        new_item.value = item.value;
                        hl_start = item.value.search(re);
                        if(hl_start > -1){
                            new_item.hlIndex = [hl_start, l];
                            matched = true;
                        }
                    } else if($.isPlainObject(item[field])){
                        new_item[field] = {
                            value: item[field].value
                        };
                        hl_start = item[field].value.search(re);
                        if(hl_start > -1){
                            new_item[field].hlIndex = [hl_start, l];
                            matched = true;
                        }
                    }
                }
                if(matched){
                    new_item.index = index;
                    result.push(new_item);
                }
            })
            return result;
        }
    }

    var EVENT_NAMESPACE_AUTOCOMPLETE = '.egeui-autocomplete'
    /* AutoComplete WIDGET DEFINITION
     * ====================== */
    var AutoComplete = Overlay.extend({
        _selectTpl: '<div class="{{classPrefix}}"><ul data-role="items"></ul></div>',
        _itemWrapTpl: '<li class="{{classPrefix}}-item" data-role="item">{{item}}</li>',

        setup: function(){
            // other optiosn: themeClass itemTpl
            var defaults = {
                align: {pos: 'bottom', collision: 'none'},
                classPrefix: 'egeui-select',
                selectTpl: this._selectTpl,
                itemSelectedClass: 'item-selected',
                selectFirst: false,
                submitOnEnter: false,
                delay: 200
            };
            var options = this.options = $.extend(true, defaults, this.options);

            this.$element = $(this._parseTpl(options.selectTpl));
            if(options.themeClass){
                this.$element.addClass(options.themeClass);
            }
            this._itemWrapTpl = this._parseTpl(this._itemWrapTpl);
            options.align.elem = options.align.elem || options.trigger;

            AutoComplete.superClass.setup.call(this);

            this.dataSource =  new DataSource({
                source: options.dataSource,
                filter: options.filter,
                locator: options.locator,
                valueField: options.valueField
            })

            if(options.enableChar){
                this.enableChar = options.enableChar;
                this.disabled = true;
            }

            this._bindEvents();
        },
        show: function(){
            if(this.visible) return;
            if(this._isEmpty()) return;
            AutoComplete.superClass.show.call(this);

            this.$element.scrollTop(0);
            this._adjustMaxHeight();
        },
        reset: function(){
            if(lteIE9) this.slient = true;
            $$(this.options.trigger).val(this.query = '');
            this._clear();
            this.hide();
        },
        destroy: function(){
            this.dataSource = null;
            this.data = null;
            $$(this.options.trigger).off();
            this._clear();
            AutoComplete.superClass.destroy.call(this);
        },

        query: '',
        lastIndex: -1,
        selectedIndex: -1,
        allowMouseMove: true,
        disabled: false,
        disableChar: ' ',
        queryData: function(query){
            if(this.disabled){
                return;
            }
            if(query === undefined && this.query === ''){
                this.data = [];
                return;
            }
            console.log(this.query)
            this.dataSource.abort();
            this.dataSource.getData(query || this.query)
        },

        _bindEvents: function(){
            var options = this.options;

            this.dataSource.on('data', function(data){
                this.data = data;
                this._fillItems();
            }, this);

            if(options.selectFirst){
                this.after('show', function(){
                    this.selectedIndex = 0;
                    this.trigger('indexChange');
                });
            }
            this.after('hide', function(){
                if(this.items){
                    this.lastIndex = this.selectedIndex;
                    this.selectedIndex =  -1;
                    this.trigger('indexChange');
                }
            });
            this.on('indexChange', this._handleItemHover)
            .on('itemSelected', function(){
                this.selected = true;
                var selectedData = this.data[this.selectedIndex];
                this.hide();
                if(this.dataSource.search_fields){
                    this.trigger('selected', this.dataSource.source[selectedData.index])
                } else {
                    var val = selectedData[this.dataSource.valueField || 'value'] || selectedData;
                    if(lteIE9) this.slient = true;

                    if(this.enableChar){
                        var old_val = $$(options.trigger).val();
                        val = old_val.substr(0, this.insert_start) + val + ' ' + old_val.substr(this.insert_start + this.query.length);
                        this.disabled = true;
                    } else {
                        this.query = val;
                    }

                    $$(options.trigger).val(val);
                    this.trigger('selected', selectedData.value || selectedData);
                }
            });

            this.$('[data-role=items]').on('mouseenter.autocomplete', 'li', wrapFn(function(ev){
                if(!this.allowMouseMove){
                    this.allowMouseMove = true;
                    return;
                }
                this.lastIndex = this.selectedIndex;
                this.selectedIndex = this.items.index(ev.currentTarget);
                this.trigger('indexChange');
            }, this)).on('mousedown.autocomplete', 'li', wrapFn(function(e){
                if (lteIE9) {
                    var trigger = $$(this.options.trigger)[0];
                    trigger.onbeforedeactivate = function () {
                        window.event.returnValue = false;
                        trigger.onbeforedeactivate = null;
                    };
                }
                e.preventDefault();
                this.trigger('itemSelected')
            }, this));

            this._bindTrigger();
        },

        _fillItems: function(){
            var items = '';
            $.each(this.data, wrapFn(function(index, item){
                item = this._renderItem(item);
                items += this._itemWrapTpl.replace('{{item}}', item)
            }, this))
            this.items = this.$('[data-role=items]').html(items).children();
            this.show()
        },
        _renderItem: function (item){
            if(item.value && !$.isPlainObject(item.value)){
                return highlight(item.value, item.hlIndex);
            } else if(this.options.itemTpl){
                return parseItem(this.options.itemTpl, item, this.dataSource.filter)
            }
        },
        // bind event
        _bindTrigger: function(){
            var trigger = $$(this.options.trigger)[0];
            var that = this;

            bindTextchange(trigger);

            var queryTimer;
            $(trigger).on('textchange.autocomplete', function(ev){
                if(lteIE9 && that.slient){
                    that.slient = false;
                    return;
                }
                var new_query = $(ev.target).val().replace(/^\s*/, '');

                if(that.enableChar && !that.disabled){
                    var cursor = getInputSelection(ev.target)
                    var at_cursor = new_query.lastIndexOf(that.enableChar, cursor);
                    new_query = new_query.substr(at_cursor)
                    new_query = /^@([^\s]+)\s*/.exec(new_query);
                    new_query = new_query ? new_query[1] : '';
                    that.insert_start = at_cursor + 1;
                }

                if(compare(that.query, new_query)) return;
                that.query = new_query;

                queryTimer && clearTimeout(queryTimer);
                queryTimer = setTimeout(function(){
                    that._clear();
                    that.hide();
                    that.queryData();

                    queryTimer = null;
                }, that.options.delay)
            }).on('keydown.autocomplete', wrapFn(this._handleKeydown, this))
            .on('keyDown keyUp', wrapFn(this._handleKeyDownUp, this))
            .on('keyEnter', wrapFn(this._handleKeyEnter, this))
            .on('keyEsc', wrapFn(this.hide, this));

            acBindEvent('blur', trigger, function(){
                that.hide();
            })
        },
        _handleKeydown: function (e) {
            // console.log(e.key)
            if(this.enableChar){
                if(e.key === this.enableChar){
                    this.disabled = false;
                    console.log('enable')
                } else if(e.key === this.disableChar){
                    this.disabled = true;
                    console.log('disable')
                }
            }
            var keyName = specialKeyCodeMap[e.which];
            if (keyName) {
                // TODO: _handleKeyDownUp can't prenvent default;
                if(keyName === 'up'){
                    e.preventDefault();
                }
                if(this.enableChar && keyName  === 'enter'){
                    // console.log(e);
                    e.preventDefault();
                }
                var eventKey = 'key' + capitalize(keyName);
                $$(this.options.trigger).trigger(e.type = eventKey, e);
            }
        },
        _handleKeyEnter: function(e){
            // e.preventDefault();
            this.items && this.items[this.selectedIndex] && this.trigger('itemSelected');
            !this.options.submitOnEnter && e.preventDefault();
        },
        _handleKeyDownUp: function(e){
            if(this.selected){
                this._clear();
                this.queryData();
                this.selected = false;
            }

            if(!this.items) return;

            this.show();
            this.allowMouseMove = false;

            this.lastIndex = this.selectedIndex;

            if(e.type === 'keyDown'){
                this.selectedIndex++;
            } else {
                this.selectedIndex--;
            }
            if(this.selectedIndex === this.items.length){
                this.selectedIndex = -1;
            }
            if(this.selectedIndex === -2){
                this.selectedIndex = this.items.length - 1;
            }
            this.trigger('indexChange');

            var row =  $(this.items[this.selectedIndex]);
            if(!row[0]) return;
            var rowTop = row.position().top;
            var delta = rowTop + row.outerHeight() - this.$element.height();
            if(delta > 0) {
                this.$element.scrollTop(delta + this.$element.scrollTop())
            } else if(rowTop < 0){
                this.$element.scrollTop(Math.max(0, this.$element.scrollTop() + rowTop));
            }
        },

        _adjustMaxHeight: function(){
            var maxTop = $(window).height() + $(window).scrollTop() - this.$element.outerHeight();
            var top = parseInt(this.$element.css('top'), 10);
            this.$element.css('max-height', top > maxTop ? (Math.max(0, maxTop - top + this.$element.innerHeight()) + 'px') : '');
        },
        _handleItemHover: function(){
            $(this.items[this.lastIndex]).removeClass(this.options.itemSelectedClass);
            $(this.items[this.selectedIndex]).addClass(this.options.itemSelectedClass);
        },
        _isEmpty: function() {
            var data = this.data;
            return !(data && data.length > 0);
        },
        _clear: function () {
            this.$('[data-role=items]').empty();
            delete this.items;
            this.selectedIndex =  -1;
        },
        _parseTpl: function(tpl){
            return tpl.replace(/\{\{classPrefix\}\}/g, this.options.classPrefix);
        }
    })
    function parseItem(tpl, data, hl){
        var re = /(.*?)\{\{([\w\-]+)\}\}(.*?)/g;
        return tpl.replace(re, function(match, p1, p2, p3){
            return  p1 + (hl ? highlight(data[p2].value, data[p2].hlIndex) : data[p2]) + p3;
        })
    }
    function highlight(text, hlIndex){
        if(!hlIndex) return text;
        var l = text.length;
        return text.substr(0, hlIndex[0]) + '<b>' +
               text.substr(hlIndex[0], hlIndex[1]) + '</b>' +
               text.substr(hlIndex[0] + hlIndex[1], l);
    }
    var specialKeyCodeMap = {
        // 9: 'tab',
        27: 'esc',
        // 37: 'left',
        // 39: 'right',
        13: 'enter',
        38: 'up',
        40: 'down'
    };
    function escapeKeyword (str){
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    function compare(a, b) {
        a = (a || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
        b = (b || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
        return a === b;
    }
    function acBindEvent(type, element, fn){
        type += EVENT_NAMESPACE_AUTOCOMPLETE;
        $$(element).on(type, fn);
    }
    var lteIE9 = /\bMSIE [6789]\.0\b/.test(navigator.userAgent);
    // bind text change event
    function bindTextchange(element){
        if (lteIE9) {
            var elementValue = element.value;
            element.attachEvent("onpropertychange", function(ev){
                if (ev.propertyName !== "value") return;
                var value = ev.srcElement.value;
                if (value === elementValue) return;
                elementValue = value;
                $(element).trigger("textchange");
            });
            $(element).on("selectionchange keyup keydown", function() {
                if (element.value !== elementValue) {
                    elementValue = element.value;
                    $(element).trigger("textchange");
                }
            });
        } else {
            $(element).on("input", function(e) {
                // if (element.nodeName !== "TEXTAREA") {
                $(element).trigger("textchange");
                // }
            });
        }
    }
    function wrapFn(fn, context) {
        return function () {
            fn.apply(context, arguments);
        }
    }
    function capitalize(str) {
        return str.replace(/^([a-z])/, function (f, m) {
            return m.toUpperCase();
        });
    }
    function isString(str) {
        return Object.prototype.toString.call(str) === '[object String]';
    }


    function getInputSelection(el) {
        var start = 0, end = 0, normalizedValue, range,
            textInputRange, len, endRange;

        if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
            start = el.selectionStart;
            end = el.selectionEnd;
        } else {
            range = document.selection.createRange();

            if (range && range.parentElement() == el) {
                len = el.value.length;
                normalizedValue = el.value.replace(/\r\n/g, "\n");

                // Create a working TextRange that lives only in the input
                textInputRange = el.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());

                // Check if the start and end of the selection are at the very end
                // of the input, since moveStart/moveEnd doesn't return what we want
                // in those cases
                endRange = el.createTextRange();
                endRange.collapse(false);

                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;

                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }
        }
        return {
            start: start,
            end: end
        };
    }


    /* Contacts WIDGET DEFINITION
     * ====================== */
    var ContactSelect = Widget.extend({
        setup: function(){
            Overlay.superClass.setup.call(this);
            var defaults = {
                inputTpl: '<input type="text">',
                removeTpl: '<i data-role="remove">x</i>'
            }
            var options = this.options = $.extend(defaults, this.options);
            if(!options.contactTpl){
                throw new Error('ContactSelect Error: contactTpl not specified');
            }

            ContactSelect.superClass.setup.call(this);

            this.input = $(options.inputTpl).appendTo(this.element).css('border', 'none');

            this.adjustInputWidth();

            var that = this;
            this.selector = new AutoComplete({
                trigger: this.input,
                selectFirst: options.selectFirst,
                dataSource: options.data,
                filter: options.filter,
                itemTpl: options.itemTpl,
                zIndex: 9999,
                align: {
                    elem: this.$element,
                    after: 'show'
                }
            }).on('selected', function(data){
                this.reset();
                that.insertItem(data);
            });

            this.input.on('keydown.contactselect', function(e){
                if(e.which === 8 && this.value === '' && that.items.length){
                    that.removeItem(that.items.length - 1)
                }
            })

            if(options.showAllTrigger){
                $$(options.showAllTrigger).click(function(){
                    that.selector.queryData('');
                    that.input.focus()
                })
            }

            this.render();
        },
        contacts: [],
        // TODO: public private diff
        items: [],
        events: {
            "click": function(){
                this.input.focus()
            },
            "click [data-role='remove']": "removeItem"
        },
        destroy: function(){
            this.selector.destroy();
            this.input.remove();
            delete this.items;
            delete this.contacts;
            ContactSelect.superClass.destroy.call(this);
        },
        'insertItem': function(data){
            if(this.contacts.indexOf(data) > -1){
                return;
            }

            var re = /(.*?)\{\{([\w\-]+)\}\}(.*?)/g;
            var contactTpl = this.options.contactTpl.replace(re, function(match, p1, p2, p3){
                return  p1 + data[p2] + p3;
            })
            var insertItem = $(contactTpl).insertBefore(this.input);
            if(this.options.removeTpl){
                $(this.options.removeTpl).appendTo(insertItem);
            }
            this.items.push(insertItem[0]);
            this.adjustInputWidth();
            this.trigger('add', data)
            this.contacts.push(data);
        },
        'removeItem': function(e){
            var index, item;
            if($.isNumeric(e)){
                index = e;
                item = this.items[index];
            } else {
                item = $(e.target).parent()[0];
                index = this.items.indexOf(item);
            }
            var contact = this.contacts[index];
            this.items.splice(index, 1);
            this.contacts.splice(index, 1);
            $(item).remove();
            this.adjustInputWidth();
            this.trigger('remove', index);
        },
        'adjustInputWidth': function(){
            var wrapWidth = this.$element.width();
            var inputWidth = wrapWidth;
            if(this.items.length){
                var item = $(this.items.slice(-1)[0]);
                inputWidth = wrapWidth - item.offset().left + this.$element.offset().left - item.outerWidth() - 10;
                inputWidth = Math.max(30, inputWidth);
            }
            this.input.css('width', inputWidth)
        }
    })


    var pub = {};
    pub.Overlay = Overlay;
    pub.Popup = Popup;
    pub.Dialog = Dialog;
    pub.AutoComplete = AutoComplete;
    pub.ContactSelect = ContactSelect;

    return pub;
}));
