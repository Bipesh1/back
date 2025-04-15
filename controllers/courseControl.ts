import { Request, Response } from "express";
import Course from "../models/courseModel";
import slugify from "slugify";
import University from "../models/universityModel";

//upload a course image
export const createCourse = async (req: Request, res: Response) => {
  try {
    const {
      title,
      priority,
      category,
      universityId, // Extract uni ID
      qualification,
      earliestIntake,
      deadline,
      duration,
      entryScore,
      fee,
      scholarship,
      stream,
      overview,
      slug,
      tags,
    } = req.body;

    if (!title)
      return res.status(400).send({ error: "All Fields are Required" });

    // Fetch uni details
    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).send({ error: "University not found" });
    }
    const course = new Course({
      title,
      priority,
      category,
      university: {
        id: university._id,
        name: university.name,
        slug: university.slug,
      },
      qualification,
      earliestIntake,
      deadline,
      duration,
      entryScore,
      fee,
      scholarship,
      stream,
      overview,
      slug,
      tags,
    });

    await course.save();
    res.status(201).send({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Error in createCourse:", error);
    res.status(500).send({
      success: false,
      message: "Error in creating course",
      error: error.message,
    });
  }
};

//get all courses
export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find({});
    res.status(200).send({
      success: true,
      countTotal: courses.length,
      message: "All Courses",
      courses,
    });
  } catch (error) {
    console.error("Error in getting courses:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting courses",
      error: error.message,
    });
  }
};

//get a course
export const getCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .send({ success: false, message: "Course not found" });
    }
    res.status(200).send({
      success: true,
      message: "Course fetched successfully",
      course,
    });
  } catch (error) {
    console.error("Error in getting course:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting course",
      error: error.message,
    });
  }
};

//get course by slug
export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) {
      return res
        .status(404)
        .send({ success: false, message: "Course not found" });
    }
    res.status(200).send({
      success: true,
      message: "Course fetched successfully",
      course,
    });
  } catch (error) {
    console.error("Error in getting course:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting course",
      error: error.message,
    });
  }
};

export const getCourseByUniversity = async (req: Request, res: Response) => {
  try {
    const { uni } = req.params;

    if (!uni) {
      return res.status(400).send({
        success: false,
        message: "University parameter is required",
      });
    }

    // Find country by id
    const uniDoc = await University.findById(uni);

    if (!uniDoc) {
      return res.status(404).send({
        success: false,
        message: "Univeersity not found",
      });
    }

    // Find courses by the country's ObjectId
    const courses = await Course.find({
      "university.id": uniDoc._id,
    });

    if (!courses.length) {
      return res.status(404).send({
        success: false,
        message: "No courses found for the given university",
      });
    }

    res.status(200).send({
      success: true,
      message: "Courses fetched successfully",
      courses,
    });
  } catch (error) {
    console.error("Error in getting courses:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting courses",
      error: error.message,
    });
  }
};

//update course
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const {
      title,
      priority,
      category,
      universityId,
      qualification,
      earliestIntake,
      deadline,
      duration,
      entryScore,
      fee,
      scholarship,
      stream,
      overview,
      slug,
      tags,
    } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res
        .status(404)
        .send({ success: false, message: "Course not found" });
    }

    if (title) course.title = title;
    if (slug) course.slug = slug;
    if (fee) course.fee = fee;
    if (category) course.category = category;
    if (overview) course.overview = overview;
    if (tags) course.tags = tags;
    if (duration) course.duration = duration;
    if (entryScore) course.entryScore = entryScore;
    if (deadline) course.deadline = deadline;
    if (earliestIntake) course.earliestIntake = earliestIntake;
    if (qualification) course.qualification = qualification;

    // Auto-fetch uni details
    if (universityId) {
      const university = await University.findById(universityId);
      if (!universityId) {
        return res.status(404).send({ error: "University not found" });
      }
      course.university = {
        id: university.id,
        name: university.name,
        slug: university.slug,
      };
    }
    if (priority) course.priority = priority;
    if (scholarship) course.scholarship = scholarship;
    if (stream) course.stream = stream;

    await course.save();
    res.status(200).send({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Error in updateCourse:", error);
    res.status(500).send({
      success: false,
      message: "Error in updating course",
      error: error.message,
    });
  }
};

//delete course
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .send({ success: false, message: "Course not found" });
    }

    await Course.findByIdAndDelete(courseId);

    res.status(200).send({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleting course:", error);
    res.status(500).send({
      success: false,
      message: "Error in deleting course",
      error: error.message,
    });
  }
};