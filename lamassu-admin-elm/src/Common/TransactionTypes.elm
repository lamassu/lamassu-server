module Common.TransactionTypes exposing (..)

import Date exposing (Date)

type CryptoCode
    = BTC
    | BCH
    | ETH
    | ZEC
    | DASH
    | LTC


type alias CashInTxRec =
    { id : String
    , machineName : String
    , toAddress : String
    , cryptoAtoms : Int
    , cryptoCode : CryptoCode
    , fiat : Float
    , fiatCode : String
    , txHash : Maybe String
    , phone : Maybe String
    , error : Maybe String
    , operatorCompleted : Bool
    , send : Bool
    , sendConfirmed : Bool
    , expired : Bool
    , created : Date
    }


type alias CashOutTxRec =
    { id : String
    , machineName : String
    , toAddress : String
    , cryptoAtoms : Int
    , cryptoCode : CryptoCode
    , fiat : Float
    , fiatCode : String
    , status : String
    , dispense : Bool
    , notified : Bool
    , redeemed : Bool
    , phone : Maybe String
    , error : Maybe String
    , created : Date
    , confirmed : Bool
    }


type Tx
    = CashInTx CashInTxRec
    | CashOutTx CashOutTxRec
