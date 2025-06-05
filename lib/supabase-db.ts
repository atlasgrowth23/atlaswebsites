import { supabase, supabaseAdmin, type Company, type CompanyFrame, type Frame } from './supabase'

// Company operations
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    console.error('Error fetching company:', error)
    return null
  }
  
  return data
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching company by ID:', error)
    return null
  }
  
  return data
}

export async function getAllCompanies(limit: number = 100): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(limit)
  
  if (error) {
    console.error('Error fetching companies:', error)
    return []
  }
  
  return data || []
}

export async function createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company | null> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert(company)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating company:', error)
    return null
  }
  
  return data
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating company:', error)
    return null
  }
  
  return data
}

// Company frames operations
export async function getCompanyFrames(companyId: string): Promise<CompanyFrame[]> {
  const { data, error } = await supabase
    .from('company_frames')
    .select('*')
    .eq('company_id', companyId)
  
  if (error) {
    console.error('Error fetching company frames:', error)
    return []
  }
  
  return data || []
}

export async function setCompanyFrame(companyId: string, slug: string, url: string): Promise<CompanyFrame | null> {
  const { data, error } = await supabaseAdmin
    .from('company_frames')
    .upsert({ 
      company_id: companyId, 
      slug, 
      url,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'company_id,slug'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error setting company frame:', error)
    return null
  }
  
  return data
}

// Template frames operations
export async function getTemplateFrames(templateKey: string): Promise<Frame[]> {
  const { data, error } = await supabase
    .from('frames')
    .select('*')
    .eq('template_key', templateKey)
  
  if (error) {
    console.error('Error fetching template frames:', error)
    return []
  }
  
  return data || []
}

// Utility function to get effective image URL (company-specific or template default)
export async function getImageUrl(companyId: string, frameSlug: string, templateKey: string): Promise<string> {
  // First try company-specific frame
  const { data: companyFrame } = await supabase
    .from('company_frames')
    .select('url')
    .eq('company_id', companyId)
    .eq('slug', frameSlug)
    .single()
  
  if (companyFrame?.url) {
    return companyFrame.url
  }
  
  // Fallback to template default
  const { data: templateFrame } = await supabase
    .from('frames')
    .select('default_url')
    .eq('template_key', templateKey)
    .eq('slug', frameSlug)
    .single()
  
  return templateFrame?.default_url || '/images/default-hero.jpg'
}

// Legacy compatibility - wrapper for existing query function
export async function query(sql: string, params: any[] = []) {
  console.warn('Legacy query function used. Consider migrating to Supabase client methods.')
  
  // This is a temporary bridge - in practice you'd migrate specific queries
  // For now, we'll throw an error to identify where legacy queries are used
  throw new Error(`Legacy query not supported: ${sql}. Please migrate to Supabase client.`)
}