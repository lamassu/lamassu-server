module Main exposing (..)

import Html exposing (Html, Attribute, a, div, hr, input, span, text, map)
import Html.Attributes exposing (class)
import Navigation
import Pair
import Account
import Config
import Transactions
import Customers.Types
import Customers.State
import Customers.View
import Logs.Types
import Logs.State
import Logs.View
import SupportLogs.Types
import SupportLogs.State
import SupportLogs.View
import Customer.Types
import Customer.State
import Customer.View
import MaintenanceFunding.Types
import NavBar exposing (..)
import UrlParser exposing ((</>), s, string, top, parseHash)
import Http
import HttpBuilder exposing (..)
import RemoteData
import Navigation exposing (newUrl, Location)
import CoreTypes exposing (Msg(..), Route(..), Category(..))
import AccountsDecoder exposing (accountsDecoder)
import StatusTypes exposing (..)
import StatusDecoder exposing (..)
import Time exposing (..)
import Css.Admin
import Css.Classes as C
import Markdown
import MaintenanceMachines.Types
import MaintenanceMachines.State
import MaintenanceMachines.View
import MaintenanceFunding.Types
import MaintenanceFunding.State
import MaintenanceFunding.View
import Transaction.Types
import Transaction.State
import Transaction.View


main : Program Never Model Msg
main =
    Navigation.program UrlChange
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }



-- URL PARSERS


parseRoute : UrlParser.Parser (Route -> a) a
parseRoute =
    UrlParser.oneOf
        [ UrlParser.map AccountRoute (s "account" </> string)
        , UrlParser.map PairRoute (s "pair")
        , UrlParser.map (\config crypto -> ConfigRoute config (Just crypto)) (s "config" </> string </> string)
        , UrlParser.map (\config -> ConfigRoute config Nothing) (s "config" </> string)
        , UrlParser.map MaintenanceMachinesRoute (s "machines")
        , UrlParser.map (\crypto -> MaintenanceFundingRoute (Just crypto)) (s "funding" </> string)
        , UrlParser.map (MaintenanceFundingRoute Nothing) (s "funding")
        , UrlParser.map TransactionsRoute (s "transactions")
        , UrlParser.map TransactionRoute (s "transaction" </> string)
        , UrlParser.map CustomersRoute (s "customers")
        , UrlParser.map CustomerRoute (s "customer" </> string)
        , UrlParser.map (\id -> LogsRoute (Just id)) (s "logs" </> string)
        , UrlParser.map (LogsRoute Nothing) (s "logs")
        , UrlParser.map (\id -> SupportLogsRoute (Just id)) (s "support_logs" </> string)
        , UrlParser.map (SupportLogsRoute Nothing) (s "support_logs")
        , UrlParser.map (ConfigRoute "setup" Nothing) top
        ]


