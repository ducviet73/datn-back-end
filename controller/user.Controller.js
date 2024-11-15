const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user.Model');

// Đăng ký người dùng
async function registerUser(username, password, email, phone, address, role) {
    try {
        // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error("Người dùng đã tồn tại.");
        }

        // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo một đối tượng người dùng mới
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            phone,
            address,
            role
        });

        // Lưu người dùng vào cơ sở dữ liệu
        const savedUser = await newUser.save();
        return savedUser;
    } catch (error) {
        throw error;
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// Đăng nhập người dùng
async function loginUser(email, password) {
    try {
        // Tìm người dùng theo email
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Email hoặc mật khẩu không chính xác.');
        }

        // So sánh mật khẩu văn bản thuần với mật khẩu đã băm
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Email hoặc mật khẩu không chính xác.');
        }

        // Tạo token JWT
        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // Trả về thông tin người dùng và token
        return {
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt,
            },
        };
    } catch (error) {
        throw error; // Đẩy lỗi ra ngoài để xử lý ở nơi gọi hàm
    }

};


// Lấy tất cả người dùng
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "Người dùng không tìm thấy" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm người dùng mới
const createUser = async (req, res) => {
    const { username, password, email, phone, address, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashedPassword,
            email,
            phone,
            address,
            role
        });

        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "Người dùng không tìm thấy" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xóa người dùng
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (user) {
            res.json({ message: "Người dùng đã bị xóa" });
        } else {
            res.status(404).json({ message: "Người dùng không tìm thấy" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
async function getUserByEmail(email) {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    registerUser,
    loginUser,
    getUserByEmail
};
