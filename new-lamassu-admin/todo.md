Overall:
  - caching the page
  - transitions
  - error handling
  - validation is bad rn, negatives being allowed
  - locale based mil separators 1.000 1,000
  - Table should be loaded on slow internet (we want to load the table with no data) 
  - tooltip like components should close on esc
  - saving should be a one time thing. disable buttons so user doesnt spam it
  - disable edit on non-everrides => overrides
  - splash screens and home
  - maybe a indication that there's more to search on dropdown
  - required signifier on form fields - (required) or *
  - stop line breaking on multi select
  - input width should be enough to hold values without cutting text

Locale:
  - Only allow one override per machine

Notifications:
  - one of the crypto balance alerts has to be optional because of migration

Server:
  - Takes too long to load. Investigate

Operator Info:
  - That should be paginated with routes!

CoinATMRadar:
  - relay facephoto info
  - we should show the highest amount that per requirement

Customers:
  - add status

Machine name:
  - update the db with whatever name is on the old config (check 1509439657189-add_machine_name_to_devices)

Compliance:
  - Currently admin only handles { type: 'amount', direction: 'both' }
  - Sanctions should have more care in customers.js, currently just looking if is active as if old config

Ideas
  - Transactions could have a link to the customer
  - Transactions table on customer should have a link to "transactions"


Feedback needed
  - font sizes could be better (I've bumped all font sizes by 1px, looks pretty good as fonts do a good vertical bump in size. Maybe some of the fonts don't like even values)