import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession } from '@/lib/auth-google';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: 'Nicholas' | 'Jared' | 'Both';
  due_date?: string;
  reminder_date?: string;
  related_company_id?: string;
  related_lead_id?: string;
  task_type?: 'follow_up' | 'call' | 'email' | 'meeting' | 'research' | 'admin' | 'other';
}

interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const sessionToken = req.cookies.admin_session;
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = await getAdminSession(sessionToken);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // Get current user name from session
  const currentUser = session.email === 'nicholas@atlasgrowth.ai' ? 'Nicholas' : 'Jared';

  switch (req.method) {
    case 'GET':
      return handleGetTasks(req, res, currentUser);
    case 'POST':
      return handleCreateTask(req, res, currentUser);
    case 'PUT':
      return handleUpdateTask(req, res, currentUser);
    case 'DELETE':
      return handleDeleteTask(req, res, currentUser);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetTasks(req: NextApiRequest, res: NextApiResponse, currentUser: string) {
  const { 
    assigned_to, 
    status, 
    priority, 
    task_type,
    limit = '50',
    offset = '0'
  } = req.query;

  try {
    let query = supabase
      .from('admin_tasks')
      .select(`
        *,
        companies(name, slug, city, state, phone)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (assigned_to && assigned_to !== 'all') {
      if (assigned_to === currentUser) {
        query = query.or(`assigned_to.eq.${currentUser},assigned_to.eq.Both`);
      } else {
        query = query.eq('assigned_to', assigned_to);
      }
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (task_type && task_type !== 'all') {
      query = query.eq('task_type', task_type);
    }

    // Apply pagination
    query = query.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    // Get task statistics
    const { data: stats, error: statsError } = await supabase
      .from('admin_task_stats')
      .select('*');

    if (statsError) {
      console.error('Error fetching task stats:', statsError);
    }

    res.status(200).json({
      tasks: tasks || [],
      stats: stats || [],
      currentUser
    });

  } catch (error) {
    console.error('Error in handleGetTasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateTask(req: NextApiRequest, res: NextApiResponse, currentUser: string) {
  const taskData: CreateTaskRequest = req.body;

  // Validate required fields
  if (!taskData.title?.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const { data: task, error } = await supabase
      .from('admin_tasks')
      .insert({
        title: taskData.title.trim(),
        description: taskData.description?.trim() || null,
        priority: taskData.priority || 'medium',
        assigned_to: taskData.assigned_to || currentUser,
        due_date: taskData.due_date || null,
        reminder_date: taskData.reminder_date || null,
        related_company_id: taskData.related_company_id || null,
        related_lead_id: taskData.related_lead_id || null,
        task_type: taskData.task_type || 'other',
        created_by: currentUser
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }

    res.status(201).json({ task });

  } catch (error) {
    console.error('Error in handleCreateTask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateTask(req: NextApiRequest, res: NextApiResponse, currentUser: string) {
  const { id } = req.query;
  const updateData: UpdateTaskRequest = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (updateData.title !== undefined) updates.title = updateData.title.trim();
    if (updateData.description !== undefined) updates.description = updateData.description?.trim() || null;
    if (updateData.priority !== undefined) updates.priority = updateData.priority;
    if (updateData.assigned_to !== undefined) updates.assigned_to = updateData.assigned_to;
    if (updateData.status !== undefined) {
      updates.status = updateData.status;
      
      // If completing task, record completion details
      if (updateData.status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = currentUser;
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }
    }
    if (updateData.due_date !== undefined) updates.due_date = updateData.due_date || null;
    if (updateData.reminder_date !== undefined) updates.reminder_date = updateData.reminder_date || null;
    if (updateData.task_type !== undefined) updates.task_type = updateData.task_type;
    if (updateData.notes !== undefined) updates.notes = updateData.notes?.trim() || null;

    const { data: task, error } = await supabase
      .from('admin_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }

    res.status(200).json({ task });

  } catch (error) {
    console.error('Error in handleUpdateTask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteTask(req: NextApiRequest, res: NextApiResponse, currentUser: string) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    const { error } = await supabase
      .from('admin_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ error: 'Failed to delete task' });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error in handleDeleteTask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}