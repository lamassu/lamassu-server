module MaintenanceFunding.Types exposing (..)

import RemoteData exposing (..)


type alias CryptoDisplay =
    { cryptoCode : String
    , display : String
    }


type alias SubModel =
    { cryptoCode : String
    , cryptoDisplays : List CryptoDisplay
    , fundingAddress : String
    , fundingAddressUrl : String
    , confirmedBalance : String
    , pending : String
    , fiatConfirmedBalance : String
    , fiatPending : String
    , fiatCode : String
    }


type alias Model =
    RemoteData.WebData SubModel


type Msg
    = Load Model
    | CryptoSwitch String
