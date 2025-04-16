
import Blog from "../models/blogModel";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

interface MulterRequest extends Request {
  files: any;
}

interface RequestWithParams extends Request {
  params: {
    id: string;
    slug: string;
  };
}

// Create a blog
export const createBlog = async (req: Request, res: Response) => {
  try {
    const { priority, title, slug, category, content, tags } = req.body;

    const files = (req as MulterRequest).files;

    if (!files.length)
      return res.status(400).send({ error: "At least one image is required" });

    let imagesPath: { url: string; public_id: string; filename: string }[] = [];

    // Upload each image to Cloudinary
    for (const file of files) {
      try {
        const result: UploadApiResponse = await new Promise(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "blogs" },
              (error, result: UploadApiResponse | undefined) => {
                if (error) {
                  reject(error);
                } else if (result) {
                  resolve(result);
                }
              }
            );

            // Pipe the buffer into the upload stream
            uploadStream.end(file.buffer);
          }
        );

        // Push each uploaded image to the imagesPath array
        imagesPath.push({
          url: result.secure_url,
          public_id: result.public_id,
          filename: file.originalname,
        });
      } catch (uploadError) {
        console.error("Error uploading images to Cloudinary:", uploadError);
        return res
          .status(500)
          .send({ error: "Error uploading images to Cloudinary" });
      }
    }
    const blog = new Blog({
      priority,
      title,
      slug,
      category,
      content,
      tags,
      images: imagesPath,
    });
    await blog.save();

    res.status(201).send({
      success: true,
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).send({
      success: false,
      message: "Error creating blog",
      error: error.message,
    });
  }
};

// Get all blogs
export const getBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find({});
    res.status(200).send({
      success: true,
      countTotal: blogs.length,
      message: "All Blogs",
      blogs,
    });
  } catch (error) {
    console.error("Error getting blogs:", error);
    res.status(500).send({
      success: false,
      message: "Error getting blogs",
      error: error.message,
    });
  }
};

// Get a single blog
export const getBlog = async (req: RequestWithParams, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Blog fetched successfully",
      blog,
    });
  } catch (error) {
    console.error("Error getting blog:", error);
    res.status(500).send({
      success: false,
      message: "Error getting blog",
      error: error.message,
    });
  }
};

//Get blog by slug
export const getBlogBySlug = async (req: RequestWithParams, res: Response) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Blog fetched successfully",
      blog,
    });
  } catch (error) {
    console.error("Error getting blog:", error);
    res.status(500).send({
      success: false,
      message: "Error getting blog",
      error: error.message,
    });
  }
};

// Update a Blog
export const updateBlog = async (req: RequestWithParams, res: Response) => {
  try {
    const { priority, title, slug, category, content, tags } = req.body;
    const files = (req as MulterRequest).files || [];
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found",
      });
    }

    if (priority) blog.priority = priority;
    if (title) blog.title = title;
    if (slug) blog.slug = slug;
    if (content) blog.content = content;
    if (tags) blog.tags = tags;
    if (category) blog.category = category;
    // Handle new images
    if (files.length > 0) {
      // Delete existing images only if new images are provided
      if (Array.isArray(blog.images) && blog.images.length > 0) {
        await Promise.all(
          blog.images.map((image) => {
            console.log("Deleting image from Cloudinary:", image.public_id);
            return cloudinary.uploader.destroy(image.public_id); // Cloudinary destroy API
          })
        ).catch((err) => {
          console.error("Error deleting images from Cloudinary:", err);
          return res.status(500).send({
            success: false,
            message: "Error deleting existing images from Cloudinary",
          });
        });
      }

      // Initialize an empty array to hold new image paths
      const imagesPath = [];

      // Upload new images to Cloudinary
      for (const file of files) {
        try {
          const result: UploadApiResponse = await new Promise(
            (resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "blogs" },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else if (result) {
                    resolve(result);
                  }
                }
              );

              // Pipe the buffer into the upload stream
              uploadStream.end(file.buffer);
            }
          );

          // Add each new image to the imagesPath array
          imagesPath.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            contentType: file.mimetype,
            path: result.secure_url,
          });
        } catch (uploadError) {
          console.error("Error uploading image to Cloudinary:", uploadError);
          return res.status(500).send({
            success: false,
            message: "Error uploading image to Cloudinary",
          });
        }
      }

      // Now update the blog's images array
      blog.images = imagesPath;
    }
    await blog.save();
    res.status(200).send({
      success: true,
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).send({
      success: false,
      message: "Error updating blog",
      error: error.message,
    });
  }
};

// Delete a Blog
export const deleteBlog = async (req: RequestWithParams, res: Response) => {
  try {
    const blogId = req.params.id.toString(); // Ensure it's a string
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await Blog.findByIdAndDelete(blogId);

    // If the blog contains images, delete them from Cloudinary
    if (Array.isArray(blog.images) && blog.images.length > 0) {
      await Promise.all(
        blog.images.map((image) => {
          console.log("Deleting image from Cloudinary:", image.public_id);
          return cloudinary.uploader.destroy(image.public_id); // Cloudinary destroy API
        })
      ).catch((err) => {
        console.error("Error deleting images from Cloudinary:", err);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting Blog:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting Blog",
      error: error.message,
    });
  }
};
