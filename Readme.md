# README

在 segmentfault 上发表文章的脚本


1. 修改 `conf.json` 将 `mail` 和 `password` 替换成自己的邮箱和密码
2. import fn from `post.js` 模块
3. fn(文章内容, tag数组, 文章标题) // 务必至少填写一个tag

#### Example

命令行中可以如下使用

```js
babel-node example/index.js ./test.md 第一篇文章 javascript jquery hello-world
```



#### TODO：
1. 支持选择专栏
2. 支持新建tag，现在只支持sf上已经存在的tag，如果输入了不存在的tag，忽略。
