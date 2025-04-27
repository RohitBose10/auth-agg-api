const mongoose = require('mongoose');

class DbConnect {
    async connectDb() {
        try {
            mongoose.connect(process.env.MONGO_URI);
            console.log("DB Connected Successfully!")
        }catch(err) {
            console.log(err);
        }
    }
}


module.exports = new DbConnect();