import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import router from "./routes/index.js";
import { errorHandler,asyncHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(express.json());

app.use("/", router);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorHandler);



export default app;