const Product = require("../models/product.model");
const Mailer = require("../helper/mailer");
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
      // Using aggregation pipeline with $lookup and pipeline inside it
      const products = await Product.aggregate([
        {
          $lookup: {
            from: "categories", // Linking with the categories collection
            let: { categoryId: "$categoryId" }, // Passing the categoryId from the product document
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$categoryId"] }, // Matching the categoryId with the category _id
                },
              },
              {
                $project: { name: 1 }, // Only include the category name
              },
            ],
            as: "category", // Storing the result of the lookup in "category"
          },
        },
        {
          $unwind: "$category", // Flatten the "category" array (since $lookup returns an array)
        },
        {
          $project: {
            name: 1, // Including product name
            price: 1, // Including product price
            stock: 1, // Including product stock
            category: "$category.name", // Directly include the category name
          },
        },
      ]);

      // Returning response with success message and fetched data
      return res
        .status(200)
        .json({ message: "Products fetched successfully", data: products });
    } catch (err) {
      // Logging and returning error if something goes wrong
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

  async sendAllProductsToEmail(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const products = await Product.aggregate([
        { $match: { isDeleted: { $ne: true } } },
      ]);

      if (!products.length) {
        return res.status(404).json({ message: "No products found" });
      }

      const table = `
      <h2 style="font-family: Arial, sans-serif;">Product List</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Stock</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (p) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.name}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.price}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${p.stock}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

      const mailer = new Mailer(
        "Gmail",
        process.env.APP_EMAIL,
        process.env.APP_PASSWORD
      );

      let mailObj = {
        to: req.body.email,
        subject: "all products",
        html: table,
        text: `Here is the list of all products`,
      };

      await mailer.sendMail(mailObj);

      res.status(200).json({ message: "Product list emailed successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Failed to send email" });
    }
  }
}

module.exports = new ProductController();
