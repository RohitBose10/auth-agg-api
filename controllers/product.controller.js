const Product = require("../models/product.model");

class ProductController {
  async addProduct(req, res) {
    try {
      const { name, price, categoryId, stock } = req.body;
      await Product.create({ name, price, categoryId, stock });

      return res.status(200).json({
        message: "Product created successfully",
        data: { name, price, categoryId, stock },
      });
    } catch (err) {
      console.error(err.message);
      res.status(400).send("Error creating product");
    }
  }

  async listProducts(req, res) {
    try {
      const products = await Product.aggregate([
        {
          $lookup: {
            from: "categories",
            let: { categoryId: "$categoryId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$categoryId"] } } },
              { $project: { name: 1 } },
            ],
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $lookup: {
            from: "reviews",
            let: { prodId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$productId", "$$prodId"] } } },
            ],
            as: "reviews",
          },
        },
        {
          $addFields: {
            averageRating: {
              $cond: [
                { $gt: [{ $size: "$reviews" }, 0] },
                { $avg: "$reviews.rating" },
                0,
              ],
            },
            totalReviews: { $size: "$reviews" },
            "1star": {
              $size: {
                $filter: {
                  input: "$reviews",
                  as: "review",
                  cond: { $eq: ["$$review.rating", 1] },
                },
              },
            },
            "2star": {
              $size: {
                $filter: {
                  input: "$reviews",
                  as: "review",
                  cond: { $eq: ["$$review.rating", 2] },
                },
              },
            },
            "3star": {
              $size: {
                $filter: {
                  input: "$reviews",
                  as: "review",
                  cond: { $eq: ["$$review.rating", 3] },
                },
              },
            },
            "4star": {
              $size: {
                $filter: {
                  input: "$reviews",
                  as: "review",
                  cond: { $eq: ["$$review.rating", 4] },
                },
              },
            },
            "5star": {
              $size: {
                $filter: {
                  input: "$reviews",
                  as: "review",
                  cond: { $eq: ["$$review.rating", 5] },
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            price: 1,
            stock: 1,
            category: "$category.name",
            averageRating: 1,
            totalReviews: 1,
            "1star": 1,
            "2star": 1,
            "3star": 1,
            "4star": 1,
            "5star": 1,
          },
        },
      ]);

      return res
        .status(200)
        .json({ message: "Products fetched successfully", data: products });
    } catch (err) {
      console.error(err.message);
      res.status(400).send("Error fetching products");
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params; // Extracting product ID from the URL
      const updates = req.body; // Extracting update fields from the request body

      // Attempting to update the product by ID and return the updated product
      const product = await Product.findByIdAndUpdate(id, updates, {
        new: true,
      });

      // If product not found, return a not found message
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Successfully updated product
      return res
        .status(200)
        .json({ message: "Product updated successfully", data: product });
    } catch (err) {
      console.error("Error updating product:", err.message); // Better error logging
      res
        .status(400)
        .json({ message: "Something went wrong while updating the product" });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params; // Extracting product ID from the URL

      // Marking the product as deleted by setting 'isDeleted' to true
      const product = await Product.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      // If product not found, return a not found message
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Successfully marked the product as deleted
      return res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error("Error deleting product:", err.message); // Better error logging
      res
        .status(400)
        .json({ message: "Something went wrong while deleting the product" });
    }
  }

  async listOutOfStockProducts(req, res) {
    try {
      const products = await Product.aggregate([
        {
          $match: {
            stock: { $lt: 1 },
          },
        },
      ]);

      return res.status(200).json({
        message: "Out of stock products fetched successfully",
        data: products,
      });
    } catch (err) {
      console.error(err.message);
      res.status(400).send("Error fetching out of stock products");
    }
  }
}

module.exports = new ProductController();
