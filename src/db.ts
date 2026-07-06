import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Complaint, Feedback, ChatMessage, ComplaintCategory } from './types.js';

const DB_FILE = path.join(process.cwd(), 'database.json');

interface Schema {
  users: (User & { passwordHash: string })[];
  complaints: Complaint[];
}

function getInitialSchema(): Schema {
  const salt = bcrypt.genSaltSync(10);
  
  // Seed default credentials
  const defaultUsers = [
    {
      id: 'usr_admin',
      name: 'System Administrator',
      email: 'admin@complaint.com',
      role: 'ADMIN' as const,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('admin123', salt),
    },
    {
      id: 'usr_agent_water',
      name: 'Water Dept Agent',
      email: 'water@complaint.com',
      role: 'AGENT' as const,
      category: 'Water' as const,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('agent123', salt),
    },
    {
      id: 'usr_agent_roads',
      name: 'Roads Dept Agent',
      email: 'roads@complaint.com',
      role: 'AGENT' as const,
      category: 'Roads' as const,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('agent123', salt),
    },
    {
      id: 'usr_agent_elec',
      name: 'Electricity Dept Agent',
      email: 'electricity@complaint.com',
      role: 'AGENT' as const,
      category: 'Electricity' as const,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('agent123', salt),
    },
    {
      id: 'usr_agent_waste',
      name: 'Waste Management Agent',
      email: 'waste@complaint.com',
      role: 'AGENT' as const,
      category: 'Waste Management' as const,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('agent123', salt),
    },
    {
      id: 'usr_john',
      name: 'John Doe',
      email: 'john@gmail.com',
      role: 'USER' as const,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('user123', salt),
    }
  ];

  // Seed default complaints
  const defaultComplaints: Complaint[] = [
    {
      id: 'comp_1',
      userId: 'usr_john',
      userName: 'John Doe',
      title: 'Water Pipe Leak on Kings Road',
      description: 'A major water mains pipe has burst, flooding the pavement and causing low pressure in nearby homes.',
      category: 'Water',
      location: 'Kings Road, Block B',
      status: 'Assigned',
      agentId: 'usr_agent_water',
      agentName: 'Water Dept Agent',
      createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36 hours ago
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 24 hours ago
      feedback: null,
      chat: [
        {
          id: 'msg_1',
          senderId: 'usr_john',
          senderName: 'John Doe',
          senderRole: 'USER',
          message: 'Can you please look into this on priority? The street is completely flooded.',
          createdAt: new Date(Date.now() - 35 * 3600 * 1000).toISOString(),
        },
        {
          id: 'msg_2',
          senderId: 'usr_agent_water',
          senderName: 'Water Dept Agent',
          senderRole: 'AGENT',
          message: 'Acknowledged. We have assigned a field engineer to dispatch to Kings Road. Will update progress shortly.',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        }
      ]
    },
    {
      id: 'comp_2',
      userId: 'usr_john',
      userName: 'John Doe',
      title: 'Major Pothole on Oak Avenue',
      description: 'There is a deep pothole in the center of Oak Avenue near the school. It represents a serious damage risk to vehicles and bicycles.',
      category: 'Roads',
      location: 'Oak Avenue near Central High School',
      status: 'Resolved',
      agentId: 'usr_agent_roads',
      agentName: 'Roads Dept Agent',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
      feedback: {
        id: 'fb_2',
        complaintId: 'comp_2',
        rating: 5,
        comment: 'Excellent and quick repair. Pothole filled and smooth road restored!',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      chat: [
        {
          id: 'msg_3',
          senderId: 'usr_agent_roads',
          senderName: 'Roads Dept Agent',
          senderRole: 'AGENT',
          message: 'The maintenance team has completely filled the pothole and repaved the section. Closing this complaint.',
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        }
      ]
    },
    {
      id: 'comp_3',
      userId: 'usr_john',
      userName: 'John Doe',
      title: 'Power Outage / Fluctuations',
      description: 'Streetlights are flickering terribly and homes are experiencing brownouts frequently during the evenings.',
      category: 'Electricity',
      location: 'Greenwood District, Zone 4',
      status: 'Pending',
      agentId: null,
      agentName: null,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
      updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      feedback: null,
      chat: []
    }
  ];

  return {
    users: defaultUsers,
    complaints: defaultComplaints
  };
}

export class DB {
  private static load(): Schema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Failed to parse database file, reinitializing', e);
    }
    const initial = getInitialSchema();
    this.save(initial);
    return initial;
  }

  private static save(schema: Schema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(schema, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  // --- Users CRUD ---
  static getUsers(): (User & { passwordHash: string })[] {
    return this.load().users;
  }

  static findUserByEmail(email: string) {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static findUserById(id: string) {
    const users = this.getUsers();
    return users.find(u => u.id === id);
  }

  static addUser(user: User, passwordHash: string): void {
    const schema = this.load();
    schema.users.push({ ...user, passwordHash });
    this.save(schema);
  }

  // --- Complaints CRUD ---
  static getComplaints(): Complaint[] {
    return this.load().complaints;
  }

  static getComplaintById(id: string): Complaint | undefined {
    return this.getComplaints().find(c => c.id === id);
  }

  static addComplaint(complaint: Complaint): void {
    const schema = this.load();
    schema.complaints.push(complaint);
    this.save(schema);
  }

  static updateComplaint(updated: Complaint): void {
    const schema = this.load();
    const idx = schema.complaints.findIndex(c => c.id === updated.id);
    if (idx !== -1) {
      schema.complaints[idx] = updated;
      this.save(schema);
    }
  }

  // --- Statistics Helpers ---
  static getStats() {
    const complaints = this.getComplaints();
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

    const categoriesCount = {
      Water: complaints.filter(c => c.category === 'Water').length,
      Roads: complaints.filter(c => c.category === 'Roads').length,
      Electricity: complaints.filter(c => c.category === 'Electricity').length,
      'Waste Management': complaints.filter(c => c.category === 'Waste Management').length,
    };

    // Calculate agent loads
    const agents = this.getUsers().filter(u => u.role === 'AGENT');
    const agentStats = agents.map(agent => {
      const assigned = complaints.filter(c => c.agentId === agent.id);
      const active = assigned.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
      return {
        id: agent.id,
        name: agent.name,
        category: agent.category,
        totalAssigned: assigned.length,
        activeComplaints: active
      };
    });

    // Feedbacks
    const feedbacks = complaints.map(c => c.feedback).filter(Boolean) as Feedback[];
    const avgRating = feedbacks.length > 0 
      ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length 
      : 0;

    return {
      total,
      pending,
      inProgress,
      resolved,
      categoriesCount,
      agentStats,
      feedbacksCount: feedbacks.length,
      averageRating: parseFloat(avgRating.toFixed(1)),
      feedbacksList: feedbacks
    };
  }
}
