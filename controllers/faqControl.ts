import Faq from "../models/faqModel";
import { Request, Response } from "express";
import Country from "../models/countryModel";

interface RequestWithParams extends Request {
  params: {
    id: string;
  };
}

// Create a faq
export const createFaq = async (req: Request, res: Response) => {
  try {
    const { ques, ans, countryId, priority } = req.body;

    // Fetch uni details
    const country = await Country.findById(countryId);
    if (!country) {
      return res.status(404).send({ error: "Country not found" });
    }
    const faq = new Faq({
      ques,
      ans,
      country: { id: country._id || null, name: country.name || null },
      priority,
    });
    await faq.save();

    res.status(201).send({
      success: true,
      message: "Faq created successfully",
      faq,
    });
  } catch (error) {
    console.error("Error creating faq:", error);
    res.status(500).send({
      success: false,
      message: "Error creating faq",
      error: error.message,
    });
  }
};

// Get all faqs
export const getFaqs = async (req: Request, res: Response) => {
  try {
    const faqs = await Faq.find({});
    res.status(200).send({
      success: true,
      countTotal: faqs.length,
      message: "All Faqs",
      faqs,
    });
  } catch (error) {
    console.error("Error getting faqs:", error);
    res.status(500).send({
      success: false,
      message: "Error getting faqs",
      error: error.message,
    });
  }
};

// Get a single faq
export const getFaq = async (req: RequestWithParams, res: Response) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).send({
        success: false,
        message: "FAQ not found",
      });
    }
    res.status(200).send({
      success: true,
      message: "FAQ fetched successfully",
      faq,
    });
  } catch (error) {
    console.error("Error getting faq:", error);
    res.status(500).send({
      success: false,
      message: "Error getting faq",
      error: error.message,
    });
  }
};

export const getFaqByCountry = async (req: Request, res: Response) => {
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

    // Find faqs by the country's ObjectId
    const faqs = await Faq.find({
      "country.id": countryDoc._id,
    });

    if (!faqs.length) {
      return res.status(404).send({
        success: false,
        message: "No faqs found for the given country",
      });
    }

    res.status(200).send({
      success: true,
      message: "Faqs fetched successfully",
      faqs,
    });
  } catch (error) {
    console.error("Error in getting faqs:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting faqs",
      error: error.message,
    });
  }
};

// Update a FAQ
export const updateFaq = async (req: RequestWithParams, res: Response) => {
  try {
    const { ques, ans, countryId, priority } = req.body;
    const faq = await Faq.findById(req.params.id);

    if (!faq) {
      return res.status(404).send({
        success: false,
        message: "FAQ not found",
      });
    }

    if (ques) faq.ques = ques;
    if (ans) faq.ans = ans;

    // Auto-fetch uni details
    if (countryId) {
      const country = await Country.findById(countryId);
      if (!countryId) {
        return res.status(404).send({ error: "Country not found" });
      }
      faq.country = {
        id: country.id || null,
        name: country.name || null, // Auto-populate name
      };
    }
    if (priority) faq.priority = priority;

    await faq.save();
    res.status(200).send({
      success: true,
      message: "FAQ updated successfully",
      faq,
    });
  } catch (error) {
    console.error("Error updating faq:", error);
    res.status(500).send({
      success: false,
      message: "Error updating faq",
      error: error.message,
    });
  }
};

// Delete a FAQ
export const deleteFaq = async (req: RequestWithParams, res: Response) => {
  try {
    const faqId = req.params.id.toString(); // Ensure it's a string
    const faq = await Faq.findById(faqId);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    await Faq.findByIdAndDelete(faqId);
    return res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting FAQ:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting FAQ",
      error: error.message,
    });
  }
};
