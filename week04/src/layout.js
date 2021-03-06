// 对style进行一些预处理
function getStyle (element) {
    if (!element.style) {
        element.style = {}
    }

    for (let prop in element.computedStyle) {
        // var p = element.computedStyle.value
        element.style[prop] = element.computedStyle[prop].value

        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop])
        }
        if (element.style[prop].toString().match(/^[0-9\.]+$/)) { // 数字也要转，因为写出来的是字符串格式的数字
            element.style[prop] = parseInt(element.style[prop])
        }
    }
    return element.style
}

function layout (element) {
    // 没有computedStyle的元素，跳过去
    if (!element.computedStyle) {
        return
    }

    let elementStyle = getStyle(element)

    // 只能处理flex布局
    if (elementStyle.display !== 'flex') {
        return
    }

    // 过滤出element节点，去掉文本节点
    var items = element.children.filter(e => e.type === 'element')


    items.sort(function (a, b) {
        return (a.order || 0) - (b.order || 0)
    })

    // 主轴和交叉轴的处理
    var style = elementStyle
    ['width', 'height'].forEach(size => {
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null
        } 
    })

    if (!style.flexDirection || style.flexDirection === 'auto') {
        style.flexDirection = 'row'
    }
    if (!style.alignItems || style.alignItems === 'auto') {
        style.alignItems = 'stretch'
    }
    if (!style.justifyContent || style.justifyContent === 'auto') {
        style.justifyContent = 'flex-start'
    }
    if (!style.flexWrap || style.flexWrap === 'auto') {
        style.flexWrap = 'nowrap'
    }
    if (!style.alignContent || style.alignContent === 'auto') {
        style.alignItems = 'stretch'
    }

    var mainSize, mainStart, mainEnd, mainSign, mainBase, 
        crossSize, crossStart, crossEnd, crossSign, crossBase

    if (style.flexDirection === 'row') {
        mainSize = 'width' // 主轴尺寸
        mainStart = 'left'
        mainEnd = 'right'
        mainSign = +1 // 强调是正1
        mainBase = 0

        crossSize = 'height'
        crossStart = 'top'
        crossEnd = 'bottom'
    }

    if (style.flexDirection === 'row-reverse') {
        mainSize = 'width'
        mainStart = 'right'
        mainEnd = 'left'
        mainSign = -1
        mainBase = style.width

        crossSize = 'height'
        crossStart = 'top'
        crossEnd = 'bottom'
    }

    if (style.flexDirection === 'column') {
        mainSize = 'height'
        mainStart = 'top'
        mainEnd = 'bottom'
        mainSize = +1
        mainBase = 0

        crossSize = 'width'
        crossStart = 'left'
        crossEnd = 'right'
    }

    if (style.flexDirection === 'column-reverse') {
        mainSize = 'height'
        mainStart = 'bottom'
        mainEnd = 'top'
        mainSize = -1
        mainBase = style.height

        crossSize = 'width'
        crossStart = 'left'
        crossEnd = 'right'
    }

    // 交叉轴只受wrap-reverse的影响
    if (style.flexWrap === 'wrap-reverse') {
        // 反向换行，将交叉轴的开始和结束互换
        var tmp = crossStart 
        crossStart = crossEnd
        crossEnd = tmp
        crossSign = -1
    } else {
        crossBase = 0
        crossSign = +1
    }

    // 处理auto sizing
    var isAutoMainSize = false
    if (!style[mainSize]) { // auto sizing 父元素被子元素撑开，所有元素排进同一行
        elementStyle[mainSize] = 0
        for (var i = 0; i < items.length; i++) {
            var item = items[i]
            var itemStyle = getStyle(item)
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== void(0)) {
                // todo ??
                elementStyle[mainSize] += itemStyle[mainSize]
            }
        }
        isAutoMainSize = true
    }

    // 收集元素进行
    var flexLine = []
    var flexLines = [flexLine]

    var mainSpace = elementStyle[mainSize]
    var crossSpace = 0

    for (var i = 0; i < items.length; i++) {
        var item = items[i]
        var itemStyle = getStyle(item)

        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0
        }
        if (itemStyle.flex) {
            flexLine.push(item)
        } else if (style.flexWrap === 'nowrap' && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize]
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== void(0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize])
            }
            flexLine.push(item)
        } else {
            // 压缩超大元素
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize]
            }
            // 换行
            if (mainSpace < itemStyle[mainSize]) {
                // 存储
                flexLine.mainSpace = mainSpace
                flexLine.crossSpace = crossSpace

                // 创建一个新的flexLine
                flexLine = [item]
                flexLines.push(flexLines)

                //重置mainSpace和crossSpace
                mainSpace = style[isAutoMainSize]
                crossSpace = 0
            } else {
                flexLine.push(item)
            }

            if (itemStyle[crossSize] !== null || itemStyle[crossSize] !== void(0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize])
            }
            mainSpace -= itemStyle[mainSize]
        }
    }

    // 最后一行
    flexLine.mainSpace = mainSpace

    if (style.flexWrap === 'nowrap' || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace
    } else {
        flexLine.crossSpace = crossSpace
    }

    if (mainSpace < 0) {
        // overflow (happens only if container is single line), scale every item
        var scale = style[mainSize] / (style[mainSize] - mainSpace)
        var currentMain = mainBase
        for (var i = 0; i < items.length; i++) {
            var item = items[i]
            var itemStyle = getStyle(item)

            // flex没有权利参加等比压缩，直接将尺寸设置为0
            if (itemStyle.flex) {
                itemStyle[mainSize] = 0
            }

            itemStyle[mainSize] = itemStyle[mainSize] * scale

            itemStyle[mainStart] = currentMain
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
            currentMain = itemStyle[mainEnd]
        }
    } else {
        // process each flex line
        flexLines.forEach(function (items) {
            var mainSpace = items.mainSpace
            var flexTotal = 0
            for (var i = 0; i < items.length; i++) {
                var item = items[i]
                var itemStyle = getStyle(item)
                
                if (itemStyle.flex !== null && itemStyle.flex !== void(0)) {
                    flexTotal += itemStyle.flex
                    continue
                }
            }

            if (flexTotal > 0) {
                // there is flexiable flex items
                var currentMain = mainBase
                for (var i = 0; i < items.length; i++) {
                    var item = items[i]
                    var itemStyle = getStyle(item)

                    if (itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex
                    }
                    itemStyle[mainStart] = currentMain
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
                    currentMain = itemStyle[mainEnd]
                }
            } else {// there is *NO* flexiable flex items，which means, justifyContent should work
                if (style.justifyContent === 'flex-start') {
                    var currentMain = mainBase
                    var step = 0
                }
                if (style.justifyContent === 'flex-end') {
                    var currentMain = mainSpace * mainSign + mainBase
                    var step = 0
                } 
                if (style.justifyContent === 'center') {
                    var currentMain = mainSpace / 2 * mainSign + mainBase
                    var step = 0
                }
                if (style.justifyContent === 'space-between') {
                    var step = mainSpace / (items.length - 1) * mainSign
                    var currentMain = mainBase
                }
                if (style.justifyContent === 'space-around') {
                    var step = mainSpace / items.length * mainSign
                    var currentMain = step / 2 + mainBase
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i]
                    var itemStyle = getStyle(item)
                    itemStyle[mainStart] = currentMain
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
                    currentMain = itemStyle[mainEnd] + step
                }

            }
        })
    }

    // compute the cross axis sizes
    // align-items, align-self

    var crossSpace

    if (!style[crossSize]) {// auto sizing
        crossSpace = 0
        elementStyle[crossSize] = 0
        for (var i = 0; i < flexLines.length; i++) {
            elementStyle[crossSize] = elementStyle[crossSize] + flexLine[i].crossSpace
        }
    } else {
        crossSpace = style[crossSize]
        for (var i = 0;i < flexLines.length; i++) {
            crossSpace -= flexLines[i].crossSpace
        }
    }

    if (style.flexWrap === 'wrap-reverse') {
        crossBase = style[crossSize]
    } else {
        crossBase = 0
    }

    var lineSize = style[crossSize] / flexLines.length

    var step
    // 根据alignContent属性，来校正crossBase
    if (style.alignContent === 'flext-start') {
        crossBase += 0
        step = 0
    }
    if (style.alignContent === 'flex-end') {
        crossBase += crossSign * crossSpace
        step = 0
    }
    if (style.alignContent === 'center') {
        crossBase += crossSign * crossSpace / 2
        step = 0
    }
    if (style.alignContent === 'space-between') {
        crossBase += 0
        step = crossSpace / (flexLines.length - 1)
    }
    if (style.alignContent === 'space-around') {
        step = crossSpace / flexLines.length
        crossBase += crossSign * step / 2
    }
    if (style.alignContent === 'stretch') {
        crossBase += 0
        step = 0
    }

    flexLines.forEach(function (items) {
        var lineCrossSize = style.alignContent === 'stretch' ? 
            item.crossSpace + crossSpace / flexLines.length :
            item.crossSpace
        
        for (var i = 0; i < items.length; i++) {
            var item = items[i]
            var itemStyle = getStyle(item)

            // 既受每个元素的alignSelf的影响，又受父元素的alignItems，并且alignSelf的影响是优先的
            var align = itemStyle.alignSelf || style.alignItems

            if (item === null) {
                itemStyle[crossSize] = (align === 'stretch') ? lineCrossSize : 0
            }

            if (align === 'flex-start') {
                itemStyle[crossStart]  = crossBase
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize]
            }

            if (align === 'flex-end') {
                itemStyle[crossEnd] = crossBase + crossSign * lineSize
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize]
            }

            if (align === 'center') {
                itemStyle[crossStart] = crossBase + crossSize * (lineCrossSize - itemStyle[crossSize]) / 2
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize]
            }

            if (align === 'stretch') {
                itemStyle[crossStart] = crossBase
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null) && itemStyle[crossSize])

                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart])
            }
        }
        crossBase += crossSign * (lineCrossSize + step)
    })
    console.log(items)
}

module.exports = layout