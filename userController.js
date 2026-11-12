
import User from "../models/User.js";

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const bcrypt = await import("bcryptjs");
    const { name, email, password, department, employeeId } = req.body;

    if (!name || !email || !password || !employeeId) {
      return res.status(400).json({
        message: "Name, email, password and employee ID are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const exists = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (exists) {
      return res.status(409).json({
        message: "Email or employee ID already exists"
      });
    }

    const employee = await User.create({
      name,
      email,
      password: await bcrypt.default.hash(password, 12),
      department,
      employeeId,
      role: "employee"
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        department: employee.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, role: "employee" },
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json({
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findOneAndDelete({
      _id: req.params.id,
      role: "employee"
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
