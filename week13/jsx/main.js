function createElement (type, attributes, ...children) {
    let element
    if (typeof type === 'string') {// 原生dom节点
        // element = document.createElement(type)
        element = new ElementWraper(type)
    } else {
        element = new type
    }
    // element是个对象，用for in遍历它的属性
    for (let name in attributes) {
         element.setAttribute(name, attributes[name])
    }
    // children是一个数组，用for of遍历
    for (let child of children) {
        if (typeof child === 'string') {
            // child = document.createTextNode(child)
            child = new TextWraper(child)
        }
        console.log(child)
        element.appendChild(child)
    }
    // 最后返回dom节点
    return element
}

// 普通的element是没有mountTo方法的，要加一个wraper
// ElementWraper把一个普通div也转换成带有mountTo方法的div
class ElementWraper {
    constructor (type) {
        this.root = document.createElement('div')
    }
    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild (child) {
        // this.root.appendChild(child)
        // appendChild都要改成mountTo，因为我们都用了wraper
        child.mountTo(this.root)
    }
    mountTo (parent) {
        parent.appendChild(this.root)
    }
}

class TextWraper {
    constructor (content) {
        this.root = document.createTextNode(content)
    }
    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild (child) {
        // this.root.appendChild(child)
        // appendChild都要改成mountTo，因为我们都用了wraper
        child.mountTo(this.root)
    }
    mountTo (parent) {
        parent.appendChild(this.root)
    }
}

class Div {
    constructor () {
        this.root = document.createElement('div')
    }
    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild (child) {
       //  this.root.appendChild(child)
       child.mountTo(this.root)
    }
    mountTo (parent) {
        parent.appendChild(this.root)
    }
}

let a = <Div id="a">
        <span>a</span>
        <span>b</span>
        <span>c</span>
    </Div>
// 要保证html里有body标签
// document.body.appendChild(a)
a.mountTo(document.body)