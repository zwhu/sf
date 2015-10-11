import request from 'superagent'
import cheerio from 'cheerio'
import fs from 'fs'

let article = ''
, tags = []
, title = ''

export default function () {

  [article, tags, title] = arguments

  getMainPage()
  .then(login)
  .then(getWritePage)
  .then(getDraftId)
  .then(getTags)
  .then(postBlog)
  .then(data => {
    console.log('创建Blog成功!')
    console.log('Blog的Url为:', `${origin}${data.url}`)
    console.log(data)
  })
  .catch(err => console.log(err.body))
}

const base_headers = {
    Accept: '*/*',
    'Accept-Encoding':'gzip, deflate',
    'Accept-Language':'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4,ja;q=0.2',
    'Cache-Control':'no-cache',
    Connection:'keep-alive',
    DNT:1,
    Host:'segmentfault.com',
    Origin: 'http://segmentfault.com',
    Pragma:'no-cache',
    Referer: 'http://segmentfault.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'}
, origin = 'http://segmentfault.com'
, urls = {
  origin,
  login: `${origin}/api/user/login`,
  write: `${origin}/write?freshman=1`,
  draft: `${origin}/api/article/draft/save`,
  tag: `${origin}/api/tags/search`,
  blog: `${origin}/api/articles/add` }
, conf = require('./conf.json')

let cookie

function getToken(s) {
  let $ = cheerio.load(s)
  , text = $('body script').eq(2).text()
  , fn = new Function('window', text + ';return window.SF.token')
  , token = fn({})

  $ = null
  return token
}

function getBlogId(s) {
  let $ = cheerio.load(s)
  ,  v = $('select[name=blogId]').val()
  $ = null

  return(v)
}

function getMainPage() {
  return new Promise((fulfill, reject) => {
    request
    .get(urls.origin)
    .end((err, res) => {
      if(err) reject(err)
      else fulfill(res)
    })
  })
}

function login(res) {
  let token = getToken(res.text)

  cookie = res.headers['set-cookie'].join(',').match(/(PHPSESSID=.+?);/)[1]

  return new Promise((fulfill, reject) => {
    request
      .post(urls.login)
      .query({'_': token})
      .set(base_headers)
      .set('Cookie', cookie)
      .type('form')
      .send(conf)
      .redirects(0)
      .end((err, res) => {
        if(err) reject(err)
        else if(res.body.message !== '') reject(res)
        else fulfill()
      })
  })
}

function getWritePage() {
  let referer = urls.write
  return new Promise((fulfill, reject) => {
    request
      .get(urls.write)
      .set(base_headers)
      .set('Cookie', cookie)
      .set('Referer', referer)
      .end((err, res) => {
        if(err) reject(err)
        else fulfill(res)
      })
  })
}

function getDraftId(res) {
  let referer = urls.write
  , token = getToken(res.text)
  , blogId = getBlogId(res.text)

    return new Promise((fulfill, reject) => {
      request
        .post(urls.draft)
        .query({'_': token})
        .set(base_headers)
        .set('Cookie', cookie)
        .set('Referer', referer)
        .type('form')
        .send({
          do: 'saveArticle',
          type: 'article',
          title: '',
          text: '',
          weibo: 0,
          blogId,
          id: '',
          articleId: '',
          'tags%5B%5D': ''
        })
        .redirects(0)
        .end((err, res) => {
          if(err) reject(err)
          else fulfill([res.body.data, token, blogId])
        })
    })
  }

function getTags() {
  let [draftId, token, blogId] = arguments[0]
  let referer = urls.write

  let pts = []

  tags.forEach( tag => pts.push( new Promise((fulfill, reject) => {
    request
      .get(urls.tag)
      .query({'q': tag})
      .query({'_': token})
      .set(base_headers)
      .set('Cookie', cookie)
      .set('Referer', referer)
      .redirects(0)
      .end((err, res) => {
        if(err) reject(err)
        else fulfill(res)
      })
    }).then(res => {
      let v = res.body.data.filter(_tag => _tag.name === tag)[0]
      if (v) return v.id
    }))
  )
  return Promise.all(pts).then( ids => [draftId, token, blogId, ids.filter(v=>v)])
}

function postBlog() {
  let [draftId, token, blogId, tagIds] = arguments[0]
  , referer = urls.write
  , blog = {
    title,
    text: article,
    id: '',
    blogId,
    weibo: 0,
    license: 1,
    draftId,
    created: ''
  }
  , content = Object.keys(blog)
                .map(k => `${k}=${blog[k]}`)
                .concat(tagIds.map(tagId => `tags%5B%5D=${tagId}`))
                .join('&')

  return new Promise((fulfill, reject) => {
    request
      .post(urls.blog)
      .query('_=' + token)
      .set(base_headers)
      .set('Cookie', cookie)
      .set('Referer', referer)
      .type('form')
      .send(content)
      .redirects(0)
      .end((err, res) => {
        if(err) reject(err)
        else fulfill(res.body.data)
      })
    })
}
