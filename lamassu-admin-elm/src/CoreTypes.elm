module CoreTypes
    exposing
        ( Msg(..)
        , Category(..)
        , Route(..)
        )

import Navigation
import Pair
import Account
import Config
import MaintenanceMachines.Types
import MaintenanceFunding.Types
import Transaction.Types
import Transactions
import Customers.Types
import Customer.Types
import Logs.Types
import SupportLogs.Types
import StatusTypes


type Category
    = AccountCat
    | MachineSettingsCat
    | GlobalSettingsCat
    | MaintenanceCat


type Route
    = AccountRoute String
    | PairRoute
    | ConfigRoute String (Maybe String)
    | TransactionsRoute
    | TransactionRoute String
    | CustomersRoute
    | CustomerRoute String
    | LogsRoute (Maybe String)
    | SupportLogsRoute (Maybe String)
    | MaintenanceMachinesRoute
    | MaintenanceFundingRoute (Maybe String)
    | NotFoundRoute


type Msg
    = AccountMsg Account.Msg
    | PairMsg Pair.Msg
    | ConfigMsg Config.Msg
    | MaintenanceMachinesMsg MaintenanceMachines.Types.Msg
    | MaintenanceFundingMsg MaintenanceFunding.Types.Msg
    | TransactionsMsg Transactions.Msg
    | TransactionMsg Transaction.Types.Msg
    | CustomersMsg Customers.Types.Msg
    | CustomerMsg Customer.Types.Msg
    | LogsMsg Logs.Types.Msg
    | SupportLogsMsg SupportLogs.Types.Msg
    | LoadAccounts (List ( String, String ))
    | LoadStatus StatusTypes.WebStatus
    | NewUrl String
    | UrlChange Navigation.Location
    | Interval
    | WebSocketMsg String
