Main menu:
- do not change fonts on hover in the main menu
- make the clickable button bigger, not just text

Overall:
- caching the page
- validation is bad rn, negatives being allowed
- right aligned numbers on all tables
- locale based mil separators 1.000 1,000

Cashboxes: 
- right aligned number

Locale:
- Only allow one override per machine

Notifications:
- one of the crypto balance alerts has to be optional because of migration

UI:
- tooltip like components should close on esc
- saving should be a one time thing. disable buttons so user doesnt spam it
- transitions
- error handling
- select components
- talk with nunu + neal: Hover css for edit buttons + first first cancel later
- disable edit on non-everrides => overrides
- splash screens and home
- maybe a indication that there's more to search on dropdown
- required signifier on form fields - (required) or *
- USD should show as a suffix (validate all screens)
- stop line breaking on multi select
- input width should be enough to hold values without cutting text
- font sizes could be better
- min height in virtualized table (rows get hidden if not enough height in browser)

Machine status:
- font-size of the 'write to confirm'

Migrate:
- Need to write config migration. 
- Rewrite config validate
- remove apply defaults

Cash out:
- ask nuno about zero conf limit

Server:
- Takes too long to load. Investigate

Review slow internet loading:
- Table should be loaded (we want to load the table with no data)

3rd party services:
- remove strike
- ask neal anyone uses itbit

Wallet:
- ask neal and nuno how to handle unconfigured third party services on the table edit

Operator Info:
- That should be paginated with routes!

CoinATMRadar:
- relay facephoto info
- we should show the highest amount that requires a requirement

Customers:
- add status
- cash-in cash-out are reversed

Sms/email:
- There's no place to pick a third party provider anymore. (sms.js, email.js) neal + nuno

Machine name:
- update the db with whatever name is on the old config
- where to change name of the mahcines NUNO + NEAL

Compliance:
- Reject Address Reuse missing (MAKE BLACKLIST SCREEN AND PUT IT THERE)
- Currently admin only handles { type: 'amount', direction: 'both' }
- Sanctions should have more care in customers.js, currently just looking if is active as if old config


Ideas
  - Transactions could have a link to the customer
  - Transactions table on customer should have a link to "transactions"
