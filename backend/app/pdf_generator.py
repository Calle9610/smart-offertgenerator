"""
PDF Generator for Smart Offertgenerator

Generates PDFs that match exactly what the customer selected in the public view.
Only includes mandatory items + selected optional items.
"""

import os
import tempfile
from decimal import Decimal
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    print("Warning: WeasyPrint not available. PDF generation will be disabled.")

from .models import Quote, QuoteItem, Company, PriceProfile
from .schemas import PublicQuoteSelectionResponse


class PDFGenerator:
    """Generates PDFs for quotes with proper option handling."""
    
    def __init__(self):
        self.weasyprint_available = WEASYPRINT_AVAILABLE
    
    def generate_quote_pdf(
        self, 
        quote: Quote, 
        quote_items: List[QuoteItem],
        selected_item_ids: List[str],
        company: Company,
        profile: PriceProfile
    ) -> Optional[bytes]:
        """
        Generate PDF for a quote with selected options.
        
        Args:
            quote: The quote object
            quote_items: All quote items
            selected_item_ids: IDs of selected optional items
            company: Company information
            profile: Price profile for VAT calculation
            
        Returns:
            PDF bytes if successful, None if WeasyPrint unavailable
        """
        if not self.weasyprint_available:
            print("WeasyPrint not available - cannot generate PDF")
            return None
        
        try:
            # Separate mandatory and optional items
            mandatory_items = [item for item in quote_items if not item.is_optional]
            optional_items = [item for item in quote_items if item.is_optional]
            
            # Filter optional items to only include selected ones
            selected_optional_items = [
                item for item in optional_items 
                if str(item.id) in selected_item_ids
            ]
            
            # Calculate totals based on selection
            base_subtotal = sum(item.line_total for item in mandatory_items)
            optional_subtotal = sum(item.line_total for item in selected_optional_items)
            total_subtotal = base_subtotal + optional_subtotal
            
            # Apply VAT rate
            vat_rate = float(profile.vat_rate) / 100.0 if profile else 0.25
            vat_amount = total_subtotal * Decimal(str(vat_rate))
            total_amount = total_subtotal + vat_amount
            
            # Generate HTML content
            html_content = self._generate_html_content(
                quote=quote,
                company=company,
                mandatory_items=mandatory_items,
                selected_optional_items=selected_optional_items,
                base_subtotal=base_subtotal,
                optional_subtotal=optional_subtotal,
                total_subtotal=total_subtotal,
                vat_amount=vat_amount,
                total_amount=total_amount,
                vat_rate=vat_rate * 100
            )
            
            # Generate PDF
            pdf_bytes = self._html_to_pdf(html_content)
            return pdf_bytes
            
        except Exception as e:
            print(f"Error generating PDF: {e}")
            return None
    
    def _generate_html_content(
        self,
        quote: Quote,
        company: Company,
        mandatory_items: List[QuoteItem],
        selected_optional_items: List[QuoteItem],
        base_subtotal: Decimal,
        optional_subtotal: Decimal,
        total_subtotal: Decimal,
        vat_amount: Decimal,
        total_amount: Decimal,
        vat_rate: float
    ) -> str:
        """Generate HTML content for the PDF."""
        
        # Format currency
        currency = quote.currency or "SEK"
        
        # Generate items HTML
        mandatory_items_html = self._generate_items_html(mandatory_items, currency, "Grundarbete & Material")
        optional_items_html = self._generate_items_html(selected_optional_items, currency, "Valda tillval")
        
        # Current date
        current_date = datetime.now().strftime("%d %B %Y")
        
        html = f"""
        <!DOCTYPE html>
        <html lang="sv">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offert - {quote.customer_name}</title>
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    line-height: 1.6;
                }}
                .header {{
                    text-align: center;
                    border-bottom: 3px solid #2563eb;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .company-info {{
                    margin-bottom: 20px;
                }}
                .quote-details {{
                    background-color: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }}
                .items-section {{
                    margin-bottom: 30px;
                }}
                .section-title {{
                    background-color: #2563eb;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    margin-bottom: 15px;
                    font-weight: bold;
                }}
                .item-row {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid #e2e8f0;
                }}
                .item-row:last-child {{
                    border-bottom: none;
                }}
                .item-description {{
                    flex: 1;
                }}
                .item-details {{
                    color: #64748b;
                    font-size: 0.9em;
                    margin-top: 5px;
                }}
                .item-price {{
                    text-align: right;
                    font-weight: bold;
                    min-width: 120px;
                }}
                .totals {{
                    background-color: #f1f5f9;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 30px;
                }}
                .total-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #cbd5e1;
                }}
                .total-row:last-child {{
                    border-bottom: none;
                    border-top: 2px solid #2563eb;
                    font-weight: bold;
                    font-size: 1.2em;
                    color: #2563eb;
                }}
                .footer {{
                    margin-top: 40px;
                    text-align: center;
                    color: #64748b;
                    font-size: 0.9em;
                }}
                .no-items {{
                    text-align: center;
                    color: #64748b;
                    font-style: italic;
                    padding: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>OFFERT</h1>
                <h2>{company.name}</h2>
            </div>
            
            <div class="company-info">
                <p><strong>Datum:</strong> {current_date}</p>
                <p><strong>Offertnummer:</strong> {str(quote.id)[:8].upper()}</p>
            </div>
            
            <div class="quote-details">
                <h3>Projektinformation</h3>
                <p><strong>Kund:</strong> {quote.customer_name}</p>
                {f'<p><strong>Projekt:</strong> {quote.project_name}</p>' if quote.project_name else ''}
                <p><strong>Valuta:</strong> {currency}</p>
            </div>
            
            {mandatory_items_html}
            
            {optional_items_html}
            
            <div class="totals">
                <h3>Summering</h3>
                <div class="total-row">
                    <span>Grundsumma:</span>
                    <span>{base_subtotal:.2f} {currency}</span>
                </div>
                {f'''
                <div class="total-row">
                    <span>Tillval:</span>
                    <span>{optional_subtotal:.2f} {currency}</span>
                </div>
                ''' if selected_optional_items else ''}
                <div class="total-row">
                    <span>Delsumma:</span>
                    <span>{total_subtotal:.2f} {currency}</span>
                </div>
                <div class="total-row">
                    <span>Moms ({vat_rate:.0f}%):</span>
                    <span>{vat_amount:.2f} {currency}</span>
                </div>
                <div class="total-row">
                    <span>TOTALT:</span>
                    <span>{total_amount:.2f} {currency}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>Denna offert är giltig i 30 dagar från {current_date}</p>
                <p>För frågor, kontakta oss via telefon eller e-post</p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _generate_items_html(self, items: List[QuoteItem], currency: str, section_title: str) -> str:
        """Generate HTML for a section of items."""
        if not items:
            return ""
        
        items_html = f"""
        <div class="items-section">
            <div class="section-title">{section_title}</div>
        """
        
        for item in items:
            items_html += f"""
            <div class="item-row">
                <div class="item-description">
                    <div><strong>{item.description or item.kind}</strong></div>
                    <div class="item-details">
                        {item.qty} {item.unit} × {item.unit_price:.2f} {currency}
                        {f' (Ref: {item.ref})' if item.ref else ''}
                    </div>
                </div>
                <div class="item-price">
                    {item.line_total:.2f} {currency}
                </div>
            </div>
            """
        
        items_html += "</div>"
        return items_html
    
    def _html_to_pdf(self, html_content: str) -> bytes:
        """Convert HTML to PDF using WeasyPrint."""
        try:
            # Create temporary file for CSS
            with tempfile.NamedTemporaryFile(mode='w', suffix='.css', delete=False) as css_file:
                css_file.write("")
                css_file_path = css_file.name
            
            try:
                # Generate PDF
                html = HTML(string=html_content)
                css = CSS(filename=css_file_path)
                pdf_bytes = html.write_pdf(stylesheets=[css])
                return pdf_bytes
            finally:
                # Clean up temporary file
                os.unlink(css_file_path)
                
        except Exception as e:
            print(f"Error converting HTML to PDF: {e}")
            raise


# Global instance
pdf_generator = PDFGenerator()
