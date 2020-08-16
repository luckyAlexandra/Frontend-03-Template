const net = require('net')
const parser = require('./parser.js')

class Request {
    constructor (options) {
        // 在constructor里把options对象存起来，也就是属性的拷贝
        this.method = options.method || 'GET'
        this.host = options.host
        this.port = options.port || 80
        this.path = options.path || '/'
        this.body = options.body || {}
        this.headers = options.headers || {}

        if (!this.headers['Content-Type']) {
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        }

        if (this.headers['Content-Type'] === 'application/json') {
            this.bodyText = JSON.stringify(this.body)
        } else if (this.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&')
        }

        this.headers['Content-Length'] = this.bodyText.length
    }

    send (connection) {
        // 返回一个promise对象
        return new Promise((resolve, reject) => {
            // 因为这个过程是会逐步收到信息的，所以我们有必要去设计一个response parser，而不是直接设计一个response类
            // 这样parser可以通过逐步地去接收response的信息，然后来构造response的对象各个不同的部分
            const parser = new ResponseParser
            // 首先检查connection， 如果存在，直接把自己的toString write上去
            if (connection) {
                connection.write(this.toString())
            } else {
                // 如果不存在，创建一个tcp连接
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    connection.write(this.toString())
                })
            } 
            connection.on('data', data => {
                parser.receive(data.toString())
                if (parser.isFinished) {
                    resolve(parser.response)
                    connection.end()
                }
            })
            connection.on('error', err => {
                reject(err)
                connection.end()
            })
        })
    }

