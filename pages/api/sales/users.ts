import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get all sales users
        const users = await query('SELECT * FROM sales_users ORDER BY name');
        return res.status(200).json(users.rows);

      case 'POST':
        // Create a new sales user
        const { name, email, territory, role, is_admin } = req.body;
        
        if (!name || !email) {
          return res.status(400).json({ error: 'Name and email are required' });
        }
        
        const newUser = await query(
          'INSERT INTO sales_users (name, email, territory, role, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [name, email, territory || null, role || 'sales', is_admin || false]
        );
        
        return res.status(201).json(newUser.rows[0]);

      case 'PUT':
        // Update a sales user
        const { id, ...updateData } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Build the dynamic update query
        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        
        if (fields.length === 0) {
          return res.status(400).json({ error: 'No update data provided' });
        }
        
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const updateQuery = `UPDATE sales_users SET ${setClause} WHERE id = $1 RETURNING *`;
        
        const updatedUser = await query(updateQuery, [id, ...values]);
        
        if (updatedUser.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        return res.status(200).json(updatedUser.rows[0]);

      case 'DELETE':
        // Delete a sales user
        const { userId } = req.query;
        
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Check if user exists
        const userExists = await query('SELECT id FROM sales_users WHERE id = $1', [userId]);
        
        if (userExists.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Delete the user
        await query('DELETE FROM sales_users WHERE id = $1', [userId]);
        
        return res.status(200).json({ message: 'User deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling sales users request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}