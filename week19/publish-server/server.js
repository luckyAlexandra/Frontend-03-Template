let http = require('http')

let fs = require('fs')

http.createServer(function (request, response) {
    console.log(request.headers)

    let outFile = fs.createWriteStream('../server/public/index.html')

    request.on('data', chunk => {
        // console.log(chunk.toString())
        outFile.write(chunk)
    })
    request.on('end', () => {
        outFile.end()
        response.end('Success')
    })
    // res.end('hello world')
}).listen(8082)
