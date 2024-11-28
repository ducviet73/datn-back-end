const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Order = require('../model/order.Model');
const User = require('../model/user.Model');
const orderController = require('../controller/order.Controller');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: "ncb301104@gmail.com",
        pass: "osqx ueqr ohiu ghmd",  // You should use environment variables for sensitive information
    },
});

// Ensure invoice directory exists
const invoicesDir = path.join(__dirname, '../invoices');
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
ensureDirectoryExists(invoicesDir);

// Create a new order and generate invoice
router.post('/', async (req, res) => {
    try {
        const orderDetails = req.body;
        const order = new Order(orderDetails);
        await order.save();

        // Initialize PDFDocument here
        const doc = new PDFDocument();
        const invoicePath = path.join(invoicesDir, `invoice-${order._id}.pdf`);
        doc.pipe(fs.createWriteStream(invoicePath));

        doc.fontSize(25).text('Hóa Đơn', { underline: true });
        doc.fontSize(12).text(`Mã Đơn Hàng: ${order._id}`);
        doc.text(`Tổng Số Tiền: ${orderDetails.totalAmount} đ`);
        doc.text(`Địa Chỉ Giao Hàng: ${orderDetails.shippingAddress.street}, ${orderDetails.shippingAddress.ward}, ${orderDetails.shippingAddress.district}, ${orderDetails.shippingAddress.city}`);
        doc.text(`Phương Thức Thanh Toán: ${orderDetails.paymentMethod}`);
        doc.text('Chi Tiết Đơn Hàng:');

        // List items in the order
        orderDetails.details.forEach((item, index) => {
            doc.text(`${index + 1}. Tên Sản Phẩm: ${item.name}, Số Lượng: ${item.quantity}, Giá: ${item.price}`);
        });

        // Finalize the PDF
        doc.end();

        // After the PDF is finished, send the email
        doc.on('finish', async () => {
            // Read the generated invoice file
            fs.readFile(invoicePath, (err, data) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to read the invoice file' });
                }

                // Send the PDF as a response with the correct headers for download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
                res.send(data);
            });

            // Send email with invoice
            const user = await User.findById(orderDetails.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const mailOptions = {
                from: "ncb301104@gmail.com",
                to: user.email,
                subject: 'Order Confirmation',
                text: `Thank you for your order! Your order ID is ${order._id}.`,
                attachments: [
                    {
                        filename: `invoice-${order._id}.pdf`,
                        path: invoicePath,
                    },
                ],
            };

            try {
                await transporter.sendMail(mailOptions);
                res.status(201).json({ message: 'Order placed successfully, email sent!' });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                res.status(500).json({ error: 'Failed to send email' });
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all orders
router.get('/', orderController.getAllOrders);

// Get a single order by ID
router.get('/:id', orderController.getOrderById);

// Update an order
router.put('/:id', orderController.updateOrder);

// Delete an order
router.delete('/:id', orderController.deleteOrder);

// Get orders by user ID
router.get('/delivered', async (req, res) => {
    try {
        const deliveredOrders = await Order.find({ status: 'delivered' });
        res.json(deliveredOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching delivered orders', error });
    }
});

// Get total orders
router.get('/total-orders', async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();  // Đếm tổng số đơn hàng trong cơ sở dữ liệu
        res.json({ totalOrders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Đã xảy ra lỗi khi tính tổng đơn hàng." });
    }
});

// Get total income from delivered orders
router.get('/incomes/total', async (req, res) => {
    try {
        const totalIncome = await Order.aggregate([
            { $match: { status: 'delivered' } }, // Lọc các đơn hàng đã giao
            { $group: { _id: null, total: { $sum: "$totalAmount" } } } // Tính tổng doanh thu
        ]);

        res.json({ total: totalIncome[0]?.total || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching total income', error });
    }
});

// Get orders by status
router.get('/status/:status', async (req, res) => {
    const { status } = req.params;
    try {
        const orders = await Order.find({ status });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders by status', error });
    }
});

// Get orders by date
router.get('/date/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const orders = await Order.find({
            createdAt: {
                $gte: new Date(date),
                $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders by date', error });
    }
});

// Get total count of orders
router.get('/count', async (req, res) => {
    try {
        const count = await Order.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users count', error });
    }
});

module.exports = router;
