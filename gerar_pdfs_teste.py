"""
Gerador de PDFs de Teste — Área do Cliente Ética Áxis
Execute: python gerar_pdfs_teste.py
"""

from fpdf import FPDF
import os

# Dados dos 5 contratos fictícios de teste
CONTRATOS = [
    {
        "contract_number": "CTR-2024-0001",
        "nome": "Carlos Eduardo Mendes",
        "cpf": "12345678901",
        "cpf_formatado": "123.456.789-01",
        "tipo": "Contrato de Locação Residencial",
        "imovel": "Apto 301, Rua das Flores, 120 - Jardim dos Estados, CG/MS",
        "data": "15/03/2024",
        "valor": "R$ 1.800,00/mês",
        "filename": "CTR-2024-0001.pdf",
    },
    {
        "contract_number": "CTR-2024-0002",
        "nome": "Fernanda Lima Oliveira",
        "cpf": "98765432100",
        "cpf_formatado": "987.654.321-00",
        "tipo": "Contrato de Compra e Venda",
        "imovel": "Casa, Rua Alagoas, 540 - Vivendas do Bosque, CG/MS",
        "data": "22/05/2024",
        "valor": "R$ 480.000,00",
        "filename": "CTR-2024-0002.pdf",
    },
    {
        "contract_number": "CTR-2024-0003",
        "nome": "Roberto Henrique Souza",
        "cpf": "11122233344",
        "cpf_formatado": "111.222.333-44",
        "tipo": "Contrato de Locação Comercial",
        "imovel": "Sala 908, Rua Alagoas, 396 - Jardim dos Estados, CG/MS",
        "data": "10/07/2024",
        "valor": "R$ 3.200,00/mês",
        "filename": "CTR-2024-0003.pdf",
    },
    {
        "contract_number": "CTR-2024-0004",
        "nome": "Patricia Gonçalves Ramos",
        "cpf": "55566677788",
        "cpf_formatado": "555.666.777-88",
        "tipo": "Contrato de Compra e Venda",
        "imovel": "Apto 502, Av. Mato Grosso, 1200 - Centro, CG/MS",
        "data": "05/09/2024",
        "valor": "R$ 320.000,00",
        "filename": "CTR-2024-0004.pdf",
    },
    {
        "contract_number": "CTR-2024-0005",
        "nome": "Marcos Vinícius Pereira",
        "cpf": "99988877766",
        "cpf_formatado": "999.888.777-66",
        "tipo": "Contrato de Locação Residencial",
        "imovel": "Casa 2, Rua Ceará, 88 - Jardim Paulista, CG/MS",
        "data": "18/10/2024",
        "valor": "R$ 1.500,00/mês",
        "filename": "CTR-2024-0005.pdf",
    },
]

output_dir = "pdfs_teste"
os.makedirs(output_dir, exist_ok=True)

def gerar_pdf(contrato: dict, output_path: str):
    pdf = FPDF()
    pdf.add_page()
    
    # Cabeçalho
    pdf.set_fill_color(20, 15, 8)
    pdf.rect(0, 0, 210, 40, 'F')
    
    pdf.set_y(12)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(212, 175, 55)  # Dourado
    pdf.cell(0, 10, "ETICA AXIS IMOBILIARIA", align="C", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(180, 170, 150)
    pdf.cell(0, 6, "CRECI 7903  |  Rua Alagoas, 396, Sala 908  |  Campo Grande - MS", align="C", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_y(50)
    
    # Titulo do contrato
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 15, 8)
    pdf.cell(0, 10, contrato["tipo"].upper(), align="C", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(150, 120, 30)
    pdf.cell(0, 8, f"N. {contrato['contract_number']}", align="C", new_x="LMARGIN", new_y="NEXT")
    
    # Linha separadora
    pdf.set_draw_color(212, 175, 55)
    pdf.set_line_width(0.5)
    pdf.line(15, pdf.get_y() + 3, 195, pdf.get_y() + 3)
    pdf.ln(10)
    
    # Dados do contrato
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(50, 50, 50)
    
    campos = [
        ("CONTRATANTE", contrato["nome"]),
        ("CPF", contrato["cpf_formatado"]),
        ("TIPO DE CONTRATO", contrato["tipo"]),
        ("IMOVEL", contrato["imovel"]),
        ("DATA DE ASSINATURA", contrato["data"]),
        ("VALOR", contrato["valor"]),
    ]
    
    for label, valor in campos:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(55, 9, label + ":", border=0)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(20, 20, 20)
        pdf.multi_cell(0, 9, valor, border=0, new_x="LMARGIN", new_y="NEXT")
    
    pdf.ln(8)
    
    # Texto ficticio de clausulas
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(0, 8, "CLAUSULAS E CONDICOES:", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(60, 60, 60)
    texto = (
        "CLAUSULA 1. - OBJETO: O presente contrato tem por objeto a cessao do bem imovel "
        "identificado acima, nos termos da legislacao vigente (Lei 8.245/91 e codigo civil). "
        "CLAUSULA 2. - PRAZO: O prazo do presente contrato e de 30 (trinta) meses, contado "
        "a partir da data de assinatura. CLAUSULA 3. - VALOR: O valor acordado entre as "
        "partes e o descrito neste instrumento, devendo ser pago ate o dia 10 de cada mes. "
        "CLAUSULA 4. - RESCISAO: A rescisao antecipada implica multa contratual de 3 (tres) "
        "meses de alugueis/prestacao. CLAUSULA 5. - FORO: Fica eleito o foro da Comarca de "
        "Campo Grande/MS para dirimir quaisquer controversias oriundas deste contrato."
    )
    texto = texto.encode("latin-1", errors="replace").decode("latin-1")
    pdf.multi_cell(0, 5, texto)
    
    pdf.ln(15)
    
    # Assinaturas
    pdf.set_draw_color(100, 100, 100)
    pdf.set_line_width(0.3)
    
    y_sig = pdf.get_y()
    pdf.line(15, y_sig, 90, y_sig)
    pdf.line(120, y_sig, 195, y_sig)
    
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(80, 80, 80)
    pdf.set_y(y_sig + 2)
    pdf.set_x(15)
    pdf.cell(75, 5, contrato["nome"])
    pdf.set_x(120)
    pdf.cell(75, 5, "Etica Axis Imobiliaria")
    
    pdf.set_y(y_sig + 7)
    pdf.set_x(15)
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(75, 5, f"CPF: {contrato['cpf_formatado']}")
    pdf.set_x(120)
    pdf.cell(75, 5, "CRECI 7903")
    
    # Rodape
    pdf.set_y(-20)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 5, f"Documento de teste - {contrato['contract_number']} - Data: {contrato['data']}", align="C")
    
    pdf.output(output_path)
    print(f"  [OK] Gerado: {output_path}")

print("\n=== GERANDO PDFs DE TESTE ===\n")
for c in CONTRATOS:
    caminho = os.path.join(output_dir, c["filename"])
    gerar_pdf(c, caminho)

print(f"\n=== {len(CONTRATOS)} PDFs gerados em ./{output_dir}/ ===\n")
print("Proximos passos:")
print("  1. Suba esses PDFs no Supabase Storage: bucket 'contracts' > pasta 'test/'")
print("  2. Execute o SQL gerado em contratos_teste.sql no Supabase SQL Editor")
print("  3. Teste no site com os CPFs listados no arquivo contratos_teste.sql\n")
