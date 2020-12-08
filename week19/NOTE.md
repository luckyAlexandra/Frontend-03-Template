# 发布系统
我们的发布系统，其实分成了三个子系统，第一个是线上服务系统，它主要是给我们真正的用户提供线上服务用的。第二个就是我们程序员向线上服务系统去发布所用的发布系统，这个发布系统可以跟我们的线上服务系统同级部署，也可以跟线上服务系统是两个独立的集群，这个涉及到一定的服务端的知识，最佳实践各个公司也不太一样。课上提供的是最简单的模型，就是单机同级部署和线上服务器。最后一个子系统就是我们的发布工具，要想跟我们的发布系统相连接，我们肯定要用一个命令行工具，去跟它进行对接。

## 1. 初始化server
为了让发布系统更真实，不能在本机上跑发布系统和线上服务系统，所以我们需要一台独立的服务器来做这件事，有条件可以用真实的服务器，我们这里用虚拟机来代替真实的服务器。推荐oracle的virtual box虚拟机，可以自行搜索下载oracle VM，它是一个完全开源免费的版本。如果对Linux比较熟悉的同学，可以装自己喜欢的Linux版本，这里演示基于ubuntu server进行我们的开发。
首先我们来创造一个虚拟机，就叫做Node Server吧，系统选Linux，版本选Ubuntu 64，内存足的话分配2G，然后创建一个新的虚拟硬盘，动态分配，否则会一下占掉10G的硬盘空间。最大空间就是10G。这样我们的Node Server就创建成功了。
![avatar](img/1.png)
![avatar](img/2.png)
![avatar](img/3.png)
![avatar](img/4.png)
![avatar](img/5.png)
![avatar](img/6.png)
![avatar](img/7.png)
我们来把它启动起来。启动起来它会弹出提示，要我们去选一个光盘的镜像来安装操作系统，这里我已经提前下好了一个Ubuntu的20.04.1的iso版本，我们就把它下载下来，然后点start开机。语言就选英语，代理不用，注意这里的镜像地址是需要去改一下的，如果默认用ubuntu.com的地址也不是不行，但是它就是会比较慢。所以这里我们用一个阿里云的镜像地址：http://mirrors.aliyun.com/unbuntu。接下来不用动。name和server's name就写上自己。用户名和密码填完了要记住。注意Install OpenSSH server，默认要选上，剩下就可以默认安装了。安装完毕会要求我们重启，直接Reboot就可以了。重启失败，它让我们把这个光盘弹出来，它其实会自动地把光盘弹出来，然后我们再手工地重启一次就可以了。/

进入server以后，接下来安装node，我们先要把ubuntu上的包管理工具就是apt，执行一下sudo apt install nodejs。然后来安装npm，sudo apt install npm，可以通过npm --version来查看node版本，如果想要一个更新的node，我们可以安装一个叫做n的包sudo npm install -g n，这是一个node写的node版本管理，sudo n latest。这时候要求我们重新设置一下path，PATH="$PATH"。到这里为止，我们已经有了一个基本的运行Node的环境，我们的server的初始化就算完成了，接下来就可以编写代码并把代码部署到这台服务器上。

## 2. 利用Express，编写一个服务器
使用的最广泛的服务器框架Express，在实际的情况中，每个公司的线上服务系统，可能比较复杂，有的公司发展比较好的，它可能线上已经有一个这样的服务器，甚至它是一个集群形态的服务，有的公司可能是前后端混布的，就是前端写完代码，要交给后端的同学进行部署。这里不去考虑很多的情况，简单地把一个express服务器跑起来，然后把它部署到我们线上的机器上，也不去考虑监控、错误恢复、线上重启等一系列业务逻辑。一般来说，前端的代码，如果是前后端彻底分离的这种发布模式，我们的前端代码是发html的，而我们的服务端的数据，是由html和js里面做ajax请求再去获取的，这也是工作中实践较多的一种模式，所以这里我们就讲怎么去发静态文件。涉及到和服务端混布的呢，这个方案还得跟服务端同学一起去商量，前端有没有自主独立的发布权限。假设前端都是有独立的发布权限的，然后另外服务器集群的状况和部署的措施，还和运维有关，都要视公司的实际情况去进行沟通，一般不是一个前端team的事情。课程里主要是揭示里边的原理，把整个链路跑通。

