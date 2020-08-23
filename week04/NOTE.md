# 排版

## 第一步 根据浏览器属性进行排版

### 三代排版技术

第一代：正常流，包含position，display，float等
第二代：flex，
第三代：grid


### 描述

主轴（Main Axis）
交叉轴（Cross Axis）

如果flex-direction是row，那么主轴相关属性有width，x，left，right。相关轴属性有height，y，top，bottom

如果flex-direction是column，那么主轴相关属性有height，y，top，bottom。相关轴属性有width，x，left，right

## 第二步 收集元素进行

- 分行 
    - 根据主轴尺寸，把元素进行分行
    - 若设置了no-wrap，则强行分配到第一行

## 第三步 计算主轴

- 计算主轴方向
    - 找出所有flex元素
    - 把主轴方向的剩余尺寸按比例分配给这些元素
    - 若剩余空间位负数，所有flex元素为0，等比压缩剩余元素

## 第四步 计算交叉轴

- 计算交叉轴方向
    - 根据每一行中最大元素尺寸计算行高
    - 根据行高flex-align和item-align，确定元素具体位置



# 绘制

## 第一步 绘制单个元素

- 绘制需要依赖一个图形环境
- 我们这里采用了npm包images
- 绘制在一个viewport上进行
- 与绘制相关的属性：background-color、border、background-image等


## 第二步 绘制DOM树

- 递归调用子元素的绘制方法完成DOM树的绘制
- 忽略一些不需要绘制的节点
- 实际浏览器中，文字绘制是难点，需要依赖字体库，我们这里忽略
- 实际浏览器中，还会对一些图层做compositing，我们这里也忽略了
