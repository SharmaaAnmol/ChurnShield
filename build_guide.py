"""
Assembly script to compile ChurnShield_Live_Demo_Guide.md and ChurnShield_Live_Demo_Guide.pdf
"""

import os
import sys

from guide_parts_1_to_3 import get_part_one, get_part_two, get_part_three
from guide_parts_4_to_6 import get_part_four, get_part_five, get_part_six
from guide_parts_7_to_9 import get_part_seven, get_part_eight, get_part_nine
from guide_parts_10_to_13 import get_part_ten, get_part_eleven, get_part_twelve, get_part_thirteen
from guide_parts_14_to_17 import get_part_fourteen, get_part_fifteen, get_part_sixteen, get_part_seventeen

def build_markdown_guide(output_md_path):
    print(f"Assembling comprehensive Markdown guide to: {output_md_path}...")
    
    sections = [
        # Title and Meta Header
        """# CHURNSHIELD: COMPLETE CODE EXPLANATION, LIVE DEMONSTRATION & VIVA PREPARATION GUIDE

**Full Project Title:** Explainable E-Commerce Customer Inactivity Prediction and Retention Intelligence  
**Student Specialization:** B.Tech Computer Engineering (Artificial Intelligence & Machine Learning)  
**Primary Executable Notebook:** `ChurnShield_Customer_Inactivity_Prediction.ipynb`  
**Dataset:** Brazilian E-Commerce Public Dataset by Olist (CC BY-NC-SA 4.0)  
**Status:** 100% Verified, Top-to-Bottom Execution Tested, Production-Grade  

---

## Guide Table of Contents
1. [Part One — Understand the Complete Project](#part-one--understand-the-complete-project)
2. [Part Two — Explain Every Notebook Section & Code Cell](#part-two--explain-every-notebook-section--code-cell)
3. [Part Three — Dataset and Data Engineering](#part-three--dataset-and-data-engineering)
4. [Part Four — Feature Engineering and Target Construction](#part-four--feature-engineering-and-target-construction)
5. [Part Five — Exploratory Data Analysis (EDA)](#part-five--exploratory-data-analysis-eda)
6. [Part Six — Data Preprocessing Pipelines](#part-six--data-preprocessing-pipelines)
7. [Part Seven — Data Splitting and Leakage Prevention](#part-seven--data-splitting-and-leakage-prevention)
8. [Part Eight — Explain Every Machine-Learning Algorithm](#part-eight--explain-every-machine-learning-algorithm)
9. [Part Nine — Evaluation Metrics & The Accuracy Paradox](#part-nine--evaluation-metrics--the-accuracy-paradox)
10. [Part Ten — The Champion Model & Empirical Comparisons](#part-ten--the-champion-model--empirical-comparisons)
11. [Part Eleven — Model Explainability & Feature Importance](#part-eleven--model-explainability--feature-importance)
12. [Part Twelve — Predictions & Business Intelligence](#part-twelve--predictions--business-intelligence)
13. [Part Thirteen — Model Serialization & Artifact Storage](#part-thirteen--model-serialization--artifact-storage)
14. [Part Fourteen — 5-to-7-Minute Live Demonstration Script](#part-fourteen--5-to-7-minute-live-demonstration-script)
15. [Part Fifteen — Comprehensive Viva Questions and Answers](#part-fifteen--comprehensive-viva-questions-and-answers)
16. [Part Sixteen — Common Errors & Troubleshooting Guide](#part-sixteen--common-errors--troubleshooting-guide)
17. [Part Seventeen — Final Rapid Revision Sheet](#part-seventeen--final-rapid-revision-sheet)

---
""",
        get_part_one(),
        get_part_two(),
        get_part_three(),
        get_part_four(),
        get_part_five(),
        get_part_six(),
        get_part_seven(),
        get_part_eight(),
        get_part_nine(),
        get_part_ten(),
        get_part_eleven(),
        get_part_twelve(),
        get_part_thirteen(),
        get_part_fourteen(),
        get_part_fifteen(),
        get_part_sixteen(),
        get_part_seventeen()
    ]
    
    with open(output_md_path, "w", encoding="utf-8") as f:
        for sec in sections:
            f.write(sec.strip() + "\n\n---\n\n")
            
    print(f"Markdown guide compiled successfully: {os.path.getsize(output_md_path):,d} bytes.")

