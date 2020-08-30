# 第一步 css语法的研究

css2.1版本

https://www.w3.org/TR/CSS21/grammar.html#q25.0
https://www.w3.org/TR/css-syntax-3

css2.1是一个比较旧的版本了，但是它是一个snapshot，所以css2.1的grammar summary的位置，就是当时的一份完整的语法列表。现在大量引入css3后，这个列表上会有一些语法有差异，一些语法不全。但总体来讲，它是一个不错的起点。

## grammar

*: 0 or more
+: 1 or more
?: 0 or 1
|: separates alternatives
[ ]: grouping

注释：S是空白符号，CDO和CDC是html注释的起点和终点。早年的css为了支持html里不要把css显示出来，所以允许用html注释把css内容变成html注释，这样旧的浏览器就会把css文本理解成html注释，而新的浏览器就可以把css文本理解为css规则。所以可以看到在可以使用空白符的地方多数都会支持CDO或者CDC。现代浏览器基本是完全支持css，不支持css，会把style标签里的内容当作文本显示的浏览器已经不存在了。所以看到CDO和CDC的时候，可以在脑内直接忽略它，这是一个非常非常古老的历史包袱。

## 产生式

> stylesheet
  : [ CHARSET_SYM STRING ';' ]?
    [S|CDO|CDC]* [ import [ CDO S* | CDC S* ]* ]*
    [ [ ruleset | media | page ] [ CDO S* | CDC S* ]* ]*
  ;

## 总结
CSS2.1规定的css的总体结构
- @charset
- @import
- rules
    - @media
    - @page
    - @rule


# 第二步 css@规则的研究

## At-rules

• @charset : https://www.w3.org/TR/css-syntax-3/
虽然@charset在2.1版本里已经有定义，但它在css3里有一个重新定义的版本，在css-syntax-3这个标准里，主要作用还是声明css的字符集。

• @import :https://www.w3.org/TR/css-cascade-4/
@import在css-cascade-4标准里

• @media :https://www.w3.org/TR/css3-conditional/
@media在css3的conditional标准里，这个标准里有引用了media query，规定了media后边的一部分查询规则。所以其实media query并不是一个新特性，它是类似于一个预置好的函数，查询媒体的规范。真正把查询媒体引入到css3的是conditional标准。conditional指一些标准有条件的发生生效。

• @page : https://www.w3.org/TR/css-page-3/
@page有一份单独的css3标准去讲述它，它主要跟打印的时候相关，理论上叫分页媒体，但其实主要的分页媒体就是打印机，一般来说浏览器都是不分页的。


• @counter-style :https://www.w3.org/TR/css-counter-styles-3 
列表前的小黑点或者小数字

• @keyframes :https://www.w3.org/TR/css-animations-1/
定义动画用的

• @fontface :https://www.w3.org/TR/css-fonts-3/
fontface可以用来定义一切字体，也不一定是web font，由此衍生出来一个技巧就是icon font。

• @supports :https://www.w3.org/TR/css3-conditional/
同样是来自conditional标准，用来检查某些css功能存不存在，但是因为supports本身隶属于css3，是有兼容型问题的，不推荐使用，因为可能要检查的属性比supports的兼容性还要好。4～5年后css再出的新规则在用supports去检查可能比较好。

• @namespace :https://www.w3.org/TR/css-namespaces-3/
处理命名空间。


# 第三步 css规则的结构

- 选择器
- 声明
    - Key
    - Value

```
div {
    background-color: blue;
}
```


### Selector

- https://www.w3.org/TR/selectors-3/ 
- https://www.w3.org/TR/selectors-4/

selector有两个标准，level3和level4，现在实现比较好的是level3，level4还在标准制定的途中

*: 0 or more
+: 1 or more
?: 0 or 1
|: separates alternatives
[ ]: grouping

The productions are:

selectors_group
  : selector [ COMMA S* selector ]*
  ;

selector
  : simple_selector_sequence [ combinator simple_selector_sequence ]*
  ;

combinator
  /* combinators can be surrounded by whitespace */
  : PLUS S* | GREATER S* | TILDE S* | S+
  ;

simple_selector_sequence
  : [ type_selector | universal ]
    [ HASH | class | attrib | pseudo | negation ]*
  | [ HASH | class | attrib | pseudo | negation ]+
  ;

