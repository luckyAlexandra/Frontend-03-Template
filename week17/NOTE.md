如何为我们的JavaScript的生产环境去制作一套工具链，来覆盖我们前端开发的各个环节。
所有的工具的开端是我们的脚手架，有的人会把脚手架误解为和工具链是同一回事，但其实并不是这样，一般来说，我们会把generator成为脚手架，而yeoman，是现在社区比较流行的一个脚手架的生成器，它叫做generators的generator，也就是说，我们通过yeoman的框架，可以轻易地去开发一个能够初始化项目的，创建模版的的工具。

## yeoman的基本使用

### 1. creating a generator

```
mkdir toolchain
cd toolchain

npm init
npm install yeoman-generator
```

#### folder tree

```
───package.json
└───generators/
    ├───app/
    │   └───index.js
    └───router/
        └───index.js
```

#### Extending generator

index.js
```
var Generator = require('yeoman-generator');

module.exports = class extends Generator {};
```

#### Overwriting the constructor

```
module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor(args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts);

    // Next, add your custom code
    this.option('babel'); // This method adds support for a `--babel` flag
  }
};
```

#### Adding your own functionality

```
module.exports = class extends Generator {
  method1() {
    this.log('method 1 just ran');
  }

  method2() {
    this.log('method 2 just ran');
  }
};
```

yeoman的API是非常奇怪的，它会顺次地执行一个class里的所有方法，跟我们的认知不是特别一致。this.option('babel')，其实就是允许我们去加babel的flag，这个我们暂时也用不到，可以直接删掉。

package.json里的main改成`"main": "generator/app/index.js"`。

#### Running the generator
接下来退到toolchain根目录，尝试把示例跑起来。 
```
npm link
```
执行npm link，这个命令会把我们在本地的一个模块，link到一个我们的npm的标准的模块里面去，所以可以看到它把toolchain的全局的模块，变成了我们开发中的模块。
```
/Users/liuzengping/.nvm/versions/node/v14.3.0/lib/node_modules/toolchain -> /Users/liuzengping/Documents/projects/Frontend-03-Template/week17/toolchain
```

link完之后我们就可以用yeoman去启动它了。将package的名字改成generator-toolchain，因为package的名字必须是generator开头的。重新link一下。
```
/Users/liuzengping/.nvm/versions/node/v14.3.0/lib/node_modules/generator-toolchain -> /Users/liuzengping/Documents/projects/Frontend-03-Template/week17/toolchain
```

执行yo toolchain，如果未全局安装yeoman，先`npm install -g yo`
```
yo toolchain
```
### 2. User interactions
理解了generator是怎样执行的以后，我们就可以为generator设计一个这样的流程了。它除了允许我们使用这种同步的method之外，也可以支持异步的method。

接下来介绍一个非常重要的设置就是this.prompt。log是用于输出了，但如果我们要用户进行一些输入的话，我们就要用this.prompt。
```
module.exports = class extends Generator {
  async prompting() {
    const answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname // Default to current folder name
      },
      {
        type: "confirm",
        name: "cool",
        message: "Would you like to enable the Cool feature?"
      }
    ]);

    this.log("app name", answers.name);
    this.log("cool feature", answers.cool);
  }
};
```

跑这个命令, 看看你的generator有没有在里面
`ls $(npm config get prefix)/lib/node_modules`