class Driver{
  constructor(first_name, last_name, _id, vehicle_name, vehicle_color,){
      this.id = Math.floor(Math.random()*1000000)
      this.first_name = first_name
      this.last_name = last_name
      this.vehicle_name = vehicle_name 
      this.vehicle_color = vehicle_color
      this._id = _id
      this.in_ride = false


  }
}

module.exports = Driver