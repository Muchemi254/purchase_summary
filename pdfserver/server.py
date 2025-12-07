from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from io import BytesIO
import uvicorn

app = FastAPI()

# Allow CORS for testing from browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_pdf(records):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    for idx, record in enumerate(records):
        # Header
        story.append(Paragraph(f"{record['date']} — Summary", styles['Heading2']))
        story.append(Spacer(1, 12))

        # Cash summary
        cash_received = record.get("cashReceived") or 0
        balance_bf = record.get("balanceBF") or 0
        cash_available = record.get("cashAvailable") or 0

        story.append(Paragraph(f"<b>Cash Received:</b> KSh {cash_received}", styles['Normal']))
        story.append(Paragraph(f"<b>Balance B/F:</b> KSh {balance_bf}", styles['Normal']))
        story.append(Paragraph(f"<b>Cash Available:</b> KSh {cash_available}", styles['Normal']))
        story.append(Spacer(1, 12))

        # Cash Payments
        cash_balance = record.get("cashBalance") or 0
        cash_total = record.get("cashTotal") or 0
        story.append(Paragraph("<b>Cash Payments</b>", styles['Normal']))
        story.append(Paragraph(f"Cash Spent: KSh {cash_total}", styles['Normal']))
        story.append(Paragraph(f"Cash Balance: KSh {cash_balance}", styles['Normal']))
        story.append(Spacer(1, 12))

        # Other Payments
        mpesa_total = record.get("mpesaTotal") or 0
        cheque_total = record.get("chequeTotal") or 0
        story.append(Paragraph("<b>Other Payments</b>", styles['Normal']))
        story.append(Paragraph(f"M-Pesa: KSh {mpesa_total}", styles['Normal']))
        story.append(Paragraph(f"Cheque: KSh {cheque_total}", styles['Normal']))
        story.append(Spacer(1, 12))

        # Total Expenditure
        total_exp = record.get("totalExpenditure") or 0
        story.append(Paragraph(f"<b>Total Expenditure</b>", styles['Normal']))
        story.append(Paragraph(f"KSh {total_exp}", styles['Normal']))
        story.append(Spacer(1, 12))

        # Receipts Table
        story.append(Paragraph("<b>Receipt Details</b>", styles['Normal']))
        table_data = [["Supplier", "Mode", "Amount"]]
        for r in record.get("receipts", []):
            table_data.append([r.get("supplier"), r.get("paymentMode"), f"KSh {r.get('amount')}"])

        table = Table(table_data, colWidths=[150, 80, 80])
        table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ALIGN', (2,1), (-1,-1), 'RIGHT'),
        ]))
        story.append(table)

        # Page break between records except the last
        if idx < len(records) - 1:
            story.append(PageBreak())

    doc.build(story)
    buffer.seek(0)
    return buffer

@app.post("/generate-pdf")
async def create_pdf(request: Request):
    data = await request.json()
    if not data.get("records"):
        return Response(content="No records provided", status_code=400)
    
    pdf_buffer = generate_pdf(data["records"])
    return Response(pdf_buffer.read(), media_type="application/pdf")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
