# https://www.eia.gov/tools/faqs/faq.php?id=74&t=11

import pandas as pd

YEAR = 2022

emissions = pd.read_excel("emission_annual.xlsx")
emissions = emissions[(emissions['Year'] == YEAR) 
& (emissions['Producer Type'] == 'Total Electric Power Industry')
& (emissions['Energy Source'] == 'All Sources')]
generation = pd.read_excel("annual_generation_state.xls", skiprows = range(0, 1))
generation = generation[(generation['YEAR'] == YEAR) 
& (generation['TYPE OF PRODUCER'] == 'Total Electric Power Industry')
& (generation['ENERGY SOURCE'] == 'Total')]


merged = pd.merge(emissions, generation, left_on='State', right_on='STATE', how='inner')
# metric tons per megawatt/hr is equivalent to kgs per kw/hr, no conversion needed
merged['kgs_carbon_per_kwhr'] = merged['CO2\n(Metric Tons)'] / merged["GENERATION (Megawatthours)"]
merged = merged[['State', 'kgs_carbon_per_kwhr']]
merged.set_index('State', inplace=True)
merged.to_json(f"{YEAR}_carbon_intensity_by_state.json")