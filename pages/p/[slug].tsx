// pages/p/[slug].tsx
import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { query, queryOne } from "../../lib/db";

interface Contact {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  notes: string | null;
}

interface Props { 
  companyName: string; 
  slug: string;
  companyData: any;
}

interface Message {
  id: string;
  company_id: string;
  contact_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  is_from_website: boolean;
  is_read: boolean;
  created_at: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export default function PortalPage({ companyName, slug, companyData }: Props) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: ''
  });
  
  // Track the view when the component mounts
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch(`/api/track-view?slug=${slug}`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Failed to track view', error);
      }
    };
    
    trackView();
  }, [slug]);
  
  // Fetch contacts when the contacts tab is active
  useEffect(() => {
    if (activeTab === 'contacts') {
      fetchContacts();
    }
  }, [activeTab, slug]);
  
  // Function to fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      } else {
        console.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors as user types
    if (name === 'name' && formErrors.name) {
      setFormErrors(prev => ({ ...prev, name: '' }));
    }
  };
  
  // Function to validate the form
  const validateForm = () => {
    let valid = true;
    const errors = { name: '' };
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };
  
  // Function to reset the form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      notes: ''
    });
    setFormErrors({ name: '' });
    setCurrentContact(null);
  };
  
  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (currentContact) {
        // Update existing contact
        const response = await fetch(`/api/contacts/contact/${currentContact.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          await fetchContacts();
          setShowContactForm(false);
          resetForm();
        } else {
          console.error('Failed to update contact');
        }
      } else {
        // Create new contact
        const response = await fetch(`/api/contacts/${slug}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          await fetchContacts();
          setShowContactForm(false);
          resetForm();
        } else {
          console.error('Failed to create contact');
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to edit a contact
  const handleEdit = (contact: Contact) => {
    setCurrentContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      street: contact.street || '',
      city: contact.city || '',
      notes: contact.notes || ''
    });
    setShowContactForm(true);
  };
  
  // Function to delete a contact
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/contact/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchContacts();
      } else {
        console.error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>{`${companyName} - Portal`}</title>
      </Head>
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: '250px', 
          backgroundColor: '#1e3a8a', 
          color: 'white',
          padding: '20px 0',
          position: 'relative'
        }}>
          <div style={{ padding: '0 20px', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{companyName}</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '5px' }}>HVAC Business Portal</p>
          </div>
          
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
                  style={{ 
                    display: 'block',
                    padding: '12px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    backgroundColor: activeTab === 'dashboard' ? '#2c4f9c' : 'transparent',
                    borderLeft: activeTab === 'dashboard' ? '4px solid white' : '4px solid transparent',
                  }}
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('contacts'); }}
                  style={{ 
                    display: 'block',
                    padding: '12px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    backgroundColor: activeTab === 'contacts' ? '#2c4f9c' : 'transparent',
                    borderLeft: activeTab === 'contacts' ? '4px solid white' : '4px solid transparent',
                  }}
                >
                  Contacts
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('messages'); }}
                  style={{ 
                    display: 'block',
                    padding: '12px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    backgroundColor: activeTab === 'messages' ? '#2c4f9c' : 'transparent',
                    borderLeft: activeTab === 'messages' ? '4px solid white' : '4px solid transparent',
                  }}
                >
                  Messages
                </a>
              </li>
            </ul>
          </nav>
          
          <div style={{ padding: '20px', position: 'absolute', bottom: '0', width: 'calc(100% - 40px)' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>HVAC Portal for {companyName}</p>
            <Link href="/" style={{ 
                display: 'block',
                textAlign: 'center',
                padding: '8px',
                backgroundColor: '#0f2259',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                Back to Website
            </Link>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f7f9fc' }}>
          {activeTab === 'dashboard' && (
            <div>
              <h1 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Dashboard</h1>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: 0, marginBottom: '10px' }}>Company Info</h3>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><strong>Location:</strong> {companyData.city}, {companyData.state}</p>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {companyData.phone}</p>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><strong>Website:</strong> {companyData.site || 'N/A'}</p>
                </div>
                
                <div style={{ 
                  backgroundColor: 'white', 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: 0, marginBottom: '10px' }}>Online Reputation</h3>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{companyData.rating} <span style={{ fontSize: '1rem', color: '#555' }}>/ 5</span></p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{companyData.reviews} reviews</p>
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: 'white', 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
                <p>Your dashboard will show recent activities and analytics here.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'contacts' && (
            <div>
              {!showContactForm ? (
                <>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '20px' 
                  }}>
                    <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Contacts</h1>
                    <button 
                      onClick={() => {
                        resetForm();
                        setShowContactForm(true);
                      }}
                      style={{ 
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      disabled={loading}
                    >
                      Add New Contact
                    </button>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: 'white', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        Loading contacts...
                      </div>
                    ) : (
                      <>
                        {contacts.length > 0 ? (
                          <>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              borderBottom: '1px solid #eee',
                              paddingBottom: '10px',
                              marginBottom: '10px',
                              fontWeight: 'bold'
                            }}>
                              <div style={{ width: '30%' }}>Name</div>
                              <div style={{ width: '30%' }}>Email</div>
                              <div style={{ width: '25%' }}>Phone</div>
                              <div style={{ width: '15%' }}>Actions</div>
                            </div>
                            
                            {contacts.map(contact => (
                              <div 
                                key={contact.id}
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  borderBottom: '1px solid #f5f5f5',
                                  padding: '10px 0'
                                }}
                              >
                                <div style={{ width: '30%' }}>{contact.name}</div>
                                <div style={{ width: '30%' }}>{contact.email || '—'}</div>
                                <div style={{ width: '25%' }}>{contact.phone || '—'}</div>
                                <div style={{ width: '15%', display: 'flex', gap: '10px' }}>
                                  <button
                                    onClick={() => handleEdit(contact)}
                                    style={{
                                      backgroundColor: '#4f46e5',
                                      color: 'white',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(contact.id)}
                                    style={{
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
                            <p>No contacts yet. Click "Add New Contact" to get started.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '20px' 
                  }}>
                    <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
                      {currentContact ? 'Edit Contact' : 'Add New Contact'}
                    </h1>
                    <button 
                      onClick={() => setShowContactForm(false)}
                      style={{ 
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: 'white', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <form onSubmit={handleSubmit}>
                      <div style={{ marginBottom: '16px' }}>
                        <label 
                          htmlFor="name" 
                          style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          Name *
                        </label>
                        <input 
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          style={{ 
                            width: '100%',
                            padding: '8px',
                            border: formErrors.name ? '1px solid #ef4444' : '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                        {formErrors.name && (
                          <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                            {formErrors.name}
                          </p>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label 
                          htmlFor="email" 
                          style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          Email
                        </label>
                        <input 
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          style={{ 
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label 
                          htmlFor="phone" 
                          style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          Phone
                        </label>
                        <input 
                          type="text"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          style={{ 
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label 
                          htmlFor="street" 
                          style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          Street Address
                        </label>
                        <input 
                          type="text"
                          id="street"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          style={{ 
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label 
                          htmlFor="city" 
                          style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          City
                        </label>
                        <input 
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          style={{ 
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label 
                          htmlFor="notes" 
                          style={{ 
                            display: 'block', 
                            marginBottom: '4px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          Notes
                        </label>
                        <textarea 
                          id="notes"
                          name="notes"
                          rows={4}
                          value={formData.notes}
                          onChange={handleInputChange}
                          style={{ 
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                          type="button"
                          onClick={() => setShowContactForm(false)}
                          style={{ 
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={loading}
                          style={{ 
                            padding: '8px 16px',
                            backgroundColor: '#1e3a8a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {loading ? 'Saving...' : 'Save Contact'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  try {
    // Get company data directly from database
    const company = await queryOne('SELECT * FROM companies WHERE slug = $1', [slug]);
    
    if (!company) {
      console.log(`No company found with slug: ${slug}`);
      return { notFound: true };
    }
    
    console.log(`Portal access for ${company.name}`);
    
    return { 
      props: { 
        companyName: company.name, 
        slug,
        companyData: {
          city: company.city || 'N/A',
          state: company.state || 'N/A',
          phone: company.phone || 'N/A',
          rating: company.rating || 0,
          reviews: company.reviews || 0,
          site: company.site || ''
        }
      } 
    };
  } catch (error) {
    console.error('Error loading portal data:', error);
    return { notFound: true };
  }
};