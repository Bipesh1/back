import passport from "passport";
const GoogleStrategy = require("passport-google-oauth2").Strategy;
import Student, { IStudent } from "./models/studentModel";
import { Document } from "mongoose";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/user/google/callback",
      passReqToCallback: true,
    },
    async (request: any, accessToken: any, refreshToken: any, profile: { id: any; displayName: any; emails: { value: any; }[]; }, done: (arg0: null, arg1: (Document<unknown, {}, IStudent> & IStudent & Required<{ _id: unknown; }> & { __v: number; }) | null) => any) => {
      try {
        let student = await Student.findOne({ _id: profile.id });

        if (!student) {
          student = new Student({
            _id: profile.id,
            userName: profile.displayName,
            role: "user",
            email: profile.emails[0].value,
          });
          await student.save();
        }

        return done(null, student); 
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
