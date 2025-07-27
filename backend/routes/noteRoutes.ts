import express from 'express';
import Note from '../models/Note';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Create Note
router.post('/', protect, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ error: 'Title and content are required' });

  const note = await Note.create({
    user: req.user._id,
    title,
    content,
  });

  res.status(201).json(note);
});

// Get Notes for Logged-in User
router.get('/', protect, async (req, res) => {
  const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notes);
});

// Delete Note
router.delete('/:id', protect, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  if (note.user.toString() !== req.user._id.toString())
    return res.status(403).json({ error: 'Not authorized to delete this note' });

  await note.deleteOne();
  res.status(200).json({ message: 'Note deleted' });
});

export default router;
