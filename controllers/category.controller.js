const Category = require('../models/category.model');
const Product = require('../models/product.model');


class CategoryController {
  async addCategory(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Please provide a category name.' });
      }

      await Category.create({ name });

      return res.status(201).json({ message: 'Category created successfully.', data: { name } });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'Something went wrong.' });
    }
  }

  async listCategoriesWithProducts(req, res) {
    try {
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: 'products', // Linking with the products collection
            let: { categoryId: "$_id" }, // Passing categoryId to the pipeline
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$categoryId", "$$categoryId"] }, // Matching categoryId in products with the category _id
                },
              },
              {
                $project: {
                  name: 1, // Including product name (or any other fields you need)
                  price: 1, // Including product price (optional)
                  stock: 1, // Including product stock (optional)
                },
              },
            ],
            as: 'products', // Storing the result of the lookup in "products"
          },
        },
        {
          $project: {
            name: 1, // Including category name
            products: 1, // Including the products array
            totalProducts: { $size: '$products' }, // Counting the number of products in each category
          },
        },
      ]);
  
      // Returning response with success message and fetched data
      return res.status(200).json({ message: 'Categories fetched successfully.', data: categories });
    } catch (error) {
      // Logging and returning error if something goes wrong
      console.log(error.message);
      res.status(500).json({ message: 'Something went wrong.' });
    }
  }

}

module.exports = new CategoryController();