selectors_groups是有comma分隔的selector构成的，selector是由一个simple_selector_sequence组合成的，simple_selector_sequence是用combinator相连接的，combinator有几种，PLUS（+），GREATER（>），TILDE(~)，空格。

simple_selector_sequence是由简单选择器构成的，简单选择器有type_selector(类型选择器)，universal（*选择器），HASH（#选择器），class（.选择器），attrib（属性选择器），pseudo（伪类和伪元素选择器），negation（带not的选择器）

### Key
    - Properties
    - Variables: https://www.w3.org/TR/css-variables/

css variables标准又引入一种新的key值，是以双减号开头的

Example1
```
:root {
  --main-color: #06c;
  --accent-color: #006;
}
/* The rest of the CSS file */
#foo h1 {
  color: var(--main-color);
}
```

Example7
```
:root {
  --main-color: #c06;
  --accent-background: linear-gradient(to top, var(--main-color), white);
}
```

Example8
```
:root {
  --one: calc(var(--two) + 20px);
  --two: calc(var(--one) - 20px);
}
```

Example11 用作key
```
.foo {
  --side: margin-top;
  var(--side): 20px;
}
```

Example13 无效值覆盖
```
:root { --not-a-color: 20px; }
p { background-color: red; }
p { background-color: var(--not-a-color); }
```

### Value
    -  https://www.w3.org/TR/css-values-4/
值也是level4标准，虽然它也是working draft状态，但它的实现状态非常好，而且一直保持着更新。


# css选择器

## 一 选择器语法

- 简单选择器
    - \*
    - div svg|a
    - .
    - \#
    - [attr=value]
    - :
    - ::

[attribute~=value]用于选取属性值中包含指定词汇的元素。
[attribute|=value]，用于选取带有以指定值开头的属性值的元素，该值必须是整个单词。
[attribute^=value]匹配属性值以指定值开头的每个元素。
[attribute$=value]匹配属性值以指定值结尾的每个元素。
[attribute*=value]匹配属性值中包含指定值的每个元素。

属性选择器比较强大，理论上我们可以用属性选择器来代替class选择器和ID选择器。

- 复合选择器
    - <简单选择器><简单选择器><简单选择器>
    - \* 或者div 必须写在最前面

- 复杂选择器
    - <复合选择器>\<sp><复合选择器>
    - <复合选择器>">"<复合选择器>
    - <复合选择器>"~"<复合选择器>
    - <复合选择器>"+"<复合选择器>
    - <复合选择器>"||"<复合选择器>(selector level 4)

## 二 选择器的优先级

- 简单选择器计数
```
#id div.a#id {
    ...
}
```

[0, 2, 1, 1]

S = 0 * N³ + 2 * N² + 1 * N¹ + 1

取 N = 1000000

S = 2000001000001

在IE的老版本里，因为N取的值不够大，它要节省内存，取了255，导致256个class，就相当于一个ID，老版本IE6就是这样。后来大部分浏览器都选择了65536，现代浏览器会更保守，选取一个足够大的值，为节约内存占用，回选取一个16进制上比较整的数，一般来说都是256的整次幂。

练习
- div#a.b .c[id=x] 0 1 3 1
- #a:not(#b) 0 2 0 0
- *.a 0 0 1 1
- div.a 0 0 1 1

行内样式权重是 1 0 0 0
id选择器权重是 0 1 0 0 
class选择器和属性选择器以及伪类权重是 0 0 1 0
标签选择器和伪元素选择器权重是 0 0 0 1
:not()本身不计算权重，但写在它里面的选择器要计算权重

## 伪类

- 链接/行为
    - :any-link
    - :link :visited
    - :hover
    - :active
    - :focus
    - :target

- 树结构
    - :empty
    - :nth-child()
    - :nth-last-child()
    - :first-child :last-child :only-child

- 逻辑型
    - :not伪类
    - :where :has （level 4）

## 伪元素
- ::before
- ::after
- ::first-line（选中第一行）
- ::first-letter（选中第一个字母）

后两者不是添加一个不存在的元素，而是用一个不存在的元素把一部分文本括了起来，让我们可以进行一些处理。

思考

作业：编写一个match函数

```
function match(selector, element) {

    return true;
}


match("div #id.class", document.getElementById("id"));
```




