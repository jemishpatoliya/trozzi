import express from 'express';
import { SupportTicketModel } from '../models/supportTicket';

const router = express.Router();

// GET /api/support/all - Get all support tickets (admin only)
router.get('/all', async (req, res) => {
  try {
    const {
      status,
      userId,
      category,
      priority,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const tickets = await SupportTicketModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .exec();

    const total = await SupportTicketModel.countDocuments(filter);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/support/user/:userId - Get support tickets for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const tickets = await SupportTicketModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .exec();

    const total = await SupportTicketModel.countDocuments({ userId });

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user support tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/support/ticket/:ticketId - Get single support ticket details
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await SupportTicketModel.findOne({ ticketId });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/support/ticket - Create new support ticket
router.post('/ticket', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      category,
      orderId,
      subject,
      message,
      priority = 'medium'
    } = req.body;

    if (!userId || !userEmail || !userName || !category || !message) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }

    // Generate unique ticket ID
    const ticketId = `TKT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newTicket = new SupportTicketModel({
      ticketId,
      userId,
      userEmail,
      userName,
      category,
      orderId,
      subject,
      message,
      priority,
      status: 'open'
    });

    const savedTicket = await newTicket.save();

    res.status(201).json({
      success: true,
      data: savedTicket,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/support/:ticketId/reply - Reply to a support ticket (admin only)
router.put('/:ticketId/reply', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, adminId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const ticket = await SupportTicketModel.findOne({ ticketId });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Add reply to replies array
    const reply = {
      message,
      repliedBy: adminId || 'admin',
      repliedAt: new Date().toISOString(),
      isAdmin: true
    };

    const updatedTicket = await SupportTicketModel.findOneAndUpdate(
      { ticketId },
      { 
        $set: {
          adminReply: message,
          status: ticket.status === 'open' ? 'in_progress' : ticket.status,
          lastReplyBy: 'admin',
          $push: { replies: reply },
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedTicket,
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Error replying to support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reply to support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/support/:ticketId/status - Update ticket status (admin only)
router.put('/:ticketId/status', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const ticket = await SupportTicketModel.findOne({ ticketId });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Add resolved timestamp if status is resolved
    if (status === 'resolved') {
      updateData.resolvedAt = new Date().toISOString();
    }

    const updatedTicket = await SupportTicketModel.findOneAndUpdate(
      { ticketId },
      { $set: updateData },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedTicket,
      message: 'Ticket status updated successfully'
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/support/:ticketId/close - Close ticket (admin only)
router.put('/:ticketId/close', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicketModel.findOne({ ticketId });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const updatedTicket = await SupportTicketModel.findOneAndUpdate(
      { ticketId },
      { 
        $set: {
          status: 'closed',
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedTicket,
      message: 'Ticket closed successfully'
    });
  } catch (error) {
    console.error('Error closing support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/support/:ticketId - Delete ticket (admin only)
router.delete('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicketModel.findOneAndDelete({ ticketId });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
