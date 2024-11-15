const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://ducviet:09122004@datn-1.pbl5t.mongodb.net/datn-1?retryWrites=true&w=majority&appName=datn-1')
        console.log("Connect to MongoDB successfully")
    } catch (error) {
        console.log("Connect failed " + error.message )
    }
}

module.exports = connectDB