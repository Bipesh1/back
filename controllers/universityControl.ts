import { Request, Response } from "express";
import University from "../models/universityModel";
import slugify from "slugify";
import path from "path";
import fs from "fs";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import Country from "../models/countryModel";

interface MulterRequest extends Request {
  files?: { [fieldname: string]: Express.Multer.File[] };
}

// upload a university image
export const createUniversity = async (req: Request, res: Response) => {
  try {
    const {
      priority,
      name,
      slug,
      address,
      link,
      admissionOpen,
      email,
      fb,
      insta,
      x,
      category,
      phone,
      syllabus,
      estdDate,
      deamMsg,
      scholarship,
      content,
      countryId, // Extract country ID
      imageAlt,
      tags,
      test,
      applyfee,
    } = req.body;

    const files = (req as MulterRequest).files;

    if (!files || !files.image || !files.uniLogo) {
      return res
        .status(400)
        .send({ error: "Both image and uniLogo are required" });
    }

    if (!name || !countryId) {
      return res
        .status(400)
        .send({ error: "Name and Country ID are required" });
    }

    // Fetch country details
    const country = await Country.findById(countryId);
    if (!country) {
      return res.status(404).send({ error: "Country not found" });
    }

    const uploadToCloudinary = (
      file: Express.Multer.File
    ): Promise<UploadApiResponse> => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "universities" },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    };

    let imagePath: { url: string; public_id: string; filename: string },
      uniLogoPath: { url: string; public_id: string; filename: string };

    try {
      const [imageResult, uniLogoResult] = await Promise.all([
        uploadToCloudinary(files.image[0]),
        uploadToCloudinary(files.uniLogo[0]),
      ]);

      imagePath = {
        url: imageResult.secure_url,
        public_id: imageResult.public_id,
        filename: files.image[0].originalname,
      };

      uniLogoPath = {
        url: uniLogoResult.secure_url,
        public_id: uniLogoResult.public_id,
        filename: files.uniLogo[0].originalname,
      };
    } catch (uploadError) {
      console.error("Error uploading images to Cloudinary:", uploadError);
      return res
        .status(500)
        .send({ error: "Error uploading images to Cloudinary" });
    }

    const university = new University({
      priority,
      name,
      slug,
      address,
      admissionOpen: admissionOpen === "true",
      link,
      email,
      fb,
      insta,
      x,
      country: {
        id: country._id,
        name: country.name,
      },
      category,
      phone,
      syllabus,
      estdDate,
      deamMsg,
      scholarship,
      content,
      imageAlt,
      tags,
      test,
      applyfee,
      image: imagePath,
      uniLogo: uniLogoPath,
    });

    await university.save();
    res.status(201).send({
      success: true,
      message: "University created successfully",
      university,
    });
  } catch (error) {
    console.error("Error in createUniversity:", error);
    res.status(500).send({
      success: false,
      message: "Error in creating university",
      error: error.message,
    });
  }
};

//get all universities
export const getUniversities = async (req: Request, res: Response) => {
  try {
    const universities = await University.find({});
    res.status(200).send({
      success: true,
      countTotal: universities.length,
      message: "All Universities",
      universities,
    });
  } catch (error) {
    console.error("Error in getting universities:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting universities",
      error: error.message,
    });
  }
};

//get a university
export const getUniversity = async (req: Request, res: Response) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res
        .status(404)
        .send({ success: false, message: "University not found" });
    }
    res.status(200).send({
      success: true,
      message: "University fetched successfully",
      university,
    });
  } catch (error) {
    console.error("Error in getting university:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting university",
      error: error.message,
    });
  }
};

export const getUniversityByCountry = async (req: Request, res: Response) => {
  try {
    const { country } = req.params;

    if (!country) {
      return res.status(400).send({
        success: false,
        message: "Country parameter is required",
      });
    }

    // Find country by id
    const countryDoc = await Country.findById(country);

    if (!countryDoc) {
      return res.status(404).send({
        success: false,
        message: "Country not found",
      });
    }

    // Find universities by the country's ObjectId
    const universities = await University.find({
      "country.id": countryDoc._id,
    });

    if (!universities.length) {
      return res.status(404).send({
        success: false,
        message: "No universities found for the given country",
      });
    }

    res.status(200).send({
      success: true,
      message: "Universities fetched successfully",
      universities,
    });
  } catch (error) {
    console.error("Error in getting universities:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting universities",
      error: error.message,
    });
  }
};

