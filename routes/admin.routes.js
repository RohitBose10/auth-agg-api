const router = require('express').Router();
const adminCatWebServices = require('../controllers/category.controller');
const adminProWebServices = require('../controllers/product.controller');
const FileUploader = require('../helper/fileUpload');
const auth = require("../middlewares/auth")();

const fileUploader = new FileUploader({
  folderName: 'uploads/profile-images',
  supportedFiles: ['image/png', 'image/jpg', 'image/jpeg'],
  fieldSize: 1024 * 1024 * 5,
});

// Category Routes
router.post('/admin/category', auth.authenticateAdminAPI, adminCatWebServices.addCategory);
router.get('/admin/getcategory', adminCatWebServices.listCategoriesWithProducts);

// Product Routes
router.post('/admin/product', auth.authenticateAdminAPI, adminProWebServices.addProduct);
router.get('/admin/getproduct',adminProWebServices.listProducts);
router.put('/admin/editproduct/:id', auth.authenticateAdminAPI, adminProWebServices.updateProduct);
router.delete('/admin/deleteproduct/:id', auth.authenticateAdminAPI, adminProWebServices.deleteProduct);
router.get('/admin/listproduct',adminProWebServices.listOutOfStockProducts);
router.post('/admin/sendmail', auth.authenticateAdminAPI, adminProWebServices.sendAllProductsToEmail);

module.exports = router;
