// Use a simple string for now - can be configured via environment variables later
export const API_BASE = 'http://localhost:8000';

export async function calcQuote(payload: any) {
  try {
    const res = await fetch(`${API_BASE}/quotes/calc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Calc failed: ${res.status} - ${errorText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Error calculating quote:', error);
    throw error;
  }
}

export async function createQuote(payload: any) {
  try {
    const res = await fetch(`${API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Create failed: ${res.status} - ${errorText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Error creating quote:', error);
    throw error;
  }
}

export async function generatePDF(quoteId: string) {
  try {
    const res = await fetch(`${API_BASE}/quotes/${quoteId}/pdf`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`PDF generation failed: ${res.status} - ${errorText}`);
    }
    
    // Get the filename from the response headers
    const contentDisposition = res.headers.get('content-disposition');
    const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'offert.pdf';
    
    // Convert response to blob and download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
