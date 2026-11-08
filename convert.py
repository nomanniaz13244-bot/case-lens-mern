import pandas as pd

# Apni downloaded file ka naam yahan daalo
parquet_file = 'train-00000-of-00001.parquet' 

print("Data load ho raha hai...")
df = pd.read_parquet(parquet_file)

print("Data convert ho raha hai...")
df_clean = pd.DataFrame({
    'caseTitle': df['citation_number'].apply(lambda x: x['id'] if isinstance(x, dict) else 'Supreme Court Case'),
    'citation': df['citation_number'].apply(lambda x: x['id'] if isinstance(x, dict) else ''),
    'courtName': 'Supreme Court of Pakistan',
    'summary': df['text'].str[:500], 
    'fullText': df['text'],
    'keywords': 'supreme court, pakistan, legal',
    'caseType': 'Criminal',
    'verdict': 'Allowed'
})

df_clean.to_csv('pak_cases.csv', index=False)
print("Mubarak ho! pak_cases.csv ban gayi.")