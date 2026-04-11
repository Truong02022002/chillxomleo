import re
import glob

# For all html files, normalize the desktop navbar links to default unactive state.
files = glob.glob('*.html')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We find all nav links inside <div class="hidden lg:flex items-center space-x-8 test-[13px] font-medium tracking-wide">
    # Actually, simpler: replace all a tags in specifically the nav links area. 
    # Just looking for `bg-white/10 text-foreground` and making it `text-foreground/70 hover:text-foreground`
    # Replace active state classes with inactive.
    content = content.replace('bg-white/10 text-foreground"', 'text-foreground/70 hover:text-foreground"')
    
    # For the mobile menu active state:
    # `transition-colors text-primary pl-4 border-l-2 border-primary`
    # replace with `transition-colors text-foreground/70`
    content = content.replace('text-primary pl-4 border-l-2 border-primary">', 'text-foreground/70">')

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Nav active states neutralized.")
