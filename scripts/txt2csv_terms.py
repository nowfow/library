import csv
import re

input_file = 'terms.txt'
output_file = 'terms_from_txt.csv'

# Регулярка для поиска первого дефиса или длинного тире с пробелами
split_pattern = re.compile(r'\s*[-–—]\s*', re.UNICODE)

with open(input_file, 'r', encoding='utf-8') as fin, \
     open(output_file, 'w', encoding='utf-8', newline='') as fout:
    writer = csv.writer(fout)
    writer.writerow(['term', 'description'])
    for line in fin:
        line = line.strip()
        if not line:
            continue
        # Разделить по первому дефису/тире
        parts = split_pattern.split(line, maxsplit=1)
        if len(parts) == 2:
            term, description = parts
        else:
            term, description = parts[0], ''
        writer.writerow([term.strip(), description.strip()]) 