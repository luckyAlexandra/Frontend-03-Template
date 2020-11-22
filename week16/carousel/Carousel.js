import {Component, STATE, ATTRIBUTE}from './framework'
import {enableGesture} from './gesture.js'
import {Timeline, Animation} from './animation.js'
import {ease} from './ease.js'

// export from相当于import再去export
export {STATE, ATTRIBUTE} from './framework.js'

export class Carousel extends Component {
    constructor () {
        super()
    }
    render () {
        this.root = document.createElement('div')
        this.root.classList.add('carousel')
        for (let record of this[ATTRIBUTE].src) {
            // img有个问题，它默认是可拖拽的
            // let child = document.createElement('img')
            let child = document.createElement('div')
            child.style.backgroundImage = `url('${record.img}')`
            this.root.appendChild(child)
        }
        enableGesture(this.root)

        let timeline = new Timeline()
        timeline.start()

        let handler = null

        let children = this.root.children

        this[STATE].position = 0

        let t = 0
        let ax = 0 // 动画造成的x的位移

        this.root.addEventListener('start', event => {
            timeline.pause();
            clearInterval(handler);
            // 计算动画播放的progress
            let progress = (Date.now() - t) / 1500
            ax = ease(progress) * 500 - 500
        })

        this.root.addEventListener('tap', event => {
            this.triggerEvent('click', {
                data: this[ATTRIBUTE].src[this[STATE].position],
                position: this[STATE].position
            })
        })

        this.root.addEventListener('pan', event => {
            let x = event.clientX - event.startX - ax
            let current = this[STATE].position - ((x - x % 500) / 500)
            for (let offset of [-1, 0, 1]) {
                let pos = current + offset
                pos = (pos % children.length + children.length) % children.length // 利用取余运算处理循环的小技巧
                children[pos].style.transition = 'none'
                children[pos].style.transform = `translateX(${- pos * 500 + offset * 500 + x % 500}px)`
            }
        })

        this.root.addEventListener('end', event => {
            // 把时间线重新打开
            timeline.reset()
            timeline.start()
            handler = setInterval(nextPicture, 3000)

            let x = event.clientX - event.startX - ax
            let current = this[STATE].position - ((x - x % 500) / 500)

            let direction = Math.round((x % 500) / 500) // -1,0,1

            if (event.isFlick) {
                if (event.velocity < 0) {
                    direction = Math.ceil((x % 500) / 500)
                } else {
                    direction = Math.floor((x % 500) / 500)
                }
            }

            for (let offset of [-1, 0, 1]) {
                let pos = current + offset
                pos = (pos % children.length + children.length) % children.length // 利用取余运算处理循环的小技巧
                
                children[pos].style.transition = 'none'
                timeline.add(new Animation(
                    children[pos].style, 
                    'transform', 
                    - pos * 500 + offset * 500 + x % 500,
                    - pos * 500 + offset * 500 + direction * 500,
                    1500, 
                    0,  
                    ease, 
                    v => `translateX(${v}px)`
                ))
            }

            this[STATE].position = this[STATE].position - ((x - x % 500) / 500) - direction
            this[STATE].position = (this[STATE].position % children.length + children.length) % children.length // 利用取余运算处理循环的小技巧
        
            this.triggerEvent('Change', {position: this[STATE].position})
        })

        let nextPicture = () => {
            let children = this.root.children
            let nextIndex = (this[STATE].position + 1) % children.length // 取余
            
            let current = children[this[STATE].position]
            let next = children[nextIndex]

            t = Date.now()

            timeline.add(new Animation(
                current.style, 
                'transform', 
                -this[STATE].position * 500,
                -500 - this[STATE].position * 500,
                1500, 
                0, 
                ease, 
                v => `translateX(${v}px)`
            ))
            timeline.add(new Animation(
                next.style, 
                'transform', 
                500 - nextIndex * 500, 
                - nextIndex * 500, 
                1500, 
                0, 
                ease, 
                v => `translateX(${v}px)`
            ))
            this[STATE].position = nextIndex
            this.triggerEvent('Change', {position: this[STATE].position})
        }

        handler = setInterval(nextPicture, 3000);
        return this.root
    }
}