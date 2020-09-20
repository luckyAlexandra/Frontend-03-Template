# 1、重学HTML｜HTML的定义：XML与SGML

HTML的主要源流来源于XML与SGML，这两个语言都在某种意义上讲是HTML的超集，但是发展到HTML5的以后的时代，HTML与它们的关系已经变得模糊了，HTML变成了一个接受XML和SGML的一定的灵感的一门独立的语言。

DTD是SGML规定的定义它子集的一种文档格式，HTML最早设计出来的是SGML的子集，所以它有DTD。XHTML1.0，对应的应该是HTML的4.2版本左右，所以说是HTML4的一个严格的模式。

- 从DTD了解HTML
https://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd


- 从namespace了解HTMLs
https://www.w3.org/1999/xhtml

# 2、重学HTML｜HTML标签语义

http://static001.geekbang.org/static/time/quote/World_Wide_Web-Wikipedia.html

strong表示这个词在整个文章中的重要性，em表示这个词在这个句子里面的重音是什么。


# 3、重学HTML｜HTML语法

## 合法元素
- Element: \<tagname>...\</tagname>
- Text: text
- Comment: \<!--comment-->
- DocumentType: <!DocType html>
- ProcessingInstruction: \<?a 1?>
- CDATA: \<![CDATA[ ]]>

## 字符引用
- (&#161;) \&quot;
- (&amp;) \&amp;
- (&lt;) \&lt;
- (&quot;) \&quot;

# 4、浏览器API｜DOM API
![avartar](img/Node.png)

## 导航类操作
分为节点导航和元素导航
- parentNode 
- parent Element

- childNodes
- children

- firstChild
- firstElementChild

- lastChild
- lastElementChild

- nextSibling
- nextElementSibling

- previousSibling
- previousElementSibling

## 修改操作
- appendChild
- insertBefore
- removeChild
- replaceChild
其中appendChild和insertBefore是一组。为什么有insertBefore，而没有insertAfter，原因是最小化原则。加入有10个字节点，insertBefore可以插10个位置，appendChild可以插第11个位置。10个节点一共形成了11个空隙，所以这两个节点足够把节点插到任何一个位置。所以说insertAfter是可以用appendChild和insertBefore实现出来的，所以就没有这个API。

## 高级操作
-  `compareDocumentPosition`是一个用于比较两个节点中关系的函数。
- `contains`检查一个节点是否包含另一个节点的函数。
- `isEqualNode`检查两个节点是否完全相同
- `isSameNode`检查两个节点是否是同一个节点，实际上JavaScript中可以用“===”
- `cloneNode`复制一个节点，如果传入参数true，则会连同子元素做深拷贝。

# 5、浏览器API｜ 事件API
所谓事件的冒泡和捕获，跟监听是没有关系的，它在任何一次事件的触发过程中，两个过程都会发生。任何一个事件都有一个先捕获再冒泡的过程，为什么是先捕获呢？其实鼠标并不能提供我们到底点到哪个元素上这个信息，真正点在哪个元素上，我们是要通过浏览器把它计算出来的，所以一定有一个捕获过程，就是从外到内，一层一层地去计算，到底这个事件发生在哪个元素上，这个过程就是捕获。而冒泡则是我们已经算出来点到哪个元素，层层地向外去触发，然后让元素去响应这个事件的过程。所以说其实冒泡的过程更符合人类的直觉，我们在不传第三个参数的情况下，应该是一个冒泡的事件监听。

# 6、浏览器API｜ Range API

## 一个问题
- 把一个元素所有的子元素逆序

1 2 3 4 5 -> 5 4 3 2 1

- DOM的collection是一个living collection
- 元素的子元素在insert的时候是不需要先把它从原来的位置挪掉的
- 使用rangeAPI操作更高效

## Range API
```
var range = new Range()
range.setStart(element, 9)
range.setEnd(element, 4)
var range = document.getSelection().getRangeAt(0)
```
range 有一个起点和终点，只要起点在DOM树里的位置先于终点就可以，它不需要管层级关系，起止点都是由一个element和一个偏移值来决定的。对于element来说，它的偏移值就是children，对于text node来说，它的偏移值就是文字的个数。range并不一定是包含了一个完整的节点，它可以包含半个节点，不需要去顾忌节点和节点之间的边界，所以range选择的范围非常灵活。

range的获得方式，除了手工指定起止点的方法，还有个selection创建方法，现在的selection一般都只支持一个range，所以说永远使用getRangeAt(0)就可以了。


- range.setStartBefore
- range.setEndBefore
- range.setStartAfter
- range.setEndAfter
- range.selectNode
- range.selectNodeContents

删和加
- var fragment = range.extractContents()
- range.insertNode(document.createTextNode('aaaa))

range负责在dom树上选中，并且把它摘下来，fragment可以批量的把它append上去，这两个是非常强大的dom树的微操手术能力。 


# 7、浏览器API｜ CSSOM

## document.styleSheets

## Rules
- document.styleSheets[0].cssRules
- document.styleSheets[0].insertRule("p {color: pink;}", 0)
- document.styleSheets[0].removeRule(0)

## Rule
- CSSStyleRule
    - selectorText String
    - style K-V结构
- CSSCharsetRule
- CSSImportRule
- CSSMediaRule
- CSSFontfaceRule
- CSSPageRule
- CSSNamespaceRule
- CSSKeyframesRule
- CSSSupportsRule

# 8、浏览器API｜ CSSOM view

# 9、浏览器API｜ 其他API
## 标准化组织
- khronos
    - WebGl
- ECMA
    - ECMAScript
- WHATWG
    - HTML
- W3C
    - webaudio
    - CG/WG