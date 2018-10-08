module Customer.Types exposing (..)

import RemoteData exposing (..)
import Common.Customer.Types exposing (..)


type alias Model =
    RemoteData.WebData Customer


type Msg
    = Load Model
    | PatchCustomer String String Authorized
