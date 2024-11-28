const express = require('express')
const userRouter = require('./routes/userRouter')


const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/', userRouter)
app.use('*', function (req, res) {
    res.status(400).send('Invalid route')
})

module.exports = app