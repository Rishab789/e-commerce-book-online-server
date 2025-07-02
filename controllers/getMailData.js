const nodemailer = require("nodemailer");

////////////////////////   Node Mailer   /////////////////////

const transport = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "beraprakash456@gmail.com",
    pass: "nslyqjbhmesqtwez",
  },
});

function sendMail(to, sub, Message) {
  transport.sendMail({
    to: to,
    subject: sub,
    html: Message,
  });
}

exports.getMail = async (req, res) => {
  try {
    const data = req.body;
    const { email } = data;
    console.log("Received data:", data);

    // Process the data as needed

    const subject = `Message from This is the demo subject`;
    const htmlMessage = `
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> This is The email</p>
        `;

    // Call the sendMail function with extracted values
    await sendMail(email, subject, htmlMessage);
    res.json({ message: "Email sent successfully" });
  } catch (error) {
    return res.status(400).json({
      error: "error while creating post",
    });
  }
};
