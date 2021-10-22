const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const UserRoute = require('./routes/Users');

require('dotenv').config();
const PORT = 3000;

const app = express();
app.use(bodyParser.json());
app.use('/users',UserRoute);

const server = http.createServer(app);

server.listen(PORT,()=>{
    console.log("Serving: true")
})  