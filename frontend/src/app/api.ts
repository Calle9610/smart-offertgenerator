// API base URL - always use localhost:8000 since we're accessing from localhost
export const API_BASE = 'http://localhost:8000';

// Authentication functions
export async function login(username: string, password: string) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Login failed: ${errorText}`);
  }
  
  return res.json();
}

export async function getCurrentUser(token: string) {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get user: ${errorText}`);
  }
  
  return res.json();
}

export async function getCompanies(token: string) {
  const res = await fetch(`${API_BASE}/companies`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get companies: ${errorText}`);
  }
  
  return res.json();
}

// Project Requirements functions
export async function createProjectRequirements(payload: any, token: string) {
  console.log('=== API DEBUG ===')
  console.log('createProjectRequirements called with token:', token ? token.slice(0, 20) + '...' : 'NO TOKEN')
  console.log('Token length:', token ? token.length : 0)
  console.log('Token type:', typeof token)
  console.log('Authorization header:', `Bearer ${token}`)
  console.log('Payload:', payload)
  
  const res = await fetch(`${API_BASE}/project-requirements`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  console.log('Response status:', res.status)
  console.log('Response ok:', res.ok)
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log('Error response:', errorText)
    throw new Error(`Failed to create requirements: ${errorText}`);
  }
  
  const responseData = await res.json();
  console.log('Success response:', responseData)
  return responseData;
}

export async function getProjectRequirements(token: string) {
  const res = await fetch(`${API_BASE}/project-requirements`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get requirements: ${errorText}`);
  }
  
  return res.json();
}

// Auto-generation function
export async function autoGenerateQuote(payload: any, token: string) {
  const res = await fetch(`${API_BASE}/quotes/autogenerate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Auto-generation failed: ${errorText}`);
  }
  
  return res.json();
}

// Quote functions (now require authentication)
export async function calcQuote(payload: any) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/quotes/calc`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Calc failed');
  return res.json();
}

export async function createQuote(payload: any) {
  const token = localStorage.getItem('token')
  
  if (!token) {
    throw new Error('No authentication token found')
  }
  
  console.log('createQuote called with payload:', payload)
  console.log('Using token:', token ? token.slice(0, 20) + '...' : 'NO TOKEN')
  
  const res = await fetch(`${API_BASE}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  console.log('createQuote response status:', res.status)
  console.log('createQuote response ok:', res.ok)
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('createQuote error:', errorText)
    throw new Error(`Create failed: ${errorText}`);
  }
  
  const responseData = await res.json();
  console.log('createQuote success response:', responseData)
  return responseData;
}

export async function getQuotes(token: string) {
  const res = await fetch(`${API_BASE}/quotes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get quotes: ${errorText}`);
  }
  
  return res.json();
}

export async function getQuoteAdjustments(quoteId: string, token: string) {
  const res = await fetch(`${API_BASE}/quotes/${quoteId}/adjustments`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get adjustments: ${errorText}`);
  }
  
  return res.json();
}

export async function generatePDF(quoteId: string, token: string) {
  const res = await fetch(`${API_BASE}/quotes/${quoteId}/pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PDF generation failed: ${errorText}`);
  }
  
  // Create blob and download
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quote_${quoteId.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
