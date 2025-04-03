import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import passport from "passport";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import adminRouter from "./routes/adminRoutes";
import superadminRouter from "./routes/superadminRoutes";
import studentRouter from "./routes/studentRoutes";
import faqRouter from "./routes/faqRoutes";
import blogRouter from "./routes/blogRoutes";
import testimonialRouter from "./routes/testimonialRoutes";
import courseRouter from "./routes/courseRoutes";
import countryRouter from "./routes/countryRoutes";
import universityRouter from "./routes/universityRoutes";
import dbConnect from "./config/dbconfig";
import { sendInquiry } from "./controllers/inquiryControl";
import { checkUser } from "./middlewares/authMiddleware";

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000");
dotenv.config();

// Connect to the database
dbConnect();

// // List of allowed origins
// const allowedOrigins = [
//   "https://url",
// ];

// // CORS middleware
// const corsOptions = (req, callback) => {
//   const origin = req.header("Origin");
//   if (allowedOrigins.includes(origin)) {
//     callback(null, {
//       origin: true, // Allow the request
//       methods: ["GET", "POST", "PUT", "DELETE"],
//       credentials: true,
//     });
//   } else {
//     callback(null, { origin: false }); // Block the request
//   }
// };

// app.use(cors(corsOptions));
app.use(
  cors({
    origin: ["https://repos-steel.vercel.app","http://localhost:3000"], // Allow the request
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
// app.use(express.static(path.join(__dirname, ".", "dist")));
// app.use(express.static("public"));

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         scriptSrc: ["'self'"],
//         frameSrc: ["'self'"],
//         connectSrc: ["'self'"],
//       },
//     },

//     crossOriginResourcePolicy: { policy: "cross-origin" },
//     crossOriginEmbedderPolicy: false,
//   })
// );

// Middleware setup
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());

app.use(
  cookieSession({
    name: "session",
    keys: ["#sessionkey"],
    maxAge: 24 * 60 * 60 * 100,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Route definitions
app.use("/api/admin", adminRouter);
app.use("/api/superadmin", superadminRouter);
app.use("/api/user", studentRouter);
app.use("/api/faq", faqRouter);
app.use("/api/blog", blogRouter);
app.use("/api/testimonial", testimonialRouter);
app.use("/api/course", courseRouter);
app.use("/api/country", countryRouter);
app.use("/api/university", universityRouter);
app.post("/api/sendenquiry", sendInquiry as any);
app.get("/api/checkuser", checkUser);

// 404 and error handling middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