//     toString () {
//         return `${this.method} ${this.path} HTTP/1.1\r\n
// ${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}
// \r\n
// ${this.bodyText}`
//     }
    toString() {
        let stream = [
            `${this.method} ${this.path} HTTP/1.1\r\n`,
            ...Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}\r\n`),
            '\r\n',
            `${this.bodyText}\r\n`
        ]
        return stream.join('');
    }
}

// 最重要的第四步，response解析
class ResponseParser {
    constructor () {
        // todo 优化，将状态机常量写法改成函数写法
        // 开始要等一个statusLine状态，statusLine会以一个\r\n去做结束，\r和\n是两个状态。
        // WAITING_STATUS_LINE这个状态，当它接收到一个\r的时候，并不会立刻切到WAITING_HEADER的状态，它会再等一个line end的符号\n，所以会产生两个状态。 
        this.WAITING_STATUS_LINE = 0
        this.WAITING_STATUS_LINE_END = 1

        // 每个header有四个状态
        this.WAITING_HEADER_NAME = 2 // header name的输入状态
        this.WAITING_HEADER_SPACE = 3 // header name的冒号后面等待空格的状态
        this.WAITING_HEADER_VALUE = 4 // header value的状态
        this.WAITING_HEADER_LINE_END = 5 // header line end的状态

        // BLOCK_END状态，因为header后面要再等一个空行
        this.WAITING_HEADER_BLOCK_END = 6

        // body的状态
        this.WAITING_BODY = 7

        this.current = this.WAITING_STATUS_LINE
        this.statusLine = ''
        this.headers = {}
        this.headerName = ''
        this.headerValue = ''
        // bodyParser和head相关，我们没办法在一开始创建responseParser的时候，就直接创建好bodyParser，
        // 而是在head结束的时候，也就是找到WAITING_HEADER_BLOCK_END的时候
        this.bodyParser = null
    }
    get isFinished () {
        return this.bodyParser && this.bodyParser.isFinished
    }
    get response () {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/) 
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }
    receive (string) {
        for (let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i))
        }
    }
    receiveChar (char) {
        if (this.current === this.WAITING_STATUS_LINE) {
            if (char === '\r') {// 等字符\r
                this.current = this.WAITING_STATUS_LINE_END
            } else { 
                this.statusLine += char 
            }
        } else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === '\n') { // 等字符\n
                this.current = this.WAITING_HEADER_NAME
            }
        } else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ':') { //  等字符:
                this.current = this.WAITING_HEADER_SPACE
            } else if (char === '\r') {
                // 如果没等到冒号，只等到\r，说明这行是空行，进入WAITING_HEADER_BLOCK_END状态
                this.current = this.WAITING_HEADER_BLOCK_END
                // 在head结束的状态
                if (this.headers['Transfer-Encoding'] === 'chunked') {
                    // Transfer-Encoding可以有各种不同的值，但是node的默认值就是chunked，所以这里作为toy browser的案例，就用TrunkedBodyParser来演示如何编写一个bodyparser
                    this.bodyParser = new TrunkedBodyParser()
                }
            } else {
                this.headerName += char
            }
        } else if (this.current === this.WAITING_HEADER_SPACE) { // 临时状态
            if (char === ' ') { // 等冒号后边的空格
                this.current = this.WAITING_HEADER_VALUE
            }
        } else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char === '\r') {
                this.current = this.WAITING_HEADER_LINE_END
                // 等到\r以后把暂存的headerName和headerValue写到headers上面
                this.headers[this.headerName] = this.headerValue
                this.headerName = ''
                this.headerValue = ''
            } else {
                this.headerValue += char
            }
        } else if (this.current === this.WAITING_HEADER_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME
            }
        } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
            if (char === '\n') {
                this.current = this.WAITING_BODY
            }
        } else if (this.current === this.WAITING_BODY) {
            // 当找到WAITING_BODY时，就一股脑地把char全都塞给bodyParser去处理
            this.bodyParser.receiveChar(char)
        }
    }
}

// TrunkedBodyParser和responseBodyParser非常相似，所谓chunked body，它的结构是一个长度后面跟着一个chunk的内容，被称为一个chunk，遇到一个长度位0的chunk，那么整个body就结束了。
class TrunkedBodyParser {
    constructor () {
        // 处理长度
        this.WAITING_LENGTH = 0
        this.WAITING_LENGTH_LINE_END = 1

        // 非常规操作，READING_TRUNK，要想退出READING_TRUNK的状态，我们必须要等待这个长度，必须要计算chunk里的长度，所以严格来说这已经不是一个米粒状态机了，但仍然是一个可以跑起来的状态机
        // reading trunk没有办法用一个输入来标志它的结束，因为trunk里可以含有任何的字符，所以我们只能用一个预先读进来的长度来控制这个chunk的大小。
        this.READING_TRUNK = 2

        this.WAITING_NEW_LINE = 3
        this.WAITING_NEW_LINE_END = 4

        this.length = 0
        this.content = []
        this.isFinished = false
        this.current = this.WAITING_LENGTH
    }
    receiveChar (char) {
        if (this.current === this.WAITING_LENGTH) {
            if (char === '\r') {
                if (this.length === 0) {// 遇到了长度位0的chunk，isFinished置为true，来告诉上级的parser已经结束了
                    this.isFinished = true
                }
                this.current = this.WAITING_LENGTH_LINE_END
            } else {// length是十六进制，给原来的值乘以16，把最后的位空出来，再把最后读进来的这位加上去
                this.length *= 16
                this.length += parseInt(char, 16)
            }
        } else if (this.current === this.WAITING_LENGTH_LINE_END) {
            if (char === '\n') {
                this.current = this.READING_TRUNK
            }
        } else if (this.current === this.READING_TRUNK) {
            this.content.push(char)
            this.length--
            if (this.length === 0) {
                this.current = this.WAITING_NEW_LINE
            }
        } else if (this.current === this.WAITING_NEW_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_NEW_LINE_END
            }
        } else if (this.current === this.WAITING_NEW_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_LENGTH
            }
        }
    }
}


void async function () {
    // 传一个config object
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: '8088',
        path: '/',
        headers: {
            ['X-Foo2']: 'customed'
        },
        body: {
            name: 'winter'
        }
    })

    // 请求结束的时候调用send方法，send方法返回一个promise，promise成功以后它会得到一个response对象。
    let response = await request.send()
    // console.log(response)

    // 这里我们把API设计成完整的得到response之后，再把body交给parser去处理
    // 但实际上如果我们写的是一个真正的浏览器，这个地方我们必须得逐段的返回response的body的，然后逐段地去给parser
    // 这里为了比较简洁，我们会采用把body全收回来，然后再交给HTML parser的这样一个操作，但实际上我们应该做成异步分段处理的。
    let dom = parser.parseHTML(response.body)
    

}()
