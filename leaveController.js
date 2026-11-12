
import Leave from "../models/Leave.js";
import User from "../models/User.js";

const calculateDays = (start, end) => {
  const from = new Date(start);
  const to = new Date(end);

  from.setUTCHours(0, 0, 0, 0);
  to.setUTCHours(0, 0, 0, 0);

  return Math.round((to - from) / 86400000) + 1;
};

export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const days = calculateDays(startDate, endDate);

    if (!leaveType || !startDate || !endDate || !reason || days <= 0) {
      return res.status(400).json({
        message: "Enter valid leave details"
      });
    }

    if (!["CL", "SL", "EL"].includes(leaveType)) {
      return res.status(400).json({
        message: "Invalid leave type"
      });
    }

    const user = await User.findById(req.user._id);

    if (days > user.leaveBalance[leaveType]) {
      return res.status(400).json({
        message: "Insufficient leave balance"
      });
    }

    const overlapping = await Leave.findOne({
      employee: user._id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    });

    if (overlapping) {
      return res.status(400).json({
        message: "An existing leave overlaps these dates"
      });
    }

    const leave = await Leave.create({
      employee: user._id,
      leaveType,
      startDate,
      endDate,
      days,
      reason
    });

    res.status(201).json({
      message: "Leave applied successfully",
      leave
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employee: req.user._id
    }).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("employee", "name email employeeId department")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid leave status"
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found"
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        message: "This request has already been processed"
      });
    }

    const user = await User.findById(leave.employee);

    if (status === "Approved") {
      const balance = user.leaveBalance[leave.leaveType];

      if (balance < leave.days) {
        return res.status(400).json({
          message: "Employee has insufficient leave balance"
        });
      }

      user.leaveBalance[leave.leaveType] -= leave.days;
      await user.save();
    }

    leave.status = status;
    leave.adminComment = adminComment || "";
    await leave.save();

    res.json({
      message: `Leave ${status.toLowerCase()} successfully`,
      leave
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      employee: req.user._id
    });

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found"
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending requests can be cancelled"
      });
    }

    await leave.deleteOne();

    res.json({ message: "Leave request cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