新建server目录，到Express官网，getting started -> next: Hello World -> next: Express Generator，找到它generator的例子，创建express generator
```
npx express-generator
```
初始化后得到一个正常的项目目录，然后执行npm install
我们其实只用public里的代码，public里有javascripts，images，stylesheets的一些代码，我们实际上最后跑起来这个服务，就只用public里面的代码就可以了。在package.json里面，我们用npm start来启动。npm的scripts，只有叫start的时候，是不需要加run的。服务默认是在3000端口，访问localhost:3000就找到了express的服务。在app.js删掉不需要的路由和views，重新启动。
![avatar](img/express1.png)
这个时候它已经找不到了，但是http://localhost:3000/stylesheets/style.css还是可以找到的。
![avatar](img/express2.png)
在public里创建一个index.html，访问http://localhost:3000，也可以找到
![avatar](img/express3.png)
所以可以把views，routes目录都删掉，只用pubic。这就是一个简单的server了。接下来我们尝试把这个server部署到服务器。

首先要在虚拟机服务器上做一些准备，我们在安装的时候，已经装好了openSSH这个包，如果安装的时候没有加也没关系，直接apt install就可以了。我们在服务器上要先把这个服务启动起来，一般来说，默认的ubuntu服务器都是默认不启动
```
service ssh start
```
这时候它会要个auth，输入密码，我遇到了认证被拒绝的情况。后来发现是/etc/ssh/sshd_config的配置问题。
![avatar](img/denied.png)
我这里默认是注释掉的#PermitRootLogin prohibit-password，通过新增一行PermitRootLogin yes解决。输入密码后显示了authentication complete。这时候ssh已经启动好了，它默认会在22端口监听，然后我们就可以远程登陆到这台server上去了。先在虚拟机创建一个server目录，mkdir server。

接下来我们来到自己的项目目录里面，ssh就是它既可以远程登陆上去，也可以传文件，这里我们用一个scp命令，scp命令在我们一般的mac电脑上都是有的，如果是别的环境可能要想办法装一下scp这个命令。我们首先要copy22这个端口，22这个端口是不会直接给虚拟机的。我们要现在虚拟机里设一下它的端口转发，settings（设置） -> network（网络） -> port forwarding（端口转发），这里面有一个端口转发的规则，添加一条记录，protocol name其实无所谓，host port随便写一个不太会冲突的port，比如8022，guest port用22，这样的话我这台`宿主机上的8022端口`，就会被转发到`虚拟机上的22端口`，我们就可以用它做登陆了。

接下来来写scp命令，大写的P代表端口，从8022端口，拷贝本目录下的所有资源，到我们的虚拟机上，虚拟机这里因为用的是同一块网卡，这里如果用的是真实的服务器的话，就根据实际的服务器IP地址来写就可以了。冒号后边是它的路径/home/alexandra/server，因为拷贝的是整个目录，所以要加-r。
```
scp -P 8022 -r ./* alexandra@127.0.0.1:/home/alexandra/server
```
![avatar](img/scp.png)

在服务器上进入server目录，通过ls命令查看是否拷贝成功。不建议在server上在进行npm install，因为包的数量非常多，难保有哪个包不遵循semantic version这个原则，你在本地调试的node module的版本，跟线上的node module的版本一致就最好了，当然这里也可以利用package-lock.json的，部署的策略就不多说了，把整个包scp上去也可以。
我们在服务器执行一下npm start，这时候它监听的是虚拟机的3000端口，需要的话可以改。还是需要再配一个端口映射，这是针对虚拟机用户的同学，每用到一个固定端口，都需要进行端口映射，这里8080映射到3000，然后我们可以通过localhost去访问它的端口了。localhost://8080得到一样的内容。http://localhost:8080/stylesheets/style.css也同样能访问。
![avatar](img/port2.png)

服务器这里会报一个错误Error: No default engine was specified and no extension was provided，不用管他，不影响线上服务起。这样我们就有了一个纯粹的静态服务器，它是一个比较稳定的线上的服务，这就是我们现在的一个publish server了。我们的线上服务系统，就是我们再写一个应用叫publish server，来给线上的server提供文件上去就可以了。