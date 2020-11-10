# 手势与动画｜初步建立动画和时间线

轮播做了两个功能，自动播放和拖拽。但是这两个功能目前集成不到一起。因为在自动播放过程中，如果想要做手势，是需要把动画停在这的。另外还有很多细节问题，比如说我们鼠标的拖拽，并不支持移动端的touch事件，只支持mouse系列事件，这个都是在网页研发过程中必须去面对的问题。

这一节解决的就是动画与手势，看一看我们如何去抽象这些开发组件所需要的底层能力。

首先做一个动画，在做动画之前，先把carousel独立成一个文件。
接下来实现动画，实现动画最基本的要有一个`帧`的概念，我们一个最基础的动画的能力，就是每帧我们去执行一个什么样的事件。
JavaScript里几种处理帧的方案：
- 1. setInterval
```
setInterval(() => {}, 16)
```
一般做动画呢，它是有一个16ms的常识的，因为我们一秒是1000毫秒，然后人眼能够识别的动画的最高帧率就是60帧，基本上所有的软件都会对齐到60帧，所以我们会用16毫秒。

- 2. setTimeout
```
setTimeout(() => {}, 16)
```
也是16ms，但是我们是需要一个函数名的，因为setTimeout它只执行一次，所以说我们一般用一个tick。
``` 
let tick () => {
    setTimeout(tick, 16)
}
```
- 3. requestAnimationFrame
现代浏览器支持requestAnimationFrame，有的时候叫rAF，它的含义是，我申请在浏览器执行下一帧的时候，来执行这个代码。它是跟浏览器的帧率是相关的。如果我们对浏览器做一些降帧降频的操作，它可能就会跟着降帧。
``` 
let tick () => {
    let handler = requestAnimationFrame(tick)
    cancelAnimationFrame(handler)
}
```
一般来说最常见的是这三种方案，如果是比较现代的浏览器环境，比较推荐用tick。因为setInterval比较不可控，浏览器到底会不会按照setInterval 16毫秒去执行，这个不好说，再有一旦tick写的不好，setInterval它能够发生这种积压，因为它固定16毫秒16毫秒地去执行，所以它interval之间，它不管你有没有执行完，可能就给放到interval队列里了，这个取决于浏览器的底层实现，每个浏览器可能会选择不同的策略。但无论如何，如果我们选择了执行完了之后再去setTimeout，或者是requestAnimationFrame，是一个相对来说比较安全的做法。所以我们就会用requestAnimationFrame来做这种自重复的时间线的操作。与requestAnimationFrame对应的有一个cancelAnimationFrame。它可以把requestAnimationFrame返回的handler给cancel掉，避免一些资源的浪费。

我们做动画，会把执行自身的tick，包装成一个概念，叫做timeline。一般来说timeline会有一个start，但不会有end，会有pause和resume，暂停和恢复。然后就是rate，播放的速率。这个不是所有的时间线都会提供。因为播放的速率会有一个倍数，可以让动画快进，慢放。然后有可能还有一个非常重要的概念，叫做reset，就是重启，把它变成一个干净的时间线，这样我们可以去复用一些时间线，并且能够保证在reset的时候把整个的时间线去清除。在课程中rate就不做了，这是一个比较高级的时间线的功能。

start里会有一个启动tick的过程，我们会选择把tick藏起来，变成一个私有的方法，否则谁都能调，可能会破坏掉我们整个Timeline类的状态，所以我们把tick写在这里。


接下来尝试给tick加一个animation，并且给它执行。我们做的这种动画成为属性动画，我们是把对象的某一个属性，从一个值，变成另外一个值。与属性动画相对应的还有帧动画，就是每秒来一张图片，比如迪士尼那些动画都属于帧动画，它一般都不是通过属性来做的。我们在浏览器里做的，大部分程序员写的都是属性动画。所以它都有一个起始值和终止值。

## 设计时间线的更新
我们可以把animation的delay放到timeline里，就是说我们在add animation的时候，我们给它添加一个delay。还有一个就是说，animation在add的时候，可能存在时间线已经开始执行了，我们再给它add的问题，而这个时候呢，其实startTime跟t0不一定一致。这两个因素都可以考虑进去。如果说addTime本身是在startTime之前的话，我们就可以认为t和t0之间是一个0的关系，它俩是相等的关系。如果我们是在动画开始了以后再添加的animation，那么我们就可以给它一个初始的开始时间。 
这样我们就可以动态地向一个Timeline去添加animation了，这样我们的timeline不需要频繁地给它开启或者重置了。

## pause能力
如果要暂停，首先要把tick给cancel掉。首先要把requestAnimationFrame(this[TICK])存起来。
```
this[TICKHANDLER] = requestAnimationFrame(this[TICK])
```

javascript一个比较厉害的点是可以pause和resume，css的话pause是可以的，但是resume就不容易了。