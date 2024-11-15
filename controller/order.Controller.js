const Order = require('../model/order.Model'); // Đảm bảo đường dẫn đúng

// Tạo đơn hàng mới
// exports.createOrder = async (req, res) => {
//     try {
//         const { userId, totalAmount, shippingAddress, paymentMethod, status, details } = req.body;

//         // Tạo đối tượng đơn hàng mới
//         const order = new Order({
//             userId,
//             totalAmount,
//             shippingAddress,
//             paymentMethod,
//             status,
//             details
//         });

//         // Lưu đơn hàng vào cơ sở dữ liệu
//         await order.save();
//         res.status(201).json(order);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };
// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { userId, totalAmount, shippingAddress, paymentMethod, status, details } = req.body;
        
        // Log the incoming details to check for the name field
        console.log('Order details:', details);

        const order = new Order({
            userId,
            totalAmount,
            shippingAddress,
            paymentMethod,
            status,
            details
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
    try {
        // Lấy tất cả đơn hàng từ cơ sở dữ liệu
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy đơn hàng theo ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        console.log('Fetched order:', order); // Check the details field
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật đơn hàng
exports.updateOrder = async (req, res) => {
    try {
        const { userId, totalAmount, shippingAddress, paymentMethod, status, details } = req.body;

        // Cập nhật đơn hàng theo ID
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                userId,
                totalAmount,
                shippingAddress,
                paymentMethod,
                status,
                details
            },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xóa đơn hàng
exports.deleteOrder = async (req, res) => {
    try {
        // Xóa đơn hàng theo ID
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getDeliveredOrders = async (req, res) => {
    try {
      const deliveredOrders = await Order.find({ status: 'delivered' });
      
      // Tính toán thống kê (ví dụ: tổng số đơn hàng và tổng số tiền)
      const totalOrders = deliveredOrders.length;
      const totalAmount = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
      res.json({
        totalOrders,
        totalAmount,
        deliveredOrders
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };