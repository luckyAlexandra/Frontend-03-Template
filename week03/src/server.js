const http = require('http')

http.createServer((request, response) => {
    let body = []
    request.on('error', err => {
        console.error(err)
    }).on('data', chunk => {
        // 将数据暂存到body数组里
        body.push(chunk)
    }).on('end', () => {
        body = Buffer.concat(body).toString()
        console.log('body:', body)
        response.writeHead(200, {'Content-Type': 'text/html'})
        response.end(
`<html maaa=a >
<head>
    <style>
        body div #myid {
            width: 100px;
            background-color: #ff7300;
        }   
        body div img {
            width: 30px;
            background-color: #f1f1f1;
        }
    </style>
</head>
<body>
    <div>
        <img id="myid" />
        <img />
    </div>
</body>
</html>`)
    })
}).listen(8088)

console.log('server started')