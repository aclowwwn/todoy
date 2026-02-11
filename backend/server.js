const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ---
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECTS (Protected) ---

app.get('/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { id, name, color } = req.body;
    const project = await prisma.project.create({
      data: { 
        id, 
        name, 
        color, 
        userId: req.user.id 
      }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/projects/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure ownership
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TASKS (Protected) ---

app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    // Find projects owned by user first, then tasks for those projects
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          userId: req.user.id
        }
      },
      include: {
        checklist: true,
        contentIdeas: true
      }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const { id, projectId, title, date, startTime, endTime, description, checklist, contentIdeas, completed } = req.body;
    
    // Verify project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to add tasks to this project" });
    }

    const task = await prisma.task.create({
      data: {
        id,
        projectId,
        title,
        date,
        startTime,
        endTime,
        description: description || '',
        completed: completed || false,
        checklist: {
          create: checklist?.map(item => ({
             id: item.id,
             text: item.text,
             completed: item.completed
          })) || []
        },
        contentIdeas: {
          create: contentIdeas?.map(idea => ({
            id: idea.id,
            type: idea.type,
            text: idea.text
          })) || []
        }
      },
      include: { checklist: true, contentIdeas: true }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { projectId, title, date, startTime, endTime, description, checklist, contentIdeas, completed } = req.body;
    const taskId = req.params.id;

    // Verify ownership via existing task
    const existingTask = await prisma.task.findUnique({ 
        where: { id: taskId },
        include: { project: true }
    });
    
    if (!existingTask || existingTask.project.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
    }

    // Transaction to update task and replace nested items
    const result = await prisma.$transaction(async (tx) => {
      // Update basic fields
      await tx.task.update({
        where: { id: taskId },
        data: { projectId, title, date, startTime, endTime, description, completed }
      });

      // Update Checklist
      await tx.checklistItem.deleteMany({ where: { taskId } });
      if (checklist && checklist.length > 0) {
        await tx.checklistItem.createMany({
          data: checklist.map(c => ({
            id: c.id,
            taskId,
            text: c.text,
            completed: c.completed
          }))
        });
      }

      // Update Content Ideas
      await tx.contentIdea.deleteMany({ where: { taskId } });
      if (contentIdeas && contentIdeas.length > 0) {
        await tx.contentIdea.createMany({
          data: contentIdeas.map(c => ({
            id: c.id,
            taskId,
            type: c.type,
            text: c.text
          }))
        });
      }

      return tx.task.findUnique({
        where: { id: taskId },
        include: { checklist: true, contentIdeas: true }
      });
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const existingTask = await prisma.task.findUnique({ 
        where: { id: req.params.id },
        include: { project: true }
    });
    
    if (!existingTask || existingTask.project.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});