
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
        pass:"osqx ueqr ohiu ghmd"
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

        // Generate invoice PDF
        const doc = new PDFDocument();
        const invoicePath = path.join(invoicesDir, `invoice-${order._id}.pdf`);
        doc.pipe(fs.createWriteStream(invoicePath));

        doc.fontSize(25).text('Hóa Đơn', { underline: true });
        doc.fontSize(12).text(`Mã Đơn Hàng: ${order._id}`);
        doc.text(`Tổng Số Tiền: ${orderDetails.totalAmount} đ`);
        doc.text(`Địa Chỉ Giao Hàng: ${orderDetails.shippingAddress.street}, ${orderDetails.shippingAddress.ward}, ${orderDetails.shippingAddress.district}, ${orderDetails.shippingAddress.city}`);
        doc.text(`Phương Thức Thanh Toán: ${orderDetails.paymentMethod}`);
        doc.text('Chi Tiết Đơn Hàng:');

        orderDetails.details.forEach((item, index) => {
            doc.text(`${index + 1}. Tên Sản Phẩm: ${item.name}, Số Lượng: ${item.quantity}, Giá: ${item.price}`);
        });

        doc.end();

        // Send email with invoice
        const user = await User.findById(orderDetails.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const mailOptions = {
            from:" ncb301104@gmail.com",
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

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: 'Order placed successfully!' });
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
router.get('/delivered', async (req, res) => {
    try {
        const deliveredOrders = await Order.find({ status: 'delivered' });
        res.json(deliveredOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching delivered orders', error });
    }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const orders = await Order.find({ userId }).exec();
        if (!orders.length) {
            return res.status(404).json({ error: 'Orders not found' });
        }
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
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

// Update order status
router.put('/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        order.status = status;
        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/status/:status', async (req, res) => {
    const { status } = req.params;
    try {
        const orders = await Order.find({ status });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders by status', error });
    }
});
router.get('/date/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const orders = await Order.find({ createdAt: { $gte: new Date(date), $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) } });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders by date', error });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await Order.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users count', error });
    }
});

module.exports = router;
