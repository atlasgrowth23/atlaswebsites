import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { InvoiceSettings } from '@/types/invoice';

type ResponseData = {
  success: boolean;
  message?: string;
  settings?: InvoiceSettings;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getInvoiceSettings(req, res);
    case 'POST':
    case 'PUT':
      return updateInvoiceSettings(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get invoice settings for a company
async function getInvoiceSettings(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { company_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    const sql = 'SELECT * FROM hvac_invoice_settings WHERE company_id = $1';
    const result = await query(sql, [company_id]);
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        company_id,
        next_invoice_number: 1001,
        next_estimate_number: 1001,
        default_tax_rate: 0,
        default_due_days: 30,
        default_estimate_expiry_days: 30,
        invoice_notes_template: 'Thank you for your business!',
        estimate_notes_template: 'This estimate is valid for 30 days.',
        invoice_terms_template: 'Payment due within 30 days.',
        estimate_terms_template: 'This estimate is not a contract or agreement.',
        logo_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const insertSql = `
        INSERT INTO hvac_invoice_settings (
          company_id,
          next_invoice_number,
          next_estimate_number,
          default_tax_rate,
          default_due_days,
          default_estimate_expiry_days,
          invoice_notes_template,
          estimate_notes_template,
          invoice_terms_template,
          estimate_terms_template,
          logo_url,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;
      
      const insertParams = [
        company_id,
        defaultSettings.next_invoice_number,
        defaultSettings.next_estimate_number,
        defaultSettings.default_tax_rate,
        defaultSettings.default_due_days,
        defaultSettings.default_estimate_expiry_days,
        defaultSettings.invoice_notes_template,
        defaultSettings.estimate_notes_template,
        defaultSettings.invoice_terms_template,
        defaultSettings.estimate_terms_template,
        defaultSettings.logo_url
      ];
      
      const insertResult = await query(insertSql, insertParams);
      return res.status(200).json({ success: true, settings: insertResult.rows[0] });
    }
    
    return res.status(200).json({ success: true, settings: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching invoice settings:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update invoice settings
async function updateInvoiceSettings(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id,
    next_invoice_number,
    next_estimate_number,
    default_tax_rate,
    default_due_days,
    default_estimate_expiry_days,
    invoice_notes_template,
    estimate_notes_template,
    invoice_terms_template,
    estimate_terms_template,
    logo_url
  } = req.body;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    // Check if settings exist
    const checkSql = 'SELECT * FROM hvac_invoice_settings WHERE company_id = $1';
    const checkResult = await query(checkSql, [company_id]);
    
    let sql;
    let params;
    
    if (checkResult.rows.length === 0) {
      // Insert new settings
      sql = `
        INSERT INTO hvac_invoice_settings (
          company_id,
          next_invoice_number,
          next_estimate_number,
          default_tax_rate,
          default_due_days,
          default_estimate_expiry_days,
          invoice_notes_template,
          estimate_notes_template,
          invoice_terms_template,
          estimate_terms_template,
          logo_url,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;
      
      params = [
        company_id,
        next_invoice_number || 1001,
        next_estimate_number || 1001,
        default_tax_rate || 0,
        default_due_days || 30,
        default_estimate_expiry_days || 30,
        invoice_notes_template || 'Thank you for your business!',
        estimate_notes_template || 'This estimate is valid for 30 days.',
        invoice_terms_template || 'Payment due within 30 days.',
        estimate_terms_template || 'This estimate is not a contract or agreement.',
        logo_url || ''
      ];
    } else {
      // Update existing settings
      const currentSettings = checkResult.rows[0];
      
      sql = `
        UPDATE hvac_invoice_settings
        SET next_invoice_number = $2,
            next_estimate_number = $3,
            default_tax_rate = $4,
            default_due_days = $5,
            default_estimate_expiry_days = $6,
            invoice_notes_template = $7,
            estimate_notes_template = $8,
            invoice_terms_template = $9,
            estimate_terms_template = $10,
            logo_url = $11,
            updated_at = NOW()
        WHERE company_id = $1
        RETURNING *
      `;
      
      params = [
        company_id,
        next_invoice_number !== undefined ? next_invoice_number : currentSettings.next_invoice_number,
        next_estimate_number !== undefined ? next_estimate_number : currentSettings.next_estimate_number,
        default_tax_rate !== undefined ? default_tax_rate : currentSettings.default_tax_rate,
        default_due_days !== undefined ? default_due_days : currentSettings.default_due_days,
        default_estimate_expiry_days !== undefined ? default_estimate_expiry_days : currentSettings.default_estimate_expiry_days,
        invoice_notes_template !== undefined ? invoice_notes_template : currentSettings.invoice_notes_template,
        estimate_notes_template !== undefined ? estimate_notes_template : currentSettings.estimate_notes_template,
        invoice_terms_template !== undefined ? invoice_terms_template : currentSettings.invoice_terms_template,
        estimate_terms_template !== undefined ? estimate_terms_template : currentSettings.estimate_terms_template,
        logo_url !== undefined ? logo_url : currentSettings.logo_url
      ];
    }
    
    const result = await query(sql, params);
    
    return res.status(200).json({ 
      success: true, 
      settings: result.rows[0],
      message: 'Invoice settings updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating invoice settings:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Helper function to get next invoice/estimate number and increment it
export async function getNextNumber(companyId: string, type: 'invoice' | 'estimate'): Promise<string> {
  try {
    // Start a transaction to prevent race conditions
    await query('BEGIN');
    
    const field = type === 'invoice' ? 'next_invoice_number' : 'next_estimate_number';
    
    // Get the current settings
    const settingsSql = 'SELECT * FROM hvac_invoice_settings WHERE company_id = $1 FOR UPDATE';
    const settingsResult = await query(settingsSql, [companyId]);
    
    let nextNumber: number;
    let formatted: string;
    
    if (settingsResult.rows.length === 0) {
      // Create default settings
      const defaultNumber = 1001;
      await query(`
        INSERT INTO hvac_invoice_settings (
          company_id, 
          next_invoice_number, 
          next_estimate_number,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [
        companyId, 
        type === 'invoice' ? defaultNumber + 1 : defaultNumber,
        type === 'estimate' ? defaultNumber + 1 : defaultNumber
      ]);
      
      nextNumber = defaultNumber;
    } else {
      // Get and increment the number
      nextNumber = settingsResult.rows[0][field];
      
      // Update the settings
      await query(`
        UPDATE hvac_invoice_settings 
        SET ${field} = ${field} + 1,
            updated_at = NOW()
        WHERE company_id = $1
      `, [companyId]);
    }
    
    // Format number (with prefix if needed)
    if (type === 'invoice') {
      formatted = `INV-${nextNumber}`;
    } else {
      formatted = `EST-${nextNumber}`;
    }
    
    // Commit the transaction
    await query('COMMIT');
    
    return formatted;
  } catch (error) {
    // Rollback on error
    await query('ROLLBACK');
    console.error(`Error getting next ${type} number:`, error);
    throw error;
  }
}