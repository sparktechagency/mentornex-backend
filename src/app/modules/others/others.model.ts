import { model, Schema } from "mongoose";
import { IOthers, OthersModel } from "./others.interface";

const othersSchema = new Schema<IOthers, OthersModel>({
    content:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:["termsAndCondition", "privacyPolicy"],
        required:true
    }
}, { timestamps: true });

export const Others = model<IOthers, OthersModel>('Others', othersSchema);