Main menu:
- do not change fonts on hover in the main menu
- make the clickable button bigger, not just text

Overall:
- caching the page
- coin dropdown should show all coins
- validation is bad rn, negatives being allowed
- input number should only allow numbers
- right aligned numbers on all tables
- locale based mil separators 1.000 1,000

Cashboxes: 
- right aligned number (SAME EVERYWHERE)

UI:
- replace all the tooltips with new component
- tooltip like components should close on esc
- saving should be a one time thing. disable buttons so user doesnt spam it
- transitions
- error handling
- should all (machines/coins/...) be a option on some overrides?
- select components
- talk with nunu + neal: Hover css for edit buttons + first first cancel later
- filter countries by code as well, US should go to United States
- filter prioritize the start of words(not alphabetically)
- dropdown should have everythihg selected on the top
- disable edit on non-everrides => overrides
- remove the broswer default tooltip


Machine status:
- legend colors are different from the spec
- action Error/Success indication 
- load machine model from l-m
- align popup title with content
- talk with neal to see if the actions should be consistent
- font-size of the 'write to confirm'
- reboot icon cut off
- ask neal for the support articles
- stop line breaking on multi select

Commissions:
- overrides can be tighter. Hide coins already used by the same machine on another line.
- no negative values
- autoselect not getting errored when tabbed out

Operator Info:
- That should be paginated with routes!

Terms and Conditions:
- default values are not working properly

Contact information:
- When the fields are empty, should there be a warning somewhere? Or maybe we could create an exception that if the fields are empty they shouldn't show up
- l-m uses name, email, phone. The rest is just used for the receipt printing for now

CoinATMRadar:
- We now have photo, should we relay that info?

Sms/email:
- There's no place to pick a third party provider anymore. (sms.js, email.js)

Notifications:
- cash out 500 notes max top 500 max bottom
- crypto balance alerts input width (CHECK FOR ALL)

Locale:
- limit languages
- search crypto per name as well
- show full name on the dropdown

Machine name:
- Previously we were grabbing that from the config, but since new admin still cant change the name i`m now grabbing it from the db. Possible issues if users change the machine name from the initial one. Investivate alternatives.

Migrate:
- Need to write config migration. 
- Rewrite config validate
- remove apply defaults

Compliance:
- Reject Address Reuse missing
- Currently admin only handles { type: 'volume', direction: 'both' }
- Sanctions should have more care in customers.js, currently just looking if is active as if old config

Customers:
- Should add id and make it main part of the table? Name is not common at all

Logs:
- the new functionality that saves server logs to a db breaks initial install chicken-egg with db-logger

Downloading (logs and tx):
- They are always downloading from the local data, should be from server

Cash out:
- On off should have a fixed sized so things dont move a lot
- separate text from the first screen
- auto focus on fields after clicking next
- improve spacing around paragraphs
- button is on a wrong place on steps 2 and 3
- make it a dropdown based on the machine denomimnations settings
- ask nuno about zero conf limit
- USD should show as a suffix (validate all screens)
- Splash image for wizard

Server:
- Takes too long to load. Investigate

Review slow internet loading:
- Table should be loaded