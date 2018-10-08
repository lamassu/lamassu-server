module Customers.Types exposing (..)

import RemoteData exposing (..)
import Common.Customer.Types exposing (..)


type alias Model =
    RemoteData.WebData Customers


type Msg
    = Load Model
