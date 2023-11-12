# https://www.kaggle.com/datasets/geoffnel/evs-one-electric-vehicle-dataset/

import pandas as pd

vehicles = pd.read_csv('ElectricCarData_Clean.csv')
vehicles['miles_per_kwhr'] = (1000/1.60934) / vehicles['Efficiency_WhKm']
vehicles['battery_size_kwhr'] = vehicles['Efficiency_WhKm'] * vehicles['Range_Km'] / 1000
vehicles = vehicles[['Brand', 'Model', 'miles_per_kwhr', 'battery_size_kwhr']]
vehicles.T.to_json("evs_efficiency.json")