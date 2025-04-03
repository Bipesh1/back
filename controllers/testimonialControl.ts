import Testimonial from "../models/testimonialModel";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

interface MulterRequest extends Request {
  file: any;
}

interface RequestWithParams extends Request {
  params: {
    id: string;
  };
}

// Create a testimonial
export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { name, post, review, priority, imageAlt } = req.body;

    const file = (req as MulterRequest).file;

    if (!file) {
      return res.status(400).send({ error: "Image file is required" });
    }

    let imagePath: { url: string; public_id: string; filename: string } | null =
      null;

    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "testimonials" },
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
      });

      imagePath = {
        url: result.secure_url,
        public_id: result.public_id,
        filename: file.originalname,
      };
    } catch (uploadError) {
      console.error("Error uploading image to Cloudinary:", uploadError);
      return res
        .status(500)
        .send({ error: "Error uploading image to Cloudinary" });
    }

    const testimonial = new Testimonial({
      name,
      post,
      review,
      priority,
      imageAlt,
      image: imagePath,
    });
    await testimonial.save();

    res.status(201).send({
      success: true,
      message: "Testimonial created successfully",
      testimonial,
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).send({
      success: false,
      message: "Error creating testimonial",
      error: error.message,
    });
  }
};

// Get all testimonials
export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({});
    res.status(200).send({
      success: true,
      countTotal: testimonials.length,
      message: "All Testimonials",
      testimonials,
    });
  } catch (error) {
    console.error("Error getting testimonials:", error);
    res.status(500).send({
      success: false,
      message: "Error getting testimonials",
      error: error.message,
    });
  }
};

// Get a single testimonial
export const getTestimonial = async (req: RequestWithParams, res: Response) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).send({
        success: false,
        message: "Testimonial not found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Testimonial fetched successfully",
      testimonial,
    });
  } catch (error) {
    console.error("Error getting testimonial:", error);
    res.status(500).send({
      success: false,
      message: "Error getting testimonial",
      error: error.message,
    });
  }
};

// Update a Testimonial
export const updateTestimonial = async (
  req: RequestWithParams,
  res: Response
) => {
  try {
    const { name, post, review, priority, imageAlt } = req.body;
    const file = (req as MulterRequest).file;
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).send({
        success: false,
        message: "Testimonial not found",
      });
    }

    if (name) testimonial.name = name;
    if (post) testimonial.post = post;
    if (priority) testimonial.priority = priority;
    if (review) testimonial.review = review;

    if (imageAlt) testimonial.imageAlt = imageAlt;
    if (file) {
      try {
        if (testimonial.image && testimonial.image.public_id) {
          await cloudinary.uploader.destroy(testimonial.image.public_id);
        } else {
          console.log("No public_id found for the image.");
        }

        // Upload new image to Cloudinary
        const result: UploadApiResponse = await new Promise(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "testimonials" },
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

        // Update the image details in the document
        testimonial.image = {
          url: result.secure_url,
          public_id: result.public_id,
          filename: file.originalname,
          contentType: file.mimetype,
          path: result.secure_url,
        };
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(500).send({
          success: false,
          message: "Error uploading image to Cloudinary",
        });
      }
    }

    await testimonial.save();
    res.status(200).send({
      success: true,
      message: "Testimonial updated successfully",
      testimonial,
    });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).send({
      success: false,
      message: "Error updating testimonial",
      error: error.message,
    });
  }
};

// Delete a Testimonial
export const deleteTestimonial = async (
  req: RequestWithParams,
  res: Response
) => {
  try {
    const testimonialId = req.params.id.toString(); // Ensure it's a string
    const testimonial = await Testimonial.findById(testimonialId);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    await Testimonial.findByIdAndDelete(testimonialId);

    // Delete the image from Cloudinary if it exists
    if (testimonial.image && testimonial.image.public_id) {
      await cloudinary.uploader.destroy(testimonial.image.public_id);
    }

    return res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting Testimonial:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting Testimonial",
      error: error.message,
    });
  }
};
