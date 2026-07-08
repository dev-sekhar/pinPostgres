import "dotenv/config";
import "express-async-errors";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import attributeRoutes from "./routes/attributeRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import domainRoutes from "./routes/domainRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productFamilyRoutes from "./routes/productFamilyRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import countryRoutes from "./routes/countryRoutes.js";
import uomRoutes from "./routes/uomRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import manufacturerRoutes from "./routes/manufacturerRoutes.js";
import complianceTypeRoutes from "./routes/complianceTypeRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";

import { auditMiddleware } from "./middleware/auditMiddleware.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

const softTimeout = parseInt(process.env.SESSION_SOFT_TIMEOUT_MINUTES || "30", 10);
const hardTimeout = parseInt(process.env.SESSION_HARD_TIMEOUT_MINUTES || "480", 10);

if (hardTimeout <= softTimeout) {
    console.error(`[FATAL] SESSION_HARD_TIMEOUT_MINUTES (${hardTimeout}) must be greater than SESSION_SOFT_TIMEOUT_MINUTES (${softTimeout}).`);
    process.exit(1);
}

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
app.use("/api/permissions", permissionRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/manufacturers", manufacturerRoutes);
app.use("/api/compliance-types", complianceTypeRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/settings", settingsRoutes);

// Global Error Handler
app.use(errorHandler as any);

app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});
