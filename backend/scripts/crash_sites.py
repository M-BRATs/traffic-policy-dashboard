import csv
import json

filenames = ['../data/Unfallorte.csv', '../data/Unfallorte2016.csv','../data/Unfallorte2017.csv','../data/Unfallorte2019.csv']

class excel_semicolon(csv.excel):
    delimiter = ';'


data = []

for f in filenames:
    with open(f, 'r') as csvfile:
        csv.register_dialect("excel-semicolon", excel_semicolon)
        datareader = csv.DictReader(csvfile, dialect=excel_semicolon)
        for row in datareader:
           if row['ULAND'] == '09' and row['UREGBEZ'] == '1':
                row['OBJECTID'] = row['OBJECTID'] + row['UJAHR']
                data.append(row)

with open('../data/Unfallorte_large.json', 'w', encoding='utf-8') as jsonf:
    jsonf.write(json.dumps(data, indent=4))

