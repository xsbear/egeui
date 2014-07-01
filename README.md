EGEUI
====

A egeio ui library

## Position
简单定位工具

### Position.pin
将一个 DOM 节点相对于另一个 DOM 节点进行定位操作。

#### 用法
    egeui.Position.pin(pinElem, baseObject)

#### 参数
1. pinElem:  Type: `jQuery|element|selector` 目标定位元素。
2. baseObject:  Type: `Object` 基准定位元素及定义
 * elem:  Type: `jQuery|element|selector` 基准定位元素
 * pos:  Type: `String`, Value: `right`, `left`, `top`, `bottom`,  基于基准元素的定位方向。
 * offset:  Type: `String`, 偏移量，可包含垂直、水平两个方向的偏移，用空格分割， 正负数字表示偏移像素，`%`后缀表示目标元素相对基准元素的偏移量。如：`offset: '50% 10'`，表示垂直相对偏移50%，水平向右偏移10像素
 * collision:  Type: `String`, Value: `flip`, `fit`, 碰撞处理，翻转 适配

### Position.center
居中定位，接收两个参数，将 pinElement 定位在 baseElement 元素的中央位置。

#### 用法
    egeui.Position.center(pinElem, baseElem)

#### 参数
1. pinElem: `jQuery|element|selector`, 目标定位元素
2. baseElem: `jQuery|element|selector`, 基准定位元素


## Widget
组件基类

### 选项
* events 组件内DOM事件委托

### 方法
* destroy: 销毁组件实例
* before: 自定义事件，支持  show hide destroy 方法调用前
```
    pop_hover.before('show', function(){
        console.log(this)
    })
```
* after: 自定义事件，支持  show hide destroy 方法调用后
* trigger: 触发自定义事件
```
    this.trigger('before', 'show')
```

## Overlay
基础浮层组件
### 用法
    var ol = new egeui.Overlay(options)

#### options
* element: Type: `jQuery|element|selector`
* template: Type: `String` 指定浮层元素模板
* width: Type: `Integer` 指定浮层宽度(像素)
* height: Type: `Integer` 指定浮层高度(像素)
* id
* className
* position
* left
* top
* zIndex
* visible: Type `boolean`  default: `false`
* parentNode:
* trigger:
* hideBlur: Type `boolean`
* align: 同 Position

### 方法
* show: 显示浮层
* hide: 隐藏浮层
* destroy: 销毁浮层
* setPosition: 定位浮层
    {
        top: 100,
        left: 100,
        collision: 'flip'
    }

## Popup
可触发的浮层组件

### 用法
    var pp = new egeui.Popup(options)

#### options
* trigger: Type `element|selector|jQuery` 浮层触发元素
* triggerType: Type `String` Value: `click`, `focus`, `hover`(default)
* delay: Type `Integer` 延时
* delegateNode: Type `element|selector|jQuery` 触发元素所委托的容器元素
* showAlign: Type `Object`, 显示前定位，参数同 Position.pin, elem自动设为当前trigger，无需指定

## Mask
全屏遮罩层组件

### 用法
    new egeui.Mask({zIndex: 99, opacity: 0.1});

### 选项
#### zIndex
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


## Dialog
弹出对话框组件

### 用法
    var pp = new egeui.Dialog(options)

### 选项
* classPrefix: Type `String` 'egeui-dialog'
* closeTpl: Type `String` 'x'
* title: Type `String` ''
* content: Type `String|element|jQuery`
* mask: Type `Object` 同Mask, default `true`
