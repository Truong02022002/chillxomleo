import os
import glob
from deep_translator import GoogleTranslator
import time

def translate_markdown_file(filepath, out_filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    translator = GoogleTranslator(source='vi', target='en')
    translated_lines = []
    
    for line in lines:
        text = line.strip()
        if not text:
            translated_lines.append("\n")
            continue
            
        # Protect markdown syntax simply by translating chunks if necessary
        # However, GoogleTranslator is often okay with markdown.
        # But for # Headers, we translate the text.
        try:
            if text.startswith('!['):
                # image alt
                alt_start = text.find('[')
                alt_end = text.find(']')
                if alt_end > alt_start + 1:
                    alt_text = text[alt_start+1:alt_end]
                    translated_alt = translator.translate(alt_text)
                    rest = text[alt_end:]
                    translated_lines.append(f"![{translated_alt}]{rest}\n")
                else:
                    translated_lines.append(text + "\n")
            elif text.startswith('#'):
                # headers
                pounds = len(text) - len(text.lstrip('#'))
                content = text.lstrip('#').strip()
                translated_content = translator.translate(content)
                translated_lines.append(f"{'#' * pounds} {translated_content}\n")
            elif text.startswith('* ') or text.startswith('- '):
                # lists
                content = text[2:].strip()
                translated_content = translator.translate(content)
                translated_lines.append(f"{text[:2]}{translated_content}\n")
            else:
                # normal paragraph
                translated_content = translator.translate(text)
                translated_lines.append(f"{translated_content}\n")
        except Exception as e:
            print(f"Error translating line '{text}': {e}")
            translated_lines.append(text + "\n")  # fallback
            
    with open(out_filepath, 'w', encoding='utf-8') as f:
        f.writelines(translated_lines)
    print(f"Translated: {out_filepath}")

def main():
    in_dir = "blog-translations"
    out_dir = "blog-translations-en"
    
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        
    already_done = [
        "thien-vien-truc-lam.md",
        "da-lat-co-gi-top-dia-diem-chill-tai-da-lat.md",
        "kham-pha-da-lat-thien-duong-nghi-duong.md",
        "review-diem-den-da-lat-moi-nhat-nam-2025.md",
        "nha-tho-con-ga.md"
    ]
    
    files = glob.glob(os.path.join(in_dir, "*.md"))
    for file in files:
        basename = os.path.basename(file)
        if basename in already_done:
            continue
            
        out_filepath = os.path.join(out_dir, basename)
        if os.path.exists(out_filepath):
            # check if it contains translated text or is just empty/vi
            with open(out_filepath, 'r', encoding='utf-8') as f:
                if len(f.read().strip()) > 50:
                    continue  # already translated
                    
        print(f"Starting {basename}...")
        translate_markdown_file(file, out_filepath)
        time.sleep(1) # delay to avoid rate limiting
        
if __name__ == "__main__":
    main()
