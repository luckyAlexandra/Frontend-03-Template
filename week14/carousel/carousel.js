import {Component}from './framework'

export class Carousel extends Component {
    constructor () {
        super()
        // 将attributes存起来
        this.attributes = Object.create(null)
    }
    // 将setAttribute重写
    setAttribute (name, value) {
        this.attributes[name] = value
    }
    render () {
        this.root = document.createElement('div')
        this.root.classList.add('carousel')
        for (let record of this.attributes.src) {
            // img有个问题，它默认是可拖拽的
            // let child = document.createElement('img')
            let child = document.createElement('div')
            child.style.backgroundImage = `url('${record}')`
            this.root.appendChild(child)
        }

        let position = 0

        this.root.addEventListener('mousedown', event => {
            let children = this.root.children
            let startX = event.clientX

            let move = event => {
                let x = event.clientX - startX
                let current = position - ((x - x % 500) / 500)
                
                for (let offset of [-1, 0, 1]) {
                    let pos = current + offset
                    pos = (pos + children.length) % children.length // 利用取余运算处理循环的小技巧
                    children[pos].style.transition = 'none'
                    children[pos].style.transform = `translateX(${- pos * 500 + offset * 500 + x % 500}px)`
                }
            }
            let up = event => {
                let x = event.clientX - startX
                position = position - Math.round(x / 500)
                for (let offset of [0, - Math.sign(Math.round(x / 500) - x + 250 * Math.sign(x))]) {
                    let pos = position + offset
                    pos = (pos + children.length) % children.length // 利用取余运算处理循环的小技巧
                    children[pos].style.transition = ''
                    children[pos].style.transform = `translateX(${- pos * 500 + offset * 500}px)`
                }
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)
            }
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        })



        // let currentIndex = 0
        // setInterval(() => {
        //     let children = this.root.children
        //     let nextIndex = (currentIndex + 1) % children.length // 取余
            
        //     let current = children[currentIndex]
        //     let next = children[nextIndex]

        //     next.style.transition = 'none' 
        //     next.style.transform = `translateX(${100 - nextIndex * 100}%)`

        //     setTimeout(() => {
        //         next.style.transition = '' // 置为空style上就失效了，之前在css设置的又生效了
        //         current.style.transform = `translateX(${-100 - currentIndex * 100}%)`
        //         next.style.transform = `translateX(${-nextIndex * 100}%)`

        //         currentIndex = nextIndex
        //     }, 16); //16ms正好是浏览器里一帧的时间
        // }, 3000);
        return this.root
    }
    mountTo (parent) {
        parent.appendChild(this.render())
    }
}