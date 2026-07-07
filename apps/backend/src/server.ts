import "dotenv/config";

import express from "express";
import cors from "cors";

import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import attributeRoutes from "./attributeRoutes.js";
import mediaRoutes from "./mediaRoutes.js";
import userRoutes from "./userRoutes.js";
import auditRoutes from "./auditRoutes.js";
import roleRoutes from "./roleRoutes.js";
import domainRoutes from "./domainRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import productFamilyRoutes from "./productFamilyRoutes.js";
import currencyRoutes from "./currencyRoutes.js";
import countryRoutes from "./countryRoutes.js";
import uomRoutes from "./uomRoutes.js";
import brandRoutes from "./brandRoutes.js";

import { auditMiddleware } from "./auditMiddleware.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());
app.use(auditMiddleware);

// Basic health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/product-families", productFamilyRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/uoms", uomRoutes);
app.use("/api/brands", brandRoutes);
app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});
