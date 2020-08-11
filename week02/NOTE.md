## 浏览器工作原理
URL -> HTTP -> HTML -> parse -> Dom -> css computing -> DOM with css -> layout -> DOM with position -> render -> Bitmap

只有Bitmap最后传给显卡驱动设备，才能转换成人眼可识别的光信号。所以浏览器的所有目标，就是从一个URLURL，最后得到一张Bitmap，这个过程是一个浏览器基础的渲染过程。咱们的ToyBrowser就只是实现这种基础的渲染流程。

## 有限状态机
- 每一个状态都是一个机器
    - 在每一个机器里，我们可以做计算、存储、输出...
    - 所有的这些机器接受的输入是一致的
    - 状态机的每一个机器本身没有状态，如果我们用函数来表示的化，它应该是纯函数（无副作用）

- 每一个机器都知道下一个状态
    - 每个机器都有确定的下一个状态（Moore）
    - 每个机器根据输入决定下一个状态（Mealy）
    
## 第一步 HTTP请求总结

- 设计一个http请求的类
- contentType是一个必要的字段，要有默认值
- body是KV格式
- 不同的contentType影响body的格式

## 第二步 send函数总结
- 在Request构造器中收集必要的信息
- 设计一个send函数，把请求真实发送到服务器
- send函数应该是异步的，所以返回promise

## 第三步 发送请求

- 设计支持已有的connection或者自己新建connection
- 收到数据传给parser
- 根据parser的状态去resolve promise

## 第四步 responseParser总结

- Response必须分段构造，所以我们要用一个responseParser来装配
- ResponseParser分段处理ResponseText，我们用状态机来分析文本的结构


## 第五步 bodyParser总结

- Response的body可能根据Content-Type有不同的结构，因此我们会采用**子Parser**的结构来解决问题
- 以TrunkedBodyParser为例，我们同样用状态机来处理body的格式（不是所有的BodyParser都是TrunkedBodyParser，实际上BodyParser数量还是蛮多的）
