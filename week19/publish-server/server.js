let http = require('http')
let https = require('https')
let unzipper = require('unzipper')
let querystring = require('querystring')
// let fs = require('fs')

// 2. auth路由：接收code，用code+client_id+client_secret换token
function auth (request, response) {
    let query = querystring.parse(request.url.match(/^\/auth\?([\s\S]+)$/)[1])
    getToken(query.code, function (info) {
        console.log(info)
        // response.write(JSON.stringify(info))
        response.write(`<a href='http://localhost:8083/?token=${info.access_token}'>publish</a>`)
        response.end()
    })
}

function getToken (code, callback) {
    let request = https.request({
        hostname: 'github.com',
        path: `/login/oauth/access_token?code=${code}&client_id=Iv1.509dbf8bb5da1040&client_secret=9674d0c393fad46f34a9522b3b6cb68af770f923`,
        port: 443,
        method: 'POST'
    }, function (response) {
        let body = ''
        response.on('data', chunk => {
            body += chunk.toString()
        })
        response.on('end', () => {
            callback(querystring.parse(body))
        })
    })
    request.end()
}

// 4. publish路由：用token获取用户信息，检查权限，接受发布
function publish (request, response) {
    let query = querystring.parse(request.url.match(/^\/publish\?([\s\S]+)$/)[1])
    getUser(query.token, info => {
        if (info.login === 'luckyAlexandra') { // 这里正常情况下是要接一个权限系统的
            request.pipe(unzipper.Extract({path: '../server/public/'}))
            request.on('end', function () {
                response.end('success')
            })
        }
    })
}

function getUser (token, callback) {
    let request = https.request({
        hostname: 'api.github.com',
        path: `/user`,
        port: 443,
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'alex-toy-publish'
        }
    }, function (response) {
        let body = ''
        response.on('data', chunk => {
            body += chunk.toString()
        })
        response.on('end', () => {
            callback(JSON.parse(body))
        })
    })
    request.end()
}



http.createServer(function (request, response) {
    if (request.url.match(/^\/auth\?/)) {
        return auth(request, response)
    }
    if (request.url.match(/^\/publish\?/)) {
        return publish(request, response)
    }
}).listen(8082)
