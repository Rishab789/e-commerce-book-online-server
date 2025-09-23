const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
const eBookModel = require("./../models/eBooks");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

// Configure AWS S3 client with error handling
const createS3Client = () => {
  try {
    if (
      !process.env.AWS_REGION ||
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY
    ) {
      throw new Error("Missing required AWS environment variables");
    }

    return new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  } catch (error) {
    console.error("❌ Error creating S3 client:", error);
    throw error;
  }
};

const s3 = createS3Client();

// Configure email transporter with validation
const createTransporter = () => {
  try {
    if (!process.env.MY_EMAIL || !process.env.MY_PASSWORD) {
      throw new Error("Missing email credentials in environment variables");
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD, // Should be App Password for Gmail
      },
    });
  } catch (error) {
    console.error("❌ Error creating email transporter:", error);
    throw error;
  }
};

/**
 * Generate signed URL for S3 object
 */
const generateSignedS3Url = async (s3Key, expiresIn = 60 * 60 * 24) => {
  try {
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error("S3_BUCKET_NAME environment variable is not set");
    }

    if (!s3Key) {
      throw new Error("S3 key is required");
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ResponseContentDisposition: "attachment",
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn });

    if (!signedUrl) {
      throw new Error("Failed to generate signed URL");
    }

    return signedUrl;
  } catch (error) {
    console.error("❌ Error generating signed URL:", error.message);
    throw new Error(`Failed to generate download link: ${error.message}`);
  }
};

/**
 * Format file size to human readable format
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Send eBook download email to customer
 */
