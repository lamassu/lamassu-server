module Transaction.Types exposing (..)

import RemoteData exposing (..)
import BasicTypes exposing (..)
import Common.TransactionTypes exposing (..)


type alias SubModel =
    { status : SavingStatus
    , tx : Tx
    }


type alias Model =
    RemoteData.WebData SubModel


type Msg
    = Load Model
    | Cancel String
    | HideSaveIndication
