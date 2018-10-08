module Customer.Rest exposing (..)

import RemoteData exposing (..)
import Http
import HttpBuilder exposing (..)
import Common.Customer.Decoder exposing (customerDecoder)
import Common.Customer.Types exposing (..)
import Customer.Types exposing (..)


patchCustomer : String -> String -> Authorized -> Cmd Msg
patchCustomer id field value =
    patch ("/api/customer/" ++ id ++ "?" ++ field ++ "=" ++ authorizedToString value)
        |> withExpect (Http.expectJson customerDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map Load


getCustomer : String -> Cmd Msg
getCustomer id =
    get ("/api/customer/" ++ id)
        |> withExpect (Http.expectJson customerDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map Load
