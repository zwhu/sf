import fs from 'fs'
import post from '../post'
import path from 'path'


let [interpreter, entry, aticlePath, title, ...tags] = process.argv

aticlePath = path.resolve(__dirname, aticlePath)

let article = fs.readFileSync(aticlePath, 'utf-8')

post(article, tags, title)
