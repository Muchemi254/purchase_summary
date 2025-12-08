1. PDF Server

The FastAPI PDF server generates PDF reports.

Steps:

Navigate to the pdfserver folder

cd pdfserver


Create a virtual environment (optional but recommended)

python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows


Install dependencies

pip install -r requirements.txt


Start the server

uvicorn main:app --reload --host 0.0.0.0 --port 8000


The server will be accessible at http://localhost:8000.

POST to /generate-pdf to generate PDFs.