//update university
export const updateUniversity = async (req: Request, res: Response) => {
  try {
    const {
      priority,
      name,
      slug,
      address,
      admissionOpen,
      link,
      email,
      fb,
      insta,
      x,
      countryId,
      category,
      phone,
      syllabus,
      estdDate,
      deamMsg,
      scholarship,
      content,
      test,
      applyfee,
      imageAlt,
      tags,
    } = req.body;
    const files = (req as MulterRequest).files;
    const university = await University.findById(req.params.id);

    if (!university) {
      return res
        .status(404)
        .send({ success: false, message: "University not found" });
    }

    if (x) university.x = x;
    if (fb) university.fb = fb;
    if (insta) university.insta = insta;
    if (slug) university.slug = slug;
    if (name) university.name = name;
    if (priority) university.priority = priority;
    if (admissionOpen !== undefined)
      university.admissionOpen = admissionOpen === "true";
    if (address) university.address = address;
    if (link) university.link = link;
    if (email) university.email = email;
    if (phone) university.phone = phone;
    if (syllabus) university.syllabus = syllabus;
    if (deamMsg) university.deamMsg = deamMsg;
    if (estdDate) university.estdDate = estdDate;
    if (scholarship) university.scholarship = scholarship;

    // Auto-fetch country details
    if (countryId) {
      const country = await Country.findById(countryId);
      if (!country) {
        return res.status(404).send({ error: "Country not found" });
      }
      university.country = {
        id: country.id,
        name: country.name, // Auto-populate name
      };
    }

    if (category) university.category = category;
    if (content) university.content = content;
    if (tags) university.tags = tags;
    if (test) university.test = test;
    if (applyfee) university.applyfee = applyfee;
    if (imageAlt) university.imageAlt = imageAlt;
    if (files) {
      try {
        if (files.image) {
          if (university.image && university.image.public_id) {
            await cloudinary.uploader.destroy(university.image.public_id);
          } else {
            console.log("No public_id found for the image.");
          }

          const imageResult: UploadApiResponse = await new Promise(
            (resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "universities" },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else if (result) {
                    resolve(result);
                  }
                }
              );
              uploadStream.end(files.image[0].buffer);
            }
          );

          university.image = {
            url: imageResult.secure_url,
            public_id: imageResult.public_id,
            filename: files.image[0].originalname,
            contentType: files.image[0].mimetype,
            path: imageResult.secure_url,
          };
        }

        if (files.uniLogo) {
          if (university.uniLogo && university.uniLogo.public_id) {
            await cloudinary.uploader.destroy(university.uniLogo.public_id);
          } else {
            console.log("No public_id found for the uniLogo.");
          }

          const logoResult: UploadApiResponse = await new Promise(
            (resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "universities" },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else if (result) {
                    resolve(result);
                  }
                }
              );
              uploadStream.end(files.uniLogo[0].buffer);
            }
          );

          university.uniLogo = {
            url: logoResult.secure_url,
            public_id: logoResult.public_id,
            filename: files.uniLogo[0].originalname,
            contentType: files.uniLogo[0].mimetype,
            path: logoResult.secure_url,
          };
        }
      } catch (uploadError) {
        console.error("Error uploading images to Cloudinary:", uploadError);
        return res.status(500).send({
          success: false,
          message: "Error uploading images to Cloudinary",
        });
      }
    }

    await university.save();
    res.status(200).send({
      success: true,
      message: "University updated successfully",
      university,
    });
  } catch (error) {
    console.error("Error in updateUniversity:", error);
    res.status(500).send({
      success: false,
      message: "Error in updating university",
      error: error.message,
    });
  }
};

//delete university
export const deleteUniversity = async (req: Request, res: Response) => {
  try {
    const universityId = req.params.id;
    const university = await University.findById(universityId);

    if (!university) {
      return res
        .status(404)
        .send({ success: false, message: "University not found" });
    }

    await University.findByIdAndDelete(universityId);

    // Delete the image from Cloudinary if it exists
    if (university.image && university.image.public_id) {
      await cloudinary.uploader.destroy(university.image.public_id);
    }

    res.status(200).send({
      success: true,
      message: "University deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleting university:", error);
    res.status(500).send({
      success: false,
      message: "Error in deleting university",
      error: error.message,
    });
  }
};
