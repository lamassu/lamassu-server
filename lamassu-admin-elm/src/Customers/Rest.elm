module Customers.Rest exposing (..)

import RemoteData exposing (..)
import Http
import HttpBuilder exposing (..)
import Common.Customer.Decoder exposing (customersDecoder)
import Customers.Types exposing (..)


getCustomers : Cmd Msg
getCustomers =
    get ("/api/customers")
        |> withExpect (Http.expectJson customersDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map Load
