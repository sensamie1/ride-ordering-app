const Sender = require("./models/sender-class")
const Driver = require("./models/driver-class")
const Order = require("./models/order-class")

const OrderModel = require("./models/order-model")


class OrderingApp{
    constructor(){
      this.senders = []
      this.drivers = []
      this.orders = []
      this.socketUserMap = new Map()
        
    }

    joinSession({user_type, first_name, last_name, _id, vehicle_name, vehicle_color, socket}){
      console.log("User info about to be processed")
      this.createUser({socket, first_name, last_name, _id, vehicle_name, vehicle_color, user_type})
    }


    createUser({socket, first_name, last_name, _id, vehicle_name, vehicle_color, user_type}){
      switch(user_type) {
        case 'driver':
          const driver = new Driver(first_name, last_name, _id, vehicle_name, vehicle_color, user_type);
          this.drivers.push(driver);
          this.assignSocket({socket, user: driver});
          this.sendEvent({socket, data: { driver }, eventname: 'driverCreated'})
          console.log('Driver created',this.drivers);
          return driver;
        case 'sender':
          const sender = new Sender(first_name, last_name, _id, user_type);
          this.senders.push(sender);
          this.assignSocket({socket, user: sender});
          this.sendEvent({socket, data: { sender }, eventname: 'senderCreated'})
          console.log('Sender Created', this.senders);
          return sender;
        default:
          throw new Error('Invalid user type');
      }

    }

    assignSocket({socket, user}){
      this.socketUserMap.set(user.id, socket)
    }

    sendEvent({socket, data, eventname}){
      socket.emit(eventname, data)
    }

    requestOrder({current_location, destination, price, senderId}){

      const sender = this.senders.find(sender=>sender.id == senderId)
      const order = new Order({current_location, destination, price, sender})

      const timer = setTimeout(()=>{
        //Expire pending order after 1min
          if(order.status == "pending"){
            order.status = "expired"

            const senderSocket = this.socketUserMap.get(sender.id)
            console.log("sending expired order to the sender")
            senderSocket.emit("orderExpired", {order})

          }

      }, 60000)


      const updatedOrder = {...order, timer: timer}

      this.orders.push(updatedOrder)

      for(const driver of this.drivers){
        if(driver.in_ride)continue
        const driverSocket = this.socketUserMap.get(driver.id)
        driverSocket.emit("orderRequested", order)
      }
      const senderSocket = this.socketUserMap.get(sender.id);
      senderSocket.emit("orderRequested", { order });

      return updatedOrder
    }

    acceptOrder(id, driverId){
      const order = this.orders.find(order => order.id == id)
      const sender = this.senders.find(sender => sender.id == order.sender.id)
      const driver = this.drivers.find(driver => driver.id == driverId)

      driver.in_ride = true
      order.status = "accepted"
      order.driver = driver
      clearTimeout(order.timer)

      const senderSocket = this.socketUserMap.get(sender.id)
      senderSocket.emit("orderAccepted", {order})

      for(const driver of this.drivers){
        if(driver.id == driverId){
          const driverSocket = this.socketUserMap.get(driver.id)

          driverSocket.emit("orderAccepted", {order})
        }else{
          const otherSocket = this.socketUserMap.get(driver.id) 
          otherSocket.emit("orderMissed", {order})
        }
      }
    }

    rejectOrder(id , driverId){
      const order = this.orders.find(order=>order.id == id)
      const sender = this.senders.find(sender =>sender.id == order.sender.id)
      const driver = this.drivers.find(driver=>driver.id == driverId)

      order.status = "rejected"
      clearTimeout(order.timer)

      const senderSocket = this.socketUserMap.get(sender.id)
      senderSocket.emit("orderRejected", {order})

      const driverSocket = this.socketUserMap.get(driver.id)
      driverSocket.emit("orderRejected", {order})
    }


    // finishRide(id , driverId){
    //   const order = this.orders.find(order=>order.id == id)
    //   const sender = this.senders.find(sender =>sender.id == order.sender.id)
    //   const driver = this.drivers.find(driver=>driver.id == driverId)

    //   driver.in_ride = false
    //   order.status = 'finished'

    //   const senderSocket = this.socketUserMap.get(sender.id)
    //   senderSocket.emit("rideFinished", {order})

    //   const driverSocket = this.socketUserMap.get(driver.id)
    //   driverSocket.emit("rideFinished", {order})
    // }






    async finishRide(id, driverId) {
      try {
        const order = this.orders.find(order => order.id == id);
        const sender = this.senders.find(sender => sender.id == order.sender.id);
        const driver = this.drivers.find(driver => driver.id == driverId);
  
        driver.in_ride = false;
        order.status = 'finished';
  
        const senderSocket = this.socketUserMap.get(sender.id);
        senderSocket.emit("rideFinished", { order });
  
        const driverSocket = this.socketUserMap.get(driver.id);
        driverSocket.emit("rideFinished", { order });
  
        // Create an instance of the Order model and save it to the database
        const newOrder = new OrderModel({
          current_location: order.current_location,
          destination: order.destination,
          price: order.price,
          sender: sender._id, // Assuming sender has a MongoDB ObjectId
          driver: driver._id, // Assuming driver has a MongoDB ObjectId
          status: 'finished'
        });
        await newOrder.save();
        
      } catch (error) {
        console.error('Error saving order to database:', error);
      }
    }
    
}




module.exports = OrderingApp