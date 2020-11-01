import {Component, createElement}from './framework'

class Carousel extends Component {
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
                    // 利用取余运算处理循环的小技巧
                    pos = (pos + children.length) % children.length
                    children[pos].style.transition = 'none'
                    children[pos].style.transform = `translateX(${- pos * 500 + offset * 500 + x % 500}px)`
                }

                for (let child of children) {
                    // 挪动的时候关掉transition
                    child.style.transition = 'none'
                    child.style.transform = `translateX(${- position * 500 + x}px)`
                }
                // 推荐使用event.clientX 和 clientY, 它表示相对浏览器中间的可渲染区域的坐标。这个坐标胜在不受任何因素的影响。
                // 比如说整个组件是在一个滚动的容器里，容器滚动之后，会不会坐标就变了，非常有可能，甚至因为一些定时任务滚动，这时候就会出现一些不可调和的bug.
            }
            let up = event => {
                let x = event.clientX - startX
                position = position - Math.round(x / 500)

                for (let offset of [0, Math.sign(Math.round(x / 500) - x + 250 * Math.sign(x))]) {
                    let pos = position + offset
                    // 利用取余运算处理循环的小技巧
                    pos = (pos + children.length) % children.length
                    children[pos].style.transition = ''
                    children[pos].style.transform = `translateX(${- pos * 500 + offset * 500}px)`
                }

                // for (let child of children) {
                //     // 松开恢复transition
                //     child.style.transition = ''
                //     child.style.transform = `translateX(${- position * 500 + x}px)`
                // }
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
        //     next.style.transform = `translateX(-${100 - nextIndex * 100}%)`

        //     setTimeout(() => {
        //         next.style.transition = '' // 置为空style上就失效了，之前在css设置的又生效了
        //         current.style.transform = `translateX(${-100 - currentIndex * 100}%)`
        //         next.style.transform = `translateX(${-nextIndex * 100}%)`

        //         currentIndex = nextIndex
        //     }, 16); //16ms正好是浏览器里一帧的时间

        //     // for (let child of children) {
        //     //     child.style.transform = `translateX(-${current * 100}%)`
        //     // }
        // }, 3000);
        return this.root
    }
    mountTo (parent) {
        parent.appendChild(this.render())
    }
}

let d = [
    'https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg',
    'https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg',
    'https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg',
    'https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg'
]

let a = <Carousel src={d}/>

// 要保证html里有body标签
// document.body.appendChild(a)
a.mountTo(document.body)