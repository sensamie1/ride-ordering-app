const express = require('express');
const senderRouter = require('./senders/senders-router')
const driverRouter = require('./drivers/drivers-router');
const viewRouter = require('./views/views-router');
const viewRouter2 = require('./views/views-router-2');
const DriverModel = require('./models/driver-model');
const SenderModel = require('./models/sender-model');
const session = require("express-session");
const flash = require("express-flash");
const bodyParser = require("body-parser");

const jwt = require('jsonwebtoken');





//for socketIO
const http = require("http")
const socketIO = require("socket.io")
const OrderingApp = require("./ordering-app")




require('dotenv').config();

const app = express()


//for socketIO
const server = http.createServer(app)
const io = socketIO(server)


app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json())

app.use(express.json());

app.use(session({
  secret:"secret_key",
  resave:false,
  saveUninitialized:true,
  // cookie:{maxAge:600000}
  cookie:{maxAge: 86400000} // 24 hours
}));

app.use(flash());

app.set('view engine', 'ejs')

app.use('/senders', senderRouter)

app.use('/drivers', driverRouter)

app.use('/views', viewRouter)

app.use('/views2', viewRouter2)



// home route
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Success! Welcome to Rider App.', 
    status: true })
})

app.get('/senders', async (req, res) => {
  const senders = await SenderModel.find({}).lean()

  const sanitizedSenders = senders.map(sender => {
    const { password, ...sanitizedSender } = sender;
    return sanitizedSender;
  });

  return res.json({
    senders: sanitizedSenders
  })
})

app.get('/drivers', async (req, res) => {
  const drivers = await DriverModel.find({}).lean()

  const sanitizedDrivers = drivers.map(driver => {
    const { password, ...sanitizedDriver } = driver;
    return sanitizedDriver;
  });
  
  return res.json({
    drivers: sanitizedDrivers
  })
})



//for socketIO

const orderingApp = new OrderingApp()

io.on("connection", (socket)=>{
  console.log("A user is connected", socket.id)

  socket.on("join", (token, path)=>{
    // console.log("Received token:", token);
    // console.log("Received path:", path);

    let user_type;
    if (path.startsWith("/views/senders")) {
      user_type = "sender";
    } else if (path.startsWith("/views2/drivers")) {
      user_type = "driver";
    } else {
      user_type = "unknown";
    }
    // Decode the JWT to extract user information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { first_name, last_name, _id, vehicle_name, vehicle_color } = decoded;

    const userInfo = {
      socket: socket,
      user_type: user_type,
      first_name: first_name,
      last_name: last_name,
      vehicle_name: vehicle_name, 
      vehicle_color: vehicle_color,
      _id: _id
    }
    // console.log(userInfo);
    orderingApp.joinSession(userInfo)
  })

  socket.on("requestOrder", (order)=>{
    orderingApp.requestOrder(order)
  })


  socket.on("acceptOrder", (id, driverId)=>{
    orderingApp.acceptOrder(id, driverId)
  })

  socket.on("rejectOrder", (id, driverId)=>{
    orderingApp.rejectOrder(id, driverId)
  })

  socket.on("finishRide", (id, driverId)=>{
    orderingApp.finishRide(id, driverId)
  })
  
})

app.get('*', (req, res) => {
  return res.status(404).json({
    data: null,
    error: 'Route not found'
  })
})

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    data: null,
    error: 'Server Error'
  })
})



const db = require('./db');

const port = process.env.PORT || 5000;

db.connect();

server.listen(port, () => console.log(`listening on port: ${port}`));




// module.exports = app