const sendDownloadEmail = async (
  toEmail,
  customerName,
  ebookItems,
  orderId
) => {
  try {
    if (!toEmail || !customerName || !Array.isArray(ebookItems) || !orderId) {
      throw new Error("Missing required parameters for sending email");
    }

    const transporter = createTransporter();

    // Test connection before sending
    await transporter.verify();

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: toEmail,
      subject: `Your eBook Download Links - Order #${orderId}`,
      html: generateEmailTemplate(customerName, ebookItems, orderId),
      text: generateTextEmail(customerName, ebookItems, orderId),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Download email sent to ${toEmail}, MessageId: ${result.messageId}`
    );
    return result;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error(`Failed to send download email: ${error.message}`);
  }
};

/**
 * Generate HTML email template
 */
const generateEmailTemplate = (customerName, ebookLinks, orderId) => {
  if (!Array.isArray(ebookLinks)) {
    ebookLinks = [];
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: white; border: 1px solid #dee2e6; border-top: none; }
        .ebook { margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff; }
        .button { 
          display: inline-block; 
          padding: 10px 20px; 
          background-color: #007bff; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 10px;
          font-weight: bold;
        }
        .footer { 
          margin-top: 30px; 
          padding: 20px; 
          background-color: #f8f9fa; 
          text-align: center; 
          font-size: 12px; 
          color: #6c757d;
          border-radius: 0 0 5px 5px;
          border: 1px solid #dee2e6;
          border-top: none;
        }
        .expiry-note { 
          background-color: #fff3cd; 
          color: #856404; 
          padding: 10px; 
          border-radius: 5px; 
          margin: 15px 0; 
          border-left: 4px solid #ffc107;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Thank You for Your Purchase!</h1>
      </div>
      
      <div class="content">
        <p>Dear ${customerName || "Customer"},</p>
        <p>Thank you for your order <strong>#${orderId}</strong>. Your eBook(s) are ready for download.</p>
        
        <div class="expiry-note">
          <p><strong>Important:</strong> These download links will expire in 24 hours.</p>
        </div>
        
        <h2>Your eBook(s):</h2>
        
        ${ebookLinks
          .map(
            (ebook) => `
          <div class="ebook">
            <h3>${ebook.title || "Unknown Title"} by ${
              ebook.author || "Unknown Author"
            }</h3>
            <p>Format: ${ebook.format || "PDF"} | File Size: ${
              ebook.fileSize || "Unknown"
            }</p>
            <a href="${ebook.downloadUrl}" class="button">Download eBook</a>
            <p><small>Link expires: ${ebook.expiresIn || "24 hours"}</small></p>
          </div>
        `
          )
          .join("")}
        
        <p>If you have any issues with your download, please reply to this email or contact our support team.</p>
        
        <p>Happy reading!<br>The ${
          process.env.COMPANY_NAME || "eBook Store"
        } Team</p>
      </div>
      
      <div class="footer">
        <p>This is an automated message, please do not reply directly to this email.</p>
        <p>© ${new Date().getFullYear()} ${
    process.env.COMPANY_NAME || "eBook Store"
  }. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text email
 */
const generateTextEmail = (customerName, ebookLinks, orderId) => {
  if (!Array.isArray(ebookLinks)) {
    ebookLinks = [];
  }

  let text = `Thank You for Your Purchase!\n\n`;
  text += `Dear ${customerName || "Customer"},\n\n`;
  text += `Thank you for your order #${orderId}. Your eBook(s) are ready for download.\n\n`;
  text += `IMPORTANT: These download links will expire in 24 hours.\n\n`;
  text += `Your eBook(s):\n\n`;

  ebookLinks.forEach((ebook) => {
    text += `- ${ebook.title || "Unknown Title"} by ${
      ebook.author || "Unknown Author"
    }\n`;
    text += `  Format: ${ebook.format || "PDF"} | File Size: ${
      ebook.fileSize || "Unknown"
    }\n`;
    text += `  Download: ${ebook.downloadUrl}\n`;
    text += `  Expires: ${ebook.expiresIn || "24 hours"}\n\n`;
  });

  text += `If you have any issues with your download, please contact our support team.\n\n`;
  text += `Happy reading!\n`;
  text += `The ${process.env.COMPANY_NAME || "eBook Store"} Team\n\n`;
  text += `© ${new Date().getFullYear()} ${
    process.env.COMPANY_NAME || "eBook Store"
  }. All rights reserved.\n`;

  return text;
};

/**
 * Main function to deliver eBooks to customer
 */
const deliverEbooks = async (customer, ebookItems, orderId) => {
  try {
    // Validate input parameters
    if (!customer || !customer.email) {
      throw new Error("Customer information is missing or invalid");
    }

    if (!Array.isArray(ebookItems)) {
      throw new Error("eBook items must be an array");
    }

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log(
      `📧 Starting eBook delivery for order ${orderId} to ${customer.email}`
    );
    console.log("📦 eBook items received:", ebookItems);

    if (ebookItems.length === 0) {
      console.log("⚠️ No eBook items provided for delivery");
      return {
        success: true,
        delivered: 0,
        message: "No eBooks in this order",
        orderId: orderId,
      };
    }

    // Validate eBooks exist before processing
    const ebookValidation = await Promise.all(
      ebookItems.map(async (item) => {
        try {
          if (!item.productId) {
            return {
              productId: "unknown",
              exists: false,
              title: "Unknown",
              hasS3Key: false,
              error: "Missing productId",
            };
          }

          const ebook = await eBookModel.findById(item.productId);
          return {
            productId: item.productId,
            exists: !!ebook,
            title: ebook?.title || "Unknown",
            hasS3Key: !!ebook?.s3Key,
            error: !ebook
              ? "eBook not found"
              : !ebook.s3Key
              ? "S3 key missing"
              : null,
          };
        } catch (error) {
          console.error(`Error validating eBook ${item.productId}:`, error);
          return {
            productId: item.productId,
            exists: false,
            title: "Unknown",
            hasS3Key: false,
            error: error.message,
          };
        }
      })
    );

    console.log("🔍 eBook validation results:", ebookValidation);

    const invalidEbooks = ebookValidation.filter(
      (ebook) => !ebook.exists || !ebook.hasS3Key
    );
    if (invalidEbooks.length > 0) {
      console.error("❌ Invalid eBooks found:", invalidEbooks);
      const errorDetails = invalidEbooks
        .map((ebook) => `${ebook.productId}: ${ebook.error}`)
        .join(", ");
      throw new Error(`Invalid eBooks found: ${errorDetails}`);
    }

    // Generate signed URLs for each eBook
    const ebookDownloads = await Promise.all(
      ebookItems.map(async (item) => {
        try {
          console.log(`🔍 Looking up eBook in database: ${item.productId}`);
          const ebook = await eBookModel.findById(item.productId);

          if (!ebook) {
            throw new Error(`eBook not found: ${item.productId}`);
          }

          console.log(`✅ Found eBook: ${ebook.title}`);

          if (!ebook.s3Key) {
            throw new Error(`S3 key not found for eBook: ${ebook.title}`);
          }

          console.log(`🔗 Generating signed URL for: ${ebook.title}`);
          const signedUrl = await generateSignedS3Url(ebook.s3Key);
          console.log(`✅ Generated signed URL for: ${ebook.title}`);

          return {
            title: ebook.title,
            author: ebook.author,
            downloadUrl: signedUrl,
            format: ebook.format || "PDF",
            fileSize: formatFileSize(ebook.fileSize) || "Unknown",
            expiresIn: "24 hours",
          };
        } catch (error) {
          console.error(`❌ Error processing eBook ${item.productId}:`, error);
          throw new Error(
            `Failed to process eBook ${item.productId}: ${error.message}`
          );
        }
      })
    );

    // Send email with download links
    console.log(`📧 Sending email to ${customer.email}`);
    await sendDownloadEmail(
      customer.email,
      customer.firstName,
      ebookDownloads,
      orderId
    );

    console.log(
      `✅ eBooks delivered for order ${orderId} to ${customer.email}`
    );

    return {
      success: true,
      delivered: ebookDownloads.length,
      orderId: orderId,
      emailSent: true,
      deliveredItems: ebookDownloads.map((ebook) => ({
        title: ebook.title,
        author: ebook.author,
      })),
    };
  } catch (error) {
    console.error("❌ Error delivering eBooks:", error.message);
    throw new Error(`eBook delivery failed: ${error.message}`);
  }
};

/**
 * Upload eBook to S3
 */
async function uploadEbookToS3(file, title) {
  try {
    // Validate inputs
    if (!file) {
      throw new Error("File is required");
    }

    if (!file.buffer) {
      throw new Error("File buffer is undefined");
    }

    if (!title) {
      throw new Error("Title is required");
    }

    if (!process.env.S3_BUCKET_NAME) {
      throw new Error("S3_BUCKET_NAME environment variable is not set");
    }

    const fileExtension = file.originalname
      ? file.originalname.split(".").pop()
      : "pdf";
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const s3Key = `ebooks/${sanitizedTitle}-${uuidv4()}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/pdf",
      Metadata: {
        "original-filename": file.originalname || "unknown",
        "uploaded-at": new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    console.log(`✅ eBook uploaded to S3: ${s3Key}`);

    return {
      s3Key: s3Key,
      fileSize: formatFileSize(file.size),
      format: fileExtension.toUpperCase(),
      bucket: process.env.S3_BUCKET_NAME,
    };
  } catch (error) {
    console.error("❌ S3 upload failed:", error.message);
    throw new Error(`eBook upload to S3 failed: ${error.message}`);
  }
}

module.exports = {
  deliverEbooks,
  generateSignedS3Url,
  sendDownloadEmail,
  uploadEbookToS3,
  formatFileSize,
};
