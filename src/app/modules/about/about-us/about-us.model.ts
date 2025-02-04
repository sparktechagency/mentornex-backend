import { model, Schema } from "mongoose";
import { AboutModal, IAbout } from "./about-us.interface";

const AboutSchema = new Schema<IAbout, AboutModal>(
    {
        title: {
            type: String,
            required: true,
          },
        description: {
            type: String,
            required: true,
      }
    },
    { timestamps: true }
  );

export const About = model<IAbout, AboutModal>('About', AboutSchema);