let http = require('http')

// 引入文件系统的包
let fs = require('fs')

let request = http.request({
    hostname: '127.0.0.1',
    port: 8082,
    method: 'POST',
    headers: {
        'Content-Type': 'application/octet-stream'
    }
}, response => {
    console.log(response)
})


let file = fs.createReadStream('./package.json')

file.on('data', chunk => {
    console.log(chunk.toString())
    request.write(chunk)
})

file.on('end', chunk => {
    console.log('read finished')
    request.end(chunk)
})
