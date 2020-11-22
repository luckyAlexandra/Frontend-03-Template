有一些逻辑是跟基础库相关的，有一些逻辑是carousel特有的，从复杂性上来讲，animation，gesture，carousel，都有一定的复杂性，当我们做了架构拆分之后，我们分别独立地管理了这三部分的复杂性。
保留position变量，它相当于一个state，因为这里我们没有去设state这个基础设施，所以这里的局部变量充当state也是可以的。强调一下，组件化体系里面，不一定说比如state它就一定要写成什么样的代码形态，它就是客观上有这个东西。你用局部变量也可以，都写在render里，它就是可以用局部变量去做state。

pause之后动画挪的距离没有被计算进拖拽的距离里。

render()里有很多函数级作用域的变量，包括timeline，handler，timeline是用来播放动画的，handler用来播放定时3秒钟一帧的技术，children是保存下来的，position代表当前滚动到的位置，t和ax是我们在不同的事件之间去通讯所使用的一些局部的状态。需要注意的是position，position其实代表了当前组件的一个状态，它不仅对函数内部是有用的，对用户来说其实它也有一定的用处，用户也可能通过代码去强行更改position，在这方面我们就需要把position设计成一种额外的机制，children，handler，timeline我们是不希望外部去用的，而t和ax仅仅适用于手势操作时全局这样的变量。有了这些分类之后，我们就可以去做一些调整，我们为我们的组件添加一个状态的机制。

```
// export from相当于import再去export
export {STATE} from './framework.js'
```

加入children
1. 内容型children
特点：放几个children，实际dom上就会出现几个children
Button
jsx里直接在模版里面写
2. 模版型children
List
jsx里通过在模版里放一个函数去实现