const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
const eBookModel = require("./../models/eBooks"); // Adjust path as needed
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Generate signed URL for S3 object
 * @param {String} s3Key - The S3 object key
 * @param {Number} expiresIn - Expiration time in seconds (default: 24 hours)
 * @returns {Promise<String>} - Signed URL
 */
const generateSignedS3Url = async (s3Key, expiresIn = 60 * 60 * 24) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ResponseContentDisposition: "attachment",
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate download link");
  }
};
/**
 * Send eBook download email to customer
 * @param {String} toEmail - Customer email
 * @param {String} customerName - Customer name
 * @param {Array} ebookItems - eBook items with download links
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} - Email sending result
 */
const sendDownloadEmail = async (
  toEmail,
  customerName,
  ebookItems,
  orderId
) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toEmail,
    subject: `Your eBook Download Links - Order #${orderId}`,
    html: generateEmailTemplate(customerName, ebookItems, orderId),
    // Optional: Text version for email clients that don't support HTML
    text: generateTextEmail(customerName, ebookItems, orderId),
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Download email sent to ${toEmail}`);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send download email");
  }
};

/**
 * Generate HTML email template
 */
const generateEmailTemplate = (customerName, ebookLinks, orderId) => {
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
        <p>Dear ${customerName},</p>
        <p>Thank you for your order <strong>#${orderId}</strong>. Your eBook(s) are ready for download.</p>
        
        <div class="expiry-note">
          <p><strong>Important:</strong> These download links will expire in 24 hours.</p>
        </div>
        
        <h2>Your eBook(s):</h2>
        
        ${ebookLinks
          .map(
            (ebook) => `
          <div class="ebook">
            <h3>${ebook.title} by ${ebook.author}</h3>
            <p>Format: ${ebook.format} | File Size: ${ebook.fileSize}</p>
            <a href="${ebook.downloadUrl}" class="button">Download eBook</a>
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
 * Generate plain text email for clients that don't support HTML
 */
const generateTextEmail = (customerName, ebookLinks, orderId) => {
  let text = `Thank You for Your Purchase!\n\n`;
  text += `Dear ${customerName},\n\n`;
  text += `Thank you for your order #${orderId}. Your eBook(s) are ready for download.\n\n`;
  text += `IMPORTANT: These download links will expire in 24 hours.\n\n`;
  text += `Your eBook(s):\n\n`;

  ebookLinks.forEach((ebook) => {
    text += `- ${ebook.title} by ${ebook.author}\n`;
    text += `  Format: ${ebook.format} | File Size: ${ebook.fileSize}\n`;
    text += `  Download: ${ebook.downloadUrl}\n\n`;
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
 * @param {Object} customer - Customer information
 * @param {Array} ebookItems - eBook items from order
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} - Delivery result
 */
const deliverEbooks = async (customer, ebookItems, orderId) => {
  try {
    // Generate signed URLs for each eBook
    const ebookDownloads = await Promise.all(
      ebookItems.map(async (item) => {
        // Get eBook details from database
        const ebook = await eBookModel.findById(item.productId);
        if (!ebook) {
          throw new Error(`eBook not found: ${item.productId}`);
        }

        const signedUrl = await generateSignedS3Url(ebook.s3Key);
        return {
          title: ebook.title,
          author: ebook.author,
          downloadUrl: signedUrl,
          format: ebook.format,
          fileSize: ebook.fileSize,
          expiresIn: "24 hours",
        };
      })
    );

    // Send email with download links
    await sendDownloadEmail(
      customer.email,
      customer.firstName,
      ebookDownloads,
      orderId
    );

    // Log delivery success (you might want to store this in your database)
    console.log(`eBooks delivered for order ${orderId} to ${customer.email}`);

    return {
      success: true,
      delivered: ebookDownloads.length,
      orderId: orderId,
    };
  } catch (error) {
    console.error("Error delivering eBooks:", error);
    throw error;
  }
};

// Update uploadEbookToS3 function
async function uploadEbookToS3(file, title) {
  try {
    if (!file.buffer) {
      throw new Error("File buffer is undefined");
    }

    const fileExtension = file.originalname.split(".").pop();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const s3Key = `ebooks/${sanitizedTitle}-${uuidv4()}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    return {
      s3Key: s3Key,
      fileSize: formatFileSize(file.size),
      format: fileExtension.toUpperCase(),
    };
  } catch (error) {
    console.error("S3 upload failed:", error);
    throw new Error("eBook upload to S3 failed");
  }
}

module.exports = {
  deliverEbooks,
  generateSignedS3Url,
  sendDownloadEmail,
  uploadEbookToS3,
};
