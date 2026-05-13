const { BrevoClient, BrevoError } = require("@getbrevo/brevo");

const updateBrevoContactEmail = async ({
  oldEmail,
  newEmail,
  firstname = "",
  lastname = "",
  listIds = [],
}) => {
  try {
    if (!newEmail) {
      return {
        success: false,
        message: "newEmail is required",
      };
    }

    const client = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY,
    });

    const attributes = {
      EMAIL: newEmail, // important for Brevo email change
      FIRSTNAME: firstname || "",
      LASTNAME: lastname || "",
      USERNAME: `${firstname || ""} ${lastname || ""}`.trim(),
    };

    // If old email exists and is different, try update first
    if (oldEmail && oldEmail !== newEmail) {
      try {
        await client.contacts.updateContact(oldEmail, {
          attributes,
        });

        return {
          success: true,
          message: "Brevo contact email updated successfully",
          action: "updated",
        };
      } catch (error) {
        const brevoMessage =
          error?.body?.message ||
          error?.response?.body?.message ||
          error?.message ||
          "";

        const brevoCode =
          error?.body?.code ||
          error?.response?.body?.code ||
          "";

        console.log("updateBrevoContactEmail Error:", error?.body || error?.response?.body || error.message);

        // If contact does not exist in Brevo, create it with new email
        if (
          brevoCode === "document_not_found" ||
          brevoMessage.toLowerCase().includes("contact does not exist")
        ) {
          await client.contacts.createContact({
            email: newEmail,
            updateEnabled: true,
            listIds: Array.isArray(listIds) ? listIds : [],
            attributes: {
              FIRSTNAME: firstname || "",
              LASTNAME: lastname || "",
              USERNAME: `${firstname || ""} ${lastname || ""}`.trim(),
            },
          });

          return {
            success: true,
            message: "Old Brevo contact not found, new contact created/updated successfully",
            action: "created",
          };
        }

        throw error;
      }
    }

    // If old email is same as new email, just upsert attributes on same email
    await client.contacts.createContact({
      email: newEmail,
      updateEnabled: true,
      listIds: Array.isArray(listIds) ? listIds : [],
      attributes: {
        FIRSTNAME: firstname || "",
        LASTNAME: lastname || "",
        USERNAME: `${firstname || ""} ${lastname || ""}`.trim(),
      },
    });

    return {
      success: true,
      message: "Brevo contact synced successfully",
      action: "upserted",
    };
  } catch (error) {
    if (error instanceof BrevoError) {
      return {
        success: false,
        message: error?.body?.message || error.message,
        error: error?.body || null,
      };
    }

    return {
      success: false,
      message: error?.message || "Failed to sync Brevo contact",
    };
  }
};

module.exports = { updateBrevoContactEmail };