getAccounts : Cmd Msg
getAccounts =
    get ("/api/accounts")
        |> withExpect (Http.expectJson accountsDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map (RemoteData.withDefault [])
        |> Cmd.map LoadAccounts


getStatus : Cmd Msg
getStatus =
    get ("/api/status/")
        |> withExpect (Http.expectJson statusDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map LoadStatus



-- MODEL


type alias Model =
    { location : Location
    , pair : Pair.Model
    , account : Account.Model
    , config : Config.Model
    , maintenanceMachines : MaintenanceMachines.Types.Model
    , maintenanceFunding : MaintenanceFunding.Types.Model
    , transactions : Transactions.Model
    , transaction : Transaction.Types.Model
    , customers : Customers.Types.Model
    , customer : Customer.Types.Model
    , logs : Logs.Types.Model
    , supportLogs : SupportLogs.Types.Model
    , accounts : List ( String, String )
    , status : Maybe StatusRec
    , err : Maybe String
    }


init : Location -> ( Model, Cmd Msg )
init location =
    let
        model =
            { location = location
            , account = Account.init
            , pair = Pair.init False
            , config = Config.init
            , maintenanceMachines = MaintenanceMachines.State.init
            , maintenanceFunding = MaintenanceFunding.State.init
            , transactions = Transactions.init
            , transaction = Transaction.State.init
            , customers = Customers.State.init
            , customer = Customer.State.init
            , logs = Logs.State.init
            , supportLogs = SupportLogs.State.init
            , accounts = []
            , status = Nothing
            , err = Nothing
            }

        ( newModel, newCmd ) =
            urlUpdate location model
    in
        newModel ! [ newCmd, getAccounts, getStatus ]



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        PairMsg pairMsg ->
            let
                ( pairModel, cmd ) =
                    Pair.update pairMsg model.pair
            in
                { model | pair = pairModel } ! [ Cmd.map PairMsg cmd ]

        AccountMsg accountMsg ->
            let
                ( accountModel, cmd ) =
                    Account.update accountMsg model.account
            in
                { model | account = accountModel } ! [ Cmd.map AccountMsg cmd ]

        ConfigMsg configMsg ->
            let
                ( configModel, cmd ) =
                    Config.update configMsg model.config

                loaded =
                    Config.loaded configMsg

                extraCmds =
                    if loaded then
                        [ getAccounts, getStatus ]
                    else
                        []
            in
                { model | config = configModel } ! ([ Cmd.map ConfigMsg cmd ] ++ extraCmds)

        MaintenanceMachinesMsg maintenanceMachinesMsg ->
            let
                ( maintenanceMachines, cmd ) =
                    MaintenanceMachines.State.update maintenanceMachinesMsg model.maintenanceMachines
            in
                { model | maintenanceMachines = maintenanceMachines } ! [ Cmd.map MaintenanceMachinesMsg cmd ]

        MaintenanceFundingMsg maintenanceFundingMsg ->
            let
                ( maintenanceFunding, cmd ) =
                    MaintenanceFunding.State.update maintenanceFundingMsg model.maintenanceFunding
            in
                { model | maintenanceFunding = maintenanceFunding } ! [ Cmd.map MaintenanceFundingMsg cmd ]

        TransactionsMsg transactionsMsg ->
            let
                ( transactionsModel, cmd ) =
                    Transactions.update transactionsMsg model.transactions
            in
                { model | transactions = transactionsModel } ! [ Cmd.map TransactionsMsg cmd ]

        TransactionMsg transactionMsg ->
            let
                ( transaction, cmd ) =
                    Transaction.State.update transactionMsg model.transaction
            in
                { model | transaction = transaction } ! [ Cmd.map TransactionMsg cmd ]

        CustomersMsg customersMsg ->
            let
                ( customersModel, cmd ) =
                    Customers.State.update customersMsg model.customers
            in
                { model | customers = customersModel } ! [ Cmd.map CustomersMsg cmd ]

        CustomerMsg customerMsg ->
            let
                ( customerModel, cmd ) =
                    Customer.State.update customerMsg model.customer
            in
                { model | customer = customerModel } ! [ Cmd.map CustomerMsg cmd ]

        LogsMsg logsMsg ->
            let
                ( logsModel, cmd ) =
                    Logs.State.update logsMsg model.logs
            in
                { model | logs = logsModel } ! [ Cmd.map LogsMsg cmd ]

        SupportLogsMsg supportLogsMsg ->
            let
                ( supportLogsModel, cmd ) =
                    SupportLogs.State.update supportLogsMsg model.supportLogs
            in
                { model | supportLogs = supportLogsModel } ! [ Cmd.map SupportLogsMsg cmd ]

        LoadAccounts accounts ->
            { model | accounts = accounts } ! []

        LoadStatus webStatus ->
            let
                newStatus =
                    List.filterMap identity [ RemoteData.toMaybe webStatus, model.status ]
                        |> List.head

                serverStatus =
                    Maybe.withDefault False <| Maybe.map (\status -> status.server.up) newStatus

                newPair =
                    Pair.updateStatus serverStatus model.pair

                rates =
                    Maybe.withDefault [] <| Maybe.map (\status -> status.server.rates) newStatus

                newConfig =
                    Config.updateRates rates model.config
            in
                { model | status = newStatus, pair = newPair, config = newConfig } ! []

        NewUrl url ->
            let
                ( configModel, configCmd ) =
                    Config.submitNoLoad model.config
            in
                { model | config = configModel } ! [ Navigation.newUrl url, Cmd.map ConfigMsg configCmd ]

        UrlChange location ->
            urlUpdate location model

        Interval ->
            let
                route =
                    Maybe.withDefault NotFoundRoute (parseHash parseRoute model.location)

                extraCmds =
                    if route == TransactionsRoute then
                        [ Cmd.map TransactionsMsg Transactions.loadCmd ]
                    else
                        []
            in
                model ! ([ getStatus ] ++ extraCmds)

        WebSocketMsg msg ->
            model ! []


content : Model -> Route -> Html Msg
content model route =
    case route of
        PairRoute ->
            map PairMsg (Pair.view model.pair)

        AccountRoute _ ->
            map AccountMsg (Account.view model.account)

        ConfigRoute _ _ ->
            map ConfigMsg (Config.view model.config)

        MaintenanceMachinesRoute ->
            map MaintenanceMachinesMsg (MaintenanceMachines.View.view model.maintenanceMachines)

        MaintenanceFundingRoute _ ->
            map MaintenanceFundingMsg (MaintenanceFunding.View.view model.maintenanceFunding)

        TransactionsRoute ->
            map TransactionsMsg (Transactions.view model.transactions)

        TransactionRoute _ ->
            map TransactionMsg (Transaction.View.view model.transaction)

        CustomersRoute ->
            map CustomersMsg (Customers.View.view model.customers)

        CustomerRoute _ ->
            map CustomerMsg (Customer.View.view model.customer)

        LogsRoute _ ->
            map LogsMsg (Logs.View.view model.logs)

        SupportLogsRoute _ ->
            map SupportLogsMsg (SupportLogs.View.view model.supportLogs)

        NotFoundRoute ->
            div [] [ text ("No such route") ]


statusBar : Maybe StatusRec -> Html Msg
statusBar maybeStatus =
    case maybeStatus of
        Nothing ->
            div [ Css.Admin.class [ C.StatusBar ] ] [ text "Loading ..." ]

        Just status ->
            let
                serverStatus =
                    if not status.server.wasConfigured then
                        [ Markdown.toHtml [] "**lamassu-server** not configured yet" ]
                    else if status.server.up then
                        [ Markdown.toHtml [] ("**lamassu-server** is up **/** " ++ status.server.machineStatus) ]
                    else
                        case status.server.lastPing of
                            Nothing ->
                                [ Markdown.toHtml [] "**lamassu-server** not up yet" ]

                            Just lastPing ->
                                [ Markdown.toHtml [] ("**lamassu-server** has been down for " ++ lastPing) ]
            in
                div [ Css.Admin.class [ C.StatusBar ] ] serverStatus


view : Model -> Html Msg
view model =
    let
        route =
            Maybe.withDefault NotFoundRoute (parseHash parseRoute model.location)

        invalidConfigGroups =
            Maybe.map .invalidConfigGroups model.status
                |> Maybe.withDefault []
    in
        div [ class "lamassuAdminLayout" ]
            [ div
                [ class "lamassuAdminMain" ]
                [ NavBar.view route invalidConfigGroups
                , div [ class "lamassuAdminContent" ]
                    [ content model route ]
                ]
            , statusBar model.status
            ]


urlUpdate : Location -> Model -> ( Model, Cmd Msg )
urlUpdate location model =
    let
        route =
            Maybe.withDefault NotFoundRoute (parseHash parseRoute location)
    in
        case route of
            PairRoute ->
                case model.status of
                    Just status ->
                        { model | location = location, pair = Pair.init status.server.up } ! []

                    Nothing ->
                        { model | location = location, pair = Pair.init False } ! []

            AccountRoute account ->
                let
                    ( accountModel, cmd ) =
                        Account.load account
                in
                    { model | location = location, account = accountModel } ! [ Cmd.map AccountMsg cmd ]

            ConfigRoute config maybeCryptoCodeString ->
                let
                    ( configModel, cmd ) =
                        Config.load model.config config maybeCryptoCodeString
                in
                    { model | location = location, config = configModel } ! [ Cmd.map ConfigMsg cmd ]

            MaintenanceMachinesRoute ->
                let
                    ( maintenanceMachines, cmd ) =
                        MaintenanceMachines.State.load
                in
                    { model | location = location, maintenanceMachines = maintenanceMachines }
                        ! [ Cmd.map MaintenanceMachinesMsg cmd ]

            MaintenanceFundingRoute maybeCrypto ->
                let
                    ( maintenanceFunding, cmd ) =
                        MaintenanceFunding.State.load maybeCrypto
                in
                    { model | location = location, maintenanceFunding = maintenanceFunding }
                        ! [ Cmd.map MaintenanceFundingMsg cmd ]

            TransactionsRoute ->
                let
                    ( transactionsModel, cmd ) =
                        Transactions.load
                in
                    { model | location = location, transactions = transactionsModel } ! [ Cmd.map TransactionsMsg cmd ]

            CustomersRoute ->
                let
                    ( customersModel, cmd ) =
                        Customers.State.load
                in
                    { model | location = location, customers = customersModel } ! [ Cmd.map CustomersMsg cmd ]

            CustomerRoute id ->
                let
                    ( customerModel, cmd ) =
                        Customer.State.load id
                in
                    { model | location = location, customer = customerModel } ! [ Cmd.map CustomerMsg cmd ]

            LogsRoute maybeId ->
                let
                    ( logsModel, cmd ) =
                        Logs.State.load maybeId
                in
                    { model | location = location, logs = logsModel } ! [ Cmd.map LogsMsg cmd ]

            SupportLogsRoute maybeId ->
                let
                    ( supportLogsModel, cmd ) =
                        SupportLogs.State.load maybeId
                in
                    { model | location = location, supportLogs = supportLogsModel } ! [ Cmd.map SupportLogsMsg cmd ]

            TransactionRoute txId ->
                let
                    ( transaction, cmd ) =
                        Transaction.State.load txId
                in
                    { model | location = location, transaction = transaction }
                        ! [ Cmd.map TransactionMsg cmd ]

            NotFoundRoute ->
                { model | location = location } ! []



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ every (5 * second) (\_ -> Interval)
        ]
