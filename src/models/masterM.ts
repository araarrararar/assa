import mongoose from "mongoose";

const masterSchema = new mongoose.Schema({
    clientId:{
        type:String,
        required: true
    },
    collectionName: {
        type: String,
        required: true
    }

})

const masterModel = mongoose.model("test", masterSchema);

export {masterModel};