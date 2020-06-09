UI:
- Large input fields wiggle on editable table edit/non-edit mode change.
- all (machines/coins/...) should be a option on some overrides

Compliance: 
- Reject Address Reuse missing

CoinATMRadar:
- We now have photo, should we relay that info?

Locale:
- should we show the user wallet needs to be configured after adding in a new coin?
- check if coin is active before considering it active on other screens

Commission:
- overrides can be tighter. Hide coins already used by the same machine on another line.

Sms/email:
- There's no place to pick a third party provider anymore.

Cashout:
- I've just added a zero conf limit column. Should it be like this?

Notifications:
- cashInAlertThreshold missing, used to warn to full cashbox

Machine name:
- Previously we were grabbing that from the config, but since new admin still cant change the name i`m now grabbing it from the db. Possible issues if users change the machine name from the initial one. Investivate alternatives.

Migrate:
- Need to write config migration. 
- Rewrite config validate
- remove apply defaults

Compliance:
- Currently admin only handles { type: 'volume', direction: 'both' }
- Sanctions should have more care in customers.js, currently just looking if is active as if old config

Other stuff:
- sms.js
- email.js