const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userController = require('../controller/user.Controller');
const User = require('../model/user.Model');

// Đăng ký người dùng
router.post('/register', async (req, res) => {
    const { username, password, email, phone, address, role } = req.body;
    try {
        const newUser = await userController.registerUser(username, password, email, phone, address, role);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Đăng nhập người dùng
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { token, user } = await userController.loginUser(email, password);
        res.status(200).json({
            user,
            token,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users count', error });
    }
});
// Lấy tất cả người dùng
router.get('/', userController.getAllUsers);

// Lấy thông tin người dùng theo ID
router.get('/:id', userController.getUserById);

// Thêm người dùng mới
router.post('/', userController.createUser);

// Cập nhật thông tin người dùng
router.put('/:id', userController.updateUser);

// Xóa người dùng
router.delete('/:id', userController.deleteUser);
//Kiểm tra token qua Bearer
router.get('/checktoken', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token provided or incorrect format" });
        }

        const token = authHeader.split(' ')[1];

        // Xác thực token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Token không hợp lệ" });
            }

            // Token hợp lệ, trả về thông tin
            res.status(200).json({ message: "Token hợp lệ", user: decoded });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


router.get('/detailuser', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token không hợp lệ" });
        }
        try {
            const userInfo = await userController.getUserByEmail(decoded.email);
            if (userInfo) {
                res.status(200).json(userInfo);
            } else {
                res.status(404).json({ message: "Không tìm thấy user" });
            }
        } catch (err) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    });
});

module.exports = router;
