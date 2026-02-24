import asyncio
import time
import yfinance as yf
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error
import csv
import json
import io
import logging

_logger = logging.getLogger(__name__)

NSE_STOCKS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank"},
    {"symbol": "INFY.NS", "name": "Infosys"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever"},
    {"symbol": "SBIN.NS", "name": "State Bank of India"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel"},
    {"symbol": "ITC.NS", "name": "ITC Limited"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma"},
    {"symbol": "TITAN.NS", "name": "Titan Company"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance"},
    {"symbol": "WIPRO.NS", "name": "Wipro"},
    {"symbol": "TMPV.NS", "name": "Tata Motors"},
    {"symbol": "NTPC.NS", "name": "NTPC"},
    {"symbol": "POWERGRID.NS", "name": "Power Grid Corp"},
    {"symbol": "ONGC.NS", "name": "ONGC"},
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel"},
    {"symbol": "COALINDIA.NS", "name": "Coal India"},
    {"symbol": "DRREDDY.NS", "name": "Dr Reddy's Labs"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises"},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel"},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra"},
    {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp"},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India"},
    {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank"},
    {"symbol": "CIPLA.NS", "name": "Cipla"},
    {"symbol": "GRASIM.NS", "name": "Grasim Industries"},
    {"symbol": "DIVISLAB.NS", "name": "Divi's Labs"},
    {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals"},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports"},
    {"symbol": "BRITANNIA.NS", "name": "Britannia Industries"},
    {"symbol": "EICHERMOT.NS", "name": "Eicher Motors"},
    {"symbol": "HINDALCO.NS", "name": "Hindalco"},
    {"symbol": "BPCL.NS", "name": "BPCL"},
    {"symbol": "TATACONSUM.NS", "name": "Tata Consumer"},
    {"symbol": "M&M.NS", "name": "Mahindra & Mahindra"},
    {"symbol": "SBILIFE.NS", "name": "SBI Life Insurance"},
    {"symbol": "HDFCLIFE.NS", "name": "HDFC Life"},
    {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto"},
    {"symbol": "GODREJCP.NS", "name": "Godrej Consumer"},
    {"symbol": "DABUR.NS", "name": "Dabur India"},
    {"symbol": "MARICO.NS", "name": "Marico"},
    {"symbol": "VEDL.NS", "name": "Vedanta"},
    {"symbol": "NMDC.NS", "name": "NMDC"},
    {"symbol": "SAIL.NS", "name": "SAIL"},
    {"symbol": "GAIL.NS", "name": "GAIL India"},
    {"symbol": "IOC.NS", "name": "Indian Oil Corp"},
    {"symbol": "DLF.NS", "name": "DLF"},
    {"symbol": "GODREJPROP.NS", "name": "Godrej Properties"},
    {"symbol": "SIEMENS.NS", "name": "Siemens"},
    {"symbol": "ABB.NS", "name": "ABB India"},
    {"symbol": "HAVELLS.NS", "name": "Havells India"},
    {"symbol": "VOLTAS.NS", "name": "Voltas"},
    {"symbol": "PAGEIND.NS", "name": "Page Industries"},
    {"symbol": "JUBLFOOD.NS", "name": "Jubilant FoodWorks"},
    {"symbol": "PERSISTENT.NS", "name": "Persistent Systems"},
    {"symbol": "COFORGE.NS", "name": "Coforge"},
    {"symbol": "MPHASIS.NS", "name": "Mphasis"},
    {"symbol": "LTIM.NS", "name": "LTIMindtree"},
    {"symbol": "LTTS.NS", "name": "L&T Technology Services"},
    {"symbol": "COLPAL.NS", "name": "Colgate Palmolive"},
    {"symbol": "PNB.NS", "name": "Punjab National Bank"},
    {"symbol": "BANKBARODA.NS", "name": "Bank of Baroda"},
    {"symbol": "CANBK.NS", "name": "Canara Bank"},
    {"symbol": "FEDERALBNK.NS", "name": "Federal Bank"},
    {"symbol": "IDFCFIRSTB.NS", "name": "IDFC First Bank"},
    {"symbol": "AUBANK.NS", "name": "AU Small Finance Bank"},
    {"symbol": "RBLBANK.NS", "name": "RBL Bank"},
    {"symbol": "BANDHANBNK.NS", "name": "Bandhan Bank"},
    {"symbol": "BIOCON.NS", "name": "Biocon"},
    {"symbol": "LUPIN.NS", "name": "Lupin"},
    {"symbol": "AUROPHARMA.NS", "name": "Aurobindo Pharma"},
    {"symbol": "TORNTPHARM.NS", "name": "Torrent Pharma"},
    {"symbol": "IPCALAB.NS", "name": "IPCA Labs"},
    {"symbol": "ALKEM.NS", "name": "Alkem Labs"},
    {"symbol": "LAURUSLABS.NS", "name": "Laurus Labs"},
    {"symbol": "ASHOKLEY.NS", "name": "Ashok Leyland"},
    {"symbol": "TVSMOTOR.NS", "name": "TVS Motor"},
    {"symbol": "BALKRISIND.NS", "name": "Balkrishna Industries"},
    {"symbol": "MRF.NS", "name": "MRF"},
    {"symbol": "OBEROIRLTY.NS", "name": "Oberoi Realty"},
    {"symbol": "PRESTIGE.NS", "name": "Prestige Estates"},
    {"symbol": "BRIGADE.NS", "name": "Brigade Enterprises"},
    {"symbol": "SOBHA.NS", "name": "Sobha"},
    {"symbol": "SUNTECK.NS", "name": "Sunteck Realty"},
    {"symbol": "TATAPOWER.NS", "name": "Tata Power"},
    {"symbol": "ADANIGREEN.NS", "name": "Adani Green Energy"},
    {"symbol": "ADANIPOWER.NS", "name": "Adani Power"},
    {"symbol": "NHPC.NS", "name": "NHPC"},
    {"symbol": "IREDA.NS", "name": "IREDA"},
    {"symbol": "TORNTPOWER.NS", "name": "Torrent Power"},
    {"symbol": "CESC.NS", "name": "CESC"},
    {"symbol": "RECLTD.NS", "name": "REC"},
    {"symbol": "PFC.NS", "name": "Power Finance Corp"},
    {"symbol": "JINDALSTEL.NS", "name": "Jindal Steel"},
    {"symbol": "NATIONALUM.NS", "name": "National Aluminium"},
    {"symbol": "APLAPOLLO.NS", "name": "APL Apollo Tubes"},
    {"symbol": "RATNAMANI.NS", "name": "Ratnamani Metals"},
    {"symbol": "ZEEL.NS", "name": "Zee Entertainment"},
    {"symbol": "PVRINOX.NS", "name": "PVR INOX"},
    {"symbol": "SUNTV.NS", "name": "Sun TV Network"},
    {"symbol": "NETWORK18.NS", "name": "Network18"},
    {"symbol": "NAZARA.NS", "name": "Nazara Technologies"},
    {"symbol": "SAREGAMA.NS", "name": "Saregama India"},
    {"symbol": "ICICIGI.NS", "name": "ICICI Lombard"},
    {"symbol": "ICICIPRULI.NS", "name": "ICICI Prudential Life"},
    {"symbol": "CHOLAFIN.NS", "name": "Cholamandalam Finance"},
    {"symbol": "MUTHOOTFIN.NS", "name": "Muthoot Finance"},
    {"symbol": "MANAPPURAM.NS", "name": "Manappuram Finance"},
    {"symbol": "SHRIRAMFIN.NS", "name": "Shriram Finance"},
    {"symbol": "LICHSGFIN.NS", "name": "LIC Housing Finance"},
    {"symbol": "PIIND.NS", "name": "PI Industries"},
    {"symbol": "UPL.NS", "name": "UPL"},
    {"symbol": "COROMANDEL.NS", "name": "Coromandel Intl"},
    {"symbol": "SRF.NS", "name": "SRF"},
    {"symbol": "ATUL.NS", "name": "Atul"},
    {"symbol": "DEEPAKNTR.NS", "name": "Deepak Nitrite"},
    {"symbol": "CLEAN.NS", "name": "Clean Science"},
    {"symbol": "PIDILITIND.NS", "name": "Pidilite Industries"},
    {"symbol": "BERGEPAINT.NS", "name": "Berger Paints"},
    {"symbol": "KANSAINER.NS", "name": "Kansai Nerolac"},
    {"symbol": "ASTRAL.NS", "name": "Astral"},
    {"symbol": "SUPREMEIND.NS", "name": "Supreme Industries"},
    {"symbol": "POLYCAB.NS", "name": "Polycab India"},
    {"symbol": "KEI.NS", "name": "KEI Industries"},
    {"symbol": "CROMPTON.NS", "name": "Crompton Greaves"},
    {"symbol": "WHIRLPOOL.NS", "name": "Whirlpool India"},
    {"symbol": "BLUESTARCO.NS", "name": "Blue Star"},
    {"symbol": "DIXON.NS", "name": "Dixon Technologies"},
    {"symbol": "VBL.NS", "name": "Varun Beverages"},
    {"symbol": "TRENT.NS", "name": "Trent"},
    {"symbol": "DMART.NS", "name": "Avenue Supermarts (DMart)"},
    {"symbol": "NYKAA.NS", "name": "FSN E-Commerce (Nykaa)"},
    {"symbol": "ZOMATO.NS", "name": "Zomato"},
    {"symbol": "PAYTM.NS", "name": "One97 Comm (Paytm)"},
    {"symbol": "POLICYBZR.NS", "name": "PB Fintech"},
    {"symbol": "DELHIVERY.NS", "name": "Delhivery"},
    {"symbol": "NAUKRI.NS", "name": "Info Edge (Naukri)"},
    {"symbol": "IRCTC.NS", "name": "IRCTC"},
    {"symbol": "INDIGO.NS", "name": "InterGlobe Aviation"},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics"},
    {"symbol": "BEL.NS", "name": "Bharat Electronics"},
    {"symbol": "BDL.NS", "name": "Bharat Dynamics"},
    {"symbol": "COCHINSHIP.NS", "name": "Cochin Shipyard"},
    {"symbol": "MAZDOCK.NS", "name": "Mazagon Dock"},
    {"symbol": "GRSE.NS", "name": "Garden Reach Ship"},
    {"symbol": "SOLARINDS.NS", "name": "Solar Industries"},
    {"symbol": "DATAPATTNS.NS", "name": "Data Patterns"},
    {"symbol": "LALPATHLAB.NS", "name": "Dr Lal PathLabs"},
    {"symbol": "MAXHEALTH.NS", "name": "Max Healthcare"},
    {"symbol": "FORTIS.NS", "name": "Fortis Healthcare"},
    {"symbol": "STARHEALTH.NS", "name": "Star Health"},
    {"symbol": "SBICARD.NS", "name": "SBI Cards"},
    {"symbol": "HDFCAMC.NS", "name": "HDFC AMC"},
    {"symbol": "CAMS.NS", "name": "CAMS"},
    {"symbol": "BSE.NS", "name": "BSE"},
    {"symbol": "CDSL.NS", "name": "CDSL"},
    {"symbol": "MCX.NS", "name": "MCX"},
    {"symbol": "ANGELONE.NS", "name": "Angel One"},
    {"symbol": "MOTILALOFS.NS", "name": "Motilal Oswal"},
    {"symbol": "IEX.NS", "name": "Indian Energy Exchange"},
    {"symbol": "CUMMINSIND.NS", "name": "Cummins India"},
    {"symbol": "THERMAX.NS", "name": "Thermax"},
    {"symbol": "GRINDWELL.NS", "name": "Grindwell Norton"},
    {"symbol": "SCHAEFFLER.NS", "name": "Schaeffler India"},
    {"symbol": "TIMKEN.NS", "name": "Timken India"},
    {"symbol": "SKFINDIA.NS", "name": "SKF India"},
    {"symbol": "KALYANKJIL.NS", "name": "Kalyan Jewellers"},
    {"symbol": "SONACOMS.NS", "name": "Sona BLW"},
    {"symbol": "MOTHERSON.NS", "name": "Samvardhana Motherson"},
    {"symbol": "EXIDEIND.NS", "name": "Exide Industries"},
    {"symbol": "ARE&M.NS", "name": "Amara Raja Energy"},
    {"symbol": "BOSCHLTD.NS", "name": "Bosch"},
    {"symbol": "AARTIIND.NS", "name": "Aarti Industries"},
    {"symbol": "NAVINFLUOR.NS", "name": "Navin Fluorine"},
    {"symbol": "FLUOROCHEM.NS", "name": "Gujarat Fluorochemicals"},
    {"symbol": "TATACHEM.NS", "name": "Tata Chemicals"},
    {"symbol": "GNFC.NS", "name": "GNFC"},
    {"symbol": "CHAMBLFERT.NS", "name": "Chambal Fertilisers"},
    {"symbol": "TATACOMM.NS", "name": "Tata Communications"},
    {"symbol": "KPITTECH.NS", "name": "KPIT Technologies"},
    {"symbol": "HAPPSTMNDS.NS", "name": "Happiest Minds"},
    {"symbol": "CYIENT.NS", "name": "Cyient"},
    {"symbol": "ZENSARTECH.NS", "name": "Zensar Tech"},
    {"symbol": "BSOFT.NS", "name": "Birlasoft"},
    {"symbol": "MASTEK.NS", "name": "Mastek"},
    {"symbol": "TATAELXSI.NS", "name": "Tata Elxsi"},
    {"symbol": "AFFLE.NS", "name": "Affle India"},
    {"symbol": "LATENTVIEW.NS", "name": "Latent View Analytics"},
    {"symbol": "HONAUT.NS", "name": "Honeywell Automation"},
    {"symbol": "EMAMILTD.NS", "name": "Emami"},
    {"symbol": "JYOTHYLAB.NS", "name": "Jyothy Labs"},
    {"symbol": "HINDPETRO.NS", "name": "HPCL"},
    {"symbol": "PETRONET.NS", "name": "Petronet LNG"},
    {"symbol": "MGL.NS", "name": "Mahanagar Gas"},
    {"symbol": "IGL.NS", "name": "Indraprastha Gas"},
    {"symbol": "GUJGASLTD.NS", "name": "Gujarat Gas"},
    {"symbol": "ATGL.NS", "name": "Adani Total Gas"},
    {"symbol": "CONCOR.NS", "name": "Container Corp"},
    {"symbol": "IRFC.NS", "name": "IRFC"},
    {"symbol": "RVNL.NS", "name": "RVNL"},
    {"symbol": "NBCC.NS", "name": "NBCC India"},
    {"symbol": "NCC.NS", "name": "NCC"},
    {"symbol": "HINDCOPPER.NS", "name": "Hindustan Copper"},
    {"symbol": "MOIL.NS", "name": "MOIL"},
    {"symbol": "HINDZINC.NS", "name": "Hindustan Zinc"},
    {"symbol": "IDEA.NS", "name": "Vodafone Idea"},
    {"symbol": "INDUSTOWER.NS", "name": "Indus Towers"},
    {"symbol": "HFCL.NS", "name": "HFCL"},
    {"symbol": "TATATECH.NS", "name": "Tata Technologies"},
    {"symbol": "JIOFIN.NS", "name": "Jio Financial Services"},
    {"symbol": "SUZLON.NS", "name": "Suzlon Energy"},
    {"symbol": "SJVN.NS", "name": "SJVN"},
    {"symbol": "UNIONBANK.NS", "name": "Union Bank"},
    {"symbol": "IOB.NS", "name": "Indian Overseas Bank"},
    {"symbol": "INDIANB.NS", "name": "Indian Bank"},
    {"symbol": "CENTRALBK.NS", "name": "Central Bank"},
    {"symbol": "MAHABANK.NS", "name": "Bank of Maharashtra"},
    {"symbol": "UCOBANK.NS", "name": "UCO Bank"},
    {"symbol": "YESBANK.NS", "name": "Yes Bank"},
    {"symbol": "IDBI.NS", "name": "IDBI Bank"},
    {"symbol": "ABCAPITAL.NS", "name": "Aditya Birla Capital"},
    {"symbol": "SUNDARMFIN.NS", "name": "Sundaram Finance"},
    {"symbol": "CANFINHOME.NS", "name": "Can Fin Homes"},
    {"symbol": "POONAWALLA.NS", "name": "Poonawalla Fincorp"},
    {"symbol": "HUDCO.NS", "name": "HUDCO"},
    {"symbol": "CGPOWER.NS", "name": "CG Power"},
    {"symbol": "BHEL.NS", "name": "BHEL"},
    {"symbol": "ELGIEQUIP.NS", "name": "Elgi Equipments"},
    {"symbol": "AIAENG.NS", "name": "AIA Engineering"},
    {"symbol": "AMBER.NS", "name": "Amber Enterprises"},
    {"symbol": "JBCHEPHARM.NS", "name": "JB Chemicals"},
    {"symbol": "GLENMARK.NS", "name": "Glenmark Pharma"},
    {"symbol": "NATCOPHARM.NS", "name": "Natco Pharma"},
    {"symbol": "AJANTPHARM.NS", "name": "Ajanta Pharma"},
    {"symbol": "SYNGENE.NS", "name": "Syngene International"},
    {"symbol": "INDIAMART.NS", "name": "IndiaMART"},
    {"symbol": "JUSTDIAL.NS", "name": "Just Dial"},
    {"symbol": "INTELLECT.NS", "name": "Intellect Design Arena"},
    {"symbol": "OFSS.NS", "name": "Oracle Financial Services"},
    {"symbol": "CRISIL.NS", "name": "CRISIL"},
    {"symbol": "UBL.NS", "name": "United Breweries"},
    {"symbol": "ABFRL.NS", "name": "Aditya Birla Fashion"},
    {"symbol": "BATAINDIA.NS", "name": "Bata India"},
    {"symbol": "RELAXO.NS", "name": "Relaxo Footwears"},
    {"symbol": "ESCORTS.NS", "name": "Escorts Kubota"},
    {"symbol": "INDHOTEL.NS", "name": "Indian Hotels (Taj)"},
    {"symbol": "LODHA.NS", "name": "Macrotech Developers"},
    {"symbol": "PHOENIXLTD.NS", "name": "Phoenix Mills"},
    {"symbol": "ACC.NS", "name": "ACC"},
    {"symbol": "AMBUJACEM.NS", "name": "Ambuja Cements"},
    {"symbol": "SHREECEM.NS", "name": "Shree Cement"},
    {"symbol": "DALBHARAT.NS", "name": "Dalmia Bharat"},
    {"symbol": "JKCEMENT.NS", "name": "JK Cement"},
    {"symbol": "RAMCOCEM.NS", "name": "Ramco Cements"},
    {"symbol": "JINDALSTEL.NS", "name": "Jindal Steel & Power"},
    {"symbol": "JSWENERGY.NS", "name": "JSW Energy"},
    {"symbol": "KAJARIACER.NS", "name": "Kajaria Ceramics"},
    {"symbol": "VGUARD.NS", "name": "V-Guard Industries"},
    {"symbol": "CEATLTD.NS", "name": "CEAT"},
    {"symbol": "APOLLOTYRE.NS", "name": "Apollo Tyres"},
    {"symbol": "ABBOTINDIA.NS", "name": "Abbott India"},
    {"symbol": "GLAND.NS", "name": "Gland Pharma"},
    {"symbol": "GRANULES.NS", "name": "Granules India"},
    {"symbol": "CASTROLIND.NS", "name": "Castrol India"},

    {"symbol": "OLECTRA.NS", "name": "Olectra Greentech"},
    {"symbol": "TRIDENT.NS", "name": "Trident"},
    {"symbol": "RAYMOND.NS", "name": "Raymond"},
]

US_STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corporation"},
    {"symbol": "GOOGL", "name": "Alphabet Inc. (Class A)"},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    {"symbol": "META", "name": "Meta Platforms Inc."},
    {"symbol": "TSLA", "name": "Tesla Inc."},
    {"symbol": "BRK-B", "name": "Berkshire Hathaway (Class B)"},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
    {"symbol": "V", "name": "Visa Inc."},
    {"symbol": "UNH", "name": "UnitedHealth Group"},
    {"symbol": "JNJ", "name": "Johnson & Johnson"},
    {"symbol": "XOM", "name": "Exxon Mobil Corporation"},
    {"symbol": "WMT", "name": "Walmart Inc."},
    {"symbol": "MA", "name": "Mastercard Inc."},
    {"symbol": "PG", "name": "Procter & Gamble Co."},
    {"symbol": "HD", "name": "Home Depot Inc."},
    {"symbol": "CVX", "name": "Chevron Corporation"},
    {"symbol": "LLY", "name": "Eli Lilly and Company"},
    {"symbol": "ABBV", "name": "AbbVie Inc."},
    {"symbol": "MRK", "name": "Merck & Co. Inc."},
    {"symbol": "KO", "name": "Coca-Cola Company"},
    {"symbol": "PEP", "name": "PepsiCo Inc."},
    {"symbol": "AVGO", "name": "Broadcom Inc."},
    {"symbol": "COST", "name": "Costco Wholesale"},
    {"symbol": "BAC", "name": "Bank of America Corp"},
    {"symbol": "TMO", "name": "Thermo Fisher Scientific"},
    {"symbol": "MCD", "name": "McDonald's Corporation"},
    {"symbol": "CSCO", "name": "Cisco Systems Inc."},
    {"symbol": "ABT", "name": "Abbott Laboratories"},
    {"symbol": "CRM", "name": "Salesforce Inc."},
    {"symbol": "ACN", "name": "Accenture plc"},
    {"symbol": "ORCL", "name": "Oracle Corporation"},
    {"symbol": "DHR", "name": "Danaher Corporation"},
    {"symbol": "NFLX", "name": "Netflix Inc."},
    {"symbol": "AMD", "name": "Advanced Micro Devices"},
    {"symbol": "TXN", "name": "Texas Instruments"},
    {"symbol": "ADBE", "name": "Adobe Inc."},
    {"symbol": "CMCSA", "name": "Comcast Corporation"},
    {"symbol": "NKE", "name": "Nike Inc."},
    {"symbol": "WFC", "name": "Wells Fargo & Company"},
    {"symbol": "PM", "name": "Philip Morris International"},
    {"symbol": "NEE", "name": "NextEra Energy Inc."},
    {"symbol": "INTC", "name": "Intel Corporation"},
    {"symbol": "DIS", "name": "Walt Disney Company"},
    {"symbol": "UPS", "name": "United Parcel Service"},
    {"symbol": "QCOM", "name": "Qualcomm Inc."},
    {"symbol": "RTX", "name": "RTX Corporation"},
    {"symbol": "BA", "name": "Boeing Company"},
    {"symbol": "IBM", "name": "IBM Corporation"},
    {"symbol": "GE", "name": "General Electric Co."},
    {"symbol": "CAT", "name": "Caterpillar Inc."},
    {"symbol": "INTU", "name": "Intuit Inc."},
    {"symbol": "AMAT", "name": "Applied Materials Inc."},
    {"symbol": "GS", "name": "Goldman Sachs Group"},
    {"symbol": "MS", "name": "Morgan Stanley"},
    {"symbol": "AXP", "name": "American Express Co."},
    {"symbol": "NOW", "name": "ServiceNow Inc."},
    {"symbol": "BKNG", "name": "Booking Holdings Inc."},
    {"symbol": "ISRG", "name": "Intuitive Surgical"},
    {"symbol": "LMT", "name": "Lockheed Martin Corp."},
    {"symbol": "MDLZ", "name": "Mondelez International"},
    {"symbol": "SYK", "name": "Stryker Corporation"},
    {"symbol": "GILD", "name": "Gilead Sciences Inc."},
    {"symbol": "BLK", "name": "BlackRock Inc."},
    {"symbol": "ADI", "name": "Analog Devices Inc."},
    {"symbol": "VRTX", "name": "Vertex Pharmaceuticals"},
    {"symbol": "MMC", "name": "Marsh & McLennan"},
    {"symbol": "LRCX", "name": "Lam Research Corp."},
    {"symbol": "PANW", "name": "Palo Alto Networks"},
    {"symbol": "REGN", "name": "Regeneron Pharmaceuticals"},
    {"symbol": "SNPS", "name": "Synopsys Inc."},
    {"symbol": "CDNS", "name": "Cadence Design Systems"},
    {"symbol": "KLAC", "name": "KLA Corporation"},
    {"symbol": "SLB", "name": "Schlumberger Limited"},
    {"symbol": "EOG", "name": "EOG Resources Inc."},
    {"symbol": "COP", "name": "ConocoPhillips"},
    {"symbol": "MMM", "name": "3M Company"},
    {"symbol": "PFE", "name": "Pfizer Inc."},
    {"symbol": "T", "name": "AT&T Inc."},
    {"symbol": "VZ", "name": "Verizon Communications"},
    {"symbol": "UBER", "name": "Uber Technologies"},
    {"symbol": "ABNB", "name": "Airbnb Inc."},
    {"symbol": "PYPL", "name": "PayPal Holdings Inc."},
    {"symbol": "XYZ", "name": "Block Inc. (formerly Square)"},
    {"symbol": "SHOP", "name": "Shopify Inc."},
    {"symbol": "COIN", "name": "Coinbase Global Inc."},
    {"symbol": "PLTR", "name": "Palantir Technologies"},
    {"symbol": "RIVN", "name": "Rivian Automotive"},
    {"symbol": "LCID", "name": "Lucid Group Inc."},
    {"symbol": "SNOW", "name": "Snowflake Inc."},
    {"symbol": "DDOG", "name": "Datadog Inc."},
    {"symbol": "CRWD", "name": "CrowdStrike Holdings"},
    {"symbol": "ZS", "name": "Zscaler Inc."},
    {"symbol": "NET", "name": "Cloudflare Inc."},
    {"symbol": "SOFI", "name": "SoFi Technologies"},
    {"symbol": "HOOD", "name": "Robinhood Markets"},
    {"symbol": "MARA", "name": "Marathon Digital Holdings"},
    {"symbol": "SMCI", "name": "Super Micro Computer"},
    {"symbol": "ARM", "name": "Arm Holdings plc"},
]

_quote_cache = {}
_CACHE_TTL = 120

def _get_cached_quote(symbol):
    entry = _quote_cache.get(symbol)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        return entry["data"]
    return None

def _set_cached_quote(symbol, data):
    _quote_cache[symbol] = {"data": data, "ts": time.time()}



# ---------------------------------------------------------------------------
# Fallback data providers (used when yfinance is rate-limited / down)
# ---------------------------------------------------------------------------

def _fetch_quote_stooq(symbol: str) -> dict | None:
    """Fetch a quote from Stooq CSV endpoint (free, no API key).
    Works for US tickers (e.g. AAPL) and NSE tickers (e.g. RELIANCE.NS).
    Returns a quote dict on success, None on failure.
    """
    try:
        # Stooq uses .IN for Indian NSE/BSE stocks, not .NS / .BO
        stooq_sym = symbol.lower().replace("-", ".")
        if stooq_sym.endswith(".ns") or stooq_sym.endswith(".bo"):
            stooq_sym = stooq_sym.rsplit(".", 1)[0] + ".in"
        url = f"https://stooq.com/q/l/?s={stooq_sym}&f=sd2t2ohlcv&h&e=csv"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            content = resp.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        if not rows:
            return None
        row = rows[-1]  # most recent row
        close = float(row.get("Close", 0) or 0)
        opn   = float(row.get("Open",  0) or 0)
        high  = float(row.get("High",  0) or 0)
        low   = float(row.get("Low",   0) or 0)
        vol   = int(float(row.get("Volume", 0) or 0))
        if close == 0:
            return None
        # Stooq gives only one day; use open as prev_close proxy when prev unavailable
        prev = opn if opn > 0 else close
        change = round(close - prev, 2)
        change_pct = round((change / prev * 100), 2) if prev else 0
        return {
            "symbol": symbol.upper(),
            "price": round(close, 2),
            "change": change,
            "change_pct": change_pct,
            "prev_close": round(prev, 2),
            "open": round(opn, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "volume": vol,
            "source": "stooq",
        }
    except Exception as exc:
        _logger.debug("Stooq fallback failed for %s: %s", symbol, exc)
        return None


def _fetch_quote_yahoo_json(symbol: str) -> dict | None:
    """Fetch a quote via Yahoo Finance v8 chart API directly (plain HTTP, no yfinance lib).
    Sometimes succeeds when the yfinance library is blocked due to cookie / session issues.
    Returns a quote dict on success, None on failure.
    """
    try:
        url = (
            f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            "?interval=1d&range=5d&includePrePost=false"
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        result_data = data["chart"]["result"][0]
        meta = result_data["meta"]
        indicators = result_data["indicators"]["quote"][0]

        closes = [c for c in indicators.get("close", []) if c is not None]
        opens  = [o for o in indicators.get("open",  []) if o is not None]
        highs  = [h for h in indicators.get("high",  []) if h is not None]
        lows   = [l for l in indicators.get("low",   []) if l is not None]
        vols   = [v for v in indicators.get("volume",[]) if v is not None]

        if not closes:
            return None

        close = round(float(closes[-1]), 2)
        prev  = round(float(closes[-2]), 2) if len(closes) > 1 else round(float(meta.get("chartPreviousClose", close)), 2)
        opn   = round(float(opens[-1]),  2) if opens  else close
        high  = round(float(highs[-1]),  2) if highs  else close
        low   = round(float(lows[-1]),   2) if lows   else close
        vol   = int(vols[-1]) if vols else 0
        change = round(close - prev, 2)
        change_pct = round((change / prev * 100), 2) if prev else 0
        return {
            "symbol": symbol.upper(),
            "price": close,
            "change": change,
            "change_pct": change_pct,
            "prev_close": prev,
            "open": opn,
            "high": high,
            "low": low,
            "volume": vol,
            "source": "yahoo_json",
        }
    except Exception as exc:
        _logger.debug("Yahoo JSON fallback failed for %s: %s", symbol, exc)
        return None


def _fetch_quote_fallback(symbol: str) -> dict | None:
    """Try free fallback sources in order. Returns None if all fail."""
    for fn in (_fetch_quote_stooq, _fetch_quote_yahoo_json):
        result = fn(symbol)
        if result and result.get("price", 0) > 0:
            _logger.info("Fallback (%s) succeeded for %s", fn.__name__, symbol)
            return result
    return None


# ---------------------------------------------------------------------------


def _fetch_history_sync(symbol, period, interval):
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)
    if df.empty:
        raise ValueError(f"No data found for {symbol}")
    return df


def _fetch_quote_sync(symbol):
    cached = _get_cached_quote(symbol)
    if cached:
        return cached

    ticker = yf.Ticker(symbol)
    try:
        info = ticker.fast_info
        price = float(info.last_price) if hasattr(info, 'last_price') else 0
        prev = float(info.previous_close) if hasattr(info, 'previous_close') else price
        opn = float(info.open) if hasattr(info, 'open') else price
        high = float(info.day_high) if hasattr(info, 'day_high') else price
        low = float(info.day_low) if hasattr(info, 'day_low') else price
        volume = int(info.last_volume) if hasattr(info, 'last_volume') else 0
        # Guard against yfinance returning 0 for all fields (silent rate-limit)
        if price == 0:
            raise ValueError("yfinance returned zero price (likely rate-limited)")
    except Exception as yf_err:
        _logger.debug("yfinance fast_info failed for %s (%s), trying history...", symbol, yf_err)
        try:
            hist = ticker.history(period="5d")
            if hist.empty:
                raise ValueError("empty history")
            latest = hist.iloc[-1]
            prev_row = hist.iloc[-2] if len(hist) > 1 else latest
            price = round(float(latest['Close']), 2)
            prev = round(float(prev_row['Close']), 2)
            opn = round(float(latest['Open']), 2)
            high = round(float(latest['High']), 2)
            low = round(float(latest['Low']), 2)
            volume = int(latest['Volume'])
            if price == 0:
                raise ValueError("history also returned zero price")
        except Exception as hist_err:
            _logger.warning("yfinance fully failed for %s (%s), trying fallback providers...", symbol, hist_err)
            fb = _fetch_quote_fallback(symbol)
            if fb:
                _set_cached_quote(symbol, fb)
                return fb
            # All sources failed — return zeros so the heatmap still renders
            _logger.error("All data sources failed for %s, returning zeros", symbol)
            return {"symbol": symbol.upper(), "price": 0, "change": 0, "change_pct": 0,
                    "prev_close": 0, "open": 0, "high": 0, "low": 0, "volume": 0}

    change = round(price - prev, 2)
    change_pct = round((change / prev * 100), 2) if prev else 0
    result = {
        "symbol": symbol.upper(),
        "price": round(price, 2),
        "change": change,
        "change_pct": change_pct,
        "prev_close": round(prev, 2),
        "open": round(opn, 2),
        "high": round(high, 2),
        "low": round(low, 2),
        "volume": volume
    }
    _set_cached_quote(symbol, result)
    return result


def _parse_batch_df(df, symbols_list):
    """Parse a yf.download DataFrame into quote dicts for each symbol.
    Handles both old yfinance (Ticker, Price) and new yfinance (Price, Ticker) column formats.
    """
    results = []

    is_multi = isinstance(df.columns, pd.MultiIndex)
    ticker_level = None
    if is_multi and len(symbols_list) > 1:
        level0_vals = set(str(v) for v in df.columns.get_level_values(0))
        price_cols = {"Close", "Open", "High", "Low", "Volume", "Adj Close"}
        if level0_vals & price_cols:
            ticker_level = 1
        else:
            ticker_level = 0

    for symbol in symbols_list:
        try:
            if len(symbols_list) == 1:
                sym_df = df
            elif is_multi:
                tickers_at_level = set(str(v) for v in df.columns.get_level_values(ticker_level))
                
                if symbol not in tickers_at_level:
                    results.append({"symbol": symbol.upper(), "price": 0, "change": 0, "change_pct": 0,
                                    "prev_close": 0, "open": 0, "high": 0, "low": 0, "volume": 0})
                    continue
                if ticker_level == 1:
                    sym_df = df.xs(symbol, level=1, axis=1)
                else:
                    sym_df = df[symbol]
            else:
                sym_df = None

            if sym_df is None or sym_df.empty or sym_df["Close"].dropna().empty:
                results.append({"symbol": symbol.upper(), "price": 0, "change": 0, "change_pct": 0,
                                "prev_close": 0, "open": 0, "high": 0, "low": 0, "volume": 0})
                continue

            sym_df = sym_df.dropna(subset=["Close"])
            latest = sym_df.iloc[-1]
            prev_row = sym_df.iloc[-2] if len(sym_df) > 1 else latest

            price = round(float(latest["Close"]), 2)
            prev_close = round(float(prev_row["Close"]), 2)
            opn = round(float(latest["Open"]), 2)
            high = round(float(latest["High"]), 2)
            low = round(float(latest["Low"]), 2)
            vol = int(latest["Volume"]) if not pd.isna(latest["Volume"]) else 0
            change = round(price - prev_close, 2)
            change_pct = round((change / prev_close * 100), 2) if prev_close else 0

            quote = {
                "symbol": symbol.upper(),
                "price": price, "change": change, "change_pct": change_pct,
                "prev_close": prev_close, "open": opn, "high": high, "low": low, "volume": vol
            }
            _set_cached_quote(symbol, quote)
            results.append(quote)
        except Exception:
            results.append({"symbol": symbol.upper(), "price": 0, "change": 0, "change_pct": 0,
                            "prev_close": 0, "open": 0, "high": 0, "low": 0, "volume": 0})
    return results


def _fetch_batch_quotes_sync(symbols):
    """Fetch quotes for many symbols concurrently using ThreadPoolExecutor.
    Uses fast_info (individual) which is much more reliable than yf.download batch.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import logging
    logger = logging.getLogger(__name__)

    results = []
    uncached = []
    for s in symbols:
        cached = _get_cached_quote(s)
        if cached:
            results.append(cached)
        else:
            uncached.append(s)

    if not uncached:
        return results

    logger.info(f"Fetching {len(uncached)} uncached symbols concurrently...")

    MAX_WORKERS = min(10, len(uncached))  # Cap at 10 to avoid rate limits
    fetched = {}

    def _safe_fetch(sym):
        try:
            return sym, _fetch_quote_sync(sym)
        except Exception as exc:
            _logger.warning("_safe_fetch failed for %s: %s, trying fallback", sym, exc)
            fb = _fetch_quote_fallback(sym)
            if fb:
                _set_cached_quote(sym, fb)
                return sym, fb
            return sym, {"symbol": sym.upper(), "price": 0, "change": 0, "change_pct": 0,
                         "prev_close": 0, "open": 0, "high": 0, "low": 0, "volume": 0}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(_safe_fetch, sym): sym for sym in uncached}
        for future in as_completed(futures):
            try:
                sym, quote = future.result(timeout=15)
                fetched[sym] = quote
            except Exception:
                sym = futures[future]
                fetched[sym] = {"symbol": sym.upper(), "price": 0, "change": 0, "change_pct": 0,
                                "prev_close": 0, "open": 0, "high": 0, "low": 0, "volume": 0}

    for sym in uncached:
        results.append(fetched.get(sym, {"symbol": sym.upper(), "price": 0, "change": 0, "change_pct": 0,
                                          "prev_close": 0, "open": 0, "high": 0, "low": 0, "volume": 0}))

    logger.info(f"Fetched {len(uncached)} symbols, {sum(1 for s in uncached if fetched.get(s, {}).get('price', 0) > 0)} with data")
    return results


def _fetch_company_sync(symbol):
    ticker = yf.Ticker(symbol)
    info = ticker.info
    return {
        "name": info.get("longName", info.get("shortName", symbol)),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "market_cap": info.get("marketCap", 0),
        "pe_ratio": info.get("trailingPE", None),
        "forward_pe": info.get("forwardPE", None),
        "pb_ratio": info.get("priceToBook", None),
        "eps": info.get("trailingEps", None),
        "dividend_yield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else 0,
        "week_52_high": info.get("fiftyTwoWeekHigh", 0),
        "week_52_low": info.get("fiftyTwoWeekLow", 0),
        "description": info.get("longBusinessSummary", ""),
        "revenue": info.get("totalRevenue", 0),
        "profit_margins": round(info.get("profitMargins", 0) * 100, 2) if info.get("profitMargins") else 0,
        "roe": round(info.get("returnOnEquity", 0) * 100, 2) if info.get("returnOnEquity") else 0,
        "debt_to_equity": info.get("debtToEquity", 0),
        "book_value": info.get("bookValue", 0),
        "promoter_holding": info.get("heldPercentInsiders", 0),
    }


def _generate_pros_cons(info, result):
    """Auto-generate pros and cons based on financial metrics."""
    pros = []

    cons = []
    roe = result.get("roe", 0) or 0
    pe = result.get("pe_ratio") or 0
    de = result.get("debt_to_equity") or 0
    dy = result.get("dividend_yield", 0) or 0
    pm = result.get("profit_margins", 0) or 0
    om = result.get("operating_margins", 0) or 0
    roce = result.get("roce", 0) or 0

    if roe > 15:
        pros.append(f"Company has a good return on equity (ROE) track record: {roe:.1f}%")
    elif roe > 0 and roe < 5:
        cons.append(f"ROE is low at {roe:.1f}%, indicating poor profitability")
    
    if dy > 2:
        pros.append(f"Company has been maintaining a healthy dividend payout of {dy:.1f}%")
    elif dy == 0:
        cons.append("Company does not pay any dividends")
    
    if de > 0 and de < 50:
        pros.append("Company is almost debt free")
    elif de > 150:
        cons.append(f"Company has a high debt-to-equity ratio of {de:.0f}%")
    
    if pm > 20:
        pros.append(f"Company has strong profit margins of {pm:.1f}%")
    elif pm > 0 and pm < 5:
        cons.append(f"Company has thin profit margins of {pm:.1f}%")
    
    if roce > 20:
        pros.append(f"Company has excellent ROCE of {roce:.1f}%")
    
    if pe > 0 and pe < 15:
        pros.append(f"Stock is trading at a reasonable P/E of {pe:.1f}")
    elif pe > 40:
        cons.append(f"Stock is trading at {pe:.1f} times its earnings")
    
    pb = result.get("pb_ratio") or 0
    if pb > 5:
        cons.append(f"Stock is trading at {pb:.1f} times its book value")
    
    if om > 25:
        pros.append(f"Strong operating margins of {om:.1f}%")
    
    rev = info.get("revenueGrowth") or 0
    if rev > 0.1:
        pros.append(f"Revenue growing at {rev*100:.1f}%")
    elif rev < -0.05:
        cons.append(f"Company has delivered a poor sales growth of {rev*100:.1f}%")

    return pros[:5], cons[:5]


def _fetch_peer_data(symbol, industry, sector, is_indian):
    """Find peer companies using local sector maps to avoid N network calls."""
    stock_list = NSE_STOCKS if is_indian else US_STOCKS
    sector_map = _NSE_SECTOR_MAP if is_indian else _US_SECTOR_MAP
    peers = []
    
    # 1. Identify peers from local map first (O(1) lookup vs O(N) network)
    candidates = []
    target_sector = None
    
    # Try to find sector from map if not provided or valid
    if not sector or sector == "N/A":
        normalized_symbol = symbol.replace(".NS", "").replace(".BO", "")
        if normalized_symbol in sector_map:
            target_sector = sector_map[normalized_symbol][0]
    else:
        target_sector = sector

    if target_sector and target_sector != "N/A":
        for stock in stock_list:
            s_sym = stock["symbol"]
            if s_sym == symbol:
                continue
            
            # Check map
            norm = s_sym.replace(".NS", "").replace(".BO", "")
            if norm in sector_map:
                s_sect = sector_map[norm][0]
                if s_sect == target_sector:
                    candidates.append(s_sym)
    
    # If no candidates found via map (fallback to old method only if needed, but limit it)
    if not candidates and industry:
         # Fallback: scan list but don't call .info yet, just simple exact match if we had industry map
         # Here we just skip to save time, or use the top stocks from same list
         pass

    # Limit candidates
    candidates = candidates[:7]
    
    # 2. Fetch data for candidates in parallel
    if candidates:
        from app.services.market_data import _fetch_batch_quotes_sync
        quotes = _fetch_batch_quotes_sync(candidates)
        
        for q in quotes:
            if q.get("price", 0) > 0:
                # We need some extra info usually found in .info for PE, Market Cap
                # _fetch_batch_quotes_sync returns basic price data. 
                # For peers we need: cmp, pe, market_cap, div_yield, np_qtr, roce
                # fetch_quote_sync only gives price.
                # We need to fetch full info for these few peers.
                pass

        # Since we need fundamental data (PE, Market Cap), we must call .info 
        # BUT now we only do it for 5-7 stocks, not 200.
        # And we can do it in parallel.
        
        def _get_peer_fund(s):
            try:
                t = yf.Ticker(s)
                inf = t.info
                return {
                    "symbol": s,
                    "name": inf.get("shortName", s),
                    "cmp": round(inf.get("currentPrice", inf.get("regularMarketPrice", 0)) or 0, 2),
                    "pe": round(inf.get("trailingPE", 0) or 0, 2),
                    "market_cap": inf.get("marketCap", 0) or 0,
                    "div_yield": round((inf.get("dividendYield", 0) or 0) * 100, 2),
                    "np_qtr": inf.get("netIncomeToCommon", 0) or 0,
                    "roce": round((inf.get("returnOnAssets", 0) or 0) * 100, 2),
                }
            except:
                return None

        with ThreadPoolExecutor(max_workers=len(candidates)) as executor:
            fut_to_stock = {executor.submit(_get_peer_fund, s): s for s in candidates}
            for fut in as_completed(fut_to_stock):
                res = fut.result()
                if res:
                    peers.append(res)

    return peers


def _fetch_financials_concurrent(symbol):
    """Fetch all financial data concurrently to reduce latency."""
    ticker = yf.Ticker(symbol)
    
    # Define tasks
    def get_info():
        return ticker.info
    
    def get_fin():
        return ticker.financials
    
    def get_q_fin():
        return ticker.quarterly_financials
    
    def get_bs():
        return ticker.quarterly_balance_sheet
    
    def get_cf():
        return ticker.quarterly_cashflow
    
    def get_hist_cagr():
        # Fetch max period needed for CAGR
        return ticker.history(period="10y")

    def get_divs():
        return ticker.dividends

    with ThreadPoolExecutor(max_workers=7) as executor:
        f_info = executor.submit(get_info)
        f_fin = executor.submit(get_fin)
        f_qfin = executor.submit(get_q_fin)
        f_bs = executor.submit(get_bs)
        f_cf = executor.submit(get_cf)
        f_hist = executor.submit(get_hist_cagr)
        f_divs = executor.submit(get_divs)

        # Wait for info first as it's needed for basic data
        try:
            info = f_info.result(timeout=10)
        except:
            info = {}

        # Basic Data
        is_indian = symbol.upper().endswith(".NS") or symbol.upper().endswith(".BO")
        current_price = info.get("currentPrice", info.get("regularMarketPrice", 0)) or 0
        face_value = info.get("faceValue", None)
        
        # ROCE Calculation
        roce_val = None
        try:
            ebit = info.get("ebitda", 0) or 0
            interest = info.get("interestExpense", 0) or 0
            if interest and interest < 0:
                ebit = ebit + interest
            total_assets = info.get("totalAssets", 0) or 0
            current_liab = info.get("totalCurrentLiabilities", 0) or 0
            capital_employed = total_assets - current_liab
            if capital_employed > 0 and ebit > 0:
                roce_val = round((ebit / capital_employed) * 100, 2)
        except:
            pass

        result = {
            "name": info.get("longName", symbol),
            "symbol": symbol.upper(),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "market_cap": info.get("marketCap", 0),
            "current_price": round(current_price, 2),
            "face_value": face_value,
            "pe_ratio": info.get("trailingPE", None),
            "forward_pe": info.get("forwardPE", None),
            "pb_ratio": info.get("priceToBook", None),
            "eps": info.get("trailingEps", None),
            "book_value": info.get("bookValue", None),
            "dividend_yield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else 0,
            "roe": round(info.get("returnOnEquity", 0) * 100, 2) if info.get("returnOnEquity") else 0,
            "roce": roce_val,
            "debt_to_equity": info.get("debtToEquity", None),
            "profit_margins": round(info.get("profitMargins", 0) * 100, 2) if info.get("profitMargins") else 0,
            "revenue": info.get("totalRevenue", 0),
            "net_income": info.get("netIncomeToCommon", 0),
            "operating_margins": round(info.get("operatingMargins", 0) * 100, 2) if info.get("operatingMargins") else 0,
            "free_cashflow": info.get("freeCashflow", 0),
            "total_debt": info.get("totalDebt", 0),
            "total_cash": info.get("totalCash", 0),
            "week_52_high": info.get("fiftyTwoWeekHigh", 0),
            "week_52_low": info.get("fiftyTwoWeekLow", 0),
            "avg_volume": info.get("averageVolume", 0),
            "promoter_holding": round(info.get("heldPercentInsiders", 0) * 100, 2) if info.get("heldPercentInsiders") else 0,
            "institutional_holding": round(info.get("heldPercentInstitutions", 0) * 100, 2) if info.get("heldPercentInstitutions") else 0,
            "dii_holding": None, "fii_holding": None,
        }

        # Generative Pros/Cons (CPU bound, fast)
        pros, cons = _generate_pros_cons(info, result)
        result["pros"] = pros
        result["cons"] = cons

        # Process Quarterly Results
        try:
            qf = f_qfin.result(timeout=5)
            if qf is not None and not qf.empty:
                quarters = []
                for col in qf.columns[:12]:
                    revenue = _safe_int_from_df(qf, "Total Revenue", col)
                    op_income = _safe_int_from_df(qf, "Operating Income", col)
                    net_income = _safe_int_from_df(qf, "Net Income", col)
                    gross = _safe_int_from_df(qf, "Gross Profit", col)
                    ebitda = _safe_int_from_df(qf, "EBITDA", col)
                    interest = _safe_int_from_df(qf, "Interest Expense", col)
                    tax = _safe_int_from_df(qf, "Tax Provision", col)
                    expenses = (revenue - op_income) if revenue and op_income else None
                    opm = round((op_income / revenue) * 100) if revenue and op_income and revenue > 0 else None
                    shares = info.get("sharesOutstanding", 0)
                    eps_q = round(net_income / shares, 2) if net_income and shares and shares > 0 else None

                    quarters.append({
                        "quarter": col.strftime("%b %Y"),
                        "revenue": revenue, "expenses": expenses, "operating_profit": op_income,
                        "opm_pct": opm, "other_income": _safe_int_from_df(qf, "Other Income", col),
                        "interest": interest, "depreciation": _safe_int_from_df(qf, "Reconciled Depreciation", col),
                        "profit_before_tax": _safe_int_from_df(qf, "Pretax Income", col),
                        "tax_pct": round((tax / (tax + net_income)) * 100) if tax and net_income and (tax + net_income) > 0 else None,
                        "net_income": net_income, "ebitda": ebitda, "gross_profit": gross, "eps": eps_q,
                    })
                result["quarterly_results"] = quarters
            else:
                result["quarterly_results"] = []
        except:
            result["quarterly_results"] = []

        # Process Dividend Payouts (needs Dividends + Annual Financials)
        try:
            divs = f_divs.result(timeout=5)
            af = f_fin.result(timeout=5)
            annual = []
            if af is not None and not af.empty:
                for col in af.columns[:12]:
                    revenue = _safe_int_from_df(af, "Total Revenue", col)
                    op_income = _safe_int_from_df(af, "Operating Income", col)
                    net_income = _safe_int_from_df(af, "Net Income", col)
                    expenses = (revenue - op_income) if revenue and op_income else None
                    opm = round((op_income / revenue) * 100) if revenue and op_income and revenue > 0 else None
                    shares = info.get("sharesOutstanding", 0)
                    eps_a = round(net_income / shares, 2) if net_income and shares and shares > 0 else None
                    
                    div_payout = None
                    try:
                        if divs is not None and not divs.empty:
                            year_divs = divs[divs.index.year == col.year]
                            if not year_divs.empty and eps_a and eps_a > 0:
                                div_payout = round((year_divs.sum() / eps_a) * 100)
                    except: pass

                    annual.append({
                        "period": col.strftime("%b %Y"),
                        "revenue": revenue, "expenses": expenses, "operating_profit": op_income,
                        "opm_pct": opm, "other_income": _safe_int_from_df(af, "Other Income", col),
                        "interest": _safe_int_from_df(af, "Interest Expense", col),
                        "depreciation": _safe_int_from_df(af, "Reconciled Depreciation", col),
                        "profit_before_tax": _safe_int_from_df(af, "Pretax Income", col),
                        "tax_pct": _safe_int_from_df(af, "Tax Provision", col), # raw value or calc?
                        "net_income": net_income, "eps": eps_a, "dividend_payout_pct": div_payout,
                    })
                result["annual_results"] = annual
            else:
                result["annual_results"] = []
        except:
            result["annual_results"] = []

        # Process CAGR (Compounded Growth)
        try:
            growth = {}
            # Re-use 'af' from above
            if af is not None and not af.empty:
                rev_series = af.loc["Total Revenue"] if "Total Revenue" in af.index else None
                ni_series = af.loc["Net Income"] if "Net Income" in af.index else None
                for label, years in [("3Y", 3), ("5Y", 5), ("10Y", 10)]:
                    if rev_series is not None and len(rev_series) >= years:
                        latest_rev = float(rev_series.iloc[0])
                        old_rev = float(rev_series.iloc[min(years-1, len(rev_series)-1)])
                        if old_rev > 0 and latest_rev > 0:
                            growth[f"sales_growth_{label}"] = round(((latest_rev / old_rev) ** (1/years) - 1) * 100, 1)
                    if ni_series is not None and len(ni_series) >= years:
                        latest_ni = float(ni_series.iloc[0])
                        old_ni = float(ni_series.iloc[min(years-1, len(ni_series)-1)])
                        if old_ni > 0 and latest_ni > 0:
                            growth[f"profit_growth_{label}"] = round(((latest_ni / old_ni) ** (1/years) - 1) * 100, 1)
            
            # Stock Price CAGR
            hist = f_hist.result(timeout=10)
            if hist is not None and not hist.empty and len(hist) > 10:
                end_price = float(hist["Close"].iloc[-1])
                for label, years in [("1Y", 1), ("3Y", 3), ("5Y", 5), ("10Y", 10)]:
                     # approximate trading days
                    days = years * 252
                    if len(hist) > days:
                        start_price = float(hist["Close"].iloc[-days])
                        if start_price > 0:
                             growth[f"stock_cagr_{label}"] = round(((end_price / start_price) ** (1/years) - 1) * 100, 1)

            if result.get("roe") and result.get("roe") > 0:
                growth["roe_last_year"] = result["roe"]
            
            result["compounded_growth"] = growth
        except:
            result["compounded_growth"] = {}

        # Process Balance Sheet
        try:
            bs = f_bs.result(timeout=5)
            if bs is not None and not bs.empty:
                latest = bs.iloc[:, 0]
                result["balance_sheet"] = {
                    "quarter": bs.columns[0].strftime("%b %Y"),
                    "total_assets": _safe_int(latest, "Total Assets"),
                    "total_liabilities": _safe_int(latest, "Total Liabilities Net Minority Interest"),
                    "total_equity": _safe_int(latest, "Stockholders Equity"),
                    "total_debt": _safe_int(latest, "Total Debt"),
                    "cash_equivalents": _safe_int(latest, "Cash And Cash Equivalents"),
                }
            else:
                result["balance_sheet"] = {}
        except:
            result["balance_sheet"] = {}

        # Process Cash Flow
        try:
            cf = f_cf.result(timeout=5)
            if cf is not None and not cf.empty:
                latest = cf.iloc[:, 0]
                result["cashflow"] = {
                    "quarter": cf.columns[0].strftime("%b %Y"),
                    "operating_cashflow": _safe_int(latest, "Operating Cash Flow"),
                    "investing_cashflow": _safe_int(latest, "Investing Cash Flow"),
                    "financing_cashflow": _safe_int(latest, "Financing Cash Flow"),
                    "free_cashflow": _safe_int(latest, "Free Cash Flow"),
                }
            else:
                result["cashflow"] = {}
        except:
            result["cashflow"] = {}
        
        # Process Peers (Concurrent)
        try:
            industry = info.get("industry", "")
            sector = info.get("sector", "")
            if industry or sector:
                result["peers"] = _fetch_peer_data(symbol, industry, sector, is_indian)
            else:
                result["peers"] = []
        except:
             result["peers"] = []

        return result

def _fetch_financials_sync(symbol):
    # Wrapper to maintain compatibility but use new concurrent instruction
    return _fetch_financials_concurrent(symbol)


def _safe_int_from_df(df, field, col):
    """Safely extract an integer value from a DataFrame."""
    try:
        if field in df.index:
            val = df.loc[field, col]
            if val is not None and not pd.isna(val):
                return int(val)
    except:
        pass
    return None


def _fetch_stock_detail_sync(symbol):
    """Comprehensive stock detail: returns, trade info, price info, securities, holdings, actions."""
    ticker = yf.Ticker(symbol)
    info = ticker.info

    is_indian = symbol.upper().endswith(".NS") or symbol.upper().endswith(".BO")
    benchmark_symbol = "^NSEI" if is_indian else "^GSPC"
    benchmark_name = "NIFTY 50" if is_indian else "S&P 500"
    currency = "INR" if is_indian else "USD"
    currency_symbol = "₹" if is_indian else "$"

    returns_data = {}
    periods = {"1W": "5d", "1M": "1mo", "YTD": "ytd", "1Y": "1y", "3Y": "3y", "5Y": "5y"}
    try:
        for label, period in periods.items():
            try:
                stock_hist = ticker.history(period=period)
                bench_hist = yf.Ticker(benchmark_symbol).history(period=period)
                if not stock_hist.empty and len(stock_hist) > 1:
                    stock_return = round(((stock_hist['Close'].iloc[-1] / stock_hist['Close'].iloc[0]) - 1) * 100, 2)
                else:
                    stock_return = None
                if not bench_hist.empty and len(bench_hist) > 1:
                    bench_return = round(((bench_hist['Close'].iloc[-1] / bench_hist['Close'].iloc[0]) - 1) * 100, 2)
                else:
                    bench_return = None
                returns_data[label] = {"stock": stock_return, "benchmark": bench_return}
            except:
                returns_data[label] = {"stock": None, "benchmark": None}
    except:
        pass

    volume = info.get("volume", 0) or 0
    avg_volume = info.get("averageVolume", 0) or 0
    avg_volume_10d = info.get("averageVolume10days", 0) or 0
    market_cap = info.get("marketCap", 0) or 0
    float_shares = info.get("floatShares", 0) or 0
    shares_outstanding = info.get("sharesOutstanding", 0) or 0
    last_price = info.get("currentPrice", info.get("regularMarketPrice", 0)) or 0
    traded_value = round(volume * last_price, 2) if volume and last_price else 0
    face_value = info.get("faceValue", None)

    trade_info = {
        "volume": volume,
        "avg_volume": avg_volume,
        "avg_volume_10d": avg_volume_10d,
        "traded_value": traded_value,
        "market_cap": market_cap,
        "float_shares": float_shares,
        "shares_outstanding": shares_outstanding,
        "face_value": face_value,
    }

    high_52w = info.get("fiftyTwoWeekHigh", 0) or 0
    low_52w = info.get("fiftyTwoWeekLow", 0) or 0
    day_avg_50 = info.get("fiftyDayAverage", 0) or 0
    day_avg_200 = info.get("twoHundredDayAverage", 0) or 0
    beta = info.get("beta", None)

    daily_vol = None
    annual_vol = None
    try:
        hist_30d = ticker.history(period="1mo")
        if not hist_30d.empty and len(hist_30d) > 2:
            daily_returns = hist_30d['Close'].pct_change().dropna()
            daily_vol = round(daily_returns.std() * 100, 2)
            annual_vol = round(daily_vol * (252 ** 0.5), 2)
    except:
        pass

    price_info = {
        "week_52_high": high_52w,
        "week_52_low": low_52w,
        "sma_50": round(day_avg_50, 2),
        "sma_200": round(day_avg_200, 2),
        "beta": round(beta, 2) if beta else None,
        "daily_volatility": daily_vol,
        "annual_volatility": annual_vol,
    }

    securities_info = {
        "symbol": symbol.upper(),
        "exchange": info.get("exchange", "N/A"),
        "currency": currency,
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "full_time_employees": info.get("fullTimeEmployees", None),
        "pe_ratio": info.get("trailingPE", None),
        "forward_pe": info.get("forwardPE", None),
        "website": info.get("website", None),
        "country": info.get("country", None),
    }

    insiders = info.get("heldPercentInsiders", 0) or 0
    institutions = info.get("heldPercentInstitutions", 0) or 0
    promoters_pct = round(insiders * 100, 2)
    institutions_pct = round(institutions * 100, 2)
    public_pct = round(max(0, 100 - promoters_pct - institutions_pct), 2)

    shareholding = {
        "promoters": promoters_pct,
        "institutions": institutions_pct,
        "public": public_pct,
    }

    actions_list = []
    try:
        dividends = ticker.dividends
        if dividends is not None and not dividends.empty:
            for date, amount in dividends.tail(10).items():
                actions_list.append({
                    "type": "Dividend",
                    "date": date.strftime("%d-%b-%Y"),
                    "details": f"{currency_symbol}{amount:.2f} per share"
                })

        splits = ticker.splits
        if splits is not None and not splits.empty:
            for date, ratio in splits.tail(5).items():
                actions_list.append({
                    "type": "Split/Bonus",
                    "date": date.strftime("%d-%b-%Y"),
                    "details": f"{int(ratio)}:1" if ratio > 1 else f"1:{int(1/ratio)}"
                })
        actions_list.sort(key=lambda x: x["date"], reverse=True)
    except:
        pass

    calendar_events = []
    try:
        cal = ticker.calendar
        if cal is not None:
            if isinstance(cal, dict):
                for key, val in cal.items():
                    if val is not None:
                        date_str = val.strftime("%d-%b-%Y") if hasattr(val, 'strftime') else str(val)
                        calendar_events.append({"event": key, "date": date_str})
            elif hasattr(cal, 'items'):
                for key, val in cal.items():
                    calendar_events.append({"event": key, "date": str(val)})
    except:
        pass

    return {
        "symbol": symbol.upper(),
        "benchmark_name": benchmark_name,
        "currency": currency,
        "currency_symbol": currency_symbol,
        "returns": returns_data,
        "trade_info": trade_info,
        "price_info": price_info,
        "securities_info": securities_info,
        "shareholding": shareholding,
        "corporate_actions": actions_list,
        "calendar": calendar_events,
    }


def _safe_int(series, key):
    try:
        val = series.get(key)
        if val is not None and not pd.isna(val):
            return int(val)
    except:
        pass
    return None



class MarketDataService:
    @staticmethod
    async def get_historical_data(symbol: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
        return await asyncio.to_thread(_fetch_history_sync, symbol, period, interval)

    @staticmethod
    def get_market_status(df: pd.DataFrame) -> dict:
        latest = df.iloc[-1]
        prev = df.iloc[-2] if len(df) > 1 else latest
        return {
            "current_price": round(float(latest['Close']), 2),
            "change": round(float(latest['Close'] - prev['Close']), 2),
            "change_pct": round(float((latest['Close'] - prev['Close']) / prev['Close'] * 100), 2)
        }

    @staticmethod
    async def get_realtime_quote(symbol: str) -> dict:
        return await asyncio.to_thread(_fetch_quote_sync, symbol)

    @staticmethod
    async def get_multi_quotes(symbols: list) -> list:
        return await asyncio.to_thread(_fetch_batch_quotes_sync, symbols)

    @staticmethod
    def search_symbols(query: str) -> list:
        query_upper = query.upper()
        results = []
        seen = set()
        for stock in NSE_STOCKS:
            sym = stock["symbol"].replace(".NS", "")
            if sym in seen:
                continue
            if sym.startswith(query_upper) or query_upper in stock["name"].upper():
                results.append({"symbol": stock["symbol"], "name": stock["name"]})
                seen.add(sym)
        return results[:20]

    @staticmethod
    def search_us_symbols(query: str) -> list:
        query_upper = query.upper()
        results = []
        seen = set()
        for stock in US_STOCKS:
            sym = stock["symbol"]
            if sym in seen:
                continue
            if sym.startswith(query_upper) or query_upper in stock["name"].upper():
                results.append({"symbol": stock["symbol"], "name": stock["name"]})
                seen.add(sym)
        return results[:20]

    @staticmethod
    async def get_company_info(symbol: str) -> dict:
        return await asyncio.to_thread(_fetch_company_sync, symbol)

    @staticmethod
    async def get_financials(symbol: str) -> dict:
        return await asyncio.to_thread(_fetch_financials_sync, symbol)

    @staticmethod
    async def get_stock_detail(symbol: str) -> dict:
        return await asyncio.to_thread(_fetch_stock_detail_sync, symbol)

    @staticmethod
    def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
        df['SMA_20'] = df['Close'].rolling(window=20).mean()
        df['SMA_50'] = df['Close'].rolling(window=50).mean()

        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))

        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()

        return df.dropna()


_NSE_SECTOR_MAP = {
    "RELIANCE": ("Oil & Gas", 10.5), "TCS": ("IT", 4.2), "HDFCBANK": ("Banking", 8.1),
    "INFY": ("IT", 5.8), "ICICIBANK": ("Banking", 5.5), "HINDUNILVR": ("FMCG", 2.3),
    "SBIN": ("Banking", 2.8), "BHARTIARTL": ("Telecom", 3.1), "ITC": ("FMCG", 3.9),
    "KOTAKBANK": ("Banking", 2.5), "LT": ("Infra", 3.2), "HCLTECH": ("IT", 2.9),
    "AXISBANK": ("Banking", 2.1), "ASIANPAINT": ("Consumer", 1.3), "MARUTI": ("Auto", 1.7),
    "SUNPHARMA": ("Pharma", 2.0), "TITAN": ("Consumer", 1.4), "BAJFINANCE": ("NBFC", 1.8),
    "WIPRO": ("IT", 1.5), "TATAMOTORS": ("Auto", 1.8), "NTPC": ("Power", 1.6),
    "POWERGRID": ("Power", 1.2), "ONGC": ("Oil & Gas", 1.1), "TATASTEEL": ("Metals", 1.3),
    "COALINDIA": ("Mining", 1.0), "DRREDDY": ("Pharma", 1.1), "ADANIENT": ("Conglomerate", 1.5),
    "JSWSTEEL": ("Metals", 0.9), "TECHM": ("IT", 1.2), "HEROMOTOCO": ("Auto", 0.8),
    "BAJAJFINSV": ("NBFC", 0.7), "ULTRACEMCO": ("Cement", 0.6), "NESTLEIND": ("FMCG", 0.6),
    "INDUSINDBK": ("Banking", 0.5), "CIPLA": ("Pharma", 0.5), "GRASIM": ("Cement", 0.5),
    "DIVISLAB": ("Pharma", 0.5), "APOLLOHOSP": ("Healthcare", 0.5), "ADANIPORTS": ("Infra", 0.5),
    "BRITANNIA": ("FMCG", 0.4), "EICHERMOT": ("Auto", 0.4), "HINDALCO": ("Metals", 0.4),
    "BPCL": ("Oil & Gas", 0.4), "TATACONSUM": ("FMCG", 0.4), "M&M": ("Auto", 0.4),
    "SBILIFE": ("Insurance", 0.3), "HDFCLIFE": ("Insurance", 0.3), "BAJAJ-AUTO": ("Auto", 0.3),
    "GODREJCP": ("FMCG", 0.2), "DABUR": ("FMCG", 0.2), "MARICO": ("FMCG", 0.2),
    "VEDL": ("Metals", 0.3), "NMDC": ("Mining", 0.2), "SAIL": ("Metals", 0.2),
    "GAIL": ("Oil & Gas", 0.2), "IOC": ("Oil & Gas", 0.2), "DLF": ("Realty", 0.2),
    "GODREJPROP": ("Realty", 0.2), "SIEMENS": ("Capital Goods", 0.2), "ABB": ("Capital Goods", 0.2),
    "HAVELLS": ("Consumer", 0.2), "VOLTAS": ("Consumer", 0.2), "PAGEIND": ("Textile", 0.1),
    "JUBLFOOD": ("Consumer", 0.1), "PERSISTENT": ("IT", 0.1), "COFORGE": ("IT", 0.1),
    "MPHASIS": ("IT", 0.1), "LTIM": ("IT", 0.2), "LTTS": ("IT", 0.1),
    "COLPAL": ("FMCG", 0.1), "PNB": ("Banking", 0.2), "BANKBARODA": ("Banking", 0.2),
    "CANBK": ("Banking", 0.1), "FEDERALBNK": ("Banking", 0.1), "IDFCFIRSTB": ("Banking", 0.1),
    "AUBANK": ("Banking", 0.1), "RBLBANK": ("Banking", 0.1), "BANDHANBNK": ("Banking", 0.1),
    "BIOCON": ("Pharma", 0.1), "LUPIN": ("Pharma", 0.1), "AUROPHARMA": ("Pharma", 0.1),
    "TORNTPHARM": ("Pharma", 0.1), "IPCALAB": ("Pharma", 0.1), "ALKEM": ("Pharma", 0.1),
    "LAURUSLABS": ("Pharma", 0.1), "ASHOKLEY": ("Auto", 0.1), "TVSMOTOR": ("Auto", 0.1),
    "BALKRISIND": ("Auto", 0.1), "MRF": ("Auto", 0.1), "OBEROIRLTY": ("Realty", 0.1),
    "PRESTIGE": ("Realty", 0.1), "BRIGADE": ("Realty", 0.1), "SOBHA": ("Realty", 0.1),
    "SUNTECK": ("Realty", 0.1), "TATAPOWER": ("Power", 0.2), "ADANIGREEN": ("Power", 0.2),
    "ADANIPOWER": ("Power", 0.1), "NHPC": ("Power", 0.1), "IREDA": ("Power", 0.1),
    "TORNTPOWER": ("Power", 0.1), "CESC": ("Power", 0.1), "RECLTD": ("NBFC", 0.1),
    "PFC": ("NBFC", 0.1), "JINDALSTEL": ("Metals", 0.1), "NATIONALUM": ("Metals", 0.1),
    "APLAPOLLO": ("Metals", 0.1), "RATNAMANI": ("Metals", 0.1), "ZEEL": ("Media", 0.1),
    "PVRINOX": ("Media", 0.1), "SUNTV": ("Media", 0.1), "NETWORK18": ("Media", 0.1),
    "NAZARA": ("Media", 0.1), "SAREGAMA": ("Media", 0.1), "ICICIGI": ("Insurance", 0.1),
    "ICICIPRULI": ("Insurance", 0.1), "CHOLAFIN": ("NBFC", 0.1), "MUTHOOTFIN": ("NBFC", 0.1),
    "MANAPPURAM": ("NBFC", 0.1), "SHRIRAMFIN": ("NBFC", 0.1), "LICHSGFIN": ("NBFC", 0.1),
    "PIIND": ("Chemicals", 0.1), "UPL": ("Chemicals", 0.1), "COROMANDEL": ("Chemicals", 0.1),
    "SRF": ("Chemicals", 0.1), "ATUL": ("Chemicals", 0.1), "DEEPAKNTR": ("Chemicals", 0.1),
    "CLEAN": ("Chemicals", 0.1), "PIDILITIND": ("Chemicals", 0.1), "BERGEPAINT": ("Consumer", 0.1),
    "KANSAINER": ("Consumer", 0.1), "ASTRAL": ("Capital Goods", 0.1), "SUPREMEIND": ("Capital Goods", 0.1),
    "POLYCAB": ("Capital Goods", 0.1), "KEI": ("Capital Goods", 0.1), "CROMPTON": ("Consumer", 0.1),
    "WHIRLPOOL": ("Consumer", 0.1), "BLUESTARCO": ("Consumer", 0.1), "DIXON": ("Consumer", 0.1),
    "VBL": ("FMCG", 0.1), "TRENT": ("Retail", 0.2), "DMART": ("Retail", 0.2),
    "NYKAA": ("Retail", 0.1), "ZOMATO": ("Internet", 0.2), "PAYTM": ("Internet", 0.1),
    "POLICYBZR": ("Internet", 0.1), "DELHIVERY": ("Logistics", 0.1), "NAUKRI": ("Internet", 0.1),
    "IRCTC": ("Travel", 0.1), "INDIGO": ("Aviation", 0.2), "HAL": ("Defence", 0.3),
    "BEL": ("Defence", 0.2), "BDL": ("Defence", 0.1), "COCHINSHIP": ("Defence", 0.1),
    "MAZDOCK": ("Defence", 0.1), "GRSE": ("Defence", 0.1), "SOLARINDS": ("Defence", 0.1),
    "DATAPATTNS": ("Defence", 0.1), "LALPATHLAB": ("Healthcare", 0.1), "MAXHEALTH": ("Healthcare", 0.1),
    "FORTIS": ("Healthcare", 0.1), "STARHEALTH": ("Insurance", 0.1), "SBICARD": ("NBFC", 0.1),
    "HDFCAMC": ("AMC", 0.1), "CAMS": ("AMC", 0.1), "BSE": ("Exchange", 0.1),
    "CDSL": ("Exchange", 0.1), "MCX": ("Exchange", 0.1), "ANGELONE": ("Broking", 0.1),
    "MOTILALOFS": ("Broking", 0.1), "IEX": ("Exchange", 0.1), "CUMMINSIND": ("Capital Goods", 0.1),
    "THERMAX": ("Capital Goods", 0.1), "GRINDWELL": ("Capital Goods", 0.1),
    "SCHAEFFLER": ("Capital Goods", 0.1), "TIMKEN": ("Capital Goods", 0.1),
    "SKFINDIA": ("Capital Goods", 0.1), "KALYANKJIL": ("Consumer", 0.1),
    "SONACOMS": ("Auto", 0.1), "MOTHERSON": ("Auto", 0.1), "EXIDEIND": ("Auto", 0.1),
    "AMARAJABAT": ("Auto", 0.1), "BOSCHLTD": ("Auto", 0.1), "AARTIIND": ("Chemicals", 0.1),
    "NAVINFLUOR": ("Chemicals", 0.1), "FLUOROCHEM": ("Chemicals", 0.1),
    "TATACHEM": ("Chemicals", 0.1), "GNFC": ("Chemicals", 0.1), "CHAMBAL": ("Chemicals", 0.1),
    "TATACOMM": ("Telecom", 0.1), "KPITTECH": ("IT", 0.1), "HAPPSTMNDS": ("IT", 0.1),
    "CYIENT": ("IT", 0.1), "ZENSAR": ("IT", 0.1), "BIRLASOFT": ("IT", 0.1),
    "MASTEK": ("IT", 0.1), "TATAELXSI": ("IT", 0.1), "AFFLE": ("IT", 0.1),
    "LATENTVIEW": ("IT", 0.1), "HONAUT": ("Capital Goods", 0.1), "EMAMILTD": ("FMCG", 0.1),
    "JYOTHYLAB": ("FMCG", 0.1), "HINDPETRO": ("Oil & Gas", 0.1), "PETRONET": ("Oil & Gas", 0.1),
    "MGL": ("Oil & Gas", 0.1), "IGL": ("Oil & Gas", 0.1), "GUJGASLTD": ("Oil & Gas", 0.1),
    "ATGL": ("Oil & Gas", 0.1), "CONCOR": ("Logistics", 0.1), "IRFC": ("NBFC", 0.1),
    "RVNL": ("Infra", 0.1), "NBCC": ("Infra", 0.1), "NCC": ("Infra", 0.1),
    "HINDCOPPER": ("Metals", 0.1), "MOIL": ("Mining", 0.1), "HINDZINC": ("Metals", 0.1),
    "IDEA": ("Telecom", 0.1), "INDUSTOWER": ("Telecom", 0.1), "HFCL": ("Telecom", 0.1),
    "TATATECH": ("IT", 0.1), "JIOFIN": ("NBFC", 0.2), "SUZLON": ("Power", 0.1),
    "SJVN": ("Power", 0.1), "UNIONBANK": ("Banking", 0.1), "IOB": ("Banking", 0.1),
    "INDIANB": ("Banking", 0.1), "CENTRALBK": ("Banking", 0.1), "MAHABANK": ("Banking", 0.1),
    "UCOBANK": ("Banking", 0.1), "YESBANK": ("Banking", 0.1), "IDBI": ("Banking", 0.1),
    "ABCAPITAL": ("NBFC", 0.1), "SUNDARMFIN": ("NBFC", 0.1), "CANFINHOME": ("NBFC", 0.1),
    "POONAWALLA": ("NBFC", 0.1), "HUDCO": ("NBFC", 0.1), "CGPOWER": ("Capital Goods", 0.1),
    "BHEL": ("Capital Goods", 0.2), "ELGIEQUIP": ("Capital Goods", 0.1),
    "AIAENG": ("Capital Goods", 0.1), "AMBER": ("Capital Goods", 0.1),
    "JBCHEPHARM": ("Pharma", 0.1), "GLENMARK": ("Pharma", 0.1), "NATCOPHAR": ("Pharma", 0.1),
    "AJANTPHARM": ("Pharma", 0.1), "SYNGENE": ("Pharma", 0.1), "INDIAMART": ("Internet", 0.1),
    "JUSTDIAL": ("Internet", 0.1), "INTELLECT": ("IT", 0.1), "OFSS": ("IT", 0.1),
    "CRISIL": ("Finance", 0.1), "UBL": ("FMCG", 0.1), "ABFRL": ("Retail", 0.1),
    "BATA": ("Consumer", 0.1), "RELAXO": ("Consumer", 0.1), "ESCORTS": ("Auto", 0.1),
    "IH": ("Hospitality", 0.1), "LODHA": ("Realty", 0.1), "PHOENIXLTD": ("Realty", 0.1),
    "ACC": ("Cement", 0.1), "AMBUJACEM": ("Cement", 0.1), "SHREECEM": ("Cement", 0.1),
    "DALBHARAT": ("Cement", 0.1), "JKCEMENT": ("Cement", 0.1), "RAMCOCEM": ("Cement", 0.1),
    "JSPL": ("Metals", 0.1), "JSWENERGY": ("Power", 0.1), "KAJARIACER": ("Consumer", 0.1),
    "VGUARD": ("Consumer", 0.1), "CEATLTD": ("Auto", 0.1), "APOLLOTYRE": ("Auto", 0.1),
    "ABBOTINDIA": ("Pharma", 0.1), "GLAND": ("Pharma", 0.1), "GRANULES": ("Pharma", 0.1),
    "CASTROLIND": ("Oil & Gas", 0.1), "OLECTRA": ("Auto", 0.1), "TRIDENT": ("Textile", 0.1),
    "RAYMOND": ("Textile", 0.1),
}

_US_SECTOR_MAP = {
    "AAPL": ("Technology", 7.1), "MSFT": ("Technology", 6.8), "NVDA": ("Technology", 6.2),
    "AMZN": ("Consumer", 3.8), "GOOGL": ("Technology", 3.5), "META": ("Technology", 2.5),
    "TSLA": ("Auto", 1.9), "BRK-B": ("Financial", 1.7), "JPM": ("Financial", 1.3),
    "V": ("Financial", 1.2), "UNH": ("Healthcare", 1.3), "JNJ": ("Healthcare", 1.1),
    "XOM": ("Energy", 1.2), "WMT": ("Consumer", 0.7), "MA": ("Financial", 1.0),
    "PG": ("Consumer", 0.9), "HD": ("Consumer", 0.9), "CVX": ("Energy", 0.7),
    "LLY": ("Healthcare", 1.4), "ABBV": ("Healthcare", 0.8), "MRK": ("Healthcare", 0.6),
    "KO": ("Consumer", 0.6), "PEP": ("Consumer", 0.5), "AVGO": ("Technology", 1.5),
    "COST": ("Consumer", 0.8), "BAC": ("Financial", 0.7), "TMO": ("Healthcare", 0.5),
    "MCD": ("Consumer", 0.5), "CSCO": ("Technology", 0.5), "ABT": ("Healthcare", 0.4),
    "CRM": ("Technology", 0.7), "ACN": ("Technology", 0.5), "ORCL": ("Technology", 0.5),
    "DHR": ("Healthcare", 0.4), "NFLX": ("Media", 0.7), "AMD": ("Technology", 0.8),
    "TXN": ("Technology", 0.4), "ADBE": ("Technology", 0.5), "CMCSA": ("Media", 0.3),
    "NKE": ("Consumer", 0.3), "WFC": ("Financial", 0.5), "PM": ("Consumer", 0.3),
    "NEE": ("Energy", 0.3), "INTC": ("Technology", 0.4), "DIS": ("Media", 0.5),
    "UPS": ("Industrial", 0.3), "QCOM": ("Technology", 0.4), "RTX": ("Defence", 0.4),
    "BA": ("Industrial", 0.4), "IBM": ("Technology", 0.3), "GE": ("Industrial", 0.4),
    "CAT": ("Industrial", 0.4), "INTU": ("Technology", 0.4), "AMAT": ("Technology", 0.4),
    "GS": ("Financial", 0.4), "MS": ("Financial", 0.3), "AXP": ("Financial", 0.3),
    "NOW": ("Technology", 0.4), "BKNG": ("Consumer", 0.3), "ISRG": ("Healthcare", 0.3),
    "LMT": ("Defence", 0.3), "MDLZ": ("Consumer", 0.3), "SYK": ("Healthcare", 0.3),
    "GILD": ("Healthcare", 0.3), "BLK": ("Financial", 0.3), "ADI": ("Technology", 0.3),
    "VRTX": ("Healthcare", 0.3), "MMC": ("Financial", 0.2), "LRCX": ("Technology", 0.3),
    "PANW": ("Technology", 0.3), "REGN": ("Healthcare", 0.3), "SNPS": ("Technology", 0.2),
    "CDNS": ("Technology", 0.2), "KLAC": ("Technology", 0.2), "SLB": ("Energy", 0.2),
    "EOG": ("Energy", 0.2), "COP": ("Energy", 0.3), "MMM": ("Industrial", 0.2),
    "PFE": ("Healthcare", 0.4), "T": ("Telecom", 0.3), "VZ": ("Telecom", 0.3),
    "UBER": ("Technology", 0.3), "ABNB": ("Consumer", 0.2), "PYPL": ("Financial", 0.2),
    "SQ": ("Financial", 0.2), "SHOP": ("Technology", 0.2), "COIN": ("Financial", 0.2),
    "PLTR": ("Technology", 0.3), "RIVN": ("Auto", 0.1), "LCID": ("Auto", 0.1),
    "SNOW": ("Technology", 0.2), "DDOG": ("Technology", 0.2), "CRWD": ("Technology", 0.3),
    "ZS": ("Technology", 0.2), "NET": ("Technology", 0.2), "SOFI": ("Financial", 0.1),
    "HOOD": ("Financial", 0.1), "MARA": ("Financial", 0.1), "SMCI": ("Technology", 0.2),
    "ARM": ("Technology", 0.3),
}


def _build_heatmap_stocks(stock_list, sector_map, suffix=""):
    """Build heatmap stocks from the full stock list using sector map."""
    result = []
    seen = set()
    for stock in stock_list:
        sym = stock["symbol"]
        base = sym.replace(".NS", "").replace(".BO", "")
        if base in seen:
            continue
        seen.add(base)
        sector, weight = sector_map.get(base, ("Other", 0.1))
        result.append({
            "symbol": sym,
            "name": stock["name"],
            "sector": sector,
            "weight": weight,
        })
    return result


NIFTY_HEATMAP_STOCKS = _build_heatmap_stocks(NSE_STOCKS, _NSE_SECTOR_MAP)
US_HEATMAP_STOCKS = _build_heatmap_stocks(US_STOCKS, _US_SECTOR_MAP)