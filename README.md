EGEUI
====

A egeio ui library

## Position
简单定位工具

### Position.pin
将一个 DOM 节点相对于另一个 DOM 节点进行定位操作。

#### 用法
    mmui.Position.pin(pinElem, baseObject)

#### 参数
1. pinElem: 目标定位元素。 类型：jQuery 节点对象
2. baseObject: 基准定位元素及定义。类型：对象字面量
 * elem: 基准定位元素，jQuery 节点对象
 * pos: 基于基准元素的定位方向。类型：字符串, `right`, `left`, `top`, `bottom`.
 * offset: 偏移量，可包含垂直、水平两个方向的偏移，用空格分割， 正负数字表示偏移像素，`%`后缀表示目标元素相对基准元素的偏移量。类型：字符串。如：`offset: '50% 10'`，表示垂直相对偏移50%，水平向右偏移10像素

### Position.center
居中定位，接收两个参数，将 pinElement 定位在 baseElement 元素的中央位置。

#### 用法
    mmui.Position.center(pinElem, baseElem)

#### 参数
1. pinElem: 目标定位元素。 类型：jQuery 节点对象
2. baseElem: 基准定位元素。类型：jQuery 节点对象

## Overlay
全屏蒙层组件

### 用法
    var ol = new mmui.Overlay({zIndex: 500, opacity: 0.1});

### 选项
#### z-index
Type: `Integer`
Default value: `499`

蒙层堆叠级别

#### opacity
Type: `Float`
Default value: `0.4`

蒙层透明度

### 方法
* show: 显示蒙层
* hide: 隐藏蒙层
* destroy: 销毁蒙层

## Loading
简单全屏加载组件，包含全屏蒙层及进度指示框

### 用法
    var loading = new mmui.Loading(text, options)

### 参数
#### text
Type: `String`

默认进度指示框中所使用提示文字

#### options
* zIndex: 蒙层堆叠级别 Overlay 选项描述
* opacity: 蒙层透明度，见 Overlay 选项描述
* indicator: 自定义进度指示框，如 `indicator: '<div class="mm-loading">正在加载</div>'`，如配置此选项，请将 `text` 选项留空

### 方法
* hide: 关闭并销毁加载组件

## Popup
弹窗组件

### 用法
    // 创建对象实例
    var pp = new mmui.Popup(elem, options)
    // jQuery plugin
    $(elem).Popup(options)

### 参数
#### elem
新Popup对象实例所应用的 DOM 节点元素
#### options
* width: 指定弹窗宽度(像素)  Type: `Integer`
* height: 指定弹窗高度(像素) Type: `Integer`
* show: 初始化后是否显示弹窗 Type: `Boolean`, Default value: `true`
* modal: 是否为模式弹窗 Type: `Boolean`, Default value: `false`
* themeClass: 弹窗皮肤样式 Type: `String`, Default value: `mmpop-aero`
* pin : 定位方式, 如指定则调用 `Position.pin`，否则调用 `Position.center` Type: `Object`
* title : 弹窗标题 Type: `String`
* closeIcon: 是否显示关闭按钮 Type: `Boolean`, Default value: `true`
* zIndex: 弹窗堆叠级别 Default value: `500`
* closeMode: 关闭模式，若值为非 `destroy`，则点击关闭或取消按钮只隐藏窗口，否则销毁对象实例 Type: `String` Default value: `destroy`
* onHide: 弹窗隐藏触发处理函数绑定 Type: `Function`
* beforeClose: 弹窗销毁前触发处理函数绑定 Type: `Function`
* onDestroy: 弹窗销毁后触发处理函数绑定 Type: `Function`
* buttons: 弹窗底部按钮配置，示例：
    buttons: [{
        text: '确定'
        classname: 'confirm'
        trigger: 'click'
        handler: function(){
            alert('confirm!')
        }
    }]
    // or
    buttons: {
        'close': function(){
            alert('closed!')
        }
    }

### 方法
* show: 显示弹窗
* hide: 隐藏弹窗
* destroy: 销毁弹窗
* rePosition: 弹窗重新定位，只支持屏幕中间，既 Position.center

jQuery plugin 的方法调用方式为 $(elem).Popup('mehtod name')
