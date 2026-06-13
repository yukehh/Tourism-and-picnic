import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOrderConfirmationEmail = async (order) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email configuration missing. Skipping order confirmation email.');
    return;
  }

  const { customer, orderId, items, financials } = order;

  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} ${item.color !== 'all' ? `(${item.color})` : ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">BDT ${item.price}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #6B705C;">Order Confirmation from WarmHut</h2>
      <p>Hello <strong>${customer.name}</strong>,</p>
      <p>Thank you for shopping with WarmHut! We have received your order <strong>#${orderId}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f9f9f9;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #6B705C;">Item</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #6B705C;">Qty</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #6B705C;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>Subtotal:</strong> BDT ${financials.subtotal}</p>
        <p style="margin: 5px 0;"><strong>Delivery:</strong> BDT ${financials.deliveryFee}</p>
        <h3 style="margin: 10px 0 0 0; color: #6B705C;">Total: BDT ${financials.total}</h3>
      </div>
      
      <p style="margin-top: 20px;">Your order will be shipped to:</p>
      <address style="font-style: normal; background-color: #f1f1f1; padding: 10px; border-radius: 5px;">
        ${customer.address}<br>
        ${customer.city}<br>
        Phone: ${customer.phone}
      </address>
      
      <p style="margin-top: 20px; font-size: 12px; color: #777;">If you have any questions, reply to this email or contact us at 01715825331.</p>
    </div>
  `;

  const mailOptions = {
    from: `"WarmHut" <${process.env.SMTP_USER}>`,
    to: customer.email,
    subject: `WarmHut Order Confirmation - #${orderId}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${customer.email}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

export const sendOrderStatusEmail = async (order) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email configuration missing. Skipping status update email.');
    return;
  }

  const { customer, orderId, status } = order;

  let message = '';
  if (status === 'Shipped') {
    message = 'Great news! Your order has been shipped and is on its way to you.';
  } else if (status === 'Delivered') {
    message = 'Your order has been successfully delivered! We hope you love your new winter wear.';
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #6B705C;">WarmHut Order Update</h2>
      <p>Hello <strong>${customer.name}</strong>,</p>
      <p>The status of your order <strong>#${orderId}</strong> has been updated to: <strong style="color: #6B705C; font-size: 18px;">${status}</strong></p>
      <p>${message}</p>
      <p style="margin-top: 30px;">Thank you for shopping with WarmHut!</p>
    </div>
  `;

  const mailOptions = {
    from: `"WarmHut Update" <${process.env.SMTP_USER}>`,
    to: customer.email,
    subject: `Your WarmHut Order #${orderId} is ${status}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order status email sent to ${customer.email}`);
  } catch (error) {
    console.error('Error sending order status email:', error);
  }
};

export const sendContactNotificationEmail = async (contact) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email configuration missing. Skipping contact notification email.');
    return;
  }

  const { name, email, subject, message } = contact;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #6B705C;">New Contact Message</h2>
      <p>You have received a new message from the WarmHut contact form.</p>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
      </div>
      
      <h3 style="margin-top: 20px; color: #6B705C;">Message:</h3>
      <p style="background-color: #f1f1f1; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #777;">This is an automated notification from WarmHut.</p>
    </div>
  `;

  const mailOptions = {
    from: `"WarmHut System" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER, // Send to the admin's email
    replyTo: email,
    subject: `New Contact Form Submission: ${subject}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Contact notification email sent to admin`);
  } catch (error) {
    console.error('Error sending contact notification email:', error);
  }
};