def format_inline_md(text):
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # handle bold **text**
    parts = text.split('**')
    if len(parts) > 1:
        res = []
        for i, p in enumerate(parts):
            if i % 2 == 1:
                res.append(f'<b>{p}</b>')
            else:
                res.append(p)
        text = ''.join(res)
    # handle code `text`
    parts = text.split('`')
    if len(parts) > 1:
        res = []
        for i, p in enumerate(parts):
            if i % 2 == 1:
                res.append(f"<font face='Courier' color='#8b0000'>{p}</font>")
            else:
                res.append(p)
        text = ''.join(res)
    return text

def build_pdf_guide(input_md_path, output_pdf_path):
    print(f"Generating polished PDF guide to: {output_pdf_path} using ReportLab...")
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
        from reportlab.lib.units import inch

        doc = SimpleDocTemplate(
            output_pdf_path,
            pagesize=letter,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=6
        )
        h1_style = ParagraphStyle(
            'Heading1_Custom',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#2b6cb0'),
            spaceBefore=12,
            spaceAfter=5,
            keepWithNext=True
        )
        h2_style = ParagraphStyle(
            'Heading2_Custom',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#2d3748'),
            spaceBefore=8,
            spaceAfter=3,
            keepWithNext=True
        )
        h3_style = ParagraphStyle(
            'Heading3_Custom',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=12,
            textColor=colors.HexColor('#4a5568'),
            spaceBefore=6,
            spaceAfter=2,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            'Body_Custom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#1a202c'),
            spaceAfter=4
        )
        bullet_style = ParagraphStyle(
            'Bullet_Custom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#2d3748'),
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=2
        )
        code_style = ParagraphStyle(
            'Code_Custom',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#742a2a'),
            backColor=colors.HexColor('#fff5f5'),
            spaceBefore=3,
            spaceAfter=3
        )

        story = []
        
        with open(input_md_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        in_code_block = False
        code_buffer = []

        for line in lines:
            line_str = line.rstrip()
            
            # Handle Code Blocks
            if line_str.startswith('```'):
                if in_code_block:
                    in_code_block = False
                    block_text = "<br/>".join([c.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') for c in code_buffer])
                    story.append(Paragraph(block_text, code_style))
                    code_buffer = []
                else:
                    in_code_block = True
                    code_buffer = []
                continue

            if in_code_block:
                code_buffer.append(line_str)
                continue

            # Skip empty lines
            if not line_str.strip():
                continue

            # Dividers
            if line_str == '---':
                story.append(Spacer(1, 3))
                story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor('#e2e8f0'), spaceAfter=4, spaceBefore=3))
                continue

            # Headings
            if line_str.startswith('# '):
                story.append(Paragraph(format_inline_md(line_str[2:]), title_style))
            elif line_str.startswith('## '):
                story.append(Paragraph(format_inline_md(line_str[3:]), h1_style))
            elif line_str.startswith('### '):
                story.append(Paragraph(format_inline_md(line_str[4:]), h2_style))
            elif line_str.startswith('#### '):
                story.append(Paragraph(format_inline_md(line_str[5:]), h3_style))
            elif line_str.startswith('* ') or line_str.startswith('- '):
                story.append(Paragraph(f"• {format_inline_md(line_str[2:])}", bullet_style))
            elif line_str.startswith('> '):
                story.append(Paragraph(f"<i>{format_inline_md(line_str[2:])}</i>", body_style))
            elif line_str.startswith('|'):
                # Simple table line representation
                clean_text = line_str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(f"<font face='Courier' size=6.5>{clean_text}</font>", body_style))
            else:
                story.append(Paragraph(format_inline_md(line_str), body_style))

        doc.build(story)
        print(f"PDF guide generated successfully: {output_pdf_path} ({os.path.getsize(output_pdf_path):,d} bytes).")
    except Exception as e:
        print(f"PDF generation encountered error: {e}")

if __name__ == "__main__":
    md_file = "ChurnShield_Live_Demo_Guide.md"
    pdf_file = "ChurnShield_Live_Demo_Guide.pdf"
    build_markdown_guide(md_file)
    build_pdf_guide(md_file, pdf_file)
