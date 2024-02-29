class Sender{
  constructor(first_name, last_name, _id){
    this.id = Math.floor(Math.random()*1000000)
    this.first_name = first_name
    this.last_name = last_name
    this._id = _id
  }
}

module.exports = Sender