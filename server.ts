import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { DB } from './src/db.js';
import { User, Complaint, ChatMessage, Feedback, UserRole, ComplaintCategory, ComplaintStatus } from './src/types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secure_default_complaint_registration_jwt_secret_token';

app.use(express.json());

// --- CORS Middleware (Open for Vercel deployment) ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// --- Authentication Middleware ---
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    category?: ComplaintCategory;
  };
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Authentication token is required', code: 'NO_TOKEN' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        return;
      }
      res.status(403).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
      return;
    }
    req.user = decoded as { id: string; name: string; email: string; role: UserRole; category?: ComplaintCategory };
    next();
  });
}

// --- Request Validation Helpers ---
function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// --- API ROUTES ---

// 1. Auth Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role, category } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required', code: 'INVALID_NAME' });
      return;
    }
    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: 'A valid email address is required', code: 'INVALID_EMAIL' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters', code: 'WEAK_PASSWORD' });
      return;
    }

    const existingUser = DB.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists', code: 'USER_EXISTS' });
      return;
    }

    const validRoles: UserRole[] = ['USER', 'AGENT', 'ADMIN'];
    const userRole: UserRole = role && validRoles.includes(role) ? role : 'USER';

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: userRole,
      createdAt: new Date().toISOString()
    };

    if (userRole === 'AGENT' && category) {
      newUser.category = category as ComplaintCategory;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    DB.addUser(newUser, passwordHash);

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, category: newUser.category },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 2. Auth Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required', code: 'MISSING_CREDENTIALS' });
      return;
    }

    const userWithHash = DB.findUserByEmail(email);
    if (!userWithHash) {
      res.status(401).json({ error: 'Invalid email or password', code: 'AUTH_FAILED' });
      return;
    }

    const passwordIsValid = bcrypt.compareSync(password, userWithHash.passwordHash);
    if (!passwordIsValid) {
      res.status(401).json({ error: 'Invalid email or password', code: 'AUTH_FAILED' });
      return;
    }

    const user: User = {
      id: userWithHash.id,
      name: userWithHash.name,
      email: userWithHash.email,
      role: userWithHash.role,
      category: userWithHash.category,
      createdAt: userWithHash.createdAt
    };

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, category: user.category },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 3. Get Auth User (Me)
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
      return;
    }
    const userDetails = DB.findUserById(req.user.id);
    if (!userDetails) {
      res.status(404).json({ error: 'User session not found', code: 'USER_NOT_FOUND' });
      return;
    }
    res.json({
      user: {
        id: userDetails.id,
        name: userDetails.name,
        email: userDetails.email,
        role: userDetails.role,
        category: userDetails.category,
        createdAt: userDetails.createdAt
      }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 4. Get List of Complaints with dynamic filter based on role
app.get('/api/complaints', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const creator = req.user!;
    
    // Lookup fresh user fields directly from database to prevent dependency on stale JWT contents
    const dbUser = DB.findUserById(creator.id);
    const userRole = dbUser ? dbUser.role : creator.role;
    const userCategory = dbUser ? dbUser.category : creator.category;
    
    const allComplaints = DB.getComplaints();

    // Role Filtering logic
    if (userRole === 'ADMIN') {
      res.json(allComplaints);
    } else if (userRole === 'AGENT') {
      // Return complaints assigned to agent, or unassigned complaints in their specific category
      const agentCategory = userCategory;
      const complaintsForAgent = allComplaints.filter(c => 
        c.agentId === creator.id || 
        (c.category === agentCategory && c.status === 'Pending')
      );
      res.json(complaintsForAgent);
    } else {
      // Standard User: return only their submitted complaints
      const userComplaints = allComplaints.filter(c => c.userId === creator.id);
      res.json(userComplaints);
    }
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 5. Submit a Complaint
app.post('/api/complaints', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const creator = req.user!;
    if (creator.role !== 'USER') {
      res.status(403).json({ error: 'Only registered users can submit complaints', code: 'FORBIDDEN' });
      return;
    }

    const { title, description, category, location } = req.body;
    if (!title || !description || !category || !location) {
      res.status(400).json({ error: 'Title, description, category, and location are required', code: 'MISSING_FIELDS' });
      return;
    }

    const validCategories: ComplaintCategory[] = ['Water', 'Roads', 'Electricity', 'Waste Management'];
    if (!validCategories.includes(category as ComplaintCategory)) {
      res.status(400).json({ error: 'Invalid complaint category chosen', code: 'INVALID_CATEGORY' });
      return;
    }

    const newComplaint: Complaint = {
      id: 'comp_' + Math.random().toString(36).substr(2, 9),
      userId: creator.id,
      userName: creator.name,
      title: title.trim(),
      description: description.trim(),
      category: category as ComplaintCategory,
      location: location.trim(),
      status: 'Pending',
      agentId: null,
      agentName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      feedback: null,
      chat: []
    };

    DB.addComplaint(newComplaint);
    res.status(201).json(newComplaint);
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 6. Get Single Complaint Details
app.get('/api/complaints/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaint = DB.getComplaintById(req.params.id);

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }

    // Authorize view permissions
    if (user.role === 'USER' && complaint.userId !== user.id) {
      res.status(403).json({ error: 'Access denied to this complaint', code: 'FORBIDDEN' });
      return;
    }
    if (user.role === 'AGENT' && complaint.agentId !== user.id && complaint.category !== user.category) {
      res.status(403).json({ error: 'Access denied: not matching your jurisdiction or assignment', code: 'FORBIDDEN' });
      return;
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 7. Update status of the Complaint (AGENT / ADMIN only)
app.put('/api/complaints/:id/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const modifier = req.user!;
    const { status } = req.body;

    if (modifier.role === 'USER') {
      res.status(403).json({ error: 'Only agents or administrators can modify complaint status', code: 'FORBIDDEN' });
      return;
    }

    const complaint = DB.getComplaintById(req.params.id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }

    const validStatuses: ComplaintStatus[] = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status as ComplaintStatus)) {
      res.status(400).json({ error: 'Invalid progress status', code: 'INVALID_STATUS' });
      return;
    }

    complaint.status = status as ComplaintStatus;
    complaint.updatedAt = new Date().toISOString();

    // If status is updated by an Agent who is not assigned yet, assign them automatically
    if (modifier.role === 'AGENT' && !complaint.agentId) {
      complaint.agentId = modifier.id;
      complaint.agentName = modifier.name;
      if (complaint.status === 'Pending') {
        complaint.status = 'Assigned';
      }
    }

    // System message inside chat to track change log
    const systemMessage: ChatMessage = {
      id: 'sys_' + Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: 'System Log',
      senderRole: 'ADMIN',
      message: `Status updated to [${status}] by ${modifier.name}.`,
      createdAt: new Date().toISOString()
    };
    complaint.chat.push(systemMessage);

    DB.updateComplaint(complaint);
    res.json(complaint);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 8. Assign Agent (ADMIN only)
app.post('/api/admin/assign', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user!;
    if (adminUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access restricted to system administrators', code: 'FORBIDDEN' });
      return;
    }

    const { complaintId, agentId } = req.body;
    if (!complaintId || !agentId) {
      res.status(400).json({ error: 'Complaint ID and Agent ID are required', code: 'MISSING_FIELDS' });
      return;
    }

    const complaint = DB.getComplaintById(complaintId);
    const agent = DB.findUserById(agentId);

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }
    if (!agent || agent.role !== 'AGENT') {
      res.status(404).json({ error: 'Agent profile not found', code: 'NOT_FOUND' });
      return;
    }

    complaint.agentId = agent.id;
    complaint.agentName = agent.name;
    complaint.status = 'Assigned';
    complaint.updatedAt = new Date().toISOString();

    const systemMessage: ChatMessage = {
      id: 'sys_' + Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: 'System Log',
      senderRole: 'ADMIN',
      message: `Complaint assigned to ${agent.name} [${agent.category} Dept].`,
      createdAt: new Date().toISOString()
    };
    complaint.chat.push(systemMessage);

    DB.updateComplaint(complaint);
    res.json(complaint);
  } catch (error) {
    console.error('Assign agent error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 9. Send Chat Message on Complaint
app.post('/api/complaints/:id/chat', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const sender = req.user!;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: 'Empty message body is invalid', code: 'INVALID_MESSAGE' });
      return;
    }

    const complaint = DB.getComplaintById(req.params.id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }

    // Check access to participate in chat
    if (sender.role === 'USER' && complaint.userId !== sender.id) {
      res.status(403).json({ error: 'Unauthorized to post messages in this complaint', code: 'FORBIDDEN' });
      return;
    }
    if (sender.role === 'AGENT' && complaint.agentId !== sender.id && complaint.category !== sender.category) {
      res.status(403).json({ error: 'Unauthorized: agent is not assigned and is outside category', code: 'FORBIDDEN' });
      return;
    }

    const newMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    complaint.chat.push(newMessage);
    complaint.updatedAt = new Date().toISOString();
    DB.updateComplaint(complaint);

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 10. Submit Complaint Feedback (USER only, marks complaint as Closed)
app.post('/api/complaints/:id/feedback', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const submitter = req.user!;
    const { rating, comment } = req.body;

    if (submitter.role !== 'USER') {
      res.status(403).json({ error: 'Only complaint creators can submit resolution quality feedback', code: 'FORBIDDEN' });
      return;
    }

    const complaint = DB.getComplaintById(req.params.id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found', code: 'NOT_FOUND' });
      return;
    }

    if (complaint.userId !== submitter.id) {
      res.status(403).json({ error: "Cannot submit feedback on another user's complaint", code: 'FORBIDDEN' });
      return;
    }

    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({ error: 'Feedback rating must be an integer score between 1 and 5', code: 'INVALID_RATING' });
      return;
    }

    const newFeedback: Feedback = {
      id: 'fb_' + Math.random().toString(36).substr(2, 9),
      complaintId: complaint.id,
      rating: numRating,
      comment: comment ? comment.trim() : '',
      createdAt: new Date().toISOString()
    };

    complaint.feedback = newFeedback;
    complaint.status = 'Closed';
    complaint.updatedAt = new Date().toISOString();

    const systemMessage: ChatMessage = {
      id: 'sys_' + Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: 'System Log',
      senderRole: 'ADMIN',
      message: `User submitted feedback quality score of ${rating}/5. Complaint is officially archived and closed.`,
      createdAt: new Date().toISOString()
    };
    complaint.chat.push(systemMessage);

    DB.updateComplaint(complaint);
    res.json(complaint);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 11. Get System Analytics Dashboard Stats (ADMIN only)
app.get('/api/admin/stats', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access credentials required', code: 'FORBIDDEN' });
      return;
    }
    res.json(DB.getStats());
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// 12. List of AGENTS (ADMIN only, to list for assignment)
app.get('/api/agents', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access credentials required', code: 'FORBIDDEN' });
      return;
    }
    const agents = DB.getUsers()
      .filter(u => u.role === 'AGENT')
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        category: agent.category
      }));
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// --- Health check endpoint ---
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- INTEGRATE VITE MIDDLEWARE OR STANDALONE STATIC FILES ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Complaint Center server running on http://localhost:${PORT}`);
    console.log(`CORS: Open to all origins (*)`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
