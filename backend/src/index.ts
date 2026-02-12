import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";

import { connectDb } from "./db";
import bannersRouter from "./routes/banners";
import categoriesRouter from "./routes/categories";
import ordersRouter from "./routes/orders";
import productsRouter from "./routes/products";
import productDetailsRouter from "./routes/productDetails";
import adminReviewsRouter from "./routes/adminReviews";
import authRouter from "./routes/auth";
import cartRouter from "./routes/cart";
import paymentsRouter from "./routes/payments";
import usersRouter from "./routes/users";
import dashboardRouter from "./routes/dashboard";
import analyticsRouter from "./routes/analytics";
import wishlistRouter from "./routes/wishlist";
import uploadRouter from "./routes/upload";
import sizeGuidesRouter from "./routes/sizeGuides";

dotenv.config();

const PORT = Number(process.env.PORT ?? 5050);
const MONGODB_URI = process.env.MONGODB_URI;

// Ensure upload directories exist on server startup
const ensureUploadDirectories = () => {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const categoriesUploadDir = path.join(uploadsDir, 'categories');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory:', uploadsDir);
    }
    
    if (!fs.existsSync(categoriesUploadDir)) {
      fs.mkdirSync(categoriesUploadDir, { recursive: true });
      console.log('✅ Created categories upload directory:', categoriesUploadDir);
    }
    
    console.log('✅ Upload directories ready');
  } catch (error) {
    console.error('❌ Error creating upload directories:', error);
  }
};

async function main() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI env var");
  }

  try {
    await connectDb(MONGODB_URI);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection failed');
    if (err?.name) console.error('name:', err.name);
    if (err?.code) console.error('code:', err.code);
    if (err?.message) console.error('message:', err.message);
    if (String(err?.message || '').includes('ENOTFOUND')) {
      console.error('Hint: DNS lookup failed for your MongoDB host. Check MONGODB_URI in your .env and internet/DNS settings.');
    }
    throw err;
  }
  
  // Ensure upload directories exist
  ensureUploadDirectories();

  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: "5mb" }));

  // Serve static files from uploads directory
  app.use('/uploads', express.static('public/uploads'));

  app.get("/api/health", (_req: express.Request, res: express.Response) => {
    res.json({ ok: true });
  });

  app.use("/api/categories", categoriesRouter);
  app.use("/api/banners", bannersRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/product-details", productDetailsRouter);
  app.use("/api/admin/reviews", adminReviewsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/admin/users", usersRouter);
  app.use("/api/admin/dashboard", dashboardRouter);
  app.use("/api/admin/analytics", analyticsRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/size-guides", sizeGuidesRouter);

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.error(
        `\n❌ Port ${PORT} is already in use.\n` +
          `Either stop the process using it (macOS: lsof -nP -iTCP:${PORT} -sTCP:LISTEN) or run with a different PORT.\n` +
          `Example: PORT=5051 npm run dev\n`,
      );
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
