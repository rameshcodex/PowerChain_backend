const emailTemplate = require("../../models/emailTemplate");

const getEmailContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      is_active,
    } = req.query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let matchStage = {};

    if (type) {
      matchStage.type = type;
    }

    if (is_active !== undefined && is_active !== "") {
      matchStage.is_active = is_active === "true";
    }

    let data, total;

    if (search) {
      const regex = new RegExp(search, "i");

      // Use aggregation for search including template name
      const pipeline = [
        {
          $lookup: {
            from: "template_design", // collection name
            localField: "template_name",
            foreignField: "_id",
            as: "template_name_populated"
          }
        },
        {
          $unwind: {
            path: "$template_name_populated",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            ...matchStage,
            $or: [
              { event_key: regex },
              { subject: regex },
              { "template_name_populated.template_name": regex },
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limitNumber
        },
        {
          $project: {
            template_name: {
              _id: "$template_name_populated._id",
              template_name: "$template_name_populated.template_name"
            },
            event_key: 1,
            subject: 1,
            body: 1,
            is_active: 1,
            type: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ];

      data = await emailTemplate.aggregate(pipeline);

      // For total count with search
      const countPipeline = [
        {
          $lookup: {
            from: "template_design",
            localField: "template_name",
            foreignField: "_id",
            as: "template_name_populated"
          }
        },
        {
          $unwind: {
            path: "$template_name_populated",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            ...matchStage,
            $or: [
              { event_key: regex },
              { subject: regex },
              { "template_name_populated.template_name": regex },
            ]
          }
        },
        {
          $count: "total"
        }
      ];

      const countResult = await emailTemplate.aggregate(countPipeline);
      total = countResult[0]?.total || 0;
    } else {
      // No search, use simple query with populate
      [data, total] = await Promise.all([
        emailTemplate
          .find(matchStage)
          .populate('template_name', 'template_name _id')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),

        emailTemplate.countDocuments(matchStage),
      ]);
    }

    return res.code(200).send({
      success: true,
      result: data,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      message: "Email templates fetched successfully",
    });
  } catch (error) {
    return res.code(400).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getEmailContent };