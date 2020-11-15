// document.documentElements是一定能够取到的容器的元素，它就代表html元素
let element = document.documentElement
let isListeningMouse = false

element.addEventListener('mousedown', event => {
    // event.button左键0，右键2，中键1
    console.log('event.button--->', event.button)

    let context = Object.create(null)
    contexts.set('mouse' + (1 << event.button), context)
    console.log('start', 1 << event.button)
    start(event, context)

    let mousemove = event => {
        let button = 1
        console.log('event.buttons====>', event.buttons)
        while (button <= event.buttons) {
            if (button & event.buttons) {
                // order of buttons & button property is not same
                let key
                if (button === 2) {
                    key = 4
                } else if (button === 4) {
                    key = 2
                } else {
                    key = button
                }
                let context = contexts.get('mouse' + key)
                move(event, context)
            }
            button = button << 1
        }        
    }

    let mouseup = event => {
        console.log('end++++', event.buttons)
        let context = contexts.get('mouse' + (1 << event.button))
        end(event, context)
        contexts.delete('mouse' + (1 << event.button))

        if (event.buttons === 0) {
            document.removeEventListener('mousemove', mousemove)
            document.removeEventListener('mouseup', mouseup)
            isListeningMouse = false
        }
    }

    if (!isListeningMouse) {
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
        isListeningMouse = true
    }
})

let contexts = new Map()

element.addEventListener('touchstart', event => {
    for (let touch of event.changedTouches) {
        let context = Object.create(null)
        contexts.set(touch.identifier, context)
        start(touch, context)
    }
})

element.addEventListener('touchmove', event => {
    for (let touch of event.changedTouches) {
        let context = contexts.get(touch.identifier)
        move(touch, context)
    }
})

element.addEventListener('touchend', event => {
    for (let touch of event.changedTouches) {
        let context = contexts.get(touch.identifier)
        end(touch, context)
        contexts.delete(touch.identifier)
    }
})

element.addEventListener('touchcancel', event => {
    for (let touch of event.changedTouches) {
        let context = contexts.get(touch.identifier)
        cancel(touch, context)
        contexts.delete(touch.identifier)
    }
})

// let handler
// let startX, startY
// let isPan = false, isTap = true, isPress = false

let start = (point, context) => {
    // console.log('start', point.clientX, point.clientY)
    context.startX = point.clientX, context.startY = point.clientY
    context.points = [{
        t: Date.now(),
        x: point.clientX,
        y: point.clientY
    }]

    context.isTap = true
    context.isPan = false
    context.isPress = false
    
    context.handler = setTimeout(() => {
        context.isTap = false
        context.isPan = false
        context.isPress = true
        context.handler = null
        console.log('press')
    }, 500)
}

let move = (point, context) => {
    // console.log('move', point.clientX, point.clientY)
    let dx = point.clientX - context.startX, dy = point.clientY - context.startY
    if (!context.isPan && dx ** 2 + dy ** 2 > 100) {
        context.isTap = false
        context.isPan = true
        context.isPress = false
        console.log('panstart')
        clearTimeout(context.handler)
    }

    if (context.isPan) {
        // console.log(dx, dy)
        console.log('pan')
    }

    context.points.filter(point => Date.now() - point.t < 500) // 只存取半秒内的速度

    context.points.push({
        t: Date.now(),
        x: point.clientY,
        y: point.clientY
    })
}

let end = (point, context) => {
    console.log('end', point.clientX, point.clientY)
    if (context.isTap) {
        console.log('tap')
        dispatch('tap', {})
        clearTimeout(context.handler)
    }
    if (context.isPan) {
        console.log('panend')
    }
    if (context.isPress) {
        console.log('pressend')
    }

    context.points = context.points.filter(point => Date.now() - point.t < 500) // 只存取半秒内的速度

    let d,v
    if (!context.points.length) {
        v = 0
    } else {
        d = Math.sqrt((point.clientY - context.points[0].x) ** 2 + 
            (point.clientY - context.points[0].y) ** 2)
        v = d / (Date.now() -  context.points[0].t)
    }

    if (v > 1.5) {
        console.log('flick')
        context.isFlick = true
    } else {
        context.isFlick = false
    }
    console.log('vvv', v)
}

let cancel = (point, context) => {
    clearTimeout(context.handler)
    console.log('cancel', point.clientX, point.clientY)
}

function dispatch (type, properties) {
    let event = new Event(type)
    for (let name in properties) {
        event[name] = properties[name]
    }
    element.dispatchEvent(event)
}