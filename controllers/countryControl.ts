import Country from "../models/countryModel";
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

// Create a country
export const createCountry = async (req: Request, res: Response) => {
  try {
    const { name, priority, imageAlt, publicUni, privateUni, general } =
      req.body;

    const file = (req as MulterRequest).file;

    if (!file) {
      return res.status(400).send({ error: "Image file is required" });
    }

    let imagePath: { url: string; public_id: string; filename: string } | null =
      null;

    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "countries" },
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

    const parsedPublicUni = JSON.parse(publicUni);
    const parsedPrivateUni = JSON.parse(privateUni);
    const parsedGeneral = JSON.parse(general);

    const country = new Country({
      name,
      priority,
      publicUni: {
        undergraduate: parsedPublicUni.undergraduate,
        masters: parsedPublicUni.masters,
      },
      privateUni: {
        undergraduate: parsedPrivateUni.undergraduate,
        masters: parsedPrivateUni.masters,
      },
      general: {
        undergraduate: parsedGeneral.undergraduate,
        masters: parsedGeneral.masters,
        mba: parsedGeneral.mba,
      },
      imageAlt,
      image: imagePath,
    });

    await country.save();

    res.status(201).send({
      success: true,
      message: "Country created successfully",
      country,
    });
  } catch (error) {
    console.error("Error creating country:", error);
    res.status(500).send({
      success: false,
      message: "Error creating country",
      error: error.message,
    });
  }
};

// Get all countries
export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await Country.find({});
    res.status(200).send({
      success: true,
      countTotal: countries.length,
      message: "All Countries",
      countries,
    });
  } catch (error) {
    console.error("Error getting countries:", error);
    res.status(500).send({
      success: false,
      message: "Error getting countries",
      error: error.message,
    });
  }
};

// Get a single country
export const getCountry = async (req: RequestWithParams, res: Response) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) {
      return res.status(404).send({
        success: false,
        message: "Country not found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Country fetched successfully",
      country,
    });
  } catch (error) {
    console.error("Error getting country:", error);
    res.status(500).send({
      success: false,
      message: "Error getting country",
      error: error.message,
    });
  }
};

// Update a Country
export const updateCountry = async (req: RequestWithParams, res: Response) => {
  try {
    const { name, priority, imageAlt, publicUni, privateUni, general } =
      req.body;
    console.log(req.body);
    const file = (req as MulterRequest).file;
    const country = await Country.findById(req.params.id);

    if (!country) {
      return res.status(404).send({
        success: false,
        message: "Country not found",
      });
    }

    if (priority) country.priority = priority;
    if (name) country.name = name;
    if (imageAlt) country.imageAlt = imageAlt;

    const parsedPublicUni = publicUni
      ? JSON.parse(publicUni)
      : country.publicUni;
    const parsedPrivateUni = privateUni
      ? JSON.parse(privateUni)
      : country.privateUni;
    const parsedGeneral = general ? JSON.parse(general) : country.general;

    if (publicUni) {
      country.publicUni = {
        undergraduate:
          parsedPublicUni.undergraduate || country.publicUni.undergraduate,
        masters: parsedPublicUni.masters || country.publicUni.masters,
      };
    }

    if (privateUni) {
      country.privateUni = {
        undergraduate:
          parsedPrivateUni.undergraduate || country.privateUni.undergraduate,
        masters: parsedPrivateUni.masters || country.privateUni.masters,
      };
    }

    if (general) {
      country.general = {
        undergraduate:
          parsedGeneral.undergraduate || country.general.undergraduate,
        masters: parsedGeneral.masters || country.general.masters,
        mba: parsedGeneral.mba || country.general.mba,
      };
    }
    if (file) {
      try {
        if (country.image && country.image.public_id) {
          await cloudinary.uploader.destroy(country.image.public_id);
        } else {
          console.log("No public_id found for the image.");
        }

        // Upload new image to Cloudinary
        const result: UploadApiResponse = await new Promise(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "countries" },
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
        country.image = {
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

    await country.save();
    res.status(200).send({
      success: true,
      message: "Country updated successfully",
      country,
    });
  } catch (error) {
    console.error("Error updating country:", error);
    res.status(500).send({
      success: false,
      message: "Error updating country",
      error: error.message,
    });
  }
};

// Delete a Country
export const deleteCountry = async (req: RequestWithParams, res: Response) => {
  try {
    const countryId = req.params.id.toString(); // Ensure it's a string
    const country = await Country.findById(countryId);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    await Country.findByIdAndDelete(countryId);

    // Delete the image from Cloudinary if it exists
    if (country.image && country.image.public_id) {
      await cloudinary.uploader.destroy(country.image.public_id);
    }

    return res.status(200).json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting Country:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting Country",
      error: error.message,
    });
  }
};
