const router = require('express').Router();
const adminCatWebServices = require('../controllers/category.controller');
const adminProWebServices = require('../controllers/product.controller');
const FileUploader = require('../helper/fileUpload');
const auth = require("../middlewares/auth")();

// File uploader config (if used for product/category images in the future)
const fileUploader = new FileUploader({
  folderName: 'uploads/profile-images',
  supportedFiles: ['image/png', 'image/jpg', 'image/jpeg'],
  fieldSize: 1024 * 1024 * 5, // 5MB
});


// =======================
// 📁 Category Routes
// =======================

// Add a new category (admin only)
router.post(
  '/admin/category',
  auth.authenticateAdminAPI,
  adminCatWebServices.addCategory
);

// List all categories with their products
router.get(
  '/getcategory',
  adminCatWebServices.listCategoriesWithProducts
);


// =======================
// 📦 Product Routes
// =======================

// Add a new product (admin only)
router.post(
  '/admin/product',
  auth.authenticateAdminAPI,
  adminProWebServices.addProduct
);

// Get all products
router.get(
  '/getproduct',
  adminProWebServices.listProducts
);

// Update a product (admin only)
router.put(
  '/admin/editproduct/:id',
  auth.authenticateAdminAPI,
  adminProWebServices.updateProduct
);

// Hard delete a product (admin only)
router.delete(
  '/admin/deleteproduct/:id',
  auth.authenticateAdminAPI,
  adminProWebServices.deleteProduct
);

// List out-of-stock products
router.get(
  '/listproduct',
  adminProWebServices.listOutOfStockProducts
);

module.exports = router;
